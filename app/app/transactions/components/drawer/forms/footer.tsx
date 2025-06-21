import { useIsMobile } from '@/components/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogFooter } from '@/components/ui/dialog';
import { SheetClose, SheetFooter } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Form } from './common';
import { useTransactionDrawerContext } from '../../../transaction-drawer-context';

type TransactionDrawerFooterProps = {
  zForm: Form;
};

export const TransactionDrawerFooter = ({ zForm }: TransactionDrawerFooterProps) => {
  const isMobile = useIsMobile();
  const t = useTranslations('TransactionRecord.TransactionDrawer');
  const { isProcessing } = useTransactionDrawerContext();

  const SaveButton = () => (
    <Button type="submit" variant="default" disabled={!zForm.formState.isDirty || isProcessing}>
      {isProcessing ? <LoaderCircle className={cn('h-4 w-4 animate-spin')} /> : t('saveBtn')}
    </Button>
  );

  if (isMobile) {
    return (
      <SheetFooter className="px-0">
        <SaveButton />
        <SheetClose asChild>
          <Button variant="outline">{t('cancelBtn')}</Button>
        </SheetClose>
      </SheetFooter>
    );
  }

  return (
    <DialogFooter>
      <SaveButton />
      <DialogClose asChild>
        <Button variant="outline">{t('cancelBtn')}</Button>
      </DialogClose>
    </DialogFooter>
  );
};
