
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_ROUTES = ['/', '/sao-joao'];
const UBS_ROUTES = ['/consulta'];
const LOGIN_ROUTE = '/login';
const PUBLIC_ROUTES = [LOGIN_ROUTE];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('lab_session');
  const sessionRole = sessionCookie?.value;

  const isProtectedRoute = ADMIN_ROUTES.includes(pathname) || UBS_ROUTES.includes(pathname);
  
  // If trying to access a protected route without a session, redirect to login
  if (isProtectedRoute && !sessionRole) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_ROUTE;
    return NextResponse.redirect(url);
  }

  // If session exists, handle route access based on role
  if (sessionRole) {
    // If trying to access login page with a session, redirect to appropriate dashboard
    if (pathname === LOGIN_ROUTE) {
      const targetPath = sessionRole === 'admin' ? '/' : '/consulta';
      const url = request.nextUrl.clone();
      url.pathname = targetPath;
      return NextResponse.redirect(url);
    }

    // If a UBS user tries to access an admin route, redirect to their dashboard
    if (sessionRole === 'ubs' && ADMIN_ROUTES.includes(pathname)) {
        const url = request.nextUrl.clone();
        url.pathname = '/consulta';
        return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
