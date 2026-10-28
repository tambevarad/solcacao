import { it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../server/src/app.js';

// No database is connected in this file, so readiness must be reported truthfully.
it('reports the database as unavailable until connectDb has succeeded', async () => {
  const response = await request(app).get('/api/health');
  expect(response.status).toBe(503);
  expect(response.body).toEqual({ data: { status: 'unavailable', database: 'disconnected' } });
});

it('answers unknown API paths with the standard 404 envelope', async () => {
  const response = await request(app).get('/api/not-a-feature');
  expect(response.status).toBe(404);
  expect(response.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

it('turns malformed JSON into a 400 VALIDATION_ERROR envelope without echoing the body', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .set('Content-Type', 'application/json')
    .send('{"email": "a@b.test", "password": ');
  expect(response.status).toBe(400);
  expect(response.body).toEqual({
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Invalid request',
      fieldErrors: { request: 'Malformed JSON' },
    },
  });
  expect(JSON.stringify(response.body)).not.toContain('a@b.test');
});

it('rejects an oversized JSON body with 413 and the standard envelope', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .set('Content-Type', 'application/json')
    .send(JSON.stringify({ email: 'a@b.test', password: 'x'.repeat(200_000) }));
  expect(response.status).toBe(413);
  expect(response.body.error.code).toBe('VALIDATION_ERROR');
});

it('exposes the catalog pagination headers to cross-origin clients', async () => {
  const response = await request(app).get('/api/health').set('Origin', 'http://localhost:5173');
  expect(response.headers['access-control-expose-headers']).toBe(
    'X-Page,X-Limit,X-Total-Count,X-Total-Pages',
  );
});
