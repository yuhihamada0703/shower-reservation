package com.example.reservation.repository;

import com.example.reservation.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;

/** students テーブルを操作する */
public interface StudentRepository extends JpaRepository<Student, String> {
}
