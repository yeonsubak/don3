import { useGlobalContext } from '@/app/app/global-context';
import { useTransactionContext } from '@/components/page/transactions/transaction-context';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover } from '@/components/ui/popover';
import { PopoverContent, PopoverTrigger } from '@radix-ui/react-popover';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DateTime } from 'luxon';
import type { DateRange } from 'react-day-picker';

export const TransactionCalendar = () => {
  const { defaultLanguage } = useGlobalContext();
  const {
    calendarDateState: [dates, setDates],
  } = useTransactionContext();

  const handlePreviousMonth = () => {
    const start = DateTime.fromJSDate(dates?.to ?? new Date())
      .startOf('month')
      .minus({ months: 1 });
    const end = start.endOf('month');
    setDates({ from: start.toJSDate(), to: end.toJSDate() });
  };
  const handleNextMonth = () => {
    const start = DateTime.fromJSDate(dates?.to ?? new Date())
      .startOf('month')
      .plus({ months: 1 });
    const end = start.endOf('month');
    setDates({ from: start.toJSDate(), to: end.toJSDate() });
  };

  const handleSelectDates = (range: DateRange | undefined) => {
    if (!range) return;

    setDates(range);
  };

  return (
    <div className="flex items-center justify-center gap-3">
      <Button variant="ghost" size="icon" onClick={handlePreviousMonth}>
        <ChevronLeft size="48" />
      </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" className="text-lg font-normal">
            {formatDateRange(dates, defaultLanguage)}
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <Calendar
            mode="range"
            defaultMonth={dates?.from}
            selected={dates}
            onSelect={handleSelectDates}
            numberOfMonths={1}
          />
        </PopoverContent>
      </Popover>
      <Button variant="ghost" size="icon" onClick={handleNextMonth}>
        <ChevronRight className="h-6 w-6" />
      </Button>
    </div>
  );
};

const isFullMonth = (dateRange: DateRange | undefined) => {
  if (!dateRange) return false;

  const { from, to } = dateRange;

  const startDate = from ? DateTime.fromJSDate(from) : undefined;
  const endDate = to ? DateTime.fromJSDate(to) : undefined;

  if (!startDate || !endDate) return false;

  const diff = endDate.diff(startDate, 'days');
  if (diff.days < 27 || diff.days > 31) return false;

  const startOfMonth = startDate.startOf('month');
  const endOfMonth = startDate.endOf('month');

  return startDate.diff(startOfMonth).days === 0 && endOfMonth.diff(endDate).days === 0;
};

const formatDateRange = (dateRange: DateRange | undefined, locale: string) => {
  const formatDate = (date: Date, locale: string) => {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
    }).format(date);
  };

  if (isFullMonth(dateRange)) {
    return formatDate(dateRange!.from!, locale);
  }

  if (!dateRange?.from || !dateRange.to) {
    return '';
  }

  return `${DateTime.fromJSDate(dateRange.from).toFormat('DDD')} - ${DateTime.fromJSDate(dateRange.to).toFormat('DDD')}`;
};
