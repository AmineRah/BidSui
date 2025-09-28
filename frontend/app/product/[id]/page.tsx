"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCurrentAccount } from "@mysten/dapp-kit";
import {
  getAuctionById,
  AuctionData,
  addBidToHistoryWithWallet,
  getBidHistory,
  deleteAuction,
  BidHistory,
} from "../../lib/storage";
import { truncateWalletAddress } from "../../lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Clock,
  Users,
  TrendingUp,
  Heart,
  Share2,
  ArrowLeft,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Tag,
  DollarSign,
  Timer,
} from "lucide-react";

// Composant Badge simple (réutilisé)
const Badge = ({
  className,
  children,
  ...props
}: {
  className?: string;
  children: React.ReactNode;
  [key: string]: any;
}) => {
  return (
    <div
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const account = useCurrentAccount();
  const [product, setProduct] = useState<any>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [currentPrice, setCurrentPrice] = useState("0.00");
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [currentHighestBid, setCurrentHighestBid] = useState({
    price: "0.00",
  });
  const [auctionEnded, setAuctionEnded] = useState(false);
  const [winner, setWinner] = useState<any>(null);
  const [showVictoryAnimation, setShowVictoryAnimation] = useState(false);
  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      type: "success" | "error";
      message: string;
      timestamp: number;
    }>
  >([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bidHistory, setBidHistory] = useState<BidHistory[]>([]);

  // Données d'exemple pour le produit
  const mockProduct = {
    id: params.id,
    title: "Rare Sui NFT #001",
    image: "/api/placeholder/600/400",
    currentBid: "2.5 SUI",
    startingPrice: "5.0 SUI",
    reservePrice: "1.0 SUI",
    timeLeft: "2h 15m",
    bidders: 12,
    category: "Art",
    status: "active",
    description:
      "A unique digital artwork created on the Sui blockchain. This NFT represents the intersection of technology and creativity, featuring vibrant colors and abstract patterns that symbolize the decentralized future.",
    creator: "0x1234...5678",
    owner: "0x9876...5432",
    createdAt: "2024-01-15",
    views: 1247,
    likes: 89,
    tags: ["Digital Art", "Abstract", "Rare", "Sui Blockchain"],
    auctionHistory: [
      { bidder: "0x1111...2222", amount: "2.5 SUI", timestamp: "2h ago" },
      { bidder: "0x3333...4444", amount: "2.3 SUI", timestamp: "3h ago" },
      { bidder: "0x5555...6666", amount: "2.1 SUI", timestamp: "4h ago" },
    ],
  };

  useEffect(() => {
    const loadProduct = () => {
      const auctionId = params.id as string;
      const auctionData = getAuctionById(auctionId);

      if (auctionData) {
        // Utiliser les vraies données de l'enchère
        const productData: any = {
          ...auctionData,
          image: auctionData.mainImage || "/api/placeholder/600/400",
          creatorName: "Creator", // À améliorer avec un système d'utilisateurs
          currentBid:
            auctionData.currentBid || auctionData.startingPrice + " SUI",
          timeLeft: auctionData.timeLeft || "7d 0h",
          bidders: auctionData.bidders || 0,
          status: auctionData.status || "active",
          owner: auctionData.creator,
          views: Math.floor(Math.random() * 1000) + 100, // Simuler des vues
        };
        setProduct(productData);
        // Initialiser le currentPrice avec le reservePrice (max price)
        setCurrentPrice(productData.reservePrice);
        // Charger l'historique des enchères
        const history = getBidHistory(auctionId);
        setBidHistory(history);
        setIsLoading(false);
        setIsOwner(false); // À modifier selon la logique métier
      } else {
        // Fallback vers les données d'exemple si l'enchère n'existe pas
        setTimeout(() => {
          setProduct(mockProduct);
          // Initialiser le currentPrice avec le reservePrice (max price)
          setCurrentPrice(mockProduct.reservePrice);
          setIsLoading(false);
          setIsOwner(false);
        }, 1000);
      }
    };

    loadProduct();
  }, [params.id]);

  // Fonction pour ajouter une notification
  const addNotification = (type: "success" | "error", message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification = {
      id,
      type,
      message,
      timestamp: Date.now(),
    };

    setNotifications((prev) => [...prev, newNotification]);

    // Supprimer la notification après 3 secondes
    setTimeout(() => {
      setNotifications((prev) => prev.filter((notif) => notif.id !== id));
    }, 3000);
  };

  // Calculer la position du current highest bid sur l'échelle (min price à gauche, max price à droite)
  const highestBidPosition = product
    ? ((parseFloat(currentHighestBid.price) -
        parseFloat(product.startingPrice)) /
        (parseFloat(product.reservePrice) -
          parseFloat(product.startingPrice))) *
      100
    : 0;

  // Vérifier si l'enchère est terminée (seulement si ceiling = highest bid)
  const isAuctionEnded =
    parseFloat(currentHighestBid.price) > 0 &&
    parseFloat(currentPrice) <= parseFloat(currentHighestBid.price);

  // Animation de la Dutch Auction
  useEffect(() => {
    if (!product) return;

    const startingPrice = parseFloat(product.startingPrice);
    const reservePrice = parseFloat(product.reservePrice);
    const currentBid = parseFloat(currentPrice);

    // Calculer le pourcentage de progression (droite à gauche: max → min)
    const progress =
      ((startingPrice - currentBid) / (startingPrice - reservePrice)) * 100;
    setProgressPercentage(Math.max(0, Math.min(100, progress)));

    // Vérifier si l'enchère est terminée (seulement s'il y a un current highest bid)
    if (
      isAuctionEnded &&
      !auctionEnded &&
      parseFloat(currentHighestBid.price) > 0
    ) {
      setAuctionEnded(true);
      setShowVictoryAnimation(true);
      setWinner({
        address: "0x1234...5678",
        price: currentHighestBid.price,
        timestamp: new Date().toLocaleString(),
      });

      // L'animation reste affichée jusqu'à ce que l'utilisateur clique sur OK

      return;
    }

    // Continuer la diminution du prix seulement si l'enchère n'est pas terminée
    if (!isAuctionEnded && !auctionEnded) {
      const interval = setInterval(() => {
        setCurrentPrice((prev) => {
          const newPrice = parseFloat(prev) - 0.01;
          // Le prix peut continuer à diminuer même en dessous du prix de réserve
          return newPrice.toFixed(2);
        });
      }, 5000); // Diminution toutes les 5 secondes

      return () => clearInterval(interval);
    }
  }, [
    product,
    currentPrice,
    isAuctionEnded,
    auctionEnded,
    currentHighestBid.price,
  ]);

  // Fonction pour mettre à jour le current highest bid (pour les tests)
  const updateHighestBid = (newPrice: string) => {
    setCurrentHighestBid({ price: newPrice });
  };

  const handleDeleteAuction = () => {
    if (!account) {
      addNotification(
        "error",
        "Please connect your wallet to delete this auction",
      );
      return;
    }

    if (!product) {
      addNotification("error", "Auction not found");
      return;
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (product.creator !== account.address) {
      addNotification("error", "You can only delete your own auctions");
      return;
    }

    // Afficher le modal de confirmation
    setShowDeleteModal(true);
  };

  const confirmDeleteAuction = () => {
    const auctionId = Array.isArray(params.id) ? params.id[0] : params.id;
    if (!auctionId) {
      addNotification("error", "Auction ID not found");
      setShowDeleteModal(false);
      return;
    }
    const success = deleteAuction(auctionId, account?.address || "");
    if (success) {
      addNotification("success", "Auction deleted successfully");
      setShowDeleteModal(false);
      // Rediriger vers la page des enchères après suppression
      setTimeout(() => {
        router.push("/auctions");
      }, 2000);
    } else {
      addNotification("error", "Failed to delete auction");
      setShowDeleteModal(false);
    }
  };

  const handleBid = () => {
    // Vérifier si le wallet est connecté
    if (!account) {
      addNotification("error", "Please connect your wallet to place a bid");
      return;
    }

    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      addNotification("error", "Bid amount must be greater than 0");
      return;
    }

    if (bidAmount && parseFloat(bidAmount) > 0) {
      const bidValue = parseFloat(bidAmount);
      const currentHighestBidValue = parseFloat(currentHighestBid.price);
      const currentCeilingValue = parseFloat(currentPrice);
      const minPrice = parseFloat(product?.startingPrice || "0");
      const maxPrice = parseFloat(product?.reservePrice || "0");

      // Vérification que le bid est dans l'intervalle valide (entre min et max price)
      if (bidValue < minPrice) {
        addNotification(
          "error",
          `Bid must be at least ${minPrice} SUI (minimum price)`,
        );
      } else if (bidValue > maxPrice) {
        addNotification(
          "error",
          `Bid must be at most ${maxPrice} SUI (maximum price)`,
        );
      } else if (
        currentHighestBidValue > 0 &&
        bidValue <= currentHighestBidValue
      ) {
        // Animation d'erreur - bid trop basse
        addNotification(
          "error",
          `Bid must be strictly higher than current highest bid (${currentHighestBid.price} SUI)`,
        );
      } else if (bidValue > currentCeilingValue) {
        // Animation d'erreur - bid trop haute (dans une Dutch Auction, on ne peut pas bidder au-dessus du prix actuel)
        addNotification(
          "error",
          `Bid must be lower than or equal to current ceiling (${currentPrice} SUI)`,
        );
      } else {
        // Bid valide - entre highest bid et ceiling
        addNotification(
          "success",
          `Bid placed successfully! New highest bid: ${bidAmount} SUI`,
        );

        // Ajouter l'enchère à l'historique
        const auctionId = params.id as string;
        addBidToHistoryWithWallet(
          auctionId,
          account.address,
          bidAmount + " SUI",
        );

        // Mettre à jour l'historique local
        const newBid: BidHistory = {
          id: Math.random().toString(36).substr(2, 9),
          bidder: account.address,
          amount: bidAmount + " SUI",
          timestamp: "Just now",
          date: new Date(),
        };
        setBidHistory((prev) => [newBid, ...prev]);

        // Mettre à jour le current highest bid avec animation
        setTimeout(() => {
          setCurrentHighestBid({ price: bidAmount });
          setBidAmount("");
        }, 300);
      }
    }
  };

  const handleEdit = () => {
    // Redirection vers la page d'édition (pour les vendeurs)
    router.push(`/sell/edit/${params.id}`);
  };

  const handleDelete = () => {
    // Logique de suppression (pour les vendeurs)
    console.log("Deleting product");
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const copyToClipboard = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
      setShowShareModal(false);
    } catch (err) {
      console.error("Failed to copy: ", err);
      alert("Failed to copy link");
    }
  };

  if (isLoading || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading product details...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Background animé */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 opacity-10">
          <div className="grid grid-cols-20 grid-rows-15 h-full">
            {Array.from({ length: 300 }).map((_, i) => (
              <div
                key={i}
                className="border border-blue-400/30 animate-pulse"
                style={{
                  animationDelay: `${(i % 20) * 30}ms`,
                  animationDuration: `${4 + (i % 3)}s`,
                }}
              ></div>
            ))}
          </div>
        </div>
      </div>

      {/* Header avec navigation */}
      <div className="relative z-20 bg-slate-800/90 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-300 hover:text-white border-gray-600"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Auctions
            </Button>

            {/* Bouton de suppression - visible uniquement pour le propriétaire */}
            {account && product && product.creator === account.address && (
              <Button
                onClick={handleDeleteAuction}
                className="bg-red-600 hover:bg-red-700 text-white shadow-2xl border-2 border-red-400/50 transition-all duration-300 transform hover:scale-105"
                size="sm"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Auction
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Animation de victoire plein écran */}
      {showVictoryAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center space-y-6">
            <div className="animate-bounce">
              <div className="text-8xl">🎉</div>
              <div className="text-4xl font-bold text-white">Auction Won!</div>
              <div className="text-xl text-gray-300">
                Winner: {winner?.address}
              </div>
              <div className="text-lg text-green-400 font-semibold">
                Final Price: {winner?.price} SUI
              </div>
              <div className="text-sm text-gray-400">
                Transaction will be processed automatically
              </div>
            </div>
            <Button
              onClick={() => setShowVictoryAnimation(false)}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg font-semibold"
            >
              OK
            </Button>
          </div>
        </div>
      )}

      {/* Notifications empilées sans translation */}
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          className="fixed right-4 z-50 animate-fade-out"
          style={{
            top: `${16 + index * 80}px`, // 16px = top-4, puis +80px par notification
            zIndex: 50 + index,
          }}
        >
          <div
            className={`text-white px-6 py-4 rounded-lg shadow-lg border-l-4 flex items-center space-x-3 ${
              notification.type === "success"
                ? "bg-green-500 border-green-400"
                : "bg-red-500 border-red-400"
            }`}
          >
            <div className="text-2xl">
              {notification.type === "success" ? "✅" : "❌"}
            </div>
            <div>
              <div className="font-semibold">
                {notification.type === "success"
                  ? "Bid Placed Successfully!"
                  : "Bid Rejected"}
              </div>
              <div className="text-sm opacity-90">{notification.message}</div>
            </div>
          </div>
        </div>
      ))}

      {/* Modal de partage */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">
                Share Product
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-gray-300">
                Copy the link to share this NFT auction with others.
              </p>
              <div className="bg-slate-700 p-3 rounded border border-slate-600">
                <code className="text-sm text-gray-300 break-all">
                  {typeof window !== "undefined" ? window.location.href : ""}
                </code>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={copyToClipboard}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Copy Link
                </Button>
                <Button
                  onClick={() => setShowShareModal(false)}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-slate-700"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenu principal */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image et informations principales */}
          <div className="space-y-6">
            {/* Image du produit */}
            <Card className="bg-slate-800 border-slate-700 overflow-hidden">
              <div className="relative">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-96 object-cover"
                />
              </div>
            </Card>

            {/* Description du produit */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-2xl">
                  {product.title}
                </CardTitle>
                <CardDescription className="text-gray-300">
                  {product.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {product.tags.map((tag: any, index: number) => (
                    <Badge
                      key={index}
                      className="bg-blue-600/20 text-blue-300 border-blue-500"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1 text-gray-400 hover:text-blue-400 transition-all duration-300 ease-in-out hover:scale-110 transform"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Informations du propriétaire */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Owner Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Owner:</span>
                  <span className="text-white font-mono">
                    {truncateWalletAddress(product.creator)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Created:</span>
                  <span className="text-white">{product.createdAt}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Views:</span>
                  <span className="text-white">
                    {product.views.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Détails de l'enchère */}
          <div className="space-y-6">
            {/* Informations de l'enchère */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Dutch Auction Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Jauge de progression Dutch Auction */}
                <div className="space-y-4">
                  {/* Jauge visuelle avec prix aux extrémités */}
                  <div className="relative">
                    {/* Prix aux extrémités */}
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-left">
                        <div className="text-gray-400 text-xs">
                          STARTING PRICE
                        </div>
                        <div className="text-white font-bold text-lg">
                          {product.startingPrice}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-gray-400 text-xs">
                          RESERVE PRICE
                        </div>
                        <div className="text-white font-bold text-lg">
                          {product.reservePrice}
                        </div>
                      </div>
                    </div>

                    {/* Jauge avec indicateur de ceiling */}
                    <div className="relative">
                      <div className="w-full h-6 bg-slate-700 rounded-full overflow-hidden shadow-inner border-2 border-slate-600">
                        {/* Barre de progression qui suit le ceiling */}
                        <div
                          className={`h-full rounded-full transition-all duration-2000 ease-out relative ${
                            isAuctionEnded
                              ? "bg-gradient-to-r from-green-500 to-emerald-500"
                              : "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                          }`}
                          style={{
                            width: `${progressPercentage}%`,
                          }}
                        >
                          {/* Effet de brillance animé */}
                          <div
                            className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent ${
                              isAuctionEnded
                                ? "animate-bounce"
                                : "animate-pulse"
                            }`}
                          ></div>
                        </div>

                        {/* Indicateur de ceiling (ligne verticale) */}
                        <div
                          className="absolute top-0 w-1 h-full bg-white shadow-lg transition-all duration-2000 ease-out"
                          style={{
                            left: `${progressPercentage}%`,
                          }}
                        ></div>
                      </div>

                      {/* Marqueur du current highest bid - seulement s'il y en a un */}
                      {parseFloat(currentHighestBid.price) > 0 && (
                        <div
                          className="absolute -top-4 transform -translate-x-1/2"
                          style={{
                            left: `${Math.max(0, Math.min(100, highestBidPosition))}%`,
                          }}
                        >
                          <div className="w-2 h-2 bg-amber-300 rounded-full border border-white shadow-sm"></div>
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs font-bold">
                            {currentHighestBid.price} SUI
                            {/* Petite flèche pointant vers la jauge */}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-3 border-r-3 border-t-3 border-transparent border-t-amber-100"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Explication du marqueur - seulement s'il y a un current highest bid */}
                  {parseFloat(currentHighestBid.price) > 0 && (
                    <div className="text-center">
                      <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-medium">
                        <div className="w-2 h-2 bg-amber-300 rounded-full"></div>
                        Current Highest Bid (Fixed)
                      </div>
                    </div>
                  )}

                  {/* Ceiling qui évolue avec la jauge */}
                  <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                    {isAuctionEnded ? (
                      <div className="space-y-4">
                        <div className="text-green-400 text-sm mb-1 animate-pulse">
                          🎉 Auction Ended!
                        </div>
                        <div className="text-2xl font-bold text-white">
                          {currentPrice} SUI
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Final Price
                        </div>
                        {winner && (
                          <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm">
                            <div className="font-semibold">
                              Winner: {winner.address}
                            </div>
                            <div className="text-xs">
                              Won at: {winner.timestamp}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <div className="text-gray-400 text-sm mb-1">
                          Current Ceiling
                        </div>
                        <div className="text-2xl font-bold text-white">
                          {currentPrice} SUI
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Price decreases automatically
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Informations additionnelles */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Bidders:</span>
                    <span className="text-white">{product.bidders}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Time Left:</span>
                    <span className="text-white flex items-center gap-1">
                      <Timer className="w-4 h-4" />
                      {product.timeLeft}
                    </span>
                  </div>
                </div>

                {/* Statut de l'enchère */}
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Auction Status:</span>
                    <Badge
                      className={`${
                        isAuctionEnded
                          ? "bg-gray-500 text-white"
                          : product.status === "ended"
                            ? "bg-gray-500 text-white"
                            : "bg-green-500 text-white"
                      }`}
                    >
                      {isAuctionEnded
                        ? "Ended"
                        : product.status === "ended"
                          ? "Ended"
                          : "Active"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">
                    {isAuctionEnded
                      ? "Auction has ended. Winner has been determined!"
                      : "Price decreases automatically over time. First bidder to match current price wins!"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Section d'offre */}
            {!isOwner && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Place Your Bid</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="Enter bid amount"
                      value={bidAmount}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Ne permettre que les chiffres et un point décimal
                        if (value === "" || /^\d*\.?\d*$/.test(value)) {
                          setBidAmount(value);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleBid();
                        }
                      }}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                    <Button
                      onClick={handleBid}
                      disabled={!account}
                      className={`${
                        account
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-gray-500 text-gray-300 cursor-not-allowed"
                      }`}
                    >
                      {account ? "Place Bid" : "Connect Wallet"}
                    </Button>
                  </div>

                  {!account ? (
                    <p className="text-xs text-red-400">
                      ⚠️ Please connect your wallet to place a bid
                    </p>
                  ) : (
                    <p className="text-xs text-amber-400">
                      {parseFloat(currentHighestBid.price) > 0 ? (
                        <>
                          Your bid must be between{" "}
                          <span className="font-bold text-amber-300">
                            {product?.startingPrice} SUI
                          </span>{" "}
                          and{" "}
                          <span className="font-bold text-amber-300">
                            {product?.reservePrice} SUI
                          </span>
                          , strictly higher than current highest bid (
                          <span className="font-bold text-amber-300">
                            {currentHighestBid.price} SUI
                          </span>
                          ), and lower than or equal to current ceiling (
                          <span className="font-bold text-amber-300">
                            {currentPrice} SUI
                          </span>
                          )
                        </>
                      ) : (
                        <>
                          Your bid must be between{" "}
                          <span className="font-bold text-amber-300">
                            {product?.startingPrice} SUI
                          </span>{" "}
                          and{" "}
                          <span className="font-bold text-amber-300">
                            {product?.reservePrice} SUI
                          </span>
                          , and lower than or equal to current ceiling (
                          <span className="font-bold text-amber-300">
                            {currentPrice} SUI
                          </span>
                          )
                        </>
                      )}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Historique des enchères */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Bidding History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bidHistory.length > 0 ? (
                    bidHistory.map((bid, index) => (
                      <div
                        key={bid.id}
                        className="flex items-center justify-between py-2 border-b border-slate-700 last:border-b-0"
                      >
                        <div>
                          <div className="text-white font-mono text-sm">
                            {truncateWalletAddress(bid.bidder)}
                          </div>
                          <div className="text-gray-400 text-xs">
                            {bid.timestamp}
                          </div>
                        </div>
                        <div className="text-white font-semibold">
                          {bid.amount}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <div className="text-4xl mb-2">📈</div>
                      <p>No bids yet</p>
                      <p className="text-sm">Be the first to place a bid!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de confirmation de suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 border border-slate-700">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">
                Delete Auction
              </h3>
            </div>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this auction? This action cannot
              be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAuction}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
