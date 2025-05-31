import { useGlobalContext } from '@/app/app/global-context';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { ChevronsUpDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AddAccountButton } from './drawer';

type CountryLabelProps = { countryCode: string; className?: string };
export const CountryLabel = ({ countryCode, className }: CountryLabelProps) => {
  const { countriesInUse } = useGlobalContext();
  const tCountry = useTranslations('countryCode');

  return (
    <h2 className={cn('p-4 text-xl font-semibold', className)}>
      {tCountry(countryCode)}
      <span className="emoji ml-2">
        {countriesInUse.find((country) => country.code === countryCode)?.emoji}
      </span>
    </h2>
  );
};

type CountrySectionProps = { countryCode: string; children: React.ReactNode };
export const CountrySection = ({ countryCode, children }: CountrySectionProps) => {
  return (
    <Collapsible key={countryCode} defaultOpen>
      <div className="flex flex-row items-center">
        <CollapsibleTrigger className="flex grow cursor-pointer flex-row items-center">
          <ChevronsUpDown className="h-4 w-4" />
          <CountryLabel countryCode={countryCode} className="px-2 py-4" />
        </CollapsibleTrigger>
        <AddAccountButton countryCode={countryCode} className="grow-0" />
      </div>
      <CollapsibleContent className="flex flex-col gap-2">{children}</CollapsibleContent>
    </Collapsible>
  );
};
