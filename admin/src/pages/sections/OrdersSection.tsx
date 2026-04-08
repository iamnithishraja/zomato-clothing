import { useEffect, useState, useCallback } from 'react';
import { fetchAllOrders, fetchOrderById, forceCancelOrder } from '../../services/dashboardApi';
import { X, Search, AlertTriangle } from 'lucide-react';
import PageShell from '@/components/admin/PageShell';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import PanelCard from '@/components/admin/PanelCard';
import LoadingState from '@/components/admin/LoadingState';
import ErrorState from '@/components/admin/ErrorState';
import EmptyState from '@/components/admin/EmptyState';
import SegmentedControl from '@/components/admin/SegmentedControl';
import PaginationBar from '@/components/admin/PaginationBar';
import DateRangeFilterBar from '@/components/admin/DateRangeFilterBar';
import { dateRangePresetDays } from '@/lib/admin-date';
import { cn } from '@/lib/utils';

const STATUS_BADGE: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-900 ring-amber-200/50',
  Accepted: 'bg-sky-100 text-sky-800 ring-sky-200/50',
  Rejected: 'bg-red-100 text-red-800 ring-red-200/50',
  Processing: 'bg-violet-100 text-violet-800 ring-violet-200/50',
  ReadyForPickup: 'bg-purple-100 text-purple-800 ring-purple-200/50',
  Assigned: 'bg-orange-100 text-orange-900 ring-orange-200/50',
  PickedUp: 'bg-cyan-100 text-cyan-900 ring-cyan-200/50',
  OnTheWay: 'bg-blue-100 text-blue-800 ring-blue-200/50',
  Shipped: 'bg-indigo-100 text-indigo-800 ring-indigo-200/50',
  Delivered: 'bg-emerald-100 text-emerald-800 ring-emerald-200/50',
  Cancelled: 'bg-red-100 text-red-800 ring-red-200/50',
};

const ALL_STATUSES = [
  'all',
  'Pending',
  'Accepted',
  'Processing',
  'ReadyForPickup',
  'Assigned',
  'PickedUp',
  'OnTheWay',
  'Delivered',
  'Cancelled',
] as const;

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ring-inset',
        STATUS_BADGE[status] ?? 'bg-stone-100 text-stone-700 ring-stone-200/60',
      )}
    >
      {status}
    </span>
  );
}

