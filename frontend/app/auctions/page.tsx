"use client";

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
  Filter,
  Search,
  Trash2,
  Sparkles,
  Grid3X3,
  ChevronDown,
  Flame,
  Star,
  Zap,
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { apiService, Auction } from "../../lib/api";
import { getActiveAuctions, AuctionData, deleteAuction } from "../lib/storage";
import { useCurrentAccount } from "@mysten/dapp-kit";

// Composant Badge simple
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

export default function BrowseAuctions() {
  // États pour la recherche et les filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [dateFilter, setDateFilter] = useState("newest");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [auctions, setAuctions] = useState<AuctionData[]>([]);
  const [backendAuctions, setBackendAuctions] = useState<Auction[]>([]);
  const [showNewAuctionMessage, setShowNewAuctionMessage] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [auctionToDelete, setAuctionToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const account = useCurrentAccount();

  // Fonction pour supprimer une enchère
  const handleDeleteAuction = (auctionId: string, event: React.MouseEvent) => {
    event.preventDefault(); // Empêcher la navigation vers la page de détail
    event.stopPropagation();

    if (!account) {
      alert("Please connect your wallet to delete this auction");
      return;
    }

    // Afficher le modal de confirmation
    setAuctionToDelete(auctionId);
    setShowDeleteModal(true);
  };

  const confirmDeleteAuction = () => {
    if (!auctionToDelete || !account) return;

    const success = deleteAuction(auctionToDelete, account.address);
    if (success) {
      // Recharger les enchères après suppression
      const activeAuctions = getActiveAuctions();
      setAuctions(activeAuctions);
      alert("Auction deleted successfully");
    } else {
      alert("Failed to delete auction or you don't have permission");
    }

    setShowDeleteModal(false);
    setAuctionToDelete(null);
  };

  // Charger les enchères au montage du composant
  useEffect(() => {
    const loadAuctions = async () => {
      try {
        setIsLoading(true);
        console.log("Loading auctions...");

        // Charger les enchères du backend
        const backendResult = await apiService.getAuctions();
        console.log("Backend result:", backendResult);

        if (backendResult.success && backendResult.data) {
          console.log("Setting backend auctions:", backendResult.data);
          setBackendAuctions(backendResult.data);
        } else {
          console.warn("Failed to load backend auctions:", backendResult.error);
          setBackendAuctions([]); // Set empty array if no data
        }

        // Charger les enchères locales (fallback)
        const localAuctions = getActiveAuctions();
        console.log("Local auctions:", localAuctions);
        setAuctions(localAuctions);
      } catch (error) {
        console.error("Failed to load auctions:", error);
        // Fallback vers les enchères locales
        const localAuctions = getActiveAuctions();
        setAuctions(localAuctions);
        setBackendAuctions([]); // Set empty array on error
      } finally {
        setIsLoading(false);
      }
    };

    loadAuctions();
  }, []);

  // Recharger les enchères quand la page devient visible (pour les nouvelles publications)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        try {
          // Recharger les enchères du backend
          const backendResult = await apiService.getAuctions();
          if (backendResult.success && backendResult.data) {
            const previousCount = backendAuctions.length;
            setBackendAuctions(backendResult.data);

            // Afficher un message si de nouvelles enchères ont été ajoutées
            if (backendResult.data.length > previousCount) {
              setShowNewAuctionMessage(true);
              setTimeout(() => setShowNewAuctionMessage(false), 5000);
            }
          }

          // Recharger les enchères locales aussi
          const localAuctions = getActiveAuctions();
          setAuctions(localAuctions);
        } catch (error) {
          console.error("Failed to reload auctions:", error);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [backendAuctions.length]);

  // Fermer le menu de filtre quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showFilterMenu) {
        const target = event.target as HTMLElement;
        if (!target.closest(".filter-menu-container")) {
          setShowFilterMenu(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilterMenu]);

  // Fonction pour convertir les enchères du backend vers le format d'affichage
  const convertBackendAuctionToDisplay = (auction: any): AuctionData => {
    console.log("Converting auction:", auction);

    // Handle different auction data structures
    const auctionData = auction.content?.fields || auction;
    const now = Date.now();

    // Calculate time left based on deadline
    const deadline =
      auctionData.deadLine ||
      auctionData.deadline ||
      Date.now() + 24 * 60 * 60 * 1000; // Default to 24h if no deadline
    const timeLeft = Math.max(0, deadline - now);
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

    return {
      id: auction.id || auctionData.id || auction.objectId,
      title: auctionData.name || auctionData.title || "Untitled Auction",
      description: auctionData.description || "No description available",
      category: auctionData.category || "NFT", // Use category from auction data
      tags: auctionData.tags || ["Sui", "NFT", "Blockchain"],
      images: auctionData.nftMetadata?.image
        ? [auctionData.nftMetadata.image]
        : [], // Use NFT metadata image
      mainImage: auctionData.mainImage || auctionData.nftMetadata?.image || "", // Use main image or NFT metadata
      startingPrice: (
        auctionData.minVal ||
        auctionData.minPrice ||
        0
      ).toString(),
      reservePrice: (
        auctionData.maxVal ||
        auctionData.maxPrice ||
        0
      ).toString(),
      currentBid: (
        auctionData.currentBidAmount ||
        auctionData.currentBid ||
        0
      ).toString(),
      duration: Math.floor(
        deadline - (auctionData.startTime || Date.now()),
      ).toString(),
      creator: auctionData.sellerId || auctionData.seller || "Unknown",
      createdAt: new Date(auctionData.startTime || Date.now()).toISOString(),
      status: auctionData.ended ? "ended" : auctionData.status || "active",
      timeLeft: timeLeft > 0 ? `${hours}h ${minutes}m` : "Ended",
      bidders: auctionData.currentBidderId ? 1 : 0,
    };
  };

  const categories = [
    "All",
    "Art",
    "Collectibles",
    "Gaming",
    "Music",
    "Sports",
    "Utility",
  ];

  // Combiner les enchères du backend et locales
  const allAuctions = [
    ...backendAuctions.map(convertBackendAuctionToDisplay),
    ...auctions,
  ];

  // Fonction de filtrage des enchères
  const filteredAuctions = allAuctions.filter((auction: any) => {
    const matchesSearch =
      auction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      auction.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || auction.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Fonction de tri par date
  const sortedAuctions = [...filteredAuctions].sort((a, b) => {
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();

    if (dateFilter === "newest") {
      return dateB - dateA; // Plus récent en premier
    } else {
      return dateA - dateB; // Plus ancien en premier
    }
  });

  const displayAuctions = sortedAuctions;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        {/* Animated Grid */}
        <div className="absolute inset-0 opacity-10">
          <div className="grid grid-cols-20 grid-rows-15 h-full">
            {Array.from({ length: 300 }).map((_, i) => (
              <div
                key={i}
                className="border border-blue-400/30 animate-pulse"
                style={{
                  animationDelay: `${i * 30}ms`,
                  animationDuration: `${4 + (i % 3)}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0 opacity-15">
          <div
            className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent animate-pulse"
            style={{ animationDuration: "4s" }}
          />
          <div
            className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-300/40 to-transparent animate-pulse"
            style={{ animationDuration: "5s", animationDelay: "1s" }}
          />
          <div
            className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/60 to-transparent animate-pulse"
            style={{ animationDuration: "6s", animationDelay: "2s" }}
          />
        </div>

        {/* Floating Dots */}
        <div className="absolute inset-0 opacity-20">
          <div
            className="absolute top-32 right-10 w-1 h-1 bg-blue-400 rounded-full animate-ping"
            style={{ animationDuration: "2s" }}
          />
          <div
            className="absolute top-52 left-16 w-1 h-1 bg-blue-300 rounded-full animate-pulse"
            style={{ animationDuration: "3s" }}
          />
          <div
            className="absolute top-72 right-1/4 w-1 h-1 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDuration: "4s" }}
          />
          <div
            className="absolute top-88 left-2/3 w-1 h-1 bg-blue-400 rounded-full animate-ping"
            style={{ animationDuration: "2.5s" }}
          />
        </div>
      </div>

      {/* Message de nouvelle enchère */}
      {showNewAuctionMessage && (
        <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-4 rounded-lg shadow-2xl border-l-4 border-blue-400 flex items-center space-x-3 animate-slide-in-right">
          <div className="text-2xl">🎉</div>
          <div>
            <div className="font-semibold">New Auction Added!</div>
            <div className="text-sm opacity-90">
              Check out the latest NFT auction
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="relative z-20 bg-slate-800/90 backdrop-blur-sm border-b border-slate-700/50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center transform hover:scale-110 transition-all duration-300">
                  <Grid3X3 className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-400 rounded-full animate-ping opacity-60" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-600 bg-clip-text text-transparent">
                Browse Auctions
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Discover and bid on amazing NFTs through our Dutch auction system
            </p>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-hover:text-blue-400 transition-colors" />
              <Input
                placeholder="Search auctions, collections, or creators..."
                className="pl-12 pr-4 py-4 bg-slate-700/50 backdrop-blur-sm border-slate-600/50 focus:border-blue-500 focus:ring-blue-500 text-white placeholder-gray-400 rounded-xl transition-all duration-300 hover:bg-slate-700/70"
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchTerm(e.target.value)
                }
              />
            </div>
            <div className="relative filter-menu-container">
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-3 py-2.5 rounded-lg shadow-lg hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 flex items-center gap-1.5 text-sm"
              >
                <Filter className="w-4 h-4" />
                Filter
                <ChevronDown className="w-4 h-4" />
              </button>

              {showFilterMenu && (
                <div className="absolute top-full left-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 min-w-[160px]">
                  <button
                    onClick={() => {
                      setDateFilter("newest");
                      setShowFilterMenu(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                      dateFilter === "newest"
                        ? "bg-blue-600 text-white"
                        : "text-gray-300 hover:bg-slate-700 hover:text-white"
                    }`}
                  >
                    Newest First
                  </button>
                  <button
                    onClick={() => {
                      setDateFilter("oldest");
                      setShowFilterMenu(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                      dateFilter === "oldest"
                        ? "bg-blue-600 text-white"
                        : "text-gray-300 hover:bg-slate-700 hover:text-white"
                    }`}
                  >
                    Oldest First
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-3 mb-8">
            {categories.map((category) => (
              <Button
                key={category}
                variant={category === selectedCategory ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className={`${
                  category === selectedCategory
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                    : "border-2 border-blue-400/50 text-blue-300 hover:bg-blue-600/20 hover:text-white bg-slate-800/50 backdrop-blur-sm hover:border-blue-400 transition-all duration-300 transform hover:scale-105"
                } rounded-xl px-6 py-3 font-medium`}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Auctions Grid */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <div className="text-white text-xl">Loading auctions...</div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayAuctions.length > 0 ? (
              displayAuctions.map((auction) => (
                <Link key={auction.id} href={`/product/${auction.id}`}>
                  <Card className="bg-slate-800/90 backdrop-blur-sm border-slate-700/50 shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer group transform hover:scale-105 hover:border-blue-500/50">
                    <div className="relative overflow-hidden">
                      {/* Image réelle ou placeholder */}
                      {"mainImage" in auction && auction.mainImage ? (
                        <img
                          src={auction.mainImage}
                          alt={auction.title}
                          className="w-full h-48 object-cover rounded-t-lg group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-t-lg flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-4xl mb-2">🎨</div>
                            <div className="text-blue-300 text-sm font-medium">
                              NFT Preview
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Status Badge */}
                      <Badge
                        className={`absolute top-3 right-3 ${
                          auction.status === "ended"
                            ? "bg-gray-500/90 text-white backdrop-blur-sm"
                            : "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg"
                        }`}
                      >
                        {auction.status === "ended" ? "Ended" : "Active"}
                      </Badge>

                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>

                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-white group-hover:text-blue-400 transition-colors">
                        {auction.title}
                      </CardTitle>
                      <CardDescription className="text-sm text-blue-400 font-medium">
                        {auction.category}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-0">
                      {/* Current Bid */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">
                            Current Bid
                          </span>
                          <span className="text-xl font-bold text-white">
                            {auction.currentBid ||
                              ("startingPrice" in auction
                                ? auction.startingPrice
                                : "0.00")}{" "}
                            SUI
                          </span>
                        </div>
                      </div>

                      {/* Auction Info */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-400">
                          <Clock className="w-4 h-4 mr-2 text-blue-400" />
                          <span>{auction.timeLeft} left</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-400">
                          <Users className="w-4 h-4 mr-2 text-purple-400" />
                          <span>{auction.bidders} bidders</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105">
                          <Zap className="w-4 h-4 mr-2" />
                          Place Bid
                        </Button>
                        <Button
                          variant="outline"
                          className="border-2 border-blue-400/50 text-blue-300 hover:bg-blue-600/20 hover:text-white bg-slate-700/50 backdrop-blur-sm rounded-xl transition-all duration-300 transform hover:scale-105"
                        >
                          <TrendingUp className="w-4 h-4" />
                        </Button>
                        {/* Bouton Delete pour le propriétaire */}
                        {account && auction.creator === account.address && (
                          <Button
                            onClick={(e: React.MouseEvent) =>
                              handleDeleteAuction(auction.id, e)
                            }
                            className="bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg hover:shadow-red-500/25 transition-all duration-300 transform hover:scale-105 border-2 border-red-400/50"
                            size="sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-16">
                <div className="text-8xl mb-6">🎨</div>
                <h3 className="text-2xl font-semibold text-white mb-4">
                  No auctions available yet
                </h3>
                <p className="text-gray-300 mb-6 max-w-md mx-auto">
                  Be the first to create an amazing NFT auction! Start by
                  uploading your digital artwork.
                </p>
                <Link href="/sell">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105">
                    Create Your First Auction
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Load More */}
        {!isLoading && displayAuctions.length > 9 && (
          <div className="text-center mt-12">
            <Button
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-slate-900 px-8 py-3"
              onClick={async () => {
                try {
                  // Recharger les enchères du backend
                  const backendResult = await apiService.getAuctions();
                  if (backendResult.success && backendResult.data) {
                    setBackendAuctions(backendResult.data);
                  }

                  // Recharger les enchères locales
                  const localAuctions = getActiveAuctions();
                  setAuctions(localAuctions);
                } catch (error) {
                  console.error("Failed to reload auctions:", error);
                }
              }}
            >
              Load More Auctions
            </Button>
          </div>
        )}
      </div>

      {/* Stats Section */}
      <div className="relative z-20 bg-slate-800/90 backdrop-blur-sm border-t border-slate-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-white mb-2">1,247</div>
              <div className="text-gray-300">Active Auctions</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">15,892</div>
              <div className="text-gray-300">Total Bids</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">2,456</div>
              <div className="text-gray-300">Successful Sales</div>
            </div>
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
                onClick={() => {
                  setShowDeleteModal(false);
                  setAuctionToDelete(null);
                }}
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
