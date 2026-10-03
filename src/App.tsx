import React, { useState, useEffect } from 'react';
import {
  Transaction,
  SourceEvidence,
  UnrecognizedSms,
  OracleAccount,
  OracleLedgerSummary,
  PaymentMethod,
  AccountType,
  TransactionType,
} from './types/finance';
import { Storage } from './data/storage';
import { OracleClient } from './integration/oracleClient';
import { Header } from './components/Header';
import { TransactionList } from './components/TransactionList';
import { TransactionDetailModal } from './components/TransactionDetailModal';
import { SmsSimulatorModal } from './components/SmsSimulatorModal';
import { ReviewModal } from './components/ReviewModal';
import { AccountsModal } from './components/AccountsModal';
import { OracleSettingsModal } from './components/OracleSettingsModal';

export const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [evidenceList, setEvidenceList] = useState<SourceEvidence[]>([]);
  const [unrecognizedSmsList, setUnrecognizedSmsList] = useState<UnrecognizedSms[]>([]);
  const [oracleAccounts, setOracleAccounts] = useState<OracleAccount[]>([]);
  const [splitwiseTotal, setSplitwiseTotal] = useState<number>(0);
  const [summary, setSummary] = useState<OracleLedgerSummary>({
    currency: 'INR',
    bankCashMinor: 0,
    creditCardOutstandingMinor: 0,
    splitwiseReceivableMinor: 0,
    trueAvailableMinor: 0,
  });

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [isReviewOpen, setIsReviewOpen] = useState<boolean>(false);
  const [accountsMode, setAccountsMode] = useState<
    'view' | 'edit_banks' | 'edit_cards' | 'edit_splitwise' | null
  >(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  const loadAllData = async () => {
    const txs = Storage.getTransactions();
    const evs = Storage.getEvidence();
    const unrec = Storage.getUnrecognizedSms();
    const accounts = await OracleClient.fetchAccounts();
    const splitwise = await OracleClient.fetchManualSplitwiseTotal();
    const sum = await OracleClient.fetchSummary();

    setTransactions(txs);
    setEvidenceList(evs);
    setUnrecognizedSmsList(unrec);
    setOracleAccounts(accounts);
    setSplitwiseTotal(splitwise);
    setSummary(sum);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleSaveCategory = (
    id: number,
    category: string,
    remember: boolean,
    memoryKey: string | null
  ) => {
    if (remember && memoryKey) {
      const updated = Storage.updateCategoriesForMemoryKey(
        memoryKey,
        category,
        (t) => {
          if (memoryKey.startsWith('VPA|') && t.payeeId) {
            return `VPA|${t.payeeId.toLowerCase()}` === memoryKey;
          }
          if (memoryKey.startsWith('BANK|') && t.bank && t.accountLastFour) {
            return (
              `BANK|${t.bank.toLowerCase()}|${t.accountType}|${t.accountLastFour}` === memoryKey
            );
          }
          return t.id === id;
        }
      );
      setTransactions(updated);
    } else {
      Storage.updateTransactionCategory(id, category);
      setTransactions(Storage.getTransactions());
    }
    loadAllData();
  };

  const handleVoidTransaction = (id: number) => {
    Storage.voidTransaction(id);
    loadAllData();
  };

  const handleResolveEvidence = (evidenceId: number, transactionId: number) => {
    Storage.resolveEvidence(evidenceId, transactionId);
    setEvidenceList(Storage.getEvidence());
  };

  const handleDismissUnrecognized = (id: number) => {
    Storage.updateUnrecognizedStatus(id, 'DISMISSED');
    setUnrecognizedSmsList(Storage.getUnrecognizedSms());
  };

  const handleCreateManualTransaction = (
    unrecognized: UnrecognizedSms,
    txData: {
      amountPaise: number;
      transactionType: TransactionType;
      paymentMethod: PaymentMethod;
      accountType: AccountType;
      bank: string;
      merchantName: string;
      accountLastFour: string;
      refNumber: string;
      category: string;
    }
  ) => {
    const hash = `manual:${Date.now()}`;
    Storage.addTransaction({
      amountPaise: txData.amountPaise,
      currency: 'INR',
      transactionType: txData.transactionType,
      paymentMethod: txData.paymentMethod,
      accountType: txData.accountType,
      bank: txData.bank,
      merchantName: txData.merchantName,
      payeeId: null,
      accountLastFour: txData.accountLastFour,
      refNumber: txData.refNumber,
      timestamp: Date.now(),
      smsHash: hash,
      category: txData.category,
      parserConfidence: 1.0,
    });

    Storage.updateUnrecognizedStatus(unrecognized.id, 'RESOLVED');
    loadAllData();
  };

  const handleUpdateAccountBalance = async (
    account: OracleAccount,
    balanceMinor: number,
    billBalanceMinor?: number
  ) => {
    await OracleClient.updateAccountBalance(account, balanceMinor, billBalanceMinor);
    loadAllData();
  };

  const handleUpdateSplitwise = async (newTotalMinor: number) => {
    await OracleClient.updateManualSplitwiseTotal(newTotalMinor);
    loadAllData();
  };

  const handleClearLocalHistory = () => {
    const { clearedCount } = Storage.clearLocalHistory();
    setShowClearConfirm(false);
    loadAllData();
    alert(`Cleared ${clearedCount} transactions and local review evidence.`);
  };

  const reviewCount =
    evidenceList.filter((e) => e.status !== 'MATCHED').length +
    unrecognizedSmsList.filter((s) => s.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header
        summary={summary}
        reviewCount={reviewCount}
        onRefresh={loadAllData}
        onOpenSmsSimulator={() => setIsSimulatorOpen(true)}
        onOpenReview={() => setIsReviewOpen(true)}
        onOpenAccounts={(mode) => setAccountsMode(mode)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onClearHistory={() => setShowClearConfirm(true)}
      />

      <main className="flex-1 pb-16">
        <TransactionList
          transactions={transactions}
          onSelectTransaction={(tx) => setSelectedTx(tx)}
          onOpenSimulator={() => setIsSimulatorOpen(true)}
        />
      </main>

      <TransactionDetailModal
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
        onSaveCategory={handleSaveCategory}
        onVoid={handleVoidTransaction}
      />

      <SmsSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onTransactionCreated={() => {
          loadAllData();
        }}
      />

      <ReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        evidenceList={evidenceList}
        unrecognizedSmsList={unrecognizedSmsList}
        transactions={transactions}
        onResolveEvidence={handleResolveEvidence}
        onDismissUnrecognized={handleDismissUnrecognized}
        onCreateManualTransaction={handleCreateManualTransaction}
        onVoidTransaction={handleVoidTransaction}
      />

      <AccountsModal
        mode={accountsMode || 'view'}
        isOpen={accountsMode !== null}
        onClose={() => setAccountsMode(null)}
        accounts={oracleAccounts}
        splitwiseTotal={splitwiseTotal}
        onUpdateAccountBalance={handleUpdateAccountBalance}
        onUpdateSplitwise={handleUpdateSplitwise}
      />

      <OracleSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaved={loadAllData}
      />

      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Clear Local History?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              This removes local transactions, evidence, and unrecognized SMS records from this device.
              Oracle ledger account settings, Gmail processing history, and category memories are preserved.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleClearLocalHistory}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
