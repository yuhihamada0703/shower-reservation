-- 開発用のサンプル学生データ（動作確認用。本番相当の環境では使わない）
-- 3人とも パスワード: pass1234 （BCryptでハッシュ化済み）
SET NAMES utf8mb4;

INSERT INTO login (login_id, password, role) VALUES
    ('20230001', '$2a$10$YCgWEqLmnarGuruTmpJN3.0nZuQ/V3qSYkLO3TnYAF0PouslmfIrO', 'STUDENT'),
    ('20240012', '$2a$10$YCgWEqLmnarGuruTmpJN3.0nZuQ/V3qSYkLO3TnYAF0PouslmfIrO', 'STUDENT'),
    ('20220005', '$2a$10$YCgWEqLmnarGuruTmpJN3.0nZuQ/V3qSYkLO3TnYAF0PouslmfIrO', 'STUDENT');

INSERT INTO students (login_id, name, grade, club, email) VALUES
    ('20230001', '山田 太郎', '2年', 'サッカー部', 's20230001@example.ac.jp'),
    ('20240012', '佐藤 花子', '1年', '吹奏楽部',   's20240012@example.ac.jp'),
    ('20220005', '鈴木 一郎', '3年', NULL,         's20220005@example.ac.jp');
