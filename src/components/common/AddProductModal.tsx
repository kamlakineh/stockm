import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { X, Camera, Barcode as BarcodeIcon, Plus, Upload, CheckCircle } from 'lucide-react';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { categories, suppliers, addProduct, uploadImage, settings } = useStore();

  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('10');
  const [minStockLevel, setMinStockLevel] = useState('5');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const generateBarcode = () => {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000).toString();
    setBarcode(`890100${randomSuffix}`);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadStatus('Uploading image to UploadThing...');
      const url = await uploadImage(file);
      setImageUrl(url);
      setUploadStatus('Image uploaded successfully!');
    } catch (err) {
      console.error('Upload failed:', err);
      setUploadStatus('Upload failed. Fallback to image URL or standard preview.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a valid product name');
      return;
    }

    const cat = categories.find(c => c.id === categoryId) || categories[0];
    const sup = suppliers.find(s => s.id === supplierId) || suppliers[0];

    const finalBarcode = barcode.trim() || `890100${Math.floor(100000 + Math.random() * 900000)}`;

    addProduct({
      name: name.trim(),
      barcode: finalBarcode,
      categoryId: cat?.id || 'cat-1',
      categoryName: cat?.name || 'General',
      supplierId: sup?.id || 'sup-1',
      supplierName: sup?.name || 'General Supplier',
      costPrice: parseFloat(costPrice) || 0,
      sellingPrice: parseFloat(sellingPrice) || 0,
      stockQuantity: parseInt(stockQuantity, 10) || 0,
      minStockLevel: parseInt(minStockLevel, 10) || 5,
      imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1540340061722-9293d5163008?auto=format&fit=crop&w=400&q=80',
      isActive: true,
    });

    // Reset form
    setName('');
    setBarcode('');
    setCategoryId('');
    setSupplierId('');
    setCostPrice('');
    setSellingPrice('');
    setStockQuantity('10');
    setMinStockLevel('5');
    setImageUrl('');
    setUploadStatus(null);

    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-4 sm:p-6 text-slate-100 shadow-2xl mt-[5px] mb-auto max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">Add New Inventory Item</h3>
              <p className="text-xs text-slate-400">Register new product item into store database</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 text-xs">
          <div className="flex-1 overflow-y-auto pr-1 space-y-3.5">
            {/* Name */}
            <div>
              <label className="block font-bold text-slate-300 mb-1">Product Name *</label>
              <input
                type="text"
                placeholder="e.g. Sparkling Soda Cola 500ml"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:border-emerald-500 outline-none"
                required
              />
            </div>

            {/* Barcode & Auto Generator */}
            <div>
              <label className="block font-bold text-slate-300 mb-1">Barcode / SKU *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Scan or enter barcode"
                  value={barcode}
                  onChange={e => setBarcode(e.target.value)}
                  className="flex-1 p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                />
                <button
                  type="button"
                  onClick={generateBarcode}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold rounded-xl flex items-center gap-1.5 border border-slate-700 shrink-0"
                >
                  <BarcodeIcon className="w-3.5 h-3.5" /> Auto-Generate
                </button>
              </div>
            </div>

            {/* Category & Supplier */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Category</label>
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium outline-none"
                >
                  <option value="">Select Category...</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Supplier</label>
                <select
                  value={supplierId}
                  onChange={e => setSupplierId(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium outline-none"
                >
                  <option value="">Select Supplier...</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Cost Price ({settings.currencySymbol})</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={costPrice}
                  onChange={e => setCostPrice(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-300 mb-1">Selling Price ({settings.currencySymbol}) *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={sellingPrice}
                  onChange={e => setSellingPrice(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold text-emerald-400"
                  required
                />
              </div>
            </div>

            {/* Quantities */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Initial Stock Qty</label>
                <input
                  type="number"
                  placeholder="10"
                  value={stockQuantity}
                  onChange={e => setStockQuantity(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-300 mb-1">Min Stock Alert Level</label>
                <input
                  type="number"
                  placeholder="5"
                  value={minStockLevel}
                  onChange={e => setMinStockLevel(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
                />
              </div>
            </div>

            {/* Image Upload / URL */}
            <div>
              <label className="block font-bold text-slate-300 mb-1">Product Image (UploadThing or URL)</label>
              <div className="space-y-2">
                <div className="flex gap-2 items-center">
                  <input
                    type="url"
                    placeholder="Paste Image URL or upload file below"
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    className="flex-1 p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>

                <div className="flex items-center gap-3 p-2.5 bg-slate-800/80 border border-dashed border-slate-700 rounded-xl">
                  <label className="cursor-pointer px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors">
                    <Upload className="w-3.5 h-3.5" /> Choose Image File
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {isUploading ? 'Uploading to UploadThing...' : 'Uploads image directly'}
                  </span>
                </div>

                {uploadStatus && (
                  <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> {uploadStatus}
                  </div>
                )}

                {imageUrl && (
                  <div className="flex items-center gap-2 pt-1">
                    <img src={imageUrl} alt="Preview" className="w-10 h-10 rounded-lg object-cover border border-slate-700" />
                    <span className="text-[10px] text-slate-400 truncate max-w-xs">{imageUrl}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-3 mt-3 border-t border-slate-800 shrink-0 bg-slate-900">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
            >
              Save Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;
