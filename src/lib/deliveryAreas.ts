// コース定義
export const COURSES = [
  { id: 'vegiraku', name: 'ベジ楽コース', description: '新鮮野菜の定期便' },
  { id: 'komeraku', name: 'コメ楽コース', description: '美味しいお米の定期便' },
  { id: 'tamagoraku', name: 'タマゴ楽コース', description: '新鮮たまごの定期便' },
  { id: 'ajiraku', name: 'アジ楽コース', description: '新鮮な魚の定期便' },
] as const;

export type CourseId = typeof COURSES[number]['id'];

// 曜日定義
export type DeliveryDay = '月' | '火' | '木' | '金';

// 地域→曜日マッピング
export const DELIVERY_AREAS: Record<DeliveryDay, string[]> = {
  '月': ['牛島', '楢山', '大住', '仁井田', '四ツ小屋', '御野場', '御所野'],
  '火': ['泉', '外旭川', '将軍野', '土崎', '飯島', '下新城', '金足', '天王', '大久保'],
  '木': ['中通', '大町', '千秋', '旭南', '旭北', '山王', '高陽幸町', '保戸野', '八橋', '寺内', '新屋'],
  '金': ['広面', '桜', '桜が丘', '横森', '上北手', '下北手', '山手台', '大平台', '東通', '南通', '楢山', '手形', '旭川', '濁川', '新藤田'],
};

// 全地域リスト（曜日でグループ化）
export const ALL_AREAS_BY_DAY = Object.entries(DELIVERY_AREAS).map(([day, areas]) => ({
  day: day as DeliveryDay,
  areas,
}));

// 全地域フラットリスト
export const ALL_AREAS = Object.values(DELIVERY_AREAS).flat();

// 地域から曜日を取得
export const getDeliveryDayByArea = (area: string): DeliveryDay | null => {
  for (const [day, areas] of Object.entries(DELIVERY_AREAS)) {
    if (areas.includes(area)) {
      return day as DeliveryDay;
    }
  }
  return null;
};

// 曜日の日本語表記（フル）
export const getDayFullName = (day: DeliveryDay): string => {
  const dayNames: Record<DeliveryDay, string> = {
    '月': '月曜日',
    '火': '火曜日',
    '木': '木曜日',
    '金': '金曜日',
  };
  return dayNames[day];
};
