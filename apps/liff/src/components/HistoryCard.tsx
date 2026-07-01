import type { BookingHistoryItem } from '../lib/api.js';
import { utcToJstDisplay } from '../lib/datetime.js';

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  requested: { label: 'リクエスト中', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: '確定', color: 'bg-green-100 text-green-800' },
  rejected: { label: '不可', color: 'bg-gray-100 text-gray-600' },
  expired: { label: '期限切れ', color: 'bg-gray-100 text-gray-600' },
  cancelled: { label: 'キャンセル', color: 'bg-gray-100 text-gray-600' },
  completed: { label: '完了', color: 'bg-blue-100 text-blue-800' },
  no_show: { label: '無断キャンセル', color: 'bg-red-100 text-red-800' },
};

export default function HistoryCard({
  booking,
  onCancel,
  onRebook
}: {
  booking: BookingHistoryItem;
  onCancel?: (id: string) => void;
  onRebook?: (menuId: string, staffId: string) => void;
}) {
  const meta = STATUS_LABEL[booking.status] ?? { label: booking.status, color: 'bg-gray-100' };
  const canCancel = onCancel && (booking.status === 'requested' || booking.status === 'confirmed') && new Date(booking.starts_at) > new Date();
  
  return (
    <li className="border rounded p-3 flex gap-3 items-start">
      {booking.profile_image_url ? (
        <img
          src={booking.profile_image_url}
          alt={booking.staff_name}
          className="w-12 h-12 rounded-full object-cover"
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-gray-200" />
      )}
      <div className="flex-1">
        <div className="font-medium">{booking.menu_name}</div>
        <div className="text-sm text-gray-600">{booking.staff_name}</div>
        <div className="text-sm text-gray-600">{utcToJstDisplay(booking.starts_at)}</div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <span className={`text-xs px-2 py-1 rounded h-fit ${meta.color}`}>{meta.label}</span>
        {canCancel && (
          <button
            onClick={() => onCancel(booking.id)}
            className="text-xs text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 rounded px-2 py-1 mt-1"
          >
            キャンセルする
          </button>
        )}
        {onRebook && (
          <button
            onClick={() => onRebook(booking.menu_id, booking.staff_id)}
            className="text-xs text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded px-2 py-1 mt-1"
          >
            もう一度予約する
          </button>
        )}
      </div>
    </li>
  );
}
