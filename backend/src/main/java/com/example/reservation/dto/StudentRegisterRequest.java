package com.example.reservation.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * 学生登録APIのリクエスト（POST /students）。
 * JSONの項目名は API仕様書どおり login_id のような形にするため、@JsonProperty で対応づける。
 * メッセージは画面設計書のエラーメッセージに合わせている。
 */
public record StudentRegisterRequest(

        @JsonProperty("login_id")
        @NotBlank(message = "学生番号を入力してください")
        @Size(max = 20, message = "学生番号を正しく入力してください")
        // 学生番号は数字のみ、と仮定している（文字を含む場合は、ここを変更する）。空欄は @NotBlank 側で判定する
        @Pattern(regexp = "^[0-9]*$", message = "学生番号を正しく入力してください")
        String loginId,

        @NotBlank(message = "パスワードを入力してください")
        @Size(max = 10, message = "パスワードは10字以内で入力してください")
        String password,

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
