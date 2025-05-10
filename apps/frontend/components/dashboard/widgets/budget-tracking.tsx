'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Bar, BarChart, CartesianGrid, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

// Sample data for the chart
const budgetData = [
  {
    category: 'Housing',
    budget: 2000,
    spent: 1800,
    remaining: 200,
    percentUsed: 90,
  },
  {
    category: 'Food',
    budget: 800,
    spent: 650,
    remaining: 150,
    percentUsed: 81,
  },
  {
    category: 'Transportation',
    budget: 600,
    spent: 450,
    remaining: 150,
    percentUsed: 75,
  },
  {
    category: 'Entertainment',
    budget: 400,
    spent: 380,
    remaining: 20,
    percentUsed: 95,
  },
  {
    category: 'Shopping',
    budget: 500,
    spent: 620,
    remaining: -120,
    percentUsed: 124,
  },
  {
    category: 'Utilities',
    budget: 300,
    spent: 280,
    remaining: 20,
    percentUsed: 93,
  },
];

export function BudgetTracking() {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getProgressColor = (percentUsed: number) => {
    if (percentUsed >= 100) return 'bg-red-500';
    if (percentUsed >= 85) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const chartConfig = {
    budget: {
      label: 'Budget',
      color: 'hsl(var(--chart-1))',
    },
    spent: {
      label: 'Spent',
      color: 'hsl(var(--chart-2))',
    },
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Budget Tracking</CardTitle>
        <CardDescription>Monitor your spending against budget limits</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 h-[200px]">
          <ChartContainer config={chartConfig} className="container h-full">
            <BarChart
              data={budgetData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
              accessibilityLayer
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip content={<ChartTooltipContent />} />
              <ReferenceLine y={0} stroke="#666" />
              <Bar
                dataKey="budget"
                fill="var(--color-budget)"
                radius={[4, 4, 0, 0]}
                opacity={0.4}
              />
              <Bar dataKey="spent" fill="var(--color-spent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>

        <div className="space-y-4">
          {budgetData.map((item, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{item.category}</span>
                <span className="text-sm font-medium">
                  {formatCurrency(item.spent)} / {formatCurrency(item.budget)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Progress
                  value={Math.min(item.percentUsed, 100)}
                  className={cn('h-2', getProgressColor(item.percentUsed))}
                />
                <span className="text-muted-foreground w-12 text-right text-xs">
                  {item.percentUsed}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
