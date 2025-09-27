// Exemple d'utilisation du système d'enchères hollandaises

/* 
SYSTÈME D'ENCHÈRES HOLLANDAISES TEMPORISÉES

Principe : Le prix diminue linéairement de max_val vers min_val pendant duration_ms

Exemple concret :
- Prix de départ : 1000 SUI
- Prix minimum : 100 SUI  
- Durée : 30 secondes (30000ms)
- Diminution : (1000-100) / 30s = 30 SUI par seconde

Timeline de prix :
t=0s  : Prix = 1000 SUI
t=5s  : Prix = 1000 - (5 * 30) = 850 SUI
t=10s : Prix = 1000 - (10 * 30) = 700 SUI  
t=15s : Prix = 1000 - (15 * 30) = 550 SUI
t=20s : Prix = 1000 - (20 * 30) = 400 SUI
t=25s : Prix = 1000 - (25 * 30) = 250 SUI
t=30s : Prix = 100 SUI (minimum atteint)
t>30s : ENCHÈRE EXPIRÉE

Scénario d'enchères :
1. Alice crée enchère : 1000→100 SUI en 30s
2. Bob bid 200 à t=5s (prix=850) → Refusé (trop bas)
3. Charlie bid 800 à t=10s (prix=700) → Accepté (current_bidder=Charlie)
4. Bob bid 900 à t=15s (prix=550) → Accepté (surenchère, current_bidder=Bob)
5. Fin à t=30s → Bob gagne avec 900 SUI

Formule de calcul :
current_price = max_val - ((time_elapsed / duration) * (max_val - min_val))
*/

module Example::Usage {
    use Seller::Seller;
    use Bidder::Bidder;
    use AuctionCore::Auction::{Self as AuctionModule};
    use sui::clock::Clock;
    use sui::tx_context::TxContext;
    use std::string;

    // Exemple de scénario d'enchères
    public fun example_auction_scenario(
        alice_seller: &mut Seller::SellerProfile,
        bob_bidder: &mut Bidder::BidderProfile,
        charlie_bidder: &mut Bidder::BidderProfile,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Alice crée une enchère
        AuctionModule::create_auction(
            ctx, 
            100,     // min_val (prix final)
            1000,    // max_val (prix de départ)
            30000,   // duration_ms (30 secondes)
            clock, 
            string::utf8(b"Rare NFT"),
            string::utf8(b"Une oeuvre d'art unique")
        );
        
        // À ce moment, il faudrait récupérer l'auction créée
        // et faire les bids avec Bob et Charlie
        
        // Bob::bid(bob_bidder, &mut auction, 200, clock); // Peut être refusé
        // Charlie::bid(charlie_bidder, &mut auction, 800, clock); // Accepté
        // Bob::bid(bob_bidder, &mut auction, 900, clock); // Accepté, surenchère
        
        // AuctionModule::end_auction(&mut auction); // Terminer
        
        // Résultat : Bob gagne avec 900
    }
}