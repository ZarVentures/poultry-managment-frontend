// Billing Module Type Definitions

export interface Party {
  id: string;
  name: string;
  type: 'Retailer' | 'Farm' | 'Trader' | 'Distributor';
  phone: string;
  address: string;
  openingBalance: number;
  currentBalance: number;
  creditLimit: number;
  paymentTerms: number;
  createdAt: string;
  updatedAt: string;
}

export interface Sale {
  id: string;
  partyId: string;
  date: string;
  birds: number;
  netWeight: number;
  avgWeight: number;
  rate: number;
  discount: number;
  totalAmount: number;
  vehicleNo: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  partyId: string;
  date: string;
  mode: 'Cash' | 'Bank' | 'UPI' | 'Cheque';
  amount: number;
  reference?: string;
  remarks?: string;
  status: 'Completed' | 'Pending' | 'Failed';
  createdAt: string;
  updatedAt: string;
}

export interface LedgerEntry {
  id: string;
  partyId: string;
  referenceType: 'Opening' | 'Sale' | 'Payment';
  referenceId: string;
  debit: number;
  credit: number;
  balance: number;
  date: string;
  createdAt: string;
}

export interface BillingState {
  parties: Party[];
  sales: Sale[];
  payments: Payment[];
  ledger: LedgerEntry[];
  loading: boolean;
  error: string | null;
  selectedPartyId: string | null;
}

export interface SaleCalculation {
  avgWeight: number;
  grossAmount: number;
  finalAmount: number;
}

export interface PartyBalance {
  partyId: string;
  openingBalance: number;
  totalDebit: number;
  totalCredit: number;
  currentBalance: number;
  creditLimit: number;
  isExceeded: boolean;
  daysOverdue: number;
}
