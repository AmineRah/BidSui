// Système de stockage local pour les enchères et images
export interface BidHistory {
  id: string;
  bidder: string;
  amount: string;
  timestamp: string;
  date: Date;
}

export interface AuctionData {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  images: string[];
  mainImage: string;
  startingPrice: string;
  reservePrice: string;
  duration: string;
  buyNowPrice?: string;
  status: 'draft' | 'active' | 'ended';
  createdAt: string;
  creator: string;
  currentBid?: string;
  bidders?: number;
  timeLeft?: string;
  bidHistory?: BidHistory[];
}

export interface StorageData {
  auctions: AuctionData[];
  nextId: number;
  walletUsernames: Record<string, string>; // Mapping wallet address -> username
}

// Fonction pour obtenir les données du localStorage
export const getStorageData = (): StorageData => {
  if (typeof window === 'undefined') {
    return { auctions: [], nextId: 1, walletUsernames: {} };
  }
  
  const stored = localStorage.getItem('suiBidAuctions');
  if (stored) {
    const data = JSON.parse(stored);
    // Assurer la compatibilité avec les anciennes données
    if (!data.walletUsernames) {
      data.walletUsernames = {};
    }
    return data;
  }
  return { auctions: [], nextId: 1, walletUsernames: {} };
};

// Fonction pour sauvegarder les données dans localStorage
export const saveStorageData = (data: StorageData): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('suiBidAuctions', JSON.stringify(data));
};

// Fonction pour ajouter une nouvelle enchère
export const addAuction = (auction: Omit<AuctionData, 'id' | 'createdAt' | 'status'>): string => {
  const data = getStorageData();
  const newAuction: AuctionData = {
    ...auction,
    id: `auction_${data.nextId}`,
    createdAt: new Date().toISOString(),
    status: 'active',
    currentBid: auction.startingPrice,
    bidders: 0,
    timeLeft: calculateTimeLeft(parseInt(auction.duration))
  };
  
  data.auctions.push(newAuction);
  data.nextId += 1;
  saveStorageData(data);
  
  return newAuction.id;
};

// Fonction pour obtenir toutes les enchères actives
export const getActiveAuctions = (): AuctionData[] => {
  const data = getStorageData();
  return data.auctions.filter(auction => auction.status === 'active');
};

// Fonction pour obtenir une enchère par ID
export const getAuctionById = (id: string): AuctionData | null => {
  const data = getStorageData();
  return data.auctions.find(auction => auction.id === id) || null;
};

// Fonction pour mettre à jour une enchère
export const updateAuction = (id: string, updates: Partial<AuctionData>): boolean => {
  const data = getStorageData();
  const index = data.auctions.findIndex(auction => auction.id === id);
  
  if (index !== -1) {
    data.auctions[index] = { ...data.auctions[index], ...updates };
    saveStorageData(data);
    return true;
  }
  return false;
};

// Fonction pour calculer le temps restant
const calculateTimeLeft = (durationDays: number): string => {
  const now = new Date();
  const endTime = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
  const diff = endTime.getTime() - now.getTime();
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

// Fonction pour ajouter une enchère à l'historique
export const addBidToHistory = (auctionId: string, bidder: string, amount: string): boolean => {
  const data = getStorageData();
  const auctionIndex = data.auctions.findIndex(auction => auction.id === auctionId);
  
  if (auctionIndex !== -1) {
    const bidId = Math.random().toString(36).substr(2, 9);
    const newBid: BidHistory = {
      id: bidId,
      bidder,
      amount,
      timestamp: formatTimeAgo(new Date()),
      date: new Date()
    };
    
    if (!data.auctions[auctionIndex].bidHistory) {
      data.auctions[auctionIndex].bidHistory = [];
    }
    
    data.auctions[auctionIndex].bidHistory!.unshift(newBid); // Ajouter au début
    data.auctions[auctionIndex].currentBid = amount;
    
    // Calculer le nombre de bidders uniques
    const uniqueBidders = new Set(data.auctions[auctionIndex].bidHistory!.map(bid => bid.bidder));
    data.auctions[auctionIndex].bidders = uniqueBidders.size;
    
    saveStorageData(data);
    return true;
  }
  return false;
};

// Fonction pour ajouter une enchère avec l'adresse du wallet
export const addBidToHistoryWithWallet = (auctionId: string, walletAddress: string, amount: string): boolean => {
  return addBidToHistory(auctionId, walletAddress, amount);
};

// Fonction pour obtenir l'historique des enchères
export const getBidHistory = (auctionId: string): BidHistory[] => {
  const auction = getAuctionById(auctionId);
  return auction?.bidHistory || [];
};

// Fonction pour formater le temps écoulé
const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

// Fonction pour initialiser des données de test (désactivée)
export const initializeTestData = (): void => {
  // Ne pas créer d'enchères de test
  // La fonction est vide pour que Browse Auctions reste vide
  return;
};

// Fonction pour vider toutes les enchères
export const clearAllAuctions = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('suiBidAuctions');
  }
};

// Fonction pour recalculer le nombre de bidders uniques pour toutes les enchères
export const recalculateUniqueBidders = (): void => {
  const data = getStorageData();
  
  data.auctions.forEach(auction => {
    if (auction.bidHistory && auction.bidHistory.length > 0) {
      const uniqueBidders = new Set(auction.bidHistory.map(bid => bid.bidder));
      auction.bidders = uniqueBidders.size;
    } else {
      auction.bidders = 0;
    }
  });
  
  saveStorageData(data);
};

// Fonction pour supprimer une enchère (uniquement par le propriétaire)
export const deleteAuction = (auctionId: string, walletAddress: string): boolean => {
  const data = getStorageData();
  const auctionIndex = data.auctions.findIndex(auction => auction.id === auctionId);
  
  if (auctionIndex !== -1) {
    const auction = data.auctions[auctionIndex];
    
    // Vérifier que le wallet est le propriétaire de l'enchère
    if (auction.creator !== walletAddress) {
      return false; // Pas autorisé à supprimer
    }
    
    // Supprimer l'enchère
    data.auctions.splice(auctionIndex, 1);
    saveStorageData(data);
    return true;
  }
  
  return false;
};

// Fonction pour obtenir ou créer un nom d'utilisateur pour un wallet
export const getUsernameForWallet = (walletAddress: string): string => {
  const data = getStorageData();
  
  if (data.walletUsernames[walletAddress]) {
    return data.walletUsernames[walletAddress];
  }
  
  // Générer un nouveau nom d'utilisateur
  const username = 'user_' + Math.random().toString(36).substr(2, 9);
  data.walletUsernames[walletAddress] = username;
  saveStorageData(data);
  
  return username;
};

// Fonction pour obtenir le nom d'utilisateur d'un wallet
export const getWalletUsername = (walletAddress: string): string | null => {
  const data = getStorageData();
  return data.walletUsernames[walletAddress] || null;
};

// Fonction pour simuler un créateur (pour les tests)
export const getCurrentUser = (): string => {
  return 'user_' + Math.random().toString(36).substr(2, 9);
};
