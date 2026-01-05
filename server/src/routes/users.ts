import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyLiffToken } from '../middleware/liffAuth.js';

const router = Router();
const prisma = new PrismaClient();

// 会員番号を生成（10桁連番）
const generateMemberNumber = async (): Promise<string> => {
  const lastUser = await prisma.user.findFirst({
    where: { memberNumber: { not: null } },
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

// 自分の会員情報を取得
router.get('/me', verifyLiffToken, async (req, res, next) => {
  try {
    let user = await prisma.user.findUnique({
      where: { lineUserId: req.lineUserId },
    });

    if (!user) {
      // 新規ユーザーの場合は自動登録
      const memberNumber = await generateMemberNumber();
      user = await prisma.user.create({
        data: {
          lineUserId: req.lineUserId!,
          displayName: 'ユーザー',
          memberNumber,
          points: 0,
          courses: [],
        },
      });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// ポイント履歴を取得
router.get('/me/points', verifyLiffToken, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { lineUserId: req.lineUserId },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const history = await prisma.pointHistory.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json(history);
  } catch (error) {
    next(error);
  }
});

// プロフィール更新
router.put('/me', verifyLiffToken, async (req, res, next) => {
  try {
    const { displayName, pictureUrl, courses, area } = req.body;

    const user = await prisma.user.update({
      where: { lineUserId: req.lineUserId },
      data: {
        ...(displayName && { displayName }),
        ...(pictureUrl && { pictureUrl }),
        ...(courses !== undefined && { courses }),
        ...(area !== undefined && { area }),
      },
    });

    res.json(user);
  } catch (error) {
    next(error);
  }
});

export { router as userRouter };
