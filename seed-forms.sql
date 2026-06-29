INSERT INTO forms (id, name, description, fields, is_active, save_to_metadata, submit_count, created_at, updated_at) VALUES 
('9d863f68-7c85-4b07-a9a3-d731e05d21a1', 'モラれ妻タイプ診断', 'LINE登録者向け診断1', '[]', 1, 1, 0, datetime('now', 'localtime'), datetime('now', 'localtime')),
('4df7fbc5-4089-4b69-897b-944a17fdc6b2', '家ハラの行方診断', 'LINE登録者向け診断2', '[]', 1, 1, 0, datetime('now', 'localtime'), datetime('now', 'localtime')),
('a53a992a-fa1f-4d92-bf39-35c678a221f5', '心の回復度診断', 'LINE登録者向け診断3', '[]', 1, 1, 0, datetime('now', 'localtime'), datetime('now', 'localtime')),
('6b8ad42e-13c5-47d0-a0de-f6c6e73685c4', 'モラ夫タイプ診断', 'LINE登録者向け診断4', '[]', 1, 1, 0, datetime('now', 'localtime'), datetime('now', 'localtime')),
('c8db2771-4ebc-4b5b-9d41-f62f83de6803', '別居準備度診断', 'LINE登録者向け診断5', '[]', 1, 1, 0, datetime('now', 'localtime'), datetime('now', 'localtime'))
ON CONFLICT(id) DO NOTHING;
