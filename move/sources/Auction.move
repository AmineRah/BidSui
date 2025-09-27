module AuctionCore::Auction {
    use sui::object::{ID, UID};
    use sui::tx_context::{Self, TxContext};
    use std::string::String;
    use sui::clock::Clock;
    use sui::event;
    use std::option::{Self, Option};
    use Seller::Seller; // <-- import du module Seller

    public struct Auction has key, store {
        id: UID,
        min_val: u64,
        max_val: u64,
        initial_max_val: u64,
        current_bidder_id: Option<ID>,
        creator: Seller::Seller, // <-- le creator est un Seller, plus un UID
        start_time: u64,
        dead_line: u64,
        name: String,
        description: String,
    }

    // create_auction : le seller est passé en paramètre
    public fun create_auction(
        ctx: &mut TxContext, 
        seller: Seller::Seller, // <-- nouveau paramètre
        min_val: u64, 
        max_val: u64, 
        dead_line: u64, 
        clock: &Clock, 
        name: String, 
        description: String
    ) {
        let uid = object::new(ctx);
        let id = object::uid_to_inner(&uid);
        let auction = Auction {
            id: uid,
            min_val,
            max_val,
            initial_max_val: max_val,
            current_bidder_id: option::none<ID>(),
            creator: seller, // on stocke le seller
            start_time: Clock::timestamp_ms(clock),
            dead_line,
            name,
            description,
        };
        let auction_id = object::uid_to_inner(&auction.id);
        transfer::transfer(auction, tx_context::sender(ctx));
        event::emit(CreateAuctionEvent { id: auction_id });
    }

    // update_min_value : remboursement -> appel return_money
    public fun update_min_value(
        ctx: &mut TxContext, 
        auction: &mut Auction, 
        new_bid: u64, 
        clock: &Clock
    ) {
        if (new_bid > auction.min_val) {
            // 1. Remboursement de l'ancien bidder
            if (option::is_some(&auction.current_bidder_id)) {
                let old_bidder = *option::borrow(&auction.current_bidder_id).unwrap();
                Seller::return_money(&mut auction.creator, old_bidder, ctx);
            };

            // 2. Paiement au seller (au lieu d’un simple transfer_obj)
            Seller::receive_money(&mut auction.creator, new_bid, ctx);

            // 3. Mise à jour des champs
            if (new_bid >= auction.max_val) {
                auction.min_val = auction.max_val;
                auction.current_bidder_id = option::some(tx_context::sender(ctx));
                end_auction(ctx, auction);
                return;
            };

            auction.min_val = new_bid;
            auction.current_bidder_id = option::some(tx_context::sender(ctx));

            let auction_id = object::uid_to_inner(&auction.id);
            event::emit(UpdateAuctionEvent {
                id: auction_id,
                min_val: auction.min_val,
                max_val: auction.max_val,
                current_bidder_id: auction.current_bidder_id,
            });
        }
    }

    // end_auction : si on doit rembourser le bidder final, appel return_money
    public fun end_auction(ctx: &mut TxContext, auction: Auction) {
        if (option::is_some(&auction.current_bidder_id)) {
            let bidder_id = *option::borrow(&auction.current_bidder_id).unwrap();
            Seller::return_money(&mut auction.creator, bidder_id, ctx);
        };
        delete_auction(auction);
    }
}
