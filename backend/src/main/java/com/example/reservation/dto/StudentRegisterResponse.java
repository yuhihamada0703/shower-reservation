package com.example.reservation.dto;

/** 学生登録APIのレスポンス（登録結果と、登録後の学生情報） */
public record StudentRegisterResponse(
        String message,
        StudentInfo student
) {
}
