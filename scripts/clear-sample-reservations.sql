-- 開発用：サンプルの学生3人の予約を、すべて消す
-- 使い方：docker compose exec -T mysql mysql -u reservation_user -preservation_pass reservation_db < scripts/clear-sample-reservations.sql
DELETE FROM reservations WHERE login_id IN ('20220005', '20230001', '20240012');
SELECT COUNT(*) AS 残りの予約の数 FROM reservations;
