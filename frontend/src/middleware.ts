import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to /admin/login for unauthenticated users
        if (req.nextUrl.pathname.startsWith('/admin/login')) {
          return true;
        }
        // Only protect other admin routes
        if (req.nextUrl.pathname.startsWith('/admin')) {
          return !!token
        }
        return true
      },
    },
    pages: {
      signIn: '/admin/login', // Specify the custom sign-in page
    }
  }
)

export const config = {
  matcher: [
    // Protect all /admin routes except the login page itself
    '/admin/:path*',
  ]
}
