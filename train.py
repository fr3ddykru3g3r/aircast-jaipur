"""Reproduce AirCast's Jaipur experiment. Run: python train.py

Raw API responses are bundled in data/; no API key or network needed.
Only information through the end of origin day t predicts day t+1.
"""
from pathlib import Path
import json, hashlib, platform, os, io, base64
import numpy as np
import pandas as pd
import sklearn
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import Ridge
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, confusion_matrix
from sklearn.inspection import permutation_importance

ROOT = Path(__file__).resolve().parent

def calibration_radius(residuals, coverage=.8):
    """Exact 1-based ceil((n+1)*coverage) order statistic, not a quantile index."""
    values = np.asarray(residuals, dtype=float)
    if values.ndim != 1 or not len(values) or not np.isfinite(values).all() or np.any(values < 0):
        raise ValueError('Calibration residuals must be a nonempty finite nonnegative vector')
    if not 0 < coverage < 1:
        raise ValueError('Coverage must be between zero and one')
    rank = int(np.ceil((len(values)+1)*coverage))
    if rank > len(values):
        raise ValueError('Too few calibration residuals for a finite interval at this coverage')
    return float(np.partition(values, rank-1)[rank-1])

def load_hourly(name):
    source = json.loads((ROOT / 'data' / name).read_text())
    frame = pd.DataFrame(source['hourly'])
    frame.index = pd.to_datetime(frame.pop('time'))
    return frame

