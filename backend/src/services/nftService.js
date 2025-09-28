import { 
  getSuiClient, 
  createTransactionBlock, 
  executeTransactionBlock,
  getObject
} from './suiClient.js';

/**
 * NFT Service - Handles on-chain NFT creation and management
 */
export class NFTService {
  constructor() {
    this.client = getSuiClient();
  }

  /**
   * Create a new NFT on-chain
   */
  async createNFT(params) {
    const {
      name,
      description,
      imageUrl,
      signer
    } = params;

    try {
      console.log('Creating NFT on-chain with params:', { name, description, imageUrl });
      
      const tx = createTransactionBlock();
      
      // Create NFT using Sui's built-in NFT capabilities
      // We'll use the display object to store metadata
      const [nft] = tx.moveCall({
        target: '0x2::nft::mint',
        arguments: [
          tx.pure.string(name),
          tx.pure.string(description),
          tx.pure.string(imageUrl),
          tx.pure.address(signer),
        ],
      });

      // Transfer NFT to the creator
      tx.transferObjects([nft], signer);

      const result = await executeTransactionBlock(tx, signer);
      
      console.log('NFT creation result:', result);
      
      // Find the created NFT object
      const nftObject = result.objectChanges?.find(
        change => change.type === 'created' && change.objectType?.includes('nft')
      );

      if (!nftObject) {
        throw new Error('NFT object not found in transaction result');
      }

      return {
        success: true,
        transactionDigest: result.digest,
        nft: {
          objectId: nftObject.objectId,
          type: nftObject.objectType,
          version: nftObject.version,
          digest: nftObject.digest,
        },
        events: result.events,
      };
    } catch (error) {
      console.error('Failed to create NFT:', error);
      throw new Error(`Failed to create NFT: ${error.message}`);
    }
  }

  /**
   * Get NFT details
   */
  async getNFTDetails(nftId) {
    try {
      const nft = await getObject(nftId);
      
      if (!nft.data) {
        throw new Error('NFT not found');
      }

      return {
        id: nft.data.objectId,
        type: nft.data.type,
        owner: nft.data.owner,
        content: nft.data.content,
        previousTransaction: nft.data.previousTransaction,
      };
    } catch (error) {
      console.error('Failed to get NFT details:', error);
      throw new Error(`Failed to get NFT details: ${error.message}`);
    }
  }

  /**
   * Get NFTs owned by an address
   */
  async getNFTsByOwner(ownerAddress) {
    try {
      const objects = await this.client.getObjectsOwnedByAddress({
        address: ownerAddress,
        options: {
          showContent: true,
          showType: true,
          showOwner: true,
        },
      });

      return objects.filter(obj => 
        obj.type?.includes('nft') || obj.type?.includes('NFT')
      );
    } catch (error) {
      console.error('Failed to get NFTs by owner:', error);
      throw new Error(`Failed to get NFTs by owner: ${error.message}`);
    }
  }
}
