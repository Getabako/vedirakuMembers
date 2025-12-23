import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../lib/prisma';
import { verifyLiffToken } from '../lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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

    if (req.method === 'GET') {
      // 予約一覧を取得
      const bookings = await prisma.booking.findMany({
        where: { userId: user.id },
        orderBy: { date: 'desc' },
      });

      return res.status(200).json(bookings);
    }

    if (req.method === 'POST') {
      // 新規予約を作成
      const { date, timeSlot } = req.body;

      if (!date || !timeSlot) {
        return res.status(400).json({ error: 'date and timeSlot are required' });
      }

      const booking = await prisma.booking.create({
        data: {
          userId: user.id,
          date: new Date(date),
          timeSlot,
        },
      });

      return res.status(201).json(booking);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
