package com.example.reservation.dto;

import com.example.reservation.entity.Student;
import com.fasterxml.jackson.annotation.JsonProperty;

/** レスポンスに入れる学生情報（パスワードは含めない） */
public record StudentInfo(
        @JsonProperty("login_id") String loginId,
        String name,
        String grade,
        String club,
        String email
) {
    public static StudentInfo from(Student student) {
        return new StudentInfo(
                student.getLoginId(),
                student.getName(),
                student.getGrade(),
                student.getClub(),
                student.getEmail());
    }
}
