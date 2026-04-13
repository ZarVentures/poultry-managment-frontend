# 📘 Billing Module - Complete Developer Documentation

## 🎯 Overview

The Billing Module is a **Running Ledger-Based Poultry Trading System** designed for live bird sales to retailers and traders. It's **NOT a standard GST-based invoice system** but a specialized ledger system for poultry farm operations.

### Key Features:
- ✅ Party Master (Retailer Management)
- ✅ Sale Entry (Bird Dispatch Recording)
- ✅ Payment Entry (Cash/Bank/UPI/Cheque)
- ✅ Running Ledger (Automatic Balance Calculation)
- ✅ Credit Limit Management
- ✅ Multiple Reports (Outstanding, Dispatch, Collection)
- ✅ No GST Calculation

---

## 📁 File Structure

```
app/billing/
├── page.tsx                    # Main dashboard
├── party-master/
│   └── page.tsx               # Party list & form
├── sale-entry/
│   └── page.tsx               # Sale entry form & list
├── payment-entry/
│   └── page.tsx               # Payment entry form & list
├── ledger/
│   └── page.tsx               # Running ledger report
└── reports/
    ├── outstanding/
    │   └── page.tsx           # Outstanding balance report
    ├── dispatch/
    │   └── page.tsx           # Daily dispatch report
    └── collection/
        └── page.tsx           # Collection report

lib/
├── billing-types.ts           # TypeScript types
├── billing-utils.ts           # Utility functions

app/redux/
└── slices/
    └── billingSlice.ts        # Redux state management
```

---

## 🔄 Data Flow Architecture

### Complete System Flow

