-- 初期データ：教師の共用アカウント（代表教師が作成したものとして用意する）
-- ログインID: user / パスワード: admin123 （学習用のダミー値。パスワードはBCryptでハッシュ化済み）
SET NAMES utf8mb4;

INSERT INTO login (login_id, password, role) VALUES
    ('user', '$2a$10$To/LqxduqtF15S/XlKfmde95ZQxtMJ73s.XpyubVyQOfP/AA46dqi', 'TEACHER');
