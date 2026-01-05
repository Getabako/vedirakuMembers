import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiArrowPath } from 'react-icons/hi2';
import { Header } from '../../components/common/Header';
import { Loading } from '../../components/common/Loading';
import { MemberCard } from '../../components/member/MemberCard';
import { useUserStore } from '../../stores/userStore';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading, error, fetchUser } = useUserStore();

  const loadUser = useCallback(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const handleEditClick = () => {
    navigate('/profile/edit');
  };

  if (isLoading) {
    return <Loading fullScreen text="読み込み中..." />;
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            {error || 'ユーザー情報の取得に失敗しました'}
          </p>
          <button
            onClick={loadUser}
            className="flex items-center gap-2 mx-auto px-6 py-3 bg-green-600 text-white rounded-lg font-medium"
          >
            <HiArrowPath className="w-5 h-5" />
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <Header title="ベジ楽便" />

      <main className="p-4 pb-8">
        {/* 会員証 */}
        <MemberCard user={user} onEditClick={handleEditClick} />
      </main>
    </div>
  );
};
