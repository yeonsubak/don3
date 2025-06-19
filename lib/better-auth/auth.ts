import { externalDB } from '@/db/external-db/drizzle-client';
import * as schema from '@/db/external-db/migration/schema';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { passkey } from 'better-auth/plugins/passkey';
import { PASSKEY_PRF_FIRST_SALT } from '../constants';

export const auth = betterAuth({
  database: drizzleAdapter(externalDB!, {
    provider: 'pg',
    schema,
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [
    passkey({
      rpID: 'localhost',
      rpName: 'Don3',
      origin: 'http://localhost:3000',
      authenticatorSelection: {
        authenticatorAttachment: 'cross-platform',
      },
      extensions: {
        prf: {
          eval: {
            first: PASSKEY_PRF_FIRST_SALT,
          },
        },
      },
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24,
    updateAge: 1,
    freshAge: 60 * 60 * 24,
  },
});
