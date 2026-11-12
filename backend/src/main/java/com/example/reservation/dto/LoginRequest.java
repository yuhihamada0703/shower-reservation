package com.example.reservation.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

/** ログインAPIのリクエスト（POST /login） */
public record LoginRequest(
        @JsonProperty("login_id")
        @NotBlank(message = "ログインIDとパスワードを入力してください")
        String loginId,

        @NotBlank(message = "ログインIDとパスワードを入力してください")
        String password
) {
}
