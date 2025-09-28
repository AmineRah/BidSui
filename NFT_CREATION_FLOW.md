# Flux de Création NFT - BidSui

## 🎯 **Votre Question**

> "Mais ici il n'y a rien qui permet de créer réellement le NFT, non?"

**Vous aviez raison !** Il manquait effectivement la partie création NFT sur la blockchain. Voici ce qui se passe maintenant :

## 🔄 **Flux Complet NFT → Auction**

### **1. Frontend - Upload Image**
```typescript
// Dans le formulaire
const formData = new FormData();
formData.append('image', nftData.image);           // ← Image sélectionnée
formData.append('name', nftData.name);            // ← Nom NFT
formData.append('description', nftData.description); // ← Description
formData.append('signer', account.address);       // ← Wallet address

const nftResult = await apiService.createNFT(formData); // ← Appel API
```

### **2. Backend - Upload + Mint NFT**
```javascript
// POST /api/nfts/mint
router.post('/mint', upload.single('image'), async (req, res) => {
  // 1. Upload image sur le serveur
  const imageFile = req.file; // ← Image sauvegardée
  
  // 2. Créer NFT sur Sui blockchain
  const tx = createTransactionBlock();
  
  const [nft] = tx.moveCall({
    target: `${PACKAGE_ID}::ExampleNFT::create_nft`,
    arguments: [
      tx.pure.string(name),
      tx.pure.string(description),
      tx.pure.string(`/uploads/${imageFile.filename}`),
    ],
  });
  
  // 3. Transférer NFT au créateur
  tx.transferObjects([nft], signer);
  
  // 4. Exécuter transaction
  const result = await executeTransactionBlock(tx, signer);
  
  // 5. Retourner NFT ID
  res.json({
    success: true,
    data: { objectId: nftObjectId } // ← NFT créé sur blockchain
  });
});
```

### **3. Smart Contract - Création NFT**
```move
// ExampleNFT.move
public fun create_nft(
    name: String,
    description: String,
    image_url: String,
    ctx: &mut TxContext
): ExampleNFT {
    let nft = ExampleNFT {
        id: object::new(ctx),
        name,
        description,
        image_url,
        created_at: tx_context::epoch_timestamp_ms(ctx),
    };
    
    // Émettre événement de création
    event::emit(NFTCreated {
        nft_id: object::id(&nft),
        name,
        description,
        creator: tx_context::sender(ctx),
        created_at: tx_context::epoch_timestamp_ms(ctx),
    });
    
    nft
}
```

### **4. Frontend - Créer Auction avec NFT**
```typescript
// Après création NFT réussie
const nftId = nftResult.data.objectId; // ← ID NFT de la blockchain

const auctionData: CreateAuctionRequest = {
  seller: account.address,
  nft: nftId,                          // ← NFT ID de la blockchain
  minPrice: parseFloat(auctionSettings.minPrice),
  maxPrice: parseFloat(auctionSettings.maxPrice),
  durationMs: getTotalDurationInMs(),
  name: productInfo.title,
  description: productInfo.description,
  signer: account.address,
};

const auctionResult = await apiService.createAuction(auctionData);
```

### **5. Backend - Créer Auction**
```javascript
// POST /api/auctions
router.post('/', async (req, res) => {
  const { seller, nft, minPrice, maxPrice, durationMs, name, description, signer } = req.body;
  
  // Créer auction sur blockchain avec NFT
  const tx = createTransactionBlock();
  
  const [auction] = tx.moveCall({
    target: `${PACKAGE_ID}::Auction::create_auction`,
    arguments: [
      tx.object(nft),              // ← NFT créé précédemment
      tx.pure.u64(minPrice),
      tx.pure.u64(maxPrice),
      tx.pure.u64(durationMs),
      tx.pure.string(name),
      tx.pure.string(description),
    ],
  });
  
  const result = await executeTransactionBlock(tx, signer);
  
  res.json({
    success: true,
    data: { auction: auctionObject }
  });
});
```

## ✅ **Maintenant le NFT est Créé !**

### **Ce qui se passe :**

1. **📸 Upload Image** → Serveur backend
2. **🔗 Mint NFT** → Smart contract Sui (`ExampleNFT::create_nft`)
3. **🏷️ NFT ID** → Retourné au frontend
4. **🏆 Créer Auction** → Avec NFT ID (`Auction::create_auction`)
5. **✅ Auction Live** → NFT en vente sur la blockchain

### **Résultat :**
- ✅ **NFT réel** créé sur Sui blockchain
- ✅ **Image** uploadée et accessible
- ✅ **Métadonnées** stockées sur blockchain
- ✅ **Auction** créée avec NFT escrow
- ✅ **Propriétaire** confirmé (signer)

## 🎯 **Différence Avant/Après**

### **❌ Avant (Problème)**
```
Frontend → API /nfts/mint → ❌ 404 Not Found
```

### **✅ Après (Solution)**
```
Frontend → API /nfts/mint → Backend → Smart Contract → NFT sur Blockchain
```

## 🔧 **Fichiers Modifiés**

1. **`backend/src/routes/nft.js`** - Ajout endpoint `/mint`
2. **`move/sources/ExampleNFT.move`** - Module NFT smart contract
3. **Flux complet** - Upload → Mint → Auction

**Maintenant vous avez une vraie création NFT sur la blockchain Sui !** 🚀
