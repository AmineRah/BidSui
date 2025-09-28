'use client'
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function App() {
  const currentAccount = useCurrentAccount();

  return (
    <div className="container mx-auto p-6">
      <Card className="min-h-[500px]">
        <CardContent className="pt-6">
          {currentAccount ? (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to BidSui</h2>
              <p className="text-gray-600">Your auction platform is ready to use</p>
            </div>
          ) : (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to BidSui</h2>
              <p className="text-gray-600">Please connect your wallet to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
