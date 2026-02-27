// 品牌类型
export interface Brand {
  id: string;
  name: string;
}

// 商品类型
export interface Product {
  id: string;
  name: string;
  brand_id: string;
  spec: number;
  unit: string;
  purchase_price: number;
  sale_price: number;
  min_stock: number;
  Inventory?: Inventory;
  Brand?: Brand;
}

// 供应商类型
export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
}

// 客户类型
export interface Customer {
  id: string;
  name: string;
  type: string;
  phone: string;
}

// 采购单类型
export interface Purchase {
  id: string;
  supplier_id: string;
  date: string;
  total_amount: number;
  settlement_status: string;
  operator: string;
  remark: string;
  Supplier?: Supplier;
  PurchaseItems?: PurchaseItem[];
}

// 采购明细类型
export interface PurchaseItem {
  id: string;
  purchase_id: string;
  product_id: string;
  quantity: number;
  price: number;
  subtotal: number;
  Product?: Product;
}

// 销售单类型
export interface Sale {
  id: string;
  customer_id: string;
  date: string;
  total_amount: number;
  settlement_status: string;
  operator: string;
  remark: string;
  Customer?: Customer;
  SaleItems?: SaleItem[];
}

// 销售明细类型
export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  price: number;
  subtotal: number;
  cost_price: number;
  Product?: Product;
}

// 库存类型
export interface Inventory {
  product_id: string;
  current_quantity: number;
  avg_cost: number;
  Product?: Product;
}

// 库存流水类型
export interface InventoryLog {
  id: string;
  product_id: string;
  type: string;
  quantity: number;
  price: number;
  related_bill_no: string;
  balance: number;
  create_time: string;
  Product?: Product;
}

// 结算记录类型
export interface Settlement {
  id: string;
  bill_type: string;
  bill_id: string;
  settlement_date: string;
  amount: number;
  payment_method: string;
  remark?: string;
  supplier?: {
    id: string;
    name: string;
  };
  customer?: {
    id: string;
    name: string;
  };
  bill?: any;
}

// 经营报表类型
export interface BusinessReport {
  period: {
    startDate: string;
    endDate: string;
  };
  sales: number;
  cost: number;
  grossProfit: number;
  grossProfitRate: string;
}

// 库存价值报表类型
export interface InventoryValueReport {
  total_value: number;
  items: {
    product_id: string;
    product_name: string;
    spec: string;
    unit: string;
    quantity: number;
    avg_cost: number;
    total_value: number;
  }[];
}

// 商品销售排行类型
export interface ProductRanking {
  product_id: string;
  product_name: string;
  spec: string;
  quantity: number;
  sales_amount: number;
  cost_amount: number;
  profit: number;
}

// 客户销售排行类型
export interface CustomerRanking {
  customer_id: string;
  customer_name: string;
  sales_amount: number;
  order_count: number;
}

// 供应商采购排行类型
export interface SupplierRanking {
  supplier_id: string;
  supplier_name: string;
  purchase_amount: number;
  order_count: number;
}

// 仪表盘数据类型
export interface DashboardData {
  todaySales: number;
  todayInbound: number;
  totalInventoryValue: number;
  pendingReceivables: number;
  pendingPayables: number;
}
