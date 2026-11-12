package com.example.reservation.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** ログイン情報（login テーブル）。学生・教師に共通 */
@Entity
@Table(name = "login")
public class Login {

    @Id
    @Column(name = "login_id", length = 20)
    private String loginId;

    /** ハッシュ化した値が入る（平文は入れない） */
    @Column(name = "password", nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 10)
    private Role role;

    protected Login() {
        // JPAが使う
    }

    public Login(String loginId, String password, Role role) {
        this.loginId = loginId;
        this.password = password;
        this.role = role;
    }

    public String getLoginId() { return loginId; }
    public String getPassword() { return password; }
    public Role getRole() { return role; }
}
