import { LineClient } from '@line-crm/line-sdk';

export const SQUARE_PAYMENT_URL = 'https://square.link/u/metWF8Wp';

export type NotificationKind =
  | 'requested'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'day_before'
  | 'hours_before';

export interface NotificationContext {
  menuName: string;
  staffName: string;
  startsAtJst: string; // 例: "2026-05-10 14:00"
  hoursBefore: number;
}

export interface AdminBookingRequestContext extends NotificationContext {
  bookingId: string;
  friendId: string;
  friendName: string;
  lineUserId: string;
  customerNote: string | null;
}

export function renderNotificationText(
  kind: NotificationKind,
  ctx: NotificationContext,
): string {
  const detail = `\nメニュー: ${ctx.menuName}\n担当: ${ctx.staffName}\n日時: ${ctx.startsAtJst}`;
  switch (kind) {
    case 'requested':
      return `予約リクエストを受け付けました。${detail}\n\nお店からの返信をお待ちください。\n\n▼ お支払いはコチラ（4,980円）\n${SQUARE_PAYMENT_URL}\n\nお支払い完了後、このトークルームへ一言お知らせください。`;
    case 'approved':
      return `予約が確定しました。${detail}\n\n変更・キャンセルはお店に直接ご連絡ください。`;
    case 'rejected':
      return `申し訳ありません、ご希望の枠でお取りできませんでした。\n別の日時で再度お試しください。`;
    case 'expired':
      return `予約リクエストが 24 時間返信がなかったため、期限切れになりました。${detail}`;
    case 'day_before':
      return `明日のご予約のお知らせです。${detail}`;
    case 'hours_before':
      return `本日のご予約まであと ${ctx.hoursBefore} 時間です。${detail}`;
  }
}

export function renderAdminBookingRequestText(ctx: AdminBookingRequestContext): string {
  return [
    '🔔 Lハーネスに新しい予約リクエストが届きました。',
    '',
    `予約ID: ${ctx.bookingId}`,
    `表示名: ${ctx.friendName || '名前未取得'}`,
    `友だちID: ${ctx.friendId}`,
    `LINEユーザーID: ${ctx.lineUserId}`,
    `メニュー: ${ctx.menuName}`,
    `担当: ${ctx.staffName}`,
    `日時: ${ctx.startsAtJst}`,
    ctx.customerNote ? `メモ: ${ctx.customerNote}` : '',
    '',
    `決済リンク: ${SQUARE_PAYMENT_URL}`,
  ].filter((line) => line !== '').join('\n');
}

export interface SendNotificationParams {
  channelAccessToken: string;
  toLineUserId: string;
  kind: NotificationKind;
  ctx: NotificationContext;
}

export async function sendBookingNotification(params: SendNotificationParams): Promise<void> {
  const text = renderNotificationText(params.kind, params.ctx);
  const client = new LineClient(params.channelAccessToken);
  await client.pushMessage(params.toLineUserId, [{ type: 'text', text }]);
}

export type BookingNotificationSender = (params: SendNotificationParams) => Promise<void>;

export type AdminBookingNotifyEnv = {
  ADMIN_LINE_USER_ID?: string;
};

export async function sendAdminBookingRequestNotification(
  env: AdminBookingNotifyEnv,
  lineClient: LineClient,
  ctx: AdminBookingRequestContext,
): Promise<boolean> {
  const raw = env.ADMIN_LINE_USER_ID;
  if (!raw) {
    console.warn('[booking-admin-notify] skipped: ADMIN_LINE_USER_ID is not configured');
    return false;
  }

  const userIds = raw.split(',').map((id) => id.trim()).filter(Boolean);
  if (userIds.length === 0) return false;

  const text = renderAdminBookingRequestText(ctx);
  let successCount = 0;
  for (const userId of userIds) {
    try {
      await lineClient.pushMessage(userId, [{ type: 'text', text }]);
      successCount++;
    } catch (error) {
      console.error(`[booking-admin-notify] LINE push failed for ${userId}:`, error);
    }
  }

  return successCount > 0;
}
