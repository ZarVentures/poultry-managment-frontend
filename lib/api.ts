import { getApiBaseUrl } from '@/lib/api-base-url';

// API Configuration and Utilities

// Get auth token from localStorage
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// Dev mode logger — set by DevModeProvider
let _devLogger: ((log: any) => void) | null = null
export function setDevLogger(fn: ((log: any) => void) | null) { _devLogger = fn }

// API request wrapper with auth
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const url = `${getApiBaseUrl()}${endpoint}`;
  const method = (options.method || 'GET').toUpperCase();
  const bodyStr = options.body ? String(options.body) : undefined;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const start = Date.now();
  let status: number | undefined;

  try {
    const response = await fetch(url, { ...options, headers });
    status = response.status;
    const duration = Date.now() - start;

    // Log to dev mode if active
    if (_devLogger && typeof window !== 'undefined' && localStorage.getItem('dev_mode_enabled') === 'true') {
      const parts = [`curl -X ${method} '${url}'`, `  -H 'Content-Type: application/json'`];
      if (token) parts.push(`  -H 'Authorization: Bearer ${token}'`);
      if (bodyStr && bodyStr !== '{}') parts.push(`  -d '${bodyStr}'`);
      _devLogger({
        id: Math.random().toString(36).slice(2),
        timestamp: new Date().toLocaleTimeString(),
        method, url, body: bodyStr, status, duration,
        curl: parts.join(' \\\n'),
      });
    }

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } else {
          const text = await response.text();
          errorMessage = text || errorMessage;
        }
      } catch (e) { }
      throw new Error(errorMessage);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return undefined as T;
    }
    const text = await response.text();
    if (!text || text.trim() === '') return undefined as T;
    return JSON.parse(text);
  } catch (err) {
    // Log failed requests too
    if (_devLogger && typeof window !== 'undefined' && localStorage.getItem('dev_mode_enabled') === 'true') {
      const parts = [`curl -X ${method} '${url}'`, `  -H 'Content-Type: application/json'`];
      if (token) parts.push(`  -H 'Authorization: Bearer ${token}'`);
      if (bodyStr && bodyStr !== '{}') parts.push(`  -d '${bodyStr}'`);
      _devLogger({
        id: Math.random().toString(36).slice(2),
        timestamp: new Date().toLocaleTimeString(),
        method, url, body: bodyStr, status: status || 0, duration: Date.now() - start,
        curl: parts.join(' \\\n'),
      });
    }
    throw err;
  }
}

// Farmer Interface
export interface Farmer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  farmhouseName?: string;
  status: 'active' | 'inactive';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Retailer Interface
