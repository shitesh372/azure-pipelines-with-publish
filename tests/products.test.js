const request = require('supertest');
const { createApp } = require('../src/app');
const productStore = require('../src/productStore');

describe('Products API', () => {
  let app;

  beforeEach(() => {
    productStore.resetStore();
    app = createApp();
  });

  describe('GET /health', () => {
    it('returns ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok' });
    });
  });

  describe('GET /api/products', () => {
    it('returns empty list initially', async () => {
      const res = await request(app).get('/api/products');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('POST /api/products', () => {
    it('creates a product', async () => {
      const res = await request(app)
        .post('/api/products')
        .send({ name: 'Widget', price: 9.99, description: 'A widget' });
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        id: '1',
        name: 'Widget',
        price: 9.99,
        description: 'A widget',
      });
    });

    it('rejects missing name', async () => {
      const res = await request(app).post('/api/products').send({ price: 1 });
      expect(res.status).toBe(400);
    });

    it('rejects invalid price', async () => {
      const res = await request(app).post('/api/products').send({ name: 'X', price: 'nope' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/products/:id', () => {
    it('returns 404 when missing', async () => {
      const res = await request(app).get('/api/products/99');
      expect(res.status).toBe(404);
    });

    it('returns a product after create', async () => {
      const created = await request(app)
        .post('/api/products')
        .send({ name: 'A', price: 1 });
      const res = await request(app).get(`/api/products/${created.body.id}`);
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('A');
    });
  });

  describe('PUT /api/products/:id', () => {
    it('updates fields', async () => {
      const created = await request(app)
        .post('/api/products')
        .send({ name: 'Old', price: 5 });
      const res = await request(app)
        .put(`/api/products/${created.body.id}`)
        .send({ name: 'New', price: 10 });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ name: 'New', price: 10 });
    });

    it('returns 404 for unknown id', async () => {
      const res = await request(app).put('/api/products/xyz').send({ name: 'N', price: 1 });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('removes a product', async () => {
      const created = await request(app)
        .post('/api/products')
        .send({ name: 'Gone', price: 1 });
      const del = await request(app).delete(`/api/products/${created.body.id}`);
      expect(del.status).toBe(204);
      const get = await request(app).get(`/api/products/${created.body.id}`);
      expect(get.status).toBe(404);
    });
  });
});
