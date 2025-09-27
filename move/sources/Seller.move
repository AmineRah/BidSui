module Seller::Seller {
    use sui::object::{Self as object, ID, UID};
    use sui::tx_context::{Self as tx_context, TxContext};
    use std::string::String;
    use sui::clock::Clock;
    use sui::transfer;
    use sui::event;
    use std::vector;
    use AuctionCore::Auction::{Self as AuctionModule, Auction};

    const ENotOwner: u64 = 0;
    const EAuctionNotFound: u64 = 1;

    public struct SellerProfile has key, store {
        id: UID,
        name: String,
        created_auctions: vector<ID>, // IDs des enchères créées par ce vendeur
        total_sales: u64,
        reputation: u64,
    }

    // --- Events ---
    public struct SellerProfileCreated has copy, drop {
        seller_id: ID,
        name: String,
    }

    
    public fun create_seller_profile(
        name: String, 
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
        name: String,
        description: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Passe le profil vendeur à Auction
        AuctionModule::create_auction(ctx, seller, min_val, max_val, clock, name, description);
    }

    public fun end_auction(
        seller: &mut SellerProfile,
        auction: Auction,
    ) {
        let auction_id = object::id(&auction);
        assert!(vector::contains(&seller.created_auctions, &auction_id), ENotOwner);
        
        AuctionModule::delete_auction(auction);
        
        let (found, index) = vector::index_of(&seller.created_auctions, &auction_id);
        if (found) {
            vector::remove(&mut seller.created_auctions, index);
            seller.total_sales = seller.total_sales + 1;
        };
    }

    // --- Gestion de l’argent (hooks appelés par Auction) ---
    public fun receive_money(seller: &mut SellerProfile, amount: u64, _ctx: &mut TxContext) {
        seller.total_sales = seller.total_sales + amount;
    }

    public fun return_money(_seller: &mut SellerProfile, bidder: ID, ctx: &mut TxContext) {
        // Ici on simplifie : on transfère juste un nouvel objet comme remboursement
        let refund_obj = object::new(ctx);
        transfer::transfer(refund_obj, bidder);
    }
}
