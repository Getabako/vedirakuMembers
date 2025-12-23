import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from './lib/prisma';
import { verifyLiffToken } from './lib/auth';

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

  const { date } = req.query;

  if (!date || typeof date !== 'string') {
    return res.status(400).json({ error: 'date is required' });
  }

  try {
    const targetDate = new Date(date);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    // 既存のスロットを取得
    let slots = await prisma.timeSlot.findMany({
      where: {
        date: {
          gte: targetDate,
          lt: nextDate,
        },
      },
      orderBy: { time: 'asc' },
    });

    // スロットがない場合はデフォルトを生成
    if (slots.length === 0) {
      const defaultTimes = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

      slots = await Promise.all(
        defaultTimes.map((time) =>
          prisma.timeSlot.create({
            data: {
              date: targetDate,
              time,
              capacity: 3,
              booked: 0,
            },
          })
        )
      );
    }

    // レスポンス形式に変換
    const response = slots.map((slot) => ({
      id: slot.id,
      date: slot.date.toISOString().split('T')[0],
      time: slot.time,
      available: slot.booked < slot.capacity,
      remainingSeats: slot.capacity - slot.booked,
    }));

    return res.status(200).json(response);
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
