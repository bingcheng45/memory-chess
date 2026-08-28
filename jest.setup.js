// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

if (typeof window !== "undefined") {
  // Mock the window.matchMedia function for responsive design tests
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  // Mock IntersectionObserver
  class MockIntersectionObserver {
    constructor(callback) {
      this.callback = callback;
    }
    observe() {
      return null;
    }
    unobserve() {
      return null;
    }
    disconnect() {
      return null;
    }
  }

  Object.defineProperty(window, "IntersectionObserver", {
    writable: true,
    value: MockIntersectionObserver,
  });

  // jsdom has no layout, so nothing ever changes size. Components that measure
  // themselves must render sensibly at a zero size, which is what this asserts
  // by never invoking the callback.
  class MockResizeObserver {
    observe() {
      return null;
    }
    unobserve() {
      return null;
    }
    disconnect() {
      return null;
    }
  }

  Object.defineProperty(window, "ResizeObserver", {
    writable: true,
    value: MockResizeObserver,
  });
  global.ResizeObserver = MockResizeObserver;
}

// Mock Audio
global.Audio = class {
  constructor() {
    return {
      play: jest.fn().mockImplementation(() => Promise.resolve()),
      pause: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
  }
};
