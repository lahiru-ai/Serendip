import React, { createContext, useContext, useState, useEffect } from 'react';
import { Currency } from '../types';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  formatPrice: (priceUsd: number, priceLkr?: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

/**
 * Manages currency selection (USD / LKR) and price formatting across the store.
 */
export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    return (localStorage.getItem('serendip_currency') as Currency) || 'USD';
  });

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem('serendip_currency', c);
  };

  useEffect(() => {
    localStorage.setItem('serendip_currency', currency);
  }, [currency]);

  const formatPrice = (priceUsd: number, priceLkr?: number): string => {
    if (currency === 'LKR') {
      const lkrVal = priceLkr ?? (priceUsd * 300);
      return `Rs. ${Number(lkrVal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${Number(priceUsd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
};

/**
 * Custom hook to access currency settings and price formatting.
 */
export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
