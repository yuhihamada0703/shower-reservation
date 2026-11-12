package com.example.reservation.exception;

/** 入力内容や、予約のルールに合わないリクエスト（400）の例外 */
public class BadRequestException extends RuntimeException {

    public BadRequestException(String message) {
        super(message);
    }
}
