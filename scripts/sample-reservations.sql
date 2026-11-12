-- 開発用：画面の確認や、スクリーンショットの撮影のために、サンプルの学生の予約を入れる
-- （サンプルの学生3人の、これまでの予約は、いったん消してから入れ直す）
-- 使い方：docker compose exec -T mysql mysql -u reservation_user -preservation_pass reservation_db < scripts/sample-reservations.sql
SET NAMES utf8mb4;

DELETE FROM reservations WHERE login_id IN ('20220005', '20230001', '20240012');

-- ---------- 今日：「今の枠」と、そのあとの2枠（利用時間 10:00〜22:45 の範囲に入るものだけ） ----------
-- @base は、今の時刻が含まれる15分の枠の、開始時刻（0時からの秒数）。36000 = 10:00、81900 = 22:45
SET @base = FLOOR(TIME_TO_SEC(CURTIME()) / 900) * 900;

-- 今の枠：シャワー室1を、佐藤さんが使用中（使用状況の札が「使用中」になる）
INSERT INTO reservations (login_id, room_no, reserved_date, start_time)
SELECT '20240012', 1, CURDATE(), SEC_TO_TIME(@base) FROM DUAL
WHERE @base BETWEEN 36000 AND 81900;

-- 次の枠：シャワー室2を、鈴木さんが予約
INSERT INTO reservations (login_id, room_no, reserved_date, start_time)
SELECT '20220005', 2, CURDATE(), SEC_TO_TIME(@base + 900) FROM DUAL
WHERE @base + 900 BETWEEN 36000 AND 81900;

-- その次の枠：シャワー室1を、山田さんが予約
INSERT INTO reservations (login_id, room_no, reserved_date, start_time)
SELECT '20230001', 1, CURDATE(), SEC_TO_TIME(@base + 1800) FROM DUAL
WHERE @base + 1800 BETWEEN 36000 AND 81900;

-- ---------- 明日：時間帯をばらして、6件 ----------
INSERT INTO reservations (login_id, room_no, reserved_date, start_time) VALUES
    ('20220005', 1, CURDATE() + INTERVAL 1 DAY, '10:00:00'),
    ('20240012', 2, CURDATE() + INTERVAL 1 DAY, '10:15:00'),
    ('20230001', 1, CURDATE() + INTERVAL 1 DAY, '18:00:00'),
    ('20240012', 2, CURDATE() + INTERVAL 1 DAY, '18:15:00'),
    ('20220005', 1, CURDATE() + INTERVAL 1 DAY, '19:00:00'),
    ('20230001', 2, CURDATE() + INTERVAL 1 DAY, '19:30:00');

SELECT r.reserved_date, r.start_time, r.room_no, s.name
FROM reservations r JOIN students s ON s.login_id = r.login_id
WHERE r.login_id IN ('20220005', '20230001', '20240012')
ORDER BY r.reserved_date, r.start_time, r.room_no;
