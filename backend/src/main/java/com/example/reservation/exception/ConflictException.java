package com.example.reservation.exception;

/** すでに予約されているなど、現在の状態では処理できない（409）ときの例外 */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }
}
