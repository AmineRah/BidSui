module Seller::Seller {
    use sui::object::{Self, ID, UID};
    use sui::tx_context::{Self, TxContext};
    use std::string::String;
    use sui::clock::Clock;
    use sui::transfer;
    use AuctionCore::Auction::{Self as AuctionModule, Auction};

    const ENotOwner: u64 = 0;
    const EAuctionNotFound: u64 = 1;

    public struct SellerProfile has key {
        id: UID,
        name: String,
        created_auctions: vector<ID>, // IDs des enchères créées par ce vendeur
        total_sales: u64,
        reputation: u64,
    }

    // Événement lors de la création d'un profil vendeur
    public struct SellerProfileCreated has copy, drop {
        seller_id: ID,
        name: String,
    }

    // Créer un profil vendeur
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

        sui::event::emit(SellerProfileCreated {
            seller_id,
            name,
        });

        profile
    }

    // Créer une nouvelle enchère (pour le vendeur)
    public fun create_auction(
        seller: &mut SellerProfile,
        min_val: u64,
        max_val: u64,
        name: String,
        description: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let auction = AuctionCore::Auction::create_auction(ctx, min_val, max_val, clock, name, description);
        let auction_id = object::id(&auction);
        vector::push_back(&mut seller.created_auctions, auction_id);
    }

    // Terminer une enchère (seulement le propriétaire)
    public fun end_auction(
        seller: &mut SellerProfile,
        auction: Auction,
    ) {
        // Vérifier que l'enchère appartient au vendeur
        let auction_id = object::id(&auction);
        assert!(vector::contains(&seller.created_auctions, &auction_id), ENotOwner);
        
        // Supprimer l'enchère
        AuctionModule::delete_auction(auction);
        
        // Mettre à jour le profil vendeur
        let (found, index) = vector::index_of(&seller.created_auctions, &auction_id);
        if (found) {
            vector::remove(&mut seller.created_auctions, index);
            seller.total_sales = seller.total_sales + 1;
        };
    }

}