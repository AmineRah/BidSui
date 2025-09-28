import { describe, it, expect, beforeEach, afterEach, vi } from '@jest/globals';
import { initializeSuiClient, getSuiClient, getPackageIds } from '../../services/suiClient.js';

// Mock Sui client
vi.mock('@mysten/sui/client', () => ({
  SuiClient: vi.fn().mockImplementation(() => ({
    getRpcApiVersion: vi.fn().mockResolvedValue('1.0.0'),
  })),
  getFullnodeUrl: vi.fn().mockReturnValue('https://testnet.sui.io'),
}));

describe('SuiClient Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('initializeSuiClient', () => {
    it('should initialize Sui client successfully', async () => {
      const client = await initializeSuiClient();
      
      expect(client).toBeDefined();
      expect(client.getRpcApiVersion).toBeDefined();
    });

    it('should use environment variables for configuration', async () => {
      process.env.SUI_NETWORK = 'devnet';
      process.env.SUI_RPC_URL = 'https://devnet.sui.io';
      
      const client = await initializeSuiClient();
      
      expect(client).toBeDefined();
    });
  });

  describe('getSuiClient', () => {
    it('should return initialized client', async () => {
      await initializeSuiClient();
      const client = getSuiClient();
      
      expect(client).toBeDefined();
    });

    it('should throw error if client not initialized', () => {
      expect(() => getSuiClient()).toThrow('Sui client not initialized');
    });
  });

  describe('getPackageIds', () => {
    it('should return package IDs from environment', () => {
      process.env.AUCTION_PACKAGE_ID = '0x123';
      process.env.SELLER_PACKAGE_ID = '0x456';
      process.env.BIDDER_PACKAGE_ID = '0x789';
      
      const packageIds = getPackageIds();
      
      expect(packageIds).toEqual({
        auction: '0x123',
        seller: '0x456',
        bidder: '0x789',
      });
    });

    it('should return empty strings if package IDs not set', () => {
      delete process.env.AUCTION_PACKAGE_ID;
      delete process.env.SELLER_PACKAGE_ID;
      delete process.env.BIDDER_PACKAGE_ID;
      
      const packageIds = getPackageIds();
      
      expect(packageIds).toEqual({
        auction: '',
        seller: '',
        bidder: '',
      });
    });
  });
});
