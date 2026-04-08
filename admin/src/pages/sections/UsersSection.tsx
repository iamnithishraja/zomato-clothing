import { useEffect, useState, useCallback } from 'react';
import { fetchAllUsers, fetchUserStats } from '../../services/dashboardApi';
import { Users, UserCheck, Search } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { chartTooltip } from '@/lib/chart-common';
import PageShell from '@/components/admin/PageShell';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import PanelCard from '@/components/admin/PanelCard';
import LoadingState from '@/components/admin/LoadingState';
import ErrorState from '@/components/admin/ErrorState';
import EmptyState from '@/components/admin/EmptyState';
import SegmentedControl from '@/components/admin/SegmentedControl';
import PaginationBar from '@/components/admin/PaginationBar';
import { chartTheme } from '@/lib/admin-theme';
import { cn } from '@/lib/utils';

const ROLE_BADGE: Record<string, string> = {
  User: 'bg-sky-100 text-sky-800 ring-sky-200/50',
  Merchant: 'bg-amber-100 text-amber-900 ring-amber-200/50',
  Delivery: 'bg-violet-100 text-violet-800 ring-violet-200/50',
};

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ring-inset',
        ROLE_BADGE[role] ?? 'bg-stone-100 text-stone-700 ring-stone-200/60',
      )}
    >
      {role}
    </span>
  );
}

