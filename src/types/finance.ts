export type TransactionType = 'DEBIT' | 'CREDIT' | 'UNKNOWN';

export type PaymentMethod =
  | 'UPI'
  | 'CARD'
  | 'ATM'
  | 'NEFT'
  | 'IMPS'
  | 'RTGS'
  | 'BANK_TRANSFER'
  | 'UNKNOWN';

export type AccountType = 'BANK_ACCOUNT' | 'CREDIT_CARD' | 'UNKNOWN';

export type PayeeIdentifierType = 'UPI_VPA' | 'PAYEE_NAME' | 'NONE';

export interface Transaction {
  id: number;
  amountPaise: number;
  currency: string;
  transactionType: TransactionType;
  paymentMethod: PaymentMethod;
  accountType: AccountType;
  bank: string | null;
  merchantName: string | null;
  payeeId: string | null;
  accountLastFour: string | null;
  refNumber: string | null;
  timestamp: number;
  smsHash: string;
  category: string;
  parserConfidence: number;
  isVoided?: boolean;
}

export interface ParserResult {
  isTransaction: boolean;
  amountPaise: number;
  currency: string;
  transactionType: TransactionType;
  paymentMethod: PaymentMethod;
  accountType: AccountType;
  bank: string | null;
  merchantName: string | null;
  payeeId: string | null;
  accountLastFour: string | null;
  refNumber: string | null;
  confidence: number;
}

export type SourceType = 'SMS' | 'GMAIL_NOTIFICATION' | 'APP_NOTIFICATION';
export type EvidenceStatus = 'UNMATCHED' | 'MATCHED' | 'AMBIGUOUS';

export interface SourceEvidence {
  id: number;
  sourceType: SourceType;
  sourceKey: string;
  receivedAt: number;
  transactionId: number | null;
  amountPaise: number;
  currency: string;
  direction: string;
  bankProvider: string | null;
  accountLastFour: string | null;
  reference: string | null;
  contentHash: string;
  confidence: number;
  status: EvidenceStatus;
}

export type ReviewStatus = 'PENDING' | 'RESOLVED' | 'DISMISSED';

export interface UnrecognizedSms {
  id: number;
  sender: string;
  bodySnippet: string;
  receivedAt: number;
  contentHash: string;
  status: ReviewStatus;
}

export interface TransactionConflict {
  first: Transaction;
  second: Transaction;
  reason: string;
}

export interface InternalTransferCandidate {
  debit: Transaction;
  credit: Transaction;
  timeDifferenceMillis: number;
}

export interface OracleAccount {
  id: string;
  name: string;
  currency: string;
  accountType: string;
  bank: string | null;
  last4: string | null;
  openingBalanceMinor: number;
  balanceMinor: number;
  billBalanceMinor: number;
}

export interface OracleLedgerSummary {
  currency: string;
  bankCashMinor: number;
  splitwiseReceivableMinor: number;
  creditCardOutstandingMinor: number;
  trueAvailableMinor: number;
}

export interface SyncSettingsState {
  baseUrl: string;
  token: string;
  group1Minor?: number;
  group2Minor?: number;
  group3Minor?: number;
}

export interface GmailSyncResult {
  messagesScanned: number;
  alreadyProcessed: number;
  parsedTransactions: number;
  axisCredits: number;
  duplicateTransactions: number;
  reviewCount: number;
  ignoredCount: number;
  createdEvidence: number;
  repairedTransactions: number;
}
