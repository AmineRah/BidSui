"use client";

import * as React from "react";
import Link from "next/link";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { Home, Search, Plus, Sparkles } from "lucide-react";

export default function Navbar() {
  const account = useCurrentAccount();

  return (
    <nav className="w-full bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 relative z-50 shadow-2xl">
      {/* Background avec effet glassmorphism */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-blue-900/20 to-slate-900/90" />

      {/* Menu principal */}
      <div className="relative flex items-center justify-between px-6 py-4">
        {/* Logo avec animation */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="relative">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-all duration-300">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-ping opacity-60" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent group-hover:from-blue-300 group-hover:to-purple-300 transition-all duration-300">
            SuiBid
          </span>
        </Link>

        {/* Navigation links avec animations */}
        <div className="flex items-center space-x-8">
          <Link
            href="/"
            className="flex items-center space-x-2 text-gray-300 hover:text-white transition-all duration-300 hover:scale-105 group"
          >
            <Home className="w-4 h-4 group-hover:text-blue-400 transition-colors" />
            <span>Home</span>
          </Link>

          <Link
            href="/auctions"
            className="flex items-center space-x-2 text-gray-300 hover:text-white transition-all duration-300 hover:scale-105 group"
          >
            <Search className="w-4 h-4 group-hover:text-purple-400 transition-colors" />
            <span>Browse Auctions</span>
          </Link>

          <Link
            href="/sell"
            className="flex items-center space-x-2 text-gray-300 hover:text-white transition-all duration-300 hover:scale-105 group"
          >
            <Plus className="w-4 h-4 group-hover:text-green-400 transition-colors" />
            <span>Create NFT Auction</span>
          </Link>
        </div>

        {/* Connect Wallet avec style moderne */}
        <div className="transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
          <div className="relative">
            <ConnectButton />
            <div
              className={`absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse opacity-60 ${
                account ? "bg-green-400" : "bg-red-400"
              }`}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
