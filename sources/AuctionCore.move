module AuctionCore::AuctionCore{
    use sui::object::ID;
    use sui::tx_context::TxContext;
    use std::string::String;
    use sui::clock::{Self, Clock};

    struct Auction has key {
        id: ID,
        min_val: u64,
        max_val: u64,
        lim_time: u256,
        name: String,
        desciption: vector<String>
    }

    struct CreateAuction has copy, drop {
        id: ID,
    }

    public fun publishAuction(ctx: &mut TxContext, min_val: u64, max_val: u64, lim_time:u256,  name: String, desciption: vector<String>){
        let uid = object::new(ctx);
        let id = object::uid::to::inner(&uid);
        let auction = Auction {
            id: uid,
            min_val,
            max_val,
            lim_time,
            name,
            description,
        }

        let creat_auction = CreateAuction{
            id,
        }

        transfer::transfer(auction,  tx_context::sender(ctx));
        event::emit(creat_auction);
    }


}