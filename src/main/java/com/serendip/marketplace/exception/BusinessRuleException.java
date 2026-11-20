package com.serendip.marketplace.exception;

/**
 * Base unchecked exception for all SERENDIP domain business rule violations.
 */
public class BusinessRuleException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    public BusinessRuleException(String message) {
        super(message);
    }

    public BusinessRuleException(String message, Throwable cause) {
        super(message, cause);
    }
}
