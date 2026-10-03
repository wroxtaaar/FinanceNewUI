import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types/finance';
import { formatPaise, formatDateTime } from '../utils/formatters';
import { ALL_CATEGORIES } from '../categorizer/TransactionCategorizer';
import {
  Search,
  Filter,
  CreditCard,
  Utensils,
  ShoppingCart,
  Fuel,
  Plane,
  Tv,
  Receipt,
  ArrowRightLeft,
  CircleDollarSign,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Landmark,
} from 'lucide-react';

interface Props {
  transactions: Transaction[];
  onSelectTransaction: (tx: Transaction) => void;
  onOpenSimulator: () => void;
}

export const TransactionList: React.FC<Props> = ({
  transactions,
  onSelectTransaction,
  onOpenSimulator,
}) => {
  const [search, setSearch] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | TransactionType>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const activeTransactions = transactions.filter((t) => !t.isVoided);

  const filtered = activeTransactions.filter((tx) => {
    if (typeFilter !== 'ALL' && tx.transactionType !== typeFilter) {
      return false;
    }

    if (categoryFilter !== 'ALL' && tx.category !== categoryFilter) {
      return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchMerchant = tx.merchantName?.toLowerCase().includes(q);
      const matchPayee = tx.payeeId?.toLowerCase().includes(q);
      const matchBank = tx.bank?.toLowerCase().includes(q);
      const matchRef = tx.refNumber?.toLowerCase().includes(q);
      const matchLast4 = tx.accountLastFour?.includes(q);
      const matchCategory = tx.category?.toLowerCase().includes(q);
      const matchAmount = (tx.amountPaise / 100).toString().includes(q);

      if (
        !matchMerchant &&
        !matchPayee &&
        !matchBank &&
        !matchRef &&
        !matchLast4 &&
        !matchCategory &&
        !matchAmount
      ) {
        return false;
      }
    }

    return true;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'FOOD':
        return <Utensils className="w-4 h-4 text-orange-600" />;
      case 'GROCERIES':
        return <ShoppingCart className="w-4 h-4 text-emerald-600" />;
      case 'FUEL':
        return <Fuel className="w-4 h-4 text-amber-600" />;
      case 'TRAVEL':
        return <Plane className="w-4 h-4 text-sky-600" />;
      case 'SUBSCRIPTION':
        return <Tv className="w-4 h-4 text-purple-600" />;
      case 'BILLS':
        return <Receipt className="w-4 h-4 text-rose-600" />;
      case 'TRANSFER':
        return <ArrowRightLeft className="w-4 h-4 text-indigo-600" />;
      case 'SALARY':
        return <CircleDollarSign className="w-4 h-4 text-emerald-600" />;
      case 'REFUND':
        return <RotateCcw className="w-4 h-4 text-teal-600" />;
      case 'ATM':
        return <Landmark className="w-4 h-4 text-slate-700" />;
      default:
        return <CreditCard className="w-4 h-4 text-slate-600" />;
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'FOOD':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'GROCERIES':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'FUEL':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'TRAVEL':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'SUBSCRIPTION':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'BILLS':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'TRANSFER':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'SALARY':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'REFUND':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'ATM':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search merchant, bank, UPI, ref..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-medium">
            <button
              onClick={() => setTypeFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                typeFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setTypeFilter('DEBIT')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                typeFilter === 'DEBIT'
                  ? 'bg-white text-rose-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Debits
            </button>
            <button
              onClick={() => setTypeFilter('CREDIT')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                typeFilter === 'CREDIT'
                  ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Credits
            </button>
          </div>

          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pl-3 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-700 cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {ALL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">No transactions found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {activeTransactions.length === 0
              ? 'Your transaction ledger is empty. Click below to simulate or test bank SMS.'
              : 'No transactions match your current search or category filters.'}
          </p>
          {activeTransactions.length === 0 && (
            <button
              onClick={onOpenSimulator}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" /> Simulate Test SMS
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {filtered.map((tx) => {
            const isCredit = tx.transactionType === 'CREDIT';
            const title =
              tx.merchantName?.trim() ||
              tx.payeeId?.trim() ||
              (isCredit ? 'Credit Transaction' : 'Payment');

            return (
              <div
                key={tx.id}
                onClick={() => onSelectTransaction(tx)}
                className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-slate-100 ${
                      isCredit ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    {getCategoryIcon(tx.category)}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900 truncate">
                        {title}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.2 rounded-md border ${getCategoryBadgeClass(
                          tx.category
                        )}`}
                      >
                        {tx.category}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 mt-0.5">
                      <span>
                        {tx.bank || 'Bank'}{' '}
                        {tx.accountLastFour && (
                          <span className="font-mono text-[11px]">•••• {tx.accountLastFour}</span>
                        )}
                      </span>
                      <span>•</span>
                      <span className="font-medium text-slate-600">{tx.paymentMethod}</span>
                      <span>•</span>
                      <span className="text-[11px] text-slate-400">
                        {formatDateTime(tx.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-right">
                  <div>
                    <div
                      className={`text-base font-bold tracking-tight font-mono ${
                        isCredit ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      {formatPaise(tx.amountPaise, true, tx.transactionType)}
                    </div>
                    {tx.refNumber && (
                      <div className="text-[10px] text-slate-400 font-mono">
                        Ref: {tx.refNumber}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
