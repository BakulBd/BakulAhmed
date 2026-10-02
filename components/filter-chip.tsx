/**
 * A filter chip with its count, shared by the portfolio and the blog. The
 * count is drawn small inside the chip for the eye, and spoken in words for a
 * screen reader ("Full-stack (1 project)").
 */
export default function FilterChip({
  label,
  count,
  unit,
  selected,
  onSelect,
}: {
  label: string;
  count: number;
  unit: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button type="button" onClick={() => selected || onSelect()} aria-pressed={selected} className="chip">
      {label}
      <span className="chip__count" aria-hidden="true">
        {count}
      </span>
      <span className="sr-only">
        ({count} {unit}
        {count === 1 ? "" : "s"})
      </span>
    </button>
  );
}

/** How many items fall under each filter, "All" included — counted once. */
export function countBy<T>(items: readonly T[], key: (item: T) => string) {
  const counts = new Map<string, number>([["All", items.length]]);
  for (const item of items) counts.set(key(item), (counts.get(key(item)) ?? 0) + 1);
  return counts;
}
