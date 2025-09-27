// Exemple d'utilisation du système d'enchères hybrides English-Dutch

/* 
SYSTÈME D'ENCHÈRES HYBRIDES ENGLISH-DUTCH

Principe : 
- Le plafond (ceiling) diminue linéairement de max_val vers min_val
- Les participants peuvent enchérir en dessous du plafond actuel
- L'enchère se termine quand le plafond atteint la plus haute enchère

Exemple concret :
- Plafond de départ : 1000 SUI
- Prix minimum : 100 SUI  
- Durée : 30 secondes (30000ms)
- Diminution du plafond : (1000-100) / 30s = 30 SUI par seconde

Timeline du plafond :
t=0s  : Plafond = 1000 SUI
t=5s  : Plafond = 1000 - (5 * 30) = 850 SUI
t=10s : Plafond = 1000 - (10 * 30) = 700 SUI  
t=15s : Plafond = 1000 - (15 * 30) = 550 SUI
t=20s : Plafond = 1000 - (20 * 30) = 400 SUI
t=25s : Plafond = 1000 - (25 * 30) = 250 SUI
t=30s : Plafond = 100 SUI (minimum atteint)

Scénario d'enchères avec ESCROW :
1. Alice crée enchère : plafond 1000→100 SUI en 30s
2. Bob bid 200 à t=5s (plafond=850) → Accepté, 200 SUI bloqués
3. Charlie bid 800 à t=10s (plafond=700) → Accepté, 800 SUI bloqués, Bob reçoit 200 SUI
4. Bob bid 900 à t=15s (plafond=550) → Refusé (au-dessus du plafond!)
5. À t=20s, plafond=400, Charlie gagne avec 800 SUI (plafond > 800)
6. Alice reçoit 800 SUI, Charlie obtient l'objet

Formule de calcul du plafond :
current_ceiling = max_val - ((time_elapsed / duration) * (max_val - min_val))
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