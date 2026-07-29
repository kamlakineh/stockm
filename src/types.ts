export type Role = 'OWNER' | 'CASHIER';

export type PaymentMethod = 'CASH' | 'CARD' | 'MOBILE_MONEY';

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface Product {
  id: string;
  name: string;
  barcode: string;
  categoryId: string;
  categoryName: string;
  supplierId: string;
  supplierName: string;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  itemCount: number;
  isHidden: boolean;
  sortOrder: number;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  status: 'ACTIVE' | 'INACTIVE';
  suppliedCount: number;
}

export interface SaleItem {
  productId: string;
  productName: string;
  barcode: string;
  costPrice: number;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  receiptNo: string;
  cashierId: string;
  cashierName: string;
  items: SaleItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  discountReason?: string;
  totalAmount: number;
  costAmount: number;
  profitAmount: number;
  paymentMethod: PaymentMethod;
  amountTendered: number;
  changeGiven: number;
  status: 'COMPLETED' | 'REFUNDED' | 'CANCELLED' | 'HELD';
  refundReason?: string;
  refundApprovedBy?: string;
  createdAt: string;
}

export interface HeldSale {
  id: string;
  cashierId: string;
  cashierName: string;
  customerName?: string;
  items: SaleItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  note?: string;
  createdAt: string;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string;
  employeeId: string;
  pin: string;
  role?: Role;
  isActive: boolean;
  canGiveDiscount: boolean;
  maxDiscountPercent: number;
  canProcessRefund: boolean;
  canAddProducts?: boolean;
  currentShiftStartedAt?: string;
  avatarUrl?: string;
  todaySalesCount: number;
  todaySalesTotal: number;
}

export type CashierUser = Profile;
export type UserProfile = Profile;

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'DAMAGE' | 'RETURN';
  quantityChange: number; // positive or negative
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  performedBy: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'LARGE_SALE' | 'REFUND_REQUEST' | 'CASHIER_ACTIVITY' | 'SYSTEM';
  isRead: boolean;
  createdAt: string;
  linkTab?: string;
}

export interface StoreSettings {
  storeName: string;
  logoUrl: string;
  address: string;
  phone: string;
  email: string;
  taxPercent: number;
  currencySymbol: string;
  receiptHeaderMessage: string;
  receiptFooterMessage: string;
  enableQrOnReceipt: boolean;
  enableLogoOnReceipt: boolean;
  autoPrintReceipt: boolean;
  soundEffectsEnabled: boolean;
  ownerPin: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  user: string;
  role: Role;
  details: string;
  createdAt: string;
}
