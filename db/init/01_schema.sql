-- 予約管理システム テーブル定義（ER図: login / students / reservations）
SET NAMES utf8mb4;

-- ログイン情報（学生・教師の共通）
CREATE TABLE login (
    login_id VARCHAR(20)  NOT NULL COMMENT '学生は学生番号、教師は共用のID',
    password VARCHAR(255) NOT NULL COMMENT 'ハッシュ化した値（平文では保存しない）',
    role     VARCHAR(10)  NOT NULL COMMENT 'STUDENT または TEACHER',
    PRIMARY KEY (login_id),
    CONSTRAINT chk_login_role CHECK (role IN ('STUDENT', 'TEACHER'))
) COMMENT='ログイン情報';

-- 学生情報（教師の行は持たない）
CREATE TABLE students (
    login_id VARCHAR(20)  NOT NULL,
    name     VARCHAR(10)  NOT NULL COMMENT '名前（10字以内）',
    grade    VARCHAR(10)  NOT NULL COMMENT '学年（10字以内）',
    club     VARCHAR(10)  NULL     COMMENT '所属部活（10字以内、空欄可）',
    email    VARCHAR(255) NOT NULL COMMENT '学生専用メールアドレス',
    PRIMARY KEY (login_id),
    -- login を削除すると、students も連動して削除される
    CONSTRAINT fk_students_login FOREIGN KEY (login_id)
        REFERENCES login (login_id) ON DELETE CASCADE
) COMMENT='学生情報';

-- 予約（1枠 = 15分。終了時刻は持たず、開始時刻の15分後とする）
CREATE TABLE reservations (
    reservation_id BIGINT      NOT NULL AUTO_INCREMENT,
    login_id       VARCHAR(20) NOT NULL COMMENT '予約した学生',
    room_no        TINYINT     NOT NULL COMMENT 'シャワー室の番号（1 または 2）',
    reserved_date  DATE        NOT NULL COMMENT '予約日（当日・翌日の判定はアプリ側で行う）',
    start_time     TIME        NOT NULL COMMENT '開始時刻（10:00〜22:45の15分刻み）',
    PRIMARY KEY (reservation_id),
    -- students を削除すると、その学生の予約も連動して削除される
    CONSTRAINT fk_reservations_students FOREIGN KEY (login_id)
        REFERENCES students (login_id) ON DELETE CASCADE,
    -- 二重予約の防止：同じシャワー室・日付・開始時刻は1件だけ
    CONSTRAINT uq_reservation_slot UNIQUE (room_no, reserved_date, start_time),
    -- 同じ学生が同じ日付・同じ時間帯に複数枠を取るのを防止
    CONSTRAINT uq_reservation_student_time UNIQUE (login_id, reserved_date, start_time),
    CONSTRAINT chk_reservation_room CHECK (room_no IN (1, 2)),
    CONSTRAINT chk_reservation_time CHECK (
        start_time >= '10:00:00' AND start_time <= '22:45:00'
        AND MINUTE(start_time) IN (0, 15, 30, 45) AND SECOND(start_time) = 0
    )
) COMMENT='予約';
