-- Remove UNIQUE(staff_id, work_date) constraint from staff_shifts to allow multiple shift blocks per day

CREATE TABLE staff_shifts_new (
  id          TEXT PRIMARY KEY,
  staff_id    TEXT NOT NULL,
  work_date   TEXT NOT NULL,    -- YYYY-MM-DD (JST)
  start_time  TEXT NOT NULL,    -- HH:MM (JST)
  end_time    TEXT NOT NULL,    -- HH:MM (JST)
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%f', 'now', '+9 hours')),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%f', 'now', '+9 hours')),
  FOREIGN KEY (staff_id) REFERENCES staff(id)
);

INSERT INTO staff_shifts_new (id, staff_id, work_date, start_time, end_time, created_at, updated_at)
SELECT id, staff_id, work_date, start_time, end_time, created_at, updated_at FROM staff_shifts;

DROP TABLE staff_shifts;
ALTER TABLE staff_shifts_new RENAME TO staff_shifts;

CREATE INDEX idx_shifts_staff_date ON staff_shifts (staff_id, work_date);
