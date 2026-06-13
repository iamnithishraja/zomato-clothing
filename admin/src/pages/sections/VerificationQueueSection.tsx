import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchVerificationQueue } from '@/services/dashboardApi';
import { ChevronRight } from 'lucide-react';
import PageShell from '@/components/admin/PageShell';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import PanelCard from '@/components/admin/PanelCard';
import LoadingState from '@/components/admin/LoadingState';
import ErrorState from '@/components/admin/ErrorState';
import EmptyState from '@/components/admin/EmptyState';
import SegmentedControl from '@/components/admin/SegmentedControl';
import PaginationBar from '@/components/admin/PaginationBar';
import { cn } from '@/lib/utils';

type QueueRole = 'merchants' | 'delivery';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All pending' },
  { value: 'pending_review', label: 'Under review' },
  { value: 'pending_documents', label: 'Awaiting docs' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'approved', label: 'Approved' },
];

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    pending_documents: 'bg-amber-50 text-amber-800 ring-amber-200',
    pending_review: 'bg-sky-50 text-sky-800 ring-sky-200',
    approved: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    rejected: 'bg-red-50 text-red-800 ring-red-200',
  };
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        styles[status] || 'bg-stone-100 text-stone-700 ring-stone-200',
      )}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}

export default function VerificationQueueSection({
  role,
  title,
  description,
}: {
  role: QueueRole;
  title: string;
  description: string;
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    fetchVerificationQueue(role, {
      page,
      limit: 15,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      search: search.trim() || undefined,
    })
      .then(setData)
      .catch(e => setError(e?.response?.data?.message || e.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [role, page, statusFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  const detailBase =
    role === 'merchants'
      ? '/dashboard/verification/merchants'
      : '/dashboard/verification/delivery';

  return (
    <PageShell>
      <AdminPageHeader title={title} description={description} />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedControl
          value={statusFilter}
          onChange={v => {
            setStatusFilter(v);
            setPage(1);
          }}
          options={STATUS_OPTIONS}
        />
        <input
          type="search"
          placeholder="Search name, phone, email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && load()}
          className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm sm:max-w-xs"
        />
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !data?.items?.length ? (
        <EmptyState title="No verification requests" description="Nothing matches your filters." />
      ) : (
        <PanelCard>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-100 text-xs uppercase tracking-wide text-stone-500">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Contact</th>
                  {role === 'merchants' ? <th className="px-4 py-3">Store</th> : null}
                  <th className="px-4 py-3">Auth</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {data.items.map((item: any) => (
                  <tr key={item._id} className="border-b border-stone-50 hover:bg-stone-50/80">
                    <td className="px-4 py-3 font-medium text-stone-900">{item.name || '—'}</td>
                    <td className="px-4 py-3 text-stone-600">
                      <div>{item.phone || '—'}</div>
                      <div className="text-xs text-stone-400">{item.email || ''}</div>
                    </td>
                    {role === 'merchants' ? (
                      <td className="px-4 py-3 text-stone-600">{item.storeName || '—'}</td>
                    ) : null}
                    <td className="px-4 py-3 capitalize text-stone-600">
                      {item.authMethod?.replace('_', ' ') || '—'}
                    </td>
                    <td className="px-4 py-3">{statusBadge(item.verificationStatus)}</td>
                    <td className="px-4 py-3 text-stone-500">
                      {item.verificationSubmittedAt
                        ? new Date(item.verificationSubmittedAt).toLocaleString('en-IN')
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`${detailBase}/${item._id}`}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-amber-700 hover:text-amber-900"
                      >
                        Review <ChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationBar
            page={data.pagination?.page ?? 1}
            totalPages={data.pagination?.totalPages ?? 1}
            onPrev={() => setPage(p => Math.max(1, p - 1))}
            onNext={() => setPage(p => p + 1)}
            disabledPrev={(data.pagination?.page ?? 1) <= 1}
            disabledNext={(data.pagination?.page ?? 1) >= (data.pagination?.totalPages ?? 1)}
          />
        </PanelCard>
      )}
    </PageShell>
  );
}
