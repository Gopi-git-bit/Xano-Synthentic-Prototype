import { createServer } from 'node:http';
import gateway from '../api/gateway.mjs';

// Vite proxies /api here. No fixture authentication or Admin bypass exists.
createServer((req, res) => gateway(req, res)).listen(Number(process.env.API_PORT || 3001), '127.0.0.1', () => console.log('Zippy API adapter listening on loopback.'));
