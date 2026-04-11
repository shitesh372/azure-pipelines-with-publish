const express = require('express');
const productStore = require('./productStore');

function createApp() {
  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/products', (_req, res) => {
    res.json(productStore.list());
  });

  app.get('/api/products/:id', (req, res) => {
    const product = productStore.getById(req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(product);
  });

  app.post('/api/products', (req, res) => {
    const { name, price, description } = req.body ?? {};
    if (name === undefined || name === '' || price === undefined || Number.isNaN(Number(price))) {
      res.status(400).json({ error: 'name and numeric price are required' });
      return;
    }
    const product = productStore.create({ name, price, description });
    res.status(201).json(product);
  });

  app.put('/api/products/:id', (req, res) => {
    const { name, price, description } = req.body ?? {};
    const updated = productStore.update(req.params.id, { name, price, description });
    if (!updated) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(updated);
  });

  app.delete('/api/products/:id', (req, res) => {
    const deleted = productStore.remove(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.status(204).send();
  });

  return app;
}

module.exports = { createApp };
