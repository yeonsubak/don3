'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from 'recharts';

// Sample data for the chart
const monthlyData = [
  { name: 'Jan', income: 4500, expenses: 3200 },
  { name: 'Feb', income: 5200, expenses: 3800 },
  { name: 'Mar', income: 4800, expenses: 3600 },
  { name: 'Apr', income: 5500, expenses: 4100 },
  { name: 'May', income: 6000, expenses: 4300 },
  { name: 'Jun', income: 5800, expenses: 4500 },
];

const quarterlyData = [
  { name: 'Q1', income: 14500, expenses: 10600 },
  { name: 'Q2', income: 17300, expenses: 12900 },
  { name: 'Q3', income: 16200, expenses: 11800 },
  { name: 'Q4', income: 18500, expenses: 13200 },
];

const yearlyData = [
  { name: '2022', income: 52000, expenses: 38000 },
  { name: '2023', income: 58000, expenses: 42000 },
  { name: '2024', income: 62000, expenses: 45000 },
  { name: '2025', income: 66500, expenses: 48500 },
];

type TimeRange = 'monthly' | 'quarterly' | 'yearly';

export function IncomeExpenseChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>('monthly');

  const data = {
    monthly: monthlyData,
    quarterly: quarterlyData,
    yearly: yearlyData,
  }[timeRange];

  const chartConfig = {
    income: {
      label: 'Income',
      color: 'hsl(var(--chart-1))',
    },
    expenses: {
      label: 'Expenses',
      color: 'hsl(var(--chart-2))',
    },
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base">Income vs. Expenses</CardTitle>
          <CardDescription>Compare your income and expenses over time</CardDescription>
        </div>
        <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="h-fit pt-4">
        <div className="">
          <ChartContainer config={chartConfig} className="container h-full">
            <BarChart data={data} accessibilityLayer>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
