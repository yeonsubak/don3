import { useIsMobile } from '@/components/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DBBackupUtil } from '@/db/db-backup-util';
import { PGliteWorker } from '@/db/pglite-web-worker';
import { cn } from '@/lib/utils';
import { LoaderCircle } from 'lucide-react';
import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentProps,
  type RefObject,
} from 'react';
import { toast } from 'sonner';
import { useSettingsDrawerContext } from '../../settings-drawer-context';

const RestoreButton = ({
  fileInputRef,
  handleFileChange,
  isFilePathValid,
  ...props
}: ComponentProps<typeof Button> & {
  fileInputRef: RefObject<HTMLInputElement | null>;
  handleFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  isFilePathValid: boolean;
}) => {
  const { isProcessing } = useSettingsDrawerContext();

  return (
    <div className="flex flex-row items-center gap-2">
      <Input
        ref={fileInputRef}
        type="file"
        accept=".zip"
        multiple={false}
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="destructive"
        disabled={!isFilePathValid || isProcessing}
        {...props}
      >
        {isProcessing ? (
          <LoaderCircle className={cn('h-4 w-4 animate-spin')} />
        ) : (
          <span>Restore</span>
        )}
      </Button>
    </div>
  );
};

export const RestoreAlert = () => {
  const { setIsProcessing, onClose } = useSettingsDrawerContext();
  const isMobile = useIsMobile();
  const CANCEL_BUTTON_LABEL = 'Cancel';

  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isFilePathValid = useMemo(
    () => !!file && file.type === 'application/x-zip-compressed',
    [file],
  );

  function handleFileChange() {
    const selectedFile = fileInputRef.current?.files?.[0] ?? null;
    setFile(selectedFile);
  }

  async function handleRestore() {
    if (!file) return;

    setIsProcessing(true);
    try {
      const pg = await PGliteWorker.createNewInstance();
      const backupUtil = new DBBackupUtil(pg);
      const { status, metaData } = await backupUtil.restoreDatabase(file);
      if (status === 'fail') {
        throw new Error(`Restoring database from ${metaData?.fileName} has failed.`);
      }

      toast.success(`Restoring database from ${metaData?.fileName} has been completed.`, {
        position: 'top-center',
      });
    } catch (err) {
      console.error(err);
      toast.error(`${err}`, { position: 'top-center' });
    } finally {
      onClose();
    }
  }

  return (
    <div className={cn('break-keep', isMobile ? 'pb-2' : '')}>
      <div>
        <p className="mb-2 text-pretty">
          Are you sure you want to restore your data from the previous backup?
        </p>
        <p className="mb-4 text-pretty">
          All data will be overriden by the backup and the current data will be{' '}
          <span className="text-destructive font-bold">
            permanently deleted and cannot be restored.
          </span>
        </p>
      </div>
      <RestoreButton
        className="w-20"
        onClick={handleRestore}
        fileInputRef={fileInputRef}
        handleFileChange={handleFileChange}
        isFilePathValid={isFilePathValid}
      />
    </div>
  );
};
