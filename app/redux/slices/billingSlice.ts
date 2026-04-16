import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  Party,
  Sale,
  Payment,
  LedgerEntry,
  BillingState,
} from '@/lib/billing-types';
import {
  calculateBalance,
  calculateTotalDebit,
  calculateTotalCredit,
  generateLedgerReferenceId,
} from '@/lib/billing-utils';

const initialState: BillingState = {
  parties: [
    {
      id: 'P1',
      name: 'Sharma Poultry Shop',
      type: 'Retailer',
      phone: '9876543210',
      address: 'Delhi',
      openingBalance: 0,
      currentBalance: 0,
      creditLimit: 100000,
      paymentTerms: 30,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'P2',
      name: 'Patel Farms',
      type: 'Farm',
      phone: '9876543211',
      address: 'Gujarat',
      openingBalance: 0,
      currentBalance: 0,
      creditLimit: 200000,
      paymentTerms: 30,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'P3',
      name: 'Delhi Bird Distributor',
      type: 'Distributor',
      phone: '9876543212',
      address: 'Delhi',
      openingBalance: 0,
      currentBalance: 0,
      creditLimit: 150000,
      paymentTerms: 30,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ],
  sales: [
    {
      id: 'S1',
      partyId: 'P1',
      date: '2024-04-08',
      birds: 500,
      netWeight: 2500,
      avgWeight: 5.0,
      rate: 210,
      discount: 1000,
      totalAmount: 524000,
      vehicleNo: 'DL-01-AB-1234',
      remarks: 'Broiler birds - fresh dispatch',
      createdAt: '2024-04-08T00:00:00Z',
      updatedAt: '2024-04-08T00:00:00Z',
    },
    {
      id: 'S2',
      partyId: 'P2',
      date: '2024-04-08',
      birds: 1000,
      netWeight: 4800,
      avgWeight: 4.8,
      rate: 205,
      discount: 0,
      totalAmount: 984000,
      vehicleNo: 'GJ-02-CD-5678',
      createdAt: '2024-04-08T00:00:00Z',
      updatedAt: '2024-04-08T00:00:00Z',
    },
    {
      id: 'S3',
      partyId: 'P3',
      date: '2024-04-07',
      birds: 750,
      netWeight: 3375,
      avgWeight: 4.5,
      rate: 215,
      discount: 500,
      totalAmount: 725125,
      vehicleNo: 'DL-01-XY-9876',
      createdAt: '2024-04-07T00:00:00Z',
      updatedAt: '2024-04-07T00:00:00Z',
    },
  ],
  payments: [
    {
      id: 'PAY1',
      partyId: 'P1',
      date: '2024-04-08',
      mode: 'Cash',
      amount: 100000,
      reference: '',
      remarks: 'Partial payment for April',
      status: 'Completed',
      createdAt: '2024-04-08T00:00:00Z',
      updatedAt: '2024-04-08T00:00:00Z',
    },
    {
      id: 'PAY2',
      partyId: 'P2',
      date: '2024-04-07',
      mode: 'Bank',
      amount: 250000,
      reference: 'TXN123456',
      remarks: 'Online transfer',
      status: 'Completed',
      createdAt: '2024-04-07T00:00:00Z',
      updatedAt: '2024-04-07T00:00:00Z',
    },
    {
      id: 'PAY3',
      partyId: 'P3',
      date: '2024-04-06',
      mode: 'UPI',
      amount: 75000,
      reference: 'UPI12345678',
      remarks: 'Google Pay transfer',
      status: 'Completed',
      createdAt: '2024-04-06T00:00:00Z',
      updatedAt: '2024-04-06T00:00:00Z',
    },
  ],
  ledger: [],
  loading: false,
  error: null,
  selectedPartyId: null,
};

const billingSlice = createSlice({
  name: 'billing',
  initialState,
  reducers: {
    // Party Actions
    setParties: (state, action: PayloadAction<Party[]>) => {
      state.parties = action.payload;
    },

    addParty: (state, action: PayloadAction<Party>) => {
      state.parties.push(action.payload);
    },

    updateParty: (state, action: PayloadAction<Party>) => {
      const index = state.parties.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.parties[index] = action.payload;
      }
    },

    deleteParty: (state, action: PayloadAction<string>) => {
      state.parties = state.parties.filter((p) => p.id !== action.payload);
    },

    selectParty: (state, action: PayloadAction<string | null>) => {
      state.selectedPartyId = action.payload;
    },

    updatePartyBalance: (
      state,
      action: PayloadAction<{ partyId: string; newBalance: number }>
    ) => {
      const party = state.parties.find((p) => p.id === action.payload.partyId);
      if (party) {
        party.currentBalance = action.payload.newBalance;
        party.updatedAt = new Date().toISOString();
      }
    },

    // Sale Actions
    setSales: (state, action: PayloadAction<Sale[]>) => {
      state.sales = action.payload;
    },

    addSale: (state, action: PayloadAction<Sale>) => {
      state.sales.push(action.payload);

      // Create ledger entry for the sale
      const ledgerEntry: LedgerEntry = {
        id: `LED${Date.now()}`,
        partyId: action.payload.partyId,
        referenceType: 'Sale',
        referenceId: action.payload.id,
        debit: action.payload.totalAmount,
        credit: 0,
        balance: 0,
        date: action.payload.date,
        createdAt: new Date().toISOString(),
      };

      state.ledger.push(ledgerEntry);

      // Update party balance
      const party = state.parties.find((p) => p.id === action.payload.partyId);
      if (party) {
        party.currentBalance += action.payload.totalAmount;
        party.updatedAt = new Date().toISOString();
      }
    },

    deleteSale: (state, action: PayloadAction<string>) => {
      const sale = state.sales.find((s) => s.id === action.payload);
      if (sale) {
        // Remove from sales
        state.sales = state.sales.filter((s) => s.id !== action.payload);

        // Remove ledger entry
        state.ledger = state.ledger.filter(
          (l) =>
            !(l.referenceType === 'Sale' && l.referenceId === action.payload)
        );

        // Revert party balance
        const party = state.parties.find((p) => p.id === sale.partyId);
        if (party) {
          party.currentBalance -= sale.totalAmount;
          party.updatedAt = new Date().toISOString();
        }
      }
    },

    updateSale: (state, action: PayloadAction<Sale>) => {
      const index = state.sales.findIndex((s) => s.id === action.payload.id);
      if (index !== -1) {
        const oldSale = state.sales[index];
        state.sales[index] = action.payload;

        // Update ledger entry
        const ledgerIndex = state.ledger.findIndex(
          (l) => l.referenceType === 'Sale' && l.referenceId === action.payload.id
        );
        if (ledgerIndex !== -1) {
          state.ledger[ledgerIndex] = {
            ...state.ledger[ledgerIndex],
            debit: action.payload.totalAmount,
            date: action.payload.date,
          };
        }

        // Update party balance
        const party = state.parties.find((p) => p.id === action.payload.partyId);
        if (party) {
          party.currentBalance -= oldSale.totalAmount;
          party.currentBalance += action.payload.totalAmount;
          party.updatedAt = new Date().toISOString();
        }
      }
    },

    // Payment Actions
    setPayments: (state, action: PayloadAction<Payment[]>) => {
      state.payments = action.payload;
    },

    addPayment: (state, action: PayloadAction<Payment>) => {
      state.payments.push(action.payload);

      if (action.payload.status === 'Completed') {
        // Create ledger entry for the payment
        const ledgerEntry: LedgerEntry = {
          id: `LED${Date.now()}`,
          partyId: action.payload.partyId,
          referenceType: 'Payment',
          referenceId: action.payload.id,
          debit: 0,
          credit: action.payload.amount,
          balance: 0,
          date: action.payload.date,
          createdAt: new Date().toISOString(),
        };

        state.ledger.push(ledgerEntry);

        // Update party balance
        const party = state.parties.find((p) => p.id === action.payload.partyId);
        if (party) {
          party.currentBalance -= action.payload.amount;
          party.updatedAt = new Date().toISOString();
        }
      }
    },

    deletePayment: (state, action: PayloadAction<string>) => {
      const payment = state.payments.find((p) => p.id === action.payload);
      if (payment && payment.status === 'Completed') {
        // Remove from payments
        state.payments = state.payments.filter((p) => p.id !== action.payload);

        // Remove ledger entry
        state.ledger = state.ledger.filter(
          (l) =>
            !(l.referenceType === 'Payment' && l.referenceId === action.payload)
        );

        // Revert party balance
        const party = state.parties.find((p) => p.id === payment.partyId);
        if (party) {
          party.currentBalance += payment.amount;
          party.updatedAt = new Date().toISOString();
        }
      }
    },

    updatePayment: (state, action: PayloadAction<Payment>) => {
      const index = state.payments.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        const oldPayment = state.payments[index];
        state.payments[index] = action.payload;

        // Update ledger entry if status is completed
        const ledgerIndex = state.ledger.findIndex(
          (l) => l.referenceType === 'Payment' && l.referenceId === action.payload.id
        );
        if (ledgerIndex !== -1) {
          if (action.payload.status === 'Completed') {
            state.ledger[ledgerIndex] = {
              ...state.ledger[ledgerIndex],
              credit: action.payload.amount,
              date: action.payload.date,
            };
          } else {
            // Remove ledger entry if not completed
            state.ledger.splice(ledgerIndex, 1);
          }
        } else if (action.payload.status === 'Completed') {
          // Add ledger entry if now completed
          const ledgerEntry: LedgerEntry = {
            id: `LED${Date.now()}`,
            partyId: action.payload.partyId,
            referenceType: 'Payment',
            referenceId: action.payload.id,
            debit: 0,
            credit: action.payload.amount,
            balance: 0,
            date: action.payload.date,
            createdAt: new Date().toISOString(),
          };
          state.ledger.push(ledgerEntry);
        }

        // Update party balance
        const party = state.parties.find((p) => p.id === action.payload.partyId);
        if (party) {
          if (oldPayment.status === 'Completed') {
            party.currentBalance += oldPayment.amount;
          }
          if (action.payload.status === 'Completed') {
            party.currentBalance -= action.payload.amount;
          }
          party.updatedAt = new Date().toISOString();
        }
      }
    },

    updatePaymentStatus: (
      state,
      action: PayloadAction<{
        paymentId: string;
        status: 'Completed' | 'Pending' | 'Failed';
      }>
    ) => {
      const payment = state.payments.find((p) => p.id === action.payload.paymentId);
      if (payment) {
        const oldStatus = payment.status;
        payment.status = action.payload.status;

        // Handle ledger and balance updates based on status change
        if (oldStatus === 'Pending' && action.payload.status === 'Completed') {
          // Create ledger entry
          const ledgerEntry: LedgerEntry = {
            id: `LED${Date.now()}`,
            partyId: payment.partyId,
            referenceType: 'Payment',
            referenceId: payment.id,
            debit: 0,
            credit: payment.amount,
            balance: 0,
            date: payment.date,
            createdAt: new Date().toISOString(),
          };
          state.ledger.push(ledgerEntry);

          // Update balance
          const party = state.parties.find((p) => p.id === payment.partyId);
          if (party) {
            party.currentBalance -= payment.amount;
          }
        }
      }
    },

    // Ledger Actions
    setLedger: (state, action: PayloadAction<LedgerEntry[]>) => {
      state.ledger = action.payload;
    },

    // UI Actions
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Calculate all balances (call when data is loaded)
    calculateAllBalances: (state) => {
      state.parties.forEach((party) => {
        const openingBalance = party.openingBalance;
        const partySales = state.sales.filter((s) => s.partyId === party.id);
        const partyPayments = state.payments
          .filter((p) => p.partyId === party.id && p.status === 'Completed');

        const totalDebit = calculateTotalDebit(partySales);
        const totalCredit = calculateTotalCredit(partyPayments);
        party.currentBalance = openingBalance + totalDebit - totalCredit;
      });
    },
  },
});

export const {
  setParties,
  addParty,
  updateParty,
  deleteParty,
  selectParty,
  updatePartyBalance,
  setSales,
  addSale,
  updateSale,
  deleteSale,
  setPayments,
  addPayment,
  updatePayment,
  deletePayment,
  updatePaymentStatus,
  setLedger,
  setLoading,
  setError,
  calculateAllBalances,
} = billingSlice.actions;

export default billingSlice.reducer;
