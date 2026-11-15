// No test dependencies. Exercise real app.js in a minimal DOM harness;
// real layout/navigation are checked separately in the browser.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const experiment=JSON.parse(fs.readFileSync(path.join(root,'dist/experiment.json'),'utf8'));
const source=fs.readFileSync(path.join(root,'dist/app.js'),'utf8');
function node(){return {hidden:false,disabled:false,value:'',innerHTML:'',textContent:'',dataset:{},style:{},events:{},
  classList:{toggle(){}},addEventListener(k,fn){this.events[k]=fn},setAttribute(){},checkValidity(){return this.value!==''&&Number.isFinite(Number(this.value))}}}
async function app(fetchImpl){
  const nodes=new Map();const get=s=>{if(!nodes.has(s))nodes.set(s,node());return nodes.get(s)};
  const nav=['forecast','lab','method'].map(view=>Object.assign(node(),{dataset:{view}}));
  const periods=[30,90,365].map(window=>Object.assign(node(),{dataset:{window:String(window)}}));
  const views=['forecast','lab','method'].map(id=>Object.assign(node(),{id}));
  const inputs=['temperature_2m','relative_humidity_2m','wind_speed_10m','precipitation'].map(feature=>Object.assign(node(),{dataset:{feature}}));
  get('#threshold').value='60';
  const context=vm.createContext({document:{baseURI:'https://example.test/',querySelector:get,querySelectorAll:s=>({'.nav':nav,'.view':views,'[data-window]':periods,'.scenario-input':inputs}[s]||[])},
    location:{protocol:'https:',hash:'#forecast'},history:{replaceState(){}},window:{addEventListener(){},scrollTo(){}},
    fetch:fetchImpl,URL,AbortController,setTimeout,clearTimeout,console:{error(){}}});
  await vm.runInContext(source,context);
  return {get,context,inputs};
}
const success=()=>Promise.resolve({ok:true,json:async()=>structuredClone(experiment)});
(async()=>{
  const a=await app(success);
  assert.equal(a.get('#loaderror').hidden,true);
  assert.equal(a.get('#dashboard').hidden,false);
  assert.equal(a.get('#day').disabled,false);
  for(const c of experiment.cases)for(const model of ['ridge','forest']){
    a.context.args={model,x:c.x};const p=vm.runInContext('infer(args.model,args.x)',a.context);
    assert.ok(Math.abs(p-c.predictions[model])<1e-8,`${model} export parity ${c.date}`);
  }
  for(const [pm,index,label] of [[0,0,'Good'],[30,50,'Good'],[31,51,'Satisfactory'],[60,100,'Satisfactory'],[61,101,'Moderate'],[90,200,'Moderate'],[91,201,'Poor'],[120,300,'Poor'],[121,301,'Very poor'],[250,400,'Very poor'],[251,'401+','Severe']]){
    a.context.pm=pm;const v=vm.runInContext('subindex(pm)',a.context);assert.equal(v.value,index);assert.equal(v.label,label);
  }
  assert.match(a.get('#warning-rates').textContent,/Precision: 68.2%/);
  assert.match(a.get('#warning-rates').textContent,/Recall: 50.0%/);
  for(const threshold of [20,40,60,120]){
    a.get('#threshold').value=String(threshold);vm.runInContext('warningCounts()',a.context);
    const counts=[...a.get('#confusion').innerHTML.matchAll(/<b>(\d+)<\/b>/g)].map(m=>+m[1]);
    assert.equal(counts.reduce((s,n)=>s+n,0),365);
  }
  a.get('#scenario-date').value='318';vm.runInContext('resetScenario()',a.context);
  assert.equal(a.get('#scenario-pm').textContent,experiment.cases[318].predictions.ridge.toFixed(1));
  a.inputs.find(i=>i.dataset.feature==='wind_speed_10m').value='25';vm.runInContext('scenario()',a.context);
  assert.notEqual(a.get('#scenario-pm').textContent,experiment.cases[318].predictions.ridge.toFixed(1));
  a.inputs[0].value='';vm.runInContext('scenario()',a.context);assert.equal(a.get('#scenario-pm').textContent,'—');
  for(const [label,fetchImpl,message] of [
    ['HTTP 404',async()=>({ok:false,status:404}),/HTTP 404/],
    ['network offline',async()=>{throw Error('offline')},/during download/],
    ['invalid JSON',async()=>({ok:true,json:async()=>{throw SyntaxError('bad JSON')}}),/during parse/],
    ['invalid schema',async()=>({ok:true,json:async()=>({})}),/during validation/],
    ['timeout',async()=>{const e=Error('timeout');e.name='AbortError';throw e},/timed out/],
    ['prediction mismatch',async()=>{const e=structuredClone(experiment);e.cases[0].predictions.ridge+=1;return {ok:true,json:async()=>e}},/during model verification/],
    ['nonfinite feature',async()=>{const e=structuredClone(experiment);e.cases[0].x[0]=null;return {ok:true,json:async()=>e}},/during validation/]
  ]){
    const b=await app(fetchImpl);assert.equal(b.get('#loaderror').hidden,false,label);assert.equal(b.get('#dashboard').hidden,true,label);
    assert.equal(b.get('#day').disabled,true,label);assert.match(b.get('#load-error-detail').textContent,message,label);
    b.context.fetch=success;await b.get('#retry-load').events.click();assert.equal(b.get('#loaderror').hidden,true,`${label} retry`);
  }
  console.log('PASS: 730 model predictions; CPCB boundaries; warning counts/rates; scenarios; 7 failure modes and retry recovery.');
})().catch(e=>{console.error(e);process.exitCode=1});
