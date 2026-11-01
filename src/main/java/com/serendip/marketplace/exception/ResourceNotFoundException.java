package com.serendip.marketplace.exception;

/**
 * Exception thrown when a requested domain entity cannot be located.
 */
public class ResourceNotFoundException extends BusinessRuleException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
