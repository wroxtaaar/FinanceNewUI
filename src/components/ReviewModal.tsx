import React, { useState } from 'react';
import {
  SourceEvidence,
  UnrecognizedSms,
  TransactionConflict,
  Transaction,
  PaymentMethod,
  AccountType,
  TransactionType,
} from '../types/finance';
import { CrossSourceMatcher } from '../evidence/CrossSourceMatcher';
import { InternalTransferCandidateDetector } from '../transfer/InternalTransferCandidateDetector';
import { formatPaise, formatDateTime } from '../utils/formatters';
import { ALL_CATEGORIES } from '../categorizer/TransactionCategorizer';
import {
  X,
  FileCheck2,
  AlertCircle,
  CheckCircle,
  ArrowRightLeft,
  Plus,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  evidenceList: SourceEvidence[];
  unrecognizedSmsList: UnrecognizedSms[];
  transactions: Transaction[];
  onResolveEvidence: (evidenceId: number, transactionId: number) => void;
  onDismissUnrecognized: (id: number) => void;
  onCreateManualTransaction: (
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
  ) => void;
  onVoidTransaction: (id: number) => void;
}

export const ReviewModal: React.FC<Props> = ({
  isOpen,
  onClose,
  evidenceList,
  unrecognizedSmsList,
  transactions,
  onResolveEvidence,
  onDismissUnrecognized,
  onCreateManualTransaction,
  onVoidTransaction,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'evidence' | 'unrecognized' | 'conflicts' | 'transfers'>(
    'evidence'
  );

  const unresolvedEvidence = evidenceList.filter((e) => e.status !== 'MATCHED');
  const unresolvedSms = unrecognizedSmsList.filter((s) => s.status === 'PENDING');

  const conflicts: TransactionConflict[] = [];
  const activeTx = transactions.filter((t) => !t.isVoided);
  for (let i = 0; i < activeTx.length; i++) {
    for (let j = i + 1; j < activeTx.length; j++) {
      const a = activeTx[i];
      const b = activeTx[j];
      if (
        a.amountPaise === b.amountPaise &&
        a.transactionType === b.transactionType &&
        Math.abs(a.timestamp - b.timestamp) <= 120_000 &&
        (a.bank !== b.bank || a.accountLastFour !== b.accountLastFour)
      ) {
        conflicts.push({
          first: a,
          second: b,
          reason: 'Same amount, type, and approximate time, but different bank or account details.',
        });
      }
    }
  }

  const internalTransfers = InternalTransferCandidateDetector.findCandidates(transactions);

  const [selectedUnrecognized, setSelectedUnrecognized] = useState<UnrecognizedSms | null>(null);
  const [manualForm, setManualForm] = useState({
    amount: '',
    direction: 'DEBIT' as TransactionType,
    accountType: 'BANK_ACCOUNT' as AccountType,
    paymentMethod: 'UPI' as PaymentMethod,
    bank: '',
    lastFour: '',
    merchant: '',
    reference: '',
    category: 'GROCERIES',
  });

  const handleOpenCreateModal = (item: UnrecognizedSms) => {
    let inferBank = '';
    const upper = item.sender.toUpperCase();
    if (upper.includes('HDFC')) inferBank = 'HDFC';
    else if (upper.includes('AXIS')) inferBank = 'AXIS';
    else if (upper.includes('ICICI')) inferBank = 'ICICI';
    else if (upper.includes('SBI')) inferBank = 'SBI';
    else if (upper.includes('KOTAK')) inferBank = 'KOTAK';

    setSelectedUnrecognized(item);
    setManualForm({
      amount: '',
      direction: 'DEBIT',
      accountType: 'BANK_ACCOUNT',
      paymentMethod: 'UPI',
      bank: inferBank,
      lastFour: '',
      merchant: '',
      reference: '',
      category: 'GROCERIES',
    });
  };

  const handleSaveManualTransaction = () => {
    if (!selectedUnrecognized) return;
    const amountVal = parseFloat(manualForm.amount.replace(/,/g, ''));
    if (isNaN(amountVal) || amountVal <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    if (!manualForm.bank.trim()) {
      alert('Please enter a bank name.');
      return;
    }

    onCreateManualTransaction(selectedUnrecognized, {
      amountPaise: Math.round(amountVal * 100),
      transactionType: manualForm.direction,
      accountType: manualForm.accountType,
      paymentMethod: manualForm.paymentMethod,
      bank: manualForm.bank.trim(),
      merchantName: manualForm.merchant.trim(),
      accountLastFour: manualForm.lastFour.trim(),
      refNumber: manualForm.reference.trim(),
      category: manualForm.category,
    });

    setSelectedUnrecognized(null);
  };

  const handleMatchEvidence = (evidence: SourceEvidence) => {
    const matchResult = CrossSourceMatcher.match(evidence, transactions);
    if (matchResult.outcome === 'MATCHED' && matchResult.matchedTransactionId) {
      onResolveEvidence(evidence.id, matchResult.matchedTransactionId);
      alert(`Evidence auto-matched to Transaction #${matchResult.matchedTransactionId}!`);
    } else {
      const candidates = transactions.filter((t) => !t.isVoided && t.amountPaise === evidence.amountPaise);
      if (candidates.length === 0) {
        alert('No local transaction found matching this evidence by amount and time.');
      } else {
        const choice = candidates[0];
        onResolveEvidence(evidence.id, choice.id);
        alert(`Matched to ${choice.merchantName || choice.payeeId || 'Transaction'} (#${choice.id})`);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Review & Reconcile</h2>
              <p className="text-xs text-slate-500">
                Resolve notifications, unrecognized SMS, transaction conflicts, and transfers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-slate-200 px-6 gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('evidence')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'evidence'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Unresolved Evidence ({unresolvedEvidence.length})
          </button>
          <button
            onClick={() => setActiveTab('unrecognized')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'unrecognized'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Unrecognized SMS ({unresolvedSms.length})
          </button>
          <button
            onClick={() => setActiveTab('conflicts')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'conflicts'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Conflicts ({conflicts.length})
          </button>
          <button
            onClick={() => setActiveTab('transfers')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'transfers'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Internal Transfers ({internalTransfers.length})
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'evidence' && (
            <div className="space-y-3">
              {unresolvedEvidence.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                  <p className="text-sm font-medium text-slate-600">No unresolved evidence</p>
                  <p className="text-xs">All notifications and SMS evidence are reconciled.</p>
                </div>
              ) : (
                unresolvedEvidence.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {formatPaise(ev.amountPaise, true, ev.direction)}
                        </span>
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                          {ev.sourceType.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-500">
                          {ev.bankProvider || 'Bank'} {ev.accountLastFour ? `•••• ${ev.accountLastFour}` : ''}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Received: {formatDateTime(ev.receivedAt)}
                        {ev.reference && ` • Ref: ${ev.reference}`}
                      </p>
                    </div>

                    <button
                      onClick={() => handleMatchEvidence(ev)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0"
                    >
                      Match with Transaction
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'unrecognized' && (
            <div className="space-y-3">
              {unresolvedSms.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                  <p className="text-sm font-medium text-slate-600">No unrecognized SMS</p>
                  <p className="text-xs">No pending messages requiring manual transaction creation.</p>
                </div>
              ) : (
                unresolvedSms.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 font-mono">
                        From: {item.sender}
                      </span>
                      <span className="text-slate-400">{formatDateTime(item.receivedAt)}</span>
                    </div>

                    <p className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 font-mono">
                      {item.bodySnippet}
                    </p>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => onDismissUnrecognized(item.id)}
                        className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => handleOpenCreateModal(item)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" /> Create Transaction
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'conflicts' && (
            <div className="space-y-3">
              {conflicts.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                  <p className="text-sm font-medium text-slate-600">No transaction conflicts</p>
                  <p className="text-xs">All duplicate payments and account mismatches are clear.</p>
                </div>
              ) : (
                conflicts.map((c, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-3"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                      <AlertCircle className="w-4 h-4 text-amber-600" /> Potential Payment Mismatch
                    </div>
                    <p className="text-xs text-slate-700">{c.reason}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                        <span className="font-semibold text-slate-900 block">Record 1</span>
                        <div className="text-slate-800 font-medium">
                          {formatPaise(c.first.amountPaise, true, c.first.transactionType)} • {c.first.bank} (••••{c.first.accountLastFour || '????'})
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          {c.first.merchantName || 'No merchant'} • Ref: {c.first.refNumber || 'None'}
                        </div>
                        <button
                          onClick={() => onVoidTransaction(c.second.id)}
                          className="mt-2 w-full py-1 text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold rounded-md transition-colors"
                        >
                          Keep Record 1 (Void 2)
                        </button>
                      </div>

                      <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                        <span className="font-semibold text-slate-900 block">Record 2</span>
                        <div className="text-slate-800 font-medium">
                          {formatPaise(c.second.amountPaise, true, c.second.transactionType)} • {c.second.bank} (••••{c.second.accountLastFour || '????'})
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          {c.second.merchantName || 'No merchant'} • Ref: {c.second.refNumber || 'None'}
                        </div>
                        <button
                          onClick={() => onVoidTransaction(c.first.id)}
                          className="mt-2 w-full py-1 text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold rounded-md transition-colors"
                        >
                          Keep Record 2 (Void 1)
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'transfers' && (
            <div className="space-y-3">
              {internalTransfers.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <ArrowRightLeft className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-medium text-slate-600">No transfer candidate pairs</p>
                  <p className="text-xs">
                    Internal transfer detector flags debit & credit pairs matching within a 10-minute window.
                  </p>
                </div>
              ) : (
                internalTransfers.map((pair, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                        <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
                        Transfer: {formatPaise(pair.debit.amountPaise)}
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        From {pair.debit.bank} (••••{pair.debit.accountLastFour}) ➔ To {pair.credit.bank} (••••{pair.credit.accountLastFour})
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Time difference: {(pair.timeDifferenceMillis / 1000).toFixed(0)} seconds
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                      Matched Transfer
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {selectedUnrecognized && (
          <div className="absolute inset-0 z-50 bg-white p-6 overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-semibold text-sm text-slate-900">Create Transaction from SMS</h3>
              <button
                onClick={() => setSelectedUnrecognized(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 flex-1 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg text-slate-600 font-mono text-[11px]">
                {selectedUnrecognized.bodySnippet}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={manualForm.amount}
                    onChange={(e) => setManualForm({ ...manualForm, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-sm text-slate-900"
                    placeholder="e.g. 1499.00"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Direction</label>
                  <select
                    value={manualForm.direction}
                    onChange={(e) =>
                      setManualForm({
                        ...manualForm,
                        direction: e.target.value as TransactionType,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
                  >
                    <option value="DEBIT">DEBIT</option>
                    <option value="CREDIT">CREDIT</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={manualForm.bank}
                    onChange={(e) => setManualForm({ ...manualForm, bank: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
                    placeholder="e.g. KOTAK, HDFC, SBI"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Account Last 4</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={manualForm.lastFour}
                    onChange={(e) => setManualForm({ ...manualForm, lastFour: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800"
                    placeholder="e.g. 4412"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Payment Method</label>
                  <select
                    value={manualForm.paymentMethod}
                    onChange={(e) =>
                      setManualForm({
                        ...manualForm,
                        paymentMethod: e.target.value as PaymentMethod,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  >
                    <option value="UPI">UPI</option>
                    <option value="CARD">CARD</option>
                    <option value="ATM">ATM</option>
                    <option value="NEFT">NEFT</option>
                    <option value="IMPS">IMPS</option>
                    <option value="BANK_TRANSFER">BANK TRANSFER</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Account Type</label>
                  <select
                    value={manualForm.accountType}
                    onChange={(e) =>
                      setManualForm({
                        ...manualForm,
                        accountType: e.target.value as AccountType,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  >
                    <option value="BANK_ACCOUNT">BANK ACCOUNT</option>
                    <option value="CREDIT_CARD">CREDIT CARD</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Merchant / Payee</label>
                  <input
                    type="text"
                    value={manualForm.merchant}
                    onChange={(e) => setManualForm({ ...manualForm, merchant: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                    placeholder="e.g. Annual Renewal"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Category</label>
                  <select
                    value={manualForm.category}
                    onChange={(e) => setManualForm({ ...manualForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  >
                    {ALL_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedUnrecognized(null)}
                className="px-4 py-2 text-xs text-slate-600 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveManualTransaction}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs"
              >
                Save & Create Transaction
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
