package com.example.reservation.exception;

/** すでに登録されているログインID（学生番号）で登録しようとしたときの例外 */
public class DuplicateLoginIdException extends RuntimeException {

    public DuplicateLoginIdException() {
        super("この学生番号はすでに登録されています");
    }
}