export interface Retailer {
  id: string;
  name: string;
  ownerName?: string;
  phone: string;
  email?: string;
  address?: string;
  status: 'active' | 'inactive';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Vehicle Interface
export interface Vehicle {
  id: string;
  vehicleNumber: string;
  vehicleType: string;
  driverName: string;
  phone: string;
  ownerName?: string;
  address?: string;
  totalCapacity?: string;
  petrolTankCapacity?: string;
  mileage?: string;
  joinDate: string;
  status: 'active' | 'inactive';
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

// User Interface
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'manager' | 'staff';
  status: 'active' | 'inactive';
  joinDate: string;
  lastLogin?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Inventory Interface
export interface InventoryItem {
  id: number;
  itemType: string;
  itemName: string;
  quantity: number;
  unit: string;
  minimumStockLevel: number;
  currentStockLevel: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  lastUpdated?: string;
}

// Sale Interface
export interface SalePayment {
  id?: string;
  paymentMode: string;
  amount: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  saleNo?: string;
  purchaseBillNo?: string;
  cageNo?: string;
  customerName: string;
  saleDate: string;
  saleMode: 'from_vehicle' | 'from_godown';
  productType: 'eggs' | 'meat' | 'chicks' | 'other';
  quantity: number;
  unit?: string;
  unitPrice: number;
  totalAmount: number;
  transportCharges: number;
  loadingCharges: number;
  commission: number;
  otherCharges: number;
  weightShortage: number;
  mortalityDeduction: number;
  otherDeduction: number;
  grossAmount: number;
  netAmount: number;
  paymentStatus: 'paid' | 'pending' | 'partial';
  amountReceived: number;
  notes?: string;
  retailerId?: string;
  saleAttachment?: string;
  payments?: SalePayment[];
  createdAt?: string;
  updatedAt?: string;
}

// Sale DTO for create/update (backend expects strings for numeric fields)
export interface CreateSaleDto {
  invoiceNumber: string;
  customerName: string;
  saleDate: string;
  saleMode: 'from_vehicle' | 'from_godown';
  productType: 'eggs' | 'meat' | 'chicks' | 'other';
  quantity: string;
  unit?: string;
  unitPrice: string;
  transportCharges?: string;
  loadingCharges?: string;
  commission?: string;
  otherCharges?: string;
  weightShortage?: string;
  mortalityDeduction?: string;
  otherDeduction?: string;
  paymentStatus?: 'paid' | 'pending' | 'partial';
  amountReceived?: string;
  notes?: string;
  retailerId?: string;
}

export interface UpdateSaleDto extends Partial<CreateSaleDto> { }

// Expense Interface
export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  isSystem: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Expense {
  id: string;
  expenseDate: string;
  expenseOwner?: string;
  category?: 'feed' | 'labor' | 'medicine' | 'utilities' | 'equipment' | 'maintenance' | 'transportation' | 'other';
  categoryId?: string;
  expenseCategory?: ExpenseCategory;
  description: string;
  amount: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'check' | 'credit_card';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Expense DTO for create/update (backend expects string for amount)
export interface CreateExpenseDto {
  expenseDate: string;
  expenseOwner?: string;
  categoryId?: string;
  category?: 'feed' | 'labor' | 'medicine' | 'utilities' | 'equipment' | 'maintenance' | 'transportation' | 'other';
  description: string;
  amount: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'check' | 'credit_card';
  notes?: string;
}

export interface UpdateExpenseDto extends Partial<CreateExpenseDto> { }

export interface CreateExpenseCategoryDto {
  name: string;
  description?: string;
  icon?: string;
  isActive?: boolean;
}

export interface UpdateExpenseCategoryDto extends Partial<CreateExpenseCategoryDto> { }

// Purchase Order Interface
export interface PurchaseOrderItem {
  id?: string;
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface PurchaseOrderCage {
  id?: string;
  cageId?: string;
  birdType?: string;
  numberOfBirds: number;
  cageWeight: number;       // legacy alias
  purchaseWeight: number;   // actual field from backend
  godownInwardWeight?: number;
  godownSaleWeight?: number;
  status?: 'pending' | 'sold' | 'in_godown' | 'godown_sold' | 'on_vehicle';
  saleId?: string;          // set when cage is sold
}

// Purchase Order DTO Items (backend expects strings for quantity and unitCost)
export interface CreatePurchaseOrderItemDto {
  description: string;
  quantity: string;
  unit: string;
  unitCost: string;
}

export interface CreatePurchaseOrderCageDto {
  cageId?: string;
  birdType?: string;
  numberOfBirds: number;
  cageWeight: number;
}

export interface PurchaseOrderPayment {
  id?: string;
  paymentMode: string;
  amount: number;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierName: string;
  orderDate: string;
  dueDate?: string;
  status: 'pending' | 'received' | 'cancelled';
  farmerId?: string;
  farmerMobile?: string;
  farmLocation?: string;
  vehicleId?: string;
  totalWeight?: number;
  ratePerKg?: number;
  totalAmount: number;
  transportCharges?: number;
  otherCharges?: number;
  grossAmount?: number;
  netAmount?: number;
  purchasePaymentStatus?: 'paid' | 'pending' | 'partial';
  totalPaymentMade?: number;
  balanceAmount?: number;
  notes?: string;
  items: PurchaseOrderItem[];
  cages?: PurchaseOrderCage[];
  payments?: PurchaseOrderPayment[];
  invoiceAttachment?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Purchase Order DTO for create/update (backend expects strings for numeric fields)
export interface CreatePurchaseOrderDto {
  orderNumber: string;
  supplierName: string;
  orderDate: string;
  dueDate?: string;
  status?: 'pending' | 'received' | 'cancelled';
  farmerId?: string;
  farmerMobile?: string;
  farmLocation?: string;
  vehicleId?: string;
  birdType?: string;
  totalWeight?: string;
  ratePerKg?: string;
  notes?: string;
  transportCharges?: string;
  loadingCharges?: string;
  commission?: string;
  otherCharges?: string;
  weightShortage?: string;
  mortalityDeduction?: string;
  otherDeduction?: string;
  purchasePaymentStatus?: 'paid' | 'pending' | 'partial';
  advancePaid?: string;
  paymentMode?: string;
  totalPaymentMade?: string;
  invoiceAttachment?: string;
  items?: CreatePurchaseOrderItemDto[];
  cages?: CreatePurchaseOrderCageDto[];
}

export interface UpdatePurchaseOrderDto extends Partial<CreatePurchaseOrderDto> { }

// Settings Interface
export interface Setting {
  key: string;
  value: string;
  category?: string;
  description?: string;
  updatedAt?: string;
}

// Godown Interfaces
export interface GodownInward {
  id: string;
  entryDate: string;
  purchaseInvoiceNo?: string;
  supplierName?: string;
  vehicleId?: string;
  numberOfBirds: number;
  averageWeight?: number;
  totalWeight?: number;
  ratePerKg?: number;
  totalAmount?: number;
  notes?: string;
  cages?: GodownCage[];
  createdAt?: string;
  updatedAt?: string;
}

export interface GodownSale {
  id: string;
  saleDate: string;
  invoiceNumber?: string;
  customerName: string;
  retailerId?: string;
  vehicleId?: string;
  numberOfBirds: number;
  averageWeight?: number;
  totalWeight?: number;
  ratePerKg?: number;
  totalAmount?: number;
  paymentStatus: 'paid' | 'pending' | 'partial';
  amountReceived: number;
  notes?: string;
  cages?: GodownCage[];
  createdAt?: string;
  updatedAt?: string;
}

export interface GodownCage {
  id?: string;
  cageId?: string;
  birdType?: string;
  numberOfBirds: number;
  cageWeight: number;
  purchaseOrderId?: string;
  godownInwardId?: string;
}

export interface GodownMortality {
  id: string;
  mortalityDate: string;
  numberOfBirdsDied: number;
  reason?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GodownExpense {
  id: string;
  expenseDate: string;
  category: 'feed' | 'labor' | 'medicine' | 'utilities' | 'equipment' | 'maintenance' | 'transportation' | 'other';
  description: string;
  amount: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'check' | 'credit_card';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GodownSummary {
  totalInward: number;
  totalSales: number;
  totalMortality: number;
  totalExpenses: number;
  currentStock: number;
}

// Mortality (Transport) Interface
export interface MortalityRecord {
  id: string;
  recordNumber: string;
  purchaseInvoiceNo: string;
  purchaseOrderId?: string;
  purchaseDate: string;
  farmerName: string;
  farmLocation: string;
  cageIdNumber?: string;
  totalBirdsPurchased: number;
  numberOfBirdsDied: number;
  cause: string;
  notes: string;
  mortalityDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Product Interface
export interface Product {
  id: string;
  name: string;
  category?: string;
  productType?: 'eggs' | 'meat' | 'chicks' | 'feed' | 'medicine' | 'equipment' | 'other';
  unit?: string;
  price?: number;
  description?: string;
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

// Product DTO for create/update (backend expects string for price)
export interface CreateProductDto {
  name: string;
  category?: string;
  productType?: 'eggs' | 'meat' | 'chicks' | 'feed' | 'medicine' | 'equipment' | 'other';
  unit?: string;
  price?: string;
  description?: string;
  status?: 'active' | 'inactive';
}

export interface UpdateProductDto extends Partial<CreateProductDto> { }

// ============================================
// FARMERS API
// ============================================
export const farmersApi = {
  getAll: (page?: number, limit?: number, search?: string, status?: string) => {
    const params = new URLSearchParams();
    if (page) params.append('page', String(page));
    if (limit) params.append('limit', String(limit));
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    return apiRequest<any>(`/farmers?${params.toString()}`);
  },

  getActive: () => apiRequest<Array<{ id: string; name: string; phone: string; address?: string }>>('/farmers/active/list'),

  getOne: (id: string) => apiRequest<Farmer>(`/farmers/${id}`),

  create: (data: Omit<Farmer, 'id' | 'createdAt' | 'updatedAt'>) =>
    apiRequest<Farmer>('/farmers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Farmer>) =>
    apiRequest<Farmer>(`/farmers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<void>(`/farmers/${id}`, {
      method: 'DELETE',
    }),
};

// ============================================
// RETAILERS API
// ============================================
export const retailersApi = {
  getAll: (page?: number, limit?: number, search?: string) => {
    const params = new URLSearchParams();
    if (page) params.append('page', String(page));
    if (limit) params.append('limit', String(limit));
    if (search) params.append('search', search);
    return apiRequest<any>(`/retailers?${params.toString()}`);
  },

  getActive: () => apiRequest<Array<{ id: string; name: string; ownerName?: string; phone: string; address?: string }>>('/retailers/active/list'),

  getOne: (id: string) => apiRequest<Retailer>(`/retailers/${id}`),

  create: (data: Omit<Retailer, 'id' | 'createdAt' | 'updatedAt'>) =>
    apiRequest<Retailer>('/retailers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Retailer>) =>
    apiRequest<Retailer>(`/retailers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<void>(`/retailers/${id}`, {
      method: 'DELETE',
    }),
};

// ============================================
// VEHICLES API
// ============================================
export const vehiclesApi = {
  getAll: (page?: number, limit?: number, search?: string) => {
    const params = new URLSearchParams();
    if (page) params.append('page', String(page));
    if (limit) params.append('limit', String(limit));
    if (search) params.append('search', search);
    return apiRequest<any>(`/vehicles?${params.toString()}`);
  },

  getActive: () => apiRequest<Array<{ id: string; vehicleNumber: string; driverName: string; phone: string }>>('/vehicles/active/list'),

  getOne: (id: string) => apiRequest<Vehicle>(`/vehicles/${id}`),

  create: (data: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>) =>
    apiRequest<Vehicle>('/vehicles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Vehicle>) =>
    apiRequest<Vehicle>(`/vehicles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<void>(`/vehicles/${id}`, {
      method: 'DELETE',
    }),
};

// ============================================
// USERS API
// ============================================
export const usersApi = {
  getAll: () => apiRequest<User[]>('/users'),

  getOne: (id: string) => apiRequest<User>(`/users/${id}`),

  create: (data: { name: string; email: string; password: string; role: string; status: string; phone?: string; notes?: string }) =>
    apiRequest<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<User>) =>
    apiRequest<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  updateStatus: (id: string, status: 'active' | 'inactive') =>
    apiRequest<User>(`/users/${id}/${status === 'active' ? 'activate' : 'deactivate'}`, {
      method: 'PATCH',
      body: JSON.stringify({}),
    }),

  delete: (id: string) =>
    apiRequest<void>(`/users/${id}`, {
      method: 'DELETE',
    }),
};

// ============================================
// ============================================
// AUTH API
// ============================================
export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<{ accessToken: string; user: User } | { status: '2FA_REQUIRED'; tempToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  // 2FA
  get2FAStatus: () =>
    apiRequest<{ isTwoFactorEnabled: boolean }>('/auth/2fa/status'),

  generate2FA: () =>
    apiRequest<{ otpauthUrl: string; qrCodeDataUrl: string; secret: string }>('/auth/2fa/generate', { method: 'POST' }),

  turnOn2FA: (code: string) =>
    apiRequest<{ message: string }>('/auth/2fa/turn-on', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),

  turnOff2FA: (code: string) =>
    apiRequest<{ message: string }>('/auth/2fa/turn-off', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),

  authenticate2FA: (tempToken: string, code: string) =>
    apiRequest<{ accessToken: string; user: User }>('/auth/2fa/authenticate', {
      method: 'POST',
      body: JSON.stringify({ tempToken, code }),
    }),
};

// ============================================
// INVENTORY API
// ============================================
export const inventoryApi = {
  getAll: () => apiRequest<InventoryItem[]>('/inventory'),

  getOne: (id: number) => apiRequest<InventoryItem>(`/inventory/${id}`),

  create: (data: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'lastUpdated'>) =>
    apiRequest<InventoryItem>('/inventory', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<InventoryItem>) =>
    apiRequest<InventoryItem>(`/inventory/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiRequest<void>(`/inventory/${id}`, {
      method: 'DELETE',
    }),
};

// ============================================
// SALES API
// ============================================
export const salesApi = {
  getAll: (filters?: {
    startDate?: string;
    endDate?: string;
    customer?: string;
    productType?: string;
    paymentStatus?: string;
    page?: number;
    limit?: number;
  }) => {
    const params = new URLSearchParams()
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)
    if (filters?.customer) params.append('customer', filters.customer)
    if (filters?.productType) params.append('productType', filters.productType)
    if (filters?.paymentStatus) params.append('paymentStatus', filters.paymentStatus)
    if (filters?.page) params.append('page', String(filters.page))
    if (filters?.limit) params.append('limit', String(filters.limit))
    const qs = params.toString()
    return apiRequest<any>(`/sales${qs ? `?${qs}` : ''}`)
  },

  getInvoiceList: () => apiRequest<Array<{ id: string; invoiceNumber: string; saleDate: string; customerName: string }>>('/sales/invoices/list'),

  getOne: (id: string) => apiRequest<Sale>(`/sales/${id}`),

  create: (data: CreateSaleDto) =>
    apiRequest<Sale>('/sales', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateSaleDto) =>
    apiRequest<Sale>(`/sales/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<void>(`/sales/${id}`, {
      method: 'DELETE',
    }),

  uploadAttachment: async (id: string, file: File): Promise<Sale> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${getApiBaseUrl()}/sales/${id}/upload-attachment`, {
      method: 'POST',
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      body: formData,
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(err || `HTTP ${response.status}`);
    }
    return response.json();
  },
};

// ============================================
// EXPENSES API
// ============================================
export const expensesApi = {
  getAll: () => apiRequest<Expense[]>('/expenses'),

  getOne: (id: string) => apiRequest<Expense>(`/expenses/${id}`),

  create: (data: CreateExpenseDto) =>
    apiRequest<Expense>('/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateExpenseDto) =>
    apiRequest<Expense>(`/expenses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<void>(`/expenses/${id}`, {
      method: 'DELETE',
    }),
};

// ============================================
// EXPENSE CATEGORIES API
// ============================================
export interface ExpenseCategory {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseCategoryDto {
  name: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateExpenseCategoryDto {
  name?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export const expenseCategoriesApi = {
  getAll: () => apiRequest<ExpenseCategory[]>('/expense-categories'),

  getActive: () => apiRequest<ExpenseCategory[]>('/expense-categories/active'),

  getOne: (id: number) => apiRequest<ExpenseCategory>(`/expense-categories/${id}`),

  create: (data: CreateExpenseCategoryDto) =>
    apiRequest<ExpenseCategory>('/expense-categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: UpdateExpenseCategoryDto) =>
    apiRequest<ExpenseCategory>(`/expense-categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiRequest<void>(`/expense-categories/${id}`, {
      method: 'DELETE',
    }),

  seed: () =>
    apiRequest<void>('/expense-categories/seed', {
      method: 'POST',
    }),
};

// ============================================
// PURCHASES API
// ============================================
export const purchasesApi = {
  getAll: (filters?: {
    startDate?: string;
    endDate?: string;
    supplier?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.supplier) params.append('supplier', filters.supplier);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));
    return apiRequest<any>(`/purchases?${params.toString()}`);
  },

  getInvoiceList: () => apiRequest<Array<{ id: string; orderNumber: string; orderDate: string; supplierName: string }>>('/purchases/invoices/list'),

  getOne: (id: string) => apiRequest<PurchaseOrder>(`/purchases/${id}`),

  create: (data: CreatePurchaseOrderDto) =>
    apiRequest<PurchaseOrder>('/purchases', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdatePurchaseOrderDto) =>
    apiRequest<PurchaseOrder>(`/purchases/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<void>(`/purchases/${id}`, {
      method: 'DELETE',
    }),

  uploadInvoice: async (id: string, file: File): Promise<PurchaseOrder> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${getApiBaseUrl()}/purchases/${id}/upload-invoice`, {
      method: 'POST',
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      body: formData,
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(err || `HTTP ${response.status}`);
    }
    return response.json();
  },

  // Get cages for a purchase bill by order number, optionally filtered by status
  getCagesByOrderNumber: (orderNumber: string, status?: string) =>
    apiRequest<PurchaseOrderCage[]>(`/cages/by-purchase/${encodeURIComponent(orderNumber)}${status ? `?status=${status}` : ''}`),

  // Mark cage IDs as sold
  markCagesSold: (cageIds: string[], saleWeight?: number) =>
    apiRequest<void>('/cages/mark-sold', {
      method: 'PATCH',
      body: JSON.stringify({ cageIds, saleWeight }),
    }),

  // Mark cage IDs as in_godown
  markCagesInGodown: (cageIds: string[], godownInwardWeight?: number) =>
    apiRequest<void>('/cages/mark-in-godown', {
      method: 'PATCH',
      body: JSON.stringify({ cageIds, godownInwardWeight }),
    }),

  // Get full cage journey for weight loss tracking
  getCageJourney: (orderNumber: string) =>
    apiRequest<any[]>(`/cages/journey/${encodeURIComponent(orderNumber)}`),

  // Get all cages currently in godown
  getInGodownCages: () => apiRequest<PurchaseOrderCage[]>('/cages/in-godown'),

  // Partial godown sale
  partialGodownSale: (cageId: string, godownSaleId: string, soldBirds: number, soldWeight: number) =>
    apiRequest<void>('/cages/partial-godown-sale', {
      method: 'PATCH',
      body: JSON.stringify({ cageId, godownSaleId, soldBirds, soldWeight }),
    }),
};

// ============================================
// SETTINGS API
// ============================================
export const settingsApi = {
  getAll: () => apiRequest<Setting[]>('/settings'),

  getOne: (key: string) => apiRequest<Setting>(`/settings/${key}`),

  update: (key: string, value: string) =>
    apiRequest<Setting>(`/settings/${key}`, {
      method: 'PATCH',
      body: JSON.stringify({ value }),
    }),

  createOrUpdate: (data: { key: string; value: string; category?: string; description?: string }) =>
    apiRequest<Setting>('/settings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ============================================
// GODOWN API
// ============================================
export const godownApi = {
  // Inward Entries
  inward: {
    getAll: (page?: number, limit?: number, search?: string) => {
      const q = new URLSearchParams();
      if (page) q.set('page', String(page));
      if (limit) q.set('limit', String(limit));
      if (search) q.set('search', search);
      const s = q.toString();
      return apiRequest<any>(`/godown/inward${s ? `?${s}` : ''}`);
    },
    getOne: (id: string) => apiRequest<GodownInward>(`/godown/inward/${id}`),
    create: (data: Omit<GodownInward, 'id' | 'createdAt' | 'updatedAt'>) =>
      apiRequest<GodownInward>('/godown/inward', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<GodownInward>) =>
      apiRequest<GodownInward>(`/godown/inward/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      apiRequest<void>(`/godown/inward/${id}`, {
        method: 'DELETE',
      }),
  },

  // Sales
  sales: {
    getAll: (page?: number, limit?: number, search?: string) => {
      const q = new URLSearchParams();
      if (page) q.set('page', String(page));
      if (limit) q.set('limit', String(limit));
      if (search) q.set('search', search);
      const s = q.toString();
      return apiRequest<any>(`/godown/sales${s ? `?${s}` : ''}`);
    },
    getOne: (id: string) => apiRequest<GodownSale>(`/godown/sales/${id}`),
    create: (data: Omit<GodownSale, 'id' | 'createdAt' | 'updatedAt'>) =>
      apiRequest<GodownSale>('/godown/sales', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<GodownSale>) =>
      apiRequest<GodownSale>(`/godown/sales/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      apiRequest<void>(`/godown/sales/${id}`, {
        method: 'DELETE',
      }),
  },

  // Mortality
  mortality: {
    getAll: (page?: number, limit?: number, search?: string) => {
      const q = new URLSearchParams();
      if (page) q.set('page', String(page));
      if (limit) q.set('limit', String(limit));
      if (search) q.set('search', search);
      const s = q.toString();
      return apiRequest<any>(`/godown/mortality${s ? `?${s}` : ''}`);
    },
    getOne: (id: string) => apiRequest<GodownMortality>(`/godown/mortality/${id}`),
    create: (data: Omit<GodownMortality, 'id' | 'createdAt' | 'updatedAt'>) =>
      apiRequest<GodownMortality>('/godown/mortality', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<GodownMortality>) =>
      apiRequest<GodownMortality>(`/godown/mortality/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      apiRequest<void>(`/godown/mortality/${id}`, {
        method: 'DELETE',
      }),
  },

  // Expenses
  expenses: {
    getAll: (page?: number, limit?: number, search?: string) => {
      const q = new URLSearchParams();
      if (page) q.set('page', String(page));
      if (limit) q.set('limit', String(limit));
      if (search) q.set('search', search);
      const s = q.toString();
      return apiRequest<any>(`/godown/expenses${s ? `?${s}` : ''}`);
    },
    getOne: (id: string) => apiRequest<GodownExpense>(`/godown/expenses/${id}`),
    create: (data: Omit<GodownExpense, 'id' | 'createdAt' | 'updatedAt'>) =>
      apiRequest<GodownExpense>('/godown/expenses', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<GodownExpense>) =>
      apiRequest<GodownExpense>(`/godown/expenses/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      apiRequest<void>(`/godown/expenses/${id}`, {
        method: 'DELETE',
      }),
  },

  // Summary
  getSummary: () => apiRequest<GodownSummary>('/godown/summary'),
};

export type PaymentMethodVoucher =
  | 'cash'
  | 'cheque'
  | 'bank_transfer'
  | 'upi'
  | 'card';

export interface CreatePaymentVoucherPayload {
  voucherDate: string;
  payeeType: 'farmer' | 'retailer' | 'supplier' | 'employee' | 'other';
  payeeId?: number;
  payeeName: string;
  amount: number;
  paymentMethod: PaymentMethodVoucher;
  chequeNumber?: string;
  bankName?: string;
  transactionReference?: string;
  purpose: string;
  description?: string;
  referenceType?: 'purchase' | 'expense' | 'sale' | 'other';
  referenceId?: number;
  status?: 'pending' | 'paid' | 'cancelled';
  paidDate?: string;
  attachmentUrl?: string;
  notes?: string;
}

/** Response from POST /payment-vouchers (matches Nest + TypeORM shape) */
export interface PaymentVoucherRecord {
  id: number;
  voucherNumber: string;
  voucherDate: string;
  payeeType: string;
  payeeId?: number;
  payeeName: string;
  amount: number;
  paymentMethod: string;
  chequeNumber?: string;
  bankName?: string;
  transactionReference?: string;
  purpose: string;
  description?: string;
  referenceType?: string;
  referenceId?: number;
  status: string;
  paidDate?: string;
  attachmentUrl?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const paymentVouchersApi = {
  create: (data: CreatePaymentVoucherPayload) =>
    apiRequest<PaymentVoucherRecord>('/payment-vouchers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  findAll: (params?: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') q.set(k, v);
      });
    }
    const s = q.toString();
    return apiRequest<PaymentVoucherRecord[]>(`/payment-vouchers${s ? `?${s}` : ''}`);
  },

  findOne: (id: number) => apiRequest<PaymentVoucherRecord>(`/payment-vouchers/${id}`),

  approve: (id: number) =>
    apiRequest<PaymentVoucherRecord>(`/payment-vouchers/${id}/approve`, { method: 'POST' }),

  cancel: (id: number) =>
    apiRequest<PaymentVoucherRecord>(`/payment-vouchers/${id}/cancel`, { method: 'POST' }),
};

export default {
  farmers: farmersApi,
  retailers: retailersApi,
  vehicles: vehiclesApi,
  users: usersApi,
  auth: authApi,
  inventory: inventoryApi,
  sales: salesApi,
  expenses: expensesApi,
  purchases: purchasesApi,
  settings: settingsApi,
  godown: godownApi,
  paymentVouchers: paymentVouchersApi,
};


// ============================================
// PERMISSIONS API
// ============================================
export interface PermissionCheck {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export interface UserPermissions {
  userId: string;
  role: string;
  permissions: Record<string, PermissionCheck>;
}

export const permissionsApi = {
  // Get current user's permissions for all resources
  getMyPermissions: () => apiRequest<UserPermissions>('/permissions/my-permissions'),

  // Check permission for a specific resource
  checkPermission: (resource: string) =>
    apiRequest<PermissionCheck & { resource: string }>(`/permissions/check/${resource}`),

  // Get all role permissions (admin only)
  getAllRolePermissions: () => apiRequest<any[]>('/permissions/roles'),

  // Update role permission (admin only)
  updateRolePermission: (role: string, resource: string, permissions: Partial<PermissionCheck>) =>
    apiRequest<any>(`/permissions/roles/${role}/${resource}`, {
      method: 'PUT',
      body: JSON.stringify(permissions),
    }),

  // Set user-specific permission (admin only)
  setUserPermission: (userId: string, resource: string, permissionName: string, permissions: Partial<PermissionCheck>) =>
    apiRequest<any>(`/permissions/users/${userId}/${resource}`, {
      method: 'POST',
      body: JSON.stringify({ permissionName, permissions }),
    }),

  // Delete user-specific permission (admin only)
  deleteUserPermission: (userId: string, resource: string) =>
    apiRequest<{ message: string }>(`/permissions/users/${userId}/${resource}`, {
      method: 'DELETE',
    }),

  // Delete all permissions for a role (admin only)
  deleteRole: (role: string) =>
    apiRequest<{ message: string }>(`/permissions/roles/${role}`, {
      method: 'DELETE',
    }),
};

// ============================================
// REPORTS API
// ============================================
export const reportsApi = {
  getOutstandingReport: (filters?: { page?: number; limit?: number; sortBy?: string }) => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.sortBy) params.append('sortBy', filters.sortBy || 'outstanding');
    return apiRequest<{
      data: any[];
      total: number;
      page: number;
      limit: number;
      summary: any;
    }>(`/reports/outstanding?${params.toString()}`);
  },

  getCollectionReport: (filters?: { startDate?: string; endDate?: string; mode?: string; page?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.mode) params.append('mode', filters.mode);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));
    return apiRequest<{
      data: any[];
      total: number;
      page: number;
      limit: number;
      summary: any;
    }>(`/reports/collection?${params.toString()}`);
  },
};


// ============================================
// MORTALITY (TRANSPORT) API
// ============================================
export const mortalityApi = {
  getAll: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return apiRequest<MortalityRecord[]>(`/mortality?${params.toString()}`);
  },

  getStats: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return apiRequest<{
      totalBirdsPurchased: number;
      totalBirdsDeath: number;
      totalValue: number;
      totalRecords: number;
    }>(`/mortality/stats?${params.toString()}`);
  },

  getOne: (id: string) => apiRequest<MortalityRecord>(`/mortality/${id}`),

  create: (data: Omit<MortalityRecord, 'id' | 'recordNumber' | 'createdAt' | 'updatedAt'>) =>
    apiRequest<MortalityRecord>('/mortality', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Omit<MortalityRecord, 'id' | 'recordNumber' | 'createdAt' | 'updatedAt'>>) =>
    apiRequest<MortalityRecord>(`/mortality/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<void>(`/mortality/${id}`, {
      method: 'DELETE',
    }),
};

// ============================================
// PRODUCTS API
// ============================================
export const productsApi = {
  getAll: (category?: string, productType?: string, status?: string) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (productType) params.append('productType', productType);
    if (status) params.append('status', status);
    return apiRequest<Product[]>(`/products?${params.toString()}`);
  },

  getActive: () => apiRequest<Product[]>('/products/active'),

  getOne: (id: string) => apiRequest<Product>(`/products/${id}`),

  create: (data: CreateProductDto) =>
    apiRequest<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateProductDto) =>
    apiRequest<Product>(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  updateStatus: (id: string, status: 'active' | 'inactive') =>
    apiRequest<Product>(`/products/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  delete: (id: string) =>
    apiRequest<void>(`/products/${id}`, {
      method: 'DELETE',
    }),
};

// ============================================
// BILLING API
// ============================================
export const billingApi = {
  getSummary: () => apiRequest<any>('/billing/summary'),
  getCompanyReport: (fromDate?: string, toDate?: string) => {
    const params = new URLSearchParams();
    if (fromDate) params.append('from', fromDate);
    if (toDate) params.append('to', toDate);
    const qs = params.toString();
    return apiRequest<any>(`/billing/company-report${qs ? `?${qs}` : ''}`);
  },

  // Parties
  getParties: () => apiRequest<any[]>('/billing/parties'),
  getParty: (id: string) => apiRequest<any>(`/billing/parties/${id}`),
  createParty: (data: any) => apiRequest<any>('/billing/parties', { method: 'POST', body: JSON.stringify(data) }),
  updateParty: (id: string, data: any) => apiRequest<any>(`/billing/parties/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteParty: (id: string) => apiRequest<void>(`/billing/parties/${id}`, { method: 'DELETE' }),

  // Sales
  getSales: (partyId?: string) => apiRequest<any[]>(`/billing/sales${partyId ? `?partyId=${partyId}` : ''}`),
  createSale: (data: any) => apiRequest<any>('/billing/sales', { method: 'POST', body: JSON.stringify(data) }),
  updateSale: (id: string, data: any) => apiRequest<any>(`/billing/sales/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteSale: (id: string) => apiRequest<void>(`/billing/sales/${id}`, { method: 'DELETE' }),

  // Payments
  getPayments: (partyId?: string) => apiRequest<any[]>(`/billing/payments${partyId ? `?partyId=${partyId}` : ''}`),
  createPayment: (data: any) => apiRequest<any>('/billing/payments', { method: 'POST', body: JSON.stringify(data) }),
  updatePayment: (id: string, data: any) => apiRequest<any>(`/billing/payments/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deletePayment: (id: string) => apiRequest<void>(`/billing/payments/${id}`, { method: 'DELETE' }),

  // Ledger
  getLedger: (partyId: string) => apiRequest<any[]>(`/billing/ledger/${partyId}`),
  getLedgerByName: (name: string) => apiRequest<any[]>(`/billing/ledger-by-name/${encodeURIComponent(name)}`),
};