export default function OrdersSection() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [dateDraftFrom, setDateDraftFrom] = useState('');
  const [dateDraftTo, setDateDraftTo] = useState('');
  const [appliedDateFrom, setAppliedDateFrom] = useState('');
  const [appliedDateTo, setAppliedDateTo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'all' | 'COD' | 'Online'>('all');
  const [paymentStatus, setPaymentStatus] = useState<
    'all' | 'Pending' | 'Completed' | 'Failed' | 'Refunded'
  >('all');

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const loadOrders = useCallback(() => {
    setLoading(true);
    setError('');
    fetchAllOrders({
      page,
      limit: 15,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      search: search || undefined,
      dateFrom: appliedDateFrom || undefined,
      dateTo: appliedDateTo || undefined,
      paymentMethod: paymentMethod !== 'all' ? paymentMethod : undefined,
      paymentStatus: paymentStatus !== 'all' ? paymentStatus : undefined,
    })
      .then(setData)
      .catch(e => setError(e?.response?.data?.message || e.message || 'Failed to load orders'))
      .finally(() => setLoading(false));
  }, [
    page,
    statusFilter,
    search,
    appliedDateFrom,
    appliedDateTo,
    paymentMethod,
    paymentStatus,
  ]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleViewOrder = async (id: string) => {
    setDetailLoading(true);
    try {
      const order = await fetchOrderById(id);
      setSelectedOrder(order);
    } catch {
      setSelectedOrder(null);
    }
    setDetailLoading(false);
  };

  const handleCancelOrder = async () => {
    if (!cancelOrderId) return;
    setCancelling(true);
    try {
      await forceCancelOrder(cancelOrderId, cancelReason);
      setCancelOrderId(null);
      setCancelReason('');
      loadOrders();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to cancel order');
    }
    setCancelling(false);
  };

  if (loading && !data) {
    return (
      <PageShell>
        <LoadingState />
      </PageShell>
    );
  }

  if (error && !data) {
    return (
      <PageShell>
        <ErrorState message={error} onRetry={loadOrders} />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <AdminPageHeader
        title="Order management"
        description="Search by order number or address, drill into a shipment, or force-cancel when needed."
      />

      {data?.statusCounts ? (
        <div className="mb-6 flex flex-wrap gap-2">
          {Object.entries(data.statusCounts).map(([status, count]) => (
            <div
              key={status}
              className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs shadow-sm"
            >
              <StatusBadge status={status} />
              <span className="font-bold tabular-nums text-stone-900">
                {(count as number).toLocaleString('en-IN')}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mb-6 space-y-4">
        <DateRangeFilterBar
          dateFrom={dateDraftFrom}
          dateTo={dateDraftTo}
          onDateFromChange={setDateDraftFrom}
          onDateToChange={setDateDraftTo}
          onApply={() => {
            setAppliedDateFrom(dateDraftFrom);
            setAppliedDateTo(dateDraftTo);
            setPage(1);
          }}
          onClear={() => {
            setDateDraftFrom('');
            setDateDraftTo('');
            setAppliedDateFrom('');
            setAppliedDateTo('');
            setPage(1);
          }}
          onPresetDays={days => {
            const { from, to } = dateRangePresetDays(days);
            setDateDraftFrom(from);
            setDateDraftTo(to);
            setAppliedDateFrom(from);
            setAppliedDateTo(to);
            setPage(1);
          }}
        />
        <div className="flex flex-col gap-4 rounded-2xl border border-stone-200/90 bg-white p-4 shadow-sm shadow-stone-200/40 sm:flex-row sm:flex-wrap sm:items-end sm:gap-6">
          <div className="min-w-0 flex-1">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-stone-500">
              Payment method
            </p>
            <SegmentedControl
              value={paymentMethod}
              onChange={v => {
                setPaymentMethod(v as 'all' | 'COD' | 'Online');
                setPage(1);
              }}
              options={[
                { value: 'all', label: 'All' },
                { value: 'COD', label: 'COD' },
                { value: 'Online', label: 'Online' },
              ]}
            />
          </div>
          <div className="w-full sm:w-auto sm:min-w-[200px]">
            <label
              htmlFor="orders-pay-status"
              className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-stone-500"
            >
              Payment status
            </label>
            <select
              id="orders-pay-status"
              value={paymentStatus}
              onChange={e => {
                setPaymentStatus(
                  e.target.value as 'all' | 'Pending' | 'Completed' | 'Failed' | 'Refunded',
                );
                setPage(1);
              }}
              className="w-full rounded-xl border border-stone-200 bg-stone-50/80 px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/25"
            >
              <option value="all">All</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Failed">Failed</option>
              <option value="Refunded">Refunded</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1 overflow-x-auto pb-1">
          <SegmentedControl
            value={statusFilter}
            onChange={v => {
              setStatusFilter(v);
              setPage(1);
            }}
            options={ALL_STATUSES.map(s => ({
              value: s,
              label: s === 'all' ? 'All' : s,
            }))}
          />
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto lg:max-w-md">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  setSearch(searchInput);
                  setPage(1);
                }
              }}
              placeholder="Order # or address…"
              className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none ring-amber-500/0 transition-shadow focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setSearch(searchInput);
              setPage(1);
            }}
            className="shrink-0 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-bold text-stone-900 shadow-sm transition hover:bg-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            Search
          </button>
        </div>
      </div>

      <PanelCard padded={false}>
        {!data?.orders?.length ? (
          <EmptyState title="No orders match your filters" description="Try another status or search." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-[880px] w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/80 text-left text-[11px] font-bold uppercase tracking-wider text-stone-500">
                    <th className="px-4 py-3 sm:px-6">Order #</th>
                    <th className="px-4 py-3 sm:px-6">Customer</th>
                    <th className="px-4 py-3 sm:px-6">Store</th>
                    <th className="px-4 py-3 sm:px-6">Amount</th>
                    <th className="px-4 py-3 sm:px-6">Status</th>
                    <th className="px-4 py-3 sm:px-6">Payment</th>
                    <th className="px-4 py-3 sm:px-6">Date</th>
                    <th className="px-4 py-3 sm:px-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {data.orders.map((o: any) => (
                    <tr key={o._id} className="hover:bg-stone-50/80">
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-stone-900 sm:px-6">
                        {o.orderNumber || o._id?.slice(-8)}
                      </td>
                      <td className="px-4 py-3 text-stone-600 sm:px-6">
                        {o.user?.name || o.user?.phone || '—'}
                      </td>
                      <td className="px-4 py-3 text-stone-600 sm:px-6">
                        {o.store?.storeName || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-bold tabular-nums sm:px-6">
                        ₹{o.totalAmount?.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 sm:px-6">
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-stone-600 sm:px-6">
                        {o.paymentMethod} / {o.paymentStatus}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-stone-500 sm:px-6">
                        {new Date(o.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </td>
                      <td className="px-4 py-3 sm:px-6">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleViewOrder(o._id)}
                            className="rounded-lg border border-stone-200 bg-white px-3 py-1 text-[11px] font-semibold text-stone-800 hover:bg-stone-50"
                          >
                            View
                          </button>
                          {!['Delivered', 'Cancelled'].includes(o.status) ? (
                            <button
                              type="button"
                              onClick={() => setCancelOrderId(o._id)}
                              className="rounded-lg bg-red-50 px-3 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-100"
                            >
                              Cancel
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data?.pagination ? (
              <PaginationBar
                page={data.pagination.page}
                totalPages={data.pagination.totalPages}
                totalLabel={`${data.pagination.total} orders`}
                disabledPrev={page <= 1}
                disabledNext={page >= data.pagination.totalPages}
                onPrev={() => setPage(p => Math.max(1, p - 1))}
                onNext={() => setPage(p => p + 1)}
              />
            ) : null}
          </>
        )}
      </PanelCard>

      {(selectedOrder || detailLoading) && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-detail-title"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:max-w-2xl sm:p-8"
            onClick={e => e.stopPropagation()}
          >
            {detailLoading ? (
              <div className="py-16 text-center">
                <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-stone-200 border-t-amber-600" />
              </div>
            ) : selectedOrder ? (
              <>
                <div className="flex items-start justify-between gap-4">
                  <h3
                    id="order-detail-title"
                    className="font-['Fraunces',serif] text-xl font-bold text-stone-900 sm:text-2xl"
                  >
                    Order #{selectedOrder.orderNumber || selectedOrder._id?.slice(-8)}
                  </h3>
                  <button
                    type="button"
                    className="rounded-lg p-2 text-stone-500 hover:bg-stone-100"
                    onClick={() => setSelectedOrder(null)}
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      Status
                    </p>
                    <div className="mt-1">
                      <StatusBadge status={selectedOrder.status} />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      Amount
                    </p>
                    <p className="mt-1 text-lg font-bold tabular-nums">
                      ₹{selectedOrder.totalAmount?.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      Customer
                    </p>
                    <p className="mt-1 font-semibold text-stone-900">
                      {selectedOrder.user?.name || '—'}
                    </p>
                    <p className="text-xs text-stone-600">
                      {selectedOrder.user?.phone || selectedOrder.user?.email || ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      Store
                    </p>
                    <p className="mt-1 font-semibold text-stone-900">
                      {selectedOrder.store?.storeName || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      Payment
                    </p>
                    <p className="mt-1 text-sm text-stone-700">
                      {selectedOrder.paymentMethod} / {selectedOrder.paymentStatus}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      Delivery
                    </p>
                    <p className="mt-1 text-sm text-stone-700">
                      {selectedOrder.deliveryPerson?.name || 'Not assigned'}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Shipping address
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-stone-600">
                    {selectedOrder.shippingAddress}
                  </p>
                </div>
                {selectedOrder.orderItems?.length > 0 ? (
                  <div className="mt-6">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      Line items
                    </p>
                    <ul className="mt-2 divide-y divide-stone-100">
                      {selectedOrder.orderItems.map((item: any, i: number) => (
                        <li key={i} className="flex justify-between py-2 text-sm">
                          <span className="text-stone-800">
                            {item.product?.name || 'Product'} × {item.quantity}
                          </span>
                          <span className="font-semibold tabular-nums">
                            ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {selectedOrder.statusHistory?.length > 0 ? (
                  <div className="mt-6 border-t border-stone-100 pt-6">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      Timeline
                    </p>
                    <ul className="mt-3 space-y-4">
                      {selectedOrder.statusHistory.map((h: any, i: number) => (
                        <li key={i} className="relative flex gap-3 pl-1">
                          <span
                            className={cn(
                              'mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-4',
                              i === selectedOrder.statusHistory.length - 1
                                ? 'bg-amber-500 ring-amber-100'
                                : 'bg-stone-300 ring-stone-100',
                            )}
                          />
                          <div>
                            <p className="text-sm font-semibold text-stone-900">{h.status}</p>
                            <p className="text-xs text-stone-500">
                              {new Date(h.timestamp).toLocaleString('en-IN')}
                            </p>
                            {h.note ? (
                              <p className="mt-1 text-xs text-stone-600">{h.note}</p>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      )}

      {cancelOrderId && (
        <div
          className="fixed inset-0 z-[101] flex items-center justify-center bg-stone-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-title"
          onClick={() => setCancelOrderId(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 shrink-0 text-red-600" />
              <h3 id="cancel-title" className="text-lg font-bold text-stone-900">
                Force cancel order
              </h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-stone-600">
              Cancels the order, related deliveries, and marks pending payments as failed. This
              cannot be undone.
            </p>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Reason (shown in history)…"
              rows={4}
              className="mt-4 w-full resize-y rounded-xl border border-stone-200 p-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/25"
            />
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setCancelOrderId(null)}
                className="flex-1 rounded-xl border border-stone-200 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {cancelling ? 'Cancelling…' : 'Confirm cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
