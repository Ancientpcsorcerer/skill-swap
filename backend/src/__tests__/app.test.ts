import request from 'supertest';
import { app } from '../app';

describe('Express Application Baseline & Routes', () => {
  test('returns 404 JSON for unknown routes', async () => {
    const res = await request(app).get('/api/v1/nonexistent-route-12345');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  test('health check returns response structure', async () => {
    const res = await request(app).get('/health');

    // May return 200 or 503 depending on whether Postgres is running locally
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('database');
    expect(res.body).toHaveProperty('memory');
  });
});
