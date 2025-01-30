import { NextResponse } from 'next/server';

export type Version = {
  schema: string;
  dataset: string;
};

export async function GET() {
  const latestVersion: Version = {
    schema: '0.0.1',
    dataset: '0.0.1',
  };
  return NextResponse.json(latestVersion);
}
