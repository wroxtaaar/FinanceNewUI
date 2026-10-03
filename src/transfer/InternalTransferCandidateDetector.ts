import { Transaction, InternalTransferCandidate } from '../types/finance';

export const InternalTransferCandidateDetector = {
  DEFAULT_WINDOW_MILLIS: 10 * 60 * 1000,

  findCandidates(
    transactions: Transaction[],
    windowMillis: number = 10 * 60 * 1000
  ): InternalTransferCandidate[] {
    const active = transactions.filter((t) => !t.isVoided);

    const debits = active.filter(
      (it) => it.accountType === 'BANK_ACCOUNT' && it.transactionType === 'DEBIT'
    );

    const credits = active.filter(
      (it) => it.accountType === 'BANK_ACCOUNT' && it.transactionType === 'CREDIT'
    );

    const candidates: InternalTransferCandidate[] = [];

    for (const debit of debits) {
      for (const credit of credits) {
        if (credit.id === debit.id) continue;
        if (credit.currency.toUpperCase() !== debit.currency.toUpperCase()) continue;
        if (credit.amountPaise !== debit.amountPaise) continue;

        const timeDiff = Math.abs(credit.timestamp - debit.timestamp);
        if (timeDiff > windowMillis) continue;

        if (this.sameAccount(debit, credit)) continue;

        candidates.push({
          debit,
          credit,
          timeDifferenceMillis: timeDiff,
        });
      }
    }

    candidates.sort((a, b) => {
      if (a.timeDifferenceMillis !== b.timeDifferenceMillis) {
        return a.timeDifferenceMillis - b.timeDifferenceMillis;
      }
      return a.debit.timestamp - b.debit.timestamp;
    });

    return candidates;
  },

  sameAccount(a: Transaction, b: Transaction): boolean {
    const sameBank =
      !!a.bank && !!b.bank && a.bank.trim().toLowerCase() === b.bank.trim().toLowerCase();
    const sameLastFour =
      !!a.accountLastFour && !!b.accountLastFour && a.accountLastFour === b.accountLastFour;
    return sameBank && sameLastFour;
  },
};
