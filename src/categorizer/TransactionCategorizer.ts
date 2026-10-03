import { ParserResult } from '../types/finance';

export const ALL_CATEGORIES = [
  'FOOD',
  'GROCERIES',
  'SHOPPING',
  'FUEL',
  'TRAVEL',
  'SUBSCRIPTION',
  'BILLS',
  'TRANSFER',
  'ATM',
  'SALARY',
  'REFUND',
  'OTHER',
] as const;

export const CREDIT_CATEGORIES = ['SALARY', 'TRANSFER', 'REFUND'] as const;

export const TransactionCategorizer = {
  categorize(
    parserResult: ParserResult,
    messageBody: string,
    rememberedCategory: string | null = null
  ): string {
    const lowerBody = messageBody.toLowerCase();
    const merchant = (parserResult.merchantName || '').toLowerCase();
    const payee = (parserResult.payeeId || '').toLowerCase();
    const combined = `${lowerBody} ${merchant} ${payee}`;

    if (parserResult.transactionType === 'CREDIT') {
      if (
        combined.includes('refund') ||
        combined.includes('reversal') ||
        combined.includes('reversed')
      ) {
        return 'REFUND';
      }
      if (
        combined.includes('salary') ||
        combined.includes('payroll') ||
        combined.includes('stipend')
      ) {
        return 'SALARY';
      }
      return 'TRANSFER';
    }

    if (rememberedCategory && rememberedCategory.trim()) {
      return rememberedCategory;
    }

    if (
      combined.includes('salary') ||
      combined.includes('payroll') ||
      combined.includes('stipend')
    ) {
      return 'SALARY';
    }

    if (
      combined.includes('refund') ||
      combined.includes('reversal') ||
      combined.includes('reversed')
    ) {
      return 'REFUND';
    }

    if (
      combined.includes('atm') ||
      combined.includes('cash withdrawal') ||
      parserResult.paymentMethod === 'ATM'
    ) {
      return 'ATM';
    }

    if (
      combined.includes('netflix') ||
      combined.includes('spotify') ||
      combined.includes('prime') ||
      combined.includes('subscription') ||
      combined.includes('hotstar') ||
      combined.includes('google play') ||
      combined.includes('apple')
    ) {
      return 'SUBSCRIPTION';
    }

    if (
      combined.includes('electricity') ||
      combined.includes('broadband') ||
      combined.includes('recharge') ||
      combined.includes('bill') ||
      combined.includes('utility') ||
      combined.includes('water') ||
      combined.includes('gas bill')
    ) {
      return 'BILLS';
    }

    if (
      combined.includes('iocl') ||
      combined.includes('bpcl') ||
      combined.includes('hpcl') ||
      combined.includes('petrol') ||
      combined.includes('fuel') ||
      combined.includes('diesel') ||
      combined.includes('gas station')
    ) {
      return 'FUEL';
    }

    if (
      combined.includes('uber') ||
      combined.includes('ola') ||
      combined.includes('irctc') ||
      combined.includes('airline') ||
      combined.includes('flight') ||
      combined.includes('train') ||
      combined.includes('metro') ||
      combined.includes('cab')
    ) {
      return 'TRAVEL';
    }

    if (
      combined.includes('swiggy') ||
      combined.includes('zomato') ||
      combined.includes('restaurant') ||
      combined.includes('cafe') ||
      combined.includes('food') ||
      combined.includes('dining')
    ) {
      return 'FOOD';
    }

    if (
      combined.includes('amazon') ||
      combined.includes('flipkart') ||
      combined.includes('myntra') ||
      combined.includes('shopping') ||
      combined.includes('store') ||
      combined.includes('mall')
    ) {
      return 'SHOPPING';
    }

    if (
      combined.includes('neft') ||
      combined.includes('imps') ||
      combined.includes('rtgs') ||
      combined.includes('bank transfer') ||
      combined.includes('fund transfer') ||
      parserResult.paymentMethod === 'NEFT' ||
      parserResult.paymentMethod === 'IMPS' ||
      parserResult.paymentMethod === 'RTGS' ||
      parserResult.paymentMethod === 'BANK_TRANSFER'
    ) {
      return 'TRANSFER';
    }

    if (parserResult.paymentMethod === 'UPI') {
      return 'GROCERIES';
    }

    return 'GROCERIES';
  },
};
