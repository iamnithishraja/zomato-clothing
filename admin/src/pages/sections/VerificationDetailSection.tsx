import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  fetchVerificationDetail,
  updateVerificationStatus,
} from '@/services/dashboardApi';
import { ArrowLeft, Download, FileText, Loader2 } from 'lucide-react';
import PageShell from '@/components/admin/PageShell';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import PanelCard from '@/components/admin/PanelCard';
import LoadingState from '@/components/admin/LoadingState';
import ErrorState from '@/components/admin/ErrorState';

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-stone-100 py-3 sm:grid-cols-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</dt>
      <dd className="sm:col-span-2 text-sm text-stone-900">{value || '—'}</dd>
    </div>
  );
}

function statusLabel(status?: string) {
  return (status || 'unknown').replace(/_/g, ' ');
}

function PdfDocumentCard({
  title,
  url,
  fileName,
}: {
  title: string;
  url: string;
  fileName?: string;
}) {
  return (
    <PanelCard className="overflow-hidden" padded={false}>
      <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-amber-700" />
          <div>
            <p className="text-sm font-semibold text-stone-900">{title}</p>
            <p className="text-xs text-stone-500">{fileName || 'document.pdf'}</p>
          </div>
        </div>
        <a
          href={url}
          download={fileName || 'document.pdf'}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </a>
      </div>
      <div className="h-[min(70vh,520px)] bg-stone-100">
        <iframe
          title={title}
          src={`${url}#toolbar=1`}
          className="h-full w-full border-0"
        />
      </div>
    </PanelCard>
  );
}

export default function VerificationDetailSection({ listPath, listLabel }: { listPath: string; listLabel: string }) {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const load = useCallback(() => {
    if (!userId) return;
    setLoading(true);
    setError('');
    fetchVerificationDetail(userId)
      .then(d => {
        setData(d);
        setNote(d?.user?.verificationReviewNote || '');
      })
      .catch(e => setError(e?.response?.data?.message || e.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatus = async (status: string, options?: { confirm?: string }) => {
    if (!userId) return;
    if (options?.confirm && !window.confirm(options.confirm)) return;

    try {
      setSaving(true);
      setSuccessMsg('');
      await updateVerificationStatus(userId, status, note.trim() || undefined);

      if (status === 'approved') {
        navigate(listPath);
        return;
      }

      setSuccessMsg(`Status updated to "${statusLabel(status)}".`);
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message || e.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageShell><LoadingState /></PageShell>;
  if (error || !data) {
    return (
      <PageShell>
        <ErrorState message={error || 'Not found'} onRetry={load} />
      </PageShell>
    );
  }

  const { user, store, authMethod } = data;
  const docs = user.verificationDocuments || [];
  const rawStatus = user.verificationStatus || 'unknown';
  const hasUploadedDocs = docs.length > 0 || !!user.verificationSubmittedAt;

  return (
    <PageShell>
      <Link
        to={listPath}
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {listLabel}
      </Link>

      <AdminPageHeader
        title={user.name || 'Verification review'}
        description={`${user.role} account · ${statusLabel(rawStatus)}`}
      />

      {successMsg ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {successMsg}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <PanelCard>
          <h3 className="mb-2 text-base font-bold text-stone-900">Account details</h3>
          <dl>
            <DetailRow label="Name" value={user.name} />
            <DetailRow label="Phone" value={user.phone} />
            <DetailRow label="Email" value={user.email} />
            <DetailRow label="Gender" value={user.gender} />
            <DetailRow label="Sign-up method" value={authMethod?.replace('_', ' ')} />
            <DetailRow label="Phone verified" value={user.isPhoneVerified ? 'Yes' : 'No'} />
            <DetailRow label="Email verified" value={user.isEmailVerified ? 'Yes' : 'No'} />
            <DetailRow label="Status" value={statusLabel(rawStatus)} />
            <DetailRow
              label="Submitted at"
              value={
                user.verificationSubmittedAt
                  ? new Date(user.verificationSubmittedAt).toLocaleString('en-IN')
                  : null
              }
            />
            {user.addresses?.length ? (
              <DetailRow label="Addresses" value={user.addresses.join(' · ')} />
            ) : null}
          </dl>
        </PanelCard>

        {store ? (
          <PanelCard>
            <h3 className="mb-2 text-base font-bold text-stone-900">Store details</h3>
            <dl>
              <DetailRow label="Store name" value={store.storeName} />
              <DetailRow label="Address" value={store.address} />
              <DetailRow label="Description" value={store.description} />
              <DetailRow label="Map link" value={store.mapLink} />
              <DetailRow label="Contact phone" value={store.contact?.phone} />
              <DetailRow label="Contact email" value={store.contact?.email} />
              <DetailRow label="Website" value={store.contact?.website} />
            </dl>
          </PanelCard>
        ) : (
          <PanelCard>
            <h3 className="mb-2 text-base font-bold text-stone-900">Delivery profile</h3>
            <p className="text-sm text-stone-600">
              No store linked. Review identity documents below to verify this delivery partner.
            </p>
          </PanelCard>
        )}
      </div>

      <div className="mt-8 space-y-4">
        <h3 className="text-base font-bold text-stone-900">Uploaded documents</h3>
        {docs.length === 0 ? (
          <PanelCard>
            <p className="text-sm text-stone-500">No documents uploaded yet.</p>
          </PanelCard>
        ) : (
          docs.map((doc: any, index: number) => (
            <PdfDocumentCard
              key={`${doc.url}-${index}`}
              title={doc.documentType === 'aadhaar' ? 'Aadhaar' : 'Supporting document'}
              url={doc.url}
              fileName={doc.fileName}
            />
          ))
        )}
      </div>

      <PanelCard className="mt-8">
        <h3 className="mb-3 text-base font-bold text-stone-900">Admin decision</h3>
        <p className="mb-3 text-sm text-stone-600">
          Approve or reject after review. Use &quot;Mark under review&quot; when you have started checking documents.
          &quot;Request new docs&quot; clears uploaded files and asks the user to upload again.
        </p>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Note for the user (shown on rejection or when requesting new documents)"
          rows={3}
          className="mb-4 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => handleStatus('approved')}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? <Loader2 className="inline h-4 w-4 animate-spin" /> : 'Approve'}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleStatus('rejected')}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
          >
            Reject
          </button>
          <button
            type="button"
            disabled={saving || !hasUploadedDocs}
            title={hasUploadedDocs ? undefined : 'User must upload documents first'}
            onClick={() => handleStatus('pending_review')}
            className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-100 disabled:opacity-60"
          >
            Mark under review
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              handleStatus('pending_documents', {
                confirm:
                  'This will delete all uploaded documents from storage and ask the user to upload new ones. Continue?',
              })
            }
            className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-60"
          >
            Request new docs
          </button>
        </div>
        {!hasUploadedDocs ? (
          <p className="mt-3 text-xs text-stone-500">
            &quot;Mark under review&quot; is available after the user uploads documents.
          </p>
        ) : null}
      </PanelCard>
    </PageShell>
  );
}
