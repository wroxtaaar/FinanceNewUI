import React, { useState } from 'react';
import { SMS_TEST_PRESETS } from '../data/mockData';
import { SmsParserManager } from '../parser/SmsParserManager';
import { SenderTrustManager } from '../parser/SenderTrustManager';
import { CardBillPaymentSmsParser } from '../parser/CardBillPaymentSmsParser';
import { TransactionCategorizer } from '../categorizer/TransactionCategorizer';
import { CategoryMemoryKey } from '../categorizer/CategoryMemoryKey';
import { Storage } from '../data/storage';
import { ParserResult, Transaction } from '../types/finance';
import { formatPaise } from '../utils/formatters';
import {
  X,
  MessageSquare,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  PlusCircle,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onTransactionCreated: (tx: Transaction) => void;
}

export const SmsSimulatorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onTransactionCreated,
}) => {
  if (!isOpen) return null;

  const [sender, setSender] = useState<string>('JD-HDFCBK-S');
  const [messageBody, setMessageBody] = useState<string>(
    'Rs. 500.00 debited from a/c xx9591 on 12-OCT-26 to UPI/Swiggy/swiggy@upi Ref:123456'
  );

  const [parseResult, setParseResult] = useState<{
    result: ParserResult | null;
    isRejected: boolean;
    rejectionReason?: string;
    isFinancialLooking: boolean;
    category?: string;
    isCardBillPayment?: boolean;
    cardBillInfo?: any;
  } | null>(null);

  const handleSelectPreset = (preset: (typeof SMS_TEST_PRESETS)[0]) => {
    setSender(preset.sender);
    setMessageBody(preset.body);
    setParseResult(null);
  };

  const handleParse = () => {
    const isHardRejected = SenderTrustManager.isNonTransactionalFinancialMessage(messageBody);
    if (isHardRejected) {
      setParseResult({
        result: null,
        isRejected: true,
        rejectionReason:
          'Rejected by SenderTrustManager: Detected OTP, promotional offer, uncompleted payment, or non-transactional balance alert.',
        isFinancialLooking: false,
      });
      return;
    }

    const billPayment = CardBillPaymentSmsParser.parse(sender, messageBody);
    if (billPayment) {
      const result: ParserResult = {
        isTransaction: true,
        amountPaise: billPayment.amountPaise,
        currency: 'INR',
        transactionType: 'CREDIT',
        paymentMethod: billPayment.paymentMethod,
        accountType: 'CREDIT_CARD',
        bank: billPayment.cardBank,
        merchantName: `${billPayment.cardBank} Card Payment`,
        payeeId: null,
        accountLastFour: billPayment.cardLastFour,
        refNumber: billPayment.reference,
        confidence: billPayment.confidence,
      };

      const category = 'TRANSFER';
      setParseResult({
        result,
        isRejected: false,
        isFinancialLooking: true,
        category,
        isCardBillPayment: true,
        cardBillInfo: billPayment,
      });
      return;
    }

    const manager = new SmsParserManager();
    const result = manager.parse(sender, messageBody);

    if (result.isTransaction && result.amountPaise > 0) {
      const memoryKey = CategoryMemoryKey.from(result);
      const memory = Storage.getCategoryMemory();
      const remembered = memoryKey ? memory[memoryKey] : null;
      const category = TransactionCategorizer.categorize(result, messageBody, remembered);

      setParseResult({
        result,
        isRejected: false,
        isFinancialLooking: true,
        category,
      });
    } else {
      const isFin = SenderTrustManager.isFinancialLooking(messageBody);
      setParseResult({
        result: null,
        isRejected: true,
        rejectionReason: isFin
          ? 'Parser could not safely extract amount or details from this message. It can be forwarded to Review & Reconcile as an Unrecognized SMS.'
          : 'Message does not appear to contain a completed transaction.',
        isFinancialLooking: isFin,
      });
    }
  };

  const handleIngest = () => {
    if (!parseResult?.result) return;
    const res = parseResult.result;

    const hash = `sms:${(sender || 'unknown').toLowerCase()}:${Date.now()}`;
    const newTx = Storage.addTransaction({
      amountPaise: res.amountPaise,
      currency: res.currency,
      transactionType: res.transactionType,
      paymentMethod: res.paymentMethod,
      accountType: res.accountType,
      bank: res.bank,
      merchantName: res.merchantName,
      payeeId: res.payeeId,
      accountLastFour: res.accountLastFour,
      refNumber: res.refNumber,
      timestamp: Date.now(),
      smsHash: hash,
      category: parseResult.category || 'GROCERIES',
      parserConfidence: res.confidence,
    });

    onTransactionCreated(newTx);
    onClose();
  };

  const handleSendToReview = () => {
    const hash = `sms:unrec:${Date.now()}`;
    Storage.addUnrecognizedSms({
      sender,
      bodySnippet: messageBody.slice(0, 160),
      receivedAt: Date.now(),
      contentHash: hash,
      status: 'PENDING',
    });
    alert('Added to Unrecognized SMS under Review & Reconcile!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Simulate Bank SMS</h2>
              <p className="text-xs text-slate-500">
                Test regex parsers, trust classification, and automatic ledger ingestion
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

        <div className="p-6 overflow-y-auto space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Presets from Indian Banks
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SMS_TEST_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectPreset(p)}
                  className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg border border-slate-200/70 transition-colors"
                >
                  {p.title}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Sender Header (e.g. JD-HDFCBK-S, AD-AXISBK-S, SBIINB, PAYTM)
              </label>
              <input
                type="text"
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-slate-800"
                placeholder="e.g. JD-HDFCBK-S"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                SMS Message Body
              </label>
              <textarea
                rows={4}
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-sans text-slate-800 resize-none"
                placeholder="Paste incoming SMS text here..."
              />
            </div>

            <button
              onClick={handleParse}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl shadow-xs shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
            >
              Parse & Validate SMS <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {parseResult && (
            <div className="pt-2">
              {parseResult.result ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 uppercase tracking-wide">
                      <CheckCircle className="w-4 h-4 text-emerald-600" /> Successfully Parsed
                    </span>
                    <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">
                      {(parseResult.result.confidence * 100).toFixed(0)}% confidence
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Amount</span>
                      <span className="text-base font-bold text-slate-900">
                        {formatPaise(parseResult.result.amountPaise, true, parseResult.result.transactionType)}
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Direction</span>
                      <span className="font-semibold text-slate-800">{parseResult.result.transactionType}</span>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Category</span>
                      <span className="font-semibold text-indigo-600">{parseResult.category}</span>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Bank / Account</span>
                      <span className="font-semibold text-slate-800">
                        {parseResult.result.bank || 'Unknown'} {parseResult.result.accountLastFour ? `••••${parseResult.result.accountLastFour}` : ''}
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Method</span>
                      <span className="font-semibold text-slate-800">{parseResult.result.paymentMethod}</span>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Merchant / Payee</span>
                      <span className="font-semibold text-slate-800 truncate block">
                        {parseResult.result.merchantName || parseResult.result.payeeId || 'Not specified'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleIngest}
                    className="w-full mt-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <PlusCircle className="w-4 h-4" /> Ingest into Ledger & Transactions
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 uppercase tracking-wide">
                    {parseResult.isFinancialLooking ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                    )}
                    {parseResult.isFinancialLooking ? 'Unrecognized Financial SMS' : 'Message Rejected'}
                  </div>
                  <p className="text-xs text-slate-700">{parseResult.rejectionReason}</p>

                  {parseResult.isFinancialLooking && (
                    <button
                      onClick={handleSendToReview}
                      className="mt-2 py-2 px-3 text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      Send to Review & Reconcile Queue
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
