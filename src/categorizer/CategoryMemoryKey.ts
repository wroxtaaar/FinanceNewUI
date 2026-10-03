import { ParserResult } from '../types/finance';

export const CategoryMemoryKey = {
  from(parserResult: Partial<ParserResult>): string | null {
    const payeeId = parserResult.payeeId?.trim().toLowerCase();

    if (payeeId) {
      return `VPA|${payeeId}`;
    }

    const bank = parserResult.bank?.trim().toLowerCase();
    const lastFour = parserResult.accountLastFour?.trim();

    if (!bank || !lastFour) {
      return null;
    }

    let accountType = '';
    if (parserResult.accountType === 'CREDIT_CARD') {
      accountType = 'CREDIT_CARD';
    } else if (parserResult.accountType === 'BANK_ACCOUNT') {
      accountType = 'BANK_ACCOUNT';
    } else {
      return null;
    }

    return `BANK|${bank}|${accountType}|${lastFour}`;
  },
};