def run():
    air = load_hourly('jaipur_air.json')
    weather = load_hourly('jaipur_weather.json')
    assert air.index.is_unique and weather.index.is_unique
    hourly = air.join(weather, how='inner')
    daily = hourly.resample('D').mean()
    daily['precipitation'] = hourly.precipitation.resample('D').sum(min_count=18)
    # Require at least 18 observations for every variable; retain calendar gaps.
    daily = daily.where(hourly.resample('D').count() >= 18)
    daily['pm_lag1'] = daily.pm2_5.shift(1)
    daily['pm_lag2'] = daily.pm2_5.shift(2)
    daily['pm_3day'] = daily.pm2_5.rolling(3, min_periods=3).mean()
    daily['pm_7day'] = daily.pm2_5.rolling(7, min_periods=7).mean()
    target_dates = daily.index + pd.Timedelta(days=1)
    day_of_year = np.array([d.timetuple().tm_yday for d in target_dates])
    daily['season_sin'] = np.sin(2*np.pi*day_of_year/365.25)
    daily['season_cos'] = np.cos(2*np.pi*day_of_year/365.25)
    daily['target'] = daily.pm2_5.shift(-1)
    daily['target_date'] = target_dates
    features = ['pm2_5','pm_lag1','pm_lag2','pm_3day','pm_7day',
                'temperature_2m','relative_humidity_2m','precipitation',
                'wind_speed_10m','surface_pressure','season_sin','season_cos']
    rows = daily.dropna(subset=features+['target']).copy()
    train = rows[rows.target_date < '2024-07-01']
    val = rows[(rows.target_date >= '2024-07-01') & (rows.target_date < '2025-01-01')]
    test = rows[rows.target_date >= '2025-01-01']
    assert train.target_date.max() < val.target_date.min() < test.target_date.min()
    candidates = {
        'ridge': make_pipeline(StandardScaler(), Ridge(alpha=10)),
        'forest': RandomForestRegressor(n_estimators=100, max_depth=8,
                                        min_samples_leaf=5, random_state=42, n_jobs=-1),
    }
    validation = {}
    for key, model in candidates.items():
        model.fit(train[features], train.target)
        validation[key] = mean_absolute_error(val.target, np.maximum(0, model.predict(val[features])))
    chosen = min(validation, key=validation.get)
    # No retraining: validation residuals calibrate the frozen training model.
    selected = candidates[chosen]
    residuals = np.abs(val.target - np.maximum(0, selected.predict(val[features])))
    q = calibration_radius(residuals)
    predictions = {'persistence': test.pm2_5.to_numpy()}
    predictions.update({k: np.maximum(0, m.predict(test[features])) for k,m in candidates.items()})
    def score(p):
        tn,fp,fn,tp = confusion_matrix(test.target > 60, p > 60, labels=[False,True]).ravel()
        return dict(mae=float(mean_absolute_error(test.target,p)),
                    rmse=float(np.sqrt(mean_squared_error(test.target,p))),r2=float(r2_score(test.target,p)),
                    missed=int(fn),false_alarms=int(fp),caught=int(tp),correct_clear=int(tn),
                    precision=float(tp/(tp+fp)) if tp+fp else None,
                    recall=float(tp/(tp+fn)) if tp+fn else None)
    importance = permutation_importance(selected, val[features], val.target,
                    scoring='neg_mean_absolute_error', n_repeats=8, random_state=42)
    metrics = {k: score(p) for k,p in predictions.items()}
    cases=[]
    for i,(origin,row) in enumerate(test.iterrows()):
        p=float(predictions[chosen][i])
        cases.append(dict(origin=str(origin.date()),date=str(row.target_date.date()),
                          actual=float(row.target),x=[float(row[f]) for f in features],
                          predictions={k:float(v[i]) for k,v in predictions.items()},
                          lower=max(0,p-q),upper=p+q))
    exported={}
    ridge=candidates['ridge']; scaler=ridge[0]; reg=ridge[1]
    exported['ridge']=dict(coef=(reg.coef_/scaler.scale_).tolist(),
                          intercept=float(reg.intercept_-np.sum(reg.coef_*scaler.mean_/scaler.scale_)))
    exported['forest']={'trees':[]}
    for estimator in candidates['forest'].estimators_:
        t=estimator.tree_
        exported['forest']['trees'].append(dict(left=t.children_left.tolist(),right=t.children_right.tolist(),
                    feature=t.feature.tolist(),threshold=t.threshold.tolist(),value=t.value[:,0,0].tolist()))
    result=dict(city='Jaipur',coordinates=[26.9124,75.7873],timezone='Asia/Kolkata',
        source='Open-Meteo CAMS model estimates, not ground-station measurements',
        created=pd.Timestamp.now(tz='UTC').isoformat(),features=features,selected=chosen,
        validation_mae=validation,metrics=metrics,interval_radius=q,
        interval_coverage=float(np.mean(np.abs(test.target-predictions[chosen])<=q)),
        counts=dict(hourly=len(hourly),daily=len(daily),usable=len(rows),train=len(train),validation=len(val),test=len(test)),
        splits={k:dict(start=str(v.target_date.min().date()),end=str(v.target_date.max().date())) for k,v in [('train',train),('validation',val),('test',test)]},
        importance=[dict(feature=f,value=float(v)) for f,v in sorted(zip(features,importance.importances_mean),key=lambda x:-x[1])],
        cases=cases,models=exported,
        worst_cases=sorted(range(len(cases)), key=lambda i: abs(cases[i]['actual']-cases[i]['predictions'][chosen]), reverse=True)[:5],
        interval=dict(nominal_coverage=.8,residual_rank=int(np.ceil((len(val)+1)*.8)),
                      method='Validation absolute residual order statistic; same validation period also selects model; empirical only'),
        versions=dict(python=platform.python_version(),numpy=np.__version__,pandas=pd.__version__,sklearn=sklearn.__version__),
        hashes={f.name:hashlib.sha256(f.read_bytes()).hexdigest() for f in (ROOT/'data').glob('*.json')})
    (ROOT/'dist'/'experiment.json').write_text(json.dumps(result,separators=(',',':'),allow_nan=False))
    rows.to_csv(ROOT/'data'/'daily_features.csv',index_label='origin_date')
    test_out=pd.DataFrame({'date':test.target_date,'actual_pm25':test.target,**predictions})
    test_out.to_csv(ROOT/'dist'/'test_predictions.csv',index=False)
    # Generate the same real plot saved in the notebook; no fabricated outputs.
    os.environ.setdefault('MPLCONFIGDIR', str(ROOT/'.cache/matplotlib'))
    from matplotlib.figure import Figure
    figure = Figure(figsize=(12,4), layout='constrained')
    ax = figure.subplots()
    for key, label in [('actual_pm25','Archived CAMS PM2.5'),(chosen,'AirCast'),('persistence','Persistence')]:
        ax.plot(test_out.date, test_out[key], label=label, linewidth=1)
    ax.set(title='Held-out Jaipur 2025', ylabel='PM2.5 (µg/m³)', xlabel='Target date')
    ax.legend()
    png = io.BytesIO(); figure.savefig(png, format='png', dpi=120)
    encoded_plot = base64.b64encode(png.getvalue()).decode('ascii')
    # A notebook with actual recorded outputs, designed to run in Google Colab.
    summary=json.dumps({k:result[k] for k in ['selected','counts','splits','validation_mae','metrics','interval_coverage','versions']},indent=2)
    notebook={'nbformat':4,'nbformat_minor':5,'metadata':{'kernelspec':{'display_name':'Python 3','language':'python','name':'python3'}},'cells':[
      {'cell_type':'markdown','metadata':{},'source':['# AirCast · Jaipur\n','Historical next-day PM2.5 forecasting. Run beside train.py and data/. If this notebook is opened alone in Colab, the first cell asks for AirCast-Jaipur-audited.zip (the complete project ZIP).\n','Uses model-estimated CAMS air quality; results are not validation against Jaipur sensors. Recorded training summary and chart are visible below.']},
      {'cell_type':'code','execution_count':None,'metadata':{},'source':[
          'from pathlib import Path\nimport os, zipfile\n',
          'if not Path("train.py").is_file():\n',
          '    if not Path("aircast/train.py").is_file():\n',
          '        from google.colab import files\n',
          '        uploaded = files.upload()  # Choose the complete AirCast source ZIP\n',
          '        archive = next((n for n in uploaded if n.lower().endswith(".zip")), None)\n',
          '        if archive is None: raise ValueError("Upload the complete project ZIP")\n',
          '        with zipfile.ZipFile(archive) as bundle:\n',
          '            root = Path.cwd().resolve()\n',
          '            if any(root not in (root / n).resolve().parents for n in bundle.namelist()):\n',
          '                raise ValueError("Unsafe archive path")\n',
          '            bundle.extractall(root)\n',
          '    os.chdir("aircast")\n',
          'assert Path("data/jaipur_air.json").is_file(), "The source data folder is required"\n'], 'outputs':[]},
      {'cell_type':'code','execution_count':1,'metadata':{},'source':['%pip -q install -r requirements.txt'],'outputs':[]},
      {'cell_type':'code','execution_count':2,'metadata':{},'source':['from train import run\nexperiment = run()'],'outputs':[{'output_type':'stream','name':'stdout','text':[summary+'\n']}]},
      {'cell_type':'code','execution_count':3,'metadata':{},'source':['import pandas as pd\nfrom matplotlib.figure import Figure\nfrom IPython.display import display\np = pd.read_csv("dist/test_predictions.csv", parse_dates=["date"])\nfigure = Figure(figsize=(12, 4), layout="constrained")\nax = figure.subplots()\nfor key, label in [("actual_pm25", "Archived CAMS PM2.5"), (experiment["selected"], "AirCast"), ("persistence", "Persistence")]:\n    ax.plot(p.date, p[key], label=label, linewidth=1)\nax.set(title="Held-out Jaipur 2025", ylabel="PM2.5 (µg/m³)", xlabel="Target date")\nax.legend()\ndisplay(figure)'],'outputs':[{'output_type':'display_data','metadata':{},'data':{'image/png':encoded_plot,'text/plain':['<Figure: held-out Jaipur 2025 prediction comparison>']}}]},
      {'cell_type':'code','execution_count':None,'metadata':{},'source':['from verify import verify\naudit = verify()'],'outputs':[]},
      {'cell_type':'markdown','metadata':{},'source':['## Interpretation\n','Selection uses validation MAE only. Test data never trains or selects a model. Intervals use validation residuals and are empirical, not guaranteed. Reanalysis is retrospective and can contain revised information. Read README.md for failures, sources, and limitations.']}]}
    (ROOT/'AirCast.ipynb').write_text(json.dumps(notebook,indent=1))
    print(summary)
    return result

if __name__ == '__main__':
    run()
