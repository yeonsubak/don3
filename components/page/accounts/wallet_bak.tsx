import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronsUpDown, Coins, CreditCard, Landmark, Settings } from 'lucide-react';
import { useState } from 'react';

export const WalletBackup = () => {
  const [isWalletOpen, setWalletOpen] = useState<boolean>(true);

  return (
    <>
      <Collapsible open={isWalletOpen} onOpenChange={setWalletOpen}>
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col">
              <div className="flex flex-row items-center justify-between">
                <h3 className="text-lg font-semibold">Cash and Cash Equivalents</h3>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <ChevronsUpDown className="h-4 w-4" />
                    <span className="sr-only">Toggle the checking accounts group</span>
                  </Button>
                </CollapsibleTrigger>
              </div>
              <h4 className="text-2xl font-semibold text-sky-600">$598,120.59</h4>
            </CardTitle>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-row items-center gap-2">
                <Coins color="#3e9392" className="flex-none w-9 h-9 p-1 rounded-2xl bg-amber-100" />
                <p className="grow text-lg">Cash</p>
                <div>
                  <p className="font-semibold text-sky-600">$560.00</p>
                  <p className="text-xs font-semibold">≈₩817,250</p>
                </div>
              </div>
              <div className="flex flex-row items-center gap-2">
                <Landmark
                  color="#3e9392"
                  className="flex-none w-9 h-9 p-1 rounded-2xl bg-amber-100"
                />
                <p className="grow">Toss Bank</p>
                <p className="font-semibold text-sky-600">$3,250.00</p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Collapsible open={isWalletOpen} onOpenChange={setWalletOpen}>
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-row items-center justify-between">
              <div className="flex flex-row items-center gap-2">
                <h2 className="text-xl font-bold">Main Wallet</h2>
                <Settings className="w-5 h-5 mt-1" />
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  <ChevronsUpDown className="h-4 w-4" />
                  <span className="sr-only">Toggle the checking accounts group</span>
                </Button>
              </CollapsibleTrigger>
            </CardTitle>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="flex flex-col gap-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex flex-col items-cetner justify-between">
                    <h3 className="text-lg font-semibold text-gray-500">
                      Cash and Cash Equivalents
                    </h3>
                    <h4 className="text-lg font-semibold text-sky-600">$598,120.59</h4>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex flex-row items-center gap-2">
                    <Coins
                      color="#3e9392"
                      className="flex-none w-9 h-9 p-1 rounded-2xl bg-amber-100"
                    />
                    <p className="grow">Cash</p>
                    <p className="font-semibold text-sky-600">$560.00</p>
                  </div>
                  <div className="flex flex-row items-center gap-2">
                    <Landmark
                      color="#3e9392"
                      className="flex-none w-9 h-9 p-1 rounded-2xl bg-amber-100"
                    />
                    <p className="grow">Toss Bank</p>
                    <p className="font-semibold text-sky-600">$3,250.00</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex flex-col items-cetner justify-between">
                    <h3 className="text-lg font-semibold text-gray-500">Credit/Debit Cards</h3>
                    <h4 className="text-lg font-semibold text-rose-600">- $820.89</h4>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex flex-row items-center gap-2">
                    <CreditCard
                      color="#3e9392"
                      className="flex-none w-9 h-9 p-1 rounded-2xl bg-amber-100"
                    />
                    <p className="grow">Samsung Credit Card</p>
                    <p className="font-semibold text-rose-600">$820.89</p>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </>
  );
};
