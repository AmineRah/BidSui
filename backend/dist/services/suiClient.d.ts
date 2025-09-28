import { SuiClient } from '@mysten/sui/client';
import { TransactionBlock } from '@mysten/sui/transactions';
import { PackageIds, SuiTransactionResult, SuiObjectData } from '../types/index.js';
export declare function initializeSuiClient(): Promise<SuiClient>;
export declare function getSuiClient(): SuiClient;
export declare function getPackageIds(): PackageIds;
export declare function createTransactionBlock(): TransactionBlock;
export declare function executeTransactionBlock(tx: TransactionBlock, signer: any): Promise<SuiTransactionResult>;
export declare function getObject(objectId: string): Promise<SuiObjectData>;
export declare function getObjects(objectIds: string[]): Promise<SuiObjectData[]>;
export declare function queryObjects(type: any, options?: {}): Promise<any>;
export declare function getEvents(eventType: any, options?: {}): Promise<import("@mysten/sui/client").PaginatedEvents>;
export declare function getBalance(address: any, coinType?: string): Promise<import("@mysten/sui/client").CoinBalance>;
export declare function getCoinMetadata(coinType: any): Promise<import("@mysten/sui/client").CoinMetadata | null>;
export declare function splitCoins(tx: any, coin: any, amounts: any): any;
export declare function mergeCoins(tx: any, primary: any, ...coins: any[]): any;
export declare function transferObjects(tx: any, objects: any, recipient: any): any;
export declare function moveCall(tx: any, target: any, arguments?: never[], typeArguments?: never[]): any;
//# sourceMappingURL=suiClient.d.ts.map