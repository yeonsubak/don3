import { PasskeyActivateButton } from '@/components/buttons/passkey-activate-button';
import { useSession, type Session } from '@/lib/better-auth/auth-client';
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { type Dispatch, type SetStateAction } from 'react';

export const StepAuthPasskey = ({
  setEnableNext,
}: {
  setEnableNext: Dispatch<SetStateAction<boolean>>;
}) => {
  const session: Session = useSession();
  const queryClient = useQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <PasskeyActivateButton
        className="mt-2 w-full text-base"
        session={session}
        queryClient={queryClient}
        postHook={() => {
          setEnableNext(true);
        }}
      />
    </QueryClientProvider>
  );
};
