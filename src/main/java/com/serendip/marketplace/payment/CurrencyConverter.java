package com.serendip.marketplace.payment;

import java.math.BigDecimal;

/**
 * Interface for converting currency between LKR and USD.
 */
public interface CurrencyConverter {

    /**
     * Converts an amount from Sri Lankan Rupees (LKR) to US Dollars (USD).
     */
    BigDecimal convertLkrToUsd(BigDecimal amountInLkr);

    /**
     * Converts an amount from US Dollars (USD) to Sri Lankan Rupees (LKR).
     */
    BigDecimal convertUsdToLkr(BigDecimal amountInUsd);

    /**
     * Returns the current exchange rate (LKR per 1 USD).
     */
    BigDecimal getExchangeRate();
}
