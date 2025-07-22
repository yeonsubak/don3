import { Check, LoaderCircle } from 'lucide-react';
import { useEffect, type DependencyList, type EffectCallback } from 'react';

type CompletionStepProps = {
  status: 'inProcess' | 'done';
  syncFn: EffectCallback;
  syncFnDeps?: DependencyList;
};

const CompletionDone = () => (
  <div className="flex grow flex-col space-y-4 py-4 text-center">
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
      <Check className="h-8 w-8 text-green-600" />
    </div>
    <h3 className="text-lg font-medium">All set!</h3>
    <p className="text-muted-foreground text-left">You are now ready to use the app. Enjoy!</p>
  </div>
);

const CompletionInProcess = () => (
  <>
    <p className="text-muted-foreground">Your cloud data is now syncing to your device.</p>
    <LoaderCircle className="stroke-primary h-8 w-8 animate-spin self-center" />
  </>
);

export const CompletionStep = ({ status, syncFn, syncFnDeps }: CompletionStepProps) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(syncFn, syncFnDeps);

  return (
    <div className="flex flex-col gap-4">
      {status === 'done' ? <CompletionDone /> : <CompletionInProcess />}
    </div>
  );
};
