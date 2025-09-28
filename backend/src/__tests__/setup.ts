// Test setup file
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Global test setup
beforeAll(() => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.SUI_NETWORK = 'testnet';
});

afterAll(() => {
  // Cleanup after all tests
});

// Global test utilities
export const testUtils = {
  // Add test utilities here
};
