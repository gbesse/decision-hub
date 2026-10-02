import assert from 'node:assert/strict';
import { createWorker } from '../dist/server/index.js';
import pack from '../dist/server/example-pack.js';
import { localDatabase } from '../scripts/local-database.mjs';

const database = localDatabase();
const worker = createWorker();
async function call(path, body, owner) {
  const response = await worker.fetch(new Request(`https://hub.example/api/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { origin: 'https://hub.example', 'content-type': 'application/json', ...(owner ? { 'oai-authenticated-user-id': owner } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  }), { DB: database });
  return { status: response.status, data: await response.json() };
}

try {
  const owner = 'example-owner';
  const saved = await call('policies', { pack }, owner);
  assert.equal(saved.status, 201);
  const report = await call('evaluations', {
    policyId: saved.data.id,
    states: [{ text: 'Private invoice for customer 123' }],
    mode: 'synthetic',
  }, owner);
  assert.equal(report.status, 201);
  const link = await call('share', { reportId: report.data.id }, owner);
  assert.equal(link.status, 201);
  const before = await call(`shared/${link.data.id}`);
  assert.equal(before.status, 200);
  assert.ok(!JSON.stringify(before.data).includes('Private invoice'));
  await call('share/revoke', { id: link.data.id }, owner);
  const after = await call(`shared/${link.data.id}`);
  assert.equal(after.status, 404);
  console.log(JSON.stringify({ reportId: report.data.id, sharedBeforeRevocation: before.status, sharedAfterRevocation: after.status, privateInputInSharedSummary: false }, null, 2));
} finally {
  database.close();
}
