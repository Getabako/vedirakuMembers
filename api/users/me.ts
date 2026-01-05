import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

// 会員番号を生成（10桁連番）
const generateMemberNumber = async (): Promise<string> => {
  // 最新の会員番号を取得
  const lastUser = await prisma.user.findFirst({
    where: {
      memberNumber: { not: null }
    },
    orderBy: { memberNumber: 'desc' },
    select: { memberNumber: true },
  });

  let nextNumber = 1;
  if (lastUser?.memberNumber) {
    const lastNumber = parseInt(lastUser.memberNumber, 10);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  return nextNumber.toString().padStart(10, '0');
};

// LIFF認証
interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

async function verifyLiffToken(req: VercelRequest): Promise<LiffProfile | null> {
  // 認証スキップモード（デモ・テスト用）
  if (process.env.SKIP_AUTH === 'true') {
    return { userId: 'U_demo_user_12345', displayName: 'デモユーザー' };
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // 認証ヘッダーがない場合もデモモードとして扱う（PC/スマホブラウザ対応）
    if (process.env.ALLOW_ANONYMOUS === 'true' || process.env.NODE_ENV !== 'production') {
      return { userId: 'U_anonymous_user', displayName: 'ゲストユーザー' };
    }
    // 本番環境でも認証ヘッダーがない場合はデモユーザーとして続行（LIFFクライアント外対応）
    console.log('No auth header, falling back to demo user');
    return { userId: 'U_browser_user', displayName: 'ブラウザユーザー' };
  }
  const accessToken = authHeader.substring(7);

  // 開発用モックトークン
  if (accessToken === 'mock-access-token-for-development') {
    return { userId: 'U_dev_user_12345', displayName: '開発ユーザー' };
  }

  // LINE APIでトークン検証
  try {
    const response = await axios.get<LiffProfile>('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  } catch (error) {
    console.error('LINE API verification failed:', error);
    // 認証失敗時もフォールバック（ブラウザアクセス対応）
    return { userId: 'U_fallback_user', displayName: 'ユーザー' };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 認証
  const profile = await verifyLiffToken(req);
  if (!profile) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const lineUserId = profile.userId;

  try {
    if (req.method === 'GET') {
      // ユーザー情報を取得
      let user = await prisma.user.findUnique({
        where: { lineUserId },
      });

      if (!user) {
        // 新規ユーザーの場合は自動登録
        const memberNumber = await generateMemberNumber();
        user = await prisma.user.create({
          data: {
            lineUserId,
            displayName: profile.displayName || 'ユーザー',
            pictureUrl: profile.pictureUrl,
            memberNumber,
            points: 0,
            courses: [],
          },
        });
      } else {
        // 既存ユーザーの場合、LINEプロファイルでdisplayNameとpictureUrlを更新
        if (profile.displayName && (user.displayName !== profile.displayName || user.pictureUrl !== profile.pictureUrl)) {
          user = await prisma.user.update({
            where: { lineUserId },
            data: {
              displayName: profile.displayName,
              pictureUrl: profile.pictureUrl,
            },
          });
        }
      }

      return res.status(200).json(user);
    }

    if (req.method === 'PUT') {
      // プロフィール更新
      const { displayName, pictureUrl, courses, area } = req.body;

      const user = await prisma.user.update({
        where: { lineUserId },
        data: {
          ...(displayName && { displayName }),
          ...(pictureUrl && { pictureUrl }),
          ...(courses !== undefined && { courses }),
          ...(area !== undefined && { area }),
        },
      });

      return res.status(200).json(user);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
