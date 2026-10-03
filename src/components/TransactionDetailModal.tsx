import React, { useState } from 'react';
import { Transaction } from '../types/finance';
import { ALL_CATEGORIES, CREDIT_CATEGORIES } from '../categorizer/TransactionCategorizer';
import { CategoryMemoryKey } from '../categorizer/CategoryMemoryKey';
import { formatPaise, formatDateTime } from '../utils/formatters';
import {
  X,
  CreditCard,
  Building2,
  Calendar,
  Tag,
  Hash,
  ArrowDownLeft,
  ArrowUpRight,
  Trash2,
  Save,
} from 'lucide-react';

interface Props {
  transaction: Transaction | null;
  onClose: () => void;
  onSaveCategory: (id: number, category: string, remember: boolean, memoryKey: string | null) => void;
  onVoid: (id: number) => void;
}

export const TransactionDetailModal: React.FC<Props> = ({
  transaction,
  onClose,
  onSaveCategory,
  onVoid,
}) => {
  if (!transaction) return null;

  const isCredit = transaction.transactionType === 'CREDIT';
  const availableCategories = isCredit ? CREDIT_CATEGORIES : ALL_CATEGORIES;

  const [selectedCategory, setSelectedCategory] = useState<string>(
    transaction.category || (isCredit ? 'TRANSFER' : 'GROCERIES')
  );

  const memoryKey = CategoryMemoryKey.from({
    payeeId: transaction.payeeId,
    bank: transaction.bank,
    accountLastFour: transaction.accountLastFour,
    accountType: transaction.accountType,
  });

  const [rememberPayee, setRememberPayee] = useState<boolean>(false);
  const [showVoidConfirm, setShowVoidConfirm] = useState<boolean>(false);

  const handleSave = () => {
    onSaveCategory(transaction.id, selectedCategory, rememberPayee, memoryKey);
    onClose();
  };

  const handleVoid = () => {
    onVoid(transaction.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center ${
                isCredit ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              }`}
            >
              {isCredit ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Transaction Details</h2>
              <p className="text-xs text-slate-500">ID #{transaction.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 bg-gradient-to-b from-slate-50 to-white text-center border-b border-slate-100">
          <div
            className={`text-3xl font-bold tracking-tight ${
              isCredit ? 'text-emerald-600' : 'text-slate-900'
            }`}
          >
            {formatPaise(transaction.amountPaise, true, transaction.transactionType)}
          </div>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                isCredit ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {transaction.transactionType}
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200">
              {transaction.paymentMethod}
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-purple-50 text-purple-700 border border-purple-200">
              {transaction.accountType.replace('_', ' ')}
            </span>
          </div>
        </div>

        <div className="px-6 py-4 space-y-3.5 text-sm">
          <div className="flex justify-between items-center py-1 border-b border-slate-50">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-slate-400" /> Bank
            </span>
            <span className="font-medium text-slate-800">{transaction.bank || 'Unknown'}</span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-slate-50">
            <span className="text-slate-500 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-slate-400" /> Account / Card Last 4
            </span>
            <span className="font-medium text-slate-800 font-mono">
              {transaction.accountLastFour ? `•••• ${transaction.accountLastFour}` : 'Not provided'}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-slate-50">
            <span className="text-slate-500">Merchant / Payee</span>
            <span className="font-medium text-slate-800 text-right max-w-[240px] truncate">
              {transaction.merchantName || 'Not specified'}
            </span>
          </div>

          {transaction.payeeId && (
            <div className="flex justify-between items-center py-1 border-b border-slate-50">
              <span className="text-slate-500">UPI ID / VPA</span>
              <span className="font-medium text-slate-800 font-mono text-xs">{transaction.payeeId}</span>
            </div>
          )}

          <div className="flex justify-between items-center py-1 border-b border-slate-50">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Hash className="w-4 h-4 text-slate-400" /> Reference / UTR
            </span>
            <span className="font-medium text-slate-800 font-mono text-xs">
              {transaction.refNumber || 'None'}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-slate-50">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" /> Date & Time
            </span>
            <span className="font-medium text-slate-800">{formatDateTime(transaction.timestamp)}</span>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-indigo-500" /> Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800"
            >
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {memoryKey && (
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberPayee}
                  onChange={(e) => setRememberPayee(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-600">
                  Remember this category for <span className="font-medium text-slate-800 font-mono">{memoryKey}</span>
                </span>
              </label>
            </div>
          )}
        </div>

        {showVoidConfirm && (
          <div className="mx-6 my-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
            <p className="font-semibold mb-1">Delete Transaction?</p>
            <p className="mb-2">
              This removes the transaction from local history and updates your ledger balance.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowVoidConfirm(false)}
                className="px-2.5 py-1 text-slate-600 hover:text-slate-800 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleVoid}
                className="px-3 py-1 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-medium"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100">
          {!showVoidConfirm ? (
            <button
              type="button"
              onClick={() => setShowVoidConfirm(true)}
              className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs shadow-indigo-600/30 transition-all"
            >
              <Save className="w-3.5 h-3.5" /> Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
