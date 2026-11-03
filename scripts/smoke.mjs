#!/usr/bin/env node
// Usage: node scripts/smoke.mjs <baseUrl>
const base = (process.argv[2] ?? "").replace(/\/+$/, "");
if (!base) {
  console.error("Usage: node scripts/smoke.mjs <baseUrl>");
  process.exit(1);
}

let failed = 0;
const fail = (msg) => {
  failed++;
  console.error(`FAIL ${msg}`);
};
const ok = (msg) => console.log(`ok   ${msg}`);

async function get(path) {
  const t0 = performance.now();
  const res = await fetch(base + path);
  const body = await res.text();
  return { res, body, ms: performance.now() - t0 };
}

for (const p of ["/", "/events", "/events/practice", "/rules", "/sponsor", "/leaderboard"]) {
  try {
    const { res, body } = await get(p);
    const type = res.headers.get("content-type") ?? "";
    if (res.status !== 200) fail(`GET ${p} returned ${res.status}, expected 200`);
    else if (!type.includes("text/html") || !body.includes("<html")) fail(`GET ${p} did not return HTML (${type})`);
    else ok(`GET ${p}`);
  } catch (e) {
    fail(`GET ${p} threw: ${e.message}`);
  }
}

const stateUrl = "/api/events/practice/state";
try {
  const { res, body } = await get(stateUrl);
  const json = JSON.parse(body);
  const cc = res.headers.get("cache-control") ?? "";
  if (res.status !== 200) fail(`GET ${stateUrl} returned ${res.status}`);
  else if (json.ok !== true) fail(`GET ${stateUrl} ok is not true`);
  else if (!json.data?.serverNow) fail(`GET ${stateUrl} has no data.serverNow`);
  else if (!cc.includes("s-maxage=1")) fail(`GET ${stateUrl} Cache-Control "${cc}" lacks s-maxage=1`);
  else ok(`GET ${stateUrl}`);
} catch (e) {
  fail(`GET ${stateUrl} threw: ${e.message}`);
}

try {
  const { res, body } = await get("/api/events");
  const json = JSON.parse(body);
  if (res.status !== 200 || json.ok !== true) fail(`GET /api/events returned ${res.status}, ok=${json.ok}`);
  else ok("GET /api/events");
} catch (e) {
  fail(`GET /api/events threw: ${e.message}`);
}

const times = [];
for (let n = 0; n < 20; n++) {
  try {
    const { res, ms } = await get(`${stateUrl}?t=${n}`);
    if (res.status !== 200) fail(`state call ${n} returned ${res.status}`);
    times.push(ms);
  } catch (e) {
    fail(`state call ${n} threw: ${e.message}`);
  }
}
if (times.length) {
  times.sort((a, b) => a - b);
  const q = (p) => times[Math.min(times.length - 1, Math.ceil(p * times.length) - 1)];
  const p50 = q(0.5);
  const p95 = q(0.95);
  console.log(`state endpoint over ${times.length} calls: p50 ${p50.toFixed(0)} ms, p95 ${p95.toFixed(0)} ms`);
  if (p95 >= 300) console.warn("WARN p95 is over the 300 ms target (the first call may include a cold start)");
}

if (failed) {
  console.error(`${failed} check(s) failed`);
  process.exit(1);
}
console.log("smoke passed");
