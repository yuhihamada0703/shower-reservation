package com.example.reservation.dto;

/** 自分の学生情報更新APIのレスポンス（更新結果と、更新後の学生情報） */
public record StudentUpdateResponse(
        String message,
        StudentInfo student
) {
}
