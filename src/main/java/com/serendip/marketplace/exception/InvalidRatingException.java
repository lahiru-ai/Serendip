package com.serendip.marketplace.exception;

/**
 * Thrown when a review star rating falls outside the valid 1 to 5 range.
 */
public class InvalidRatingException extends BusinessRuleException {

    public InvalidRatingException(String message) {
        super(message);
    }
}
