package com.example.reservation.repository;

import com.example.reservation.entity.Login;
import org.springframework.data.jpa.repository.JpaRepository;

/** login テーブルを操作する（save、findById、existsById などは JpaRepository が用意してくれる） */
public interface LoginRepository extends JpaRepository<Login, String> {
}
