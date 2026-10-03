import React, { useState } from 'react';
import { OracleAccount } from '../types/finance';
import { formatPaise } from '../utils/formatters';
import {
  X,
  CreditCard,
  Building2,
  Users2,
  Save,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';

interface Props {
  mode: 'view' | 'edit_banks' | 'edit_cards' | 'edit_splitwise';
  isOpen: boolean;
  onClose: () => void;
  accounts: OracleAccount[];
  splitwiseTotal: number;
  onUpdateAccountBalance: (account: OracleAccount, balanceMinor: number, billBalanceMinor?: number) => void;
  onUpdateSplitwise: (newTotalMinor: number) => void;
}

export const AccountsModal: React.FC<Props> = ({
  mode,
  isOpen,
  onClose,
  accounts,
  splitwiseTotal,
  onUpdateAccountBalance,
  onUpdateSplitwise,
}) => {
  if (!isOpen) return null;

  const bankAccounts = accounts.filter((a) => a.accountType === 'BANK_ACCOUNT');
  const creditCards = accounts.filter((a) => a.accountType === 'CREDIT_CARD');
  const otherAccounts = accounts.filter(
    (a) => a.accountType !== 'BANK_ACCOUNT' && a.accountType !== 'CREDIT_CARD'
  );

  const [bankBalances, setBankBalances] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    bankAccounts.forEach((acc) => {
      init[acc.id] = (acc.balanceMinor / 100).toFixed(2);
    });
    return init;
  });

  const [cardBalances, setCardBalances] = useState<
    Record<string, { bill: string; active: string }>
  >(() => {
    const init: Record<string, { bill: string; active: string }> = {};
    creditCards.forEach((acc) => {
      const billMinor = Math.min(acc.billBalanceMinor, acc.balanceMinor);
      const activeMinor = Math.max(0, acc.balanceMinor - billMinor);
      init[acc.id] = {
        bill: (billMinor / 100).toFixed(2),
        active: (activeMinor / 100).toFixed(2),
      };
    });
    return init;
  });

  const [splitwiseInput, setSplitwiseInput] = useState<string>(
    (splitwiseTotal / 100).toFixed(2)
  );

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSaveBanks = () => {
    bankAccounts.forEach((acc) => {
      const val = parseFloat(bankBalances[acc.id]?.replace(/,/g, '') || '0');
      if (!isNaN(val) && val >= 0) {
        onUpdateAccountBalance(acc, Math.round(val * 100));
      }
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const handleSaveCards = () => {
    creditCards.forEach((acc) => {
      const row = cardBalances[acc.id];
      const bill = parseFloat(row?.bill?.replace(/,/g, '') || '0');
      const active = parseFloat(row?.active?.replace(/,/g, '') || '0');
      if (!isNaN(bill) && !isNaN(active) && bill >= 0 && active >= 0) {
        const billMinor = Math.round(bill * 100);
        const activeMinor = Math.round(active * 100);
        onUpdateAccountBalance(acc, billMinor + activeMinor, billMinor);
      }
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const handleSaveSplitwise = () => {
    const val = parseFloat(splitwiseInput.replace(/,/g, '') || '0');
    if (!isNaN(val) && val >= 0) {
      onUpdateSplitwise(Math.round(val * 100));
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 600);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center">
              {mode === 'edit_cards' ? (
                <CreditCard className="w-5 h-5 text-amber-600" />
              ) : mode === 'edit_splitwise' ? (
                <Users2 className="w-5 h-5 text-purple-600" />
              ) : (
                <Building2 className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {mode === 'view' && 'Oracle Accounts'}
                {mode === 'edit_banks' && 'Edit Bank Accounts'}
                {mode === 'edit_cards' && 'Edit Credit Cards'}
                {mode === 'edit_splitwise' && 'Edit Splitwise Balance'}
              </h2>
              <p className="text-xs text-slate-500">
                {mode === 'view' && 'Connected balances from your personal finance ledger'}
                {mode === 'edit_banks' && 'Manually update the current balance for each bank account'}
                {mode === 'edit_cards' && 'Reconcile statement bill and active post-statement spend'}
                {mode === 'edit_splitwise' && 'Group balances owed to you for shared expenses'}
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

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {savedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Balances saved and ledger recalculated!
            </div>
          )}

          {mode === 'view' && (
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-500" /> Bank Accounts
                </h3>
                <div className="space-y-2">
                  {bankAccounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl"
                    >
                      <div>
                        <div className="font-semibold text-slate-800">
                          {acc.name}{' '}
                          {acc.last4 && (
                            <span className="font-mono text-xs text-slate-400 font-normal">
                              •••• {acc.last4}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">{acc.bank || 'Bank'}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block font-normal">Balance</span>
                        <span className="font-semibold text-slate-900">
                          {formatPaise(acc.balanceMinor)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-amber-500" /> Credit Cards
                </h3>
                <div className="space-y-2">
                  {creditCards.map((acc) => (
                    <div
                      key={acc.id}
                      className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-800">
                            {acc.name}{' '}
                            {acc.last4 && (
                              <span className="font-mono text-xs text-slate-400 font-normal">
                                •••• {acc.last4}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">{acc.bank || 'Credit Card'}</div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-400 block font-normal">Outstanding</span>
                          <span className="font-semibold text-amber-700">
                            {formatPaise(acc.balanceMinor)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px] text-slate-500">
                        <span>Bill: {formatPaise(acc.billBalanceMinor)}</span>
                        <span>
                          Active Spend: {formatPaise(Math.max(0, acc.balanceMinor - acc.billBalanceMinor))}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {otherAccounts.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Other Accounts
                  </h3>
                  <div className="space-y-2">
                    {otherAccounts.map((acc) => (
                      <div
                        key={acc.id}
                        className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl"
                      >
                        <span className="font-medium text-slate-800">{acc.name}</span>
                        <span className="font-semibold text-slate-900">
                          {formatPaise(acc.balanceMinor)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {mode === 'edit_banks' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Enter the current ledger balance for each bank account.
              </p>
              <div className="space-y-3">
                {bankAccounts.map((acc) => (
                  <div key={acc.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      {acc.name} {acc.last4 && <span className="text-slate-500 font-mono">•••• {acc.last4}</span>}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-sm text-slate-400 font-medium">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        value={bankBalances[acc.id] || ''}
                        onChange={(e) =>
                          setBankBalances({ ...bankBalances, [acc.id]: e.target.value })
                        }
                        className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-900"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {mode === 'edit_cards' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Credit Card Split Logic:</p>
                  <p>
                    <strong>Bill</strong> is statement amount still to be paid.
                    <br />
                    <strong>Active Spend</strong> is new card purchases made after that statement.
                    <br />
                    Total outstanding = Bill + Active Spend.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {creditCards.map((acc) => (
                  <div key={acc.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="font-semibold text-xs text-slate-900">
                      {acc.name} {acc.last4 && <span className="text-slate-500 font-mono">•••• {acc.last4}</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 mb-1">
                          Statement Bill (₹)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={cardBalances[acc.id]?.bill || ''}
                          onChange={(e) =>
                            setCardBalances({
                              ...cardBalances,
                              [acc.id]: {
                                ...cardBalances[acc.id],
                                bill: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 mb-1">
                          Active Spend (₹)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={cardBalances[acc.id]?.active || ''}
                          onChange={(e) =>
                            setCardBalances({
                              ...cardBalances,
                              [acc.id]: {
                                ...cardBalances[acc.id],
                                active: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {mode === 'edit_splitwise' && (
            <div className="space-y-4">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900">
                This amount represents the net money friends owe you.
                <br />
                It automatically increases with every DEBIT transaction, except transactions categorized as <strong>OTHER</strong>.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Splitwise Owed Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm text-slate-400 font-medium">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    value={splitwiseInput}
                    onChange={(e) => setSplitwiseInput(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-medium text-slate-900"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            {mode === 'view' ? 'Close' : 'Cancel'}
          </button>

          {mode === 'edit_banks' && (
            <button
              onClick={handleSaveBanks}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
            >
              <Save className="w-3.5 h-3.5" /> Save Balances
            </button>
          )}

          {mode === 'edit_cards' && (
            <button
              onClick={handleSaveCards}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors"
            >
              <Save className="w-3.5 h-3.5" /> Save Card Amounts
            </button>
          )}

          {mode === 'edit_splitwise' && (
            <button
              onClick={handleSaveSplitwise}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition-colors"
            >
              <Save className="w-3.5 h-3.5" /> Save Splitwise
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
