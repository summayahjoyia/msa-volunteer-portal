type Group = { cap: number; taken: number }

// Shows "Brothers: 2 of 3 spots open" style lines. A group with no spots is left out
// entirely, so a brothers-only item only lists brothers. The viewer's own line is
// emphasized and the other is muted.
export default function GroupCounts({
  brothers,
  sisters,
  viewerGender,
}: {
  brothers: Group
  sisters: Group
  viewerGender: 'brother' | 'sister' | null
}) {
  const rows = [
    { key: 'brother' as const, label: 'Brothers', group: brothers },
    { key: 'sister' as const, label: 'Sisters', group: sisters },
  ].filter((row) => row.group.cap > 0)

  return (
    <div className="text-xs space-y-0.5">
      {rows.map(({ key, label, group }) => {
        const open = Math.max(group.cap - group.taken, 0)
        const tone =
          viewerGender === null
            ? 'text-gray-500 dark:text-gray-400'
            : viewerGender === key
            ? 'text-gray-800 dark:text-gray-100 font-medium'
            : 'text-gray-400 dark:text-gray-500'
        return (
          <p key={key} className={tone}>
            {label}: {open} of {group.cap} spots open
          </p>
        )
      })}
    </div>
  )
}