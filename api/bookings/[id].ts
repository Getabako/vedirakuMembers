import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../lib/prisma';
import { verifyLiffToken } from '../lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 認証
  const profile = await verifyLiffToken(req);
  if (!profile) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Booking ID is required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { lineUserId: profile.userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 予約が存在し、ユーザーのものか確認
    const existingBooking = await prisma.booking.findFirst({
      where: { id, userId: user.id },
    });

    if (!existingBooking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (req.method === 'PUT') {
      // 予約を更新
      const { date, timeSlot } = req.body;

      const booking = await prisma.booking.update({
        where: { id },
        data: {
          ...(date && { date: new Date(date) }),
          ...(timeSlot && { timeSlot }),
        },
      });

      return res.status(200).json(booking);
    }

    if (req.method === 'DELETE') {
      // 予約をキャンセル
      await prisma.booking.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });

      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
