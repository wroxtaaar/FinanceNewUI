import {
  Transaction,
  SourceEvidence,
  UnrecognizedSms,
  OracleAccount,
  OracleLedgerSummary,
  SyncSettingsState,
  ReviewStatus,
} from '../types/finance';
import {
  INITIAL_TRANSACTIONS,
  INITIAL_EVIDENCE,
  INITIAL_UNRECOGNIZED_SMS,
  INITIAL_ORACLE_ACCOUNTS,
} from './mockData';

const KEYS = {
  TRANSACTIONS: 'finance_transactions_v1',
  CATEGORY_MEMORY: 'finance_category_memory_v1',
  EVIDENCE: 'finance_evidence_v1',
  UNRECOGNIZED_SMS: 'finance_unrecognized_sms_v1',
  ORACLE_ACCOUNTS: 'finance_oracle_accounts_v1',
  SPLITWISE_TOTAL: 'finance_splitwise_total_minor_v1',
  SYNC_SETTINGS: 'finance_sync_settings_v1',
  CLEARED_AT: 'finance_cleared_at_v1',
};

export const Storage = {
  getTransactions(): Transaction[] {
    try {
      const data = localStorage.getItem(KEYS.TRANSACTIONS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to read transactions', e);
    }
    this.saveTransactions(INITIAL_TRANSACTIONS);
    return INITIAL_TRANSACTIONS;
  },

  saveTransactions(transactions: Transaction[]): void {
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
  },

  addTransaction(tx: Omit<Transaction, 'id'>): Transaction {
    const list = this.getTransactions();
    const newId = list.length > 0 ? Math.max(...list.map((t) => t.id)) + 1 : 1;
    const newTx: Transaction = { ...tx, id: newId };
    const updated = [newTx, ...list];
    this.saveTransactions(updated);

    if (newTx.transactionType === 'DEBIT' && newTx.category !== 'OTHER') {
      const current = this.getSplitwiseTotal();
      this.updateSplitwiseTotal(current + newTx.amountPaise);
    }

    return newTx;
  },

  updateTransactionCategory(id: number, category: string): void {
    const list = this.getTransactions();
    const updated = list.map((t) => (t.id === id ? { ...t, category } : t));
    this.saveTransactions(updated);
  },

  voidTransaction(id: number): boolean {
    const list = this.getTransactions();
    let found = false;
    const updated = list.map((t) => {
      if (t.id === id) {
        found = true;
        return { ...t, isVoided: true };
      }
      return t;
    });
    if (found) {
      this.saveTransactions(updated);
    }
    return found;
  },

  getCategoryMemory(): Record<string, string> {
    try {
      const data = localStorage.getItem(KEYS.CATEGORY_MEMORY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    return {
      'VPA|swiggy@upi': 'FOOD',
      'VPA|zomato@upi': 'FOOD',
    };
  },

  saveCategoryMemory(key: string, category: string): void {
    const memory = this.getCategoryMemory();
    memory[key] = category;
    localStorage.setItem(KEYS.CATEGORY_MEMORY, JSON.stringify(memory));
  },

  updateCategoriesForMemoryKey(memoryKey: string, category: string, predicate: (t: Transaction) => boolean): Transaction[] {
    this.saveCategoryMemory(memoryKey, category);
    const list = this.getTransactions();
    const updated = list.map((t) => {
      if (predicate(t)) {
        return { ...t, category };
      }
      return t;
    });
    this.saveTransactions(updated);
    return updated;
  },

  getEvidence(): SourceEvidence[] {
    try {
      const data = localStorage.getItem(KEYS.EVIDENCE);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    this.saveEvidence(INITIAL_EVIDENCE);
    return INITIAL_EVIDENCE;
  },

  saveEvidence(evidence: SourceEvidence[]): void {
    localStorage.setItem(KEYS.EVIDENCE, JSON.stringify(evidence));
  },

  addEvidence(ev: Omit<SourceEvidence, 'id'>): SourceEvidence {
    const list = this.getEvidence();
    const newId = list.length > 0 ? Math.max(...list.map((e) => e.id)) + 1 : 100;
    const newEv: SourceEvidence = { ...ev, id: newId };
    this.saveEvidence([newEv, ...list]);
    return newEv;
  },

  resolveEvidence(evidenceId: number, transactionId: number): boolean {
    const list = this.getEvidence();
    let found = false;
    const updated = list.map((e) => {
      if (e.id === evidenceId) {
        found = true;
        return { ...e, transactionId, status: 'MATCHED' as const };
      }
      return e;
    });
    if (found) {
      this.saveEvidence(updated);
    }
    return found;
  },

  getUnrecognizedSms(): UnrecognizedSms[] {
    try {
      const data = localStorage.getItem(KEYS.UNRECOGNIZED_SMS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    this.saveUnrecognizedSms(INITIAL_UNRECOGNIZED_SMS);
    return INITIAL_UNRECOGNIZED_SMS;
  },

  saveUnrecognizedSms(items: UnrecognizedSms[]): void {
    localStorage.setItem(KEYS.UNRECOGNIZED_SMS, JSON.stringify(items));
  },

  addUnrecognizedSms(sms: Omit<UnrecognizedSms, 'id'>): UnrecognizedSms {
    const list = this.getUnrecognizedSms();
    const newId = list.length > 0 ? Math.max(...list.map((u) => u.id)) + 1 : 200;
    const item: UnrecognizedSms = { ...sms, id: newId };
    this.saveUnrecognizedSms([item, ...list]);
    return item;
  },

  updateUnrecognizedStatus(id: number, status: ReviewStatus): boolean {
    const list = this.getUnrecognizedSms();
    let found = false;
    const updated = list.map((u) => {
      if (u.id === id) {
        found = true;
        return { ...u, status };
      }
      return u;
    });
    if (found) {
      this.saveUnrecognizedSms(updated);
    }
    return found;
  },

  getOracleAccounts(): OracleAccount[] {
    try {
      const data = localStorage.getItem(KEYS.ORACLE_ACCOUNTS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    this.saveOracleAccounts(INITIAL_ORACLE_ACCOUNTS);
    return INITIAL_ORACLE_ACCOUNTS;
  },

  saveOracleAccounts(accounts: OracleAccount[]): void {
    localStorage.setItem(KEYS.ORACLE_ACCOUNTS, JSON.stringify(accounts));
  },

  updateAccountBalance(id: string, balanceMinor: number, billBalanceMinor?: number): void {
    const accounts = this.getOracleAccounts();
    const updated = accounts.map((acc) => {
      if (acc.id === id) {
        return {
          ...acc,
          balanceMinor,
          billBalanceMinor: billBalanceMinor !== undefined ? billBalanceMinor : acc.billBalanceMinor,
        };
      }
      return acc;
    });
    this.saveOracleAccounts(updated);
  },

  getSplitwiseTotal(): number {
    try {
      const data = localStorage.getItem(KEYS.SPLITWISE_TOTAL);
      if (data !== null) return parseInt(data, 10);
    } catch (e) {
      console.error(e);
    }
    return 842000;
  },

  updateSplitwiseTotal(minor: number): void {
    localStorage.setItem(KEYS.SPLITWISE_TOTAL, minor.toString());
  },

  getSyncSettings(): SyncSettingsState {
    try {
      const data = localStorage.getItem(KEYS.SYNC_SETTINGS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    return {
      baseUrl: '',
      token: '',
    };
  },

  saveSyncSettings(settings: SyncSettingsState): void {
    localStorage.setItem(KEYS.SYNC_SETTINGS, JSON.stringify(settings));
  },

  getLedgerSummary(): OracleLedgerSummary {
    const accounts = this.getOracleAccounts();
    const bankCash = accounts
      .filter((a) => a.accountType === 'BANK_ACCOUNT')
      .reduce((sum, a) => sum + a.balanceMinor, 0);

    const cardOutstanding = accounts
      .filter((a) => a.accountType === 'CREDIT_CARD')
      .reduce((sum, a) => sum + a.balanceMinor, 0);

    const splitwiseReceivable = this.getSplitwiseTotal();
    const trueAvailable = bankCash - cardOutstanding + splitwiseReceivable;

    return {
      currency: 'INR',
      bankCashMinor: bankCash,
      creditCardOutstandingMinor: cardOutstanding,
      splitwiseReceivableMinor: splitwiseReceivable,
      trueAvailableMinor: trueAvailable,
    };
  },

  clearLocalHistory(): { clearedCount: number } {
    const current = this.getTransactions();
    const activeCount = current.filter((t) => !t.isVoided).length;
    localStorage.setItem(KEYS.CLEARED_AT, Date.now().toString());
    this.saveTransactions([]);
    this.saveEvidence([]);
    this.saveUnrecognizedSms([]);
    return { clearedCount: activeCount };
  },
};
