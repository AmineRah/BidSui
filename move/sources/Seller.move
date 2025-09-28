module BidSui::Seller {
    use std::string::String;
    use sui::event;
    use sui::clock::Clock;  
    use BidSui::Auction::{Self as AuctionModule, Auction};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::tx_context::{Self, TxContext};
    use sui::object::{Self, ID, UID};
    use sui::transfer;
    use std::vector; 

    const ENotOwner: u64 = 0;
    const EAuctionNotFound: u64 = 1;

    public struct SellerProfile has key, store {
        id: UID, 
        name: String, 
        created_auctions: vector<ID>,
        total_sales: u64,
        reputation: u64,
        seller_coin: Coin<SUI>,
    }

    public struct AdminCap has key {
    id: UID
    }


    // --- Events ---
    public struct SellerProfileCreated has copy, drop {
        seller_id: ID,
        name: String,
    }

    public fun create_seller_profile(
        name: String, 
        coin: Coin<SUI>,
        ctx: &mut TxContext
    ): SellerProfile {
        let uid = object::new(ctx);
        let seller_id = object::uid_to_inner(&uid);

        let profile = SellerProfile {
            id: uid,
            name,
            created_auctions: vector::empty<ID>(), 
            total_sales: 0,
            reputation: 0,
            seller_coin: coin, 
        };

        event::emit(SellerProfileCreated {
            seller_id,
            name,
        });

        profile
    }

    public fun id(seller: &SellerProfile): ID {
        object::uid_to_inner(&seller.id)
    }

    public fun add_created_auction(seller: &mut SellerProfile, auction_id: ID) {
        vector::push_back(&mut seller.created_auctions, auction_id);
    }

    public fun create_auction(
        seller: &mut SellerProfile,
        min_val: u64,
        max_val: u64,
        duration_ms: u64,
        name: String,
        description: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Création de l'objet Auction (il est automatiquement transféré au vendeur)
        let current_time = sui::clock::timestamp_ms(clock);
        let dead_line = current_time + duration_ms;
        let seller_address = tx_context::sender(ctx);
        
        AuctionModule::create_auction(
            seller_address,
            min_val, 
            max_val,
            dead_line,
            clock,
            name,
            description,
            ctx
        );

        // Note: L'auction est automatiquement transférée au vendeur par le module Auction
        // L'ID sera récupéré via les événements émis par le module Auction si nécessaire
    }

    // --- Gestion de l’argent (hooks appelés par Auction) ---
    public fun receive_money(seller: &mut SellerProfile, amount: u64, ctx: &mut TxContext) {
        // Ajoute le montant à la balance du vendeur
        let payment = coin::split(&mut seller.seller_coin, amount, ctx);
        seller.seller_coin.join(payment);
        seller.total_sales = seller.total_sales + amount;
    }

    public fun return_money(
        seller: &mut SellerProfile,
        bidder: address,
        amount: u64,
        ctx: &mut TxContext
    ) {
        let refund = coin::split(&mut seller.seller_coin, amount, ctx);
        transfer::public_transfer(refund, bidder);
    }
}
