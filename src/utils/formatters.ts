export function formatPaise(paise: number, showSign: boolean = false, type?: string): string {
  const rupees = paise / 100;
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);

  if (showSign) {
    if (type === 'CREDIT') {
      return `+${formatted}`;
    } else if (type === 'DEBIT') {
      return `-${formatted}`;
    }
  }

  return formatted;
}

export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}
