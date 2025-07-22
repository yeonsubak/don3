import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useMemo } from 'react';
import { useSettingsDrawerContext } from '../../settings-drawer-context';
import { EnableSyncModal } from './enable-sync-modal';
import { RestoreAlert } from './restore-alert';

const DrawerContent = () => {
  const { mode } = useSettingsDrawerContext();

  switch (mode) {
    case 'sync':
      return <EnableSyncModal />;
    case 'restore':
      return <RestoreAlert />;
    default:
      return <></>;
  }
};

export const SettingsDrawer = () => {
  const { open, mode, onClose } = useSettingsDrawerContext();

  const modalTitle = useMemo(() => {
    switch (mode) {
      case 'sync':
        return 'Enable sync';
      case 'backup':
        return 'Backup your data';
      case 'restore':
        return 'Restore your data from backup';
      default:
        throw new Error('Invalid mode');
    }
  }, [mode]);

  function onOpenChange(open: boolean) {
    if (!open) {
      onClose();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
