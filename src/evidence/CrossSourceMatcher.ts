import { Transaction, SourceEvidence } from '../types/finance';

export type MatchOutcome = 'MATCHED' | 'AMBIGUOUS' | 'UNMATCHED';

export interface MatchResult {
  outcome: MatchOutcome;
  matchedTransactionId: number | null;
  reasons: string[];
  confidence: number;
}

export function normalizeReference(ref: string | null | undefined): string | null {
  if (!ref || !ref.trim()) return null;
  const clean = ref.trim();
  const upiMatch = /UPI\/(?:P2A\/)?(?:[^/]+\/)?([0-9a-zA-Z]+)/i.exec(clean);
  if (upiMatch) {
    return upiMatch[1];
  }
  return clean;
}

function normalizeBank(bank: string | null | undefined): string | null {
  if (!bank || !bank.trim()) return null;
  const upper = bank.trim().toUpperCase();
  if (upper.includes('AXIS')) return 'AXIS';
  if (upper.includes('HDFC')) return 'HDFC';
  if (upper.includes('ICICI')) return 'ICICI';
  if (upper.includes('SBI')) return 'SBI';
  if (upper.includes('KOTAK')) return 'KOTAK';
  if (upper.includes('PAYTM')) return 'PAYTM';
  return upper.replace(' BANK', '').trim();
}

function isDirectionCompatible(evidenceDir: string, txDir: string): boolean {
  const normEv = evidenceDir.trim().toUpperCase();
  const normTx = txDir.trim().toUpperCase();
  if (normEv === 'UNKNOWN' || !normEv) return true;
  return normEv === normTx;
}

function isBankCompatible(evidenceBank: string | null, txBank: string | null): boolean {
  const normEv = normalizeBank(evidenceBank);
  const normTx = normalizeBank(txBank);
  if (!normEv || !normTx) return true;
  return normEv === normTx;
}

export const CrossSourceMatcher = {
  MAX_TIME_DIFF_MILLIS: 120_000,

  match(evidence: SourceEvidence, transactions: Transaction[]): MatchResult {
    if (evidence.amountPaise <= 0) {
      return {
        outcome: 'UNMATCHED',
        matchedTransactionId: null,
        reasons: ['Invalid or zero amount'],
        confidence: 0,
      };
    }

    const matchingCandidates: Array<{ tx: Transaction; reasons: string[] }> = [];

    for (const tx of transactions) {
      if (tx.isVoided) continue;
      const reasons: string[] = [];

      const txCurrency = tx.currency.trim().toUpperCase();
      const evCurrency = evidence.currency.trim().toUpperCase();
      if (txCurrency !== evCurrency) {
        continue;
      }
      reasons.push('currency equal');

      if (tx.amountPaise !== evidence.amountPaise) {
        continue;
      }
      reasons.push('amount equal');

      const txDirection = tx.transactionType === 'CREDIT' ? 'CREDIT' : 'DEBIT';
      if (!isDirectionCompatible(evidence.direction, txDirection)) {
        continue;
      }
      if (evidence.direction.trim().toUpperCase() !== 'UNKNOWN' && evidence.direction.trim()) {
        reasons.push('direction equal');
      } else {
        reasons.push('direction unknown (neutral)');
      }

      const evRef = normalizeReference(evidence.reference);
      const txRef = normalizeReference(tx.refNumber);
      if (evRef && txRef && evRef === txRef) {
        reasons.push('same reference');
      }

      if (!isBankCompatible(evidence.bankProvider, tx.bank)) {
        continue;
      }
      if (evidence.bankProvider) {
        reasons.push('same bank');
      } else {
        reasons.push('bank unknown (neutral)');
      }

      if (evidence.accountLastFour && tx.accountLastFour) {
        if (evidence.accountLastFour === tx.accountLastFour) {
          reasons.push('same account last four');
        }
      }

      const timeDiff = Math.abs(tx.timestamp - evidence.receivedAt);
      if (timeDiff <= this.MAX_TIME_DIFF_MILLIS) {
        reasons.push(`event time difference ${timeDiff / 1000} seconds`);
      } else {
        if (!reasons.includes('same reference')) {
          continue;
        }
      }

      matchingCandidates.push({ tx, reasons });
    }

    if (matchingCandidates.length === 0) {
      return {
        outcome: 'UNMATCHED',
        matchedTransactionId: null,
        reasons: ['no candidate found'],
        confidence: 0,
      };
    }

    if (matchingCandidates.length === 1) {
      const match = matchingCandidates[0];
      return {
        outcome: 'MATCHED',
        matchedTransactionId: match.tx.id,
        reasons: match.reasons,
        confidence: 0.95,
      };
    }

    const refMatches = matchingCandidates.filter((it) => it.reasons.includes('same reference'));
    if (refMatches.length === 1) {
      return {
        outcome: 'MATCHED',
        matchedTransactionId: refMatches[0].tx.id,
        reasons: refMatches[0].reasons,
        confidence: 0.98,
      };
    }

    return {
      outcome: 'AMBIGUOUS',
      matchedTransactionId: null,
      reasons: [`multiple plausible candidates found (${matchingCandidates.length})`],
      confidence: 0.5,
    };
  },
};
