package com.example.reservation.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** 自分の学生情報更新APIのリクエスト（PUT /students/me）。学生番号とパスワードは変更できない */
public record StudentUpdateRequest(

        @NotBlank(message = "名前を入力してください")
        @Size(max = 10, message = "名前は10字以内で入力してください")
        String name,

        @NotBlank(message = "学年を入力してください")
        @Size(max = 10, message = "学年は10字以内で入力してください")
        String grade,

        // 所属部活は任意（空欄・未指定でも可）
        @Size(max = 10, message = "所属部活は10字以内で入力してください")
        String club,

        // 「学生専用のメールアドレス」かどうかの判定は、ドメインが決まっていないため、今は形式のチェックのみ
        @NotBlank(message = "メールアドレスを入力してください")
        @Size(max = 255, message = "学生専用のメールアドレスを入力してください")
        @Email(message = "学生専用のメールアドレスを入力してください")
        String email
) {
}
