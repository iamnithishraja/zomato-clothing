import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchStorePerformance } from '../../services/dashboardApi';
import { ArrowUpDown, ChevronRight } from 'lucide-react';
import PageShell from '@/components/admin/PageShell';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import PanelCard from '@/components/admin/PanelCard';
import LoadingState from '@/components/admin/LoadingState';
import ErrorState from '@/components/admin/ErrorState';
import EmptyState from '@/components/admin/EmptyState';
import PaginationBar from '@/components/admin/PaginationBar';
import { cn } from '@/lib/utils';

const fmt = (v: number) =>
  `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export default function StoresSection() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('totalRevenue');
  const [sortOrder, setSortOrder] = useState('desc');

  const load = () => {
    setLoading(true);
    setError('');
    fetchStorePerformance({ page, limit: 15, sortBy, sortOrder })
      .then(setData)
      .catch(e => setError(e?.response?.data?.message || e.message || 'Failed to load stores'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [page, sortBy, sortOrder]);

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(o => (o === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
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
        <ErrorState message={error} onRetry={load} />
      </PageShell>
    );
  }

  function SortHeader({ label, field }: { label: string; field: string }) {
    const active = sortBy === field;
    return (
      <th className="px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => toggleSort(field)}
          className={cn(
            'inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider',
            active ? 'text-stone-900' : 'text-stone-500 hover:text-stone-800',
          )}
        >
          {label}
          <ArrowUpDown className="h-3.5 w-3.5" />
          {active ? <span aria-hidden>{sortOrder === 'desc' ? '↓' : '↑'}</span> : null}
        </button>
      </th>
    );
  }

  return (
    <PageShell>
      <AdminPageHeader
        title="Store performance"
        description="Rank stores by revenue or reliability — sort order is applied across the full directory before pagination."
      />

      <PanelCard padded={false}>
        {!data?.stores?.length ? (
          <EmptyState title="No stores found" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/80 text-left text-[11px] font-bold uppercase tracking-wider text-stone-500">
                    <th className="px-4 py-3 sm:px-6">Store</th>
                    <th className="px-4 py-3 sm:px-6">Owner</th>
                    <SortHeader label="Orders" field="totalOrders" />
                    <SortHeader label="Revenue" field="totalRevenue" />
                    <SortHeader label="Rating" field="rating" />
                    <SortHeader label="Return %" field="returnRate" />
                    <th className="px-4 py-3 sm:px-6">Status</th>
                    <th className="px-4 py-3 sm:px-6 text-right"> </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {data.stores.map((s: any) => (
                    <tr key={s._id} className="hover:bg-stone-50/80">
                      <td className="px-4 py-3 font-semibold text-stone-900 sm:px-6">
                        {s.storeName}
                      </td>
                      <td className="px-4 py-3 text-stone-600 sm:px-6">
                        <div>{s.owner?.name || '—'}</div>
                        <div className="text-xs text-stone-500">
                          {s.owner?.phone || s.owner?.email || ''}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold tabular-nums sm:px-6">
                        {s.orderStats.totalOrders}
                        <span className="ml-2 text-[11px] font-semibold text-emerald-700">
                          ({s.orderStats.deliveredOrders} delivered)
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold tabular-nums sm:px-6">
                        {fmt(s.orderStats.totalRevenue)}
                      </td>
                      <td className="px-4 py-3 sm:px-6">
                        <span className="font-bold text-amber-800">
                          {s.rating?.average?.toFixed(1) || '0.0'}
                        </span>
                        <span className="ml-1 text-amber-600">★</span>
                        <span className="ml-1 text-xs text-stone-500">
                          ({s.rating?.totalReviews || 0})
                        </span>
                      </td>
                      <td className="px-4 py-3 sm:px-6">
                        <span
                          className={cn(
                            'rounded-md px-2 py-0.5 text-[11px] font-bold',
                            s.orderStats.returnRate > 20
                              ? 'bg-red-100 text-red-800'
                              : s.orderStats.returnRate > 10
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-emerald-100 text-emerald-800',
                          )}
                        >
                          {s.orderStats.returnRate}%
                        </span>
                      </td>
                      <td className="px-4 py-3 sm:px-6">
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ring-inset',
                            s.isActive
                              ? 'bg-emerald-100 text-emerald-800 ring-emerald-200/50'
                              : 'bg-red-100 text-red-800 ring-red-200/50',
                          )}
                        >
                        {s.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right sm:px-6">
                      <Link
                        to={`/dashboard/stores/${s._id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-50"
                      >
                        Details
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data?.pagination && data.pagination.totalPages > 1 ? (
              <PaginationBar
                page={data.pagination.page}
                totalPages={data.pagination.totalPages}
                totalLabel={`${data.pagination.total} stores`}
                disabledPrev={page <= 1}
                disabledNext={page >= data.pagination.totalPages}
                onPrev={() => setPage(p => Math.max(1, p - 1))}
                onNext={() => setPage(p => p + 1)}
              />
            ) : null}
          </>
        )}
      </PanelCard>
    </PageShell>
  );
}
