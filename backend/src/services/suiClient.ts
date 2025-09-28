import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { TransactionBlock } from '@mysten/sui/transactions';
import { 
  PackageIds, 
  SuiTransactionResult, 
  SuiObjectData, 
  SuiEvent,
  SuiObjectChange 
} from '../types/index.js';

// Global Sui client instance
let suiClient: SuiClient | null = null;

/**
 * Initialize Sui client based on environment configuration
 */
export async function initializeSuiClient(): Promise<SuiClient> {
  try {
    const network: string = process.env.SUI_NETWORK || 'devnet';
    const rpcUrl: string = process.env.SUI_RPC_URL || getFullnodeUrl(network);
    
    suiClient = new SuiClient({ url: rpcUrl });
    
    // Test connection
    const version = await suiClient.getRpcApiVersion();
    console.log(`Connected to Sui ${network} network, API version: ${version}`);
    
    return suiClient;
  } catch (error) {
    console.error('Failed to initialize Sui client:', error);
    throw error;
  }
}

/**
 * Get the initialized Sui client
 */
export function getSuiClient(): SuiClient {
  if (!suiClient) {
    throw new Error('Sui client not initialized. Call initializeSuiClient() first.');
  }
  return suiClient;
}

/**
 * Get package IDs from environment
 */
export function getPackageIds(): PackageIds {
  return {
    auction: process.env.AUCTION_PACKAGE_ID || '',
    seller: process.env.SELLER_PACKAGE_ID || '',
    bidder: process.env.BIDDER_PACKAGE_ID || '',
  };
}

/**
 * Create a new transaction block
 */
export function createTransactionBlock(): TransactionBlock {
  return new TransactionBlock();
}

/**
 * Execute a transaction block
 */
export async function executeTransactionBlock(tx: TransactionBlock, signer: any): Promise<SuiTransactionResult> {
  try {
    const client = getSuiClient();
    const result = await client.signAndExecuteTransactionBlock({
      transactionBlock: tx,
      signer,
      options: {
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
      },
    });
    
    return result as SuiTransactionResult;
  } catch (error) {
    console.error('Transaction execution failed:', error);
    throw error;
  }
}

/**
 * Get object details
 */
export async function getObject(objectId: string): Promise<SuiObjectData> {
  try {
    const client = getSuiClient();
    const result = await client.getObject({
      id: objectId,
      options: {
        showContent: true,
        showType: true,
        showOwner: true,
        showPreviousTransaction: true,
      },
    });
    
    return result as SuiObjectData;
  } catch (error) {
    console.error(`Failed to get object ${objectId}:`, error);
    throw error;
  }
}

/**
 * Get multiple objects
 */
export async function getObjects(objectIds: string[]): Promise<SuiObjectData[]> {
  try {
    const client = getSuiClient();
    const result = await client.multiGetObjects({
      ids: objectIds,
      options: {
        showContent: true,
        showType: true,
        showOwner: true,
        showPreviousTransaction: true,
      },
    });
    
    return result as SuiObjectData[];
  } catch (error) {
    console.error('Failed to get objects:', error);
    throw error;
  }
}

/**
 * Query objects by type
 */
export async function queryObjects(type, options = {}) {
  try {
    const client = getSuiClient();
    return await client.getObjectsOwnedByAddress({
      address: options.owner,
      options: {
        showContent: true,
        showType: true,
        showOwner: true,
      },
    });
  } catch (error) {
    console.error('Failed to query objects:', error);
    throw error;
  }
}

/**
 * Get events by type
 */
export async function getEvents(eventType, options = {}) {
  try {
    const client = getSuiClient();
    return await client.queryEvents({
      query: {
        EventType: eventType,
        ...options,
      },
      limit: options.limit || 50,
      order: options.order || 'desc',
    });
  } catch (error) {
    console.error('Failed to get events:', error);
    throw error;
  }
}

/**
 * Get balance for an address
 */
export async function getBalance(address, coinType = '0x2::sui::SUI') {
  try {
    const client = getSuiClient();
    return await client.getBalance({
      owner: address,
      coinType,
    });
  } catch (error) {
    console.error(`Failed to get balance for ${address}:`, error);
    throw error;
  }
}

/**
 * Get coin metadata
 */
export async function getCoinMetadata(coinType) {
  try {
    const client = getSuiClient();
    return await client.getCoinMetadata({ coinType });
  } catch (error) {
    console.error(`Failed to get coin metadata for ${coinType}:`, error);
    throw error;
  }
}

/**
 * Split coins
 */
export function splitCoins(tx, coin, amounts) {
  if (Array.isArray(amounts)) {
    return amounts.map(amount => tx.splitCoins(coin, [amount]));
  }
  return tx.splitCoins(coin, [amounts]);
}

/**
 * Merge coins
 */
export function mergeCoins(tx, primary, ...coins) {
  return tx.mergeCoins(primary, coins);
}

/**
 * Transfer objects
 */
export function transferObjects(tx, objects, recipient) {
  return tx.transferObjects(objects, recipient);
}

/**
 * Move call
 */
export function moveCall(tx, target, arguments = [], typeArguments = []) {
  return tx.moveCall({
    target,
    arguments,
    typeArguments,
  });
}
