/**
 * Service Worker Manager Tests
 * Tests the service worker manager functionality
 */

import { serviceWorkerManager } from '../service-worker-manager';

// Mock service worker APIs
const mockServiceWorker = {
  register: jest.fn(),
  addEventListener: jest.fn(),
  postMessage: jest.fn()
};

const mockRegistration = {
  scope: '/',
  active: {
    postMessage: jest.fn()
  },
  waiting: null,
  addEventListener: jest.fn(),
  pushManager: {
    subscribe: jest.fn(),
    getSubscription: jest.fn()
  }
};

// Mock global APIs
Object.defineProperty(global, 'navigator', {
  value: {
    serviceWorker: mockServiceWorker
  },
  writable: true
});

Object.defineProperty(global, 'Notification', {
  value: {
    requestPermission: jest.fn().mockResolvedValue('granted'),
    permission: 'default'
  },
  writable: true
});

Object.defineProperty(global, 'MessageChannel', {
  value: class MockMessageChannel {
    port1 = { onmessage: null };
    port2 = {};
  },
  writable: true
});

describe('ServiceWorkerManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockServiceWorker.register.mockResolvedValue(mockRegistration);
  });

  describe('initialization', () => {
    test('should register service worker successfully', async () => {
      await serviceWorkerManager.initialize();
      
      expect(mockServiceWorker.register).toHaveBeenCalledWith('/sw.js', {
        scope: '/'
      });
    });

    test('should throw error if service worker not supported', async () => {
      // Temporarily remove service worker support
      const originalNavigator = global.navigator;
      (global as any).navigator = {};
      
      await expect(serviceWorkerManager.initialize()).rejects.toThrow('Service Worker not supported');
      
      // Restore navigator
      global.navigator = originalNavigator;
    });
  });

  describe('focus mode integration', () => {
    test('should update focus mode status', async () => {
      await serviceWorkerManager.initialize();
      
      const focusMode = {
        isActive: true,
        sessionId: 'test-session',
        suppressNotifications: true,
        allowUrgentNotifications: true,
        whitelistedContacts: []
      };

      // Mock the message response
      setTimeout(() => {
        const messageChannel = new (global as any).MessageChannel();
        messageChannel.port1.onmessage({ data: { success: true } });
      }, 0);

      const result = await serviceWorkerManager.updateFocusMode(focusMode);
      expect(result).toEqual({ success: true });
    });
  });

  describe('notification scheduling', () => {
    test('should schedule notification successfully', async () => {
      await serviceWorkerManager.initialize();
      
      const notification = {
        title: 'Test Notification',
        body: 'This is a test notification',
        category: 'pomodoro' as const,
        priority: 'normal' as const
      };

      // Mock the message response
      setTimeout(() => {
        const messageChannel = new (global as any).MessageChannel();
        messageChannel.port1.onmessage({ data: { success: true } });
      }, 0);

      const result = await serviceWorkerManager.scheduleNotification(notification);
      expect(result).toEqual({ success: true });
    });
  });

  describe('push notifications', () => {
    test('should subscribe to push notifications', async () => {
      await serviceWorkerManager.initialize();
      
      const mockSubscription = {
        endpoint: 'https://example.com/push',
        keys: {}
      };
      
      mockRegistration.pushManager.subscribe.mockResolvedValue(mockSubscription);

      // Mock the message response
      setTimeout(() => {
        const messageChannel = new (global as any).MessageChannel();
        messageChannel.port1.onmessage({ 
          data: { success: true, subscription: mockSubscription } 
        });
      }, 0);

      const result = await serviceWorkerManager.subscribeToPush('test-vapid-key');
      expect(result.success).toBe(true);
    });

    test('should throw error if notification permission denied', async () => {
      (global as any).Notification.requestPermission.mockResolvedValue('denied');
      
      await expect(
        serviceWorkerManager.subscribeToPush('test-vapid-key')
      ).rejects.toThrow('Notification permission denied');
    });
  });

  describe('utility methods', () => {
    test('should detect standalone mode', () => {
      // Mock matchMedia
      Object.defineProperty(global, 'window', {
        value: {
          matchMedia: jest.fn().mockReturnValue({ matches: true }),
          navigator: { standalone: false }
        },
        writable: true
      });

      const isStandalone = serviceWorkerManager.isStandalone();
      expect(isStandalone).toBe(true);
    });

    test('should detect install capability', () => {
      Object.defineProperty(global, 'window', {
        value: {
          beforeinstallprompt: true
        },
        writable: true
      });

      const canInstall = serviceWorkerManager.canInstall();
      expect(canInstall).toBe(true);
    });
  });

  describe('event handling', () => {
    test('should add and remove event listeners', () => {
      const callback = jest.fn();
      
      serviceWorkerManager.on('test-event', callback);
      serviceWorkerManager.off('test-event', callback);
      
      // Event system is internal, so we just verify no errors occur
      expect(callback).not.toHaveBeenCalled();
    });
  });
});