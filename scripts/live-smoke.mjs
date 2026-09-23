// Purpose: Make one opt-in live Jev request through the exact Worker path and prove the API key is not persisted.
import assert from 'node:assert/strict';
import {createWorker} from '../dist/server/index.js';
import examplePack from '../dist/server/example-pack.js';
import {localDatabase} from './local-database.mjs';

const apiKey=process.env.TYPESAFE_API_KEY;
if(!apiKey){
 console.error('live-smoke: TYPESAFE_API_KEY is not set; no request made.');
 process.exit(0);
}

const origin='http://127.0.0.1';
const owner='decision-hub-live-smoke';
const DB=localDatabase();
const worker=createWorker();

async function post(path,body){
 const response=await worker.fetch(new Request(origin+path,{
  method:'POST',
  headers:{'content-type':'application/json',origin,'oai-authenticated-user-id':owner},
  body:JSON.stringify(body)
 }),{DB});
 return {status:response.status,data:await response.json()};
}

try{
 const policy=await post('/api/policies',{pack:examplePack});
 assert.equal(policy.status,201,policy.data.error);
 const report=await post('/api/evaluations',{
  policyId:policy.data.id,
  states:[{text:'I was charged twice and need the duplicate charge reviewed.'}],
  mode:'live',
  apiKey
 });
 assert.equal(report.status,201,report.data.error);
 assert.equal(report.data.rows.length,1);
 const row=report.data.rows[0];
 assert.equal(row.status,'succeeded',row.error);
 assert.equal(row.record.model,examplePack.model);
 const stored=DB.db.prepare('SELECT body FROM reports WHERE owner=? AND id=?').get(owner,report.data.id);
 assert.ok(stored);
 assert.equal(stored.body.includes(apiKey),false,'the request-scoped API key was persisted');
 process.stdout.write(JSON.stringify({
  model:row.record.model,
  outcome:row.record.outcome,
  ruleId:row.record.ruleId,
  latencyMs:row.record.latencyMs,
  keyPersisted:false,
  requests:1
 },null,2)+'\n');
}catch(error){
 console.error(`live-smoke: failed: ${error instanceof Error?error.message:String(error)}`);
 process.exitCode=1;
}finally{
 DB.close();
}