```
┌─────────────────────────────────────────────────────┐
│                 Billing Module                      │
│                                                     │
│  ┌──────────────┐                                   │
│  │ Party Master │ ──> Creates Party Entity          │
│  └──────────────┘     Sets Opening Balance          │
│         │                                           │
│         ▼                                           │
│  ┌──────────────┐                                   │
│  │ Sale Entry   │ ──> Records Bird Dispatch         │
│  └──────────────┘     Calculates Amount             │
│         │             Creates DEBIT Entry           │
│         │                                           │
│         ▼                                           │
│  ┌────────────┐                                     │
│  │ Ledger     │ ◄─── Updates Running Balance       │
│  │ System     │                                     │
│  └────────────┘                                     │
│         ▲                                           │
│         │                                           │
│         │             Creates CREDIT Entry          │
│         │                                           │
│  ┌──────────────────┐                               │
│  │ Payment Entry    │ ──> Records Payment           │
│  └──────────────────┘     Updates Balance           │
│                                                     │
│  ┌──────────────────────────────────────────┐       │
│  │ Reports (Outstanding, Dispatch, etc.)    │       │
│  └──────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema

### Party Table
```typescript
interface Party {
  id: string;
  name: string;
  type: 'Retailer' | 'Farm' | 'Trader' | 'Distributor';
  phone: string;
  address: string;
  openingBalance: number;
  currentBalance: number;        // Running balance
  creditLimit: number;           // Max outstanding allowed
  paymentTerms: number;          // Days (e.g., 30, 15, 7)
  createdAt: string;
  updatedAt: string;
}
```

### Sale Table
```typescript
interface Sale {
  id: string;
  partyId: string;
  date: string;
  birds: number;                 // Number of birds
  netWeight: number;             // Total weight in kg
  avgWeight: number;             // Auto-calculated: netWeight / birds
  rate: number;                  // Per kg rate
  discount: number;              // Discount amount
  totalAmount: number;           // Final Amount = (netWeight × rate) - discount
  vehicleNo: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Payment Table
```typescript
interface Payment {
  id: string;
  partyId: string;
  date: string;
  mode: 'Cash' | 'Bank' | 'UPI' | 'Cheque';
  amount: number;
  reference?: string;            // Transaction ID
  remarks?: string;
  status: 'Completed' | 'Pending' | 'Failed';
  createdAt: string;
  updatedAt: string;
}
```

### Ledger Table
```typescript
interface LedgerEntry {
  id: string;
  partyId: string;
  referenceType: 'Opening' | 'Sale' | 'Payment';
  referenceId: string;           // Links to Party/Sale/Payment ID
  debit: number;                 // Sale amount (adds to outstanding)
  credit: number;                // Payment amount (reduces outstanding)
  balance: number;               // Running balance
  date: string;
  createdAt: string;
}
```

---

## 🔢 Calculation Formulas

### Sale Calculation
```javascript
Average Weight = Net Weight ÷ Birds
Gross Amount = Net Weight × Rate per kg
Final Amount = Gross Amount - Discount

// Creates DEBIT entry in ledger
New Balance = Previous Balance + Final Amount
```

### Payment Entry
```javascript
// Creates CREDIT entry in ledger
New Balance = Previous Balance - Payment Amount
```

### Running Balance
```javascript
Current Balance = Opening Balance + Total Debits - Total Credits
Is Exceeded = Current Balance > Credit Limit
```

---

## 🎨 UI Components Used

### From shadcn/ui:
- `Button` - Action buttons
- `Card` - Content containers
- `Input` - Text/number inputs
- `Table` - Data display
- `Dialog` - Modal forms
- `Select` - Dropdown selections
- `Alert` - Status messages
- `Badge` - Status tags

### Icons (Lucide):
- `Users`, `ShoppingCart`, `CreditCard` - Main actions
- `TrendingUp`, `TrendingDown` - Analytics
- `AlertCircle`, `AlertTriangle` - Warnings
- `Edit`, `Trash2`, `Plus` - CRUD operations

---

## 🎯 Key Implementation Details

### 1. Party Master Module

**Routes:**
- `/billing/party-master` - List all parties
- `/billing/party-master/[id]` - Edit party

**Features:**
- Create new party with opening balance
- Edit party details and credit limit
- Search by name or phone
- Filter by party type
- Delete party (if no transactions)

**Validation:**
- Phone: 10 digits
- Name: 3-100 characters
- Opening balance: Positive number
- Credit limit: Greater than 0

---

### 2. Sale Entry Module

**Routes:**
- `/billing/sale-entry` - List and create sales
- Calculate average weight automatically
- Calculate final amount automatically

**Calculation Logic:**
```typescript
// When user enters: birds, netWeight, rate, discount
const calculate = (birds, weight, rate, discount) => {
  avgWeight = weight / birds;
  grossAmount = weight * rate;
  finalAmount = grossAmount - discount;
  return { avgWeight, grossAmount, finalAmount };
};
```

**Impact:**
1. Debit amount added to party balance
2. Ledger entry created automatically
3. Stock deducted from inventory
4. Updates `Party.currentBalance`

---

### 3. Payment Entry Module

**Routes:**
- `/billing/payment-entry` - List and create payments

**Payment Methods:**
- **Cash** - Immediate completion
- **Bank** - Need transaction ID, can be pending
- **UPI** - Digital payment with transaction ID
- **Cheque** - Pending until cleared

**Impact:**
1. Credit amount deducted from party balance
2. Ledger entry created
3. Can mark as Completed/Pending/Failed
4. Updates `Party.currentBalance`

---

### 4. Ledger Report Module

**Routes:**
- `/billing/ledger?party=[partyId]`

**Features:**
- Show all transactions for a party
- Running balance calculation
- Filter by date range
- Display totals (Debit, Credit)
- Color-coded entries by type
- Export to PDF functionality

**Ledger Format:**
```
Date | Remarks | Type | Ref ID | Debit | Credit | Balance
------|---------|------|--------|-------|--------|--------
      | Opening |      |        |       |        | 50,000
04-02 | Sale    | SAL001 | 105,000 |      | 155,000
04-03 | Payment | PAY001 |        | 100,000 | 55,000
```

---

### 5. Reports Module

#### a) Outstanding Report (`/billing/reports/outstanding`)
- Show all parties with current balance
- Highlight exceeded credit limit
- Identify overdue parties
- Sort by balance or days overdue

#### b) Daily Dispatch Report (`/billing/reports/dispatch`)
- Sales by date
- Show birds, weight, amount
- Calculate discount percentage
- Daily summary totals

#### c) Collection Report (`/billing/reports/collection`)
- Payment received analysis
- Break down by payment mode
- Show pending clearance
- Collection rate percentage

---

## 🔧 Redux State Management

### Store Structure
```typescript
state.billing = {
  parties: Party[];
  sales: Sale[];
  payments: Payment[];
  ledger: LedgerEntry[];
  loading: boolean;
  error: string | null;
  selectedPartyId: string | null;
}
```

### Key Reducers
```typescript
// Party operations
addParty(state, party)
updateParty(state, party)
deleteParty(state, partyId)

// Sale operations (also creates ledger entry)
addSale(state, sale)              // Updates balance
deleteSale(state, saleId)         // Reverts balance

// Payment operations (also creates ledger entry)
addPayment(state, payment)        // Updates balance if completed
updatePaymentStatus(...)          // Handle pending to completed

// Utility
calculateAllBalances(state)       // Recalculate all party balances
```

---

## 📱 API Integration Points

### Backend Endpoints Required

```typescript
// Party API
GET    /api/billing/parties
POST   /api/billing/parties
PATCH  /api/billing/parties/:id
DELETE /api/billing/parties/:id

// Sale API
GET    /api/billing/sales
POST   /api/billing/sales        // Auto creates ledger entry
DELETE /api/billing/sales/:id

// Payment API
GET    /api/billing/payments
POST   /api/billing/payments     // Auto creates ledger entry
PATCH  /api/billing/payments/:id/status

// Ledger API
GET    /api/billing/ledger/:partyId
GET    /api/billing/ledger/:partyId/balance

// Reports API
GET    /api/billing/reports/outstanding
GET    /api/billing/reports/dispatch?date=...
GET    /api/billing/reports/collection?from=...&to=...
```

---

## ✅ Validation & Error Handling

### Party Validation
```typescript
- Phone: /^\d{10}$/
- Name length: 3-100 chars
- Amounts: > 0
- Payment terms: 1-365 days
```

### Sale Validation
```typescript
- Birds > 0
- Net weight > 0
- Rate > 0
- Deduct from stock
- Party exists
```

### Payment Validation
```typescript
- Amount > 0
- Amount ≤ Current balance (optional)
- Mode selected
- Party exists
```

### Ledger Validation
```typescript
- All entries must have valid party
- Balance must match calculations
- No duplicate transactions
```

---

## 🎓 Frontend Implementation Guide

### 1. Add to Navigation
```typescript
// In main layout or sidebar
{
  title: "Billing",
  href: "/billing",
  icon: CreditCard,
  sub: [
    { title: "Dashboard", href: "/billing" },
    { title: "Party Master", href: "/billing/party-master" },
    { title: "Sale Entry", href: "/billing/sale-entry" },
    { title: "Payment Entry", href: "/billing/payment-entry" },
    { title: "Ledger Report", href: "/billing/ledger" },
    { title: "Reports", href: "/billing/reports" },
  ]
}
```

### 2. Connect Redux
```typescript
// In store.tsx
import billingReducer from '@/app/redux/slices/billingSlice';

export const store = configureStore({
  reducer: {
    // ... other reducers
    billing: billingReducer,
  },
});
```

### 3. Fetch Data on Load
```typescript
useEffect(() => {
  dispatch(setLoading(true));
  
  Promise.all([
    fetch('/api/billing/parties').then(r => r.json()),
    fetch('/api/billing/sales').then(r => r.json()),
    fetch('/api/billing/payments').then(r => r.json()),
  ])
  .then(([parties, sales, payments]) => {
    dispatch(setParties(parties));
    dispatch(setSales(sales));
    dispatch(setPayments(payments));
    dispatch(calculateAllBalances());
  })
  .catch(error => dispatch(setError(error.message)))
  .finally(() => dispatch(setLoading(false)));
}, []);
```

---

## 🐛 Common Issues & Solutions

### Issue: Balance not updating
**Solution:** Call `calculateAllBalances()` in Redux after data changes

### Issue: Ledger entries duplicating
**Solution:** Check if ledger entry already exists before creating

### Issue: Credit limit not enforced
**Solution:** Check `isExceededCreditLimit()` before creating sale

### Issue: Payment mode reference ID required
**Solution:** Validate reference ID based on payment mode (Bank/UPI/Cheque require ID)

---

## 🚀 Future Enhancements

- [ ] SMS notifications for overdue parties
- [ ] Automated dunning letters
- [ ] Return/debit note management
- [ ] Multi-user permission levels
- [ ] Automated end-of-month closing
- [ ] PDF ledger generation
- [ ] Email collection reminders
- [ ] Dashboard widgets
- [ ] Mobile app integration

---

## 📞 Support & Contact

For questions or issues:
1. Check utility functions in `billing-utils.ts`
2. Review type definitions in `billing-types.ts`
3. Check Redux slice implementation
4. Review API error handling

---

**Last Updated:** April 9, 2024
**Version:** 1.0.0
**Status:** Production Ready ✅
