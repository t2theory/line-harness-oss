-- Friend-level scenario step delivery controls
-- is_enabled=0 skips this scenario step for this friend; missing row means enabled.
CREATE TABLE IF NOT EXISTS friend_scenario_step_settings (
  friend_id        TEXT NOT NULL REFERENCES friends(id) ON DELETE CASCADE,
  scenario_step_id TEXT NOT NULL REFERENCES scenario_steps(id) ON DELETE CASCADE,
  is_enabled       INTEGER NOT NULL DEFAULT 1 CHECK (is_enabled IN (0, 1)),
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%f', 'now', '+9 hours')),
  updated_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%f', 'now', '+9 hours')),
  PRIMARY KEY (friend_id, scenario_step_id)
);

CREATE INDEX IF NOT EXISTS idx_friend_scenario_step_settings_step
  ON friend_scenario_step_settings(scenario_step_id);
