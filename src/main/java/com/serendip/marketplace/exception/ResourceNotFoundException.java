package com.serendip.marketplace.exception;

/**
 * Exception thrown when a requested domain entity cannot be located.
 */
public class ResourceNotFoundException extends BusinessRuleException {

    private static final long serialVersionUID = 1L;

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
