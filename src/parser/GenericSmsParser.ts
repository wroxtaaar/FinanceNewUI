import { ParserResult, PaymentMethod, AccountType, TransactionType } from '../types/finance';
import { AmountParser } from './AmountParser';
import { MerchantParser } from './MerchantParser';
import { SenderTrustManager } from './SenderTrustManager';

export class GenericSmsParser {
  parse(sender: string, messageBody: string): ParserResult | null {
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
    const amountPaise = AmountParser.parseAmountToPaise(messageBody) || 0;

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
      lowerBody.includes('dr');

    if (!isCredit && !isDebit) {
      return null;
    }

    let transactionType: TransactionType = 'UNKNOWN';
    if (isCredit && !isDebit) {
      transactionType = 'CREDIT';
    } else if (isDebit || isCredit) {
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
    if (lowerBody.includes('card')) {
      accountType = 'CREDIT_CARD';
    } else if (
      lowerBody.includes('a/c') ||
      lowerBody.includes('account') ||
      paymentMethod === 'UPI'
    ) {
      accountType = 'BANK_ACCOUNT';
    }

    const accMatcher = /(?:a\/c|account|ac|card)\s*(?:no\.)?\s*(?:x+|XXXX|\*+)?([0-9]{4})/i.exec(messageBody);
    const accountLastFour = accMatcher ? accMatcher[1] : null;

    const { merchant, vpa } = MerchantParser.extractMerchantAndVpa(messageBody);

    const refMatcher = /(?:ref|utr)\.?\s*:?\s*([0-9a-zA-Z]+)/i.exec(messageBody);
    const refNumber = refMatcher ? refMatcher[1] : null;

    let bankName = sender;
    const upperSender = sender.toUpperCase();
    if (upperSender.includes('SBI')) bankName = 'SBI';
    else if (upperSender.includes('ICICI')) bankName = 'ICICI';
    else if (upperSender.includes('KOTAK')) bankName = 'KOTAK';
    else if (upperSender.includes('INDUSIND')) bankName = 'INDUSIND';
    else if (upperSender.includes('PNB')) bankName = 'PNB';
    else if (upperSender.includes('BOB')) bankName = 'BOB';
    else if (upperSender.includes('PAYTM')) bankName = 'PAYTM';

    return {
      isTransaction: true,
      amountPaise,
      currency,
      transactionType,
      paymentMethod,
      accountType,
      bank: bankName,
      merchantName: merchant,
      payeeId: vpa,
      accountLastFour,
      refNumber,
      confidence: 0.8,
    };
  }
}
