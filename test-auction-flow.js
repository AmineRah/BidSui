#!/usr/bin/env node

/**
 * Test script to verify auction creation and retrieval flow
 */

const API_BASE_URL = 'http://localhost:3001';

async function testAuctionFlow() {
  console.log('🧪 Testing Auction Flow...\n');

  try {
    // 1. Test health check
    console.log('1. Testing health check...');
    const healthResponse = await fetch(`${API_BASE_URL}/api/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);

    // 2. Test getting auctions (should be empty initially)
    console.log('\n2. Testing get auctions...');
    const auctionsResponse = await fetch(`${API_BASE_URL}/api/auctions`);
    const auctionsData = await auctionsResponse.json();
    console.log('✅ Get auctions:', auctionsData);

    // 3. Test creating a mock auction (this will fail without proper NFT, but we can see the error)
    console.log('\n3. Testing auction creation (mock)...');
    const mockAuctionData = {
      seller: '0x1234567890abcdef',
      nft: '0xabcdef1234567890',
      minPrice: 100,
      maxPrice: 1000,
      durationMs: 86400000, // 24 hours
      name: 'Test Auction',
      description: 'This is a test auction',
      signer: '0x1234567890abcdef'
    };

    const createResponse = await fetch(`${API_BASE_URL}/api/auctions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockAuctionData),
    });

    const createData = await createResponse.json();
    console.log('📝 Create auction response:', createData);

    // 4. Test getting auctions again
    console.log('\n4. Testing get auctions after creation...');
    const auctionsResponse2 = await fetch(`${API_BASE_URL}/api/auctions`);
    const auctionsData2 = await auctionsResponse2.json();
    console.log('✅ Get auctions after creation:', auctionsData2);

    console.log('\n🎉 Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAuctionFlow();
