import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';

// Use zod to validate the email and password before checking if the user exists in the database.
import { z } from 'zod';
 
import { sql } from '@vercel/postgres';
import type { User } from '@/app/lib/definitions';
import bcrypt from 'bcrypt';

// Query the user from the database.
async function getUser(email: string): Promise<User | undefined> {
    try {
      const user = await sql<User>`SELECT * FROM users WHERE email=${email}`;
      return user.rows[0];
    } catch (error) {
      console.error('Failed to fetch user:', error);
      throw new Error('Failed to fetch user.');
    }
  }

// You can use the authorize function to handle the authentication logic.
export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);
        if (parsedCredentials.success) {
            const { email, password } = parsedCredentials.data;
            const user = await getUser(email);
            if (!user) return null;
            const passwordsMatch = await bcrypt.compare(password, user.password);
            if (passwordsMatch) return user;
        }
        console.log('Invalid credentials');
        return null;
        },
    }),
  ],
});

// providers is an array where you list different login options such as Google or GitHub.
// For this course, we will focus on using the Credentials provider only.
// The Credentials provider allows users to log in with a username and a password.
// It's generally recommended to use alternative providers such as OAuth or email providers.