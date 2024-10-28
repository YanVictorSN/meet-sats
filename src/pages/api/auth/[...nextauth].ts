import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { SessionStrategy } from "next-auth";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid profile email https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/meetings.space.readonly https://www.googleapis.com/auth/meetings.space.created",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt" as SessionStrategy,
  },
  callbacks: {
    async signIn() {
      return true;
    },
    async session({ session, token }: { session: any, token: any }) {
      session.accessToken = token.accessToken;
      return session;
    },
    async jwt({ token, account }: { token: any, account: any }) {
      if (account) {
        token.accessToken = account.access_token; 
      }
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET, 
};

export default NextAuth(authOptions);
