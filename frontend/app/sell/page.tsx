"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { truncateWalletAddress } from "../lib/utils";
import { apiService, CreateAuctionRequest } from "../../lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Upload,
  X,
  Plus,
  Eye,
  Save,
  ArrowLeft,
  Image as ImageIcon,
  FileText,
  Settings,
  DollarSign,
  Clock,
  Tag,
  Sparkles,
  Zap,
  Star,
  Flame,
  Palette,
  Rocket,
} from "lucide-react";

export default function CreateAuctionPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const account = useCurrentAccount();

  // États pour les images
  const [images, setImages] = useState<string[]>([]);
  const [mainImage, setMainImage] = useState<string | null>(null);

  // États pour les informations du produit
  const [productInfo, setProductInfo] = useState({
    title: "",
    description: "",
    category: "",
    tags: [] as string[],
    currentTag: "",
  });

  // États pour les paramètres d'enchères (adaptés aux smart contracts)
  const [auctionSettings, setAuctionSettings] = useState({
    minPrice: "", // Prix minimum (prix de départ) - Starting Price
    maxPrice: "", // Prix maximum (prix de réserve) - Reserve Price
    duration: {
      days: 0,
      hours: 0,
      minutes: 0,
    },
  });

  // État pour l'NFT
  const [nftData, setNftData] = useState({
    name: "",
    description: "",
    image: null as File | null,
    imageUrl: "",
    metadata: {},
  });

  // États pour l'interface
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [cancelUpload, setCancelUpload] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      type: "success" | "error" | "info";
      message: string;
      timestamp: number;
    }>
  >([]);

  // Fonction pour ajouter une notification
  const addNotification = (
    type: "success" | "error" | "info",
    message: string,
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification = {
      id,
      type,
      message,
      timestamp: Date.now(),
    };

    setNotifications((prev) => [...prev, newNotification]);

    // Supprimer automatiquement la notification après 3 secondes
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  };

  // Fonction pour calculer la durée totale en millisecondes (requis par les smart contracts)
  const getTotalDurationInMs = () => {
    return (
      auctionSettings.duration.days * 24 * 60 * 60 * 1000 +
      auctionSettings.duration.hours * 60 * 60 * 1000 +
      auctionSettings.duration.minutes * 60 * 1000
    );
  };

  // Fonction pour calculer la durée totale en minutes (pour l'affichage)
  const getTotalDurationInMinutes = () => {
    return (
      auctionSettings.duration.days * 24 * 60 +
      auctionSettings.duration.hours * 60 +
      auctionSettings.duration.minutes
    );
  };

  // Fonction pour formater la durée
  const formatDuration = () => {
    const { days, hours, minutes } = auctionSettings.duration;
    let result = [];
    if (days > 0) result.push(`${days} day${days > 1 ? "s" : ""}`);
    if (hours > 0) result.push(`${hours} hour${hours > 1 ? "s" : ""}`);
    if (minutes > 0) result.push(`${minutes} minute${minutes > 1 ? "s" : ""}`);
    return result.join(", ") || "0 minutes";
  };

  // Gestion de l'upload d'image NFT
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setIsUploading(true);

      // Sauvegarder le fichier pour l'upload NFT
      setNftData((prev) => ({
        ...prev,
        image: file,
        name: file.name.split(".")[0], // Utiliser le nom du fichier comme nom NFT par défaut
      }));

      // Afficher l'image en prévisualisation
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setNftData((prev) => ({ ...prev, imageUrl: result }));
        setImages([result]); // Une seule image pour un NFT
        setMainImage(result);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    if (mainImage === images[index]) {
      setMainImage(newImages[0] || null);
    }

    // Réinitialiser les données NFT
    setNftData({
      name: "",
      description: "",
      image: null,
      imageUrl: "",
      metadata: {},
    });
  };

  const setAsMainImage = (image: string) => {
    setMainImage(image);
  };

  // Gestion des tags
  const addTag = () => {
    if (
      productInfo.currentTag.trim() &&
      !productInfo.tags.includes(productInfo.currentTag.trim())
    ) {
      setProductInfo((prev) => ({
        ...prev,
        tags: [...prev.tags, prev.currentTag.trim()],
        currentTag: "",
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setProductInfo((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  // Sauvegarde et prévisualisation
  const handleSave = () => {
    // Validation des champs obligatoires
    if (
      !productInfo.title ||
      !productInfo.description ||
      !auctionSettings.maxPrice ||
      !auctionSettings.minPrice
    ) {
      alert("Please fill in all required fields");
      return;
    }

    // Image validation temporarily disabled
    // if (images.length === 0) {
    //   alert("Please upload at least one image");
    //   return;
    // }

    // Logique de sauvegarde (draft)
    console.log("Saving product:", { productInfo, auctionSettings, images });
    addNotification("success", "Draft saved successfully!");
  };

  // Fonction pour créer l'NFT et l'enchère via le backend
  const createNFTAndAuction = async () => {
    if (!account || !nftData.image) {
      console.error("Missing account or NFT image");
      return;
    }

    try {
      setIsUploading(true);
      setCancelUpload(false);
      setUploadProgress("Creating NFT...");
      addNotification("info", "Creating NFT...");
      console.log("Starting NFT creation process...");

      // 1. Créer l'NFT d'abord
      const formData = new FormData();
      formData.append("image", nftData.image);
      formData.append("name", nftData.name || productInfo.title);
      formData.append(
        "description",
        nftData.description || productInfo.description,
      );
      formData.append("signer", account.address);

      console.log("Sending NFT creation request...");
      console.log("FormData entries:", Array.from(formData.entries()));
      console.log(
        "API Base URL:",
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
      );

      // Test direct fetch first
      try {
        console.log("Testing direct fetch to backend...");
        const testResponse = await fetch("http://localhost:3001/api/health", {
          method: "GET",
        });
        console.log("Health check response:", testResponse.status);
      } catch (testError) {
        console.error("Health check failed:", testError);
        throw new Error("Cannot connect to backend server");
      }

      const nftResult = await apiService.createNFT(formData);
      console.log("NFT creation result:", nftResult);

      if (!nftResult.success || !nftResult.data) {
        throw new Error(nftResult.error || "Failed to create NFT");
      }

      setUploadProgress("NFT created! Creating auction...");
      addNotification(
        "success",
        "NFT created successfully! Creating auction...",
      );

      // 2. Créer l'enchère avec l'NFT
      const auctionData: CreateAuctionRequest = {
        seller: account.address,
        nft: nftResult.data.objectId, // Passer l'ID de l'NFT créé
        minPrice: parseInt(auctionSettings.minPrice),
        maxPrice: parseInt(auctionSettings.maxPrice),
        durationMs: getTotalDurationInMs(),
        name: productInfo.title,
        description: productInfo.description,
        signer: account.address,
      };

      console.log("Sending auction creation request...", auctionData);

      const auctionResult = await apiService.createAuction(auctionData);
      console.log("Auction creation result:", auctionResult);

      if (!auctionResult.success) {
        throw new Error(auctionResult.error || "Failed to create auction");
      }

      addNotification(
        "success",
        "NFT and auction created successfully! Your auction is now live.",
      );

      // Redirection vers la page des enchères
      setTimeout(() => {
        router.push("/auctions");
      }, 1500);

      return auctionResult;
    } catch (error) {
      console.error("Error creating NFT and auction:", error);
      addNotification(
        "error",
        `Failed to create auction: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error; // Re-throw to be caught by handlePublish
    } finally {
      console.log("Setting isUploading to false");
      setIsUploading(false);
      setUploadProgress("");
    }
  };

  const handleCancelUpload = () => {
    setCancelUpload(true);
    setIsUploading(false);
    setUploadProgress("");
    addNotification("error", "Upload cancelled by user");
  };

  const handlePublish = async () => {
    // Vérifier que le wallet est connecté
    if (!account) {
      addNotification(
        "error",
        "Please connect your wallet to create an auction",
      );
      return;
    }

    // Validation des prix : le prix de réserve (Reserve Price) doit être strictement supérieur au prix de départ (Starting Price)
    const startingPriceValue = parseFloat(auctionSettings.minPrice); // Starting Price (prix de départ)
    const reservePriceValue = parseFloat(auctionSettings.maxPrice); // Reserve Price (prix de réserve)

    if (reservePriceValue <= startingPriceValue) {
      addNotification(
        "error",
        "Reserve price must be strictly greater than starting price",
      );
      return;
    }

    // Validation des champs obligatoires
    if (
      !productInfo.title ||
      !productInfo.description ||
      !auctionSettings.minPrice ||
      !auctionSettings.maxPrice ||
      !nftData.image
    ) {
      addNotification(
        "error",
        "Please fill in all required fields and upload an NFT image",
      );
      return;
    }

    // Validation de la durée
    if (getTotalDurationInMs() <= 0) {
      addNotification("error", "Please set a valid auction duration");
      return;
    }

    // Créer l'NFT et l'enchère
    try {
      await createNFTAndAuction();
    } catch (error) {
      console.error("Error in handlePublish:", error);
      addNotification(
        "error",
        `Failed to publish auction: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  // Composant de prévisualisation
  const PreviewComponent = () => (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image et informations principales */}
        <div className="space-y-6">
          {/* Image principale */}
          <Card className="bg-slate-800 border-slate-700">
            <div className="relative">
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={productInfo.title}
                  className="w-full h-96 object-cover rounded-t-lg"
                />
              ) : (
                <div className="w-full h-96 bg-slate-700 rounded-t-lg flex items-center justify-center">
                  <div className="text-center">
                    <ImageIcon className="h-24 w-24 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400">No image uploaded</p>
                    <p className="text-slate-500 text-sm">
                      Image upload temporarily disabled
                    </p>
                  </div>
                </div>
              )}
              <Badge className="absolute top-3 right-3 bg-green-500 text-white">
                Preview Mode
              </Badge>
            </div>

            <CardHeader>
              <CardTitle className="text-white text-2xl">
                {productInfo.title || "Your NFT Title"}
              </CardTitle>
              <div className="text-blue-400 font-medium text-lg">
                {productInfo.category || "Category"}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <h3 className="text-white font-semibold mb-2">Description</h3>
                <p className="text-gray-300 leading-relaxed">
                  {productInfo.description ||
                    "Your NFT description will appear here..."}
                </p>
              </div>

              {productInfo.tags.length > 0 && (
                <div>
                  <h3 className="text-white font-semibold mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {productInfo.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-slate-600 text-white"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Détails de l'enchère */}
        <div className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Auction Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-400">Starting Price</div>
                  <div className="text-white font-semibold text-lg">
                    {auctionSettings.minPrice || "0.00"} SUI
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Reserve Price</div>
                  <div className="text-white font-semibold text-lg">
                    {auctionSettings.maxPrice || "0.00"} SUI
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Duration</div>
                  <div className="text-white font-semibold text-lg">
                    {formatDuration()}
                  </div>
                  <div className="text-xs text-gray-400">
                    ({getTotalDurationInMinutes()} minutes)
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informations du créateur */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Owner Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {account?.address?.slice(-2).toUpperCase() || "??"}
                  </span>
                </div>
                <div>
                  <div className="text-white font-medium">Owner</div>
                  <div className="text-gray-400 text-sm font-mono">
                    {account?.address
                      ? truncateWalletAddress(account.address)
                      : "Not connected"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bouton de publication */}
          <div className="space-y-3">
            {isUploading ? (
              <div className="space-y-3">
                <div className="w-full bg-blue-600 text-white py-3 text-lg font-semibold rounded-lg flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  {uploadProgress || "Processing..."}
                </div>
                <Button
                  onClick={handleCancelUpload}
                  variant="outline"
                  className="w-full border-red-600 text-red-300 hover:text-white hover:bg-red-600"
                >
                  Cancel Upload
                </Button>
              </div>
            ) : (
              <Button
                onClick={handlePublish}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-semibold"
              >
                Publish Auction
              </Button>
            )}
            <Button
              onClick={() => setIsPreviewMode(false)}
              variant="outline"
              className="w-full border-slate-600 text-gray-300 hover:text-white"
            >
              Back to Edit
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

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

      {/* Header */}
      <div className="relative z-20 bg-slate-800/90 backdrop-blur-sm border-b border-slate-700/50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="text-gray-300 hover:text-white transition-all duration-300 hover:scale-105 group"
              >
                <ArrowLeft className="h-5 w-5 mr-2 group-hover:text-blue-400 transition-colors" />
                Back
              </Button>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center transform hover:scale-110 transition-all duration-300">
                    <Rocket className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-400 rounded-full animate-ping opacity-60" />
                </div>
                <h1 className="text-3xl font-bold text-white">
                  <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Create NFT Auction
                  </span>
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className="border-2 border-blue-400/50 text-blue-300 hover:bg-blue-600/20 hover:text-white bg-slate-800/50 backdrop-blur-sm transition-all duration-300 transform hover:scale-105"
              >
                <Eye className="h-4 w-4 mr-2" />
                {isPreviewMode ? "Edit" : "Preview"}
              </Button>
              <Button
                onClick={handleSave}
                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              {isUploading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span className="text-sm">
                    {uploadProgress || "Processing..."}
                  </span>
                </div>
              ) : (
                <Button
                  onClick={handlePublish}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Publish Auction
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isPreviewMode ? (
          <PreviewComponent />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Section Images */}
            <Card className="bg-slate-800/90 backdrop-blur-sm border-slate-700/50 shadow-2xl hover:shadow-blue-500/10 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <ImageIcon className="h-5 w-5 mr-2" />
                  Product Images
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Upload Area pour NFT */}
                <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Upload className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                  <p className="text-slate-300 mb-2">Upload NFT Image</p>
                  <p className="text-sm text-slate-500 mb-4">
                    Drag & drop or click to select an image
                  </p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:text-white"
                  >
                    Select Image
                  </Button>
                </div>

                {/* NFT Image Preview */}
                {nftData.imageUrl && (
                  <div className="space-y-4">
                    <div className="relative group">
                      <img
                        src={nftData.imageUrl}
                        alt="NFT Preview"
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeImage(0)}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Remove NFT
                        </Button>
                      </div>
                      <Badge className="absolute top-2 left-2 bg-blue-600">
                        NFT Preview
                      </Badge>
                    </div>

                    {/* NFT Metadata */}
                    <div className="bg-slate-700/50 rounded-lg p-4 space-y-2">
                      <h4 className="text-white font-medium">NFT Metadata</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Name:</span>
                          <span className="text-white">
                            {nftData.name || "Unnamed NFT"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">File:</span>
                          <span className="text-white">
                            {nftData.image?.name || "No file"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Size:</span>
                          <span className="text-white">
                            {nftData.image
                              ? `${(nftData.image.size / 1024 / 1024).toFixed(2)} MB`
                              : "Unknown"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section Informations */}
            <Card className="bg-slate-800/90 backdrop-blur-sm border-slate-700/50 shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Product Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Product Title *
                  </label>
                  <Input
                    placeholder="Enter product title"
                    value={productInfo.title}
                    onChange={(e) =>
                      setProductInfo((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    placeholder="Describe your NFT..."
                    value={productInfo.description}
                    onChange={(e) =>
                      setProductInfo((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full h-32 px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={productInfo.category}
                    onChange={(e) =>
                      setProductInfo((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select category</option>
                    <option value="art">Art</option>
                    <option value="collectibles">Collectibles</option>
                    <option value="music">Music</option>
                    <option value="sports">Sports</option>
                    <option value="gaming">Gaming</option>
                    <option value="photography">Photography</option>
                  </select>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tags
                  </label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Add a tag"
                      value={productInfo.currentTag}
                      onChange={(e) =>
                        setProductInfo((prev) => ({
                          ...prev,
                          currentTag: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => e.key === "Enter" && addTag()}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                    <Button onClick={addTag} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {productInfo.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-slate-600 text-white"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-2 hover:text-red-400"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section Auction Settings */}
            <Card className="bg-slate-800/90 backdrop-blur-sm border-slate-700/50 shadow-2xl hover:shadow-green-500/10 transition-all duration-300 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Auction Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Starting Price (Min Price) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <DollarSign className="h-4 w-4 inline mr-1" />
                      Starting Price (SUI) *
                      <span className="text-xs text-gray-500 ml-1">
                        (Minimum price)
                      </span>
                    </label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="0.00"
                      value={auctionSettings.minPrice}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || /^\d*\.?\d*$/.test(value)) {
                          setAuctionSettings((prev) => ({
                            ...prev,
                            minPrice: value,
                          }));
                        }
                      }}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>

                  {/* Reserve Price (Max Price) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <Tag className="h-4 w-4 inline mr-1" />
                      Reserve Price (SUI) *
                      <span className="text-xs text-gray-500 ml-1">
                        (Maximum price)
                      </span>
                    </label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="0.00"
                      value={auctionSettings.maxPrice}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || /^\d*\.?\d*$/.test(value)) {
                          setAuctionSettings((prev) => ({
                            ...prev,
                            maxPrice: value,
                          }));
                        }
                      }}
                      className={`bg-slate-700 border-slate-600 text-white ${
                        auctionSettings.maxPrice &&
                        auctionSettings.minPrice &&
                        parseFloat(auctionSettings.maxPrice) <=
                          parseFloat(auctionSettings.minPrice)
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                          : ""
                      }`}
                    />
                    {/* Message d'erreur pour la validation des prix */}
                    {auctionSettings.maxPrice &&
                      auctionSettings.minPrice &&
                      parseFloat(auctionSettings.maxPrice) <=
                        parseFloat(auctionSettings.minPrice) && (
                        <p className="text-red-400 text-xs mt-1">
                          ⚠️ Reserve price must be strictly greater than
                          starting price
                        </p>
                      )}
                  </div>

                  {/* Duration */}
                  <div className="col-span-full">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <Clock className="h-4 w-4 inline mr-1" />
                      Auction Duration
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      {/* Days */}
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">
                          Days
                        </label>
                        <Input
                          type="number"
                          min="0"
                          max="365"
                          placeholder="0"
                          value={auctionSettings.duration.days || ""}
                          onChange={(e) =>
                            setAuctionSettings((prev) => ({
                              ...prev,
                              duration: {
                                ...prev.duration,
                                days: Math.max(
                                  0,
                                  parseInt(e.target.value) || 0,
                                ),
                              },
                            }))
                          }
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>

                      {/* Hours */}
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">
                          Hours
                        </label>
                        <Input
                          type="number"
                          min="0"
                          max="23"
                          placeholder="0"
                          value={auctionSettings.duration.hours || ""}
                          onChange={(e) =>
                            setAuctionSettings((prev) => ({
                              ...prev,
                              duration: {
                                ...prev.duration,
                                hours: Math.max(
                                  0,
                                  Math.min(23, parseInt(e.target.value) || 0),
                                ),
                              },
                            }))
                          }
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>

                      {/* Minutes */}
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">
                          Minutes
                        </label>
                        <Input
                          type="number"
                          min="0"
                          max="59"
                          placeholder="0"
                          value={auctionSettings.duration.minutes || ""}
                          onChange={(e) =>
                            setAuctionSettings((prev) => ({
                              ...prev,
                              duration: {
                                ...prev.duration,
                                minutes: Math.max(
                                  0,
                                  Math.min(59, parseInt(e.target.value) || 0),
                                ),
                              },
                            }))
                          }
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                    </div>

                    {/* Duration Summary */}
                    <div className="mt-3 p-3 bg-slate-800 rounded-lg">
                      <div className="text-sm text-gray-300">
                        <span className="font-medium">Total Duration:</span>{" "}
                        {formatDuration()}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        ({getTotalDurationInMinutes()} minutes total)
                      </div>
                    </div>

                    <p className="text-xs text-gray-400 mt-2">
                      Set the exact duration for your auction
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Notifications */}
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
                : notification.type === "error"
                  ? "bg-red-500 border-red-400"
                  : "bg-blue-500 border-blue-400"
            }`}
          >
            <div className="text-2xl">
              {notification.type === "success"
                ? "✅"
                : notification.type === "error"
                  ? "❌"
                  : "ℹ️"}
            </div>
            <div>
              <div className="font-semibold">
                {notification.type === "success"
                  ? "Success!"
                  : notification.type === "error"
                    ? "Error"
                    : "Info"}
              </div>
              <div className="text-sm opacity-90">{notification.message}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
