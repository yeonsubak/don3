'use client';

import { useIsMobile } from '@/components/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Plus } from '@phosphor-icons/react';
import { useAccountDrawerContext } from './drawer-context';
import { ManageAccountCard } from './manage-account-card';

export const AddAccountButton = ({ countryCode }: { countryCode: string }) => {
  const { setOpen, formValues, setFormValues } = useAccountDrawerContext();

  const handleClick = () => {
    setFormValues({
      ...formValues,
      countryCode: countryCode,
    });
    setOpen(true);
  };

  return (
    <Button variant="outline" size="icon" onClick={handleClick}>
      <Plus size={24} />
    </Button>
  );
};

export const AddAccountDrawer = () => {
  const { open, setOpen, setFormValues, mode, setMode } = useAccountDrawerContext();
  const isMobile = useIsMobile();

  const modalTitle = mode == 'add' ? 'Add an account' : 'Edit the account';

  function handleOpenChange(open: boolean) {
    if (!open) {
      setFormValues(undefined);
      setMode('add');
    }
    setOpen(open);
  }

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" closeBtnOnHeader={false} className="gap-1">
          <SheetHeader>
            <SheetTitle className="text-xl">{modalTitle}</SheetTitle>
          </SheetHeader>
          <ManageAccountCard />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[540px]">
        <DialogHeader>
          <DialogTitle>{modalTitle}</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <ManageAccountCard />
      </DialogContent>
    </Dialog>
  );
};
