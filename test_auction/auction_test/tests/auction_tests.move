#[test_only]
module AuctionCore::auction_tests {
    use sui::test_scenario::{Self, Scenario};
    use sui::clock::{Self, Clock};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::tx_context;
    use std::string;
    
    use AuctionCore::Auction::{Self, Auction};
    use Seller::Seller::{Self, SellerProfile};
    use Bidder::Bidder::{Self, BidderProfile};

    const ALICE: address = @0xA;
    const BOB: address = @0xB;
    const CHARLIE: address = @0xC;

    #[test]
    fun test_create_auction() {
        let mut scenario = test_scenario::begin(ALICE);
        let clock = clock::create_for_testing(scenario.ctx());
        clock::set_for_testing(&clock, 1000); // Set time to 1000ms
        
        // Create seller profile
        let alice_coin = test_scenario::take_from_sender<SUI>(&scenario);
        let alice_seller = Seller::create_seller_profile(
            string::utf8(b"Alice"),
            alice_coin,
            scenario.ctx()
        );
        
        // Create auction
        let auction = Auction::create_auction(
            scenario.ctx(),
            ALICE,
            100,    // min_val
            1000,   // max_val
            30000,  // 30 seconds
            &clock,
            string::utf8(b"Test NFT"),
            string::utf8(b"A test NFT for auction")
        );
        
        // Verify auction properties
        assert!(Auction::id(&auction) != &object::id_from_address(@0x0), 0);
        
        test_scenario::return_to_sender(&scenario, auction);
        test_scenario::return_to_sender(&scenario, alice_seller);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_place_bid() {
        let mut scenario = test_scenario::begin(ALICE);
        let clock = clock::create_for_testing(scenario.ctx());
        clock::set_for_testing(&clock, 1000);
        
        // Create seller and auction
        let alice_coin = test_scenario::take_from_sender<SUI>(&scenario);
        let alice_seller = Seller::create_seller_profile(
            string::utf8(b"Alice"),
            alice_coin,
            scenario.ctx()
        );
        
        let auction = Auction::create_auction(
            scenario.ctx(),
            ALICE,
            100,
            1000,
            30000,
            &clock,
            string::utf8(b"Test NFT"),
            string::utf8(b"A test NFT for auction")
        );
        
        // Create bidder
        let bob_coin = test_scenario::take_from_sender<SUI>(&scenario);
        let bob_bidder = Bidder::create_bidder_profile(
            string::utf8(b"Bob"),
            scenario.ctx()
        );
        
        // Place bid
        let bid_success = Auction::place_bid(
            &mut auction,
            BOB,
            200,
            &mut bob_coin,
            &clock,
            scenario.ctx()
        );
        
        assert!(bid_success, 0);
        assert!(coin::value(&bob_coin) == 800, 1); // Bob should have 800 SUI left
        
        test_scenario::return_to_sender(&scenario, auction);
        test_scenario::return_to_sender(&scenario, alice_seller);
        test_scenario::return_to_sender(&scenario, bob_bidder);
        test_scenario::return_to_sender(&scenario, bob_coin);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_bid_above_ceiling() {
        let mut scenario = test_scenario::begin(ALICE);
        let clock = clock::create_for_testing(scenario.ctx());
        clock::set_for_testing(&clock, 1000);
        
        // Create auction
        let auction = Auction::create_auction(
            scenario.ctx(),
            ALICE,
            100,
            1000,
            30000,
            &clock,
            string::utf8(b"Test NFT"),
            string::utf8(b"A test NFT for auction")
        );
        
        // Create bidder
        let bob_coin = test_scenario::take_from_sender<SUI>(&scenario);
        let bob_bidder = Bidder::create_bidder_profile(
            string::utf8(b"Bob"),
            scenario.ctx()
        );
        
        // Try to bid above ceiling (should fail)
        let bid_success = Auction::place_bid(
            &mut auction,
            BOB,
            1200, // Above ceiling of 1000
            &mut bob_coin,
            &clock,
            scenario.ctx()
        );
        
        assert!(!bid_success, 0);
        assert!(coin::value(&bob_coin) == 1000, 1); // Bob should still have all his money
        
        test_scenario::return_to_sender(&scenario, auction);
        test_scenario::return_to_sender(&scenario, bob_bidder);
        test_scenario::return_to_sender(&scenario, bob_coin);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_escrow_refund() {
        let mut scenario = test_scenario::begin(ALICE);
        let clock = clock::create_for_testing(scenario.ctx());
        clock::set_for_testing(&clock, 1000);
        
        // Create auction
        let auction = Auction::create_auction(
            scenario.ctx(),
            ALICE,
            100,
            1000,
            30000,
            &clock,
            string::utf8(b"Test NFT"),
            string::utf8(b"A test NFT for auction")
        );
        
        // Bob bids first
        let bob_coin = test_scenario::take_from_sender<SUI>(&scenario);
        let bob_bidder = Bidder::create_bidder_profile(
            string::utf8(b"Bob"),
            scenario.ctx()
        );
        
        let bob_bid_success = Auction::place_bid(
            &mut auction,
            BOB,
            200,
            &mut bob_coin,
            &clock,
            scenario.ctx()
        );
        assert!(bob_bid_success, 0);
        assert!(coin::value(&bob_coin) == 800, 1);
        
        // Charlie bids higher
        let charlie_coin = test_scenario::take_from_sender<SUI>(&scenario);
        let charlie_bidder = Bidder::create_bidder_profile(
            string::utf8(b"Charlie"),
            scenario.ctx()
        );
        
        let charlie_bid_success = Auction::place_bid(
            &mut auction,
            CHARLIE,
            500,
            &mut charlie_coin,
            &clock,
            scenario.ctx()
        );
        assert!(charlie_bid_success, 0);
        assert!(coin::value(&charlie_coin) == 500, 1);
        
        // Bob should have been refunded
        assert!(coin::value(&bob_coin) == 1000, 2); // Bob got his 200 back
        
        test_scenario::return_to_sender(&scenario, auction);
        test_scenario::return_to_sender(&scenario, bob_bidder);
        test_scenario::return_to_sender(&scenario, charlie_bidder);
        test_scenario::return_to_sender(&scenario, bob_coin);
        test_scenario::return_to_sender(&scenario, charlie_coin);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_auction_end_winner() {
        let mut scenario = test_scenario::begin(ALICE);
        let clock = clock::create_for_testing(scenario.ctx());
        clock::set_for_testing(&clock, 1000);
        
        // Create auction
        let auction = Auction::create_auction(
            scenario.ctx(),
            ALICE,
            100,
            1000,
            30000,
            &clock,
            string::utf8(b"Test NFT"),
            string::utf8(b"A test NFT for auction")
        );
        
        // Place winning bid
        let bob_coin = test_scenario::take_from_sender<SUI>(&scenario);
        let bob_bidder = Bidder::create_bidder_profile(
            string::utf8(b"Bob"),
            scenario.ctx()
        );
        
        let bid_success = Auction::place_bid(
            &mut auction,
            BOB,
            200,
            &mut bob_coin,
            &clock,
            scenario.ctx()
        );
        assert!(bid_success, 0);
        
        // Simulate time passing to trigger auction end
        clock::set_for_testing(&clock, 35000); // 35 seconds later
        
        let auction_ended = Auction::check_auction_end(&mut auction, &clock);
        assert!(auction_ended, 0);
        
        // End auction and transfer funds to seller
        let alice_coin = test_scenario::take_from_sender<SUI>(&scenario);
        Auction::end_auction(&mut auction, &mut alice_coin, scenario.ctx());
        
        // Alice should receive the winning bid
        assert!(coin::value(&alice_coin) == 200, 1);
        
        test_scenario::return_to_sender(&scenario, auction);
        test_scenario::return_to_sender(&scenario, bob_bidder);
        test_scenario::return_to_sender(&scenario, bob_coin);
        test_scenario::return_to_sender(&scenario, alice_coin);
        test_scenario::end(scenario);
    }
}
