import { Combobox, type ComboboxItem } from '@/components/primitives/combobox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { SnapshotSelect } from '@/db/sync-db/drizzle-types';
import { QUERIES } from '@/lib/tanstack-queries';
import { cn } from '@/lib/utils';
import { getBackupService } from '@/services/service-helpers';
import { useQuery } from '@tanstack/react-query';
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

type RestoreFileInputProps = ComponentProps<typeof Input> & {
  fileInputRef: RefObject<HTMLInputElement | null>;
  handleFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  isFilePathValid: boolean;
};

const RestoreFileInput = ({
  fileInputRef,
  handleFileChange,
  isFilePathValid,
  ...props
}: RestoreFileInputProps) => (
  <Input
    ref={fileInputRef}
    type="file"
    accept=".zip"
    multiple={false}
    onChange={handleFileChange}
    {...props}
  />
);

type RestoreComboboxProps = {
  fileInput: RestoreFileInputProps;
  snapshotItems: ComboboxItem<SnapshotSelect>[];
};

const RestoreCombobox = ({ fileInput, snapshotItems }: RestoreComboboxProps) => {
  return (
    <Combobox
      searchable={false}
      extraComponents={[
        {
          component: <RestoreFileInput key="restore-file-input" {...fileInput} />,
          label: 'Select from backup file',
        },
      ]}
      items={snapshotItems}
    />
  );
};

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
  const CANCEL_BUTTON_LABEL = 'Cancel';

  const { data: snapShots } = useQuery(QUERIES.sync.getAllSnapshots());
  const snapShotItems: ComboboxItem<SnapshotSelect>[] = useMemo(() => {
    const items = snapShots?.map((e) => ({ label: e.id, value: e.id, data: e }));
    return [
      {
        label: 'Select from snapshots',
        value: '',
        children: items,
      },
    ];
  }, [snapShots]);

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
      const backupService = await getBackupService();
      const { status, meta } = await backupService.restoreDB(file, true);
      if (status === 'fail') {
        throw new Error(`Restoring database from ${meta?.fileName} has failed.`);
      }

      toast.success(`Restoring database from ${meta?.fileName} has been completed.`, {
        position: 'top-center',
      });
    } catch (err) {
      console.error(err);
      toast.error(`${err}`, { position: 'top-center' });
    } finally {
      onClose();
    }
  }

  const fileInputProps = {
    fileInputRef,
    handleFileChange,
    isFilePathValid,
  };

  return (
    <div className={cn('break-keep')}>
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
      <RestoreCombobox fileInput={fileInputProps} snapshotItems={snapShotItems} />
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
