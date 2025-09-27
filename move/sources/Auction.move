module AuctionCore::Auction {
    use sui::object::{ID, UID, Self as object};
    use sui::tx_context::{Self as tx_context, TxContext};
    use std::string::String;
    use sui::clock::{Clock, Self as clock};
    use sui::event;
    use std::option::{Self as option, Option};
    use sui::transfer;
    use Seller::Seller::{Self as SellerModule, SellerProfile};

    /// Objet Auction
    public struct Auction has key, store {
        id: UID,
        min_val: u64,
        max_val: u64,
        initial_max_val: u64,
        current_bidder_id: Option<ID>,
        creator_id: ID, 
        start_time: u64,
        dead_line: u64,
        name: String,
        description: String,
    }

    public struct CreateAuctionEvent has copy, drop {
        id: ID,
    }

    public struct DeleteAuctionEvent has copy, drop {
        id : ID,
    }

    public struct UpdateAuctionEvent has copy, drop {
        id: ID,
        min_val: u64,
        max_val: u64,
        current_bidder_id: Option<ID>,
    }

    /// Création d'une enchère
    public fun create_auction(
        ctx: &mut TxContext, 
        seller: &mut SellerProfile, // référence au vendeur
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
            creator_id: object::uid_to_inner(&seller.id), // on stocke seulement l’ID
            start_time: Clock::timestamp_ms(clock),
            dead_line,
            name,
            description,
        };

        // ajout dans la liste des enchères créées par le vendeur
        SellerModule::add_created_auction(seller, id);

        transfer::transfer(auction, tx_context::sender(ctx));
        event::emit(CreateAuctionEvent { id });
    }

    /// Suppression d'une enchère
    public fun delete_auction(auction: Auction) {
        let Auction { id, .. } = auction;
        let auction_id = object::uid_to_inner(&id);
        object::delete(id);
        event::emit(DeleteAuctionEvent { id: auction_id });
    }

    /// Mise à jour du prix minimum avec une nouvelle enchère
    public fun update_min_value(
        ctx: &mut TxContext, 
        auction: &mut Auction, 
        seller: &mut SellerProfile, 
        new_bid: u64, 
        clock: &Clock
    ) {
        if (new_bid > auction.min_val) {
            // 1. Remboursement de l'ancien bidder
            if (option::is_some(&auction.current_bidder_id)) {
                let old_bidder = *option::borrow(&auction.current_bidder_id).unwrap();
                SellerModule::return_money(seller, old_bidder, ctx);
            };

            // 2. Paiement au vendeur
            SellerModule::receive_money(seller, new_bid, ctx);

            // 3. Mise à jour des champs
            if (new_bid >= auction.max_val) {
                auction.min_val = auction.max_val;
                auction.current_bidder_id = option::some(tx_context::sender(ctx));
                end_auction(ctx, auction, seller);
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

    /// Mise à jour de la valeur max (diminue avec le temps)
    public fun update_max_value(auction: &mut Auction, clock: &Clock): bool {
        let current_time = clock::timestamp_ms(clock);

        if (current_time >= auction.dead_line) {
            auction.max_val = auction.min_val;
            return true;
        }

        let elapsed = current_time - auction.start_time;
        let total_duration = auction.dead_line - auction.start_time;
        let diff = auction.initial_max_val - auction.min_val;

        auction.max_val = auction.initial_max_val - (diff * elapsed / total_duration);

        let auction_id = object::uid_to_inner(&auction.id);
        event::emit(UpdateAuctionEvent {
            id: auction_id,
            min_val: auction.min_val,
            max_val: auction.max_val,
            current_bidder_id: auction.current_bidder_id,
        });

        false
    }

    /// Fin de l'enchère : remboursement si nécessaire + suppression
    public fun end_auction(ctx: &mut TxContext, auction: Auction, seller: &mut SellerProfile) {
        if (option::is_some(&auction.current_bidder_id)) {
            let bidder_id = *option::borrow(&auction.current_bidder_id).unwrap();
            SellerModule::return_money(seller, bidder_id, ctx);
        };
        delete_auction(auction);
    }
}
