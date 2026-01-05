import liff from '@line/liff';

const LIFF_ID = import.meta.env.VITE_LIFF_ID;
const IS_DEV = import.meta.env.DEV;

export interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

// 開発用モックプロファイル
const MOCK_PROFILE: LiffProfile = {
  userId: 'U_dev_user_12345',
  displayName: '開発ユーザー',
  pictureUrl: undefined,
  statusMessage: '開発中',
};

let isInitialized = false;
let isMockMode = false;

export const initializeLiff = async (): Promise<LiffProfile | null> => {
  console.log('🚀 LIFF初期化開始', { LIFF_ID, IS_DEV });

  // 開発環境でLIFF IDがない場合はモックモード
  if (IS_DEV && !LIFF_ID) {
    console.log('🔧 開発モード: LIFFをモックで動作します');
    isInitialized = true;
    isMockMode = true;
    return MOCK_PROFILE;
  }

  if (isInitialized) {
    if (isMockMode) {
      return MOCK_PROFILE;
    }
    return getLiffProfile();
  }

  try {
    await liff.init({ liffId: LIFF_ID });
    isInitialized = true;

    const isLoggedIn = liff.isLoggedIn();
    const isInClient = liff.isInClient();
    console.log('✅ LIFF初期化成功', { isLoggedIn, isInClient });

    if (!isLoggedIn) {
      // LIFFクライアント内の場合のみログインリダイレクト
      if (isInClient) {
        console.log('🔐 LINEアプリ内でログイン実行');
        liff.login({ redirectUri: window.location.href });
        return null;
      } else {
        // ブラウザからのアクセスはモックモードで続行
        console.log('🌐 ブラウザアクセス: モックモードで動作します');
        isMockMode = true;
        return MOCK_PROFILE;
      }
    }

    const profile = await getLiffProfile();
    console.log('👤 プロファイル取得成功', profile);
    return profile;
  } catch (error) {
    console.error('LIFF initialization failed:', error);

    // エラー時はモックモードで続行（PC/スマホブラウザ対応）
    console.log('🔧 LIFFエラー: モックモードで続行します');
    isInitialized = true;
    isMockMode = true;
    return MOCK_PROFILE;
  }
};

export const getLiffProfile = async (): Promise<LiffProfile | null> => {
  if (isMockMode) {
    return MOCK_PROFILE;
  }

  if (!liff.isLoggedIn()) {
    return null;
  }

  try {
    const profile = await liff.getProfile();
    return {
      userId: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl,
      statusMessage: profile.statusMessage,
    };
  } catch (error) {
    console.error('Failed to get profile:', error);
    return null;
  }
};

export const getAccessToken = (): string | null => {
  if (isMockMode) {
    return 'mock-access-token-for-development';
  }

  if (!liff.isLoggedIn()) {
    return null;
  }
  return liff.getAccessToken();
};

export const isInLiffClient = (): boolean => {
  if (isMockMode) {
    return false;
  }
  return liff.isInClient();
};

export const closeLiff = (): void => {
  if (isMockMode) {
    console.log('🔧 モックモード: closeWindow はスキップされました');
    return;
  }
  if (liff.isInClient()) {
    liff.closeWindow();
  }
};

export const sendMessages = async (messages: { type: 'text'; text: string }[]): Promise<void> => {
  if (isMockMode) {
    console.log('🔧 モックモード: sendMessages', messages);
    return;
  }

  if (!liff.isInClient()) {
    console.warn('sendMessages is only available in LIFF client');
    return;
  }

  try {
    await liff.sendMessages(messages);
  } catch (error) {
    console.error('Failed to send messages:', error);
    throw error;
  }
};

// モックモードかどうかを確認するユーティリティ
export const isDevMockMode = (): boolean => isMockMode;
