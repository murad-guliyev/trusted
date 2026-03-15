import { NextAuthOptions, Session } from "next-auth"
import { getServerSession } from "next-auth/next"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { profile: true },
        })

        if (!user) return null
        if (user.status !== "ACTIVE") return null

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        )

        if (!passwordMatch) return null

        await prisma.user.update({
          where: { id: user.id },
          data: { lastSeenAt: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          name: user.profile?.displayName ?? null,
          isAdmin: user.isAdmin,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.isAdmin = user.isAdmin
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.isAdmin = token.isAdmin
      }
      return session
    },
  },
}

// Typed wrapper — use this everywhere instead of getServerSession directly
export async function getAuthSession(): Promise<Session | null> {
  return getServerSession(authOptions) as Promise<Session | null>
}
