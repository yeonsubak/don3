import { externalDB } from '@/db/external-db/drizzle-client';
import * as schema from '@/db/external-db/migration/schema';
import { and, between, desc, eq } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { NextResponse, type NextRequest } from 'next/server';

export type FetchFxRate = {
  amount: number;
  base: string;
  date: string;
  rates: {
    [key: string]: number;
  };
};

export async function GET(
  request: NextRequest,
): Promise<NextResponse<FetchFxRate | { error: string }>> {
  const searchParams = request.nextUrl.searchParams;
  const from = searchParams.get('baseCurrency');
  const to = searchParams.get('targetCurrency');

  if (!from || !to) {
    return NextResponse.json({ error: 'Insufficient search params' }, { status: 500 });
  }

  if (externalDB) {
    const targetCurrencies = to.split(',');
    const now = DateTime.now();
    const fourHourBefore = now.minus({ hours: 4 });

    const latestForex = await externalDB
      .selectDistinctOn([schema.forex.baseCurrency, schema.forex.targetCurrency])
      .from(schema.forex)
      .where(
        and(
          eq(schema.forex.baseCurrency, from),
          between(schema.forex.createAt, fourHourBefore.toJSDate(), now.toJSDate()),
        ),
      )
      .orderBy(schema.forex.baseCurrency, schema.forex.targetCurrency, desc(schema.forex.createAt));

    if (
      latestForex.length > 0 &&
      latestForex.every((e) => targetCurrencies.includes(e.targetCurrency))
    ) {
      const resObj: FetchFxRate = {
        amount: 1,
        date: latestForex.at(0)!.date,
        base: from,
        rates: {},
      };
      latestForex.forEach((e) => {
        resObj.rates[e.targetCurrency] = parseFloat(e.rate);
      });

      return NextResponse.json(resObj);
    }
  }

  const res = await fetch(`https://api.frankfurter.dev/v1/latest?base=${from}`, {
    method: 'GET',
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: 'An error occured while fetching the latest exchange rate.' },
      { status: 500 },
    );
  }

  const fetched: FetchFxRate = await res.json();

  if (externalDB) {
    const insertObj: ForexInsert[] = Object.entries(fetched.rates).map(([key, value]) => ({
      date: fetched.date,
      baseCurrency: from,
      targetCurrency: key,
      rate: value.toFixed(5),
    }));

    await externalDB.insert(schema.forex).values(insertObj);
  }

  return NextResponse.json(fetched);
}

type ForexInsert = typeof schema.forex.$inferInsert;
