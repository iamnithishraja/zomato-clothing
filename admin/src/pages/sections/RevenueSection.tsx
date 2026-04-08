import { useEffect, useState } from 'react';
import {
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { chartTooltip } from '@/lib/chart-common';
import { fetchFinanceSummary, fetchTransactions } from '../../services/dashboardApi';
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
import { chartTheme } from '@/lib/admin-theme';
import { cn } from '@/lib/utils';

const fmt = (v: number) =>
  `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Completed: 'bg-emerald-100 text-emerald-800 ring-emerald-200/60',
    Failed: 'bg-red-100 text-red-800 ring-red-200/60',
    Pending: 'bg-amber-100 text-amber-900 ring-amber-200/50',
    Refunded: 'bg-sky-100 text-sky-900 ring-sky-200/60',
  };
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ring-inset',
        map[status] ?? 'bg-stone-100 text-stone-700 ring-stone-200/60',
      )}
    >
      {status}
    </span>
  );
}

export default function RevenueSection() {
  const [summary, setSummary] = useState<any>(null);
  const [txns, setTxns] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [txPage, setTxPage] = useState(1);
  const [txFilter, setTxFilter] = useState('all');
  const [txMethodFilter, setTxMethodFilter] = useState<'all' | 'COD' | 'Online'>('all');

  const [dateDraftFrom, setDateDraftFrom] = useState('');
  const [dateDraftTo, setDateDraftTo] = useState('');
  const [appliedDateFrom, setAppliedDateFrom] = useState('');
  const [appliedDateTo, setAppliedDateTo] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    fetchFinanceSummary()
      .then(setSummary)
      .catch(e => setError(e?.response?.data?.message || e.message || 'Failed to load finance data'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchTransactions({
      page: txPage,
      limit: 15,
      status: txFilter !== 'all' ? txFilter : undefined,
      method: txMethodFilter !== 'all' ? txMethodFilter : undefined,
      dateFrom: appliedDateFrom || undefined,
      dateTo: appliedDateTo || undefined,
    })
      .then(setTxns)
      .catch(() => {});
  }, [txPage, txFilter, txMethodFilter, appliedDateFrom, appliedDateTo]);

  const loadAll = () => {
    setLoading(true);
    setError('');
    Promise.all([
      fetchFinanceSummary(),
      fetchTransactions({
        page: 1,
        limit: 15,
        status: txFilter !== 'all' ? txFilter : undefined,
        method: txMethodFilter !== 'all' ? txMethodFilter : undefined,
        dateFrom: appliedDateFrom || undefined,
        dateTo: appliedDateTo || undefined,
      }),
    ])
      .then(([s, t]) => {
        setSummary(s);
        setTxns(t);
        setTxPage(1);
      })
      .catch(e => setError(e?.response?.data?.message || e.message || 'Failed to load finance data'))
      .finally(() => setLoading(false));
  };

  if (loading && !summary) {
    return (
      <PageShell>
        <LoadingState />
      </PageShell>
    );
  }

  if (error && !summary) {
    return (
      <PageShell>
        <ErrorState message={error} onRetry={loadAll} />
      </PageShell>
    );
  }

  if (!summary) return null;

  const monthlyData = (summary.revenueByMonth ?? []).map((m: any) => {
    let monthShort = m.month?.slice(5) ?? '';
    let monthLong = m.month ?? '';
    try {
      if (m.month && String(m.month).length >= 7) {
        const d = new Date(String(m.month) + '-01');
        monthShort = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
        monthLong = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      }
    } catch {
      /* keep */
    }
    return {
      label: monthShort,
      monthLong,
      revenue: m.revenue,
      orders: m.orders,
    };
  });

  const paymentMethodRows = Object.entries(summary.paymentMethodBreakdown ?? {}).slice(0, 8);

  const cards = [
    {
      icon: DollarSign,
      label: 'GMV',
      value: fmt(summary.gmv),
      sub: null as string | null,
      iconWrap: 'bg-emerald-100 text-emerald-800',
    },
    {
      icon: DollarSign,
      label: 'Platform commission (5%)',
      value: fmt(summary.platformCommission),
      sub: null,
      iconWrap: 'bg-amber-100 text-amber-900',
    },
    {
      icon: CheckCircle,
      label: 'Successful payments',
      value: `${summary.successPayments.count}`,
      sub: fmt(summary.successPayments.total),
      iconWrap: 'bg-emerald-100 text-emerald-800',
    },
    {
      icon: XCircle,
      label: 'Failed',
      value: `${summary.failedPayments.count}`,
      sub: fmt(summary.failedPayments.total),
      iconWrap: 'bg-red-100 text-red-800',
    },
    {
      icon: Clock,
      label: 'Pending',
      value: `${summary.pendingPayments.count}`,
      sub: fmt(summary.pendingPayments.total),
      iconWrap: 'bg-amber-100 text-amber-900',
    },
    {
      icon: RefreshCw,
      label: 'Refunded',
      value: `${summary.refundedPayments.count}`,
      sub: fmt(summary.refundedPayments.total),
      iconWrap: 'bg-sky-100 text-sky-900',
    },
  ];

  return (
    <PageShell>
      <AdminPageHeader
        title="Revenue & financial"
        description="Gross merchandise value, settlements snapshot, and the latest payment ledger."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm shadow-stone-200/40"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl',
                    c.iconWrap,
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                  {c.label}
                </p>
              </div>
              <p className="mt-3 text-xl font-bold tabular-nums text-stone-900 sm:text-2xl">
                {c.value}
              </p>
              {c.sub ? <p className="mt-1 text-xs text-stone-600">{c.sub}</p> : null}
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <PanelCard
          className="lg:col-span-3"
          title="Monthly revenue"
          description="Last six months — gross order value"
        >
          {monthlyData.length === 0 ? (
            <p className="py-12 text-center text-sm text-stone-500">Not enough history yet.</p>
          ) : (
            <div className="h-[300px] w-full min-w-0 sm:h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 16, right: 16, left: 8, bottom: 40 }}>
                  <defs>
                    <linearGradient id="revBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#15803d" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#15803d" stopOpacity={0.35} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={chartTheme.grid} strokeDasharray="4 4" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: chartTheme.axis, fontSize: 11 }}
                    axisLine={{ stroke: '#d6d3d1' }}
                    tickLine={false}
                    label={{
                      value: 'Month',
                      position: 'insideBottom',
                      offset: -4,
                      fill: chartTheme.axis,
                      fontSize: 11,
                    }}
                  />
                  <YAxis
                    tick={{ fill: chartTheme.axis, fontSize: 11 }}
                    tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}
                    axisLine={false}
                    tickLine={false}
                    width={52}
                    label={{
                      value: 'Revenue (₹)',
                      angle: -90,
                      position: 'insideLeft',
                      fill: chartTheme.axis,
                      fontSize: 11,
                    }}
                  />
                  <Tooltip
                    {...chartTooltip}
                    labelFormatter={(_l, p) => {
                      const pl = p?.[0]?.payload as { monthLong?: string; orders?: number };
                      if (!pl?.monthLong) return '';
                      return pl.orders != null
                        ? `${pl.monthLong} · ${pl.orders} orders`
                        : pl.monthLong;
                    }}
                    formatter={(v: string | number) => [
                      `₹${Number(v).toLocaleString('en-IN')}`,
                      'Gross revenue',
                    ]}
                  />
                  <Legend verticalAlign="top" align="center" wrapperStyle={{ fontSize: 12 }} />
                  <Bar
                    dataKey="revenue"
                    name="Gross revenue (₹)"
                    fill="url(#revBar)"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={56}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </PanelCard>

        <PanelCard
          className="lg:col-span-2"
          title="Payment methods"
          description="Count / volume by instrument"
        >
          {paymentMethodRows.length === 0 ? (
            <p className="py-12 text-center text-sm text-stone-500">No payment rows.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {paymentMethodRows.map(([method, row]: [string, any]) => (
                <li key={method} className="flex items-center justify-between py-3 text-sm first:pt-0">
                  <span className="font-medium text-stone-800">{method}</span>
                  <span className="text-right tabular-nums text-stone-600">
                    <span className="block font-semibold text-stone-900">
                      {fmt(row.total ?? 0)}
                    </span>
                    <span className="text-xs">
                      {row.count ?? 0} txn{(row.count ?? 0) === 1 ? '' : 's'}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </PanelCard>
      </div>

      <div className="mt-8 space-y-4">
        <DateRangeFilterBar
          dateFrom={dateDraftFrom}
          dateTo={dateDraftTo}
          onDateFromChange={setDateDraftFrom}
          onDateToChange={setDateDraftTo}
          onApply={() => {
            setAppliedDateFrom(dateDraftFrom);
            setAppliedDateTo(dateDraftTo);
            setTxPage(1);
          }}
          onClear={() => {
            setDateDraftFrom('');
            setDateDraftTo('');
            setAppliedDateFrom('');
            setAppliedDateTo('');
            setTxPage(1);
          }}
          onPresetDays={days => {
            const { from, to } = dateRangePresetDays(days);
            setDateDraftFrom(from);
            setDateDraftTo(to);
            setAppliedDateFrom(from);
            setAppliedDateTo(to);
            setTxPage(1);
          }}
        />
        <PanelCard
          title="Payment transactions"
          description="Newest first — date range, method, and gateway outcome"
          action={
            <div className="flex max-w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
              <SegmentedControl
                value={txMethodFilter}
                onChange={v => {
                  setTxMethodFilter(v as 'all' | 'COD' | 'Online');
                  setTxPage(1);
                }}
                options={[
                  { value: 'all', label: 'All methods' },
                  { value: 'COD', label: 'COD' },
                  { value: 'Online', label: 'Online' },
                ]}
              />
              <SegmentedControl
                value={txFilter}
                onChange={v => {
                  setTxFilter(v);
                  setTxPage(1);
                }}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'Completed', label: 'Done' },
                  { value: 'Failed', label: 'Failed' },
                  { value: 'Pending', label: 'Pending' },
                  { value: 'Refunded', label: 'Refunded' },
                ]}
              />
            </div>
          }
          padded={false}
        >
          {!txns?.transactions?.length ? (
            <EmptyState title="No transactions match this filter" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-[720px] w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50/80 text-left text-[11px] font-bold uppercase tracking-wider text-stone-500">
                      <th className="px-4 py-3 sm:px-6">Order</th>
                      <th className="px-4 py-3 sm:px-6">Customer</th>
                      <th className="px-4 py-3 sm:px-6">Store</th>
                      <th className="px-4 py-3 sm:px-6">Amount</th>
                      <th className="px-4 py-3 sm:px-6">Method</th>
                      <th className="px-4 py-3 sm:px-6">Status</th>
                      <th className="px-4 py-3 sm:px-6">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {txns.transactions.map((t: any) => (
                      <tr key={t._id} className="hover:bg-stone-50/80">
                        <td className="whitespace-nowrap px-4 py-3 font-semibold text-stone-900 sm:px-6">
                          {t.order?.orderNumber || t.order?._id?.slice(-6) || '—'}
                        </td>
                        <td className="px-4 py-3 text-stone-600 sm:px-6">
                          {t.user?.name || t.user?.phone || '—'}
                        </td>
                        <td className="px-4 py-3 text-stone-600 sm:px-6">
                          {t.store?.storeName || '—'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-bold tabular-nums text-stone-900 sm:px-6">
                          {fmt(t.amount)}
                        </td>
                        <td className="px-4 py-3 sm:px-6">
                          <span
                            className={cn(
                              'rounded-md px-2 py-0.5 text-[11px] font-semibold',
                              t.paymentMethod === 'Online'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-amber-100 text-amber-900',
                            )}
                          >
                            {t.paymentMethod}
                          </span>
                        </td>
                        <td className="px-4 py-3 sm:px-6">
                          <StatusBadge status={t.paymentStatus} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-stone-500 sm:px-6">
                          {new Date(t.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationBar
                page={txns.pagination.page}
                totalPages={txns.pagination.totalPages}
                disabledPrev={txPage <= 1}
                disabledNext={txPage >= txns.pagination.totalPages}
                onPrev={() => setTxPage(p => Math.max(1, p - 1))}
                onNext={() => setTxPage(p => p + 1)}
              />
            </>
          )}
        </PanelCard>
      </div>
    </PageShell>
  );
}
