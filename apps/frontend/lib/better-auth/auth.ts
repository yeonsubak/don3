import { externalDB } from '@/db/external-db/drizzle-client';
import * as schema from '@/db/external-db/migration/schema';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { passkey } from 'better-auth/plugins/passkey';
import {
  PASSKEY_PRF_SALT_FIRST,
  RP_ID,
  TRUSTED_ORIGIN_HTTPS,
  TRUSTED_ORIGIN_HTTPS_WWW,
} from '../constants';

const passkeyPrfSalt = new TextEncoder().encode(PASSKEY_PRF_SALT_FIRST);
const passkeyPrfSaltBuffer = passkeyPrfSalt.buffer.slice(
  passkeyPrfSalt.byteOffset,
  passkeyPrfSalt.byteOffset + passkeyPrfSalt.byteLength,
) as ArrayBuffer;

export const auth = betterAuth({
  database: drizzleAdapter(externalDB!, {
    provider: 'pg',
    schema,
  }),
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
      domain: '*.don3.com',
    },
  },
  trustedOrigins: ['http://localhost:3000', ...TRUSTED_ORIGIN_HTTPS, TRUSTED_ORIGIN_HTTPS_WWW],
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [
    passkey({
      rpID: RP_ID,
      rpName: 'Don3',
      origin: TRUSTED_ORIGIN_HTTPS_WWW,
      authenticatorSelection: {
        authenticatorAttachment: 'cross-platform',
      },
      extensions: {
        prf: {
          eval: {
            first: passkeyPrfSaltBuffer,
          },
        },
      },
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24,
    updateAge: 1,
    freshAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 30,
    },
  },
});
