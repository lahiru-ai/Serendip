package com.serendip.marketplace.exception;

/**
 * Thrown when an inventory deduction or checkout exceeds available stock.
 */
public class InsufficientStockException extends BusinessRuleException {

    public InsufficientStockException(String message) {
        super(message);
    }
}
