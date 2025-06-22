import { useIsMobile } from '@/components/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogFooter } from '@/components/ui/dialog';
import { SheetClose, SheetFooter } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTransactionDrawerContext } from '../../../transaction-drawer-context';
import type { Form } from './common';

type TransactionDrawerFooterProps = {
  zForm: Form;
};

const SaveButton = ({
  zForm,
  isProcessing,
  t,
  isMobile,
}: {
  zForm: Form;
  isProcessing: boolean;
  t: (label: string) => string;
  isMobile: boolean;
}) => (
  <Button
    type="submit"
    variant="default"
    disabled={!zForm.formState.isDirty || isProcessing}
    className={isMobile ? '' : 'w-20'}
  >
    {isProcessing ? <LoaderCircle className={cn('h-4 w-4 animate-spin')} /> : t('saveBtn')}
  </Button>
);

export const TransactionDrawerFooter = ({ zForm }: TransactionDrawerFooterProps) => {
  const isMobile = useIsMobile();
  const t = useTranslations('TransactionRecord.TransactionDrawer');
  const { isProcessing } = useTransactionDrawerContext();

  if (isMobile) {
    return (
      <SheetFooter className="px-0">
        <SaveButton zForm={zForm} isProcessing={isProcessing} isMobile={isMobile} t={t} />
        <SheetClose asChild>
          <Button variant="outline">{t('cancelBtn')}</Button>
        </SheetClose>
      </SheetFooter>
    );
  }

  return (
    <DialogFooter>
      <SaveButton zForm={zForm} isProcessing={isProcessing} isMobile={isMobile} t={t} />
      <DialogClose asChild>
        <Button variant="outline">{t('cancelBtn')}</Button>
      </DialogClose>
    </DialogFooter>
  );
};
