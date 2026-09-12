import { it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../server/src/app.js';
it('serves a health check without pretending feature endpoints exist', async () => {
  expect((await request(app).get('/api/health')).status).toBe(200);
  expect((await request(app).get('/api/products')).status).toBe(404);
});
