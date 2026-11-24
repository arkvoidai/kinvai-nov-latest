import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, ChevronDown, Info, ReceiptText, RefreshCw } from 'lucide-react';
import {
  formatOrderDate,
  formatOrderStatus,
  formatPaymentProvider,
  getOrderRefundNotice,
  type AccountOrder,
} from '../../lib/account/accountHelpers';
import { useCart } from '../../lib/cart/CartProvider';
import { KINVAI_TWEEN, useReducedMotion } from '../../lib/motion';
import { Button, PriceTag, Skeleton, TagPill, Tile } from '../primitives';

export interface OrdersTabProps {
  orders: AccountOrder[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function OrdersTab({ orders, loading, error, onRetry }: OrdersTabProps) {
  const { catalogueProducts } = useCart();
  const reduced = useReducedMotion();
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const slugByProductId = new Map(catalogueProducts.map((p) => [p.id, p.slug]));

  const toggleExpanded = (orderId: string) => {
    setExpandedIds((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <Tile key={i} variant="white" radius="lg" padding="md" className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-28" rounded="sm" />
              <Skeleton className="h-3.5 w-44" rounded="sm" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-20" rounded="pill" />
              <Skeleton className="h-6 w-16" rounded="sm" />
            </div>
          </Tile>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Tile variant="white" radius="xl" padding="lg" className="flex flex-col items-start gap-4">
        <div className="w-11 h-11 rounded-full bg-error-bg text-error inline-flex items-center justify-center">
          <AlertCircle size={20} strokeWidth={1.75} aria-hidden="true" />
        </div>
        <div>
          <h2 className="type-h3 font-semibold text-ink">Couldn&apos;t load your orders.</h2>
          <p className="text-sm text-ink-2 mt-1">{error}</p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={onRetry}
          icon={<RefreshCw size={16} strokeWidth={1.75} aria-hidden="true" />}
        >
          Retry
        </Button>
      </Tile>
    );
  }

  if (orders.length === 0) {
    return (
      <Tile variant="white" radius="xl" padding="lg" className="flex flex-col items-start gap-5">
        <div className="w-12 h-12 rounded-full bg-stone text-ink inline-flex items-center justify-center">
          <ReceiptText size={22} strokeWidth={1.75} aria-hidden="true" />
        </div>
        <div className="max-w-lg">
          <h2 className="type-h3 font-semibold text-ink">No orders yet.</h2>
          <p className="text-sm sm:text-base text-ink-2 mt-2 leading-relaxed">
            Your receipts, payment details, and line-item summaries will appear here once you place
            an order.
          </p>
        </div>
        <Button variant="primary" size="lg" to="/shop">
          Explore the shop
        </Button>
      </Tile>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {orders.map((order) => {
        const statusMeta = formatOrderStatus(order.status);
        const refundNotice = getOrderRefundNotice(order.status);
        const isOpen = Boolean(expandedIds[order.id]);
        const detailsId = `kv-order-details-${order.id}`;

        return (
          <article
            key={order.id}
            data-testid={`order-row-${order.order_number}`}
            className="rounded-[24px] bg-surface border border-line overflow-hidden"
          >
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={detailsId}
              onClick={() => toggleExpanded(order.id)}
              className="w-full text-left px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:bg-page/60 transition-colors cursor-pointer min-h-[68px]"
            >
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono text-sm font-semibold text-ink tracking-tight">
                    {order.order_number}
                  </span>
                  <TagPill tone={statusMeta.tone}>{statusMeta.label}</TagPill>
                </div>
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-ink-2">
                  <span>{formatOrderDate(order.created_at)}</span>
                  <span aria-hidden="true">·</span>
                  <span>{formatPaymentProvider(order.provider)}</span>
                  {order.items.length > 0 && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-line">
                <PriceTag cents={order.total_cents} size="md" />
                <span className="inline-flex items-center gap-1 text-xs font-medium text-ink-2">
                  <span>{isOpen ? 'Hide' : 'Details'}</span>
                  <ChevronDown
                    size={16}
                    strokeWidth={1.75}
                    aria-hidden="true"
                    className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </span>
              </div>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={detailsId}
                  initial={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
                  animate={reduced ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
                  transition={reduced ? { duration: 0.01 } : KINVAI_TWEEN}
                  className="overflow-hidden border-t border-line bg-page/55"
                >
                  <div className="px-4 sm:px-6 py-4 sm:py-5 flex flex-col gap-4">
                    {refundNotice && (
                      <div className="flex items-start gap-2.5 rounded-[16px] bg-surface border border-line px-3.5 py-3 text-xs sm:text-sm text-ink-2 leading-relaxed">
                        <Info
                          size={16}
                          strokeWidth={1.75}
                          className="text-ink shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <div>
                          <p>{refundNotice}</p>
                          {typeof order.refunded_cents === 'number' && order.refunded_cents > 0 && (
                            <p className="mt-1 font-mono text-xs text-ink">
                              Refunded amount:{' '}
                              <PriceTag cents={order.refunded_cents} size="sm" />
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {order.items.length > 0 ? (
                      <div>
                        <span className="type-label text-ink-2 block mb-2.5">Order items</span>
                        <ul className="divide-y divide-line rounded-[18px] bg-surface border border-line px-4">
                          {order.items.map((item) => {
                            const slug = item.product_id
                              ? slugByProductId.get(item.product_id)
                              : undefined;
                            return (
                              <li
                                key={item.id}
                                className="py-3 flex items-center justify-between gap-3"
                              >
                                <div className="min-w-0">
                                  {slug ? (
                                    <Link
                                      to={`/products/${slug}`}
                                      viewTransition
                                      className="text-sm font-medium text-ink hover:text-brand-deep transition-colors truncate block"
                                    >
                                      {item.name}
                                    </Link>
                                  ) : (
                                    <span className="text-sm font-medium text-ink truncate block">
                                      {item.name}
                                    </span>
                                  )}
                                </div>
                                <PriceTag
                                  cents={item.price_cents}
                                  size="sm"
                                  className="shrink-0"
                                />
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ) : (
                      <p className="text-xs text-ink-2">
                        Item breakdown is unavailable for this order record.
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-2 pt-1">
                      <span>Currency: {order.currency}</span>
                      <Link
                        to="/support"
                        viewTransition
                        className="text-brand-deep underline underline-offset-2"
                      >
                        Need help with this order?
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </article>
        );
      })}
    </div>
  );
}
