const productStore = require('../src/productStore');

describe('productStore', () => {
  beforeEach(() => {
    productStore.resetStore();
  });

  it('create and list', () => {
    productStore.create({ name: 'A', price: 1 });
    expect(productStore.list()).toHaveLength(1);
  });

  it('getById returns null when missing', () => {
    expect(productStore.getById('missing')).toBeNull();
  });

  it('update returns null when missing', () => {
    expect(productStore.update('x', { name: 'n' })).toBeNull();
  });

  it('remove returns false when missing', () => {
    expect(productStore.remove('x')).toBe(false);
  });
});
