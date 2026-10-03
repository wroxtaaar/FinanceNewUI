import { ParserResult, PaymentMethod, AccountType, TransactionType } from '../types/finance';
import { AmountParser } from './AmountParser';
import { MerchantParser } from './MerchantParser';
import { SenderTrustManager } from './SenderTrustManager';

export class HdfcSmsParser {
  parse(sender: string, messageBody: string): ParserResult | null {
    if (!sender.toUpperCase().includes('HDFC')) {
      return null;
    }

    if (SenderTrustManager.isNonTransactionalFinancialMessage(messageBody)) {
      return {
        isTransaction: false,
        amountPaise: 0,
        currency: 'INR',
        transactionType: 'UNKNOWN',
        paymentMethod: 'UNKNOWN',
        accountType: 'UNKNOWN',
        bank: null,
        merchantName: null,
        payeeId: null,
        accountLastFour: null,
        refNumber: null,
        confidence: 0,
      };
    }

    const lowerBody = messageBody.toLowerCase();
    const currency = AmountParser.parseCurrency(messageBody);
    const amountPaise = AmountParser.parseAmountToPaise(messageBody);

    if (amountPaise === null || amountPaise <= 0) {
      return {
        isTransaction: false,
        amountPaise: 0,
        currency,
        transactionType: 'UNKNOWN',
        paymentMethod: 'UNKNOWN',
        accountType: 'UNKNOWN',
        bank: null,
        merchantName: null,
        payeeId: null,
        accountLastFour: null,
        refNumber: null,
        confidence: 0,
      };
    }

    const isCredit =
      lowerBody.includes('credited') ||
      lowerBody.includes('received') ||
      lowerBody.includes('added') ||
      lowerBody.includes('refund') ||
      lowerBody.includes('reversal') ||
      lowerBody.includes('cr');

    const isDebit =
      lowerBody.includes('debited') ||
      lowerBody.includes('deducted') ||
      lowerBody.includes('spent') ||
      lowerBody.includes('paid') ||
      lowerBody.includes('charged') ||
      lowerBody.includes('sent') ||
      lowerBody.includes('dr') ||
      lowerBody.includes('used for') ||
      lowerBody.includes('atm wdl') ||
      lowerBody.includes('withdrawn') ||
      lowerBody.includes('transferred') ||
      lowerBody.includes('transfer');

    if (!isCredit && !isDebit) {
      return null;
    }

    let transactionType: TransactionType = 'UNKNOWN';
    if (isCredit && !isDebit) {
      transactionType = 'CREDIT';
    } else if (isDebit) {
      transactionType = 'DEBIT';
    }

    let paymentMethod: PaymentMethod = 'UNKNOWN';
    if (lowerBody.includes('upi') || messageBody.includes('@')) {
      paymentMethod = 'UPI';
    } else if (lowerBody.includes('atm') || lowerBody.includes('wdl')) {
      paymentMethod = 'ATM';
    } else if (lowerBody.includes('neft')) {
      paymentMethod = 'NEFT';
    } else if (lowerBody.includes('imps')) {
      paymentMethod = 'IMPS';
    } else if (lowerBody.includes('rtgs')) {
      paymentMethod = 'RTGS';
    } else if (lowerBody.includes('card') || lowerBody.includes('pos') || lowerBody.includes('ecom')) {
      paymentMethod = 'CARD';
    } else if (lowerBody.includes('transfer')) {
      paymentMethod = 'BANK_TRANSFER';
    }

    let accountType: AccountType = 'UNKNOWN';
    if (lowerBody.includes('card') || lowerBody.includes('credit card')) {
      accountType = 'CREDIT_CARD';
    } else if (
      lowerBody.includes('a/c') ||
      lowerBody.includes('account') ||
      lowerBody.includes('ac') ||
      paymentMethod === 'UPI'
    ) {
      accountType = 'BANK_ACCOUNT';
    }

    const cardEndingMatcher = /card\s+ending\s+([0-9]{4})/i.exec(messageBody);
    let accountLastFour: string | null = null;
    if (cardEndingMatcher) {
      accountLastFour = cardEndingMatcher[1];
    } else {
      const accMatcher = /(?:a\/c|acct|account|card)\s*(?:no\.)?\s*(?:\*+|xx|XXXX)?([0-9]{4})/i.exec(messageBody);
      if (accMatcher) {
        accountLastFour = accMatcher[1];
      }
    }

    const { merchant, vpa } = MerchantParser.extractMerchantAndVpa(messageBody);

    const refMatcher = /(?:ref|upi ref|imps ref|utr)\.?\s*:?\s*([0-9a-zA-Z]+)/i.exec(messageBody);
    const refNumber = refMatcher ? refMatcher[1] : null;

    return {
      isTransaction: true,
      amountPaise,
      currency,
      transactionType,
      paymentMethod,
      accountType,
      bank: 'HDFC',
      merchantName: merchant,
      payeeId: vpa,
      accountLastFour,
      refNumber,
      confidence: 0.95,
    };
  }
}
