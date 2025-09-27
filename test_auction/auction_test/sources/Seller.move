module Seller::Seller {
    use std::string::String;
    use sui::event;
    use sui::clock::Clock;
    use AuctionCore::Auction::{Self as AuctionModule, Auction};
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
    ): Auction {
        // Création de l'objet Auction
        let auction = AuctionModule::create_auction(
            ctx,
            tx_context::sender(ctx),
            min_val,
            max_val,
            duration_ms,
            clock,
            name,
            description
        );

        // Récupération de l'ID de l'auction
        let auction_id = object::uid_to_inner(&auction.id);

        // Ajout de l'ID dans le SellerProfile
        vector::push_back(&mut seller.created_auctions, auction_id);

        // Retourne l'objet Auction pour qu'il soit stocké sur la blockchain
        auction
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
