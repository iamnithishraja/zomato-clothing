/** Shared Recharts styling for readable labels and light fills */

export const chartTooltip = {
  contentStyle: {
    borderRadius: 12,
    border: '1px solid #e7e5e4',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    fontSize: 13,
    padding: '10px 14px',
  },
  labelStyle: { fontWeight: 700 as const, marginBottom: 4, color: '#1c1917' },
  itemStyle: { paddingTop: 2, color: '#44403c' },
};

/** Legend line: "Role name — 1,234 accounts" */
export function pieLegendFormatter(value: string, entry: { payload?: { value?: number } }) {
  const n = entry?.payload?.value;
  const count = typeof n === 'number' ? n.toLocaleString('en-IN') : '';
  return `${value} — ${count}`;
}
