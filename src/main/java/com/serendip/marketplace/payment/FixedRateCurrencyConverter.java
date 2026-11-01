package com.serendip.marketplace.payment;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Currency converter using a fixed exchange rate (default: 300 LKR per 1 USD).
 */
public class FixedRateCurrencyConverter implements CurrencyConverter {

    public static final BigDecimal DEFAULT_LKR_PER_USD = new BigDecimal("300.00");
    private final BigDecimal lkrPerUsd;

    public FixedRateCurrencyConverter() {
        this(DEFAULT_LKR_PER_USD);
    }

    public FixedRateCurrencyConverter(BigDecimal lkrPerUsd) {
        if (lkrPerUsd == null || lkrPerUsd.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Exchange rate must be strictly positive.");
        }
        this.lkrPerUsd = lkrPerUsd;
    }

    @Override
    public BigDecimal convertLkrToUsd(BigDecimal amountInLkr) {
        if (amountInLkr == null || amountInLkr.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return amountInLkr.divide(lkrPerUsd, 2, RoundingMode.HALF_UP);
    }

    @Override
    public BigDecimal convertUsdToLkr(BigDecimal amountInUsd) {
        if (amountInUsd == null || amountInUsd.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return amountInUsd.multiply(lkrPerUsd).setScale(2, RoundingMode.HALF_UP);
    }

    @Override
    public BigDecimal getExchangeRate() {
        return lkrPerUsd;
    }
}
