import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { authenticateUser, getUserById } from '@/lib/db/user';
import { decodeAvatar, binaryToImageUrl } from '@/lib/utils/avatar';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Пароль", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await authenticateUser(
          credentials.email,
          credentials.password
        );

        if (!user) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role.name,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        
        // Получение дополнительной информации о пользователе
        const userData = await getUserById(token.id as string);
        if (userData) {
          if (userData.profile) {
            session.user.firstName = userData.profile.firstName;
            session.user.lastName = userData.profile.lastName;
            session.user.fullName = `${userData.profile.firstName} ${userData.profile.lastName}`;
            // Преобразуем бинарные данные аватара в строку base64, если они существуют
            if (userData.profile.avatar && userData.profile.avatarType) {
              session.user.avatar = binaryToImageUrl(userData.profile.avatar, userData.profile.avatarType);
            } else {
              session.user.avatar = null;
            }
            session.user.avatarType = userData.profile.avatarType || null;
          }
          
          if (userData.coach) {
            session.user.coachId = userData.coach.id;
          }
          
          if (userData.player) {
            session.user.playerId = userData.player.id;
          }
        }
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 дней
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}; 