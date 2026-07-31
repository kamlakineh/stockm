import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product, Sale } from '../../types';
import {
  Search,
  Camera,
  Grid,
  List,
  Plus,
  Minus,
  Trash2,
  Clock,
  CheckCircle,
  CreditCard,
  Banknote,
  Smartphone,
  X,
  Lock,
  Tag,
  DollarSign,
} from 'lucide-react';
import CameraScannerModal from '../common/CameraScannerModal';
import ReceiptModal from '../common/ReceiptModal';
import AddProductModal from '../common/AddProductModal';
import { playSound } from '../../utils/exportUtils';

export const CashierPOS: React.FC = () => {
  const {
    products,
    categories,
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
    heldSales,
    restoreHeldSale,
    currentCashier,
    settings,
    role,
  } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('ALL');
  const [layoutMode, setLayoutMode] = useState<'GRID' | 'LIST'>('GRID');

  // Modals
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showHeldSalesModal, setShowHeldSalesModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [completedReceiptSale, setCompletedReceiptSale] = useState<Sale | null>(null);

  const canAddProducts = currentCashier?.canAddProducts || role === 'OWNER';

  // Checkout State
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'MOBILE_MONEY'>('CASH');
  const [amountTendered, setAmountTendered] = useState<string>('');

  // Discount form
  const [discPercent, setDiscPercent] = useState('');
  const [discReason, setDiscReason] = useState('');
  const [ownerPinInput, setOwnerPinInput] = useState('');

  // Filtered Products
  const filteredProducts = products.filter(p => {
    if (!p.isActive) return false;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode.includes(searchTerm);
    const matchesCat = selectedCat === 'ALL' || p.categoryId === selectedCat;
    return matchesSearch && matchesCat;
  });

  const cartSubtotal = cart.reduce((acc, i) => acc + i.subtotal, 0);
  const cartTax = (cartSubtotal - cartDiscount) * (settings.taxPercent / 100);
  const cartTotal = Math.max(0, cartSubtotal - cartDiscount + cartTax);

  const tenderedNum = parseFloat(amountTendered) || 0;
  const changeGiven = Math.max(0, tenderedNum - cartTotal);

  const handleApplyDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    const percent = parseFloat(discPercent) || 0;
    if (percent > currentCashier.maxDiscountPercent) {
      if (ownerPinInput !== settings.ownerPin) {
        alert(`Discount exceeds cashier limit (${currentCashier.maxDiscountPercent}%). Invalid Owner PIN.`);
        return;
      }
    }
    const discountVal = (cartSubtotal * percent) / 100;
    setCartDiscount(discountVal);
    setCartDiscountReason(discReason || `${percent}% Discount`);
    setShowDiscountModal(false);
    setDiscPercent('');
    setDiscReason('');
    setOwnerPinInput('');
  };

  const handleFinalCheckout = () => {
    const sale = completeSale(paymentMethod, paymentMethod === 'CASH' ? tenderedNum : cartTotal);
    if (sale) {
      setCompletedReceiptSale(sale);
      setShowCheckoutModal(false);
      setAmountTendered('');
    }
  };

  return (
    <div className="space-y-3 pb-16">
      {/* Top POS Search & Barcode Scan Bar */}
      <div className="flex items-center gap-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Scan barcode or search product..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
          />
        </div>

        <button
          onClick={() => setShowCameraScanner(true)}
          className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-1 text-[11px] shadow-sm shadow-emerald-600/30"
          title="Camera Barcode Scanner"
        >
          <Camera className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Scan</span>
        </button>

        {canAddProducts && (
          <button
            onClick={() => setShowAddProductModal(true)}
            className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold flex items-center gap-1 text-[11px] shadow-sm shadow-indigo-600/30 shrink-0"
            title="Add New Inventory Product"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Add Item</span>
          </button>
        )}

        {/* Layout Mode Toggle */}
        <div className="bg-slate-800 p-1 rounded-lg border border-slate-700/80 flex items-center">
          <button
            onClick={() => setLayoutMode('GRID')}
            className={`p-1 rounded ${layoutMode === 'GRID' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setLayoutMode('LIST')}
            className={`p-1 rounded ${layoutMode === 'LIST' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Category Chips Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
        <button
          onClick={() => setSelectedCat('ALL')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
            selectedCat === 'ALL'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          All Items
        </button>
        {categories.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedCat(c.id)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
              selectedCat === c.id
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Main Grid: Products Catalog vs Cart Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left Column: Product Selection Catalog */}
        <div className="lg:col-span-7 xl:col-span-8">
          {layoutMode === 'GRID' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 max-h-[520px] overflow-y-auto pr-1">
              {filteredProducts.map(prod => {
                const isOut = prod.stockQuantity <= 0;
                return (
                  <div
                    key={prod.id}
                    onClick={() => addToCart(prod)}
                    className={`p-2.5 bg-slate-900 border rounded-xl cursor-pointer transition-all hover:border-emerald-500/50 flex flex-col justify-between ${
                      isOut ? 'opacity-40 border-slate-800' : 'border-slate-800/80 shadow-xs hover:scale-[1.01]'
                    }`}
                  >
                    <div>
                      <div className="h-18 sm:h-20 rounded-lg overflow-hidden bg-slate-950 mb-1.5 border border-slate-800/80 relative">
                        <img
                          src={prod.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80'}
                          alt={prod.name}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1 right-1 px-1 py-0.2 bg-slate-900/90 text-slate-300 font-mono text-[8px] rounded font-bold">
                          {prod.stockQuantity} stock
                        </span>
                      </div>
                      <div className="font-bold text-[11px] text-slate-100 line-clamp-1">{prod.name}</div>
                      <div className="text-[9px] text-slate-400 font-mono">{prod.barcode}</div>
                    </div>
                    <div className="mt-1.5 pt-1.5 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="font-extrabold text-[11px] text-emerald-400">
                        {prod.sellingPrice.toFixed(2)} {settings.currencySymbol}
                      </span>
                      <span className="p-0.5 bg-emerald-600/20 text-emerald-400 rounded-md">
                        <Plus className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1">
              {filteredProducts.map(prod => (
                <div
                  key={prod.id}
                  onClick={() => addToCart(prod)}
                  className="p-2 bg-slate-900 border border-slate-800/80 rounded-xl flex items-center justify-between cursor-pointer hover:border-emerald-500/50 transition-all text-xs"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={prod.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=100&q=80'}
                      alt={prod.name}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                    <div>
                      <div className="font-bold text-[11px] text-slate-100">{prod.name}</div>
                      <div className="text-[9px] text-slate-400 font-mono">{prod.barcode} • {prod.categoryName}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-emerald-400">
                      {prod.sellingPrice.toFixed(2)} {settings.currencySymbol}
                    </span>
                    <button className="p-1 bg-emerald-600 text-white rounded text-xs font-bold">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Active Cart & Checkout Panel */}
        <div className="lg:col-span-5 xl:col-span-4 bg-slate-900 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-lg">
          <div>
            {/* Cart Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-slate-100 flex items-center gap-1.5">
                  Shopping Cart
                  <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px]">
                    {cart.reduce((a, c) => a + c.quantity, 0)} items
                  </span>
                </h3>
              </div>

              <div className="flex items-center gap-1.5">
                {heldSales.length > 0 && (
                  <button
                    onClick={() => setShowHeldSalesModal(true)}
                    className="p-1 text-amber-400 hover:bg-slate-800 rounded text-xs font-bold flex items-center gap-1"
                    title="Recover Held Sale"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-[9px]">{heldSales.length} Held</span>
                  </button>
                )}
                <button
                  onClick={clearCart}
                  className="p-1 text-rose-400 hover:bg-rose-950/40 rounded text-xs font-semibold"
                  title="Clear Cart"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 mb-3">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Cart is empty. Tap products or scan barcode to add.
                </div>
              ) : (
                cart.map(item => (
                  <div
                    key={item.productId}
                    className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex-1 pr-2">
                      <div className="font-semibold text-slate-200 line-clamp-1">{item.productName}</div>
                      <div className="text-[10px] text-emerald-400 font-bold">
                        {item.unitPrice.toFixed(2)} {settings.currencySymbol} x {item.quantity} = {item.subtotal.toFixed(2)} {settings.currencySymbol}
                      </div>
                    </div>

                    {/* Stepper Buttons */}
                    <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-700/80">
                      <button
                        onClick={() => updateCartQty(item.productId, -1)}
                        className="p-1 text-slate-400 hover:text-white"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold text-xs px-1 text-white">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQty(item.productId, 1)}
                        className="p-1 text-slate-400 hover:text-white"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Cart Totals & Checkout Actions */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Subtotal</span>
                <span>{cartSubtotal.toFixed(2)} {settings.currencySymbol}</span>
              </div>
              {cartDiscount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount ({cartDiscountReason})</span>
                  <span>-{cartDiscount.toFixed(2)} {settings.currencySymbol}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Tax ({settings.taxPercent}%)</span>
                <span>{cartTax.toFixed(2)} {settings.currencySymbol}</span>
              </div>
              <div className="flex justify-between font-black text-base text-white pt-2 border-t border-slate-800">
                <span>GRAND TOTAL</span>
                <span className="text-emerald-400">{cartTotal.toFixed(2)} {settings.currencySymbol}</span>
              </div>
            </div>

            {/* Quick Discount & Hold Sale buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowDiscountModal(true)}
                disabled={cart.length === 0}
                className="py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Tag className="w-3.5 h-3.5" />
                Apply Discount
              </button>
              <button
                onClick={() => holdCurrentSale('Customer pause')}
                disabled={cart.length === 0}
                className="py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-semibold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Clock className="w-3.5 h-3.5" />
                Hold Sale
              </button>
            </div>

            {/* Complete Sale Primary Checkout Button */}
            <button
              onClick={() => {
                setAmountTendered(cartTotal.toFixed(2));
                setShowCheckoutModal(true);
              }}
              disabled={cart.length === 0}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold rounded-2xl shadow-xl shadow-emerald-600/30 text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
            >
              CHECKOUT ({cartTotal.toFixed(2)} {settings.currencySymbol})
            </button>
          </div>
        </div>
      </div>

      {/* CHECKOUT MODAL WITH CASH CHANGE CALCULATOR */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-slate-100 relative">
            <button
              onClick={() => setShowCheckoutModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-lg text-slate-100 mb-1">Process Payment</h3>
            <p className="text-xs text-slate-400 mb-4">Total Amount Due: <span className="font-bold text-emerald-400 text-sm">{cartTotal.toFixed(2)} {settings.currencySymbol}</span></p>

            {/* Payment Tabs */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button
                onClick={() => setPaymentMethod('CASH')}
                className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border ${
                  paymentMethod === 'CASH'
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                <Banknote className="w-4 h-4" /> Cash
              </button>
              <button
                onClick={() => setPaymentMethod('CARD')}
                className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border ${
                  paymentMethod === 'CARD'
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                <CreditCard className="w-4 h-4" /> Card
              </button>
              <button
                onClick={() => setPaymentMethod('MOBILE_MONEY')}
                className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border ${
                  paymentMethod === 'MOBILE_MONEY'
                    ? 'bg-purple-600 border-purple-500 text-white shadow'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                <Smartphone className="w-4 h-4" /> Mobile
              </button>
            </div>

            {/* Cash Calculator if CASH */}
            {paymentMethod === 'CASH' && (
              <div className="space-y-3 mb-5">
                <label className="block text-xs font-semibold text-slate-400">Amount Tendered</label>
                <input
                  type="number"
                  step="0.01"
                  value={amountTendered}
                  onChange={e => setAmountTendered(e.target.value)}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-lg font-bold"
                />

                {/* Quick Bills Buttons */}
                <div className="flex gap-2">
                  {[10, 20, 50, 100].map(bill => (
                    <button
                      key={bill}
                      onClick={() => setAmountTendered(bill.toString())}
                      className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-200"
                    >
                      ${bill}
                    </button>
                  ))}
                </div>

                {/* Change Calculation Box */}
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Change Returned:</span>
                  <span className="font-black text-lg text-emerald-400">
                    {changeGiven.toFixed(2)} {settings.currencySymbol}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleFinalCheckout}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl shadow-xl shadow-emerald-600/30 text-sm"
            >
              Confirm & Print Receipt
            </button>
          </div>
        </div>
      )}

      {/* RECOVER HELD SALES MODAL */}
      {showHeldSalesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-slate-100 relative">
            <button
              onClick={() => setShowHeldSalesModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-base mb-3">Restore Held Transaction</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {heldSales.map(h => (
                <div key={h.id} className="p-3 bg-slate-800 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-200">{h.items.length} Items (${h.subtotal.toFixed(2)})</div>
                    <div className="text-[10px] text-slate-400">{new Date(h.createdAt).toLocaleTimeString()}</div>
                  </div>
                  <button
                    onClick={() => {
                      restoreHeldSale(h.id);
                      setShowHeldSalesModal(false);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-lg"
                  >
                    Restore Cart
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DISCOUNT MODAL */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xs w-full p-6 text-slate-100 relative">
            <button
              onClick={() => setShowDiscountModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-base mb-3">Apply Discount %</h3>
            <form onSubmit={handleApplyDiscount} className="space-y-3 text-xs">
              <input
                type="number"
                placeholder="Discount % e.g. 10"
                value={discPercent}
                onChange={e => setDiscPercent(e.target.value)}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                required
              />
              <input
                type="text"
                placeholder="Reason e.g. VIP Customer"
                value={discReason}
                onChange={e => setDiscReason(e.target.value)}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
              />

              {parseFloat(discPercent) > currentCashier.maxDiscountPercent && (
                <div className="p-2.5 bg-amber-950/60 border border-amber-800/80 rounded-xl space-y-1">
                  <span className="text-[10px] text-amber-300 block font-semibold">Owner PIN required for &gt;{currentCashier.maxDiscountPercent}% discount</span>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="Enter Owner PIN e.g. 0000"
                    value={ownerPinInput}
                    onChange={e => setOwnerPinInput(e.target.value)}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-center"
                  />
                </div>
              )}

              <button type="submit" className="w-full py-2.5 bg-emerald-600 text-white font-bold rounded-xl">
                Apply Discount
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Camera Scanner Modal */}
      <CameraScannerModal
        isOpen={showCameraScanner}
        onClose={() => setShowCameraScanner(false)}
        onScanSuccess={scannedCode => {
          const match = products.find(p => p.barcode === scannedCode);
          if (match) {
            addToCart(match);
          } else {
            setSearchTerm(scannedCode);
          }
        }}
      />

      {/* Completed Receipt Modal */}
      <ReceiptModal
        sale={completedReceiptSale}
        isOpen={!!completedReceiptSale}
        onClose={() => setCompletedReceiptSale(null)}
      />

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={showAddProductModal}
        onClose={() => setShowAddProductModal(false)}
      />
    </div>
  );
};

export default CashierPOS;
