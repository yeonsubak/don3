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
import { useMemo, type ComponentProps } from 'react';
import { AccountForm } from './account-form';
import { ArchiveAlert } from './archive-alert';
import { DeleteAccountAlert } from './delete-account-alert';
import { useAccountDrawerContext } from './drawer-context';
import { ReactivateAlert } from './reactivate-alert';

export const AddAccountButton = ({
  countryCode,
  ...props
}: ComponentProps<typeof Button> & { countryCode: string }) => {
  const { setOpen } = useAccountDrawerContext();
  const { formValues, setFormValues } = useAccountDrawerContext();

  const handleClick = () => {
    setFormValues({
      ...formValues,
      countryCode: countryCode,
    });
    setOpen(true);
  };

  return (
    <Button variant="outline" size="icon" onClick={handleClick} {...props}>
      <Plus size={24} />
    </Button>
  );
};

const DrawerContent = () => {
  const { mode } = useAccountDrawerContext();

  switch (mode) {
    case 'delete':
      return <DeleteAccountAlert />;
    case 'archive':
      return <ArchiveAlert />;
    case 'reactivate':
      return <ReactivateAlert />;
    default:
      return <AccountForm />;
  }
};

export const AccountDrawer = () => {
  const { open, setOpen, mode } = useAccountDrawerContext();
  const isMobile = useIsMobile();

  const modalTitle = useMemo(() => {
    switch (mode) {
      case 'add':
        return 'Add an account';
      case 'edit':
        return 'Edit the account';
      case 'archive':
        return 'Archive the account';
      case 'reactivate':
        return 'Reactivate the account';
      case 'delete':
        return 'Delete the account';
      default:
        throw new Error('Invalid mode');
    }
  }, [mode]);

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" closeBtnOnHeader={false} className="gap-1">
          <SheetHeader>
            <SheetTitle className="text-xl">{modalTitle}</SheetTitle>
          </SheetHeader>
          <DrawerContent />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[540px]">
        <DialogHeader>
          <DialogTitle>{modalTitle}</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <DrawerContent />
      </DialogContent>
    </Dialog>
  );
};
