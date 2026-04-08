import { useEffect, useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, Store } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { fetchStoreDetail } from '../../services/dashboardApi';
import PageShell from '@/components/admin/PageShell';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import PanelCard from '@/components/admin/PanelCard';
import LoadingState from '@/components/admin/LoadingState';
import ErrorState from '@/components/admin/ErrorState';
import { chartTheme } from '@/lib/admin-theme';
import { chartTooltip, pieLegendFormatter } from '@/lib/chart-common';
import { cn } from '@/lib/utils';

const STATUS_PIE_COLORS = [
  '#b45309',
  '#15803d',
  '#0369a1',
  '#7c3aed',
  '#c2410c',
  '#57534e',
  '#64748b',
  '#db2777',
];

function fmt(v: number) {
  return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export default function StoreDetailSection() {
  const { storeId } = useParams<{ storeId: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    if (!storeId) return;
    setLoading(true);
    setError('');
    fetchStoreDetail(storeId)
      .then(setData)
      .catch(e =>
        setError(e?.response?.data?.message || e.message || 'Failed to load store'),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [storeId]);

  const trendData = useMemo(() => {
    const rows = data?.ordersTrendDaily ?? [];
    return rows.map((r: any) => {
      let short = r.date?.slice(5) ?? r.date ?? '';
      let long = r.date ?? '';
      try {
        if (r.date && String(r.date).length >= 10) {
          const d = new Date(String(r.date));
          short = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
          long = d.toLocaleDateString('en-IN', {
            weekday: 'short',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          });
        }
      } catch {
        /* */
      }
      return {
        short,
        long,
        orders: r.orders,
        revenue: r.revenue,
      };
    });
  }, [data]);

  const statusPieData = useMemo(() => {
    const b = data?.orderStatusBreakdown ?? {};
    return Object.entries(b).map(([name, value]) => ({
      name,
      value: value as number,
    }));
  }, [data]);

  if (!storeId) {
    return (
      <PageShell>
        <ErrorState title="Missing store" message="Invalid link." />
      </PageShell>
    );
  }

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
        <ErrorState message={error} onRetry={load} />
      </PageShell>
    );
  }

  if (!data?.store) return null;

  const { store, orderStats, recentOrders } = data;
  const dense = trendData.length > 14;

  return (
    <PageShell>
      <div className="mb-6">
        <Link
          to="/dashboard/stores"
          className="inline-flex items-center gap-2 text-sm font-semibold text-amber-900 hover:text-amber-950"
        >
          <ArrowLeft className="h-4 w-4" />
          All stores
        </Link>
      </div>

      <AdminPageHeader
        title={store.storeName}
        description={[
          store.owner?.name ? `Owner: ${store.owner.name}` : null,
          store.address ? String(store.address).slice(0, 120) : null,
        ]
          .filter(Boolean)
          .join(' · ')}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset',
                store.isActive
                  ? 'bg-emerald-100 text-emerald-800 ring-emerald-200/60'
                  : 'bg-red-100 text-red-800 ring-red-200/60',
              )}
            >
              {store.isActive ? 'Active' : 'Inactive'}
            </span>
            {store.rating?.average != null ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-950">
                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-600" />
                {Number(store.rating.average).toFixed(1)}
                <span className="font-normal text-amber-800">
                  ({store.rating.totalReviews ?? 0} reviews)
                </span>
              </span>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            <Store className="h-4 w-4" />
            Total orders
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums">
            {orderStats.totalOrders.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            Gross revenue
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums">{fmt(orderStats.totalRevenue)}</p>
        </div>
        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            Delivered / cancelled
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-emerald-800">
            {orderStats.deliveredOrders}
            <span className="ml-2 text-base font-semibold text-red-700">
              / {orderStats.cancelledOrders}
            </span>
          </p>
          <p className="mt-1 text-xs text-stone-600">Return / cancel rate: {orderStats.returnRate}%</p>
        </div>
        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            <MapPin className="h-4 w-4" />
            Listed
          </div>
          <p className="mt-2 text-sm font-medium text-stone-800">
            {store.createdAt
              ? new Date(store.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : '—'}
          </p>
          {store.owner?.phone || store.owner?.email ? (
            <p className="mt-1 text-xs text-stone-600">
              {[store.owner.phone, store.owner.email].filter(Boolean).join(' · ')}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <PanelCard
          className="lg:col-span-2"
          title="Daily orders & revenue"
          description="Last 90 days — hover for full date and amounts"
        >
          {trendData.length === 0 ? (
            <p className="py-12 text-center text-sm text-stone-500">No orders in this window yet.</p>
          ) : (
            <div className="h-[340px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trendData}
                  margin={{ top: 16, right: 20, left: 8, bottom: dense ? 52 : 36 }}
                >
                  <CartesianGrid stroke={chartTheme.grid} strokeDasharray="4 4" vertical={false} />
                  <XAxis
                    dataKey="short"
                    tick={{ fill: chartTheme.axis, fontSize: 10 }}
                    axisLine={{ stroke: '#d6d3d1' }}
                    tickLine={false}
                    interval={dense ? 'preserveStartEnd' : 0}
                    angle={dense ? -40 : 0}
                    textAnchor={dense ? 'end' : 'middle'}
                    height={dense ? 48 : 30}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fill: chartTheme.axis, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                    label={{
                      value: 'Orders',
                      angle: -90,
                      position: 'insideLeft',
                      fill: chartTheme.axis,
                      fontSize: 11,
                    }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: chartTheme.axis, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={56}
                    tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}
                    label={{
                      value: 'Revenue (₹)',
                      angle: 90,
                      position: 'insideRight',
                      fill: chartTheme.axis,
                      fontSize: 11,
                    }}
                  />
                  <Tooltip
                    {...chartTooltip}
                    labelFormatter={(_l, p) =>
                      (p?.[0]?.payload as { long?: string })?.long ?? ''
                    }
                    formatter={(value: number, name: string) => {
                      if (name === 'orders' || name === 'Orders')
                        return [`${value.toLocaleString('en-IN')}`, 'Orders'];
                      return [fmt(value), 'Revenue'];
                    }}
                  />
                  <Legend verticalAlign="top" wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="orders"
                    name="Orders"
                    stroke={chartTheme.accent}
                    strokeWidth={2}
                    dot={{ r: 3, stroke: '#fff', strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue (₹)"
                    stroke="#15803d"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </PanelCard>

        <PanelCard
          title="Orders by status"
          description="Legend shows each status with order count"
        >
          {statusPieData.length === 0 ? (
            <p className="py-12 text-center text-sm text-stone-500">No status data.</p>
          ) : (
            <div className="h-[340px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 8, bottom: 8 }}>
                  <Pie
                    data={statusPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="42%"
                    innerRadius={44}
                    outerRadius={68}
                    paddingAngle={2}
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {statusPieData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={STATUS_PIE_COLORS[i % STATUS_PIE_COLORS.length]}
                        fillOpacity={0.9}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    {...chartTooltip}
                    formatter={(v: number, n: string) => [
                      `${v.toLocaleString('en-IN')} orders`,
                      n,
                    ]}
                  />
                  <Legend
                    layout="vertical"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ fontSize: 11, maxHeight: 120, overflowY: 'auto' }}
                    formatter={pieLegendFormatter}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </PanelCard>
      </div>

      <div className="mt-8">
        <PanelCard title="Recent orders" description="Newest 30 at this store">
          {!recentOrders?.length ? (
            <p className="py-10 text-center text-sm text-stone-500">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[720px] w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/80 text-left text-[11px] font-bold uppercase tracking-wider text-stone-500">
                    <th className="px-4 py-2">Order</th>
                    <th className="px-4 py-2">Customer</th>
                    <th className="px-4 py-2">Amount</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Payment</th>
                    <th className="px-4 py-2">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {recentOrders.map((o: any) => (
                    <tr key={o._id} className="hover:bg-stone-50/80">
                      <td className="px-4 py-2 font-semibold">
                        {o.orderNumber || o._id?.slice(-8)}
                      </td>
                      <td className="px-4 py-2 text-stone-600">
                        {o.user?.name || o.user?.phone || '—'}
                      </td>
                      <td className="px-4 py-2 font-bold tabular-nums">
                        {fmt(o.totalAmount ?? 0)}
                      </td>
                      <td className="px-4 py-2 text-xs font-semibold text-stone-800">{o.status}</td>
                      <td className="px-4 py-2 text-xs text-stone-600">
                        {o.paymentMethod} / {o.paymentStatus}
                      </td>
                      <td className="px-4 py-2 text-xs text-stone-500">
                        {o.createdAt
                          ? new Date(o.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                            })
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </PanelCard>
      </div>
    </PageShell>
  );
}
