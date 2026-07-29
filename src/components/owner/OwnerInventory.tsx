import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product, Category, Supplier } from '../../types';
import {
  Package,
  Plus,
  Search,
  Filter,
  Barcode as BarcodeIcon,
  Edit,
  Trash2,
  Copy,
  Power,
  Printer,
  SlidersHorizontal,
  Layers,
  Truck,
  History,
  AlertTriangle,
  CheckCircle,
  X,
  Camera,
} from 'lucide-react';
import BarcodeGeneratorModal from '../common/BarcodeGeneratorModal';
import CameraScannerModal from '../common/CameraScannerModal';

export const OwnerInventory: React.FC = () => {
  const {
    products,
    categories,
    suppliers,
    stockMovements,
    settings,
    currentCashier,
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
    dbSource,
    uploadImage,
  } = useStore();

  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [activeSubView, setActiveSubView] = useState<'PRODUCTS' | 'CATEGORIES' | 'SUPPLIERS' | 'MOVEMENTS' | 'ADJUSTMENT'>('PRODUCTS');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [selectedStockFilter, setSelectedStockFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');

  // Modals state
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [barcodeModalProduct, setBarcodeModalProduct] = useState<Product | null>(null);
  const [showCameraScanner, setShowCameraScanner] = useState(false);

  // New Category / Supplier Modal
  const [showCatModal, setShowCatModal] = useState(false);
  const [showSupModal, setShowSupModal] = useState(false);

  // Product Form state
  const [pCustomId, setPCustomId] = useState('');
  const [pName, setPName] = useState('');
  const [pBarcode, setPBarcode] = useState('');
  const [pCatId, setPCatId] = useState('');
  const [pSupId, setPSupId] = useState('');
  const [pCost, setPCost] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pStock, setPStock] = useState('');
  const [pMinStock, setPMinStock] = useState('');
  const [pImageUrl, setPImageUrl] = useState('');

  // Stock Adjustment Form state
  const [adjProductId, setAdjProductId] = useState('');
  const [adjQty, setAdjQty] = useState('');
  const [adjType, setAdjType] = useState<'IN' | 'OUT' | 'ADJUSTMENT' | 'DAMAGE' | 'RETURN'>('IN');
  const [adjReason, setAdjReason] = useState('');

  // Category Form
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');

  // Supplier Form
  const [supName, setSupName] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supAddress, setSupAddress] = useState('');

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode.includes(searchTerm) || p.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategoryFilter === 'ALL' || p.categoryId === selectedCategoryFilter;
    let matchesStock = true;
    if (selectedStockFilter === 'IN_STOCK') matchesStock = p.stockQuantity > p.minStockLevel;
    if (selectedStockFilter === 'LOW_STOCK') matchesStock = p.stockQuantity > 0 && p.stockQuantity <= p.minStockLevel;
    if (selectedStockFilter === 'OUT_OF_STOCK') matchesStock = p.stockQuantity <= 0;
    return matchesSearch && matchesCat && matchesStock;
  });

  const openAddProductModal = () => {
    setEditingProduct(null);
    setPCustomId(`PROD-${Math.floor(100 + Math.random() * 900)}`);
    setPName('');
    setPBarcode(String(Math.floor(890000000000 + Math.random() * 9999999999)));
    setPCatId(categories[0]?.id || '');
    setPSupId(suppliers[0]?.id || '');
    setPCost('1.00');
    setPPrice('2.00');
    setPStock('20');
    setPMinStock('5');
    setPImageUrl('');
    setShowAddProductModal(true);
  };

  const openEditProductModal = (prod: Product) => {
    setEditingProduct(prod);
    setPCustomId(prod.id);
    setPName(prod.name);
    setPBarcode(prod.barcode);
    setPCatId(prod.categoryId);
    setPSupId(prod.supplierId);
    setPCost(prod.costPrice.toString());
    setPPrice(prod.sellingPrice.toString());
    setPStock(prod.stockQuantity.toString());
    setPMinStock(prod.minStockLevel.toString());
    setPImageUrl(prod.imageUrl || '');
    setShowAddProductModal(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const cat = categories.find(c => c.id === pCatId);
    const sup = suppliers.find(s => s.id === pSupId);

    const prodData = {
      name: pName,
      barcode: pBarcode,
      categoryId: pCatId,
      categoryName: cat?.name || 'General',
      supplierId: pSupId,
      supplierName: sup?.name || 'General Supplier',
      costPrice: parseFloat(pCost) || 0,
      sellingPrice: parseFloat(pPrice) || 0,
      stockQuantity: parseInt(pStock, 10) || 0,
      minStockLevel: parseInt(pMinStock, 10) || 5,
      imageUrl: pImageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
      isActive: true,
    };

    if (editingProduct) {
      editProduct(editingProduct.id, { ...prodData, id: pCustomId.trim() || editingProduct.id });
    } else {
      addProduct({ ...prodData, customId: pCustomId.trim() });
    }
    setShowAddProductModal(false);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    addCategory({
      name: catName,
      description: catDesc,
      isHidden: false,
      sortOrder: categories.length + 1,
    });
    setCatName('');
    setCatDesc('');
    setShowCatModal(false);
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) return;
    addSupplier({
      name: supName,
      contactPerson: supContact,
      phone: supPhone,
      email: supEmail,
      address: supAddress,
      status: 'ACTIVE',
    });
    setSupName('');
    setSupContact('');
    setSupPhone('');
    setSupEmail('');
    setSupAddress('');
    setShowSupModal(false);
  };

  const handleStockAdjustmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjProductId || !adjQty) return;
    const qtyNum = parseInt(adjQty, 10) || 0;
    const delta = adjType === 'OUT' || adjType === 'DAMAGE' ? -Math.abs(qtyNum) : Math.abs(qtyNum);
    adjustStock(adjProductId, delta, adjReason || 'Manual adjustment', adjType);
    setAdjProductId('');
    setAdjQty('');
    setAdjReason('');
    alert('Stock adjustment logged successfully!');
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header & Sub-view Segmented Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
            Inventory & Catalog Management
          </h2>
          <p className="text-xs text-slate-400">
            Products, Categories, Suppliers, Stock Movements, & Audit Logs
          </p>
        </div>

        {/* Sub-view switcher */}
        <div className="bg-slate-800 p-1 rounded-xl border border-slate-700/80 flex items-center overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveSubView('PRODUCTS')}
            className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeSubView === 'PRODUCTS' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            Products ({products.length})
          </button>
          <button
            onClick={() => setActiveSubView('CATEGORIES')}
            className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeSubView === 'CATEGORIES' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Categories ({categories.length})
          </button>
          <button
            onClick={() => setActiveSubView('SUPPLIERS')}
            className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeSubView === 'SUPPLIERS' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            Suppliers ({suppliers.length})
          </button>
          <button
            onClick={() => setActiveSubView('MOVEMENTS')}
            className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeSubView === 'MOVEMENTS' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Stock Movements
          </button>
          <button
            onClick={() => setActiveSubView('ADJUSTMENT')}
            className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeSubView === 'ADJUSTMENT' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Restock & Audit
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: PRODUCTS TABLE & FILTERS */}
      {activeSubView === 'PRODUCTS' && (
        <div className="space-y-4">
          {/* Search Bar & Add Button Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex-1 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search products by name or barcode..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                onClick={() => setShowCameraScanner(true)}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 flex items-center gap-1.5 text-xs font-semibold"
                title="Camera Barcode Scan"
              >
                <Camera className="w-4 h-4 text-indigo-400" />
                <span className="hidden sm:inline">Scan</span>
              </button>
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <select
                value={selectedCategoryFilter}
                onChange={e => setSelectedCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedStockFilter}
                onChange={e => setSelectedStockFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl focus:outline-none"
              >
                <option value="ALL">All Stock Status</option>
                <option value="IN_STOCK">In Stock Only</option>
                <option value="LOW_STOCK">Low Stock Warning</option>
                <option value="OUT_OF_STOCK">Out of Stock Only</option>
              </select>

              <button
                onClick={openAddProductModal}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Add Product
              </button>
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(prod => {
              const isLow = prod.stockQuantity > 0 && prod.stockQuantity <= prod.minStockLevel;
              const isOut = prod.stockQuantity <= 0;

              return (
                <div
                  key={prod.id}
                  className={`bg-slate-900 border rounded-2xl p-4 flex flex-col justify-between transition-all hover:border-slate-700 ${
                    !prod.isActive ? 'opacity-60 border-slate-800' : 'border-slate-800/80 shadow-sm'
                  }`}
                >
                  <div>
                    {/* Image & Stock Badge */}
                    <div className="relative h-36 rounded-xl overflow-hidden bg-slate-950 mb-3 border border-slate-800">
                      <img
                        src={prod.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80'}
                        alt={prod.name}
                        className="w-full h-full object-cover"
                      />
                      {/* Badge */}
                      <div className="absolute top-2 right-2">
                        {isOut ? (
                          <span className="px-2.5 py-1 bg-rose-500 text-white font-bold text-[10px] rounded-lg shadow-md flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            OUT OF STOCK
                          </span>
                        ) : isLow ? (
                          <span className="px-2.5 py-1 bg-amber-500 text-slate-950 font-bold text-[10px] rounded-lg shadow-md flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            LOW STOCK ({prod.stockQuantity})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-900/90 text-emerald-400 font-semibold text-[10px] rounded-lg border border-emerald-500/30">
                            {prod.stockQuantity} in stock
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-[10px] font-mono text-indigo-400 font-semibold mb-0.5 flex items-center justify-between gap-1 truncate">
                      <span>ID: {prod.id}</span>
                      <span className="text-slate-400 font-normal">BAR: {prod.barcode}</span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-100 leading-tight mb-1">{prod.name}</h3>
                    <div className="text-xs text-slate-400 mb-2">
                      {prod.categoryName} • {prod.supplierName}
                    </div>

                    {/* Pricing */}
                    <div className="flex items-center justify-between p-2.5 bg-slate-800/60 rounded-xl border border-slate-800 text-xs mb-3">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Cost</span>
                        <span className="font-semibold text-slate-300">{settings.currencySymbol}{prod.costPrice.toFixed(2)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Selling Price</span>
                        <span className="font-bold text-emerald-400 text-sm">{settings.currencySymbol}{prod.sellingPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                    <button
                      onClick={() => setBarcodeModalProduct(prod)}
                      className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg flex items-center gap-1"
                      title="Print / View Barcode"
                    >
                      <BarcodeIcon className="w-4 h-4" />
                      <span className="text-[11px] font-semibold">Barcode</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditProductModal(prod)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                        title="Edit Product"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => duplicateProduct(prod.id)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deactivateProduct(prod.id)}
                        className={`p-1.5 rounded-lg ${prod.isActive ? 'text-emerald-400' : 'text-slate-500'}`}
                        title={prod.isActive ? 'Deactivate' : 'Activate'}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete product ${prod.name}?`)) deleteProduct(prod.id);
                        }}
                        className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: CATEGORIES */}
      {activeSubView === 'CATEGORIES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-200 text-sm">Product Categories List</h3>
            <button
              onClick={() => setShowCatModal(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Category
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map(c => (
              <div key={c.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-100 text-sm">{c.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{c.description || 'No description'}</p>
                  <span className="text-[10px] text-indigo-400 font-semibold mt-2 block">
                    {products.filter(p => p.categoryId === c.id).length} Products Assigned
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Delete category ${c.name}?`)) deleteCategory(c.id);
                  }}
                  className="p-2 text-rose-400 hover:bg-rose-950/40 rounded-xl"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: SUPPLIERS */}
      {activeSubView === 'SUPPLIERS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-200 text-sm">Registered Wholesale Suppliers</h3>
            <button
              onClick={() => setShowSupModal(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Supplier
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map(s => (
              <div key={s.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-100 text-sm">{s.name}</h4>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-500/30">
                    {s.status}
                  </span>
                </div>
                <div className="text-xs text-slate-400 space-y-1">
                  <div>Contact: <span className="text-slate-200">{s.contactPerson}</span></div>
                  <div>Phone: <span className="text-slate-200">{s.phone}</span></div>
                  <div>Email: <span className="text-slate-200">{s.email}</span></div>
                  <div>Address: <span className="text-slate-200">{s.address}</span></div>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-[10px] text-slate-500">
                    {products.filter(p => p.supplierId === s.id).length} products supplied
                  </span>
                  <button
                    onClick={() => {
                      if (confirm(`Delete supplier ${s.name}?`)) deleteSupplier(s.id);
                    }}
                    className="p-1.5 text-rose-400 hover:bg-rose-950/40 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: STOCK MOVEMENTS HISTORY */}
      {activeSubView === 'MOVEMENTS' && (
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <h3 className="font-bold text-slate-100 text-sm">Stock Movement & Audit Log</h3>
          <p className="text-xs text-slate-400">Complete historical log of all inventory changes</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Qty Change</th>
                  <th className="py-2.5 px-3">New Stock</th>
                  <th className="py-2.5 px-3">Reason</th>
                  <th className="py-2.5 px-3">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {stockMovements.map(m => (
                  <tr key={m.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 text-slate-400">
                      {new Date(m.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-200">{m.productName}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          m.type === 'IN' || m.type === 'RETURN'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {m.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold">
                      {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">{m.newQuantity}</td>
                    <td className="py-2.5 px-3 text-slate-400">{m.reason}</td>
                    <td className="py-2.5 px-3 text-slate-300">{m.performedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-VIEW 5: STOCK ADJUSTMENT & RESTOCK FORM */}
      {activeSubView === 'ADJUSTMENT' && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl max-w-xl mx-auto space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">Inventory Adjustment & Restock</h3>
              <p className="text-xs text-slate-400">Log stock receipts, damage write-offs, or manual count fixes</p>
            </div>
          </div>

          <form onSubmit={handleStockAdjustmentSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Select Product</label>
              <select
                value={adjProductId}
                onChange={e => setAdjProductId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700/80 rounded-xl text-xs text-white"
                required
              >
                <option value="">-- Choose Product --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Current Stock: {p.stockQuantity})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Adjustment Action</label>
                <select
                  value={adjType}
                  onChange={e => setAdjType(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700/80 rounded-xl text-xs text-white"
                >
                  <option value="IN">Restock (+) Add Quantity</option>
                  <option value="OUT">Manual Deduction (-)</option>
                  <option value="DAMAGE">Log Damaged / Spoiled (-)</option>
                  <option value="RETURN">Customer Return (+)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Quantity</label>
                <input
                  type="number"
                  placeholder="e.g. 50"
                  value={adjQty}
                  onChange={e => setAdjQty(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700/80 rounded-xl text-xs text-white"
                  min="1"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Audit Reason / Note</label>
              <input
                type="text"
                placeholder="e.g. Received shipment invoice #SUP-901"
                value={adjReason}
                onChange={e => setAdjReason(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700/80 rounded-xl text-xs text-white"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/30"
            >
              Submit Stock Audit Entry
            </button>
          </form>
        </div>
      )}

      {/* ADD / EDIT PRODUCT MODAL */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 text-slate-100 shadow-2xl relative mt-[5px] mb-auto max-h-[92vh] flex flex-col overflow-hidden">
            <button
              onClick={() => setShowAddProductModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-lg text-slate-100 mb-3 shrink-0">
              {editingProduct ? 'Edit Product Item' : 'Add New Product to Inventory'}
            </h3>

            <form onSubmit={handleSaveProduct} className="flex-1 flex flex-col min-h-0 text-xs">
              <div className="flex-1 overflow-y-auto pr-1 space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-400 mb-1">Product ID / SKU</label>
                    <input
                      type="text"
                      placeholder="e.g. PROD-101"
                      value={pCustomId}
                      onChange={e => setPCustomId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700/80 rounded-xl text-white font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-400 mb-1">Barcode / EAN</label>
                    <input
                      type="text"
                      value={pBarcode}
                      onChange={e => setPBarcode(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700/80 rounded-xl text-white font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Product Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Sparkling Soda Cola 500ml"
                    value={pName}
                    onChange={e => setPName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700/80 rounded-xl text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-400 mb-1">Category</label>
                    <select
                      value={pCatId}
                      onChange={e => setPCatId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700/80 rounded-xl text-white"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-400 mb-1">Supplier</label>
                    <select
                      value={pSupId}
                      onChange={e => setPSupId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700/80 rounded-xl text-white"
                    >
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-400 mb-1">Cost Price ({settings.currencySymbol})</label>
                    <input
                      type="number"
                      step="0.01"
                      value={pCost}
                      onChange={e => setPCost(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700/80 rounded-xl text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-400 mb-1">Selling Price ({settings.currencySymbol})</label>
                    <input
                      type="number"
                      step="0.01"
                      value={pPrice}
                      onChange={e => setPPrice(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700/80 rounded-xl text-white font-bold text-emerald-400"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-400 mb-1">Current Stock Qty</label>
                    <input
                      type="number"
                      value={pStock}
                      onChange={e => setPStock(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700/80 rounded-xl text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-400 mb-1">Min Alert Level</label>
                    <input
                      type="number"
                      value={pMinStock}
                      onChange={e => setPMinStock(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700/80 rounded-xl text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Product Image (Upload or URL)</label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        placeholder="https://... or upload file"
                        value={pImageUrl}
                        onChange={e => setPImageUrl(e.target.value)}
                        className="flex-1 px-3 py-2.5 bg-slate-800 border border-slate-700/80 rounded-xl text-white text-xs"
                      />
                      <label className="px-3 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs cursor-pointer shrink-0 transition-colors">
                        {isUploadingImage ? 'Uploading...' : 'Upload Image'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              setIsUploadingImage(true);
                              const url = await uploadImage(file);
                              setPImageUrl(url);
                            } catch (err) {
                              console.error(err);
                            } finally {
                              setIsUploadingImage(false);
                            }
                          }}
                          className="hidden"
                          disabled={isUploadingImage}
                        />
                      </label>
                    </div>
                    {pImageUrl && (
                      <div className="flex items-center gap-2 p-1.5 bg-slate-800/60 rounded-lg border border-slate-700/50">
                        <img src={pImageUrl} alt="Preview" className="w-8 h-8 rounded object-cover border border-slate-600" />
                        <span className="text-[10px] text-slate-400 truncate flex-1">{pImageUrl}</span>
                        <button
                          type="button"
                          onClick={() => setPImageUrl('')}
                          className="text-[10px] text-rose-400 hover:underline px-1"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-800 shrink-0 bg-slate-900 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CATEGORY MODAL */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 text-slate-100 relative">
            <h3 className="font-bold text-base mb-3">Add Category</h3>
            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
              <input
                type="text"
                placeholder="Category Name"
                value={catName}
                onChange={e => setCatName(e.target.value)}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                required
              />
              <input
                type="text"
                placeholder="Description"
                value={catDesc}
                onChange={e => setCatDesc(e.target.value)}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
              />
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white font-bold rounded-xl">
                  Add Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD SUPPLIER MODAL */}
      {showSupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 text-slate-100 relative">
            <h3 className="font-bold text-base mb-3">Add Supplier</h3>
            <form onSubmit={handleSaveSupplier} className="space-y-3 text-xs">
              <input
                type="text"
                placeholder="Supplier Company Name"
                value={supName}
                onChange={e => setSupName(e.target.value)}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                required
              />
              <input
                type="text"
                placeholder="Contact Person"
                value={supContact}
                onChange={e => setSupContact(e.target.value)}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
              />
              <input
                type="text"
                placeholder="Phone Number"
                value={supPhone}
                onChange={e => setSupPhone(e.target.value)}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
              />
              <input
                type="email"
                placeholder="Email Address"
                value={supEmail}
                onChange={e => setSupEmail(e.target.value)}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
              />
              <input
                type="text"
                placeholder="Address"
                value={supAddress}
                onChange={e => setSupAddress(e.target.value)}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
              />
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSupModal(false)}
                  className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white font-bold rounded-xl">
                  Add Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Generator Modal */}
      {barcodeModalProduct && (
        <BarcodeGeneratorModal
          isOpen={!!barcodeModalProduct}
          onClose={() => setBarcodeModalProduct(null)}
          productName={barcodeModalProduct.name}
          barcode={barcodeModalProduct.barcode}
          price={barcodeModalProduct.sellingPrice}
        />
      )}

      {/* Camera Scanner Modal */}
      <CameraScannerModal
        isOpen={showCameraScanner}
        onClose={() => setShowCameraScanner(false)}
        onScanSuccess={scannedCode => {
          setSearchTerm(scannedCode);
          setShowCameraScanner(false);
        }}
      />
    </div>
  );
};

export default OwnerInventory;
