import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/accounting/') && !pathname.endsWith('.html') && !pathname.startsWith('/accounting/assets/')) {
    return NextResponse.rewrite(new URL('/accounting/index.html', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/accounting/:path*',
}
