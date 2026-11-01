import React from 'react';
import { CheckCircle2, Clock, Truck, Package, Home, XCircle, AlertCircle } from 'lucide-react';
import { OrderStatusHistory } from '../../types';

interface Props {
  currentStatus: string;
  history?: OrderStatusHistory[];
}

interface Step {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  matchingStatuses: string[];
}

const STEPS: Step[] = [
  { id: 'placed', label: 'Order Placed', icon: Clock, matchingStatuses: ['PENDING_PAYMENT', 'ORDER_PLACED'] },
  { id: 'confirmed', label: 'Order Confirmed', icon: CheckCircle2, matchingStatuses: ['PAID', 'PAYMENT_CONFIRMED', 'ORDER_CONFIRMED'] },
  { id: 'processing', label: 'Processing', icon: Package, matchingStatuses: ['PROCESSING'] },
  { id: 'shipped', label: 'Shipped', icon: Truck, matchingStatuses: ['SHIPPED'] },
  { id: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, matchingStatuses: ['OUT_FOR_DELIVERY'] },
  { id: 'delivered', label: 'Delivered', icon: Home, matchingStatuses: ['DELIVERED', 'COMPLETED'] },
];

/**
 * Visual order tracking timeline illustrating lifecycle progress and historical audit events.
 */
export const OrderTimeline: React.FC<Props> = ({ currentStatus, history = [] }) => {
  const norm = (currentStatus || '').toUpperCase();
  const isCancelled = norm === 'CANCELLED';

  // Find step index based on current status
  const getActiveStepIndex = (): number => {
    if (isCancelled) return -1;
    for (let i = STEPS.length - 1; i >= 0; i--) {
      if (STEPS[i].matchingStatuses.includes(norm)) {
        return i;
      }
    }
    return 0;
  };

  const activeIndex = getActiveStepIndex();

  // Find latest timestamp or note for a specific step from history
  const getStepEvent = (step: Step) => {
    return history.find((h) => step.matchingStatuses.includes(h.newStatus.toUpperCase()));
  };

  return (
    <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
        <div>
          <h3 className="font-semibold text-zinc-900 text-sm sm:text-base">Consignment Journey</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Real-time status progression from merchant to destination.</p>
        </div>
        {isCancelled && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-semibold">
            <XCircle className="w-4 h-4" />
            Cancelled
          </span>
        )}
      </div>

      {isCancelled ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-800 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">This consignment has been cancelled.</p>
            <p className="text-red-700">
              Reserved merchant items have been returned to warehouse stock and payments processed according to platform policy.
            </p>
          </div>
        </div>
      ) : (
        /* Standard 6-Step Visual Progression */
        <div className="relative">
          {/* Connector Bar */}
          <div className="hidden md:block absolute top-6 left-6 right-6 h-0.5 bg-zinc-200 -z-0">
            <div
              className="h-full bg-emerald-600 transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(0, (activeIndex / (STEPS.length - 1)) * 100))}%`,
              }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 relative z-10">
            {STEPS.map((step, idx) => {
              const isCompleted = idx <= activeIndex;
              const isCurrent = idx === activeIndex;
              const event = getStepEvent(step);
              const Icon = step.icon;

              return (
                <div key={step.id} className="flex flex-col items-center text-center space-y-2">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                      isCurrent
                        ? 'bg-serendip-700 text-white shadow-md ring-4 ring-serendip-100 scale-105'
                        : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zinc-100 text-zinc-400 border border-zinc-200'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div>
                    <span
                      className={`block text-xs font-semibold ${
                        isCurrent
                          ? 'text-serendip-800 font-bold'
                          : isCompleted
                          ? 'text-zinc-900'
                          : 'text-zinc-400'
                      }`}
                    >
                      {step.label}
                    </span>
                    {event && (
                      <span className="block text-[10px] text-zinc-400 mt-0.5">
                        {new Date(event.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        {new Date(event.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Historical Audit Event Feed */}
      {history.length > 0 && (
        <div className="pt-4 border-t border-zinc-100 space-y-3">
          <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            Status Audit History ({history.length})
          </h4>
          <div className="space-y-2.5">
            {history.map((h) => (
              <div
                key={h.id}
                className="flex items-start justify-between text-xs p-3 rounded-xl bg-zinc-50 border border-zinc-200/60"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-900">{h.newStatus}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-600 font-medium">
                      By {h.changedByName || 'System'} ({h.changedByRole})
                    </span>
                  </div>
                  {h.comments && <p className="text-zinc-600 text-[11px]">{h.comments}</p>}
                </div>
                <span className="text-zinc-400 text-[10px] shrink-0 font-mono">
                  {new Date(h.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
