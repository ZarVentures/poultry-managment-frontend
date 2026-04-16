# 💰 Billing Module - Quick Start Guide

## 🚀 Quick Navigation

| Module | Route | Purpose |
|--------|-------|---------|
| **Dashboard** | `/billing` | Main overview & KPIs |
| **Party Master** | `/billing/party-master` | Manage retailers & partners |
| **Sale Entry** | `/billing/sale-entry` | Record bird dispatch |
| **Payment Entry** | `/billing/payment-entry` | Record payment received |
| **Ledger Report** | `/billing/ledger` | View running ledger |
| **Outstanding Report** | `/billing/reports/outstanding` | Credit status |
| **Daily Dispatch** | `/billing/reports/dispatch` | Sales by date |
| **Collection** | `/billing/reports/collection` | Payments analysis |

---

## 📌 Core Concepts

### 1. **Running Ledger System**
Unlike traditional invoicing, this system maintains a **running balance** for each party. Every transaction (sale or payment) updates the balance in real-time.

### 2. **No GST**
This system is specifically designed for live bird trading where **no GST is applicable**. Rates are straightforward (₹/kg).

### 3. **Credit Limit Control**
Each retailer has a credit limit. If outstanding balance exceeds the limit:
- ⚠️ Alert is displayed
- Optionally block further sales (configurable)

### 4. **Payment Modes**
- **Cash**: Immediate completion
- **Bank Transfer**: Needs transaction ID
- **UPI**: Digital payment
- **Cheque**: Pending until cleared

---

## 🔑 Key Operations

### Creating a Party
```
1. Go to: /billing/party-master
2. Click: "Add New Party"
3. Fill:
   - Party Name (e.g., "Sharma Poultry Shop")
   - Type (Retailer/Farm/Trader/Distributor)
   - Mobile (10-digit)
   - Address
   - Opening Balance (initial credit given)
   - Credit Limit (max outstanding allowed)
   - Payment Terms (30/15/7 days)
4. Save ✓
```

### Recording a Sale
```
1. Go to: /billing/sale-entry
2. Click: "New Sale Entry"
3. Fill:
   - Date
   - Party Name
   - Vehicle Number
   - Birds Count
   - Net Weight (kg)
   - Avg Weight (auto-calculated)
   - Rate per kg
   - Discount (if any)
4. System auto-calculates:
   Final Amount = (Net Weight × Rate) - Discount
5. Save ✓
   → Debit entry created in ledger
   → Party balance updated
   → Stock deducted
```

### Recording a Payment
```
1. Go to: /billing/payment-entry
2. Click: "Record Payment"
3. Fill:
   - Date
   - Party Name
   - Payment Mode
   - Amount
   - Reference (for Bank/UPI/Cheque)
   - Remarks
4. Save ✓
   → Credit entry created in ledger
   → Party balance updated
```

### Viewing Ledger
```
1. Go to: /billing/ledger
2. Select Party from dropdown
3. Choose date range
4. View all transactions
5. Download/Print if needed
```

---

## 📊 Understanding the Reports

### Outstanding Report
Shows current balance for all parties with:
- Opening balance
- Total debits (sales)
- Total credits (payments)
- Current balance
- Credit limit status

**Use for:** Collection management, identifying problematic accounts

### Daily Dispatch Report
Shows all sales for a selected date with:
- Birds count
- Weight and average weight
- Rate and amounts
- Discounts given

**Use for:** Daily reconciliation, inventory tracking

### Collection Report
Shows payment received with:
- Payment mode breakdown (Cash/Bank/UPI/Cheque)
- Pending clearance items
- Collection rate percentage

**Use for:** Cash flow analysis, payment tracking

---

## 🔢 Calculation Examples

### Example 1: Sale Entry
```
Party: Sharma Poultry Shop
Birds: 500
Net Weight: 2500 kg
Rate: ₹210/kg
Discount: ₹1000

Calculation:
- Average Weight = 2500 ÷ 500 = 5.0 kg/bird
- Gross Amount = 2500 × 210 = ₹525,000
- Final Amount = 525,000 - 1,000 = ₹524,000

→ Creates DEBIT of ₹524,000 in party ledger
→ Party balance increases by ₹524,000
```

### Example 2: Running Balance
```
Opening Balance: ₹50,000

Apr 02: Sale ₹105,000    → Balance = 50,000 + 105,000 = 155,000
Apr 03: Payment ₹100,000 → Balance = 155,000 - 100,000 = 55,000
Apr 04: Sale ₹63,000     → Balance = 55,000 + 63,000 = 118,000
Apr 05: Payment ₹105,500 → Balance = 118,000 - 105,500 = 12,500

Final Balance: ₹12,500 (Outstanding)
```

### Example 3: Credit Limit Alert
```
Party: Mehta Poultry Hub
Credit Limit: ₹75,000
Current Balance: ₹100,000

Status: ⚠️ EXCEEDS LIMIT by ₹25,000
Action: Take immediate payment or restrict further sales
```

---

## ⚙️ System Settings (Admin)

Configure in admin panel:
```
☐ Allow sales beyond credit limit
☐ Auto-calculate average weight
☐ Allow backdated entry
☐ Lock ledger after month closing
☐ Send SMS for overdue parties
☐ Email collection reminders
```

---

## 🎨 UI Elements Reference

