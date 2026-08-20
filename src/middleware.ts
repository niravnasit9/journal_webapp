import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get the role cookie set during login
  const role = request.cookies.get('userRole')?.value;
  
  // Public routes
  if (pathname === '/login' || pathname === '/register') {
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    } else if (role === 'user') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Protect all other routes
  if (!role || role === 'null' || role === 'undefined' || role === '') {
    return NextResponse.redirect(new URL('/register', request.url));
  }

  // Admin routes
  if (pathname.startsWith('/admin')) {
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // User routes
  if (pathname === '/dashboard' || (pathname.startsWith('/dashboard') && !pathname.startsWith('/admin'))) {
    // Admins can view everything, but if you want to keep them in admin panel:
    // if (role === 'admin') {
    //   return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    // }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
