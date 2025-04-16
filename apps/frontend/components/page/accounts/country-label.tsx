import { useGlobalContext } from '@/app/app/global-context';
import { useTranslations } from 'next-intl';
import { AddAccountButton } from './add-drawer';
import { cn } from '@/lib/utils';

type CountryLabelProps = { idx: number; countryCode: string; children: React.ReactNode };
export const CountryLabel = ({ idx, countryCode, children }: CountryLabelProps) => {
  const { countriesInUse } = useGlobalContext();
  const tCountry = useTranslations('countryCode');

  return (
    <div key={countryCode}>
      <div className={cn('flex flex-row items-center justify-between')}>
        <h2 className={`p-4 text-2xl font-semibold`}>
          {tCountry(countryCode)}
          <span className="emoji ml-2">
            {countriesInUse.find((country) => country.code === countryCode)?.emoji}
          </span>
        </h2>
        <AddAccountButton />
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
};
