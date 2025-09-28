# Frontend Updates - Smart Contract Integration

## 🎯 **Objectif**
Adapter le frontend pour qu'il corresponde exactement aux données nécessaires pour les smart contracts Sui.

## ✅ **Changements Effectués**

### 1. **Formulaire de Création d'Enchère** (`/app/sell/page.tsx`)

#### **Champs Adaptés aux Smart Contracts :**
- **Starting Price** → `minPrice` (prix minimum/départ)
- **Reserve Price** → `maxPrice` (prix maximum/réserve)
- **Duration** → `durationMs` (durée en millisecondes)
- **NFT Upload** → Upload d'image pour créer un NFT

#### **Nouvelle Logique :**
```typescript
// 1. Créer l'NFT d'abord via l'API
const nftResult = await apiService.createNFT(formData);

// 2. Créer l'enchère avec l'NFT
const auctionData: CreateAuctionRequest = {
  seller: account.address,
  nft: nftId,
  minPrice: parseFloat(auctionSettings.minPrice),
  maxPrice: parseFloat(auctionSettings.maxPrice),
  durationMs: getTotalDurationInMs(),
  name: productInfo.title,
  description: productInfo.description,
  signer: account.address,
};
```

### 2. **Service API** (`/lib/api.ts`)

#### **Endpoints Intégrés :**
- `POST /api/nfts/mint` - Créer un NFT
- `POST /api/auctions` - Créer une enchère
- `GET /api/auctions` - Récupérer les enchères
- `POST /api/auctions/:id/bid` - Placer un bid
- `POST /api/auctions/:id/end` - Terminer une enchère

#### **Types TypeScript :**
```typescript
interface CreateAuctionRequest {
  seller: string;
  nft: string;
  minPrice: number;
  maxPrice: number;
  durationMs: number;
  name: string;
  description: string;
  signer: string;
}
```

### 3. **Affichage des Enchères** (`/app/auctions/page.tsx`)

#### **Intégration Backend :**
- Récupération des enchères depuis le backend Sui
- Conversion des données backend vers le format d'affichage
- Fallback vers les enchères locales
- Indicateur de chargement

#### **Fonction de Conversion :**
```typescript
const convertBackendAuctionToDisplay = (auction: Auction): AuctionData => {
  return {
    id: auction.id,
    title: auction.name,
    description: auction.description,
    startingPrice: auction.minVal.toString(),
    reservePrice: auction.maxVal.toString(),
    currentBid: auction.currentBidAmount.toString(),
    // ... autres champs
  };
};
```

### 4. **Upload NFT**
- Interface d'upload d'image
- Prévisualisation de l'NFT
- Métadonnées NFT (nom, taille, type)
- Validation des fichiers

## 🔄 **Flux de Données**

### **Création d'Enchère :**
1. **Upload Image** → Création NFT via `/api/nfts/mint`
2. **Récupération NFT ID** → Utilisation pour l'enchère
3. **Création Enchère** → Via `/api/auctions` avec l'NFT ID
4. **Redirection** → Vers la page des enchères

### **Affichage des Enchères :**
1. **Chargement Backend** → Récupération via `/api/auctions`
2. **Conversion Format** → Adaptation pour l'affichage
3. **Combinaison** → Backend + données locales
4. **Rendu** → Interface utilisateur

## 🛠️ **Configuration**

### **Variables d'Environnement :**
```bash
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3001

# Sui Network
NEXT_PUBLIC_SUI_NETWORK=devnet
NEXT_PUBLIC_SUI_RPC_URL=https://fullnode.devnet.sui.io:443
```

### **Dépendances :**
- Service API centralisé
- Types TypeScript pour les données Sui
- Gestion d'erreurs robuste
- Fallback vers données locales

## 🎨 **Interface Utilisateur**

### **Améliorations :**
- **Upload NFT** avec prévisualisation
- **Métadonnées NFT** affichées
- **Validation en temps réel** des prix
- **Indicateurs de chargement**
- **Messages d'erreur** détaillés

### **Validation :**
- Prix de réserve > Prix de départ
- Upload d'image obligatoire
- Durée d'enchère valide
- Wallet connecté

## 🚀 **Prochaines Étapes**

1. **Page de Détail** - Adapter `/app/product/[id]/page.tsx`
2. **Système de Bids** - Intégrer les appels API
3. **WebSocket** - Mises à jour temps réel
4. **Tests** - Tests d'intégration
5. **Optimisation** - Performance et UX

## 📝 **Notes Techniques**

- **Type Safety** : Tous les appels API sont typés
- **Error Handling** : Gestion d'erreurs centralisée
- **Fallback** : Données locales en cas d'échec backend
- **Performance** : Chargement asynchrone optimisé
- **UX** : Indicateurs de progression et feedback utilisateur

Le frontend est maintenant parfaitement aligné avec les smart contracts Sui ! 🎉
