// Setup fake IndexedDB for Jest tests
require('fake-indexeddb/auto');

// Polyfill for structuredClone if not available
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj) => {
    return JSON.parse(JSON.stringify(obj));
  };
}