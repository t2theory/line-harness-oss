-- HAPREB 5 Diagnosis Forms Registration
INSERT INTO forms (id, name, description, fields, save_to_metadata, is_active, created_at, updated_at) VALUES
('9d863f68-7c85-4b07-a9a3-d731e05d21a1', 'モラれ妻タイプ診断', 'ハピリブ No.1 診断 (モラれ妻タイプ診断)', '[]', 1, 1, datetime('now'), datetime('now')),
('4df7fbc5-4089-4b69-897b-944a17fdc6b2', '家ハラの行方診断', 'ハピリブ No.2 診断 (家ハラの行方診断)', '[]', 1, 1, datetime('now'), datetime('now')),
('c8db2771-4ebc-4b5b-9d41-f62f83de6803', '別居準備度診断', 'ハピリブ No.3 診断 (別居準備度診断)', '[]', 1, 1, datetime('now'), datetime('now')),
('6b8ad42e-13c5-47d0-a0de-f6c6e73685c4', 'モラ夫タイプ診断', 'ハピリブ No.4 診断 (モラ夫タイプ診断)', '[]', 1, 1, datetime('now'), datetime('now')),
('a53a992a-fa1f-4d92-bf39-35c678a221f5', '心の回復度診断', 'ハピリブ No.5 診断 (心の回復度診断)', '[]', 1, 1, datetime('now'), datetime('now'))
ON CONFLICT (id) DO NOTHING;
