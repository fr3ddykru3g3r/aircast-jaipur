/* Browser inference uses the same frozen coefficients/trees as train.py. */
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
let E, current=0, windowDays=30;
const names={ridge:'Ridge regression',forest:'Random forest',persistence:'Persistence'};
const featureNames={pm2_5:'Today’s PM₂.₅',pm_lag1:'PM₂.₅, 1 day ago',pm_lag2:'PM₂.₅, 2 days ago',pm_3day:'3-day PM₂.₅ mean',pm_7day:'7-day PM₂.₅ mean',temperature_2m:'Temperature',relative_humidity_2m:'Humidity',precipitation:'Rainfall',wind_speed_10m:'Wind speed',surface_pressure:'Pressure',season_sin:'Season (sine)',season_cos:'Season (cosine)'};
const fmt=(n,d=1)=>Number(n).toFixed(d);
const date=s=>new Date(s+'T12:00:00+05:30').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Kolkata'});
function infer(key,x){
  if(key==='persistence')return x[0];
  const m=E.models[key];
  if(key==='ridge')return Math.max(0,m.intercept+m.coef.reduce((s,c,i)=>s+c*x[i],0));
  return Math.max(0,m.trees.reduce((s,t)=>{let i=0;while(t.left[i]!==-1)i=Math.fround(x[t.feature[i]])<=t.threshold[i]?t.left[i]:t.right[i];return s+t.value[i]},0)/m.trees.length);
}
// CPCB published bands; concentrations rounded to integer to avoid gaps.
// Severe has no official upper PM2.5 breakpoint, so no invented numeric index.
function subindex(value){
  const c=Math.round(Math.max(0,value));
  const bands=[[0,30,0,50,'Good','#e2eed3'],[31,60,51,100,'Satisfactory','#e4edc9'],[61,90,101,200,'Moderate','#f1e8bd'],[91,120,201,300,'Poor','#f1d6bb'],[121,250,301,400,'Very poor','#e9c9c1']];
  for(const [lo,hi,il,ih,label,color] of bands)if(c<=hi)return {value:Math.round(il+(ih-il)*(c-lo)/(hi-lo)),label,color};
  return {value:'401+',label:'Severe',color:'#e9c2cb'};
}
function showView(v){
  if(!['forecast','lab','method'].includes(v))v='forecast';
  $$('.view').forEach(el=>el.hidden=el.id!==v);
  $$('.nav').forEach(el=>{el.classList.toggle('active',el.dataset.view===v);el.setAttribute('aria-current',el.dataset.view===v?'page':'false')});
  if(location.hash!=='#'+v)history.replaceState(null,'','#'+v);
}
$$('.nav').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
$$('[data-goto]').forEach(b=>b.addEventListener('click',()=>{showView(b.dataset.goto);window.scrollTo({top:0,behavior:'smooth'})}));
window.addEventListener('hashchange',()=>showView(location.hash.slice(1)));
$$('[data-window]').forEach(b=>b.addEventListener('click',()=>{windowDays=Number(b.dataset.window);$$('[data-window]').forEach(x=>x.classList.toggle('active',x===b));if(E)drawChart()}));
$('#day').addEventListener('change',()=>{if(!E)return;const i=E.cases.findIndex(c=>c.date===$('#day').value);if(i>=0){current=i;renderForecast()}else{$('#day').value=E.cases[current].date}});
function renderForecast(){
  const c=E.cases[current],p=c.predictions[E.selected],a=subindex(p);
  $('#day').value=c.date;
  $('#target-date').textContent=date(c.date);
  $('#aqi').textContent=a.value;
  $('#category').textContent=a.label;$('#category').style.background=a.color;
  $('#needle').style.left=Math.min(99,(Number.parseInt(a.value)/500)*100)+'%';
  $('#pm').textContent=fmt(p);$('#range').textContent=`${fmt(c.lower)}–${fmt(c.upper)}`;
  $('#origin-date').textContent='Inputs from '+date(c.origin);
  $('#temp').textContent=fmt(c.x[5])+' °C';$('#humidity').textContent=fmt(c.x[6],0)+'%';
  $('#rain').textContent=fmt(c.x[7])+' mm';$('#wind').textContent=fmt(c.x[8])+' km/h';$('#todaypm').textContent=fmt(c.x[0])+' µg/m³';
  const elevated=p>60,uncertain=c.upper>60&&c.lower<=60;
  $('#plan-title').innerHTML=elevated?'Have an indoor<br>backup plan.':uncertain?'Keep tomorrow’s<br>plans flexible.':'A lighter day<br>on the horizon.';
  $('#plan-copy').textContent=elevated?'The forecast exceeds our 60 µg/m³ planning threshold. Consider an indoor alternative for prolonged outdoor activities.':uncertain?'The central forecast is below 60 µg/m³, but the uncertainty range crosses it. Recheck official local readings before heading out.':'The forecast and its empirical range are below our 60 µg/m³ planning threshold. Conditions can still change within the day.';
  $('#actual').textContent=`Archived next-day value: ${fmt(c.actual)} µg/m³`;
  const missed=c.actual>60&&p<=60,falseAlarm=c.actual<=60&&p>60;
  $('#error-note').textContent=`Forecast error: ${fmt(Math.abs(c.actual-p))} µg/m³. ${missed?'Missed warning at the 60 µg/m³ threshold.':falseAlarm?'False alarm at the 60 µg/m³ threshold.':'Threshold decision matched the archive.'}`;
  drawChart();
}
function drawChart(){
  const end=windowDays===365?E.cases.length:Math.min(E.cases.length,Math.max(current+1,windowDays));
  const start=windowDays===365?0:Math.max(0,end-windowDays),cs=E.cases.slice(start,end);
  const w=1100,h=240,L=42,R=15,T=15,B=30;
  const max=Math.ceil(Math.max(60,...cs.map(c=>Math.max(c.upper,c.actual,c.predictions.persistence)))/20)*20;
  const x=i=>L+i*(w-L-R)/Math.max(1,cs.length-1),y=v=>T+(max-v)*(h-T-B)/max;
  const pts=key=>cs.map((c,i)=>`${x(i)},${y(key(c))}`).join(' ');
  let svg=`<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">`;
  for(let i=0;i<=4;i++){const v=max*i/4;svg+=`<line x1="${L}" x2="${w-R}" y1="${y(v)}" y2="${y(v)}" stroke="#e5e9df"/><text x="${L-10}" y="${y(v)+4}" text-anchor="end" fill="#849180" font-size="10">${fmt(v,0)}</text>`}
  svg+=`<polygon points="${pts(c=>c.upper)} ${[...cs].reverse().map((c,j)=>`${x(cs.length-1-j)},${y(c.lower)}`).join(' ')}" fill="#dce8c7" opacity=".5"/>`;
  for(const [fn,color,dash,width] of [[c=>c.predictions.persistence,'#aab6b2','4 5',1.4],[c=>c.actual,'#a0ae74','',1.8],[c=>c.predictions[E.selected],'#386247','',2.5]])svg+=`<polyline points="${pts(fn)}" fill="none" stroke="${color}" stroke-width="${width}" stroke-dasharray="${dash}" stroke-linejoin="round"/>`;
  if(current>=start&&current<end){const i=current-start;svg+=`<line x1="${x(i)}" x2="${x(i)}" y1="${T}" y2="${h-B}" stroke="#4e7156" stroke-dasharray="3 4" opacity=".5"/><circle cx="${x(i)}" cy="${y(cs[i].predictions[E.selected])}" r="4" fill="#183d32" stroke="#fffefa" stroke-width="2"/>`}
  for(let i=0;i<=4;i++){const j=Math.round(i*(cs.length-1)/4);svg+=`<text x="${x(j)}" y="${h-6}" text-anchor="${i===0?'start':i===4?'end':'middle'}" fill="#849180" font-size="10">${date(cs[j].date).replace(' 2025','')}</text>`}
  $('#timeseries').innerHTML=svg+'</svg>';
  $('#chart-period').textContent=`${date(cs[0].date)} – ${date(cs.at(-1).date)}`;
}
function metrics(){
  const m=E.metrics[E.selected],b=E.metrics.persistence,improve=100*(b.mae-m.mae)/b.mae;
  $('#summary-metrics').innerHTML=[['Model mean absolute error',fmt(m.mae,2),'µg/m³ · lower is better'],['Persistence baseline',fmt(b.mae,2),'µg/m³ · tomorrow equals today'],['Reduction in error',fmt(improve)+'%','Compared with persistence on 2025'],['Unseen test days',E.counts.test,'All dates held out chronologically']].map(([l,v,t])=>`<div class="metric"><span>${l}</span><strong>${v}</strong><small>${t}</small></div>`).join('');
}
function lab(){
  $('#lab-content').innerHTML=`
  <article class="panel"><span class="eyebrow">HISTORICAL DATASET PARTITION</span><h2>Historical Dataset Partition</h2><div class="split-strip"><div>Training · ${E.counts.train} days<span>Jan 2023 – Jun 2024</span></div><div>Validation · ${E.counts.validation} days<span>Jul – Dec 2024</span></div><div>Test · ${E.counts.test} days<span>Jan – Dec 2025</span></div></div><p>The dates above describe historical observations, not the duration of project development. The bundled data was downloaded on 15 November 2026, and the models were trained and evaluated during the hackathon on 15 November 2026.</p><p>Selection was locked using validation MAE: ridge ${fmt(E.validation_mae.ridge,2)}, random forest ${fmt(E.validation_mae.forest,2)} µg/m³. The test year was used only for final evaluation. First usable target: ${date(E.splits.train.start)}.</p></article>
  <article class="panel"><span class="eyebrow">THE FAIR COMPARISON</span><h2>What does machine learning actually add?</h2><div class="table-wrap"><table><thead><tr><th>Model</th><th>MAE ↓ · µg/m³</th><th>RMSE ↓ · µg/m³</th><th>R² ↑</th><th>Missed warnings*</th><th>False alarms*</th></tr></thead><tbody>${['persistence','ridge','forest'].map(k=>{const s=E.metrics[k];return `<tr class="${k===E.selected?'selected':''}"><td>${names[k]}${k===E.selected?'<span class="model-pill">SELECTED</span>':''}</td><td>${fmt(s.mae,2)}</td><td>${fmt(s.rmse,2)}</td><td>${fmt(s.r2,3)}</td><td>${s.missed}</td><td>${s.false_alarms}</td></tr>`}).join('')}</tbody></table></div><p class="fine">* Warning defined as next-day PM₂.₅ &gt;60 µg/m³. The selected model misses ${E.metrics[E.selected].missed} of ${E.metrics[E.selected].caught+E.metrics[E.selected].missed} elevated days. A lower average error does not guarantee better warning recall.</p></article>
  <div class="lab-grid"><article class="panel"><span class="eyebrow">A WARNING IS A TRADE-OFF</span><h2>Where would you draw the line?</h2><p>Change the planning threshold to see missed warnings and false alarms on all 365 test days.</p><label for="threshold" class="fine">PM₂.₅ warning threshold (µg/m³)</label><div class="threshold-row"><input type="range" id="threshold" min="20" max="120" step="5" value="60"><output id="threshold-value">60 µg/m³</output></div><div id="confusion" class="confusion" aria-live="polite"></div><p id="warning-rates" class="fine" aria-live="polite"></p><p class="fine">Exploratory threshold analysis. This is not an official public-health warning service.</p></article>
  <article class="panel"><span class="eyebrow">WHAT MATTERS TO THE MODEL</span><h2>Signals, not causes.</h2><p>Validation permutation importance: increase in MAE when a feature is shuffled. Correlated inputs can share importance.</p>${E.importance.slice(0,6).map(o=>`<div class="importance-row"><span>${featureNames[o.feature]}</span><div class="bar-track"><i style="width:${Math.max(0,o.value)/Math.max(.01,E.importance[0].value)*100}%"></i></div><span>${fmt(o.value,2)}</span></div>`).join('')}<p class="fine">Global model sensitivity, not a causal explanation of Jaipur pollution.</p></article></div>
  <article class="panel"><span class="eyebrow">TRY THE TRAINED MODEL</span><h2>A different input. A real prediction.</h2><p>Start from a held-out day and adjust its previous-day conditions. The frozen model runs in your browser. These are hypothetical inputs, not new observations or causal simulations.</p><label class="fine" for="scenario-date">Base forecast date </label><select id="scenario-date">${E.cases.map((c,i)=>`<option value="${i}" ${i===current?'selected':''}>${date(c.date)}</option>`).join('')}</select><div class="scenario-grid" style="margin-top:20px">${[['temperature_2m','Temperature (°C)',-5,50,.1],['relative_humidity_2m','Humidity (%)',0,100,1],['wind_speed_10m','Wind (km/h)',0,70,.1],['precipitation','Rain (mm/day)',0,300,.1]].map(([k,label,min,max,step])=>`<label>${label}<input class="scenario-input" data-feature="${k}" type="number" min="${min}" max="${max}" step="${step}"></label>`).join('')}</div><div class="scenario-result" aria-live="polite"><strong id="scenario-pm">—</strong><div><span>µg/m³ predicted PM₂.₅</span><p id="scenario-delta"></p></div></div><p class="fine">All pollution-history and seasonal inputs remain from the chosen base date. Arbitrary combinations may be outside the training distribution.</p></article>
  <div class="lab-grid"><article class="panel"><span class="eyebrow">THE FAILURES STAY VISIBLE</span><h2>The hardest days.</h2><p>The three largest absolute errors on the test year. Sudden changes are difficult; dust and emissions are not direct inputs. These are hypotheses, not verified event explanations.</p>${E.worst_cases.slice(0,3).map(i=>{const c=E.cases[i];return `<div class="failure"><div><strong>${date(c.date)}</strong><p>Predicted ${fmt(c.predictions[E.selected])} · archived ${fmt(c.actual)} µg/m³<br>Absolute error ${fmt(Math.abs(c.actual-c.predictions[E.selected]))} µg/m³</p></div><button class="text-button failure-link" data-case="${i}">Replay ↗</button></div>`}).join('')}</article>
  <article class="panel"><span class="eyebrow">UNCERTAINTY, MEASURED</span><h2>A range, not a promise.</h2><p>The nominal 80% interval uses the absolute prediction errors from the 184 validation days, using the exact 1-based residual rank ${E.interval.residual_rank}. It has a constant radius of ${fmt(E.interval_radius)} µg/m³, clipped at zero.</p><h3>${fmt(E.interval_coverage*100,1)}% test coverage</h3><p>Coverage means the archived next-day value fell inside the interval this often. The same validation period selected the model, so this is an empirical interval, not an independent conformal calibration. Time dependence and distribution shifts mean future coverage is not guaranteed.</p><p class="fine">Results evaluate forecasts of gridded CAMS estimates, not measured street-level exposure.</p></article></div>`;
  $('#threshold').addEventListener('input',warningCounts);warningCounts();
  $('#scenario-date').addEventListener('change',resetScenario);$$('.scenario-input').forEach(i=>i.addEventListener('input',scenario));resetScenario();
  $$('.failure-link').forEach(b=>b.addEventListener('click',()=>{current=Number(b.dataset.case);renderForecast();showView('forecast');window.scrollTo({top:250,behavior:'smooth'})}));
}
function warningCounts(){
  const t=Number($('#threshold').value);$('#threshold-value').textContent=t+' µg/m³';
  let tp=0,fn=0,fp=0,tn=0;E.cases.forEach(c=>{const actual=c.actual>t,p=c.predictions[E.selected]>t;if(actual&&p)tp++;else if(actual)fn++;else if(p)fp++;else tn++});
  $('#confusion').innerHTML=[[tp,'True positives · elevated days caught',false],[fn,'False negatives · elevated days missed',true],[fp,'False positives · false alarms',true],[tn,'True negatives · below-threshold days',false]].map(([n,l,w])=>`<div class="${w?'warn':''}"><b>${n}</b>${l}</div>`).join('');
  const precision=tp+fp?fmt(100*tp/(tp+fp),1)+'%':'undefined (no predicted warnings)';
  const recall=tp+fn?fmt(100*tp/(tp+fn),1)+'%':'undefined (no elevated reference days)';
  $('#warning-rates').textContent=`Precision: ${precision} — share of predicted warnings that matched an elevated reference day. Recall: ${recall} — share of elevated reference days caught. Both are evaluated against CAMS estimates.`;
}
function resetScenario(){const c=E.cases[Number($('#scenario-date').value)];$$('.scenario-input').forEach(i=>{i.step='any';i.value=String(c.x[E.features.indexOf(i.dataset.feature)])});scenario()}
function scenario(){
  const c=E.cases[Number($('#scenario-date').value)],x=[...c.x];
  const inputs=$$('.scenario-input');
  if(inputs.some(i=>i.value===''||!i.checkValidity())){$('#scenario-pm').textContent='—';$('#scenario-delta').textContent='Enter a value within each input’s allowed range.';return}
  inputs.forEach(i=>x[E.features.indexOf(i.dataset.feature)]=Number(i.value));
  const p=infer(E.selected,x),delta=p-c.predictions[E.selected];$('#scenario-pm').textContent=fmt(p);
  $('#scenario-delta').textContent=`${delta>=0?'+':''}${fmt(delta)} µg/m³ vs the base forecast · ${names[E.selected]}`;
}
function validateExperiment(data){
  if(!data||!['ridge','forest'].includes(data.selected)||!Array.isArray(data.features)||data.features.length!==12
     ||!Array.isArray(data.cases)||!data.cases.length||data.cases.length!==data.counts?.test
     ||!data.models?.ridge?.coef||!data.models?.forest?.trees?.length||!data.metrics?.persistence)
    throw Error('The experiment file has an unsupported structure.');
  for(const c of data.cases){
    if(!Array.isArray(c.x)||c.x.length!==data.features.length||!c.x.every(Number.isFinite)
       ||!['ridge','forest','persistence'].every(k=>Number.isFinite(c.predictions?.[k]))
       ||![c.actual,c.lower,c.upper].every(Number.isFinite)||c.lower<0||c.upper<c.lower
       ||!/^2025-\d{2}-\d{2}$/.test(c.date))throw Error('The experiment contains an invalid forecast record.');
  }
}
async function init(){
  let stage='download';
  $('#loading').hidden=false;$('#loaderror').hidden=true;$('#dashboard').hidden=true;
  $('#day').disabled=true;$$('[data-window]').forEach(b=>b.disabled=true);
  try{
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),20000);
  let data;
  try{const r=await fetch(new URL('experiment.json',document.baseURI),{signal:controller.signal,cache:'no-cache'});
    if(!r.ok)throw Error(`Experiment request returned HTTP ${r.status}.`);
    stage='parse';data=await r.json();
  }finally{clearTimeout(timeout)}
  stage='validation';validateExperiment(data);E=data;
  current=Math.max(0,E.cases.findIndex(c=>c.date==='2025-11-15'));
  // Verify export parity before showing any numbers.
  stage='model verification';
  for(const c of E.cases)for(const k of ['ridge','forest']){const p=infer(k,c.x);if(!Number.isFinite(p)||Math.abs(p-c.predictions[k])>1e-5)throw Error('Trained-model export does not match the saved predictions.');}
  stage='rendering';renderForecast();metrics();lab();showView(location.hash.slice(1));
  $('#loading').hidden=true;$('#dashboard').hidden=false;
  $('#day').disabled=false;$$('[data-window]').forEach(b=>b.disabled=false);
}catch(e){E=undefined;$('#loading').hidden=true;$('#dashboard').hidden=true;$('#loaderror').hidden=false;
  $('#load-error-detail').textContent=location.protocol==='file:'?'Open this dashboard through its hosted URL, or serve dist/ with python3 -m http.server 8000 --directory dist.':`Forecast loading failed during ${stage}. ${e.name==='AbortError'?'The data request timed out.':e.message} Check your connection and retry. If this persists, the site owner should redeploy the complete dist/ folder.`;
  console.error(`AirCast ${stage} failure:`,e);
}}
$('#retry-load').addEventListener('click',init);
init();
