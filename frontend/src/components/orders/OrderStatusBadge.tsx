import React from 'react';

interface Props {
  status: string;
  className?: string;
}

/**
 * Visual badge displaying human-readable order status with color coding.
 */
export const OrderStatusBadge: React.FC<Props> = ({ status, className = '' }) => {
  const norm = (status || '').toUpperCase();

  let label = norm;
  let colorStyle = 'bg-zinc-100 text-zinc-700 border-zinc-200';

  if (norm === 'PENDING_PAYMENT' || norm === 'ORDER_PLACED') {
    label = 'Order Placed';
    colorStyle = 'bg-sky-50 text-sky-700 border-sky-200';
  } else if (norm === 'PAID' || norm === 'PAYMENT_CONFIRMED' || norm === 'ORDER_CONFIRMED') {
    label = 'Order Confirmed';
    colorStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (norm === 'PROCESSING') {
    label = 'Processing';
    colorStyle = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (norm === 'SHIPPED') {
    label = 'Shipped';
    colorStyle = 'bg-purple-50 text-purple-700 border-purple-200';
  } else if (norm === 'OUT_FOR_DELIVERY') {
    label = 'Out for Delivery';
    colorStyle = 'bg-indigo-50 text-indigo-700 border-indigo-200';
  } else if (norm === 'DELIVERED' || norm === 'COMPLETED') {
    label = 'Delivered';
    colorStyle = 'bg-green-50 text-green-800 border-green-200';
  } else if (norm === 'CANCELLED') {
    label = 'Cancelled';
    colorStyle = 'bg-red-50 text-red-700 border-red-200';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${colorStyle} ${className}`}
    >
      {label}
    </span>
  );
};
