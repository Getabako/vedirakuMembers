import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../lib/prisma';
import { verifyLiffToken } from '../lib/auth';
import { generateMemberNumber } from '../lib/memberService';

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
        user = await prisma.user.create({
          data: {
            lineUserId,
            displayName: profile.displayName || 'ユーザー',
            pictureUrl: profile.pictureUrl,
            memberNumber: generateMemberNumber(),
            points: 100, // 初回登録ボーナス
          },
        });

        // 初回登録ボーナスの履歴
        await prisma.pointHistory.create({
          data: {
            userId: user.id,
            amount: 100,
            type: 'bonus',
            description: '初回登録ボーナス',
          },
        });
      }

      return res.status(200).json(user);
    }

    if (req.method === 'PUT') {
      // プロフィール更新
      const { displayName, pictureUrl } = req.body;

      const user = await prisma.user.update({
        where: { lineUserId },
        data: {
          ...(displayName && { displayName }),
          ...(pictureUrl && { pictureUrl }),
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
