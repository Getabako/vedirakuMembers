import { useEffect, useCallback } from 'react';
import { HiArrowPath } from 'react-icons/hi2';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Loading } from '../../components/common/Loading';
import { PointBalance } from '../../components/member/PointBalance';
import { PointHistoryItem } from '../../components/member/PointHistoryItem';
import { useUserStore } from '../../stores/userStore';

export const PointHistoryPage: React.FC = () => {
  const { user, pointHistory, isLoading, error, fetchUser, fetchPointHistory } = useUserStore();

  const loadData = useCallback(() => {
    fetchUser();
    fetchPointHistory();
  }, [fetchUser, fetchPointHistory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return <Loading fullScreen />;
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-line-light">
        <Header title="ポイント履歴" showBack />
        <div className="flex flex-col items-center justify-center p-4 pt-20">
          <p className="text-gray-600 mb-4">
            {error || 'データの取得に失敗しました'}
          </p>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-6 py-3 bg-line-green text-white rounded-lg font-medium"
          >
            <HiArrowPath className="w-5 h-5" />
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-line-light">
      <Header title="ポイント履歴" showBack />

      <main className="p-4 space-y-4">
        {/* 現在のポイント */}
        <Card className="text-center">
          <p className="text-caption text-gray-500 mb-2">現在のポイント</p>
          <PointBalance points={user.points} size="lg" />
        </Card>

        {/* 履歴 */}
        <Card>
          <h2 className="text-section mb-2">履歴</h2>
          {pointHistory.length > 0 ? (
            <div>
              {pointHistory.map((history) => (
                <PointHistoryItem key={history.id} history={history} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">履歴はありません</p>
          )}
        </Card>
      </main>
    </div>
  );
};
