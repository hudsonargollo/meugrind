// Mock implementation of uuid for Jest tests
let counter = 0;

const v4 = () => {
  counter++;
  return `mock-uuid-${counter.toString().padStart(4, '0')}`;
};

// CommonJS exports for Jest compatibility
module.exports = {
  v4
};

// Also support named exports
module.exports.v4 = v4;