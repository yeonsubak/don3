'use client';

import { BudgetTracking } from '@/components/dashboard/widgets/budget-tracking';
import { IncomeExpenseChart } from '@/components/dashboard/widgets/income-expense-chart';
import { TopExpenseCategories } from '@/components/dashboard/widgets/top-expense-categories';
import { WorkInProgressDialog } from '@/components/dashboard/widgets/work-in-progress-dialog';
import { useEffect, useState } from 'react';

export default function AppPage() {
  const [isClientReady, setIsClientReady] = useState(false);

  useEffect(() => {
    setIsClientReady(true);
  }, []);

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <TopExpenseCategories />
        <BudgetTracking />
        <IncomeExpenseChart />
      </div>
      {isClientReady && <WorkInProgressDialog />}
    </div>
  );
}
