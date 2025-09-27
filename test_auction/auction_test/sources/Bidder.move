module Bidder::Bidder {
    use sui::object::{Self, ID, UID};
    use sui::tx_context::{Self, TxContext};
    use std::string::String;
    use sui::clock::{Self as clock, Clock};
    use AuctionCore::Auction::{Self as AuctionModule, Auction};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;

    const ENotValidBid: u64 = 0;
    const EBidNotAccepted: u64 = 1;
    const EInsufficientFunds: u64 = 2;

    // Historique d'une enchère
    public struct BidHistory has store {
        auction_id: ID,
        bid_amount: u64,
        timestamp: u64,
        won: bool,
    }

    public struct BidderProfile has key {
        id: UID,
        name: String,
        participated_auctions: vector<ID>,
        bid_history: vector<BidHistory>,   // Historique des enchères
        total_wins: u64,
        total_spent: u64,
    }

    // Événement lors d'une enchère
    public struct BidPlaced has copy, drop {
        bidder_id: ID,
        auction_id: ID,
        bid_amount: u64,
        accepted: bool,
    }

    // Créer un profil enchérisseur
    public fun create_bidder_profile(
        name: String, 
        ctx: &mut TxContext
    ): BidderProfile {
        let uid = object::new(ctx);
        
        BidderProfile {
            id: uid,
            name,
            participated_auctions: vector::empty<ID>(),
            bid_history: vector::empty<BidHistory>(),
            total_wins: 0,
            total_spent: 0,
        }
    }
    
    // Fonction principale pour enchérir
    public fun bid(
        bidder: &mut BidderProfile,
        auction: &mut Auction, 
        bid_value: u64,
        bidder_coin: &mut coin::Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let bidder_address = tx_context::sender(ctx);
        let bid_accepted = AuctionModule::place_bid(auction, bidder_address, bid_value, bidder_coin, clock, ctx);
        assert!(bid_accepted, EBidNotAccepted);
        
        // Ajouter à l'historique
        let auction_id = object::id(auction);
        let timestamp = clock::timestamp_ms(clock);
        
        let history = BidHistory {
            auction_id,
            bid_amount: bid_value,
            timestamp,
            won: bid_accepted, // Dans une enchère hollandaise, le premier bid accepté gagne
        };
        
        vector::push_back(&mut bidder.bid_history, history);
        
        // Ajouter l'enchère à la liste si pas déjà présente
        if (!vector::contains(&bidder.participated_auctions, &auction_id)) {
            vector::push_back(&mut bidder.participated_auctions, auction_id);
        };
        
        // Si l'enchère est acceptée, mettre à jour les stats
        if (bid_accepted) {
            bidder.total_wins = bidder.total_wins + 1;
            bidder.total_spent = bidder.total_spent + bid_value;
        };

        // Émettre l'événement
        sui::event::emit(BidPlaced {
            bidder_id: object::id(bidder),
            auction_id,
            bid_amount: bid_value,
            accepted: bid_accepted,
        });
    }

    // Getters pour le profil enchérisseur
    public fun get_bidder_name(bidder: &BidderProfile): String {
        bidder.name
    }

    public fun get_total_wins(bidder: &BidderProfile): u64 {
        bidder.total_wins
    }

    public fun get_total_spent(bidder: &BidderProfile): u64 {
        bidder.total_spent
    }

    public fun get_participated_auctions(bidder: &BidderProfile): &vector<ID> {
        &bidder.participated_auctions
    }

    public fun get_bid_history(bidder: &BidderProfile): &vector<BidHistory> {
        &bidder.bid_history
    }
}
