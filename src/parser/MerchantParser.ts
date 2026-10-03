const INVALID_MERCHANT_PHRASES = new Set([
  'bank account',
  'your bank account',
  'my account',
  'account',
  'savings',
  'current',
  'self',
  'self account',
  'bank',
  'a/c',
  'ac',
  'your',
  'my',
  'the',
  'a',
  'an',
  'his',
  'her',
  'their',
  'atm',
  'branch',
  'https',
  'http',
]);

const TIME_PATTERN = /^[0-9]{1,2}:[0-9]{2}$/;
const DATE_PATTERN = /^[0-9]{1,2}-[a-zA-Z]{3}-[0-9]{2,4}$/;

function isValidMerchant(candidate: string): boolean {
  const trimmed = candidate.trim();
  const lower = trimmed.toLowerCase();
  if (INVALID_MERCHANT_PHRASES.has(lower)) {
    return false;
  }
  if (TIME_PATTERN.test(trimmed)) {
    return false;
  }
  if (DATE_PATTERN.test(trimmed)) {
    return false;
  }
  if (
    trimmed.toLowerCase().startsWith('http://') ||
    trimmed.toLowerCase().startsWith('https://') ||
    lower.includes('://') ||
    lower.includes('www.') ||
    lower.startsWith('https') ||
    lower.startsWith('http')
  ) {
    return false;
  }
  if (/^[\d\s]+$/.test(trimmed)) {
    return false;
  }
  return true;
}

export const MerchantParser = {
  extractMerchantAndVpa(messageBody: string): { merchant: string | null; vpa: string | null } {
    let merchant: string | null = null;
    let vpa: string | null = null;

    const upiPathMatcher = /UPI\/([^/]+)\/([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+)/i.exec(messageBody);
    if (upiPathMatcher) {
      merchant = upiPathMatcher[1]?.trim() || null;
      vpa = upiPathMatcher[2]?.trim() || null;
    } else {
      const multiUpiMatcher = /UPI\/P2A\/[^/]+\/([^/]+)\//i.exec(messageBody);
      if (multiUpiMatcher) {
        const candidate = multiUpiMatcher[1]?.trim();
        if (candidate && !/^\d+$/.test(candidate)) {
          merchant = candidate;
        }
      }
    }

    if (!vpa) {
      const vpaGlobalRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+)/gi;
      let match: RegExpExecArray | null;
      while ((match = vpaGlobalRegex.exec(messageBody)) !== null) {
        const candidate = match[1];
        if (!candidate) continue;
        const lower = candidate.toLowerCase();
        if (lower.endsWith('.com') || lower.endsWith('.org') || lower.endsWith('.net') || lower.endsWith('.in')) {
          if (!lower.includes('upi') && !lower.includes('paytm') && !lower.includes('oksbi') && !lower.includes('okaxis')) {
            continue;
          }
        }
        if (candidate.includes('@') && !candidate.startsWith('@') && !candidate.endsWith('@')) {
          vpa = candidate;
          break;
        }
      }
    }

    if (!merchant) {
      const axisMerchantMatcher =
        /(?:[0-9]{2}-[0-9]{2}-[0-9]{2}\s+[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\s+[A-Z]+)?)\s*\r?\n\s*([A-Z0-9\s._-]+?)\s*\r?\n\s*(?:Avl|Avbl|Available|Not\s+you)/i.exec(
          messageBody
        );
      if (axisMerchantMatcher) {
        const rawAxisMerchant = axisMerchantMatcher[1]?.trim();
        if (rawAxisMerchant && isValidMerchant(rawAxisMerchant)) {
          merchant = rawAxisMerchant;
        }
      }
    }

    if (!merchant) {
      const merchantMatcher =
        /(?:to|paid\s+to|sent\s+to|towards|at)\s+([a-zA-Z0-9\s._-]+?)(?:\s+(?:Ref|UPI|A\/C|a\/c|on|at|via|IMPS|NEFT|card|ending|\*|\d{2}-)|$)/i.exec(
          messageBody
        );
      if (merchantMatcher) {
        const rawMerchant = merchantMatcher[1]?.trim();
        if (
          rawMerchant &&
          rawMerchant.toLowerCase() !== 'upi' &&
          rawMerchant.toLowerCase() !== 'p2a' &&
          isValidMerchant(rawMerchant)
        ) {
          merchant = rawMerchant;
        }
      }
    }

    if (!merchant && !vpa) {
      const fallbackMatcher = /(?:to|paid\s+to|sent\s+to|at)\s+([a-zA-Z0-9._-]+)/i.exec(messageBody);
      if (fallbackMatcher) {
        const rawFallback = fallbackMatcher[1]?.trim();
        if (rawFallback && isValidMerchant(rawFallback)) {
          merchant = rawFallback;
        }
      }
    }

    return { merchant, vpa };
  },
};
