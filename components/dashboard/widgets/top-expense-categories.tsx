'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { QuestionMark } from '@phosphor-icons/react';
import { Car, Coffee, Film, Home, ShoppingCart } from 'lucide-react';
import { Cell, Legend, Pie, PieChart, Tooltip } from 'recharts';

// Sample data for the chart
const data = [
  { name: 'Shopping', value: 1200, icon: ShoppingCart, color: 'hsl(var(--chart-1))' },
  { name: 'Food & Dining', value: 850, icon: Coffee, color: 'hsl(var(--chart-2))' },
  { name: 'Transportation', value: 650, icon: Car, color: 'hsl(var(--chart-3))' },
  { name: 'Housing', value: 1800, icon: Home, color: 'hsl(var(--chart-4))' },
  { name: 'Entertainment', value: 450, icon: Film, color: 'hsl(var(--chart-5))' },
  { name: 'Other', value: 350, icon: QuestionMark, color: 'hsl(var(--chart-6))' },
];

export function TopExpenseCategories() {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const totalExpenses = data.reduce((sum, item) => sum + item.value, 0);

  // Create chart config for shadcn/ui chart
  const chartConfig = data.reduce((config, item) => {
    return {
      ...config,
      [item.name]: {
        label: item.name,
        color: item.color,
      },
    };
  }, {});

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Top Expense Categories</CardTitle>
        <CardDescription>Where your money is going this month</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ChartContainer config={chartConfig} className="container h-full">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                innerRadius={40}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltipContent />} />
              <Legend align="left" />
            </PieChart>
          </ChartContainer>
        </div>

        <div className="mt-4 space-y-3">
          {data.map((category, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-full p-1.5" style={{ backgroundColor: category.color }}>
                  <category.icon className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-sm font-medium">{category.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{formatCurrency(category.value)}</span>
                <span className="text-muted-foreground text-xs">
                  {Math.round((category.value / totalExpenses) * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
