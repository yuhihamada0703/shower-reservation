package com.example.reservation.exception;

/** ほかの学生の予約を操作しようとしたなど、その操作をする権限がない（403）ときの例外 */
public class ForbiddenException extends RuntimeException {

    public ForbiddenException(String message) {
        super(message);
    }
}
