package com.example.reservation.exception;

/** 指定されたデータが存在しないときの例外 */
public class NotFoundException extends RuntimeException {

    public NotFoundException() {
        super("対象のデータが見つかりません");
    }
}
