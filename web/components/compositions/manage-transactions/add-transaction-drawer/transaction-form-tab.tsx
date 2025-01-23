'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { type ReactNode } from 'react';
import { ExpenseForm } from './expense-form';

export const TransactionFormTab = ({ footer }: { footer: ReactNode }) => {
  return (
    <Tabs defaultValue="expense">
      <div className="px-2">
        <TabsList className="w-full">
          <div className="grid w-full grid-flow-col">
            <TabsTrigger value="expense" className="grow">
              Expense
            </TabsTrigger>
            <TabsTrigger value="income" className="grow">
              Income
            </TabsTrigger>
            <TabsTrigger value="transfer" className="grow">
              Transfer
            </TabsTrigger>
          </div>
        </TabsList>
      </div>
      <TabsContent value="expense">
        <ExpenseForm footer={footer} />
      </TabsContent>
      <TabsContent value="income"></TabsContent>
    </Tabs>
  );
};
