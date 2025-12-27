import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  
  const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/books',
    '/api/auth/login',
    '/api/auth/register'
  ];


  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith('/api/auth/')
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
  
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
