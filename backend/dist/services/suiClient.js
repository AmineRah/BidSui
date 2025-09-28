"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSuiClient = initializeSuiClient;
exports.getSuiClient = getSuiClient;
exports.getPackageIds = getPackageIds;
exports.createTransactionBlock = createTransactionBlock;
exports.executeTransactionBlock = executeTransactionBlock;
exports.getObject = getObject;
exports.getObjects = getObjects;
exports.queryObjects = queryObjects;
exports.getEvents = getEvents;
exports.getBalance = getBalance;
exports.getCoinMetadata = getCoinMetadata;
exports.splitCoins = splitCoins;
exports.mergeCoins = mergeCoins;
exports.transferObjects = transferObjects;
exports.moveCall = moveCall;
const client_1 = require("@mysten/sui/client");
const transactions_1 = require("@mysten/sui/transactions");
let suiClient = null;
async function initializeSuiClient() {
    try {
        const network = process.env.SUI_NETWORK || 'devnet';
        const rpcUrl = process.env.SUI_RPC_URL || (0, client_1.getFullnodeUrl)(network);
        suiClient = new client_1.SuiClient({ url: rpcUrl });
        const version = await suiClient.getRpcApiVersion();
        console.log(`Connected to Sui ${network} network, API version: ${version}`);
        return suiClient;
    }
    catch (error) {
        console.error('Failed to initialize Sui client:', error);
        throw error;
    }
}
function getSuiClient() {
    if (!suiClient) {
        throw new Error('Sui client not initialized. Call initializeSuiClient() first.');
    }
    return suiClient;
}
function getPackageIds() {
    return {
        auction: process.env.AUCTION_PACKAGE_ID || '',
        seller: process.env.SELLER_PACKAGE_ID || '',
        bidder: process.env.BIDDER_PACKAGE_ID || '',
    };
}
function createTransactionBlock() {
    return new transactions_1.TransactionBlock();
}
async function executeTransactionBlock(tx, signer) {
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
        return result;
    }
    catch (error) {
        console.error('Transaction execution failed:', error);
        throw error;
    }
}
async function getObject(objectId) {
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
        return result;
    }
    catch (error) {
        console.error(`Failed to get object ${objectId}:`, error);
        throw error;
    }
}
async function getObjects(objectIds) {
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
        return result;
    }
    catch (error) {
        console.error('Failed to get objects:', error);
        throw error;
    }
}
async function queryObjects(type, options = {}) {
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
    }
    catch (error) {
        console.error('Failed to query objects:', error);
        throw error;
    }
}
async function getEvents(eventType, options = {}) {
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
    }
    catch (error) {
        console.error('Failed to get events:', error);
        throw error;
    }
}
async function getBalance(address, coinType = '0x2::sui::SUI') {
    try {
        const client = getSuiClient();
        return await client.getBalance({
            owner: address,
            coinType,
        });
    }
    catch (error) {
        console.error(`Failed to get balance for ${address}:`, error);
        throw error;
    }
}
async function getCoinMetadata(coinType) {
    try {
        const client = getSuiClient();
        return await client.getCoinMetadata({ coinType });
    }
    catch (error) {
        console.error(`Failed to get coin metadata for ${coinType}:`, error);
        throw error;
    }
}
function splitCoins(tx, coin, amounts) {
    if (Array.isArray(amounts)) {
        return amounts.map(amount => tx.splitCoins(coin, [amount]));
    }
    return tx.splitCoins(coin, [amounts]);
}
function mergeCoins(tx, primary, ...coins) {
    return tx.mergeCoins(primary, coins);
}
function transferObjects(tx, objects, recipient) {
    return tx.transferObjects(objects, recipient);
}
function moveCall(tx, target, arguments = [], typeArguments = []) {
    return tx.moveCall({
        target,
        arguments,
        typeArguments,
    });
}
//# sourceMappingURL=suiClient.js.map