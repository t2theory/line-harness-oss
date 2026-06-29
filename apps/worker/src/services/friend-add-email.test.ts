import { describe, expect, it, vi } from 'vitest';
import { sendFriendAddEmailNotification } from './friend-add-email.js';

describe('sendFriendAddEmailNotification', () => {
  it('skips without throwing when the email binding or sender is not configured', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(sendFriendAddEmailNotification({}, { id: 'f1', display_name: 'Test', line_user_id: 'U1' }, null)).resolves.toBe(false);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('sends a friend-add notification to the configured recipient', async () => {
    const send = vi.fn().mockResolvedValue({ messageId: 'm1' });
    const sent = await sendFriendAddEmailNotification(
      {
        EMAIL: { send },
        FRIEND_ADD_NOTIFY_FROM: 'notice@example.com',
        FRIEND_ADD_NOTIFY_TO: 'happy.life.reboot@gmail.com',
      },
      { id: 'f1', display_name: '?? ??', line_user_id: 'U1', ref_code: 'lp-a' },
      'account-1',
    );

    expect(sent).toBe(true);
    expect(send).toHaveBeenCalledWith(expect.objectContaining({
      to: 'happy.life.reboot@gmail.com',
      from: { email: 'notice@example.com', name: 'LINE Harness' },
      subject: '?L??????????: ?? ??',
    }));
  });
});
