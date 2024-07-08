import NextAuth, { NextAuthOptions, Session as NextAuthSession, TokenSet } from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';
import { JWT } from 'next-auth/jwt';

interface Token extends JWT {
  idToken?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  error?: string;
}

interface Session extends NextAuthSession {
  accessToken?: string;
}

async function requestRefreshOfAccessToken(token: Token): Promise<Response> {
  return fetch(`${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.KEYCLOAK_CLIENT_ID!,
      client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
      grant_type: 'refresh_token',
      refresh_token: token.refreshToken!,
    }),
    method: 'POST',
    cache: 'no-store',
  });
}

export const authOptions: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER!,
    }),
  ],
  session: {
    maxAge: 60 * 30,
  },
  callbacks: {
    async jwt({ token, account }: { token: Token; account?: TokenSet | null }): Promise<Token> {
      if (account) {
        token.idToken = account.id_token!;
        token.accessToken = account.access_token!;
        token.refreshToken = account.refresh_token!;
        token.expiresAt = account.expires_at!;
        return token;
      }
      if (Date.now() < token.expiresAt! * 1000 - 60 * 1000) {
        return token;
      } else {
        try {
          const response = await requestRefreshOfAccessToken(token);
          console.log(response, 'response');
          const tokens = await response.json();

          if (!response.ok) throw tokens;
          console.log(tokens.access_token, 'token');
          const updatedToken: Token = {
            ...token,
            idToken: tokens.id_token,
            accessToken: tokens.access_token,
            expiresAt: Math.floor(Date.now() / 1000 + tokens.expires_in),
            refreshToken: tokens.refresh_token ?? token.refreshToken,
          };
          return updatedToken;
        } catch (error) {
          console.error('Error refreshing access token', error);
          return { ...token, error: 'RefreshAccessTokenError' };
        }
      }
    },
    async session({ session, token }: { session: Session; token: Token }): Promise<Session> {
      session.accessToken = token.accessToken!;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
