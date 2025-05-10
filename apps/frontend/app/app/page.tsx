'use client';

import { BudgetTracking } from '@/components/dashboard/widgets/budget-tracking';
import { IncomeExpenseChart } from '@/components/dashboard/widgets/income-expense-chart';
import { TopExpenseCategories } from '@/components/dashboard/widgets/top-expense-categories';
import { WorkInProgressDialog } from '@/components/dashboard/widgets/work-in-progress-dialog';
import { LOCAL_STORAGE_KEYS } from '@/lib/constants';

export default function AppPage() {
  const isInitialized =
    (localStorage.getItem(LOCAL_STORAGE_KEYS.APP.INITIALIZED) ?? 'false') === 'true';

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <TopExpenseCategories />
        <BudgetTracking />
        <IncomeExpenseChart />
      </div>
      {isInitialized ? <WorkInProgressDialog /> : null}
    </div>
  );
}
