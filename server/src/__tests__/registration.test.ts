import request from 'supertest';
import app from '../index';

describe('Registration routes (Phase 0 placeholders)', () => {
  it('GET /api/registration/status/:id returns 400 for bad id', async () => {
    const res = await request(app).get('/api/registration/status/not-an-id');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('GET /api/registration/status/:id returns mock shape for valid id', async () => {
    const res = await request(app).get(
      '/api/registration/status/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaai0',
    );
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('isRegistered');
    expect(res.body).toHaveProperty('lastRegistration');
    expect(res.body).toHaveProperty('integrity');
  });

  it('POST /api/registration/create returns fee and creatorAddr', async () => {
    const res = await request(app).post('/api/registration/create').send({});
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('fee');
    expect(res.body).toHaveProperty('creatorAddr');
    expect(res.body).toHaveProperty('instructions');
  });
});

