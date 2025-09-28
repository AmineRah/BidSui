import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ArrowRight,
  Shield,
  Zap,
  Globe,
  Lock,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";

export default function Home() {
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
      {/* Hero Section */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          {/* Animated Title */}
          <div className="relative mb-8">
            <h1 className="text-7xl font-bold text-white mb-6 animate-pulse">
              <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 bg-clip-text text-transparent">
                SuiBid
              </span>
            </h1>
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-blue-500 rounded-full animate-bounce opacity-60" />
            <div className="absolute -bottom-2 -left-4 w-6 h-6 bg-purple-500 rounded-full animate-ping opacity-40" />
          </div>

          <p className="text-3xl text-gray-300 mb-8 max-w-4xl mx-auto font-light">
            <span className="bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
              Decentralized NFT Dutch Auctions
            </span>
            <br />
            <span className="text-xl text-gray-400">on Sui Blockchain</span>
          </p>

          <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed">
            Experience transparent, secure, and fair NFT trading through
            automated Dutch auction mechanisms. Built on Sui's high-performance
            blockchain for maximum security and efficiency.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/auctions">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-12 py-6 text-xl font-semibold rounded-full shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
              >
                <TrendingUp className="w-6 h-6 mr-2" />
                Browse Auctions
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/sell">
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-blue-400 text-blue-300 hover:bg-blue-600 hover:text-white px-12 py-6 text-xl font-semibold rounded-full backdrop-blur-sm bg-blue-500/10 transition-all duration-300 transform hover:scale-105"
              >
                <Star className="w-6 h-6 mr-2" />
                Sell Your NFT
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-slate-800/90 backdrop-blur-sm border-slate-700 hover:border-blue-500/50 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/10">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Shield className="w-6 h-6 text-blue-400" />
                </div>
                <CardTitle className="text-white text-xl">
                  On-Chain Security
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300 leading-relaxed">
                All auctions are executed on the Sui blockchain, ensuring
                complete transparency and immutability. No centralized control
                means no manipulation.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/90 backdrop-blur-sm border-slate-700 hover:border-purple-500/50 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/10">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Zap className="w-6 h-6 text-purple-400" />
                </div>
                <CardTitle className="text-white text-xl">
                  Dutch Auction Mechanism
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300 leading-relaxed">
                Automated price discovery through Dutch auctions. Prices start
                high and decrease over time, ensuring fair market value
                discovery for all participants.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/90 backdrop-blur-sm border-slate-700 hover:border-green-500/50 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/10">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                </div>
                <CardTitle className="text-white text-xl">
                  Sui Performance
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300 leading-relaxed">
                Built on Sui's high-performance blockchain with instant finality
                and low fees. Experience lightning-fast transactions and optimal
                user experience.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Why On-Chain Section */}
        <div className="bg-slate-800/90 backdrop-blur-sm rounded-2xl p-8 mb-16 border border-slate-700/50 shadow-2xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Why On-Chain Auctions Matter
              </span>
            </h2>
            <p className="text-gray-400 text-lg">
              The future of transparent trading
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="group">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition-colors">
                  <Lock className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">
                  Transparency & Trust
                </h3>
              </div>
              <p className="text-gray-300 leading-relaxed">
                Every auction parameter, bid, and transaction is recorded on the
                blockchain. This creates an immutable audit trail that anyone
                can verify, eliminating the possibility of hidden manipulation
                or unfair practices.
              </p>
            </div>

            <div className="group">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-purple-500/20 rounded-xl group-hover:bg-purple-500/30 transition-colors">
                  <Globe className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">
                  Decentralized Control
                </h3>
              </div>
              <p className="text-gray-300 leading-relaxed">
                No single entity controls the auction process. Smart contracts
                execute automatically based on predefined rules, ensuring fair
                and consistent execution for all participants.
              </p>
            </div>

            <div className="group">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-green-500/20 rounded-xl group-hover:bg-green-500/30 transition-colors">
                  <Users className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">
                  Global Accessibility
                </h3>
              </div>
              <p className="text-gray-300 leading-relaxed">
                Anyone with a Sui wallet can participate in auctions from
                anywhere in the world. No geographic restrictions, no complex
                KYC processes, just pure decentralized trading.
              </p>
            </div>

            <div className="group">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-orange-500/20 rounded-xl group-hover:bg-orange-500/30 transition-colors">
                  <Zap className="w-6 h-6 text-orange-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">
                  Programmable Logic
                </h3>
              </div>
              <p className="text-gray-300 leading-relaxed">
                Dutch auction parameters can be customized and automated through
                smart contracts. This enables sophisticated auction mechanisms
                that would be impossible to implement fairly in traditional
                centralized systems.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
