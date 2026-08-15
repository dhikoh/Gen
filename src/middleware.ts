import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  
  // Extract locale from pathname, default to 'id' if not present
  const locale = pathname.split('/')[1] || 'id';
  const validLocale = routing.locales.includes(locale as any) ? locale : 'id';

  // Protect /dashboard
  if (pathname.includes('/dashboard')) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const signInUrl = new URL(`/${validLocale}/auth`, req.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  // Protect /admin
  if (pathname.includes('/admin')) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== 'SUPERADMIN') {
      const redirectUrl = new URL(token ? `/${validLocale}/dashboard` : `/${validLocale}/auth`, req.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icon-.*\\.png|.*\\..*).*)']
};
