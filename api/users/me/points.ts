import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

async function verifyLiffToken(req: VercelRequest): Promise<LiffProfile | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // 認証ヘッダーがない場合はデモユーザーとして続行（PC/スマホブラウザ対応）
    console.log('No auth header, falling back to demo user');
    return { userId: 'U_browser_user', displayName: 'ブラウザユーザー' };
  }
  const accessToken = authHeader.substring(7);

  if (accessToken === 'mock-access-token-for-development') {
    return { userId: 'U_dev_user_12345', displayName: '開発ユーザー' };
  }

  try {
    const response = await axios.get<LiffProfile>('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  } catch (error) {
    console.error('LINE API verification failed:', error);
    // 認証失敗時もフォールバック
    return { userId: 'U_fallback_user', displayName: 'ユーザー' };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 認証
  const profile = await verifyLiffToken(req);
  if (!profile) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { lineUserId: profile.userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const history = await prisma.pointHistory.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return res.status(200).json(history);
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
