/** In-memory product store for demos (not persistent). */

let nextId = 1;
const products = new Map();

function resetStore() {
  products.clear();
  nextId = 1;
}

function list() {
  return Array.from(products.values());
}

function getById(id) {
  return products.get(id) ?? null;
}

function create({ name, price, description = '' }) {
  const id = String(nextId++);
  const product = {
    id,
    name: String(name).trim(),
    price: Number(price),
    description: String(description).trim(),
  };
  products.set(id, product);
  return product;
}

function update(id, { name, price, description }) {
  const existing = products.get(id);
  if (!existing) {
    return null;
  }
  const updated = {
    ...existing,
    ...(name !== undefined && { name: String(name).trim() }),
    ...(price !== undefined && { price: Number(price) }),
    ...(description !== undefined && { description: String(description).trim() }),
  };
  products.set(id, updated);
  return updated;
}

function remove(id) {
  return products.delete(id);
}

module.exports = {
  resetStore,
  list,
  getById,
  create,
  update,
  remove,
};
