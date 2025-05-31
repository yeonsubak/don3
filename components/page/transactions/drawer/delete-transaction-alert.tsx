import { useIsMobile } from '@/components/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogFooter } from '@/components/ui/dialog';
import { SheetClose, SheetFooter } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { getTransactionService } from '@/services/helper';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type ComponentProps } from 'react';
import { toast } from 'sonner';
import { useTransactionContext } from '../transaction-context';
import { TransactionItemMobile } from '../transaction-item-mobile';
import { useTransactionDrawerContext } from './drawer-context';

export const DeleteTransactionAlert = () => {
  const isMobile = useIsMobile();
  const {
    calendarDateState: [dates, setDates],
  } = useTransactionContext();
  const { setOpen, record, isProcessing, setIsProcessing } = useTransactionDrawerContext();
  const t = useTranslations('Entry.Type');

  const DeleteButton = ({ ...props }: ComponentProps<typeof Button>) => (
    <Button type="button" variant="destructive" disabled={isProcessing} {...props}>
      {isProcessing ? <LoaderCircle className={cn('h-4 w-4 animate-spin')} /> : <span>Delete</span>}
    </Button>
  );

  const CANCEL_BUTTON_LABEL = 'Cancel';

  async function handleSubmit() {
    setIsProcessing(true);
    try {
      if (!record) throw new Error('The record object is undefined');

      const transactionService = await getTransactionService();
      await transactionService.deleteTransaction(record.id);

      const start = dates!.from!;
      const end = dates!.to!;
      setDates({ from: new Date(start), to: new Date(end) });
      toast.success(`The record has been deleted: [${t(record.type)}] ${record.title}`, {
        position: 'top-center',
      });
    } catch (err) {
      console.error(err);
    } finally {
      setOpen(false);
    }
  }

  return (
    <>
      <div className={cn('break-keep', isMobile ? 'px-4 py-2' : '')}>
        <p className="mb-4 text-pretty">Are you sure you want to delete the record?</p>
        <TransactionItemMobile item={record!} readonly />
      </div>
      {isMobile ? (
        <SheetFooter>
          <DeleteButton onClick={handleSubmit} />
          <SheetClose asChild>
            <Button variant="outline">{CANCEL_BUTTON_LABEL}</Button>
          </SheetClose>
        </SheetFooter>
      ) : (
        <DialogFooter className="mt-4">
          <DeleteButton className="w-20" onClick={handleSubmit} />
          <DialogClose asChild>
            <Button variant="outline">{CANCEL_BUTTON_LABEL}</Button>
          </DialogClose>
        </DialogFooter>
      )}
    </>
  );
};
