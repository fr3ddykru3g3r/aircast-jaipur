const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');const live=require('../dist/live.js');
const air=JSON.parse(fs.readFileSync(path.join(root,'data/jaipur_air.json'))),weather=JSON.parse(fs.readFileSync(path.join(root,'data/jaipur_weather.json'))),e=JSON.parse(fs.readFileSync(path.join(root,'dist/experiment.json')));
for(const c of e.cases){const result=live.buildLiveInputs(air,weather,new Date(c.origin+'T12:00:00+05:30'));assert.equal(result.date,c.date);result.x.forEach((v,i)=>assert.ok(Math.abs(v-c.x[i])<1e-8,`${c.date} feature ${i}`));}
assert.equal(live.indiaDay(new Date('2026-11-15T18:29:59Z')),'2026-11-15');
assert.equal(live.indiaDay(new Date('2026-11-15T18:30:00Z')),'2026-11-16');
const now=new Date('2025-11-14T12:00:00+05:30'),before=live.buildLiveInputs(air,weather,now),modified=structuredClone(air);
modified.hourly.time.forEach((t,i)=>{if(t.startsWith('2025-11-15'))modified.hourly.pm2_5[i]=999});
assert.deepEqual(live.buildLiveInputs(modified,weather,now).x,before.x,'Tomorrow pollution must never enter inputs');
const missing=structuredClone(air);missing.hourly.pm2_5=missing.hourly.pm2_5.map(()=>null);assert.throws(()=>live.buildLiveInputs(missing,weather,now),/consecutive/);
const wrong=structuredClone(weather);wrong.hourly_units.wind_speed_10m='m/s';assert.throws(()=>live.buildLiveInputs(air,wrong,now),/units/);
const snapshot=JSON.parse(fs.readFileSync(path.join(root,'dist/live_snapshot.json')));const current=live.buildLiveInputs(snapshot.air,snapshot.weather,new Date(snapshot.issued));
assert.equal(current.date,live.shiftDay(live.indiaDay(new Date(snapshot.issued)),1));
console.log('PASS: live feature builder matches all 365 historical cases; midnight rollover; no target-pollution leakage; missing-data and unit rejection; current next-day inference.');
