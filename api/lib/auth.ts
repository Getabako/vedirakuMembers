import type { VercelRequest } from '@vercel/node';
import axios from 'axios';

interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

export async function verifyLiffToken(req: VercelRequest): Promise<LiffProfile | null> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const accessToken = authHeader.substring(7);

  // 開発用モックトークン
  if (accessToken === 'mock-access-token-for-development') {
    return {
      userId: 'U_dev_user_12345',
      displayName: '開発ユーザー',
    };
  }

  try {
    // LINE APIでトークンを検証
    const response = await axios.get<LiffProfile>(
      'https://api.line.me/v2/profile',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export function getLineUserId(req: VercelRequest): Promise<string | null> {
  return verifyLiffToken(req).then(profile => profile?.userId ?? null);
}
