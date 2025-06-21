import { useGlobalContext } from '@/app/app/global-context';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { accountGroups } from '@/db/drizzle/schema';
import type { AccountGroupSelect, AccountGroupType } from '@/db/drizzle/types';
import { getAccountsService } from '@/services/service-helpers';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

export const createAccountGroupForm = z.object({
  type: z.enum(accountGroups.type.enumValues),
  name: z.string().min(1, {
    message: 'Name must be at least 1 character.',
  }),
  description: z.string().optional(),
});

export type CreateAccountGroupForm = z.infer<typeof createAccountGroupForm>;

type AddAccountGroupFormProps = {
  groupType: AccountGroupType;
  submitPostHook?: (result: AccountGroupSelect) => void;
};

export const AddAccountGroupForm = ({ groupType, submitPostHook }: AddAccountGroupFormProps) => {
  const { setAccountGroups } = useGlobalContext();

  const form = useForm<CreateAccountGroupForm>({
    resolver: zodResolver(createAccountGroupForm),
    defaultValues: {
      type: groupType,
      name: '',
      description: '',
    },
  });

  async function handleSubmit() {
    const isValid = await form.trigger(undefined, { shouldFocus: true });
    if (!isValid) return;
    const formValues = form.getValues();
    const accountsService = await getAccountsService();
    const result = await accountsService.insertAccountGroup(formValues);
    if (result) {
      setAccountGroups((prev) => [...prev, result]);

      if (submitPostHook) {
        submitPostHook(result);
      }
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-md font-medium">Add a new account group</h4>
      <div>
        <Form {...form}>
          <form className="flex flex-col gap-2 px-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Name</FormLabel>
                  <FormControl>
                    <Input type="text" id="name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="button" variant="default" onClick={handleSubmit}>
              Submit
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};
