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
import type { AccountGroupSelect, AccountGroupType } from '@/db/drizzle/types';
import { getAccountsService } from '@/services/helper';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { createAccountGroupForm, type CreateAccountGroupForm } from './form-schema';

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
    console.log(result);

    setAccountGroups((prev) => [...prev, result]);

    if (submitPostHook) {
      submitPostHook(result);
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
