const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });

// Empty values stay at the end in both directions. Ties retain their original order.
export function sortRows(rows, getValue, direction = 'asc') {
  const sign = direction === 'desc' ? -1 : 1;
  return rows.map((row, index) => ({ row, index, value: getValue(row) })).sort((a, b) => {
    const aEmpty = a.value === null || a.value === undefined || a.value === '';
    const bEmpty = b.value === null || b.value === undefined || b.value === '';
    if (aEmpty || bEmpty) return aEmpty === bEmpty ? a.index - b.index : (aEmpty ? 1 : -1);
    const comparison = typeof a.value === 'number' && typeof b.value === 'number'
      ? a.value - b.value : collator.compare(String(a.value), String(b.value));
    return sign * comparison || a.index - b.index;
  }).map(entry => entry.row);
}
