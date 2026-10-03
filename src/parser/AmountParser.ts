export const AmountParser = {
  patterns: [
    /(?:Rs\.?|INR|₹|SGD|USD|EUR|GBP|AUD|CAD)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i,
    /([0-9][0-9,]*(?:\.[0-9]{1,2})?)\s*(?:INR|SGD|USD|EUR|GBP|AUD|CAD|\/-)/i,
  ],

  parseCurrency(text: string): string {
    const upper = text.toUpperCase();
    if (upper.includes('SGD')) return 'SGD';
    if (upper.includes('USD')) return 'USD';
    if (upper.includes('EUR')) return 'EUR';
    if (upper.includes('GBP')) return 'GBP';
    if (upper.includes('AUD')) return 'AUD';
    if (upper.includes('CAD')) return 'CAD';
    return 'INR';
  },

  parseAmountToPaise(text: string): number | null {
    for (const pattern of this.patterns) {
      const globalRegex = new RegExp(pattern.source, 'gi');
      let match: RegExpExecArray | null;
      while ((match = globalRegex.exec(text)) !== null) {
        const start = match.index;
        const raw = match[1];
        if (!raw) continue;

        const prefix = text.substring(Math.max(0, start - 35), start).toLowerCase();
        if (
          prefix.includes('avl limit') ||
          prefix.includes('available limit') ||
          prefix.includes('avbl bal') ||
          prefix.includes('avl bal') ||
          prefix.includes('available balance') ||
          prefix.includes('balance') ||
          prefix.includes('limit') ||
          prefix.includes('bal')
        ) {
          continue;
        }

        const cleaned = raw.replace(/,/g, '');
        const d = parseFloat(cleaned);
        if (!isNaN(d)) {
          return Math.round(d * 100);
        }
      }
    }

    const keywordPattern =
      /(?:debited|credited|deducted|charged|sent|received|added|paid|spent|sum|amt[:\s]*)[^0-9]*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/gi;
    let kwMatch: RegExpExecArray | null;
    while ((kwMatch = keywordPattern.exec(text)) !== null) {
      const start = kwMatch.index;
      const raw = kwMatch[1];
      if (!raw) continue;

      const fullMatch = kwMatch[0];
      const offset = fullMatch.indexOf(raw);
      const gap = text.substring(start, start + (offset >= 0 ? offset : fullMatch.length)).toLowerCase();

      if (
        gap.includes('a/c') ||
        gap.includes('account') ||
        gap.includes('acct') ||
        gap.includes('card') ||
        gap.includes('ref') ||
        gap.includes('utr') ||
        gap.includes('xx') ||
        gap.includes('****')
      ) {
        continue;
      }

      const prefix = text.substring(Math.max(0, start - 35), start).toLowerCase();
      if (
        prefix.includes('avl limit') ||
        prefix.includes('available limit') ||
        prefix.includes('avbl bal') ||
        prefix.includes('avl bal') ||
        prefix.includes('available balance') ||
        prefix.includes('balance') ||
        prefix.includes('limit') ||
        prefix.includes('bal')
      ) {
        continue;
      }

      const cleaned = raw.replace(/,/g, '');
      const d = parseFloat(cleaned);
      if (!isNaN(d)) {
        return Math.round(d * 100);
      }
    }

    return null;
  },
};
