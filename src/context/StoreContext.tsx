import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Role,
  Product,
  Category,
  Supplier,
  Sale,
  SaleItem,
  HeldSale,
  CashierUser,
  Profile,
  NotificationItem,
  StoreSettings,
  StockMovement,
  ActivityLog,
  PaymentMethod
} from '../types';
import {
  initialCategories,
  initialSuppliers,
  initialProducts,
  initialCashiers,
  initialProfiles,
  initialSales,
  initialNotifications,
  initialStockMovements,
  initialSettings,
  initialActivityLogs
} from '../data/initialData';
import { playSound } from '../utils/exportUtils';

interface StoreContextType {
  role: Role;
  setRole: (role: Role) => void;
  ownerDeviceView: 'DESKTOP' | 'MOBILE_PREVIEW';
  setOwnerDeviceView: (view: 'DESKTOP' | 'MOBILE_PREVIEW') => void;

  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  logout: () => void;
  loginAsOwner: (pin?: string) => boolean;
  loginAsCashier: (cashierId: string, pin?: string) => boolean;

  ownerTab: number;
  setOwnerTab: (tab: number) => void;
  cashierTab: number;
  setCashierTab: (tab: number) => void;

  currentCashier: CashierUser;
  setCurrentCashier: (cashier: CashierUser) => void;

  products: Product[];
  categories: Category[];
  suppliers: Supplier[];
  sales: Sale[];
  heldSales: HeldSale[];
  profiles: Profile[];
  cashiers: Profile[];
  notifications: NotificationItem[];
  stockMovements: StockMovement[];
  settings: StoreSettings;
  activityLogs: ActivityLog[];

  // POS Cart State
  cart: SaleItem[];
  addToCart: (product: Product, qty?: number) => void;
  updateCartQty: (productId: string, delta: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartDiscount: number;
  setCartDiscount: (discount: number) => void;
  cartDiscountReason: string;
  setCartDiscountReason: (reason: string) => void;

  // Key Store Actions
  completeSale: (paymentMethod: PaymentMethod, amountTendered: number) => Sale | null;
  holdCurrentSale: (note?: string) => void;
  restoreHeldSale: (heldSaleId: string) => void;
  deleteHeldSale: (heldSaleId: string) => void;
  processRefund: (saleId: string, reason: string, restockItems: boolean) => void;

  // Product Actions
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & { customId?: string }) => void;
  editProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  duplicateProduct: (id: string) => void;
  deactivateProduct: (id: string) => void;
  adjustStock: (productId: string, qtyDelta: number, reason: string, type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'DAMAGE' | 'RETURN') => void;

