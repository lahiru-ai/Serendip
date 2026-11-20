package com.serendip.marketplace.exception;

/**
 * Thrown when an inventory deduction or checkout exceeds available stock.
 */
public class InsufficientStockException extends BusinessRuleException {

    private static final long serialVersionUID = 1L;

    public InsufficientStockException(String message) {
        super(message);
    }
}
