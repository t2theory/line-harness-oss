type SendEmailBinding = {
  send(input: {
    to: string | string[];
    from: { email: string; name?: string };
    subject: string;
    text: string;
    html?: string;
  }): Promise<unknown>;
};

type FriendAddEmailEnv = {
  EMAIL?: SendEmailBinding;
  FRIEND_ADD_NOTIFY_TO?: string;
  FRIEND_ADD_NOTIFY_FROM?: string;
  FRIEND_ADD_NOTIFY_FROM_NAME?: string;
};

export async function sendFriendAddEmailNotification(
  env: FriendAddEmailEnv,
  friend: { id: string; display_name: string | null; line_user_id: string; ref_code?: string | null },
  lineAccountId: string | null,
): Promise<boolean> {
  const email = env.EMAIL;
  const to = env.FRIEND_ADD_NOTIFY_TO || 'happy.life.reboot@gmail.com';
  const from = env.FRIEND_ADD_NOTIFY_FROM;
  if (!email || !from) {
    console.warn('[friend-add-email] skipped: EMAIL binding or FRIEND_ADD_NOTIFY_FROM is not configured');
    return false;
  }

  const displayName = friend.display_name || '????';
  const lines = [
    'L????????????????????',
    '',
    `???: ${displayName}`,
    `???ID: ${friend.id}`,
    `LINE????ID: ${friend.line_user_id}`,
    lineAccountId ? `LINE?????ID: ${lineAccountId}` : '',
    friend.ref_code ? `?????: ${friend.ref_code}` : '',
  ].filter((line) => line !== '');
  const text = lines.join('\n');

  await email.send({
    to,
    from: { email: from, name: env.FRIEND_ADD_NOTIFY_FROM_NAME || 'LINE Harness' },
    subject: `?L??????????: ${displayName}`,
    text,
    html: lines.map((line) => line ? escapeHtml(line) : '').join('<br>'),
  });
  return true;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