  // Category & Supplier Actions
  addCategory: (category: Omit<Category, 'id' | 'itemCount'>) => void;
  editCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'suppliedCount'>) => void;
  editSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  // Profile & Cashier Management
  addProfile: (profile: Omit<Profile, 'id' | 'todaySalesCount' | 'todaySalesTotal'>) => void;
  editProfile: (id: string, updates: Partial<Profile>) => void;
  deleteProfile: (id: string) => void;
  addCashier: (cashier: Omit<CashierUser, 'id' | 'todaySalesCount' | 'todaySalesTotal'>) => void;
  editCashier: (id: string, updates: Partial<CashierUser>) => void;
  toggleCashierShift: (id: string) => void;

  // Notifications & Settings
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  updateSettings: (newSettings: Partial<StoreSettings>) => void;
  logActivity: (action: string, details: string) => void;

  // Backup & Reset
  resetToDefaultData: () => void;
  exportDatabaseJSON: () => void;
  importDatabaseJSON: (jsonString: string) => boolean;

  // Database & Uploads
  dbSource: 'neon' | 'memory';
  uploadImage: (file: File) => Promise<string>;

  // Search Helpers
  getLowStockProducts: () => Product[];
  getOutOfStockProducts: () => Product[];
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role>('OWNER');
  const [ownerDeviceView, setOwnerDeviceView] = useState<'DESKTOP' | 'MOBILE_PREVIEW'>('DESKTOP');

  const [ownerTab, setOwnerTab] = useState<number>(0);
  const [cashierTab, setCashierTab] = useState<number>(0);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const logout = () => {
    setIsAuthenticated(false);
  };

  const loginAsOwner = (pin?: string) => {
    if (!pin) return false;
    const ownerProf = (profiles || cashiers || []).find(p => p.role === 'OWNER');
    const validPins = [ownerProf?.pin, settings?.ownerPin].filter(Boolean);
    if (validPins.includes(pin)) {
      setRole('OWNER');
      setIsAuthenticated(true);
      setOwnerTab(0);
      return true;
    }
    return false;
  };

  const loginAsCashier = (cashierId: string, pin?: string) => {
    if (!pin || !cashierId) return false;
    const target = (profiles || cashiers || []).find(
      c => c.id === cashierId || c.employeeId?.toLowerCase() === cashierId.toLowerCase()
    );
    if (!target) return false;
    if (target.pin && pin === target.pin) {
      setCurrentCashier(target);
      setRole(target.role || 'CASHIER');
      setIsAuthenticated(true);
      setCashierTab(0);
      return true;
    }
    return false;
  };

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [heldSales, setHeldSales] = useState<HeldSale[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [cashiers, setCashiers] = useState<Profile[]>(initialProfiles);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(initialStockMovements);
  const [settings, setSettings] = useState<StoreSettings>(initialSettings);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(initialActivityLogs);

  const [currentCashier, setCurrentCashier] = useState<Profile>(profiles[0] || initialProfiles[0]);

  // Cart State
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [cartDiscount, setCartDiscount] = useState<number>(0);
  const [cartDiscountReason, setCartDiscountReason] = useState<string>('');

  const [dbSource, setDbSource] = useState<'neon' | 'memory'>('memory');

  // Fetch initial data from backend API (Neon DB or server memory)
  useEffect(() => {
    async function loadBackendData() {
      try {
        const res = await fetch('/api/data');
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const json = await res.json();
          if (json.data) {
            if (json.source === 'neon') {
              setDbSource('neon');
            }
            if (Array.isArray(json.data.products)) setProducts(json.data.products);
            if (Array.isArray(json.data.categories)) setCategories(json.data.categories);
            if (Array.isArray(json.data.suppliers)) setSuppliers(json.data.suppliers);
            if (Array.isArray(json.data.sales)) setSales(json.data.sales);
            if (Array.isArray(json.data.profiles) && json.data.profiles.length > 0) {
              setProfiles(json.data.profiles);
              setCashiers(json.data.profiles);
            } else if (Array.isArray(json.data.cashiers) && json.data.cashiers.length > 0) {
              setProfiles(json.data.cashiers);
              setCashiers(json.data.cashiers);
            }
            if (Array.isArray(json.data.stockMovements)) setStockMovements(json.data.stockMovements);
            if (Array.isArray(json.data.activityLogs)) setActivityLogs(json.data.activityLogs);
            if (json.data.settings) setSettings(json.data.settings);
          }
        }
      } catch (err) {
        console.log('Using local client state fallback:', err);
      }
    }
    loadBackendData();
  }, []);

  // Sync changes directly to backend database API (no browser localStorage used)
  useEffect(() => {
    const dataToSave = {
      products,
      categories,
      suppliers,
      sales,
      heldSales,
      profiles,
      cashiers: profiles,
      notifications,
      stockMovements,
      settings,
      activityLogs,
    };

    fetch('/api/sync-state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToSave)
    }).catch(err => console.log('Backend sync error:', err));
  }, [products, categories, suppliers, sales, heldSales, profiles, notifications, stockMovements, settings, activityLogs]);

  // Upload image to API with local FileReader dataURL fallback
  const uploadImage = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const json = await res.json();
        if (json.url) return json.url;
      }
    } catch (e) {
      console.warn('API upload unavailable, using Data URL fallback', e);
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const logActivity = (action: string, details: string) => {
    const newLog: ActivityLog = {
      id: 'act-' + Date.now(),
      action,
      user: role === 'OWNER' ? 'Sarah Jenkins (Owner)' : currentCashier.name,
      role,
      details,
      createdAt: new Date().toISOString(),
    };
    setActivityLogs(prev => [newLog, ...prev]);
  };

  // Cart Functions
  const addToCart = (product: Product, qty: number = 1) => {
    if (product.stockQuantity <= 0) {
      if (settings.soundEffectsEnabled) playSound('alert');
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        const newQty = Math.min(existing.quantity + qty, product.stockQuantity);
        return prev.map(item =>
          item.productId === product.id
            ? { ...item, quantity: newQty, subtotal: newQty * item.unitPrice }
            : item
        );
      } else {
        const initialQty = Math.min(qty, product.stockQuantity);
        const newItem: SaleItem = {
          productId: product.id,
          productName: product.name,
          barcode: product.barcode,
          costPrice: product.costPrice,
          unitPrice: product.sellingPrice,
          quantity: initialQty,
          subtotal: initialQty * product.sellingPrice,
        };
        return [...prev, newItem];
      }
    });

    if (settings.soundEffectsEnabled) playSound('click');
  };

  const updateCartQty = (productId: string, delta: number) => {
    const product = products.find(p => p.id === productId);
    setCart(prev => {
      return prev.map(item => {
        if (item.productId === productId) {
          const maxAllowed = product ? product.stockQuantity : 999;
          const newQty = Math.max(1, Math.min(item.quantity + delta, maxAllowed));
          return { ...item, quantity: newQty, subtotal: newQty * item.unitPrice };
        }
        return item;
      });
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCartDiscount(0);
    setCartDiscountReason('');
  };

  // Complete Sale
  const completeSale = (paymentMethod: PaymentMethod, amountTendered: number): Sale | null => {
    if (cart.length === 0) return null;

    const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
    const taxAmount = (subtotal - cartDiscount) * (settings.taxPercent / 100);
    const totalAmount = Math.max(0, subtotal - cartDiscount + taxAmount);
    const costAmount = cart.reduce((acc, item) => acc + item.costPrice * item.quantity, 0);
    const profitAmount = totalAmount - costAmount;
    const changeGiven = Math.max(0, amountTendered - totalAmount);

    const now = new Date();
    const receiptNo = `REC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Math.floor(100 + Math.random() * 900))}`;

    const newSale: Sale = {
      id: 'sale-' + Date.now(),
      receiptNo,
      cashierId: currentCashier.id,
      cashierName: currentCashier.name,
      items: [...cart],
      subtotal,
      taxAmount,
      discountAmount: cartDiscount,
      discountReason: cartDiscountReason || undefined,
      totalAmount,
      costAmount,
      profitAmount,
      paymentMethod,
      amountTendered,
      changeGiven,
      status: 'COMPLETED',
      createdAt: now.toISOString(),
    };

    // Decrement stock levels and add stock movement logs
    const updatedProducts = [...products];
    const newMovements: StockMovement[] = [];
    const newAlertNotifs: NotificationItem[] = [];

    cart.forEach(cartItem => {
      const pIndex = updatedProducts.findIndex(p => p.id === cartItem.productId);
      if (pIndex !== -1) {
        const prod = updatedProducts[pIndex];
        const prevQty = prod.stockQuantity;
        const newQty = Math.max(0, prevQty - cartItem.quantity);

        updatedProducts[pIndex] = {
          ...prod,
          stockQuantity: newQty,
          updatedAt: now.toISOString(),
        };

        newMovements.push({
          id: 'mov-' + Date.now() + Math.random(),
          productId: prod.id,
          productName: prod.name,
          type: 'OUT',
          quantityChange: -cartItem.quantity,
          previousQuantity: prevQty,
          newQuantity: newQty,
          reason: `POS Sale #${receiptNo}`,
          performedBy: currentCashier.name,
          createdAt: now.toISOString(),
        });

        // Trigger notifications if low stock or out of stock
        if (newQty === 0) {
          newAlertNotifs.push({
            id: 'notif-' + Date.now() + Math.random(),
            title: 'Out of Stock Alert',
            message: `${prod.name} is now completely OUT OF STOCK!`,
            type: 'OUT_OF_STOCK',
            isRead: false,
            createdAt: now.toISOString(),
            linkTab: 'inventory',
          });
        } else if (newQty <= prod.minStockLevel && prevQty > prod.minStockLevel) {
          newAlertNotifs.push({
            id: 'notif-' + Date.now() + Math.random(),
            title: 'Low Stock Alert',
            message: `${prod.name} is running low (${newQty} left).`,
            type: 'LOW_STOCK',
            isRead: false,
            createdAt: now.toISOString(),
            linkTab: 'inventory',
          });
        }
      }
    });

    if (totalAmount > 100) {
      newAlertNotifs.push({
        id: 'notif-' + Date.now() + Math.random(),
        title: 'Large Sale Registered',
        message: `High value sale #${receiptNo} ($${totalAmount.toFixed(2)}) processed by ${currentCashier.name}`,
        type: 'LARGE_SALE',
        isRead: false,
        createdAt: now.toISOString(),
        linkTab: 'sales',
      });
    }

    setProducts(updatedProducts);
    setSales(prev => [newSale, ...prev]);
    setStockMovements(prev => [...newMovements, ...prev]);
    if (newAlertNotifs.length > 0) {
      setNotifications(prev => [...newAlertNotifs, ...prev]);
    }

    // Update Cashier today's totals
    setCashiers(prev =>
      prev.map(c =>
        c.id === currentCashier.id
          ? {
              ...c,
              todaySalesCount: c.todaySalesCount + 1,
              todaySalesTotal: c.todaySalesTotal + totalAmount,
            }
          : c
      )
    );

    logActivity('COMPLETED_SALE', `Processed transaction ${receiptNo} for ${settings.currencySymbol}${totalAmount.toFixed(2)}`);

    if (settings.soundEffectsEnabled) playSound('success');

    clearCart();
    return newSale;
  };

  // Hold & Restore Sale
  const holdCurrentSale = (note?: string) => {
    if (cart.length === 0) return;
    const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
    const taxAmount = (subtotal - cartDiscount) * (settings.taxPercent / 100);

    const held: HeldSale = {
      id: 'held-' + Date.now(),
      cashierId: currentCashier.id,
      cashierName: currentCashier.name,
      items: [...cart],
      subtotal,
      taxAmount,
      discountAmount: cartDiscount,
      note,
      createdAt: new Date().toISOString(),
    };

    setHeldSales(prev => [held, ...prev]);
    clearCart();
    logActivity('HELD_SALE', `Put sale on hold with ${cart.length} items`);
    if (settings.soundEffectsEnabled) playSound('beep');
  };

  const restoreHeldSale = (heldSaleId: string) => {
    const found = heldSales.find(h => h.id === heldSaleId);
    if (found) {
      setCart(found.items);
      setCartDiscount(found.discountAmount || 0);
      setHeldSales(prev => prev.filter(h => h.id !== heldSaleId));
      logActivity('RESTORED_HELD_SALE', `Restored held sale with ${found.items.length} items`);
    }
  };

  const deleteHeldSale = (heldSaleId: string) => {
    setHeldSales(prev => prev.filter(h => h.id !== heldSaleId));
  };

  // Process Refund
  const processRefund = (saleId: string, reason: string, restockItems: boolean) => {
    const targetSale = sales.find(s => s.id === saleId);
    if (!targetSale || targetSale.status === 'REFUNDED') return;

    setSales(prev =>
      prev.map(s =>
        s.id === saleId
          ? { ...s, status: 'REFUNDED', refundReason: reason, refundApprovedBy: role === 'OWNER' ? 'Sarah Jenkins (Owner)' : currentCashier.name }
          : s
      )
    );

    if (restockItems) {
      const updatedProds = [...products];
      const newMovs: StockMovement[] = [];

      targetSale.items.forEach(item => {
        const pIndex = updatedProds.findIndex(p => p.id === item.productId);
        if (pIndex !== -1) {
          const prod = updatedProds[pIndex];
          const prevQty = prod.stockQuantity;
          const newQty = prevQty + item.quantity;

          updatedProds[pIndex] = { ...prod, stockQuantity: newQty };
          newMovs.push({
            id: 'mov-' + Date.now() + Math.random(),
            productId: prod.id,
            productName: prod.name,
            type: 'RETURN',
            quantityChange: item.quantity,
            previousQuantity: prevQty,
            newQuantity: newQty,
            reason: `Refund Restock for #${targetSale.receiptNo}`,
            performedBy: role === 'OWNER' ? 'Owner' : currentCashier.name,
            createdAt: new Date().toISOString(),
          });
        }
      });

      setProducts(updatedProds);
      setStockMovements(prev => [...newMovs, ...prev]);
    }

    logActivity('REFUND_APPROVED', `Approved refund for sale #${targetSale.receiptNo}. Reason: ${reason}`);
  };

  // Product CRUD
  const addProduct = (prodData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & { customId?: string }) => {
    const now = new Date().toISOString();
    const { customId, ...rest } = prodData;
    const newProd: Product = {
      ...rest,
      id: customId && customId.trim() ? customId.trim() : 'prod-' + Date.now(),
      createdAt: now,
      updatedAt: now,
    };
    setProducts(prev => [newProd, ...prev]);

    // Add stock movement if initial stock > 0
    if (newProd.stockQuantity > 0) {
      const movement: StockMovement = {
        id: 'mov-' + Date.now(),
        productId: newProd.id,
        productName: newProd.name,
        type: 'IN',
        quantityChange: newProd.stockQuantity,
        previousQuantity: 0,
        newQuantity: newProd.stockQuantity,
        reason: 'Initial stock on creation',
        performedBy: 'Sarah Jenkins (Owner)',
        createdAt: now,
      };
      setStockMovements(prev => [movement, ...prev]);
    }

    logActivity('ADD_PRODUCT', `Added new product: ${newProd.name} (${newProd.barcode})`);
  };

  const editProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev =>
      prev.map(p => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p))
    );
    logActivity('EDIT_PRODUCT', `Updated product ID ${id}`);
  };

  const deleteProduct = (id: string) => {
    const prod = products.find(p => p.id === id);
    setProducts(prev => prev.filter(p => p.id !== id));
    logActivity('DELETE_PRODUCT', `Deleted product: ${prod?.name || id}`);
    fetch(`/api/products/${id}`, { method: 'DELETE' }).catch(e => console.warn('Delete product API error', e));
  };

  const duplicateProduct = (id: string) => {
    const prod = products.find(p => p.id === id);
    if (!prod) return;
    const now = new Date().toISOString();
    const newProd: Product = {
      ...prod,
      id: 'prod-' + Date.now(),
      name: `${prod.name} (Copy)`,
      barcode: String(Math.floor(100000000000 + Math.random() * 900000000000)),
      createdAt: now,
      updatedAt: now,
    };
    setProducts(prev => [newProd, ...prev]);
    logActivity('DUPLICATE_PRODUCT', `Duplicated product: ${prod.name}`);
  };

  const deactivateProduct = (id: string) => {
    setProducts(prev =>
      prev.map(p => (p.id === id ? { ...p, isActive: !p.isActive, updatedAt: new Date().toISOString() } : p))
    );
  };

  const adjustStock = (
    productId: string,
    qtyDelta: number,
    reason: string,
    type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'DAMAGE' | 'RETURN'
  ) => {
    const pIndex = products.findIndex(p => p.id === productId);
    if (pIndex === -1) return;

    const prod = products[pIndex];
    const prevQty = prod.stockQuantity;
    const newQty = Math.max(0, prevQty + qtyDelta);

    const updated = [...products];
    updated[pIndex] = { ...prod, stockQuantity: newQty, updatedAt: new Date().toISOString() };
    setProducts(updated);

    const movement: StockMovement = {
      id: 'mov-' + Date.now(),
      productId,
      productName: prod.name,
      type,
      quantityChange: qtyDelta,
      previousQuantity: prevQty,
      newQuantity: newQty,
      reason,
      performedBy: role === 'OWNER' ? 'Owner' : currentCashier.name,
      createdAt: new Date().toISOString(),
    };

    setStockMovements(prev => [movement, ...prev]);
    logActivity('STOCK_ADJUSTMENT', `Adjusted stock for ${prod.name} by ${qtyDelta > 0 ? '+' : ''}${qtyDelta} (${reason})`);
  };

  // Category & Supplier Actions
  const addCategory = (catData: Omit<Category, 'id' | 'itemCount'>) => {
    const newCat: Category = {
      ...catData,
      id: 'cat-' + Date.now(),
      itemCount: 0,
    };
    setCategories(prev => [...prev, newCat]);
    logActivity('ADD_CATEGORY', `Created category ${newCat.name}`);
  };

  const editCategory = (id: string, updates: Partial<Category>) => {
    setCategories(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    fetch(`/api/categories/${id}`, { method: 'DELETE' }).catch(e => console.warn('Delete category API error', e));
  };

  const addSupplier = (supData: Omit<Supplier, 'id' | 'suppliedCount'>) => {
    const newSup: Supplier = {
      ...supData,
      id: 'sup-' + Date.now(),
      suppliedCount: 0,
    };
    setSuppliers(prev => [...prev, newSup]);
    logActivity('ADD_SUPPLIER', `Added supplier ${newSup.name}`);
  };

  const editSupplier = (id: string, updates: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(s => (s.id === id ? { ...s, ...updates } : s)));
  };

  const deleteSupplier = (id: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
    fetch(`/api/suppliers/${id}`, { method: 'DELETE' }).catch(e => console.warn('Delete supplier API error', e));
  };

  // Profile & Cashier Management
  const addProfile = (profData: Omit<Profile, 'id' | 'todaySalesCount' | 'todaySalesTotal'>) => {
    const newProfile: Profile = {
      ...profData,
      id: 'prof-' + Date.now(),
      todaySalesCount: 0,
      todaySalesTotal: 0,
    };
    setProfiles(prev => [...prev, newProfile]);
    setCashiers(prev => [...prev, newProfile]);
    logActivity('ADD_PROFILE', `Added user profile: ${newProfile.name} (${newProfile.role || 'CASHIER'})`);
  };

  const editProfile = (id: string, updates: Partial<Profile>) => {
    setProfiles(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
    setCashiers(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteProfile = (id: string) => {
    setProfiles(prev => prev.filter(c => c.id !== id));
    setCashiers(prev => prev.filter(c => c.id !== id));
    logActivity('DELETE_PROFILE', `Deleted profile ID: ${id}`);
    fetch(`/api/profiles/${id}`, { method: 'DELETE' }).catch(e => console.warn('Delete profile API error', e));
  };

  const addCashier = (cashData: Omit<CashierUser, 'id' | 'todaySalesCount' | 'todaySalesTotal'>) => {
    addProfile(cashData);
  };

  const editCashier = (id: string, updates: Partial<CashierUser>) => {
    editProfile(id, updates);
  };

  const toggleCashierShift = (id: string) => {
    const updater = (prev: Profile[]) =>
      prev.map(c => {
        if (c.id === id) {
          const isEnding = !!c.currentShiftStartedAt;
          return {
            ...c,
            currentShiftStartedAt: isEnding ? undefined : new Date().toISOString(),
          };
        }
        return c;
      });
    setProfiles(updater);
    setCashiers(updater);
  };

  // Notifications & Settings
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const updateSettings = (newSet: Partial<StoreSettings>) => {
    setSettings(prev => ({ ...prev, ...newSet }));
    logActivity('UPDATE_SETTINGS', 'Updated store settings & defaults');
  };

  // Reset & Backup
  const resetToDefaultData = () => {
    setProducts(initialProducts);
    setCategories(initialCategories);
    setSuppliers(initialSuppliers);
    setSales(initialSales);
    setHeldSales([]);
    setCashiers(initialCashiers);
    setNotifications(initialNotifications);
    setStockMovements(initialStockMovements);
    setSettings(initialSettings);
    setActivityLogs(initialActivityLogs);
    logActivity('SYSTEM_RESET', 'Database reset to default seed state');
    fetch('/api/reset', { method: 'POST' }).catch(e => console.warn('Reset API error', e));
  };

  const exportDatabaseJSON = () => {
    const data = {
      products,
      categories,
      suppliers,
      sales,
      heldSales,
      cashiers,
      notifications,
      stockMovements,
      settings,
      activityLogs,
      exportedAt: new Date().toISOString(),
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `store_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const importDatabaseJSON = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.products && parsed.sales && parsed.settings) {
        setProducts(parsed.products);
        if (parsed.categories) setCategories(parsed.categories);
        if (parsed.suppliers) setSuppliers(parsed.suppliers);
        setSales(parsed.sales);
        if (parsed.heldSales) setHeldSales(parsed.heldSales);
        if (parsed.cashiers) setCashiers(parsed.cashiers);
        if (parsed.notifications) setNotifications(parsed.notifications);
        if (parsed.stockMovements) setStockMovements(parsed.stockMovements);
        setSettings(parsed.settings);
        if (parsed.activityLogs) setActivityLogs(parsed.activityLogs);
        return true;
      }
    } catch (e) {
      console.error('Import error', e);
    }
    return false;
  };

  const getLowStockProducts = () => {
    return products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= p.minStockLevel);
  };

  const getOutOfStockProducts = () => {
    return products.filter(p => p.stockQuantity <= 0);
  };

  return (
    <StoreContext.Provider
      value={{
        role,
        setRole,
        ownerDeviceView,
        setOwnerDeviceView,
        isAuthenticated,
        setIsAuthenticated,
        logout,
        loginAsOwner,
        loginAsCashier,
        ownerTab,
        setOwnerTab,
        cashierTab,
        setCashierTab,
        currentCashier,
        setCurrentCashier,

        products,
        categories,
        suppliers,
        sales,
        heldSales,
        profiles,
        cashiers,
        notifications,
        stockMovements,
        settings,
        activityLogs,

        cart,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        cartDiscount,
        setCartDiscount,
        cartDiscountReason,
        setCartDiscountReason,

        completeSale,
        holdCurrentSale,
        restoreHeldSale,
        deleteHeldSale,
        processRefund,

        addProduct,
        editProduct,
        deleteProduct,
        duplicateProduct,
        deactivateProduct,
        adjustStock,

        addCategory,
        editCategory,
        deleteCategory,

        addSupplier,
        editSupplier,
        deleteSupplier,

        addProfile,
        editProfile,
        deleteProfile,
        addCashier,
        editCashier,
        toggleCashierShift,

        markNotificationAsRead,
        markAllNotificationsAsRead,
        updateSettings,
        logActivity,

        resetToDefaultData,
        exportDatabaseJSON,
        importDatabaseJSON,

        dbSource,
        uploadImage,

        getLowStockProducts,
        getOutOfStockProducts,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
