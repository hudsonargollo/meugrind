import 'fake-indexeddb/auto';

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// Mock window.addEventListener for online/offline events
const originalAddEventListener = window.addEventListener;
(window as any).addEventListener = jest.fn((event: string, handler: any) => {
  if (event === 'online' || event === 'offline') {
    // Store handlers for manual triggering in tests
    return;
  }
  return originalAddEventListener.call(window, event, handler);
});