import type { RemoteVersion } from '@/db/drizzle/version-table';

const semanticVersionRegex = /^ver-(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?\.sql$/;

export const isValidVersionedSQL = (fileName: string) => {
  return semanticVersionRegex.test(fileName);
};

export const extractSemanticVersion = (fileName: string): string | null => {
  const match = fileName.match(semanticVersionRegex);
  return match ? `${match[1]}.${match[2]}.${match[3]}${match[4] ? `-${match[4]}` : ''}` : null;
};

export const compareSemanticVersions = (a: string, b: string) => {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);

  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] ?? 0; // Default to 0 if missing
    const nb = pb[i] ?? 0;
    if (na !== nb) return na - nb;
  }
  return 0;
};

export type SchemaDefinition = { sql: string | undefined | null; version: RemoteVersion };
