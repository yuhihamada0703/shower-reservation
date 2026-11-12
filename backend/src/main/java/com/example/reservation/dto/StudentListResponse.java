package com.example.reservation.dto;

import java.util.List;

/** 学生一覧取得APIのレスポンス */
public record StudentListResponse(
        List<StudentInfo> students
) {
}
