"""Independent audit from raw JSON, without reusing train.py preprocessing/metrics.

Run: python verify.py. Writes audit/verification.json and exits nonzero on failure.
"""
from pathlib import Path
import csv, datetime as dt, hashlib, json, math, statistics
import numpy as np

ROOT = Path(__file__).resolve().parent

def verify():
    e = json.loads((ROOT/'dist/experiment.json').read_text())
    checks, failures = {}, []
    def check(name, condition):
        checks[name] = bool(condition)
        if not condition:
            failures.append(name)
    raw, grouped = {}, {}
    for name in ['jaipur_air.json', 'jaipur_weather.json']:
        source = json.loads((ROOT/'data'/name).read_text())
        check(name+' hash', hashlib.sha256((ROOT/'data'/name).read_bytes()).hexdigest() == e['hashes'][name])
        check(name+' timezone', source['timezone']=='Asia/Kolkata' and source['utc_offset_seconds']==19800)
        times = [dt.datetime.fromisoformat(t) for t in source['hourly']['time']]
        check(name+' complete hourly calendar', len(times)==26304 and len(set(times))==len(times)
              and all(b-a==dt.timedelta(hours=1) for a,b in zip(times,times[1:])))
        raw[name] = source
        for variable, values in source['hourly'].items():
            if variable=='time':
                continue
            for stamp, value in zip(times, values):
                grouped.setdefault(stamp.date(), {}).setdefault(variable, []).append(value)
    daily = {}
    missing_hours = 0
    for day, variables in grouped.items():
        daily[day] = {}
        for name, values in variables.items():
            finite = [float(v) for v in values if v is not None and math.isfinite(v)]
            missing_hours += len(values)-len(finite)
            daily[day][name] = None if len(finite)<18 else (math.fsum(finite) if name=='precipitation' else statistics.mean(finite))
    rows=[]
    for day in sorted(daily):
        previous = [daily.get(day-dt.timedelta(days=i), {}).get('pm2_5') for i in range(7)]
        tomorrow = day+dt.timedelta(days=1)
        target = daily.get(tomorrow,{}).get('pm2_5')
        weather = [daily[day].get(k) for k in ['temperature_2m','relative_humidity_2m','precipitation','wind_speed_10m','surface_pressure']]
        if any(v is None for v in previous+weather+[target]):
            continue
        season = 2*math.pi*tomorrow.timetuple().tm_yday/365.25
        x = [previous[0],previous[1],previous[2],statistics.mean(previous[:3]),statistics.mean(previous),*weather,math.sin(season),math.cos(season)]
        rows.append({'origin':str(day),'date':str(tomorrow),'x':x,'actual':target})
    train=[r for r in rows if r['date']<'2024-07-01']
    val=[r for r in rows if '2024-07-01'<=r['date']<'2025-01-01']
    test=[r for r in rows if r['date']>='2025-01-01']
    check('split sizes', [len(train),len(val),len(test)]==[540,184,365])
    check('chronological disjoint targets', max(r['date'] for r in train)<min(r['date'] for r in val)
          and max(r['date'] for r in val)<min(r['date'] for r in test))
    check('strictly next calendar day',all(dt.date.fromisoformat(r['date'])-dt.date.fromisoformat(r['origin'])==dt.timedelta(days=1) for r in rows))
    csv_rows=list(csv.DictReader((ROOT/'data/daily_features.csv').open()))
    check('all 1089 feature rows reconstructed from past-only raw data',len(csv_rows)==len(rows) and all(
        r['origin']==s['origin_date'] and r['date']==s['target_date'] and abs(r['actual']-float(s['target']))<1e-9
        and all(abs(v-float(s[f]))<1e-9 for v,f in zip(r['x'],e['features'])) for r,s in zip(rows,csv_rows)))
    # Independently solve ridge's regularized normal equations, training-only scale.
    X=np.array([r['x'] for r in train]); y=np.array([r['actual'] for r in train])
    mean=X.mean(axis=0); scale=X.std(axis=0); Z=(X-mean)/scale
    beta=np.linalg.solve(Z.T@Z+10*np.eye(X.shape[1]),Z.T@(y-y.mean()))
    coef=beta/scale; intercept=float(y.mean()-coef@mean)
    check('training-only ridge coefficients independently solved',np.allclose(coef,e['models']['ridge']['coef'],rtol=0,atol=1e-9)
          and abs(intercept-e['models']['ridge']['intercept'])<1e-8)
    def predict(key,x,float32=True):
        if key=='persistence':
            return x[0]
        if key=='ridge':
            return max(0,float(intercept+coef@x))
        values=[]
        for tree in e['models']['forest']['trees']:
            i=0
            while tree['left'][i]!=-1:
                value=x[tree['feature'][i]]
                if float32:
                    value=float(np.float32(value))
                i=tree['left'][i] if value<=tree['threshold'][i] else tree['right'][i]
            values.append(tree['value'][i])
        return max(0,statistics.mean(values))
    metrics={}; predictions={}
    for key in ['persistence','ridge','forest']:
        p=[predict(key,r['x']) for r in test]; predictions[key]=p
        errors=[r['actual']-v for r,v in zip(test,p)]
        actual=[r['actual'] for r in test]; mean_actual=statistics.mean(actual)
        counts={'caught':0,'missed':0,'false_alarms':0,'correct_clear':0}
        for a,v in zip(actual,p):
            counts['caught' if a>60 and v>60 else 'missed' if a>60 else 'false_alarms' if v>60 else 'correct_clear']+=1
        precision=counts['caught']/(counts['caught']+counts['false_alarms']) if counts['caught']+counts['false_alarms'] else None
        recall=counts['caught']/(counts['caught']+counts['missed']) if counts['caught']+counts['missed'] else None
        metrics[key]={'mae':statistics.mean(map(abs,errors)),'rmse':math.sqrt(statistics.mean(v*v for v in errors)),
                      'r2':1-math.fsum(v*v for v in errors)/math.fsum((a-mean_actual)**2 for a in actual),**counts,'precision':precision,'recall':recall}
        check(key+' metrics independently match',all((v is None and e['metrics'][key].get(k) is None) or
              (v is not None and e['metrics'][key].get(k) is not None and abs(v-e['metrics'][key][k])<1e-9) for k,v in metrics[key].items()))
        check(key+' exported predictions match raw reconstruction',all(abs(v-c['predictions'][key])<1e-8 and r['date']==c['date']
                    and abs(r['actual']-c['actual'])<1e-9 for r,c,v in zip(test,e['cases'],p)))
    validation={key:statistics.mean(abs(r['actual']-predict(key,r['x'])) for r in val) for key in ['ridge','forest']}
    check('model selection uses validation MAE',e['selected']==min(validation,key=validation.get)
          and all(abs(v-e['validation_mae'][k])<1e-9 for k,v in validation.items()))
    residuals=sorted(abs(r['actual']-predict(e['selected'],r['x'])) for r in val)
    rank=math.ceil((len(val)+1)*.8); radius=residuals[rank-1]
    check('interval uses exact 1-based residual rank',abs(e['interval_radius']-radius)<1e-9)
    inside=0
    for r,c,p in zip(test,e['cases'],predictions[e['selected']]):
        check_interval=abs(c['lower']-max(0,p-radius))<1e-8 and abs(c['upper']-(p+radius))<1e-8
        if not check_interval and 'all interval endpoints match exact radius' not in failures:
            failures.append('all interval endpoints match exact radius')
        inside+=max(0,p-radius)<=r['actual']<=p+radius
    check('reported interval coverage matches endpoints',abs(e['interval_coverage']-inside/len(test))<1e-12)
    exported=list(csv.DictReader((ROOT/'dist/test_predictions.csv').open()))
    check('CSV and JSON match all 365 cases',len(exported)==len(test) and all(r['date']==c['date'] and abs(float(r['actual_pm25'])-c['actual'])<1e-9
          and all(abs(float(r[k])-c['predictions'][k])<1e-9 for k in predictions) for r,c in zip(exported,e['cases'])))
    float64_failures=sum(abs(predict('forest',r['x'],False)-p)>1e-5 for r,p in zip(test,predictions['forest']))
    report={'passed':not failures,'checks':checks,'failures':failures,'raw_missing_values':missing_hours,
            'counts':{'hourly':26304,'daily':len(daily),'usable':len(rows),'train':len(train),'validation':len(val),'test':len(test)},
            'metrics':metrics,'validation_mae':validation,'correct_interval_rank':rank,'correct_interval_radius':radius,
            'correct_interval_coverage':inside/len(test),'legacy_float64_forest_mismatches':float64_failures}
    (ROOT/'audit').mkdir(exist_ok=True)
    (ROOT/'audit/verification.json').write_text(json.dumps(report,indent=2,allow_nan=False))
    print(json.dumps({k:report[k] for k in ['passed','failures','correct_interval_radius','correct_interval_coverage','legacy_float64_forest_mismatches']},indent=2))
    if failures:
        raise SystemExit(1)
    return report

if __name__=='__main__':
    verify()
