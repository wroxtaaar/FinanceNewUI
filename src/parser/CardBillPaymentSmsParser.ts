import { PaymentMethod } from '../types/finance';

export interface CardBillPaymentSms {
  amountPaise: number;
  cardBank: string;
  cardLastFour: string;
  paymentMethod: PaymentMethod;
  reference: string | null;
  confidence: number;
}

const amountRegex = /(?:INR|Rs\.?|₹)\s*([0-9][0-9,]*(?:\.\d{1,2})?)/i;

const cardWithBankRegex =
  /\b(SBI|AXIS|HDFC|ICICI|INDUSIND|HSBC|KOTAK)(?:\s+BANK)?\s+(?:CREDIT\s+CARD|CARD)\b.{0,40}?(?:NO\.?|NUMBER|ENDING(?:\s+IN)?|XX+|X{2,}|\*{2,})?\s*[- ]?([0-9]{2,4})\b/i;

const cardSuffixRegex =
  /\b(?:credit\s+card|card)\s+(?:no\.?|number|ending(?:\s+in)?|ending)?\s*(?:XXXX|XXX|XX|X{2,}|\*{2,})?[- ]?([0-9]{4})\b/i;

const bankRegexes: Array<[string, RegExp]> = [
  ['HDFC', /\bHDFC(?:\s+Bank)?\b/i],
  ['AXIS', /\bAxis(?:\s+Bank)?\b/i],
  ['ICICI', /\bICICI(?:\s+Bank)?\b/i],
  ['SBI', /\bSBI(?:\s+Card|\s+Bank)?\b/i],
  ['INDUSIND', /\bIndusInd(?:\s+Bank)?\b/i],
  ['HSBC', /\bHSBC(?:\s+Bank)?\b/i],
  ['KOTAK', /\bKotak(?:\s+Bank)?\b/i],
];

const referenceRegex =
  /\b(?:ref(?:erence)?|txn(?:action)?\s+ref(?:erence)?|transaction\s+id)\s*(?:no\.?|number|:)\s*([A-Za-z0-9-]{6,})\b/i;

function normalizePaymentBank(raw: string): string | null {
  const norm = raw.trim().toLowerCase();
  switch (norm) {
    case 'sbi':
      return 'SBI';
    case 'axis':
      return 'AXIS';
    case 'hdfc':
      return 'HDFC';
    case 'icici':
      return 'ICICI';
    case 'indusind':
      return 'INDUSIND';
    case 'hsbc':
      return 'HSBC';
    case 'kotak':
      return 'KOTAK';
    default:
      return null;
  }
}

export const CardBillPaymentSmsParser = {
  parse(sender: string | null, messageBody: string): CardBillPaymentSms | null {
    if (!messageBody.trim()) return null;

    const text = messageBody.replace(/\u00A0/g, ' ').trim();
    const lower = text.toLowerCase();
    if (!/\bcredit\s+card\b/i.test(lower)) return null;

    const destinationPaymentSignal =
      /(?:credited\s+to|payment\s+(?:received|processed|successful|completed|credited)|received\s+(?:towards|for|on)|paid\s+(?:towards|for|on|to)).{0,120}\bcredit\s+card\b/is.test(
        lower
      ) ||
      /\bcredit\s+card\b.{0,100}(?:payment\s+(?:received|processed|successful|completed)|has\s+been\s+(?:processed|credited)|credited\s+to)/is.test(
        lower
      );

    if (!destinationPaymentSignal) return null;

    const amountMatch = amountRegex.exec(text);
    if (!amountMatch) return null;

    const rawNum = amountMatch[1].replace(/,/g, '');
    const num = parseFloat(rawNum);
    if (isNaN(num) || num <= 0) return null;
    const amountPaise = Math.round(num * 100);

    const bankAndCard = cardWithBankRegex.exec(text);
    let lastFour: string | null = null;
    if (bankAndCard && bankAndCard[2]) {
      lastFour = bankAndCard[2];
    } else {
      const cardSuffix = cardSuffixRegex.exec(text);
      if (cardSuffix && cardSuffix[1]) {
        lastFour = cardSuffix[1];
      }
    }
    if (!lastFour) return null;

    let bank: string | null = null;
    if (bankAndCard && bankAndCard[1]) {
      bank = normalizePaymentBank(bankAndCard[1]);
    }
    if (!bank) {
      for (const [name, regex] of bankRegexes) {
        if (regex.test(text)) {
          bank = name;
          break;
        }
      }
    }
    if (!bank) return null;

    let method: PaymentMethod = 'UNKNOWN';
    if (/\bUPI\b/i.test(text)) method = 'UPI';
    else if (/\bBBPS\b/i.test(text)) method = 'BANK_TRANSFER';
    else if (/\bNEFT\b/i.test(text)) method = 'NEFT';
    else if (/\bIMPS\b/i.test(text)) method = 'IMPS';
    else if (/\bRTGS\b/i.test(text)) method = 'RTGS';

    const refMatch = referenceRegex.exec(text);
    const reference = refMatch ? refMatch[1] : null;

    return {
      amountPaise,
      cardBank: bank,
      cardLastFour: lastFour,
      paymentMethod: method,
      reference,
      confidence: 0.98,
    };
  },
};
