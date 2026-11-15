'use strict';
const LIVE_AIR='https://air-quality-api.open-meteo.com/v1/air-quality?latitude=26.9124&longitude=75.7873&past_days=7&forecast_days=2&hourly=pm2_5&timezone=Asia%2FKolkata';
const LIVE_WEATHER='https://api.open-meteo.com/v1/forecast?latitude=26.9124&longitude=75.7873&past_days=7&forecast_days=2&hourly=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,surface_pressure&timezone=Asia%2FKolkata';
function indiaDay(now){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(now)}
function shiftDay(day,n){const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)}
function aggregateLive(source){
  if(source?.timezone!=='Asia/Kolkata'||!source.hourly?.time)throw Error('Unexpected source timezone or response.');
  const days={},seen=new Set();
  source.hourly.time.forEach((t,i)=>{
    if(seen.has(t))throw Error('Duplicate source timestamp.');seen.add(t);
    const day=t.slice(0,10);days[day]??={};
    for(const [key,values] of Object.entries(source.hourly))if(key!=='time'){
      const v=values[i];days[day][key]??=[];if(Number.isFinite(v))days[day][key].push(v);
    }
  });
  for(const values of Object.values(days))for(const [key,arr] of Object.entries(values)){
    if(arr.length<18){values[key]=null;continue}
    const total=arr.reduce((s,v)=>s+v,0);values[key]=key==='precipitation'?total:total/arr.length;
  }
  return days;
}
function buildLiveInputs(air,weather,now=new Date()){
  if(air.hourly_units?.pm2_5!=='μg/m³'&&air.hourly_units?.pm2_5!=='µg/m³')throw Error('Unexpected PM2.5 units.');
  for(const [k,u] of Object.entries({temperature_2m:'°C',relative_humidity_2m:'%',precipitation:'mm',wind_speed_10m:'km/h',surface_pressure:'hPa'}))if(weather.hourly_units?.[k]!==u)throw Error('Unexpected units for '+k);
  const a=aggregateLive(air),w=aggregateLive(weather),origin=indiaDay(now),target=shiftDay(origin,1);
  const pm=Array.from({length:7},(_,i)=>a[shiftDay(origin,-i)]?.pm2_5);
  const met=['temperature_2m','relative_humidity_2m','precipitation','wind_speed_10m','surface_pressure'].map(k=>w[origin]?.[k]);
  if(![...pm,...met].every(Number.isFinite))throw Error('Seven consecutive days of pollution and a complete daily weather estimate are required.');
  if(pm.some(v=>v<0))throw Error('Invalid negative pollution estimate.');
  const mean=v=>v.reduce((s,n)=>s+n,0)/v.length;
  const year=Number(target.slice(0,4)),doy=Math.round((Date.parse(target+'T00:00:00Z')-Date.UTC(year,0,1))/86400000)+1;
  return {origin,date:target,x:[pm[0],pm[1],pm[2],mean(pm.slice(0,3)),mean(pm),...met,Math.sin(2*Math.PI*doy/365.25),Math.cos(2*Math.PI*doy/365.25)],provider:a[target]?.pm2_5??null};
}
if(typeof module!=='undefined')module.exports={indiaDay,shiftDay,aggregateLive,buildLiveInputs,LIVE_AIR,LIVE_WEATHER};
let liveBusy=false,liveRecord;
async function liveJSON(url){
  const c=new AbortController(),timer=setTimeout(()=>c.abort(),12000);
  try{const r=await fetch(url,{signal:c.signal,cache:'no-cache'});if(!r.ok)throw Error('Data request returned HTTP '+r.status);return await r.json()}finally{clearTimeout(timer)}
}
async function startLive(){
  if(liveBusy||typeof E==='undefined'||!E)return;liveBusy=true;
  $('#refresh-live').disabled=true;$('#live-status').textContent='Fetching recent Jaipur data…';$('#live-error').hidden=true;
  try{
    let air,weather,issued,mode='fresh';
    try{[air,weather]=await Promise.all([liveJSON(LIVE_AIR),liveJSON(LIVE_WEATHER)]);issued=new Date().toISOString()}
    catch(networkError){
      const saved=await liveJSON('live_snapshot.json');
      if(Date.now()-Date.parse(saved.issued)>2*3600000||indiaDay(new Date(saved.issued))!==indiaDay(new Date()))throw Error('Live sources unavailable and no current snapshot is available. Retry shortly.');
      ({air,weather,issued}=saved);mode='saved snapshot';
    }
    const c=buildLiveInputs(air,weather),ridge=infer('ridge',c.x),forest=infer('forest',c.x),p=infer(E.selected,c.x),category=subindex(p);
    liveRecord={...c,issued,retrieved_mode:mode,selected:E.selected,predictions:{ridge,forest,persistence:c.x[0]},features:Object.fromEntries(E.features.map((f,i)=>[f,c.x[i]])),sources:{air:LIVE_AIR,weather:LIVE_WEATHER},limitations:'Full origin-day provider estimates include future hours; unvalidated hybrid live mode. CAMS is not station ground truth. Historical MAE is not a live accuracy guarantee.'};
    $('#live-date').textContent='Forecast for '+date(c.date);$('#live-target').textContent=date(c.date);$('#live-pm').textContent=fmt(p);
    $('#live-category').textContent=category.label;$('#live-category').style.background=category.color;
    $('#live-index').textContent='India PM₂.₅ sub-index: '+category.value;
    $('#live-forest').textContent=fmt(forest)+' µg/m³';$('#live-baseline').textContent=fmt(c.x[0])+' µg/m³';
    $('#live-plan').textContent=p>60?'Prepare an indoor alternative.':'Keep your plans flexible.';
    $('#live-plan-copy').textContent=p>60?'AirCast predicts a daily mean above the exploratory 60 µg/m³ planning threshold. Verify official local readings before making outdoor plans.':'The central prediction is below the exploratory 60 µg/m³ threshold. This does not establish safe conditions; daily means can hide hourly spikes.';
    $('#live-provider').textContent=Number.isFinite(c.provider)?fmt(c.provider)+' µg/m³ · CAMS next-day estimate':'Provider comparison unavailable';
    const time=new Date(issued).toLocaleString('en-IN',{timeZone:'Asia/Kolkata',dateStyle:'medium',timeStyle:'short'});
    $('#live-issued').textContent='Issued '+time+' IST';
    $('#live-status').textContent=mode==='fresh'?'Fresh API inputs · experimental prediction':'Saved forecast inputs · '+time+' IST · live API unavailable';
    $('#live-weather').innerHTML=[['Temperature',fmt(c.x[5])+' °C'],['Humidity',fmt(c.x[6])+'%'],['Wind',fmt(c.x[8])+' km/h'],['Rain',fmt(c.x[7])+' mm'],['Today’s PM₂.₅ estimate',fmt(c.x[0])+' µg/m³']].map(([a,b])=>`<div class="weather-item"><span>${a}</span><b>${b}</b></div>`).join('');
    $('#live-cutoff').textContent='Origin day: '+date(c.origin)+'. Seven-day pollution history ends on that date. Entire origin-day weather/pollution are provider estimates, including remaining hours.';
    $('#live-provenance').textContent=`AirCast ran its frozen ${names[E.selected]} on recent Jaipur inputs to predict ${date(c.date)}. Input retrieval: ${time} IST (${mode}). Tomorrow’s pollution is never an AirCast input. The separate CAMS next-day number is only an external comparison.`;
    $('#live-results').hidden=false;
  }catch(error){$('#live-results').hidden=true;$('#live-error').hidden=false;$('#live-error').textContent='Next-day forecast unavailable: '+error.message+' Historical model evaluation remains available in Model lab.';$('#live-status').textContent='Recent data could not be verified'}
  finally{liveBusy=false;$('#refresh-live').disabled=false}
}
if(typeof document!=='undefined'){
  document.querySelector('#refresh-live').addEventListener('click',startLive);
  document.querySelector('#download-live').addEventListener('click',()=>{
    if(!liveRecord)return;const url=URL.createObjectURL(new Blob([JSON.stringify(liveRecord,null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='AirCast-Jaipur-'+liveRecord.date+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  if(typeof E!=='undefined'&&E)startLive();
}
