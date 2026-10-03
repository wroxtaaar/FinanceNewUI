import { ParserResult } from '../types/finance';
import { HdfcSmsParser } from './HdfcSmsParser';
import { AxisSmsParser } from './AxisSmsParser';
import { GenericSmsParser } from './GenericSmsParser';
import { SenderTrustManager } from './SenderTrustManager';

export class SmsParserManager {
  private parsers = [
    new HdfcSmsParser(),
    new AxisSmsParser(),
    new GenericSmsParser(),
  ];

  parse(sender: string, messageBody: string): ParserResult {
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

    for (const parser of this.parsers) {
      const result = parser.parse(sender, messageBody);
      if (result) {
        if (!result.isTransaction || result.amountPaise <= 0) {
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
        return result;
      }
    }

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
}
