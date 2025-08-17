// Mock the OrdinalsService before importing the app
jest.mock('../services/ordinals.service', () => {
  return {
    OrdinalsService: jest.fn().mockImplementation(() => {
      return {
        fetchMetadata: jest.fn().mockResolvedValue({
          id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaai0',
          number: 12345,
          address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
          genesis_height: 100000,
          content_type: 'text/plain',
          content_length: 100
        }),
        fetchChildren: jest.fn().mockResolvedValue([]),
        fetchContent: jest.fn().mockResolvedValue('test content'),
        fetchTransaction: jest.fn().mockResolvedValue({
          id: 'test-tx-id',
          outputs: []
        })
      };
    })
  };
});

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

