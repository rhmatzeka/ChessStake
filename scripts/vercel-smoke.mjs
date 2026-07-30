const baseUrl = (process.env.E2E_BASE_URL || '').replace(/\/$/, '');

if (!baseUrl) {
  console.error('Set E2E_BASE_URL to the deployed Vercel URL.');
  process.exit(1);
}

const checks = [
  ['landing page', '/', (response) => response.status === 200],
  ['matches page', '/matches', (response) => response.status === 200],
  ['host page', '/host', (response) => response.status === 200],
  ['how-to-play page', '/how-to-play', (response) => response.status === 200],
  ['matches API', '/api/matches', (response) => response.status === 200],
  ['active game API', '/api/games/active', (response) => response.status === 200],
];

let failed = false;
for (const [name, path, predicate] of checks) {
  try {
    const response = await fetch(`${baseUrl}${path}`, { redirect: 'manual' });
    const body = await response.text();
    const passed = predicate(response) && body.length > 0;
    console.log(`${passed ? 'PASS' : 'FAIL'} ${name} (${response.status})`);
    if (!passed) failed = true;
  } catch (error) {
    failed = true;
    console.error(`FAIL ${name}: ${error instanceof Error ? error.message : error}`);
  }
}

process.exit(failed ? 1 : 0);
