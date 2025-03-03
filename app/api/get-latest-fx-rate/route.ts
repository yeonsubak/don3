import * as schema from '@/db/supabase/schema';
import { and, between, desc, eq, inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { DateTime } from 'luxon';
import { NextResponse, type NextRequest } from 'next/server';
import postgres from 'postgres';

export type FetchFxRate = {
  date: string;
  baseCurrency: string;
  rates: {
    [key: string]: string;
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

  const supabaseClient = postgres(process.env.SUPABASE_URL!, { prepare: false });
  const db = drizzle(supabaseClient, {
    schema,
    casing: 'snake_case',
  });

  const targetCurrencies = to.split(',');
  const now = DateTime.now();
  const fourHourBefore = now.minus({ hours: 4 }).toUTC();

  const latestForexes = await db
    .selectDistinctOn([schema.forex.baseCurrency, schema.forex.targetCurrency])
    .from(schema.forex)
    .where(
      and(
        eq(schema.forex.baseCurrency, from),
        inArray(schema.forex.targetCurrency, targetCurrencies),
        between(schema.forex.createdAt, fourHourBefore.toISO(), now.toISO()),
      ),
    )
    .orderBy(schema.forex.baseCurrency, schema.forex.targetCurrency, desc(schema.forex.createdAt));

  if (
    latestForexes.length > 0 &&
    latestForexes.every((e) => targetCurrencies.includes(e.targetCurrency))
  ) {
    const resObj: FetchFxRate = {
      date: latestForexes.at(0)!.date,
      baseCurrency: from,
      rates: {},
    };
    latestForexes.forEach((e) => {
      resObj.rates[e.targetCurrency] = e.rate;
    });

    return NextResponse.json(resObj);
  }

  const res = await fetch(`https://api.frankfurter.dev/v1/latest?base=${from}&symbols=${to}`, {
    method: 'GET',
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: 'An error occured while fetching the latest exchange rate.' },
      { status: 500 },
    );
  }

  const data = await res.json();
  const refined: FetchFxRate = {
    date: data.date,
    baseCurrency: from,
    rates: data.rates,
  };

  const insertObj: ForexInsert[] = Object.entries(refined.rates).map(([key, value]) => ({
    date: refined.date,
    baseCurrency: from,
    targetCurrency: key,
    rate: value,
  }));
  await db.insert(schema.forex).values(insertObj);

  return NextResponse.json(refined);
}

type ForexInsert = typeof schema.forex.$inferInsert;
