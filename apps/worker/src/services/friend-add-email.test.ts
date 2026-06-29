import { describe, expect, it, vi } from 'vitest';
import { sendFriendAddNotification } from './friend-add-email.js';
import type { LineClient } from '@line-crm/line-sdk';

describe('sendFriendAddNotification', () => {
  it('skips without throwing when the admin line user id is not configured', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const mockClient = { pushMessage: vi.fn() } as unknown as LineClient;
    await expect(sendFriendAddNotification({}, mockClient, { id: 'f1', display_name: 'Test', line_user_id: 'U1' }, null)).resolves.toBe(false);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('sends a friend-add notification via LINE', async () => {
    const pushMessage = vi.fn().mockResolvedValue({});
    const mockClient = { pushMessage } as unknown as LineClient;

    const sent = await sendFriendAddNotification(
      {
        ADMIN_LINE_USER_ID: 'UADMIN123',
      },
      mockClient,
      { id: 'f1', display_name: '佐藤 花子', line_user_id: 'U1', ref_code: 'lp-a' },
      'account-1',
    );

    expect(sent).toBe(true);
    expect(pushMessage).toHaveBeenCalledWith('UADMIN123', [
      {
        type: 'text',
        text: expect.stringContaining('Lハーネスに新しい友だちが登録されました'),
      },
    ]);
  });
});
