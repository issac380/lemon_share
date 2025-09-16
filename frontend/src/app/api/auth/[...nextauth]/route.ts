import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { NextAuthOptions } from 'next-auth'

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Only allow specific Google accounts (you can customize this)
      const allowedEmails = process.env.ALLOWED_ADMIN_EMAILS?.split(',') || []
      
      if (allowedEmails.length === 0) {
        // If no specific emails are set, allow any Google account
        return true
      }
      
      // Check if the user's email is in the allowed list
      return allowedEmails.includes(user.email || '')
    },
    async session({ session, token }) {
      // Add custom properties to the session
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub,
        }
      }
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    }
  },
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
