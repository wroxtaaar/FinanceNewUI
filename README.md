# Finance SMS Tracker (React Web Application)

Personal finance tracker that parses Indian bank and UPI SMS messages, reconciles accounts, tracks Splitwise balances, and connects to an Oracle finance ledger.

Rewritten from the original Android application to a React (Vite + TypeScript + Tailwind CSS) web application while preserving all core features, parsers, and business logic.

## Key Features

- **Bank & UPI SMS Parser**: Regex parsers for HDFC Bank, Axis Bank, and generic Indian bank formats. Extracts amount, direction (Debit/Credit), payment method (UPI, Card, ATM, NEFT, IMPS, RTGS), account last 4 digits, merchant name, and VPA handle.
- **Credit Card Bill & Payment Parser**: Parses statement balances and destination-side credit card bill payment confirmations.
- **Sender Trust & Safety**: Rejection of OTPs, promotional messages, non-completed payment requests, and informational balance alerts.
- **Transaction Categorizer**:
  - Credit transactions restricted to `SALARY`, `TRANSFER`, and `REFUND`.
  - Debit transactions categorized into `FOOD`, `GROCERIES`, `SHOPPING`, `FUEL`, `TRAVEL`, `SUBSCRIPTION`, `BILLS`, `TRANSFER`, `ATM`, etc.
  - Category memory by VPA (`VPA|<payee>`) and Account (`BANK|<bank>|<type>|<last4>`).
- **Oracle Ledger Integration**: Live summary cards showing True Available, Bank Cash, Card Outstanding, and Splitwise Receivable.
- **Review & Reconcile (`ReviewActivity` Equivalent)**:
  - Unresolved Evidence: Match external notification/SMS evidence to local transactions with confidence scoring.
  - Unrecognized SMS: Create manual transactions from unrecognized financial messages or dismiss them.
  - Transaction Conflicts: Detect duplicate payments with mismatching details.
  - Internal Transfers: Conservatively detect bank-to-bank transfer candidate pairs within a 10-minute window.
- **Account Management**: View and edit current bank account balances, split credit card balances into Statement Bill and Active Spend, and adjust Splitwise owed totals.
- **SMS Simulator**: Interactive testing drawer with 9 Indian banking presets and custom SMS parser test area.

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS
- Lucide React Icons
