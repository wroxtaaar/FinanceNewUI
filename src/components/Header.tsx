import React, { useState } from 'react';
import { OracleLedgerSummary, GmailSyncResult } from '../types/finance';
import { formatPaise } from '../utils/formatters';
import { OracleClient } from '../integration/oracleClient';
import {
  Wallet,
  Building2,
  CreditCard,
  Users2,
  RefreshCw,
  MessageSquarePlus,
  FileCheck2,
  Mail,
  Settings,
  Trash2,
  CheckCircle2,
  Layers,
  Edit3,
} from 'lucide-react';

interface Props {
  summary: OracleLedgerSummary;
  reviewCount: number;
  onRefresh: () => void;
  onOpenSmsSimulator: () => void;
  onOpenReview: () => void;
  onOpenAccounts: (mode: 'view' | 'edit_banks' | 'edit_cards' | 'edit_splitwise') => void;
  onOpenSettings: () => void;
  onClearHistory: () => void;
}

export const Header: React.FC<Props> = ({
  summary,
  reviewCount,
  onRefresh,
  onOpenSmsSimulator,
  onOpenReview,
  onOpenAccounts,
  onOpenSettings,
  onClearHistory,
}) => {
  const [checkingGmail, setCheckingGmail] = useState<boolean>(false);
  const [gmailResult, setGmailResult] = useState<GmailSyncResult | null>(null);

  const handleCheckGmail = async () => {
    setCheckingGmail(true);
    try {
      const result = await OracleClient.triggerGmailSync();
      setGmailResult(result);
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setCheckingGmail(false);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
      <div className="bg-emerald-50/90 border-b border-emerald-100/80 px-4 py-1.5 flex items-center justify-between text-[11px] text-emerald-800">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Bank/card notification trigger: <span className="font-semibold">Enabled</span> • last Gmail: received
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <span>Oracle Ledger: Connected</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-sm shadow-indigo-500/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Finance SMS Tracker
              </h1>
              <p className="text-xs text-slate-500">
                Live Indian bank & UPI transaction parsing, Splitwise tracking, & reconciliation
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenSmsSimulator}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <MessageSquarePlus className="w-4 h-4" /> Simulate / Test SMS
            </button>

            <button
              onClick={onOpenReview}
              className="relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-all cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4 text-slate-500" />
              Review & Reconcile
              {reviewCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                  {reviewCount}
                </span>
              )}
            </button>

            <button
              onClick={handleCheckGmail}
              disabled={checkingGmail}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              <Mail className={`w-3.5 h-3.5 text-slate-500 ${checkingGmail ? 'animate-spin' : ''}`} />
              {checkingGmail ? 'Checking...' : 'Check Gmail'}
            </button>

            <button
              onClick={onRefresh}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              title="Refresh ledger"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenSettings}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              title="Oracle Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={onClearHistory}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
              title="Clear Local History"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div className="p-4 bg-gradient-to-br from-emerald-50/80 to-white border border-emerald-100 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold mb-1">
              <span className="uppercase tracking-wide text-[10px] text-emerald-700 font-bold">
                True Available
              </span>
              <Wallet className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 tracking-tight">
              {formatPaise(summary.trueAvailableMinor)}
            </div>
            <div className="text-[11px] text-emerald-800/80 mt-1">
              Cash - Cards + Splitwise
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-blue-50/80 to-white border border-blue-100 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-blue-800 text-xs font-semibold mb-1">
              <span className="uppercase tracking-wide text-[10px] text-blue-700 font-bold">
                Bank Cash
              </span>
              <Building2 className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {formatPaise(summary.bankCashMinor)}
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px]">
              <span className="text-slate-500">Savings & checking</span>
              <button
                onClick={() => onOpenAccounts('edit_banks')}
                className="text-blue-600 hover:underline font-medium inline-flex items-center gap-0.5 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" /> Edit
              </button>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-amber-50/80 to-white border border-amber-100 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-amber-800 text-xs font-semibold mb-1">
              <span className="uppercase tracking-wide text-[10px] text-amber-700 font-bold">
                Card Outstanding
              </span>
              <CreditCard className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-700 tracking-tight">
              {formatPaise(summary.creditCardOutstandingMinor)}
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px]">
              <span className="text-slate-500">Bill + Active spend</span>
              <button
                onClick={() => onOpenAccounts('edit_cards')}
                className="text-amber-700 hover:underline font-medium inline-flex items-center gap-0.5 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" /> Edit
              </button>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-purple-50/80 to-white border border-purple-100 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-purple-800 text-xs font-semibold mb-1">
              <span className="uppercase tracking-wide text-[10px] text-purple-700 font-bold">
                Splitwise Receivable
              </span>
              <Users2 className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-purple-700 tracking-tight">
              {formatPaise(summary.splitwiseReceivableMinor)}
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px]">
              <span className="text-slate-500">Owed from friends</span>
              <button
                onClick={() => onOpenAccounts('edit_splitwise')}
                className="text-purple-600 hover:underline font-medium inline-flex items-center gap-0.5 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" /> Edit
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenAccounts('view')}
              className="text-slate-600 hover:text-indigo-600 font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" /> View All Accounts
            </button>
          </div>
          <div className="text-[11px] text-slate-400">
            Splitwise auto-increments on non-OTHER debits
          </div>
        </div>
      </div>

      {gmailResult && (
        <div className="bg-indigo-50 border-t border-b border-indigo-100 px-4 py-2 text-xs text-indigo-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              Gmail checked: <strong>{gmailResult.messagesScanned}</strong> scanned,{' '}
              <strong>{gmailResult.parsedTransactions}</strong> new transaction emails,{' '}
              <strong>{gmailResult.duplicateTransactions}</strong> duplicates skipped.
            </span>
          </div>
          <button
            onClick={() => setGmailResult(null)}
            className="text-indigo-600 hover:text-indigo-800 font-bold px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}
    </header>
  );
};
