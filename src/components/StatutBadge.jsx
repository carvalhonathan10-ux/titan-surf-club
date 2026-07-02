export function statutSeances(n) {
  if (n === null || n === undefined) return { cls: 'badge-neutral', label: '—' }
  if (n <= 0) return { cls: 'badge-rouge', label: `${n} séance${n === 1 ? '' : 's'}` }
  if (n <= 3) return { cls: 'badge-ambre', label: `${n} séances` }
  return { cls: 'badge-vert', label: `${n} séances` }
}

export default function StatutBadge({ seances }) {
  const { cls, label } = statutSeances(seances)
  return <span className={`badge ${cls}`}>{label}</span>
}
