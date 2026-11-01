package com.serendip.marketplace.exception;

/**
 * Thrown when an illegal order lifecycle transition is attempted (e.g. cancelling a shipped order).
 */
public class InvalidOrderStateException extends BusinessRuleException {

    public InvalidOrderStateException(String message) {
        super(message);
    }
}
