import type { LineClient } from '@line-crm/line-sdk';

type FriendAddNotifyEnv = {
  ADMIN_LINE_USER_ID?: string;
};

export async function sendFriendAddNotification(
  env: FriendAddNotifyEnv,
  lineClient: LineClient,
  friend: { id: string; display_name: string | null; line_user_id: string; ref_code?: string | null },
  lineAccountId: string | null,
): Promise<boolean> {
  const adminLineUserIdsRaw = env.ADMIN_LINE_USER_ID;
  if (!adminLineUserIdsRaw) {
    console.warn('[friend-add-notify] skipped: ADMIN_LINE_USER_ID is not configured');
    return false;
  }

  // Comma-separated support
  const adminLineUserIds = adminLineUserIdsRaw.split(',').map((id) => id.trim()).filter(Boolean);
  if (adminLineUserIds.length === 0) {
    return false;
  }

  const displayName = friend.display_name || '名前未取得';
  const lines = [
    '🔔 Lハーネスに新しい友だちが登録されました！',
    '',
    `表示名: ${displayName}`,
    `友だちID: ${friend.id}`,
    `LINEユーザーID: ${friend.line_user_id}`,
    lineAccountId ? `LINEアカウントID: ${lineAccountId}` : '',
    friend.ref_code ? `流入コード: ${friend.ref_code}` : '',
  ].filter((line) => line !== '');
  const text = lines.join('\n');

  let successCount = 0;
  for (const userId of adminLineUserIds) {
    try {
      await lineClient.pushMessage(userId, [
        {
          type: 'text',
          text,
        },
      ]);
      successCount++;
    } catch (error) {
      console.error(`[friend-add-notify] LINE push failed for ${userId}:`, error);
    }
  }

  return successCount > 0;
}
