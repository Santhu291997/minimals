// src/app/api/auth/federated-logout/route.ts
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

interface Token {
  idToken: string;
}

interface ResponseData {
  error?: string;
  url?: string;
}

function logoutParams(token: Token) {
  return {
    id_token_hint: token.idToken,
    post_logout_redirect_uri: process.env.NEXTAUTH_URL || '',
  };
}

function handleEmptyToken() {
  const response: ResponseData = { error: 'No session present' };
  const responseHeaders = { status: 400 };
  return NextResponse.json(response, responseHeaders);
}

function sendEndSessionEndpointToURL(token: Token) {
  const endSessionEndPoint = new URL(
    `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/logout`
  );
  const params = logoutParams(token);
  const endSessionParams = new URLSearchParams(params);
  const response: ResponseData = { url: `${endSessionEndPoint.href}/?${endSessionParams}` };
  return NextResponse.json(response);
}

export async function GET(req: NextRequest) {
  try {
    const token = (await getToken({ req })) as Token | null;
    if (token) {
      return sendEndSessionEndpointToURL(token);
    }
    return handleEmptyToken();
  } catch (error) {
    console.error(error);
    const response: ResponseData = {
      error: 'Unable to logout from the session',
    };
    const responseHeaders = {
      status: 500,
    };
    return NextResponse.json(response, responseHeaders);
  }
}
