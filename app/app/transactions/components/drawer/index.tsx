'use client';

import { useIsMobile } from '@/components/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useTranslations } from 'next-intl';
import { DeleteTransactionAlert } from './delete-transaction-alert';
import { useTransactionDrawerContext } from '../../transaction-drawer-context';
import { TransactionFormTab } from './transaction-form-tab';

export const TransactionDrawer = () => {
  const { open, setOpen, mode } = useTransactionDrawerContext();
  const isMobile = useIsMobile();
  const t = useTranslations('TransactionRecord.TransactionDrawer');

  function getTitleByMode() {
    switch (mode) {
      case 'add':
        return t('titleAdd');
      case 'edit':
        return t('titleEdit');
      case 'delete':
        return t('titleDelete');
    }
  }

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="default" className="w-full text-lg">
            {t('triggerBtn')}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" closeBtnOnHeader={false} className="gap-1">
          <SheetHeader>
            <SheetTitle className="text-xl">{getTitleByMode()}</SheetTitle>
          </SheetHeader>
          {mode === 'delete' ? <DeleteTransactionAlert /> : <TransactionFormTab />}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="px-6 text-lg dark:text-white">
          {t('triggerBtn')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[540px]">
        <DialogHeader>
          <DialogTitle>{getTitleByMode()}</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        {mode === 'delete' ? <DeleteTransactionAlert /> : <TransactionFormTab />}
      </DialogContent>
    </Dialog>
  );
};
