import handler from '../api/index.bundle.js';

if (typeof handler !== 'function') {
  throw new Error('Bundled API handler must export a default function.');
}

const response = {
  statusCode: 200,
  headers: {},
  body: '',
  setHeader(name, value) {
    this.headers[name.toLowerCase()] = value;
  },
  status(code) {
    this.statusCode = code;
    return this;
  },
  send(body) {
    this.body = body;
  },
};

await handler(
  {
    method: 'GET',
    url: '/api/leaderboard',
    headers: { host: 'localhost', 'x-forwarded-proto': 'http' },
  },
  response,
);

const payload = JSON.parse(response.body);

if (!response.headers['content-type']?.includes('application/json')) {
  throw new Error('Bundled API handler must return JSON.');
}

if (response.statusCode !== 503 || payload.error !== 'Leaderboard is not configured yet.') {
  throw new Error(`Unexpected bundled API response: ${response.statusCode} ${response.body}`);
}

console.log('API bundle verification passed.');