### Status Badges
```
🟢 Good       → Balance < 80% of credit limit
🟠 High       → Balance 80-100% of credit limit
🔴 Exceeds    → Balance > credit limit
🔵 Overpaid   → Balance < 0 (they've overpaid)
```

### Button Colors
```
🟦 Blue   → Navigation/View
🟩 Green  → Save/Create
🟨 Yellow → Caution/Warning
🟥 Red    → Delete/Danger
```

### Transaction Types (Ledger)
```
📋 Opening    → Initial balance
📥 Sale       → Debit (adds to outstanding)
📤 Payment    → Credit (reduces outstanding)
```

---

## 📋 Common Workflows

### Workflow 1: Daily Opening
```
1. Check Dashboard KPIs
2. Review overnight sales (if batch)
3. Check Outstanding Report for overdue
4. Ensure stock updated
```

### Workflow 2: Collection Drive
```
1. Open Outstanding Report
2. Sort by "Days Overdue"
3. Identify high-outstanding parties
4. Record payments in Payment Entry
5. Monitor updated balances
```

### Workflow 3: Month-End Closing
```
1. Generate Outstanding Report
2. Generate Collection Report
3. Reconcile ledger totals
4. Identify outstanding items
5. Lock ledger (if configurable)
```

---

## 🔍 Search & Filter Tips

### Party Master
```
Search: By name or phone number
Filter: By party type (Retailer/Farm/Trader)
Sort: By name, opening balance, current balance
```

### Sale Entry
```
Filter: By date range
Filter: By party name
Sort: By date (newest first)
```

### Payment Entry
```
Filter: By date range
Filter: By party name
Sort: By amount (highest first)
```

### Ledger
```
Select: Specific party
Date Range: Custom from-to dates
Export: To PDF or CSV
Print: Formatted ledger
```

---

## ⚡ Performance Tips

1. **Bulk Uploads**: For multiple parties/sales, use batch import (future feature)
2. **Caching**: Ledger is calculated server-side for large datasets
3. **Archives**: Archive old data to keep system fast
4. **Reports**: Generate reports during off-peak hours

---

## 🆘 Troubleshooting

### Balance Not Updating
- [ ] Refresh the page
- [ ] Check if transaction is marked "Completed"
- [ ] Verify party exists and is not deleted

### Can't Create Sale
- [ ] Check if party exists
- [ ] Verify birds count > 0
- [ ] Verify net weight > 0
- [ ] Check stock availability

### Payment Not Showing in Ledger
- [ ] Check if payment status is "Completed"
- [ ] Check if party is correct
- [ ] Verify payment was saved

### Export Not Working
- [ ] Check browser popup blocker
- [ ] Try different browser
- [ ] Check file size is reasonable

---

## 📞 Developer Reference

### Key Files
```
app/billing/                    # UI Pages
lib/billing-types.ts            # Type definitions
lib/billing-utils.ts            # Calculation functions
app/redux/slices/billingSlice.ts # State management
docs/BILLING_MODULE_DOCS.md     # Full documentation
```

### Utility Functions
```typescript
import { 
  calculateSale,              // Sale calculations
  calculateBalance,           // Running balance
  isExceededCreditLimit,      // Credit check
  formatCurrency,             // Format ₹
  formatDate,                 // Format dates
  calculatePaymentModeStats,  // Payment analysis
  calculateDailyDispatchStats // Daily stats
} from '@/lib/billing-utils';
```

### Redux Usage
```typescript
import { useDispatch, useSelector } from 'react-redux';
import { 
  addParty, 
  addSale, 
  addPayment,
  calculateAllBalances 
} from '@/app/redux/slices/billingSlice';

const parties = useSelector(state => state.billing.parties);
const dispatch = useDispatch();
```

---

## 🎓 Training Checklist

- [ ] Understand running ledger vs invoice system
- [ ] Create 3-5 dummy parties
- [ ] Record 5-10 test sales
- [ ] Record 3-5 test payments
- [ ] View ledger for a party
- [ ] Generate all report types
- [ ] Test credit limit functionality
- [ ] Test payment pending to completed flow
- [ ] Export a report to PDF

---

## ✅ System Health Checklist

Run weekly:
- [ ] Verify all party balances are correct
- [ ] Check for orphaned transactions
- [ ] Review outstanding items over 30 days
- [ ] Backup database
- [ ] Review error logs
- [ ] Check system performance

---

## 📈 Growth Path

**Phase 1** (Current): Basic ledger system
**Phase 2**: SMS/Email notifications
**Phase 3**: Mobile app integration
**Phase 4**: Auto-reconciliation
**Phase 5**: Supply chain integration

---

## 📄 Quick Reference Card

```
SHORTCUT GUIDE:

Party Operations:
- Create Party      → Party Master → Add New Party
- View Party/Edit   → Party Master → Click Party Name
- Ledger Check      → Ledger Report → Select Party

Sales:
- New Sale          → Sale Entry → New Sale Entry
- View Sales        → Sale Entry → Table
- Date Filter       → Sales → Filter by Date

Payments:
- New Payment       → Payment Entry → Record Payment
- Change Status     → Payment Entry → Edit Mode
- By Mode Analytics → Collection Report

Reports:
- Outstanding       → Reports → Outstanding
- Daily Dispatch    → Reports → Dispatch
- Collection        → Reports → Collection
```

---

**🎉 You're ready to use the Billing Module!**

For detailed technical information, see `BILLING_MODULE_DOCS.md`
