import { describe, expect, it, vi } from 'vitest';
import { isFriendScenarioStepEnabled, setFriendScenarioStepEnabled } from '../src/scenarios.js';

function mockDb(row: { is_enabled: number } | null = null) {
  const first = vi.fn().mockResolvedValue(row);
  const run = vi.fn().mockResolvedValue({ meta: { changes: 1 } });
  const bind = vi.fn().mockReturnValue({ first, run });
  const prepare = vi.fn().mockReturnValue({ bind });
  return { db: { prepare } as unknown as D1Database, prepare, bind, first, run };
}

describe('friend scenario step controls', () => {
  it('treats missing per-friend step setting as enabled', async () => {
    const { db } = mockDb(null);
    await expect(isFriendScenarioStepEnabled(db, 'friend-1', 'step-1')).resolves.toBe(true);
  });

  it('returns false when the stored step setting is disabled', async () => {
    const { db } = mockDb({ is_enabled: 0 });
    await expect(isFriendScenarioStepEnabled(db, 'friend-1', 'step-1')).resolves.toBe(false);
  });

  it('upserts the per-friend step setting with the requested enabled state', async () => {
    const { db, bind } = mockDb();
    await setFriendScenarioStepEnabled(db, 'friend-1', 'step-1', false);
    expect(bind).toHaveBeenCalledWith('friend-1', 'step-1', 0, expect.any(String), expect.any(String));
  });
});
