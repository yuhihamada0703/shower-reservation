package com.example.reservation.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** 学生情報（students テーブル）。教師の行は持たない */
@Entity
@Table(name = "students")
public class Student {

    @Id
    @Column(name = "login_id", length = 20)
    private String loginId;

    @Column(name = "name", nullable = false, length = 10)
    private String name;

    @Column(name = "grade", nullable = false, length = 10)
    private String grade;

    /** 所属部活（空欄可なので null を許可） */
    @Column(name = "club", length = 10)
    private String club;

    @Column(name = "email", nullable = false)
    private String email;

    protected Student() {
        // JPAが使う
    }

    public Student(String loginId, String name, String grade, String club, String email) {
        this.loginId = loginId;
        this.name = name;
        this.grade = grade;
        this.club = club;
        this.email = email;
    }

    /** 登録情報を更新する（学生番号は変更できない）。@Transactional の中で呼ぶと、DBにも反映される */
    public void update(String name, String grade, String club, String email) {
        this.name = name;
        this.grade = grade;
        this.club = club;
        this.email = email;
    }

    public String getLoginId() { return loginId; }
    public String getName() { return name; }
    public String getGrade() { return grade; }
    public String getClub() { return club; }
    public String getEmail() { return email; }
}