export default function UsersSection() {
  const [stats, setStats] = useState<any>(null);
  const [usersData, setUsersData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const loadInitial = () => {
    setLoading(true);
    setError('');
    Promise.all([fetchUserStats(), fetchAllUsers({ page: 1, limit: 15 })])
      .then(([s, u]) => {
        setStats(s);
        setUsersData(u);
      })
      .catch(e => setError(e?.response?.data?.message || e.message || 'Failed to load users'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadInitial();
  }, []);

  const loadUsers = useCallback(() => {
    fetchAllUsers({
      page,
      limit: 15,
      role: roleFilter !== 'all' ? roleFilter : undefined,
      search: search || undefined,
    })
      .then(setUsersData)
      .catch(() => {});
  }, [page, roleFilter, search]);

  useEffect(() => {
    if (stats) loadUsers();
  }, [loadUsers, stats]);

  const regData = (stats?.registrationTrend ?? []).map((r: any) => {
    const iso = r.date as string | undefined;
    let dayLabel = iso?.slice(8) ?? iso?.slice(5) ?? '';
    let dateFull = iso ?? '';
    try {
      if (iso && iso.length >= 10) {
        const d = new Date(iso);
        dayLabel = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        dateFull = d.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      }
    } catch {
      /* keep */
    }
    return { dayLabel, dateFull, signups: r.count };
  });

  if (loading && !stats) {
    return (
      <PageShell>
        <LoadingState />
      </PageShell>
    );
  }

  if (error && !stats) {
    return (
      <PageShell>
        <ErrorState message={error} onRetry={loadInitial} />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <AdminPageHeader
        title="User management"
        description="Directory of customers, merchants, and partners — with acquisition trend."
      />

      {stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-800">
                <Users className="h-5 w-5" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                Total users
              </p>
            </div>
            <p className="mt-3 text-2xl font-bold tabular-nums">
              {stats.totalUsers.toLocaleString('en-IN')}
            </p>
            <p className="mt-1 text-xs font-medium text-emerald-700">
              +{stats.newUsersLast30Days} in the last 30 days
            </p>
          </div>
          {Object.entries(stats.roleBreakdown || {}).map(([role, count]) => (
            <div
              key={role}
              className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm"
            >
              <RoleBadge role={role} />
              <p className="mt-3 text-2xl font-bold tabular-nums">
                {(count as number).toLocaleString('en-IN')}
              </p>
            </div>
          ))}
          <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                <UserCheck className="h-5 w-5" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                Profiles complete
              </p>
            </div>
            <p className="mt-3 text-2xl font-bold tabular-nums">
              {(stats.profileCompletion?.complete || 0).toLocaleString('en-IN')}
            </p>
            <p className="mt-1 text-xs text-stone-500">
              {(stats.profileCompletion?.incomplete || 0)} incomplete
            </p>
          </div>
        </div>
      ) : null}

      {regData.length > 0 ? (
        <div className="mt-8">
          <PanelCard
            title="New registrations"
            description="Daily sign-ups in the last 30 days"
          >
            <div className="h-[260px] w-full min-w-0 sm:h-[292px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={regData}
                  margin={{ top: 16, right: 16, left: 8, bottom: regData.length > 14 ? 48 : 32 }}
                >
                  <CartesianGrid stroke={chartTheme.grid} strokeDasharray="4 4" vertical={false} />
                  <XAxis
                    dataKey="dayLabel"
                    tick={{ fill: chartTheme.axis, fontSize: 10 }}
                    axisLine={{ stroke: '#d6d3d1' }}
                    tickLine={false}
                    interval={regData.length > 16 ? 'preserveStartEnd' : 0}
                    angle={regData.length > 14 ? -35 : 0}
                    textAnchor={regData.length > 14 ? 'end' : 'middle'}
                    height={regData.length > 14 ? 40 : 28}
                    label={{
                      value: 'Day',
                      position: 'insideBottom',
                      offset: -2,
                      fill: chartTheme.axis,
                      fontSize: 11,
                    }}
                  />
                  <YAxis
                    tick={{ fill: chartTheme.axis, fontSize: 11 }}
                    width={36}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                    label={{
                      value: 'Signups',
                      angle: -90,
                      position: 'insideLeft',
                      fill: chartTheme.axis,
                      fontSize: 11,
                    }}
                  />
                  <Tooltip
                    {...chartTooltip}
                    labelFormatter={(_l, p) =>
                      (p?.[0]?.payload as { dateFull?: string })?.dateFull ?? ''
                    }
                    formatter={(v: number) => [`${v} new users`, 'Registrations']}
                  />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="signups"
                    name="New sign-ups"
                    stroke={chartTheme.accent3}
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: chartTheme.accent3, stroke: '#fff', strokeWidth: 2 }}
                    activeDot={{ r: 5 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </PanelCard>
        </div>
      ) : null}

      <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <SegmentedControl
          value={roleFilter}
          onChange={v => {
            setRoleFilter(v);
            setPage(1);
          }}
          options={[
            { value: 'all', label: 'All roles' },
            { value: 'User', label: 'Customers' },
            { value: 'Merchant', label: 'Merchants' },
            { value: 'Delivery', label: 'Delivery' },
          ]}
        />
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:max-w-md">
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
              placeholder="Name, phone, email…"
              className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setSearch(searchInput);
              setPage(1);
            }}
            className="shrink-0 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-bold text-stone-900 hover:bg-amber-500"
          >
            Search
          </button>
        </div>
      </div>

      <div className="mt-6">
        <PanelCard padded={false}>
          {!usersData?.users?.length ? (
            <EmptyState title="No users found" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-[800px] w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50/80 text-left text-[11px] font-bold uppercase tracking-wider text-stone-500">
                      <th className="px-4 py-3 sm:px-6">Name</th>
                      <th className="px-4 py-3 sm:px-6">Phone</th>
                      <th className="px-4 py-3 sm:px-6">Email</th>
                      <th className="px-4 py-3 sm:px-6">Role</th>
                      <th className="px-4 py-3 sm:px-6">Profile</th>
                      <th className="px-4 py-3 sm:px-6">Verified</th>
                      <th className="px-4 py-3 sm:px-6">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {usersData.users.map((u: any) => (
                      <tr key={u._id} className="hover:bg-stone-50/80">
                        <td className="px-4 py-3 font-semibold text-stone-900 sm:px-6">
                          {u.name || '—'}
                        </td>
                        <td className="px-4 py-3 text-stone-600 sm:px-6">{u.phone || '—'}</td>
                        <td className="max-w-[200px] truncate px-4 py-3 text-stone-600 sm:px-6">
                          {u.email || '—'}
                        </td>
                        <td className="px-4 py-3 sm:px-6">
                          <RoleBadge role={u.role} />
                        </td>
                        <td className="px-4 py-3 sm:px-6">
                          <span
                            className={cn(
                              'rounded-md px-2 py-0.5 text-[11px] font-semibold',
                              u.isProfileComplete
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-900',
                            )}
                          >
                            {u.isProfileComplete ? 'Complete' : 'Incomplete'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold sm:px-6">
                          {u.isPhoneVerified || u.isEmailVerified ? (
                            <span className="text-emerald-700">Yes</span>
                          ) : (
                            <span className="text-red-600">No</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-stone-500 sm:px-6">
                          {new Date(u.createdAt).toLocaleDateString('en-IN', {
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
              {usersData?.pagination && usersData.pagination.totalPages > 1 ? (
                <PaginationBar
                  page={usersData.pagination.page}
                  totalPages={usersData.pagination.totalPages}
                  totalLabel={`${usersData.pagination.total} users`}
                  disabledPrev={page <= 1}
                  disabledNext={page >= usersData.pagination.totalPages}
                  onPrev={() => setPage(p => Math.max(1, p - 1))}
                  onNext={() => setPage(p => p + 1)}
                />
              ) : null}
            </>
          )}
        </PanelCard>
      </div>
    </PageShell>
  );
}
