import axios from 'axios';
import type {
  Product,
  Supplier,
  Customer,
  Purchase,
  Sale,
  Inventory,
  InventoryLog,
  Settlement,
  BusinessReport,
  InventoryValueReport,
  ProductRanking,
  CustomerRanking,
  SupplierRanking,
  DashboardData,
  Brand
} from '../types';

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// 请求拦截器，添加认证令牌
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器，处理认证错误
api.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    if (error.response && error.response.status === 401) {
      // 认证失败，清除本地存储并跳转到登录页
      // 但要避免在登录页面重复跳转
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// 商品相关API
export const productApi = {
  // 获取所有商品
  getProducts: () => api.get<Product[]>('/products'),
  // 获取单个商品
  getProduct: (id: string) => api.get<Product>(`/products/${id}`),
  // 创建商品
  createProduct: (product: Omit<Product, 'id'>) => api.post<Product>('/products', product),
  // 更新商品
  updateProduct: (id: string, product: Partial<Product>) => api.put<Product>(`/products/${id}`, product),
  // 删除商品
  deleteProduct: (id: string) => api.delete(`/products/${id}`)
};

// 供应商相关API
export const supplierApi = {
  // 获取所有供应商
  getSuppliers: () => api.get<Supplier[]>('/suppliers'),
  // 获取单个供应商
  getSupplier: (id: string) => api.get<Supplier>(`/suppliers/${id}`),
  // 创建供应商
  createSupplier: (supplier: Omit<Supplier, 'id'>) => api.post<Supplier>('/suppliers', supplier),
  // 更新供应商
  updateSupplier: (id: string, supplier: Partial<Supplier>) => api.put<Supplier>(`/suppliers/${id}`, supplier),
  // 删除供应商
  deleteSupplier: (id: string) => api.delete(`/suppliers/${id}`)
};

// 客户相关API
export const customerApi = {
  // 获取所有客户
  getCustomers: () => api.get<Customer[]>('/customers'),
  // 获取单个客户
  getCustomer: (id: string) => api.get<Customer>(`/customers/${id}`),
  // 创建客户
  createCustomer: (customer: Omit<Customer, 'id'>) => api.post<Customer>('/customers', customer),
  // 更新客户
  updateCustomer: (id: string, customer: Partial<Customer>) => api.put<Customer>(`/customers/${id}`, customer),
  // 删除客户
  deleteCustomer: (id: string) => api.delete(`/customers/${id}`)
};

// 采购相关API
export const purchaseApi = {
  // 获取所有采购单
  getPurchases: (params?: { supplierName?: string }) => api.get<Purchase[]>('/purchases', { params }),
  // 获取单个采购单
  getPurchase: (id: string) => api.get<Purchase>(`/purchases/${id}`),
  // 创建采购单
  createPurchase: (purchase: any) => api.post<Purchase>('/purchases', purchase),
  // 更新采购单
  updatePurchase: (id: string, purchase: Partial<Purchase>) => api.put<Purchase>(`/purchases/${id}`, purchase),
  // 删除采购单
  deletePurchase: (id: string) => api.delete(`/purchases/${id}`)
};

// 销售相关API
export const saleApi = {
  // 获取所有销售单
  getSales: (params?: { customerName?: string }) => api.get<Sale[]>('/sales', { params }),
  // 获取单个销售单
  getSale: (id: string) => api.get<Sale>(`/sales/${id}`),
  // 创建销售单
  createSale: (sale: any) => api.post<Sale>('/sales', sale),
  // 更新销售单
  updateSale: (id: string, sale: Partial<Sale>) => api.put<Sale>(`/sales/${id}`, sale),
  // 删除销售单
  deleteSale: (id: string) => api.delete(`/sales/${id}`)
};

// 库存相关API
export const inventoryApi = {
  // 获取实时库存
  getInventory: () => api.get<Inventory[]>('/inventory'),
  // 获取单个商品库存
  getProductInventory: (product_id: string) => api.get<Inventory>(`/inventory/${product_id}`),
  // 获取库存流水
  getInventoryLogs: (product_id?: string) => api.get<InventoryLog[]>(`/inventory/logs${product_id ? `/${product_id}` : ''}`)
};

// 结算相关API
export const settlementApi = {
  // 获取所有结算记录
  getSettlements: (params?: { supplierName?: string; customerName?: string; billType?: string; paymentMethod?: string }) => 
    api.get<Settlement[]>('/settlements', { params }),
  // 创建结算记录
  createSettlement: (settlement: any) => api.post<Settlement>('/settlements', settlement),
  // 获取采购应付账单
  getPurchaseBills: (params?: { supplierName?: string }) => 
    api.get<Purchase[]>('/settlements/purchase-bills', { params }),
  // 获取销售应收账款
  getSaleBills: (params?: { customerName?: string }) => 
    api.get<Sale[]>('/settlements/sale-bills', { params })
};

// 报表相关API
export const reportApi = {
  // 获取经营报表
  getBusinessReport: (startDate: string, endDate: string) => api.get<BusinessReport>('/reports/business', { params: { startDate, endDate } }),
  // 获取库存价值报表
  getInventoryValueReport: (page: number = 1, pageSize: number = 20) => api.get<any>('/reports/inventory-value', { params: { page, pageSize } }),
  // 获取商品销售排行
  getProductRanking: (startDate: string, endDate: string, page: number = 1, pageSize: number = 20) => api.get<ProductRanking[]>('/reports/product-ranking', { params: { startDate, endDate, page, pageSize } }),
  // 获取客户销售排行
  getCustomerRanking: (startDate: string, endDate: string, page: number = 1, pageSize: number = 20) => api.get<CustomerRanking[]>('/reports/customer-ranking', { params: { startDate, endDate, page, pageSize } }),
  // 获取供应商采购排行
  getSupplierRanking: (startDate: string, endDate: string, page: number = 1, pageSize: number = 20) => api.get<SupplierRanking[]>('/reports/supplier-ranking', { params: { startDate, endDate, page, pageSize } }),
  // 获取应收账款账龄分析
  getAccountsReceivable: () => api.get<any>('/reports/accounts-receivable'),
  // 获取应付账款账龄分析
  getAccountsPayable: () => api.get<any>('/reports/accounts-payable')
};

// 仪表盘相关API
export const dashboardApi = {
  // 获取仪表盘数据
  getDashboardData: () => api.get<DashboardData>('/dashboard')
};

// 品牌相关API
export const brandApi = {
  // 获取所有品牌
  getBrands: () => api.get<Brand[]>('/brands'),
  // 创建品牌
  createBrand: (brand: { name: string }) => api.post<Brand>('/brands', brand),
  // 删除品牌
  deleteBrand: (id: string) => api.delete(`/brands/${id}`)
};

// 快递单相关API
export const expressBillApi = {
  // 获取所有快递单
  getExpressBills: (params?: { expressCode?: string; supplierName?: string; status?: string }) => 
    api.get<any[]>('/express-bills', { params }),
  // 获取单个快递单
  getExpressBill: (id: string) => api.get<any>(`/express-bills/${id}`),
  // 创建快递单
  createExpressBill: (expressBill: any) => api.post<any>('/express-bills', expressBill),
  // 更新快递单
  updateExpressBill: (id: string, expressBill: any) => api.put<any>(`/express-bills/${id}`, expressBill),
  // 删除快递单
  deleteExpressBill: (id: string) => api.delete(`/express-bills/${id}`),
  // 将快递单转换为入库单
  convertToPurchase: (id: string, data: any) => api.post<any>(`/express-bills/${id}/convert-to-purchase`, data)
};

// 登录相关API
export const loginApi = {
  // 登录
  login: (username: string, password: string) => api.post('/auth/login', { username, password }),
  // 退出登录
  logout: () => api.post('/auth/logout')
};

export default api;
export { api };