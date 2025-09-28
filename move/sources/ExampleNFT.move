module BidSui::ExampleNFT {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use sui::url::{Self, Url};
    use std::string::String;

    // NFT struct
    public struct ExampleNFT has key, store {
        id: UID,
        name: String,
        description: String,
        image_url: String,
        created_at: u64,
    }

    // Events
    public struct NFTCreated has copy, drop {
        nft_id: ID,
        name: String,
        description: String,
        creator: address,
        created_at: u64,
    }

    // Create NFT function
    public fun create_nft(
        name: String,
        description: String,
        image_url: String,
        ctx: &mut TxContext
    ): ExampleNFT {
        let nft = ExampleNFT {
            id: object::new(ctx),
            name,
            description,
            image_url,
            created_at: tx_context::epoch_timestamp_ms(ctx),
        };

        // Emit creation event
        event::emit(NFTCreated {
            nft_id: object::id(&nft),
            name,
            description,
            creator: tx_context::sender(ctx),
            created_at: tx_context::epoch_timestamp_ms(ctx),
        });

        nft
    }

    // Get NFT metadata
    public fun get_name(nft: &ExampleNFT): &String {
        &nft.name
    }

    public fun get_description(nft: &ExampleNFT): &String {
        &nft.description
    }

    public fun get_image_url(nft: &ExampleNFT): &String {
        &nft.image_url
    }

    public fun get_created_at(nft: &ExampleNFT): u64 {
        nft.created_at
    }

    // Get NFT ID
    public fun get_nft_id(nft: &ExampleNFT): ID {
        object::id(nft)
    }
}
