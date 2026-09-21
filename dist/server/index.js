// Purpose: Author the deployment-ready Worker directly: authenticated personal workspaces, finite Jev calls and revocable aggregate reports.
import {validatePack,validateState,validateAnswers,matches} from './decisionpack-validation.js';
import examplePack from './example-pack.js';
const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'}});
const error=(message,status=400)=>Object.assign(Error(message),{status});
const requireValue=(ok,message,status=400)=>{if(!ok)throw error(message,status);};
function canonical(value){return Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])])):value;}
export async function fingerprint(value){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(canonical(value)))))].map(b=>b.toString(16).padStart(2,'0')).join('');}
function validatePolicy(pack){validatePack(pack);requireValue(Object.keys(pack.questions).length<=5&&JSON.stringify(pack).length<=30000,'Policy exceeds five questions or 30 KB');requireValue(Object.values(pack.questions).every(q=>q.type==='choice'),'DecisionHub alpha supports Choice policies');return pack;}
function synthetic(pack,state){const text=JSON.stringify(state).toLowerCase(),answers={};for(const [id,q]of Object.entries(pack.questions)){const keys=Object.keys(q.criteria);const selected=keys.find(k=>/bill/.test(k)&&/charg|bill|invoice/.test(text))??keys.find(k=>/tech/.test(k)&&/api|error|crash/.test(text))??keys.at(-1);answers[id]={type:'choice',choice:selected,confidence:.8,probabilities:Object.fromEntries(keys.map(k=>[k,k===selected?.94:.06/(keys.length-1)]))};}return {model:pack.model,answers};}
async function infer(pack,state,{mode,apiKey,signal,fetchImpl}){
 const started=performance.now();let result;
 if(mode==='synthetic')result=synthetic(pack,state);
 else {
  const response=await fetchImpl('https://api.typesafe.ai/v1/systemone',{method:'POST',headers:{authorization:'Bearer '+apiKey,'content-type':'application/json'},body:JSON.stringify({model:pack.model,state,questions:pack.questions}),signal:AbortSignal.any([signal,AbortSignal.timeout(30000)]),redirect:'error'});
  requireValue(response.ok,'Jev HTTP '+response.status,502);
  // Bound the upstream response as well as the request; never log provider bodies or credentials.
  const reader=response.body.getReader();let size=0,parts=[];for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>250000){await reader.cancel();throw error('Jev response exceeds limit',502);}parts.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}result=JSON.parse(new TextDecoder().decode(bytes));
 }
 requireValue(result.model===pack.model,'Unexpected model',502);validateAnswers(pack.questions,result.answers);
 const rule=pack.rules.find(r=>r.all.every(p=>matches(p,{state,answers:result.answers})));
 return {schemaVersion:1,id:crypto.randomUUID(),timestamp:new Date().toISOString(),pack:{name:pack.name,version:pack.version,fingerprint:await fingerprint(pack)},questionFingerprint:await fingerprint({model:pack.model,questions:pack.questions}),model:pack.model,inputFingerprint:await fingerprint(state),answers:result.answers,outcome:rule?.outcome??pack.fallback,ruleId:rule?.id??null,latencyMs:Math.round(performance.now()-started)};
}
export function createWorker({fetchImpl=fetch}={}){return {async fetch(request,env){
 const url=new URL(request.url),path=url.pathname;
 try{
  if(!path.startsWith('/api/')){
    if(!env.ASSETS)return errorResponse('Static assets unavailable',503);
    const asset=await env.ASSETS.fetch(request),headers=new Headers(asset.headers);
    headers.set('content-security-policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; base-uri 'none'");headers.set('x-content-type-options','nosniff');headers.set('referrer-policy','no-referrer');
    return new Response(asset.body,{status:asset.status,headers});
  }
  if(request.method==='GET'&&path==='/api/me'){const id=request.headers.get('oai-authenticated-user-id');return json({authenticated:!!id,email:id?request.headers.get('oai-authenticated-user-email'):null});}
  if(request.method==='GET'&&path==='/api/demo'){const state={text:'I was charged twice'},record=await infer(examplePack,state,{mode:'synthetic'});return json({pack:examplePack,report:{id:null,mode:'synthetic',created:new Date().toISOString(),pack:examplePack,rows:[{state,record,status:'succeeded'}]}});}
  requireValue(env.DB,'Workspace database unavailable',503);
  if(request.method==='GET'&&/^\/api\/shared\/[a-f0-9]{64}$/.test(path)){const row=await env.DB.prepare('SELECT body FROM shares WHERE id=? AND expires>?').bind(path.split('/').at(-1),Date.now()).first();requireValue(row,'Link expired or revoked',404);return json(JSON.parse(row.body));}
  // The Sites dispatcher owns and authenticates these headers. Direct untrusted origins must not serve this Worker.
  const owner=request.headers.get('oai-authenticated-user-id');requireValue(owner,'Sign in with ChatGPT to open your workspace',401);
  if(request.method==='GET'&&path==='/api/workspace'){
   const policies=await env.DB.prepare('SELECT id,body FROM policies WHERE owner=? ORDER BY name,version LIMIT 100').bind(owner).all();
   const reports=await env.DB.prepare('SELECT id,created,body FROM reports WHERE owner=? ORDER BY created DESC LIMIT 30').bind(owner).all();
   return json({policies:policies.results.map(r=>({id:r.id,pack:JSON.parse(r.body)})),reports:reports.results.map(r=>{const d=JSON.parse(r.body);return {id:r.id,created:r.created,mode:d.mode,policy:d.pack.name,version:d.pack.version,count:d.rows.length};})});
  }
  if(request.method==='GET'&&/^\/api\/report\/[a-z0-9-]+$/.test(path)){const row=await env.DB.prepare('SELECT body FROM reports WHERE owner=? AND id=?').bind(owner,path.split('/').at(-1)).first();requireValue(row,'Report not found',404);return json(JSON.parse(row.body));}
  requireValue(request.method==='POST','Unknown route',404);
  requireValue(request.headers.get('origin')===url.origin,'Same-origin request required',403);
  requireValue(request.headers.get('content-type')?.startsWith('application/json'),'Send application/json',415);
  const reader=request.body?.getReader();requireValue(reader,'Body required');const chunks=[];let length=0;for(;;){const {done,value}=await reader.read();if(done)break;length+=value.length;requireValue(length<=150000,'Request exceeds 150 KB',413);chunks.push(value);}const bytes=new Uint8Array(length);let pos=0;for(const c of chunks){bytes.set(c,pos);pos+=c.length;}const body=JSON.parse(new TextDecoder().decode(bytes));
  if(path==='/api/policies'){
   const pack=validatePolicy(body.pack),id=await fingerprint(pack);
   const existing=await env.DB.prepare('SELECT id FROM policies WHERE owner=? AND name=? AND version=?').bind(owner,pack.name,pack.version).first();
   if(existing){requireValue(existing.id===id,'This policy version already has different content',409);return json({id,pack});}
   const inserted=await env.DB.prepare('INSERT OR IGNORE INTO policies(owner,id,name,version,body) SELECT ?,?,?,?,? WHERE (SELECT COUNT(*) FROM policies WHERE owner=?)<100 RETURNING id').bind(owner,id,pack.name,pack.version,JSON.stringify(pack),owner).first();
   requireValue(inserted,'Policy conflict or workspace limit reached (100 policies)',409);return json({id,pack},201);
  }
  if(path==='/api/evaluations'){
   const policy=await env.DB.prepare('SELECT body FROM policies WHERE owner=? AND id=?').bind(owner,body.policyId).first();requireValue(policy,'Policy not found',404);const pack=validatePolicy(JSON.parse(policy.body));
   requireValue(['synthetic','live'].includes(body.mode),'Choose synthetic or live mode');requireValue(Array.isArray(body.states)&&body.states.length>=1&&body.states.length<=10,'Provide 1–10 states');body.states.forEach(s=>validateState(pack,s));
   if(body.mode==='live')requireValue(typeof body.apiKey==='string'&&body.apiKey.length>10&&body.apiKey.length<=500,'Provide your Jev key for this request');
   const bucket=Math.floor(Date.now()/60000),amount=body.states.length;
   const reserved=await env.DB.prepare('INSERT INTO quotas(owner,bucket,used) VALUES(?,?,?) ON CONFLICT(owner,bucket) DO UPDATE SET used=used+excluded.used WHERE used+excluded.used<=30 RETURNING used').bind(owner,bucket,amount).first();requireValue(reserved,'Workspace limit: 30 evaluations per minute',429);
   const rows=[],deadline=AbortSignal.timeout(80000);
   for(const state of body.states){try{deadline.throwIfAborted();const record=await infer(pack,state,{mode:body.mode,apiKey:body.apiKey,signal:deadline,fetchImpl});rows.push({state,record,status:'succeeded'});}catch(e){const message=e.status?e.message:'Inference failed or exceeded its deadline';console.error('DecisionHub inference failure',e.name);rows.push({state,status:'failed',error:message});}}
   const report={schemaVersion:1,id:crypto.randomUUID(),created:new Date().toISOString(),pack,mode:body.mode,rows};
   await env.DB.prepare('INSERT INTO reports(owner,id,created,body) VALUES(?,?,?,?)').bind(owner,report.id,report.created,JSON.stringify(report)).run();return json(report,201);
  }
  if(path==='/api/share'){
   const row=await env.DB.prepare('SELECT body FROM reports WHERE owner=? AND id=?').bind(owner,body.reportId).first();requireValue(row,'Report not found',404);const report=JSON.parse(row.body),counts=Object.create(null);for(const r of report.rows){const key=r.status==='succeeded'?r.record.outcome:'failed';counts[key]=(counts[key]??0)+1;}
   const id=[...crypto.getRandomValues(new Uint8Array(32))].map(v=>v.toString(16).padStart(2,'0')).join(''),expires=Date.now()+7*86400000;
   const summary={schemaVersion:1,created:report.created,policy:report.pack.name,version:report.pack.version,mode:report.mode,counts,expires};
   await env.DB.prepare('INSERT INTO shares(owner,id,expires,body) VALUES(?,?,?,?)').bind(owner,id,expires,JSON.stringify(summary)).run();return json({id,expires,url:url.origin+'/?share='+id,summary},201);
  }
  if(path==='/api/share/revoke'){await env.DB.prepare('DELETE FROM shares WHERE owner=? AND id=?').bind(owner,body.id).run();return json({revoked:true});}
  throw error('Unknown route',404);
 }catch(e){if(e.status)return json({error:e.message},e.status);const trace=crypto.randomUUID();console.error('DecisionHub unexpected error',trace,e.name);return json({error:'Request failed; check input or retry. Reference '+trace},400);}
}};}
function errorResponse(message,status){return json({error:message},status);}
export default createWorker();
