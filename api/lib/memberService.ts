// 会員番号を生成
export const generateMemberNumber = (): string => {
  const prefix = '0001';
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const suffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${random}-${suffix}`;
};

// ランク判定
export const calculateRank = (points: number): 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' => {
  if (points >= 10000) return 'PLATINUM';
  if (points >= 5000) return 'GOLD';
  if (points >= 1000) return 'SILVER';
  return 'BRONZE';
};
