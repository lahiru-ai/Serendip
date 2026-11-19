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
  let dotColor = 'bg-zinc-400';

  if (norm === 'PENDING_PAYMENT' || norm === 'ORDER_PLACED') {
    label = 'Order Placed';
    colorStyle = 'bg-sky-50 text-sky-800 border-sky-200 shadow-xs';
    dotColor = 'bg-sky-500 animate-pulse';
  } else if (norm === 'PAID' || norm === 'PAYMENT_CONFIRMED' || norm === 'ORDER_CONFIRMED') {
    label = 'Order Confirmed';
    colorStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-xs';
    dotColor = 'bg-emerald-500';
  } else if (norm === 'PROCESSING') {
    label = 'Processing';
    colorStyle = 'bg-amber-50 text-amber-800 border-amber-200 shadow-xs';
    dotColor = 'bg-amber-500 animate-pulse';
  } else if (norm === 'SHIPPED') {
    label = 'Shipped';
    colorStyle = 'bg-purple-50 text-purple-800 border-purple-200 shadow-xs';
    dotColor = 'bg-purple-500';
  } else if (norm === 'OUT_FOR_DELIVERY') {
    label = 'Out for Delivery';
    colorStyle = 'bg-indigo-50 text-indigo-800 border-indigo-200 shadow-xs';
    dotColor = 'bg-indigo-500 animate-pulse';
  } else if (norm === 'DELIVERED' || norm === 'COMPLETED') {
    label = 'Delivered';
    colorStyle = 'bg-teal-50 text-teal-800 border-teal-200 shadow-xs';
    dotColor = 'bg-teal-600';
  } else if (norm === 'CANCELLED') {
    label = 'Cancelled';
    colorStyle = 'bg-rose-50 text-rose-800 border-rose-200 shadow-xs';
    dotColor = 'bg-rose-500';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${colorStyle} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {label}
    </span>
  );
};
