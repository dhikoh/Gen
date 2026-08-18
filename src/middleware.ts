import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default async function middleware(req: NextRequest) {
  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icon-.*\\.png|.*\\..*).*)']
};
