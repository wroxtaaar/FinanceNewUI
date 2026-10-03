export type SenderTrustStatus = 'TRUSTED' | 'UNTRUSTED' | 'UNKNOWN';

const BANK_CODES = new Set([
  'hdfcbk', 'hdfcbn', 'sbiinb', 'sbiupi', 'sbibnk', 'sbicrd', 'atmsbi',
  'icicib', 'icicit', 'axisbk', 'axisbn', 'kotakb', 'kotak',
  'pnbsms', 'pnbbnk', 'bobtxn', 'bobibn', 'canbnk', 'cbssbi',
  'unionb', 'ubinet', 'idfcfb', 'yesbnk', 'indusb', 'aubank',
  'rblbnk', 'fedbnk', 'citibk', 'hsbcin', 'scbank', 'idbibk',
  'bankin', 'cbinbk', 'iobchn', 'ucobnk', 'psbbnk', 'dcbbnk',
  'equtas', 'esafbk', 'jkbank', 'karbnk', 'kvbank', 'tmbank',
  'amexin', 'onecrd', 'slcebk',
]);

const PSP_CODES = new Set([
  'paytmb', 'paytm', 'phonpe', 'phnpay', 'gpayin', 'bhimup', 'npcibh',
  'amzonp', 'amazon', 'mobikw', 'freechg', 'cred', 'slice', 'jupitr',
  'fisdom', 'razrpy', 'cashfr',
]);

const PERSONAL_NUMBER = /^(?:\+?91|0)?[6-9]\d{9}$/;
const NON_ALNUM = /[^a-z0-9]/g;

const REJECT_OTP = /\botp\b|one[\s-]?time[\s-]?password|verification code|\bcvv\b/i;

const REJECT_PROMO =
  /pre[\s-]?approved|apply now|click here|hurry|limited period|offer ends|t&c apply|download the app|you have won|congratulations|lowest interest|upgrade your|refer and earn|reward points|cashback offer|special offer|limited period offer|annual fee waiver|annual fee.{0,40}\bspends?\b|\bspends?\s+(?:of|rs\.?|inr|₹)|\b(?:get|earn|save)\b.{0,40}\b(?:cashback|reward|bonus|points)\b/i;

const REJECT_NOT_COMPLETED =
  /will be (?:debited|deducted|credited|charged|transferred|reversed|refunded|blocked|processed)|is due|due on|due date|(?:collect|payment|money) request|has requested|requesting|(?:failed|declined|unsuccessful|not processed|could not be processed)|\bnot (?:debited|credited|deducted|charged)\b|\brejection\b|to (?:authorise|authorize|approve)|\bscheduled\b|\bpending\b/i;

const REJECT_INFO_ONLY =
  /mini statement|statement is ready|statement has been generated|e-statement|available balance|available limit|credit limit/i;

export const SenderTrustManager = {
  normalizeSender(sender: string): string {
    return sender.trim().toLowerCase().replace(NON_ALNUM, '');
  },

  classifySender(sender: string): SenderTrustStatus {
    const raw = sender.trim();
    if (!raw || raw.toLowerCase() === 'unknown') {
      return 'UNKNOWN';
    }

    const compact = this.normalizeSender(raw);
    if (PERSONAL_NUMBER.test(compact)) {
      return 'UNTRUSTED';
    }

    const segments = raw
      .toLowerCase()
      .split(/[-_.]/)
      .map((it) => it.replace(NON_ALNUM, ''))
      .filter((it) => it.length > 0);

    const candidates = [...segments, compact];

    if (
      candidates.some((candidate) =>
        BANK_CODES.has(candidate) || Array.from(BANK_CODES).some((b) => candidate.includes(b))
      )
    ) {
      return 'TRUSTED';
    }

    if (
      candidates.some((candidate) =>
        PSP_CODES.has(candidate) || Array.from(PSP_CODES).some((p) => candidate.includes(p))
      )
    ) {
      return 'TRUSTED';
    }

    const upper = raw.toUpperCase();
    if (
      ['HDFC', 'AXIS', 'ICICI', 'SBI', 'KOTAK', 'PAYTM', 'PHONEPE', 'HDFCBK', 'AXISBK', 'ICICIB', 'SBICARD'].some(
        (it) => upper.includes(it)
      )
    ) {
      return 'TRUSTED';
    }

    if (/^[A-Z]{2}-[A-Z0-9]+(?:-[A-Z0-9]+)?$/.test(upper)) {
      return 'UNKNOWN';
    }

    return 'UNTRUSTED';
  },

  isNonTransactionalFinancialMessage(messageBody: string): boolean {
    if (!messageBody.trim()) return true;

    if (
      REJECT_OTP.test(messageBody) ||
      REJECT_PROMO.test(messageBody) ||
      REJECT_NOT_COMPLETED.test(messageBody)
    ) {
      return true;
    }

    if (REJECT_INFO_ONLY.test(messageBody)) {
      const lower = messageBody.toLowerCase();
      const hasTransactionEvent =
        lower.includes('debited') ||
        lower.includes('credited') ||
        lower.includes('spent') ||
        lower.includes('paid') ||
        lower.includes('received') ||
        lower.includes('transferred') ||
        lower.includes('withdrawn') ||
        lower.includes('purchase') ||
        lower.includes('charged') ||
        lower.includes('deducted');

      if (!hasTransactionEvent) return true;
    }

    return false;
  },

  isFinancialLooking(messageBody: string): boolean {
    if (this.isNonTransactionalFinancialMessage(messageBody)) return false;

    const lower = messageBody.toLowerCase();
    const hasTransactionKeyword =
      lower.includes('debited') ||
      lower.includes('credited') ||
      lower.includes('spent') ||
      lower.includes('paid') ||
      lower.includes('received') ||
      lower.includes('transfer') ||
      lower.includes('transferred') ||
      lower.includes('withdrawn') ||
      lower.includes('purchase') ||
      lower.includes('payment') ||
      lower.includes('a/c') ||
      lower.includes('account') ||
      lower.includes('card');

    const hasAmount = /(?:inr|rs\.?|₹|sgd|usd|eur|gbp)\s*[0-9]/i.test(lower);

    return hasTransactionKeyword && hasAmount;
  },
};
