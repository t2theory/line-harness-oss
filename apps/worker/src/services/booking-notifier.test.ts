import { describe, expect, test, vi } from 'vitest';
import {
  SQUARE_PAYMENT_URL,
  renderAdminBookingRequestText,
  renderNotificationText,
  sendAdminBookingRequestNotification,
} from './booking-notifier.js';
import type { LineClient } from '@line-crm/line-sdk';

const ctx = {
  menuName: 'カット',
  staffName: '山田',
  startsAtJst: '2026-05-10 14:00',
  hoursBefore: 2,
};

describe('renderNotificationText', () => {
  test('受付', () => {
    const text = renderNotificationText('requested', ctx);
    expect(text).toContain('予約リクエストを受け付けました');
    expect(text).toContain('カット');
    expect(text).toContain('山田');
    expect(text).toContain('2026-05-10 14:00');
    expect(text).toContain('お店からの返信をお待ちください');
    expect(text).toContain(SQUARE_PAYMENT_URL);
  });
  test('承認', () => {
    const text = renderNotificationText('approved', ctx);
    expect(text).toContain('予約が確定しました');
    expect(text).toContain('変更・キャンセルはお店に直接ご連絡ください');
  });
  test('拒否', () => {
    expect(renderNotificationText('rejected', ctx)).toContain('お取りできませんでした');
  });
  test('期限切れ', () => {
    expect(renderNotificationText('expired', ctx)).toContain('期限切れ');
  });
  test('\u30ad\u30e3\u30f3\u30bb\u30eb', () => {
    const text = renderNotificationText('cancelled', ctx);
    expect(text).toContain('\u3054\u4e88\u7d04\u3092\u30ad\u30e3\u30f3\u30bb\u30eb\u3057\u307e\u3057\u305f');
    expect(text).toContain('\u307e\u305f\u306e\u3054\u4e88\u7d04\u3092\u304a\u5f85\u3061\u3057\u3066\u304a\u308a\u307e\u3059');
    expect(text).toContain('2026-05-10 14:00');
  });
  test('前日リマインダ', () => {
    expect(renderNotificationText('day_before', ctx)).toContain('明日のご予約');
  });
  test('当日 N 時間前', () => {
    const t = renderNotificationText('hours_before', ctx);
    expect(t).toContain('本日のご予約まであと 2 時間');
  });
});

describe('admin booking request notification', () => {
  test('renders booking request details for admin', () => {
    const text = renderAdminBookingRequestText({
      ...ctx,
      friendName: '佐藤 花子',
      friendId: 'friend-1',
      lineUserId: 'U123',
      bookingId: 'booking-1',
      customerNote: '夜なら助かります',
    });

    expect(text).toContain('新しい予約リクエスト');
    expect(text).toContain('佐藤 花子');
    expect(text).toContain('booking-1');
    expect(text).toContain('夜なら助かります');
    expect(text).toContain(SQUARE_PAYMENT_URL);
  });

  test('sends admin booking request notification to configured LINE users', async () => {
    const pushMessage = vi.fn().mockResolvedValue({});
    const lineClient = { pushMessage } as unknown as LineClient;

    const sent = await sendAdminBookingRequestNotification(
      { ADMIN_LINE_USER_ID: 'UADMIN1, UADMIN2' },
      lineClient,
      {
        ...ctx,
        friendName: '佐藤 花子',
        friendId: 'friend-1',
        lineUserId: 'U123',
        bookingId: 'booking-1',
        customerNote: null,
      },
    );

    expect(sent).toBe(true);
    expect(pushMessage).toHaveBeenCalledTimes(2);
    expect(pushMessage).toHaveBeenCalledWith('UADMIN1', [
      { type: 'text', text: expect.stringContaining('新しい予約リクエスト') },
    ]);
  });
});
