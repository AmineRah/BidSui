module AuctionCore::Auction {
    use sui::object;
    use sui::tx_context::{Self, TxContext};
    use std::string::String;
    use sui::clock::Clock;
    use sui::event;
    use std::option::{Self, Option};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::transfer;

    /// Objet Auction
    public struct Auction has key, store {
        id: UID,
        min_val: u64,
        max_val: u64,
        initial_max_val: u64,
        current_bidder_id: Option<address>, 
        current_bid_amount: u64,
        seller_id: address,
        start_time: u64,
        dead_line: u64,
        name: String,
        description: String,
        ended: bool,
        escrowed_funds: Coin<SUI>, // Funds locked from current highest bidder
    }

    public struct CreateAuctionEvent has copy, drop {
        id: ID,
    }

    public struct EndedAuctionEvent has copy, drop {
        id: ID,
        final_price: u64,
    }

    public struct UpdateAuctionEvent has copy, drop {
        id: ID,
        min_val: u64,
        max_val: u64,
        current_bidder_id: Option<address>,
    }

    /// Création d'une enchère
    public fun create_auction(
        ctx: &mut TxContext,
        seller: address,
        min_val: u64,
        max_val: u64,
        dead_line: u64,
        clock: &Clock,
        name: String,
        description: String
    ) {
        let uid = object::new(ctx);
        let id = object::uid_to_inner(&uid);

        // Create empty coin for escrowed funds
        let escrowed_funds = coin::zero<SUI>(ctx);

        let auction = Auction {
            id: uid,
            min_val: min_val,
            max_val: max_val,
            initial_max_val: max_val,
            current_bidder_id: option::none<address>(),
            current_bid_amount: 0,
            seller_id: seller,
            start_time: sui::clock::timestamp_ms(clock),
            dead_line: dead_line,
            name: name,
            description: description,
            ended: false,
            escrowed_funds: escrowed_funds,
        };

        transfer::transfer(auction, seller);
        event::emit(CreateAuctionEvent { id });
    }

    /// Place a bid in the hybrid auction with proper escrow handling
    public fun place_bid(
        auction: &mut Auction,
        bidder: address,
        bid_amount: u64,
        bidder_coin: &mut Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ): bool {
        assert!(!auction.ended, 0);
        
        let current_ceiling = get_current_ceiling(auction, clock);
        
        // Bid must be below current ceiling
        if (bid_amount >= current_ceiling) {
            return false
        };
        
        // Bid must be above minimum floor
        if (bid_amount < auction.min_val) {
            return false
        };
        
        // Check if this is a higher bid than current
        if (bid_amount > auction.current_bid_amount) {
            // Refund previous bidder if exists
            if (option::is_some(&auction.current_bidder_id)) {
                let previous_bidder = *option::borrow(&auction.current_bidder_id);
                let refund_amount = auction.current_bid_amount;
                
                // Create refund coin from escrowed funds
                let refund_coin = coin::split(&mut auction.escrowed_funds, refund_amount, ctx);
                transfer::public_transfer(refund_coin, previous_bidder);
            };
            
            // Lock new bidder's funds
            let escrow_amount = coin::split(bidder_coin, bid_amount, ctx);
            auction.escrowed_funds.join(escrow_amount);
            
            // Update current bidder and amount
            auction.current_bidder_id = option::some(bidder);
            auction.current_bid_amount = bid_amount;
            
            let auction_id = object::uid_to_inner(&auction.id);
            event::emit(UpdateAuctionEvent {
                id: auction_id,
                min_val: auction.min_val,
                max_val: auction.max_val,
                current_bidder_id: auction.current_bidder_id,
            });
            
            true
        } else {
            false
        }
    }
    
    /// Get the current ceiling price (decreasing over time)
    public fun get_current_ceiling(auction: &Auction, clock: &Clock): u64 {
        let ts = sui::clock::timestamp_ms(clock);
        if (ts >= auction.dead_line) {
            auction.min_val // Return floor price when time is up
        } else {
            let elapsed = ts - auction.start_time;
            let duration = auction.dead_line - auction.start_time;
            let delta = auction.initial_max_val - auction.min_val;
            auction.initial_max_val - (delta * elapsed / duration)
        }
    }

    /// Check if auction should end (ceiling reached highest bid or time expired)
    public fun check_auction_end(auction: &mut Auction, clock: &Clock): bool {
        if (auction.ended) {
            return false
        };
        
        let ts = sui::clock::timestamp_ms(clock);
        let current_ceiling = get_current_ceiling(auction, clock);
        
        // Check if time is up
        if (ts >= auction.dead_line) {
            auction.ended = true;
            let auction_id = object::uid_to_inner(&auction.id);
            event::emit(EndedAuctionEvent {
                id: auction_id,
                final_price: auction.current_bid_amount,
            });
            return true
        };
        
        // Check if ceiling has reached the highest bid
        if (option::is_some(&auction.current_bidder_id) && current_ceiling <= auction.current_bid_amount) {
            auction.ended = true;
            let auction_id = object::uid_to_inner(&auction.id);
            event::emit(EndedAuctionEvent {
                id: auction_id,
                final_price: auction.current_bid_amount,
            });
            return true
        };
        
        false
    }

    /// End auction and transfer escrowed funds to seller
    public fun end_auction(
        auction: &mut Auction,
        seller_coin: &mut Coin<SUI>,
        ctx: &mut TxContext
    ) {
        assert!(auction.ended, 0); // Auction must be ended first
        
        if (option::is_some(&auction.current_bidder_id)) {
            // Transfer escrowed funds to seller
            let winning_amount = auction.current_bid_amount;
            let payment = coin::split(&mut auction.escrowed_funds, winning_amount, ctx);
            seller_coin.join(payment);
        };
        
        let auction_id = object::uid_to_inner(&auction.id);
        event::emit(EndedAuctionEvent {
            id: auction_id,
            final_price: auction.current_bid_amount,
        });
    }
    
    /// Refund escrowed funds to current bidder (if auction ends without winner)
    public fun refund_escrowed_funds(
        auction: &mut Auction,
        ctx: &mut TxContext
    ) {
        assert!(auction.ended, 0);
        
        if (option::is_some(&auction.current_bidder_id)) {
            let bidder = *option::borrow(&auction.current_bidder_id);
            let refund_amount = auction.current_bid_amount;
            
            let refund_coin = coin::split(&mut auction.escrowed_funds, refund_amount, ctx);
            transfer::public_transfer(refund_coin, bidder);
        };
    }

}
