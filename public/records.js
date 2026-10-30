export const MAX_RECEIPT_BYTES = 1024 * 1024;
export const RECEIPT_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

// Old backups and projects predate these sections. Preserve their existing data.
export function withNewSections(value) {
  return { ...value, receipts: value.receipts ?? [], sellerCodes: value.sellerCodes ?? [], paymentCorrections: value.paymentCorrections ?? [] };
}

export function validNewSections(value) {
  return Array.isArray(value.receipts) && value.receipts.every(r =>
    r && typeof r.id === 'string' && typeof r.title === 'string' && typeof r.filename === 'string' && typeof r.date === 'string' && typeof r.notes === 'string' &&
    RECEIPT_TYPES.includes(r.type) && Number.isInteger(r.size) && r.size > 0 && r.size <= MAX_RECEIPT_BYTES &&
    typeof r.data === 'string' && r.data.length <= Math.ceil(MAX_RECEIPT_BYTES / 3) * 4 && /^[A-Za-z0-9+/]*={0,2}$/.test(r.data) && validEncodedFile(r) &&
    typeof r.costId === 'string' && typeof r.paymentId === 'string' &&
    (!r.costId || value.costs.some(c => c.id === r.costId)) &&
    (!r.paymentId || value.payments.some(p => p.id === r.paymentId && p.costId === r.costId))
  ) && Array.isArray(value.paymentCorrections) && value.paymentCorrections.every(c =>
    c && typeof c.id === 'string' && typeof c.costId === 'string' && value.costs.some(cost => cost.id === c.costId) &&
    Number.isSafeInteger(c.amount) && c.amount !== 0 && typeof c.createdAt === 'string'
  ) && Array.isArray(value.sellerCodes) && value.sellerCodes.every(c =>
    c && typeof c.id === 'string' && typeof c.seller === 'string' && typeof c.code === 'string' &&
    typeof c.notes === 'string' && typeof c.contact === 'string' && Boolean(c.contact || c.code)
  );
}

function validEncodedFile(receipt) {
  try {
    const bytes = Uint8Array.from(atob(receipt.data), char => char.charCodeAt(0));
    return bytes.length === receipt.size && fileMatchesType(receipt.type, bytes);
  } catch { return false; }
}

export function fileMatchesType(type, bytes) {
  if (type === 'image/jpeg') return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === 'image/png') return bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((v, i) => bytes[i] === v);
  if (type === 'application/pdf') return bytes.length >= 5 && [0x25, 0x50, 0x44, 0x46, 0x2d].every((v, i) => bytes[i] === v);
  return false;
}
