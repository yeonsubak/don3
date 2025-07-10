'use server';

import { externalDB } from '@/db/external-db/drizzle-client';
import * as schema from '@/db/external-db/migration/schema';
import { and, between, desc, eq } from 'drizzle-orm';
import { DateTime } from 'luxon';

import type { ExternalForexInsert, ExternalForexSelect } from '@/db/external-db/drizzle-types';
import { HAS_EXTERNAL_DB } from '@/lib/constants';

export type FetchFxRate = {
  amount: number;
  base: string;
  date: string;
  rates: {
    [key: string]: number;
  };
};

async function fetchFromExternalDB(from: string, to: string): Promise<FetchFxRate | undefined> {
  const targetCurrencies = to.split(',');
  const now = DateTime.now();
  const fourHourBefore = now.minus({ hours: 4 });

  const data: ExternalForexSelect[] | undefined = await externalDB
    ?.selectDistinctOn([schema.forex.baseCurrency, schema.forex.targetCurrency])
    .from(schema.forex)
    .where(
      and(
        eq(schema.forex.baseCurrency, from),
        between(schema.forex.createAt, fourHourBefore.toJSDate(), now.toJSDate()),
      ),
    )
    .orderBy(schema.forex.baseCurrency, schema.forex.targetCurrency, desc(schema.forex.createAt));

  if (!!data && data.length > 0 && data.every((e) => targetCurrencies.includes(e.targetCurrency))) {
    const res: FetchFxRate = {
      amount: 1,
      date: data.at(0)!.date,
      base: from,
      rates: {},
    };

    data.forEach((e) => {
      res.rates[e.targetCurrency] = parseFloat(e.rate);
    });

    return res;
  }
}

async function fetchFromFrankfurter(from: string, to: string): Promise<FetchFxRate | undefined> {
  const res = await fetch(`https://api.frankfurter.dev/v1/latest?base=${from}`, {
    method: 'GET',
  });

  if (!res.ok) {
    return;
  }

  const fetched: FetchFxRate = await res.json();

  if (HAS_EXTERNAL_DB) {
    const insertObj: ExternalForexInsert[] = Object.entries(fetched.rates).map(([key, value]) => ({
      date: fetched.date,
      baseCurrency: from,
      targetCurrency: key,
      rate: value.toFixed(5),
    }));

    await externalDB?.insert(schema.forex).values(insertObj);
  }

  return fetched;
}

export async function fetchFxRate(from: string, to: string): Promise<FetchFxRate | undefined> {
  if (HAS_EXTERNAL_DB) {
    const data = await fetchFromExternalDB(from, to);
    if (data) {
      return data;
    }
  }

  return fetchFromFrankfurter(from, to);
}
