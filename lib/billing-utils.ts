import {
  Sale,
  Payment,
  LedgerEntry,
  Party,
  PartyBalance,
  SaleCalculation,
} from './billing-types';

/**
 * Calculate sale metrics
 */
export const calculateSale = (
  birds: number,
  netWeight: number,
  rate: number,
  discount: number = 0
): SaleCalculation => {
  const avgWeight = birds > 0 ? netWeight / birds : 0;
  const grossAmount = netWeight * rate;
  const finalAmount = grossAmount - discount;

  return {
    avgWeight: parseFloat(avgWeight.toFixed(2)),
    grossAmount: parseFloat(grossAmount.toFixed(2)),
    finalAmount: parseFloat(finalAmount.toFixed(2)),
  };
};

/**
 * Calculate current balance from ledger entries
 */
export const calculateBalance = (
  openingBalance: number,
  ledgerEntries: LedgerEntry[]
): number => {
  const totalDebits = ledgerEntries
    .filter((e) => e.referenceType === 'Sale')
    .reduce((sum, e) => sum + e.debit, 0);

  const totalCredits = ledgerEntries
    .filter((e) => e.referenceType === 'Payment')
    .reduce((sum, e) => sum + e.credit, 0);

  return openingBalance + totalDebits - totalCredits;
};

/**
 * Check if party has exceeded credit limit
 */
export const isExceededCreditLimit = (
  currentBalance: number,
  creditLimit: number
): boolean => {
  return currentBalance > creditLimit;
};

/**
 * Get party balance summary with all aggregations
 */
export const getPartyBalanceSummary = (
  party: Party,
  sales: Sale[],
  payments: Payment[]
): PartyBalance => {
  const partySales = sales.filter((s) => s.partyId === party.id);
  const partyPayments = payments.filter((p) => p.partyId === party.id);

  const totalDebit = partySales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalCredit = partyPayments
    .filter((p) => p.status === 'Completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const currentBalance = party.openingBalance + totalDebit - totalCredit;
  const isExceeded = currentBalance > party.creditLimit;

  return {
    partyId: party.id,
    openingBalance: party.openingBalance,
    totalDebit,
    totalCredit,
    currentBalance,
    creditLimit: party.creditLimit,
    isExceeded,
    daysOverdue: isExceeded ? calculateDaysOverdue(party.paymentTerms) : 0,
  };
};

/**
 * Calculate days overdue based on payment terms
 */
export const calculateDaysOverdue = (paymentTerms: number): number => {
  const today = new Date();
  const daysElapsed = paymentTerms;
  return Math.max(0, daysElapsed);
};

/**
 * Format currency for India locale
 */
export const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

/**
 * Format currency with decimal places
 */
export const formatCurrencyWithDecimal = (amount: number, decimals = 2): string => {
  return amount.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Format date to DD-MM-YYYY
 */
export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-GB');
};

/**
 * Validate phone number (10 digits)
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  return /^\d{10}$/.test(phone.replace(/\s/g, ''));
};

/**
 * Validate party name
 */
export const isValidPartyName = (name: string): boolean => {
  return name.trim().length >= 3 && name.trim().length <= 100;
};

/**
 * Validate amount (must be positive)
 */
export const isValidAmount = (amount: number): boolean => {
  return amount > 0 && !isNaN(amount);
};

/**
 * Generate ledger entry reference ID
 */
export const generateLedgerReferenceId = (
  type: 'Opening' | 'Sale' | 'Payment',
  index: number
): string => {
  const prefix = {
    Opening: 'OPN',
    Sale: 'SAL',
    Payment: 'PAY',
  };
  return `${prefix[type]}${String(index).padStart(4, '0')}`;
};

/**
 * Calculate average weight per bird
 */
export const calculateAverageWeight = (
  totalWeight: number,
  numberOfBirds: number
): number => {
  if (numberOfBirds === 0) return 0;
  return parseFloat((totalWeight / numberOfBirds).toFixed(2));
};

/**
 * Calculate total debit for a party
 */
export const calculateTotalDebit = (sales: Sale[]): number => {
  return sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
};

/**
 * Calculate total credit for a party
 */
export const calculateTotalCredit = (payments: Payment[]): number => {
  return payments
    .filter((p) => p.status === 'Completed')
    .reduce((sum, payment) => sum + payment.amount, 0);
};

/**
 * Get status badge color based on balance and limit
 */
export const getBalanceStatusColor = (
  balance: number,
  creditLimit: number
): string => {
  if (balance < 0) return 'bg-blue-100 text-blue-800';
  if (balance > creditLimit) return 'bg-red-100 text-red-800';
  if (balance > creditLimit * 0.8) return 'bg-orange-100 text-orange-800';
  return 'bg-green-100 text-green-800';
};

/**
 * Get status text based on balance and limit
 */
export const getBalanceStatusText = (
  balance: number,
  creditLimit: number
): string => {
  if (balance < 0) return 'Overpaid';
  if (balance > creditLimit) return 'Exceeds Limit';
  if (balance > creditLimit * 0.8) return 'High Balance';
  return 'Good';
};

/**
 * Calculate payment mode statistics
 */
export const calculatePaymentModeStats = (payments: Payment[]) => {
  const completedPayments = payments.filter((p) => p.status === 'Completed');

  return {
    cash: completedPayments
      .filter((p) => p.mode === 'Cash')
      .reduce((sum, p) => sum + p.amount, 0),
    bank: completedPayments
      .filter((p) => p.mode === 'Bank')
      .reduce((sum, p) => sum + p.amount, 0),
    upi: completedPayments
      .filter((p) => p.mode === 'UPI')
      .reduce((sum, p) => sum + p.amount, 0),
    cheque: completedPayments
      .filter((p) => p.mode === 'Cheque')
      .reduce((sum, p) => sum + p.amount, 0),
    total: completedPayments.reduce((sum, p) => sum + p.amount, 0),
  };
};

/**
 * Calculate daily dispatch statistics
 */
export const calculateDailyDispatchStats = (sales: Sale[]) => {
  return {
    totalSales: sales.length,
    totalBirds: sales.reduce((sum, s) => sum + s.birds, 0),
    totalWeight: sales.reduce((sum, s) => sum + s.netWeight, 0),
    totalAmount: sales.reduce((sum, s) => sum + s.totalAmount, 0),
    totalDiscount: sales.reduce((sum, s) => sum + s.discount, 0),
    averageRate: sales.length > 0
      ? sales.reduce((sum, s) => sum + s.rate, 0) / sales.length
      : 0,
  };
};

/**
 * Export data to CSV format
 */
export const exportToCSV = (
  data: Array<Record<string, any>>,
  filename: string
): void => {
  const headers = Object.keys(data[0] || {});
  const csv = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((header) => `"${row[header] || ''}"`).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
