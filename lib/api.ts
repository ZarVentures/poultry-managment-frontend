// API Configuration and Utilities
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://13.234.140.190.nip.io/api/v1';

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
  const url = `${API_BASE_URL}${endpoint}`;
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
      } catch (e) {}
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
export interface Sale {
  id: string;
  invoiceNumber: string;
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

export interface UpdateSaleDto extends Partial<CreateSaleDto> {}

// Expense Interface
export interface Expense {
  id: string;
  expenseDate: string;
  expenseOwner?: string;
  category: 'feed' | 'labor' | 'medicine' | 'utilities' | 'equipment' | 'maintenance' | 'transportation' | 'other';
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
  category: 'feed' | 'labor' | 'medicine' | 'utilities' | 'equipment' | 'maintenance' | 'transportation' | 'other';
  description: string;
  amount: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'check' | 'credit_card';
  notes?: string;
}

export interface UpdateExpenseDto extends Partial<CreateExpenseDto> {}

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
  cageWeight: number;
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

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierName: string;
  orderDate: string;
  dueDate?: string;
  status: 'pending' | 'received' | 'cancelled';
  // Farmer integration
  farmerId?: string;
  farmerMobile?: string;
  farmLocation?: string;
  // Vehicle integration
  vehicleId?: string;
  // Bird details
  birdType?: string;
  totalWeight?: number;
  ratePerKg?: number;
  // Amounts
  totalAmount: number;
  transportCharges?: number;
  loadingCharges?: number;
  commission?: number;
  otherCharges?: number;
  weightShortage?: number;
  mortalityDeduction?: number;
  otherDeduction?: number;
  grossAmount?: number;
  netAmount?: number;
  // Payment tracking
  purchasePaymentStatus?: 'paid' | 'pending' | 'partial';
  advancePaid?: number;
  outstandingPayment?: number;
  paymentMode?: string;
  totalPaymentMade?: number;
  balanceAmount?: number;
  notes?: string;
  items: PurchaseOrderItem[];
  cages?: PurchaseOrderCage[];
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
  items: CreatePurchaseOrderItemDto[];
  cages?: CreatePurchaseOrderCageDto[];
}

export interface UpdatePurchaseOrderDto extends Partial<CreatePurchaseOrderDto> {}

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
  createdAt?: string;
  updatedAt?: string;
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

export interface UpdateProductDto extends Partial<CreateProductDto> {}

// ============================================
// FARMERS API
// ============================================
export const farmersApi = {
  getAll: () => apiRequest<Farmer[]>('/farmers'),
  
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
  getAll: () => apiRequest<Retailer[]>('/retailers'),
  
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
  getAll: () => apiRequest<Vehicle[]>('/vehicles'),
  
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
    apiRequest<{ accessToken: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },
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
  getAll: () => apiRequest<Sale[]>('/sales'),
  
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
    const response = await fetch(`${API_BASE_URL}/sales/${id}/upload-attachment`, {
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
// PURCHASES API
// ============================================
export const purchasesApi = {
  getAll: () => apiRequest<PurchaseOrder[]>('/purchases'),
  
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
    const response = await fetch(`${API_BASE_URL}/purchases/${id}/upload-invoice`, {
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
    getAll: () => apiRequest<GodownInward[]>('/godown/inward'),
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
    getAll: () => apiRequest<GodownSale[]>('/godown/sales'),
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
    getAll: () => apiRequest<GodownMortality[]>('/godown/mortality'),
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
    getAll: () => apiRequest<GodownExpense[]>('/godown/expenses'),
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
