import type { NextAuthConfig } from "next-auth";

// Edge-compatible config — NO Prisma, NO bcrypt
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const mustChangePass = (auth?.user as any)?.mustChangePass;
      const pathname = nextUrl.pathname;

      // NextAuth internal API routes — always allow through (never redirect)
      if (pathname.startsWith("/api/auth")) {
        return true;
      }

      // Public routes
      if (pathname.startsWith("/track")) {
        return true;
      }

      if (pathname.startsWith("/login")) {
        if (isLoggedIn && !mustChangePass) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      // Change password route
      if (pathname === "/change-password") {
        return isLoggedIn;
      }

      // Protected routes
      if (!isLoggedIn) {
        return Response.redirect(new URL("/login", nextUrl));
      }

      // Force password change
      if (mustChangePass && pathname !== "/change-password") {
        return Response.redirect(new URL("/change-password", nextUrl));
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = (user as any).role;
        token.mustChangePass = (user as any).mustChangePass;
        token.remember = (user as any).remember;
        // Remember me: 30 days; otherwise: 1 day
        const maxAge = (user as any).remember
          ? 30 * 24 * 60 * 60
          : 24 * 60 * 60;
        token.exp = Math.floor(Date.now() / 1000) + maxAge;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        (session.user as any).role = token.role;
        (session.user as any).mustChangePass = token.mustChangePass;
      }
      return session;
    },
  },
  providers: [], // providers are added in auth.ts (Node.js only)
};
