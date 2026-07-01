import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type BookingHistoryItem } from '../lib/api.js';
import HistoryCard from '../components/HistoryCard.js';

export default function BookingHistory() {
  const [data, setData] = useState<{ upcoming: BookingHistoryItem[]; past: BookingHistoryItem[] } | null>(
    null,
  );
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    api.me().then(setData);
  };

  const handleCancel = async (id: string) => {
    if (!confirm('ご予約をキャンセルしますか？')) return;
    try {
      await api.cancelMyBooking(id);
      alert('キャンセルしました。');
      fetchData();
    } catch (e: any) {
      alert(`キャンセルに失敗しました: ${e.body?.error || e.message}`);
    }
  };

  const handleRebook = (menuId: string, staffId: string) => {
    navigate(`/booking?menuId=${menuId}&staffId=${staffId}`);
  };

  if (!data) return <div className="p-4 text-gray-500">読み込み中...</div>;
  const list = tab === 'upcoming' ? data.upcoming : data.past;

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <div className="flex border-b">
        <button
          onClick={() => setTab('upcoming')}
          className={`flex-1 py-2 ${tab === 'upcoming' ? 'border-b-2 border-blue-600 font-semibold' : ''}`}
        >
          これから ({data.upcoming.length})
        </button>
        <button
          onClick={() => setTab('past')}
          className={`flex-1 py-2 ${tab === 'past' ? 'border-b-2 border-blue-600 font-semibold' : ''}`}
        >
          過去 ({data.past.length})
        </button>
      </div>
      {list.length === 0 ? (
        <p className="text-gray-500 text-center pt-8">まだ予約がありません。</p>
      ) : (
        <ul className="space-y-2">
          {list.map((b) => (
            <HistoryCard key={b.id} booking={b} onCancel={handleCancel} onRebook={handleRebook} />
          ))}
        </ul>
      )}
      <p className="text-xs text-gray-500 pt-4">
        ※ 内容の変更はお店に直接ご連絡ください。キャンセルは上記より可能です。
      </p>
    </div>
  );
}
