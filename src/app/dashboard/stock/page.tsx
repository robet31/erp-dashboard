// 'use client';

// import React, { useState, useMemo, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { useAuth } from '@/providers/auth-provider';
// import { useStockData } from '@/hooks/useFrappeData';
// import {
//   Package, Warehouse, AlertTriangle, TrendingUp,
//   Plus, Download, Search, X, Eye, ArrowRight, AlertCircle, Edit, Trash2
// } from 'lucide-react';
// import {
//   BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
// } from 'recharts';
// import { formatRupiah, formatDate, formatNumber } from '@/lib/utils';
// import { STOCK_ENTRY_TYPES } from '@/config/frappe-data';

// const CATEGORY_COLORS = ['#0066B3', '#059669', '#7c3aed', '#d97706', '#0891b2', '#e11d48'];

// // Helper function untuk generate singkatan perusahaan
// const getCompanyCode = (companyName: string) => {
//   if (companyName.includes('Netra') || companyName === 'NV') return 'NV';
//   if (companyName.includes('Solusi')) return 'PSB';
//   if (companyName.includes('Maju')) return 'PMS';
//   if (companyName.includes('Imaka')) return 'PII';
//   if (companyName.includes('Mitra')) return 'PMI';
//   return companyName.substring(0, 3).toUpperCase();
// };

// // Create Item Modal
// function CreateItemModal({ onClose, onSuccess }: { onClose: () => void; onSuccess?: () => void }) {
//   const [form, setForm] = useState({
//     item_code: '',
//     item_name: '',
//     item_group: 'Products', 
//     stock_uom: 'Nos',
//     is_stock_item: true,
//   });
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsSubmitting(true);
//     try {
//       const { apiCreate } = await import('@/lib/api');
//       const result = await apiCreate('Item', {
//         item_code: form.item_code,
//         item_name: form.item_name,
//         item_group: form.item_group,
//         stock_uom: form.stock_uom,
//         is_stock_item: form.is_stock_item ? 1 : 0,
//       });
//       console.log('Item created in ERP:', result);
//       alert('✅ Item berhasil dibuat di ERP Frappe!');
//       onClose();
//       if (onSuccess) onSuccess();
//     } catch (err) {
//       console.error('Failed to create item:', err);
//       alert('❌ Gagal membuat item di ERP. Error: ' + (err instanceof Error ? err.message : 'Unknown'));
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
//       <div className="modal-content" style={{ width: '480px' }}>
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
//           <div>
//             <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>Tambah Item Baru</h2>
//             <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>Buat item baru di ERP</p>
//           </div>
//           <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
//             <X size={20} />
//           </button>
//         </div>

//         <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
//           <div>
//             <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Item Code *</label>
//             <input type="text" required className="erp-input" style={{ fontSize: '13px' }} value={form.item_code} onChange={e => setForm(f => ({ ...f, item_code: e.target.value }))} placeholder="cth: ITEM-001" />
//           </div>

//           <div>
//             <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Item Name *</label>
//             <input type="text" required className="erp-input" style={{ fontSize: '13px' }} value={form.item_name} onChange={e => setForm(f => ({ ...f, item_name: e.target.value }))} placeholder="cth: Produk Jadi A" />
//           </div>

//           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
//             <div>
//               <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Item Group</label>
//               <select className="erp-input" style={{ fontSize: '13px' }} value={form.item_group} onChange={e => setForm(f => ({ ...f, item_group: e.target.value }))}>
//                 <option value="Products">Products</option>
//                 <option value="Raw Material">Raw Material</option>
//                 <option value="Consumables">Consumables</option>
//                 <option value="Services">Services</option>
//               </select>
//             </div>
//             <div>
//               <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>UOM</label>
//               <select className="erp-input" style={{ fontSize: '13px' }} value={form.stock_uom} onChange={e => setForm(f => ({ ...f, stock_uom: e.target.value }))}>
//                 <option value="Nos">Nos</option>
//                 <option value="Kg">Kg</option>
//                 <option value="Liter">Liter</option>
//                 <option value="Pcs">Pcs</option>
//                 <option value="Unit">Unit</option>
//                 <option value="Box">Box</option>
//               </select>
//             </div>
//           </div>

//           <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
//             <input type="checkbox" checked={form.is_stock_item} onChange={e => setForm(f => ({ ...f, is_stock_item: e.target.checked }))} />
//             Item ini adalah stock item (memiliki stok)
//           </label>

//           <div style={{ background: '#f0f9ff', borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#0369a1' }}>
//             <strong>🔄 Real-time Sync:</strong> Data akan langsung dikirim ke Frappe ERP dan tersedia untuk semua modul.
//           </div>

//           <div style={{ display: 'flex', gap: '10px' }}>
//             <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Batal</button>
//             <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ flex: 2 }}>
//               {isSubmitting ? 'Menyimpan...' : 'Simpan ke ERP'}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// // Edit Item Modal
// function EditItemModal({ item, onClose, onSuccess }: { item: any; onClose: () => void; onSuccess?: () => void }) {
//   const [form, setForm] = useState({
//     item_name: item.item_name || '',
//     item_group: item.item_group || 'Products',
//     stock_uom: item.stock_uom || 'Nos',
//     is_stock_item: item.is_stock_item === 1 || item.is_stock_item === true,
//     standard_rate: item.standard_rate || 0,
//   });
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [error, setError] = useState('');

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsSubmitting(true);
//     setError('');
//     try {
//       const { apiUpdate } = await import('@/lib/api');
//       const result = await apiUpdate('Item', item.name, {
//         ...form,
//         is_stock_item: form.is_stock_item ? 1 : 0,
//         standard_rate: parseFloat(String(form.standard_rate)) || 0,
//       });
//       console.log('Item updated in ERP:', result);
//       alert('✅ Item berhasil diupdate di ERP Frappe!');
//       onClose();
//       if (onSuccess) onSuccess();
//     } catch (err) {
//       console.error('Failed to update item:', err);
//       setError('Gagal mengupdate item: ' + (err instanceof Error ? err.message : 'Unknown'));
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleDelete = async () => {
//     if (!confirm('Yakin ingin menghapus item ini? Data yang terkait akan hilang.')) return;
//     setIsSubmitting(true);
//     try {
//       const { apiDelete } = await import('@/lib/api');
//       await apiDelete('Item', item.name);
//       alert('✅ Item berhasil dihapus dari ERP Frappe!');
//       onClose();
//       if (onSuccess) onSuccess();
//     } catch (err) {
//       console.error('Failed to delete item:', err);
//       setError('Gagal menghapus item: ' + (err instanceof Error ? err.message : 'Unknown'));
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
//       <div className="modal-content" style={{ width: '480px' }}>
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
//           <div>
//             <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>Edit Item</h2>
//             <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>{item.name}</p>
//           </div>
//           <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
//             <X size={20} />
//           </button>
//         </div>

//         <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
//           <div>
//             <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Item Code</label>
//             <input disabled className="erp-input" style={{ fontSize: '13px', background: '#f3f4f6' }} value={item.name} />
//           </div>

//           <div>
//             <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Item Name *</label>
//             <input required type="text" className="erp-input" style={{ fontSize: '13px' }} value={form.item_name} onChange={e => setForm(f => ({ ...f, item_name: e.target.value }))} />
//           </div>

//           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
//             <div>
//               <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Item Group</label>
//               <select required className="erp-input" style={{ fontSize: '13px' }} value={form.item_group} onChange={e => setForm(f => ({ ...f, item_group: e.target.value }))}>
//                 <option value="Products">Products</option>
//                 <option value="Raw Material">Raw Material</option>
//                 <option value="Consumables">Consumables</option>
//                 <option value="Services">Services</option>
//               </select>
//             </div>
//             <div>
//               <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Stock UOM</label>
//               <select required className="erp-input" style={{ fontSize: '13px' }} value={form.stock_uom} onChange={e => setForm(f => ({ ...f, stock_uom: e.target.value }))}>
//                 <option value="Nos">Nos (Pcs)</option>
//                 <option value="Unit">Unit</option>
//                 <option value="Kg">Kg</option>
//                 <option value="Liter">Liter</option>
//                 <option value="Meter">Meter</option>
//               </select>
//             </div>
//           </div>

//           <div>
//             <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Standard Rate (Rp)</label>
//             <input type="number" className="erp-input" style={{ fontSize: '13px' }} value={form.standard_rate} onChange={e => setForm(f => ({ ...f, standard_rate: e.target.value }))} />
//           </div>

//           <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
//             <input type="checkbox" checked={form.is_stock_item} onChange={e => setForm(f => ({ ...f, is_stock_item: e.target.checked }))} />
//             Item ini adalah stock item (memiliki stok)
//           </label>

//           {error && (
//             <div style={{ background: '#fee2e2', borderRadius: '6px', padding: '10px', color: '#991b1b', fontSize: '12px' }}>
//               {error}
//             </div>
//           )}

//           <div style={{ display: 'flex', gap: '10px' }}>
//             <button type="button" onClick={handleDelete} disabled={isSubmitting} style={{ flex: 1, background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px', color: '#dc2626', fontWeight: 600, cursor: 'pointer' }}>
//               <Trash2 size={15} /> Hapus
//             </button>
//             <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ flex: 2 }}>
//               {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// // Create Warehouse Modal
// function CreateWarehouseModal({ onClose, onSuccess, userCompany }: { onClose: () => void; onSuccess?: () => void; userCompany: string }) {
//   const [form, setForm] = useState({
//     warehouse_name: '',
//     company: userCompany, // Nilai fix dari user yang login
//     is_group: false,
//   });
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [error, setError] = useState('');

//   const companyCode = getCompanyCode(form.company);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsSubmitting(true);
//     setError('');
//     try {
//       const warehouseName = `${form.warehouse_name} - ${companyCode}`;
//       const { apiCreate } = await import('@/lib/api');
//       const result = await apiCreate('Warehouse', {
//         name: warehouseName,
//         warehouse_name: form.warehouse_name,
//         company: form.company,
//         is_group: form.is_group ? 1 : 0,
//         parent_warehouse: form.is_group ? `All Warehouses - ${companyCode}` : '',
//       });
//       console.log('Warehouse created in ERP:', result);
//       alert('✅ Warehouse berhasil dibuat di ERP Frappe!');
//       onClose();
//       if (onSuccess) onSuccess();
//     } catch (err) {
//       console.error('Failed to create Warehouse:', err);
//       setError('Gagal membuat Warehouse: ' + (err instanceof Error ? err.message : 'Unknown'));
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
//       <div className="modal-content" style={{ width: '480px' }}>
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
//           <div>
//             <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>Tambah Warehouse</h2>
//             <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>Buat warehouse baru</p>
//           </div>
//           <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
//             <X size={20} />
//           </button>
//         </div>

//         <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
//           <div>
//             <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Nama Warehouse *</label>
//             <input required type="text" className="erp-input" style={{ fontSize: '13px' }} value={form.warehouse_name} onChange={e => setForm(f => ({ ...f, warehouse_name: e.target.value }))} placeholder="cth: Gudang Utama" />
//           </div>

//           <div>
//             <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Perusahaan (Otomatis)</label>
//             <input 
//               type="text" 
//               readOnly 
//               className="erp-input" 
//               style={{ fontSize: '13px', background: '#f3f4f6', color: '#6B7280', cursor: 'not-allowed' }} 
//               value={form.company} 
//             />
//           </div>

//           <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
//             <input type="checkbox" checked={form.is_group} onChange={e => setForm(f => ({ ...f, is_group: e.target.checked }))} />
//             Ini adalah parent warehouse (group)
//           </label>

//           <div style={{ background: '#f0f9ff', borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#0369a1' }}>
//             <strong>Preview Kode Gudang:</strong> {form.warehouse_name || 'Nama Warehouse'} - {companyCode}
//           </div>

//           {error && (
//             <div style={{ background: '#fee2e2', borderRadius: '6px', padding: '10px', color: '#991b1b', fontSize: '12px' }}>
//               {error}
//             </div>
//           )}

//           <div style={{ display: 'flex', gap: '10px' }}>
//             <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }} disabled={isSubmitting}>Batal</button>
//             <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ flex: 2 }}>
//               {isSubmitting ? 'Menyimpan...' : 'Simpan ke ERP'}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// // Edit Warehouse Modal
// function EditWarehouseModal({ warehouse, onClose, onSuccess, userCompany }: { warehouse: any; onClose: () => void; onSuccess?: () => void; userCompany: string }) {
//   const [form, setForm] = useState({
//     warehouse_name: warehouse.warehouse_name || '',
//     company: warehouse.company || userCompany,
//     is_group: warehouse.is_group === 1 || warehouse.is_group === true,
//   });
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [error, setError] = useState('');

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsSubmitting(true);
//     setError('');
//     try {
//       const { apiUpdate } = await import('@/lib/api');
//       const result = await apiUpdate('Warehouse', warehouse.name, {
//         warehouse_name: form.warehouse_name,
//         company: form.company,
//         is_group: form.is_group ? 1 : 0,
//       });
//       console.log('Warehouse updated in ERP:', result);
//       alert('✅ Warehouse berhasil diupdate di ERP Frappe!');
//       onClose();
//       if (onSuccess) onSuccess();
//     } catch (err) {
//       console.error('Failed to update Warehouse:', err);
//       setError('Gagal mengupdate Warehouse: ' + (err instanceof Error ? err.message : 'Unknown'));
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleDelete = async () => {
//     if (!confirm('Yakin ingin menghapus warehouse ini?')) return;
//     setIsSubmitting(true);
//     try {
//       const { apiDelete } = await import('@/lib/api');
//       await apiDelete('Warehouse', warehouse.name);
//       alert('✅ Warehouse berhasil dihapus dari ERP Frappe!');
//       onClose();
//       if (onSuccess) onSuccess();
//     } catch (err) {
//       console.error('Failed to delete Warehouse:', err);
//       setError('Gagal menghapus Warehouse: ' + (err instanceof Error ? err.message : 'Unknown'));
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
//       <div className="modal-content" style={{ width: '480px' }}>
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
//           <div>
//             <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>Edit Warehouse</h2>
//             <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>{warehouse.name}</p>
//           </div>
//           <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
//             <X size={20} />
//           </button>
//         </div>

//         <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
//           <div>
//             <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Nama Warehouse *</label>
//             <input required type="text" className="erp-input" style={{ fontSize: '13px' }} value={form.warehouse_name} onChange={e => setForm(f => ({ ...f, warehouse_name: e.target.value }))} />
//           </div>

//           <div>
//             <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Perusahaan (Otomatis)</label>
//             <input 
//               type="text" 
//               readOnly 
//               className="erp-input" 
//               style={{ fontSize: '13px', background: '#f3f4f6', color: '#6B7280', cursor: 'not-allowed' }} 
//               value={form.company} 
//             />
//           </div>

//           <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
//             <input type="checkbox" checked={form.is_group} onChange={e => setForm(f => ({ ...f, is_group: e.target.checked }))} />
//             Ini adalah parent warehouse (group)
//           </label>

//           {error && (
//             <div style={{ background: '#fee2e2', borderRadius: '6px', padding: '10px', color: '#991b1b', fontSize: '12px' }}>
//               {error}
//             </div>
//           )}

//           <div style={{ display: 'flex', gap: '10px' }}>
//             <button type="button" onClick={handleDelete} disabled={isSubmitting} style={{ flex: 1, background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px', color: '#dc2626', fontWeight: 600, cursor: 'pointer' }}>
//               <Trash2 size={15} /> Hapus
//             </button>
//             <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ flex: 2 }}>
//               {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// // Create Stock Entry Modal (RAW FETCH BYPASS)
// function CreateStockEntryModal({ onClose, warehouses, items, onSuccess, userCompany }: { onClose: () => void; warehouses: any[]; items: any[]; onSuccess?: () => void; userCompany: string }) {
//   const [form, setForm] = useState({
//     stock_entry_type: 'Material Receipt',
//     company: userCompany,
//     item_code: '',
//     qty: '',
//     warehouse: '', 
//     posting_date: new Date().toISOString().split('T')[0],
//   });
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [error, setError] = useState('');

//   // Tampilkan semua warehouse bertipe Leaf (bukan group/folder)
//   const activeWarehouses = useMemo(() => {
//     return warehouses.filter((w: any) => (w.is_group === 0 || w.is_group === false) && w.company === userCompany);
//   }, [warehouses, userCompany]);

//   // Set default dropdown
//   useEffect(() => {
//     if (activeWarehouses.length > 0 && !form.warehouse) {
//       setForm(f => ({ ...f, warehouse: activeWarehouses[0].name }));
//     }
//   }, [activeWarehouses, form.warehouse]);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsSubmitting(true);
//     setError('');
    
//     try {
//       if (!form.warehouse) throw new Error("Silakan pilih Warehouse terlebih dahulu");
//       if (!form.item_code) throw new Error("Silakan pilih Item terlebih dahulu");
      
//       const selectedItem = items.find((i: any) => i.item_code === form.item_code);
//       const isIssue = form.stock_entry_type === 'Material Issue';

//       const detailItem: any = {
//         item_code: form.item_code,
//         qty: parseFloat(form.qty),
//         uom: selectedItem?.stock_uom || 'Nos',
//         conversion_factor: 1,
//       };

//       if (isIssue) {
//         detailItem.s_warehouse = form.warehouse;
//       } else {
//         detailItem.t_warehouse = form.warehouse;
//         detailItem.basic_rate = selectedItem?.standard_rate || 100;
//       }

//       const stockEntryData: any = {
//         stock_entry_type: form.stock_entry_type,
//         posting_date: form.posting_date,
//         company: form.company,
//         set_posting_time: 1, 
//         items: [detailItem]
//       };

//       if (isIssue) {
//         stockEntryData.from_warehouse = form.warehouse;
//       } else {
//         stockEntryData.to_warehouse = form.warehouse;
//       }

//       const response = await fetch('/api/frappe/resource/Stock Entry', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(stockEntryData)
//       });

//       const responseText = await response.text();
//       let responseData;
      
//       try {
//         responseData = JSON.parse(responseText);
//       } catch (parseError) {
//         throw new Error(`Server tidak merespons JSON. RAW: ${responseText.substring(0, 100)}`);
//       }

//       // Deteksi jika API Proxy merubah error 417 menjadi pesan "Server ERP busy"
//       if (responseData.error === 'Server ERP busy' || (responseData.data && responseData.data.length === 0 && !responseData.name)) {
//          throw new Error("DITOLAK OLEH ERPNEXT (417 Validation Error).\n\nPenyebab paling sering:\n1. Stok tidak cukup (jika Issue/Keluar)\n2. 'Default Inventory Account' atau 'Stock Adjustment Account' belum disetting di Master Company ERPNext.\n3. Cost Center belum terisi otomatis.");
//       }

//       if (!response.ok || responseData.exc || responseData.error) {
//         let errorMessage = responseData.error || responseData.message || "Gagal menyimpan ke server ERPNext";
//         if (responseData._server_messages) {
//            try {
//              const msgs = JSON.parse(responseData._server_messages);
//              if (msgs.length > 0) errorMessage = JSON.parse(msgs[0]).message;
//            } catch(e) {}
//         }
//         throw new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
//       }

//       const docName = responseData?.data?.name || responseData?.name || responseData?.message?.name;
      
//       if (!docName) {
//          throw new Error(`Data masuk, tapi ID gagal diekstrak. RAW: ${responseText.substring(0, 100)}`);
//       }

//       const submitUrl = `/api/frappe/resource/Stock%20Entry/${encodeURIComponent(docName)}`;
//       const responseSubmit = await fetch(submitUrl, {
//         method: 'PUT',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ docstatus: 1 })
//       });

//       if (!responseSubmit.ok) {
//          const submitErrText = await responseSubmit.text();
//          throw new Error(`Gagal pada tahap Submit dokumen: ${submitErrText.substring(0, 150)}`);
//       }
      
//       alert('✅ Stock Entry berhasil dibuat dan stok otomatis terpotong/bertambah!');
//       onClose();
//       if (onSuccess) onSuccess();
//     } catch (err: any) {
//       console.error('Gagal memproses Stock Entry:', err);
//       setError(err.message || 'Terjadi kesalahan sistem.');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
//       <div className="modal-content" style={{ width: '480px' }}>
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
//           <div>
//             <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>Buat Stock Entry</h2>
//             <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>Mutasi stok barang (Material Receipt/Issue)</p>
//           </div>
//           <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
//             <X size={20} />
//           </button>
//         </div>

//         {isSubmitting ? (
//           <div style={{ textAlign: 'center', padding: '32px' }}>
//             <div style={{ fontSize: '40px', marginBottom: '12px' }}>⏳</div>
//             <p style={{ fontSize: '16px', fontWeight: 700 }}>Memproses ke ERP...</p>
//             <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '8px' }}>Menyinkronkan data dan kalkulasi stok otomatis...</p>
//           </div>
//         ) : (
//           <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
//             <div>
//               <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Tipe Transaksi *</label>
//               <select
//                 required
//                 value={form.stock_entry_type}
//                 onChange={e => setForm(f => ({ ...f, stock_entry_type: e.target.value }))}
//                 className="erp-input"
//                 style={{ fontSize: '13px' }}
//               >
//                 {STOCK_ENTRY_TYPES.map((t: any) => (
//                   <option key={t.value} value={t.value}>{t.label}</option>
//                 ))}
//               </select>
//             </div>

//             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
//               <div>
//                 <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Tanggal Posting *</label>
//                 <input type="date" required className="erp-input" style={{ fontSize: '13px' }} value={form.posting_date} onChange={e => setForm(f => ({ ...f, posting_date: e.target.value }))} />
//               </div>
//               <div>
//                 <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Warehouse *</label>
//                 <select required className="erp-input" style={{ fontSize: '13px' }} value={form.warehouse} onChange={e => setForm(f => ({ ...f, warehouse: e.target.value }))}>
//                   <option value="">Pilih Warehouse...</option>
//                   {activeWarehouses.map((w: any) => <option key={w.name} value={w.name}>{w.name}</option>)}
//                 </select>
//               </div>
//             </div>

//             <div>
//               <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Perusahaan (Terisi Otomatis)</label>
//               <input 
//                 type="text" 
//                 readOnly 
//                 className="erp-input" 
//                 style={{ fontSize: '13px', background: '#f3f4f6', color: '#6B7280', cursor: 'not-allowed' }} 
//                 value={form.company} 
//               />
//             </div>

//             <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
//               <p style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '10px' }}>Detail Item</p>
//               <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
//                 <div>
//                   <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Pilih Item *</label>
//                   <select required className="erp-input" style={{ fontSize: '13px' }} value={form.item_code} onChange={e => setForm(f => ({ ...f, item_code: e.target.value }))}>
//                     <option value="">Cari item...</option>
//                     {items.map((i: any) => <option key={i.name} value={i.item_code}>{i.item_code} - {i.item_name}</option>)}
//                   </select>
//                 </div>
//                 <div>
//                   <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Jumlah (Qty) *</label>
//                   <input type="number" required placeholder="0" min="0.01" step="0.01" className="erp-input" style={{ fontSize: '13px' }} value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} />
//                 </div>
//               </div>
//             </div>

//             {error && (
//               <div style={{ background: '#fee2e2', borderRadius: '6px', padding: '10px', color: '#991b1b', fontSize: '12px', whiteSpace: 'pre-wrap' }}>
//                 <strong style={{ display: 'block', marginBottom: '4px' }}>Gagal memproses Stock Entry:</strong>
//                 {error}
//               </div>
//             )}

//             <div style={{ background: '#f0f7ff', borderRadius: '8px', padding: '10px 12px', fontSize: '11px', color: '#374151', lineHeight: 1.6, border: '1px solid #dbeafe' }}>
//               <strong>🔄 Proses 2-Langkah:</strong> Aplikasi akan menyimpan dokumen sebagai Draft, lalu menyubmitnya secara otomatis untuk mengupdate stok ERP.
//             </div>

//             <div style={{ display: 'flex', gap: '10px' }}>
//               <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }} disabled={isSubmitting}>Batal</button>
//               <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ flex: 2 }}>
//                 {isSubmitting ? 'Menyimpan...' : (<><Plus size={14} /> Proses Stock Entry</>)}
//               </button>
//             </div>
//           </form>
//         )}
//       </div>
//     </div>
//   );
// }

// export default function StockPage() {
//   const router = useRouter();
  
//   // Mengambil user dari context Auth untuk mengetahui dia dari perusahaan mana
//   const { can, canAccess, user } = useAuth();
  
//   // Asumsi data nama perusahaan login tersimpan di property user.company
//   const userCompany = (user as any)?.company || 'Netra Vidya';

//   const { items, warehouses, bins, stockEntries, isLoading, error, refetch } = useStockData();
//   const [activeTab, setActiveTab] = useState('items');
//   const [searchQuery, setSearchQuery] = useState('');
//   const [showCreateModal, setShowCreateModal] = useState(false);
//   const [showCreateItemModal, setShowCreateItemModal] = useState(false);
//   const [showCreateWarehouseModal, setShowCreateWarehouseModal] = useState(false);
//   const [selectedItem, setSelectedItem] = useState<any>(null);
//   const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);

//   // Redirect if user doesn't have access to stock module
//   React.useEffect(() => {
//     if (!canAccess('stock')) {
//       router.push('/dashboard');
//     }
//   }, [canAccess, router]);

//   // =========================================================================
//   // LOGIKA FILTER BERDASARKAN PERUSAHAAN (COMPANY)
//   // =========================================================================
  
//   // 1. Filter Warehouse milik perusahaan login
//   const myWarehouses = useMemo(() => {
//     return warehouses.filter((w: any) => w.company === userCompany);
//   }, [warehouses, userCompany]);
  
//   // List nama-nama warehouse untuk nge-filter data BIN nantinya
//   const myWarehouseNames = useMemo(() => {
//     return myWarehouses.map((w: any) => w.name);
//   }, [myWarehouses]);

//   // 2. Filter Bin (Stok) yang hanya berada di warehouse perusahaan login
//   const myBins = useMemo(() => {
//     return bins.filter((b: any) => myWarehouseNames.includes(b.warehouse));
//   }, [bins, myWarehouseNames]);

//   // 3. Filter Stock Entries milik perusahaan login
//   const myStockEntries = useMemo(() => {
//     return stockEntries.filter((se: any) => se.company === userCompany);
//   }, [stockEntries, userCompany]);

//   // =========================================================================

//   // Calculate stock by category from filtered bins data
//   const stockByCategory = React.useMemo(() => {
//     if (myBins.length < 3) {
//       return [
//         { category: 'Bahan Baku', qty: 250 },
//         { category: 'Finished Goods', qty: 120 },
//         { category: 'Raw Materials', qty: 500 },
//         { category: 'Products', qty: 5000 },
//         { category: 'Other', qty: 8 },
//       ];
//     }
    
//     const map: Record<string, number> = {};
//     myBins.forEach((bin: any) => {
//       const item = items.find((i: any) => i.item_code === bin.item_code);
//       const cat = item?.item_group || 'Other';
//       map[cat] = (map[cat] || 0) + (bin.actual_qty || 0);
//     });
//     const result = Object.entries(map).map(([category, qty]) => ({ category, qty }));
//     if (result.length === 1 && result[0].category === 'Other' && result[0].qty === 0) {
//       return [
//         { category: 'Bahan Baku', qty: 250 },
//         { category: 'Finished Goods', qty: 120 },
//         { category: 'Raw Materials', qty: 500 },
//         { category: 'Products', qty: 5000 },
//         { category: 'Other', qty: 8 },
//       ];
//     }
//     return result;
//   }, [myBins, items]);

//   // Menampilkan angka berdasarkan data yang sudah terfilter perusahaan
//   const tabsWithCounts = [
//     { id: 'items', label: 'Item', count: items.length },
//     { id: 'warehouse', label: 'Warehouse', count: myWarehouses.length },
//     { id: 'bin', label: 'Stock Level (Bin)', count: myBins.length },
//     { id: 'stockentry', label: 'Stock Entry', count: myStockEntries.length },
//   ];

//   // Pencarian (Search) di masing-masing tab
//   const filteredItems = items.filter((item: any) => {
//     if (!searchQuery) return true;
//     return item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       item.item_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       item.item_group.toLowerCase().includes(searchQuery.toLowerCase());
//   });

//   const filteredWarehouses = myWarehouses.filter((w: any) => {
//     if (!searchQuery) return true;
//     return w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       w.warehouse_name.toLowerCase().includes(searchQuery.toLowerCase());
//   });

//   const filteredBins = myBins.filter((bin: any) => {
//     if (!searchQuery) return true;
//     return bin.item_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       bin.warehouse.toLowerCase().includes(searchQuery.toLowerCase());
//   });

//   // Statistik Berdasarkan Data Perusahaan (Terfilter)
//   const lowStockCount = myBins.filter((b: any) => b.actual_qty < 10).length;
//   const totalStockValue = myBins.reduce((s: number, b: any) => s + (b.stock_value || 0), 0);

//   const stats = [
//     { label: 'Total Items', value: items.length, sub: 'Katalog global', icon: <Package size={22} />, color: '#0066B3', bg: 'linear-gradient(135deg, #eff6ff, #dbeafe)' },
//     { label: 'Total Warehouses', value: myWarehouses.filter((w: any) => !w.is_group).length, sub: 'Gudang aktif perusahaan', icon: <Warehouse size={22} />, color: '#059669', bg: 'linear-gradient(135deg, #ecfdf5, #d1fae5)' },
//     { label: 'Low Stock Alert', value: lowStockCount, sub: 'Perlu restock', icon: <AlertTriangle size={22} />, color: '#d97706', bg: 'linear-gradient(135deg, #fffbeb, #fef3c7)' },
//     { label: 'Total Stock Value', value: formatRupiah(totalStockValue), sub: 'Nilai stok perusahaan saat ini', icon: <TrendingUp size={22} />, color: '#7c3aed', bg: 'linear-gradient(135deg, #f5f3ff, #ede9fe)' },
//   ];

//   return (
//     <div style={{ fontFamily: "'Montserrat', sans-serif", animation: 'fadeIn 0.3s ease-out' }}>
//       {/* Loading/Error State */}
//       {isLoading && (
//         <div style={{ textAlign: 'center', padding: '20px', color: '#6B7280' }}>
//           Memuat data...
//         </div>
//       )}
//       {error && (
//         <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#991b1b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
//           <AlertCircle size={16} />
//           <span>Gagal memuat data: {error}</span>
//           <button onClick={refetch} style={{ marginLeft: 'auto', background: '#ef4444', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>Coba Lagi</button>
//         </div>
//       )}

//       {/* Passing userCompany ke modal yang membutuhkan dan hanya pass myWarehouses yang sudah difilter */}
//       {showCreateModal && <CreateStockEntryModal userCompany={userCompany} onClose={() => setShowCreateModal(false)} warehouses={myWarehouses} items={items} onSuccess={() => refetch()} />}
//       {showCreateItemModal && <CreateItemModal onClose={() => setShowCreateItemModal(false)} onSuccess={() => refetch()} />}
//       {selectedItem && <EditItemModal item={selectedItem} onClose={() => setSelectedItem(null)} onSuccess={() => refetch()} />}
//       {showCreateWarehouseModal && <CreateWarehouseModal userCompany={userCompany} onClose={() => setShowCreateWarehouseModal(false)} onSuccess={() => refetch()} />}
//       {selectedWarehouse && <EditWarehouseModal userCompany={userCompany} warehouse={selectedWarehouse} onClose={() => setSelectedWarehouse(null)} onSuccess={() => refetch()} />}

//       {/* Header */}
//       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
//         <div>
//           <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>Modul Inventory</h1>
//           <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '2px' }}>
//             Manajemen stok khusus untuk perusahaan <strong>{userCompany}</strong>
//           </p>
//           <p style={{ fontSize: '11px', color: '#9CA3AF' }}>
//             ERPNext Doctype: Item, Warehouse, Bin, Stock Entry
//           </p>
//         </div>
//         <div style={{ display: 'flex', gap: '10px' }}>
//           <button className="btn btn-secondary btn-sm"><Download size={14} /> Export</button>
//           {can('create_item') && (
//             <button className="btn btn-primary btn-sm" style={{ background: '#059669' }} onClick={() => setShowCreateItemModal(true)}>
//               <Plus size={14} /> Item Baru
//             </button>
//           )}
//           {can('create_warehouse') && activeTab === 'warehouse' && (
//             <button className="btn btn-primary btn-sm" style={{ background: '#7c3aed' }} onClick={() => setShowCreateWarehouseModal(true)}>
//               <Plus size={14} /> Warehouse Baru
//             </button>
//           )}
//           {can('create_stock_entry') && (
//             <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)}>
//               <Plus size={14} /> Stock Entry
//             </button>
//           )}
//         </div>
//       </div>

//       {/* Stats */}
//       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '16px' }}>
//         {stats.map((s) => (
//           <div key={s.label} className="stat-card card-hover">
//             <div>
//               <p style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '6px' }}>{s.label}</p>
//               <p style={{ fontSize: '22px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>{s.value}</p>
//               <p style={{ fontSize: '11px', color: '#6B7280', fontWeight: 500 }}>{s.sub}</p>
//             </div>
//             <div style={{ width: '44px', height: '44px', borderRadius: '11px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
//               {s.icon}
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Chart */}
//       <div className="chart-container" style={{ marginBottom: '16px' }}>
//         <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '14px' }}>Stock Quantity per Kategori ({userCompany})</p>
//         <ResponsiveContainer width="100%" height={160}>
//           <BarChart data={stockByCategory} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
//             <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
//             <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
//             <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
//             <Tooltip formatter={(v) => [formatNumber(Number(v)) + ' pcs', 'Qty']} />
//             <Bar dataKey="qty" radius={[4, 4, 0, 0]}>
//               {stockByCategory.map((_, i) => (
//                 <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
//               ))}
//             </Bar>
//           </BarChart>
//         </ResponsiveContainer>
//       </div>

//       {/* Tabs + Table */}
//       <div className="chart-container">
//         {/* Tabs & Search */}
//         <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
//           {tabsWithCounts.map((tab) => (
//             <button
//               key={tab.id}
//               className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
//               onClick={() => setActiveTab(tab.id)}
//             >
//               {tab.label} <span style={{
//                 background: activeTab === tab.id ? 'rgba(255,255,255,0.25)' : '#e5e7eb',
//                 color: activeTab === tab.id ? 'white' : '#6B7280',
//                 padding: '1px 7px', borderRadius: '10px', fontSize: '11px', marginLeft: '4px',
//               }}>{tab.count}</span>
//             </button>
//           ))}
//           <div style={{ marginLeft: 'auto', position: 'relative' }}>
//             <Search size={13} color="#9CA3AF" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
//             <input
//               type="text"
//               placeholder="Cari item, warehouse..."
//               value={searchQuery}
//               onChange={e => setSearchQuery(e.target.value)}
//               style={{ padding: '6px 10px 6px 30px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px', fontFamily: "'Montserrat', sans-serif", outline: 'none', width: '220px' }}
//             />
//           </div>
//         </div>

//         {/* Items Table */}
//         {activeTab === 'items' && (
//           <div style={{ overflowX: 'auto' }}>
//             <table className="erp-table">
//               <thead>
//                 <tr>
//                   <th>Item Code</th>
//                   <th>Item Name</th>
//                   <th>Grup</th>
//                   <th>UOM</th>
//                   <th style={{ textAlign: 'right' }}>Std Rate</th>
//                   <th>Stock Item</th>
//                   <th>Status</th>
//                   {can('edit_item') && <th style={{ width: '60px' }}>Actions</th>}
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredItems.map((item: any) => (
//                   <tr key={item.name}>
//                     <td>
//                       <a href={`http://34.101.192.135:8080/app/item/${encodeURIComponent(item.name)}`} target="_blank" rel="noopener noreferrer"
//                         style={{ color: '#0066B3', fontWeight: 700, fontSize: '13px', textDecoration: 'none' }}
//                         onClick={e => e.stopPropagation()}>
//                         {item.item_code}
//                       </a>
//                     </td>
//                     <td style={{ fontWeight: 600, fontSize: '13px', color: '#111827' }}>{item.item_name}</td>
//                     <td>
//                       <span style={{
//                         background: '#f3f4f6', color: '#374151', padding: '2px 8px',
//                         borderRadius: '6px', fontSize: '11px', fontWeight: 600,
//                       }}>{item.item_group}</span>
//                     </td>
//                     <td style={{ fontSize: '12px', color: '#6B7280' }}>{item.stock_uom}</td>
//                     <td style={{ textAlign: 'right', fontWeight: 700, color: '#111827' }}>{formatRupiah(item.standard_rate)}</td>
//                     <td>
//                       <span className={`badge ${item.is_stock_item ? 'badge-success' : 'badge-gray'}`}>
//                         {item.is_stock_item ? 'Ya' : 'Tidak'}
//                       </span>
//                     </td>
//                     <td>
//                       <span className={`badge ${item.disabled ? 'badge-danger' : 'badge-success'}`}>
//                         {item.disabled ? 'Disabled' : 'Active'}
//                       </span>
//                     </td>
//                     {can('edit_item') && (
//                       <td>
//                         <button onClick={() => setSelectedItem(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0066B3', padding: '4px' }}>
//                           <Edit size={16} />
//                         </button>
//                       </td>
//                     )}
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}

//         {/* Warehouse Table */}
//         {activeTab === 'warehouse' && (
//           <table className="erp-table">
//             <thead>
//               <tr>
//                 <th>Warehouse Name</th>
//                 <th>Company</th>
//                 <th>Parent</th>
//                 <th>Type</th>
//                 <th>Status</th>
//                 {can('edit_warehouse') && <th style={{ width: '60px' }}>Actions</th>}
//               </tr>
//             </thead>
//             <tbody>
//               {/* Mapping pakai filteredWarehouses, BUKAN warehouses biasa */}
//               {filteredWarehouses.map((w: any) => (
//                 <tr key={w.name}>
//                   <td>
//                     <div style={{ fontWeight: 700, color: '#0066B3', fontSize: '13px' }}>{w.name}</div>
//                     <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{w.warehouse_name}</div>
//                   </td>
//                   <td style={{ fontSize: '13px', color: '#374151' }}>{w.company}</td>
//                   <td style={{ fontSize: '12px', color: '#6B7280' }}>{w.parent_warehouse || '-'}</td>
//                   <td>
//                     <span className={`badge ${w.is_group ? 'badge-purple' : 'badge-info'}`}>
//                       {w.is_group ? 'Group' : 'Leaf'}
//                     </span>
//                   </td>
//                   <td>
//                     <span className={`badge ${w.disabled ? 'badge-danger' : 'badge-success'}`}>
//                       {w.disabled ? 'Disabled' : 'Active'}
//                     </span>
//                   </td>
//                   {can('edit_warehouse') && (
//                     <td>
//                       <button onClick={() => setSelectedWarehouse(w)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0066B3', padding: '4px' }}>
//                         <Edit size={16} />
//                       </button>
//                     </td>
//                   )}
//                 </tr>
//               ))}
//               {filteredWarehouses.length === 0 && (
//                 <tr>
//                   <td colSpan={can('edit_warehouse') ? 6 : 5} style={{ textAlign: 'center', padding: '32px', color: '#6B7280' }}>
//                     Belum ada gudang untuk perusahaan ini atau tidak ada hasil pencarian.
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         )}

//         {/* Bin Table (Stock Level) */}
//         {activeTab === 'bin' && (
//           <div>
//             <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', fontSize: '12px', color: '#92400e', display: 'flex', alignItems: 'center', gap: '8px' }}>
//               <AlertTriangle size={14} color="#d97706" />
//               {lowStockCount > 0 ? `${lowStockCount} item dengan stok di bawah threshold (≤10 pcs). Segera lakukan restock!` : 'Semua stok dalam kondisi normal.'}
//             </div>
//             <table className="erp-table">
//               <thead>
//                 <tr>
//                   <th>Item Code</th>
//                   <th>Warehouse</th>
//                   <th style={{ textAlign: 'right' }}>Actual Qty</th>
//                   <th style={{ textAlign: 'right' }}>Reserved Qty</th>
//                   <th style={{ textAlign: 'right' }}>Projected Qty</th>
//                   <th style={{ textAlign: 'right' }}>Stock Value</th>
//                   <th>Status</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredBins.map((bin) => {
//                   const isLow = bin.actual_qty < 10;
//                   return (
//                     <tr key={bin.name} style={{ background: isLow ? '#fffbeb' : undefined }}>
//                       <td>
//                         <div style={{ color: '#0066B3', fontWeight: 700, fontSize: '13px' }}>{bin.item_code}</div>
//                         <div style={{ fontSize: '10px', color: '#9CA3AF' }}>{bin.stock_uom}</div>
//                       </td>
//                       <td style={{ fontSize: '12px', color: '#374151' }}>{bin.warehouse}</td>
//                       <td style={{ textAlign: 'right', fontWeight: 700, color: isLow ? '#d97706' : '#111827', fontSize: '14px' }}>
//                         {formatNumber(bin.actual_qty)}
//                       </td>
//                       <td style={{ textAlign: 'right', color: '#ef4444', fontSize: '13px' }}>{formatNumber(bin.reserved_qty)}</td>
//                       <td style={{ textAlign: 'right', color: bin.projected_qty < 0 ? '#ef4444' : '#059669', fontSize: '13px', fontWeight: 600 }}>
//                         {formatNumber(bin.projected_qty)}
//                       </td>
//                       <td style={{ textAlign: 'right', fontSize: '13px', fontWeight: 600 }}>{formatRupiah(bin.stock_value)}</td>
//                       <td>
//                         {isLow
//                           ? <span className="badge badge-warning">⚠ Low Stock</span>
//                           : bin.projected_qty < 0
//                             ? <span className="badge badge-danger">Defisit</span>
//                             : <span className="badge badge-success">Normal</span>
//                         }
//                       </td>
//                     </tr>
//                   );
//                 })}
//                 {filteredBins.length === 0 && (
//                   <tr>
//                     <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#6B7280' }}>
//                       Data stok kosong untuk perusahaan ini.
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         )}

//         {/* Stock Entry Table */}
//         {activeTab === 'stockentry' && (
//           <table className="erp-table">
//             <thead>
//               <tr>
//                 <th>Entry Name</th>
//                 <th>Tipe</th>
//                 <th>Tanggal</th>
//                 <th>Company</th>
//                 <th>From Warehouse</th>
//                 <th>To Warehouse</th>
//                 <th>Status</th>
//                 {can('delete_stock_entry') && <th style={{ width: '60px' }}>Actions</th>}
//               </tr>
//             </thead>
//             <tbody>
//               {myStockEntries.map((se: any) => (
//                 <tr key={se.name}>
//                   <td style={{ color: '#0066B3', fontWeight: 700, fontSize: '13px' }}>{se.name}</td>
//                   <td>
//                     <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
//                        {se.stock_entry_type}
//                     </span>
//                   </td>
//                   <td style={{ fontSize: '12px', color: '#6B7280' }}>{formatDate(se.posting_date)}</td>
//                   <td style={{ fontSize: '12px', color: '#374151' }}>{se.company}</td>
//                   <td style={{ fontSize: '12px', color: '#6B7280' }}>{se.from_warehouse || '-'}</td>
//                   <td style={{ fontSize: '12px', color: '#6B7280' }}>{se.to_warehouse || '-'}</td>
//                   <td>
//                     <span className={`badge ${se.docstatus === 1 ? 'badge-success' : 'badge-gray'}`}>
//                       {se.docstatus === 1 ? 'Submitted' : 'Draft'}
//                     </span>
//                   </td>
//                   {can('delete_stock_entry') && (
//                     <td>
//                       <button 
//                         onClick={async () => {
//                           if (!confirm('Yakin ingin menghapus Stock Entry ini?')) return;
//                           try {
//                             const { apiDelete } = await import('@/lib/api');
//                             await apiDelete('Stock Entry', se.name);
//                             alert('✅ Stock Entry berhasil dihapus!');
//                             refetch();
//                           } catch (err) {
//                             alert('Gagal menghapus: ' + (err instanceof Error ? err.message : 'Unknown'));
//                           }
//                         }} 
//                         style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '4px' }}
//                       >
//                         <Trash2 size={16} />
//                       </button>
//                     </td>
//                   )}
//                 </tr>
//               ))}
//               {myStockEntries.length === 0 && (
//                 <tr>
//                   <td colSpan={can('delete_stock_entry') ? 8 : 7} style={{ textAlign: 'center', padding: '32px', color: '#6B7280' }}>
//                     Belum ada Stock Entry untuk perusahaan ini.
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//            </table>
//         )}
//       </div>

//       <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
//     </div>
//   );
// }


'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { useStockData } from '@/hooks/useFrappeData';
import {
  Package, Warehouse, AlertTriangle, TrendingUp,
  Plus, Download, Search, X, Eye, ArrowRight, AlertCircle, Edit, Trash2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { formatRupiah, formatDate, formatNumber } from '@/lib/utils';

const CATEGORY_COLORS = ['#0066B3', '#059669', '#7c3aed', '#d97706', '#0891b2', '#e11d48'];

// Helper function untuk generate singkatan perusahaan
const getCompanyCode = (companyName: string) => {
  if (companyName.includes('Netra') || companyName === 'NV') return 'NV';
  if (companyName.includes('Solusi')) return 'PSB';
  if (companyName.includes('Maju')) return 'PMS';
  if (companyName.includes('Imaka')) return 'PII';
  if (companyName.includes('Mitra')) return 'PMI';
  return companyName.substring(0, 3).toUpperCase();
};

// Create Item Modal
function CreateItemModal({ onClose, onSuccess }: { onClose: () => void; onSuccess?: () => void }) {
  const [form, setForm] = useState({
    item_code: '',
    item_name: '',
    item_group: 'Products', 
    stock_uom: 'Nos',
    is_stock_item: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { apiCreate } = await import('@/lib/api');
      const result = await apiCreate('Item', {
        item_code: form.item_code,
        item_name: form.item_name,
        item_group: form.item_group,
        stock_uom: form.stock_uom,
        is_stock_item: form.is_stock_item ? 1 : 0,
      });
      console.log('Item created in ERP:', result);
      alert('✅ Item berhasil dibuat di ERP Frappe!');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Failed to create item:', err);
      alert('❌ Gagal membuat item di ERP. Error: ' + (err instanceof Error ? err.message : 'Unknown'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '480px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>Tambah Item Baru</h2>
            <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>Buat item baru di ERP</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Item Code *</label>
            <input type="text" required className="erp-input" style={{ fontSize: '13px' }} value={form.item_code} onChange={e => setForm(f => ({ ...f, item_code: e.target.value }))} placeholder="cth: ITEM-001" />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Item Name *</label>
            <input type="text" required className="erp-input" style={{ fontSize: '13px' }} value={form.item_name} onChange={e => setForm(f => ({ ...f, item_name: e.target.value }))} placeholder="cth: Produk Jadi A" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Item Group</label>
              <select className="erp-input" style={{ fontSize: '13px' }} value={form.item_group} onChange={e => setForm(f => ({ ...f, item_group: e.target.value }))}>
                <option value="Products">Products</option>
                <option value="Raw Material">Raw Material</option>
                <option value="Consumables">Consumables</option>
                <option value="Services">Services</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>UOM</label>
              <select className="erp-input" style={{ fontSize: '13px' }} value={form.stock_uom} onChange={e => setForm(f => ({ ...f, stock_uom: e.target.value }))}>
                <option value="Nos">Nos</option>
                <option value="Kg">Kg</option>
                <option value="Liter">Liter</option>
                <option value="Pcs">Pcs</option>
                <option value="Unit">Unit</option>
                <option value="Box">Box</option>
              </select>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.is_stock_item} onChange={e => setForm(f => ({ ...f, is_stock_item: e.target.checked }))} />
            Item ini adalah stock item (memiliki stok)
          </label>

          <div style={{ background: '#f0f9ff', borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#0369a1' }}>
            <strong>🔄 Real-time Sync:</strong> Data akan langsung dikirim ke Frappe ERP dan tersedia untuk semua modul.
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Batal</button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ flex: 2 }}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan ke ERP'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Item Modal
function EditItemModal({ item, onClose, onSuccess }: { item: any; onClose: () => void; onSuccess?: () => void }) {
  const [form, setForm] = useState({
    item_name: item.item_name || '',
    item_group: item.item_group || 'Products',
    stock_uom: item.stock_uom || 'Nos',
    is_stock_item: item.is_stock_item === 1 || item.is_stock_item === true,
    standard_rate: item.standard_rate || 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const { apiUpdate } = await import('@/lib/api');
      const result = await apiUpdate('Item', item.name, {
        ...form,
        is_stock_item: form.is_stock_item ? 1 : 0,
        standard_rate: parseFloat(String(form.standard_rate)) || 0,
      });
      console.log('Item updated in ERP:', result);
      alert('✅ Item berhasil diupdate di ERP Frappe!');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Failed to update item:', err);
      setError('Gagal mengupdate item: ' + (err instanceof Error ? err.message : 'Unknown'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Yakin ingin menghapus item ini? Data yang terkait akan hilang.')) return;
    setIsSubmitting(true);
    try {
      const { apiDelete } = await import('@/lib/api');
      await apiDelete('Item', item.name);
      alert('✅ Item berhasil dihapus dari ERP Frappe!');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Failed to delete item:', err);
      setError('Gagal menghapus item: ' + (err instanceof Error ? err.message : 'Unknown'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '480px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>Edit Item</h2>
            <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>{item.name}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Item Code</label>
            <input disabled className="erp-input" style={{ fontSize: '13px', background: '#f3f4f6' }} value={item.name} />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Item Name *</label>
            <input required type="text" className="erp-input" style={{ fontSize: '13px' }} value={form.item_name} onChange={e => setForm(f => ({ ...f, item_name: e.target.value }))} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Item Group</label>
              <select required className="erp-input" style={{ fontSize: '13px' }} value={form.item_group} onChange={e => setForm(f => ({ ...f, item_group: e.target.value }))}>
                <option value="Products">Products</option>
                <option value="Raw Material">Raw Material</option>
                <option value="Consumables">Consumables</option>
                <option value="Services">Services</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Stock UOM</label>
              <select required className="erp-input" style={{ fontSize: '13px' }} value={form.stock_uom} onChange={e => setForm(f => ({ ...f, stock_uom: e.target.value }))}>
                <option value="Nos">Nos (Pcs)</option>
                <option value="Unit">Unit</option>
                <option value="Kg">Kg</option>
                <option value="Liter">Liter</option>
                <option value="Meter">Meter</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Standard Rate (Rp)</label>
            <input type="number" className="erp-input" style={{ fontSize: '13px' }} value={form.standard_rate} onChange={e => setForm(f => ({ ...f, standard_rate: e.target.value }))} />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.is_stock_item} onChange={e => setForm(f => ({ ...f, is_stock_item: e.target.checked }))} />
            Item ini adalah stock item (memiliki stok)
          </label>

          {error && (
            <div style={{ background: '#fee2e2', borderRadius: '6px', padding: '10px', color: '#991b1b', fontSize: '12px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={handleDelete} disabled={isSubmitting} style={{ flex: 1, background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px', color: '#dc2626', fontWeight: 600, cursor: 'pointer' }}>
              <Trash2 size={15} /> Hapus
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ flex: 2 }}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Create Warehouse Modal
function CreateWarehouseModal({ onClose, onSuccess, userCompany }: { onClose: () => void; onSuccess?: () => void; userCompany: string }) {
  const [form, setForm] = useState({
    warehouse_name: '',
    company: userCompany, 
    is_group: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const companyCode = getCompanyCode(form.company);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const warehouseName = `${form.warehouse_name} - ${companyCode}`;
      const { apiCreate } = await import('@/lib/api');
      const result = await apiCreate('Warehouse', {
        name: warehouseName,
        warehouse_name: form.warehouse_name,
        company: form.company,
        is_group: form.is_group ? 1 : 0,
        parent_warehouse: form.is_group ? `All Warehouses - ${companyCode}` : '',
      });
      console.log('Warehouse created in ERP:', result);
      alert('✅ Warehouse berhasil dibuat di ERP Frappe!');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Failed to create Warehouse:', err);
      setError('Gagal membuat Warehouse: ' + (err instanceof Error ? err.message : 'Unknown'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '480px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>Tambah Warehouse</h2>
            <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>Buat warehouse baru</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Nama Warehouse *</label>
            <input required type="text" className="erp-input" style={{ fontSize: '13px' }} value={form.warehouse_name} onChange={e => setForm(f => ({ ...f, warehouse_name: e.target.value }))} placeholder="cth: Gudang Utama" />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Perusahaan (Otomatis)</label>
            <input 
              type="text" 
              readOnly 
              className="erp-input" 
              style={{ fontSize: '13px', background: '#f3f4f6', color: '#6B7280', cursor: 'not-allowed' }} 
              value={form.company} 
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.is_group} onChange={e => setForm(f => ({ ...f, is_group: e.target.checked }))} />
            Ini adalah parent warehouse (group)
          </label>

          <div style={{ background: '#f0f9ff', borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#0369a1' }}>
            <strong>Preview Kode Gudang:</strong> {form.warehouse_name || 'Nama Warehouse'} - {companyCode}
          </div>

          {error && (
            <div style={{ background: '#fee2e2', borderRadius: '6px', padding: '10px', color: '#991b1b', fontSize: '12px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }} disabled={isSubmitting}>Batal</button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ flex: 2 }}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan ke ERP'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Warehouse Modal
function EditWarehouseModal({ warehouse, onClose, onSuccess, userCompany }: { warehouse: any; onClose: () => void; onSuccess?: () => void; userCompany: string }) {
  const [form, setForm] = useState({
    warehouse_name: warehouse.warehouse_name || '',
    company: warehouse.company || userCompany,
    is_group: warehouse.is_group === 1 || warehouse.is_group === true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const { apiUpdate } = await import('@/lib/api');
      const result = await apiUpdate('Warehouse', warehouse.name, {
        warehouse_name: form.warehouse_name,
        company: form.company,
        is_group: form.is_group ? 1 : 0,
      });
      console.log('Warehouse updated in ERP:', result);
      alert('✅ Warehouse berhasil diupdate di ERP Frappe!');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Failed to update Warehouse:', err);
      setError('Gagal mengupdate Warehouse: ' + (err instanceof Error ? err.message : 'Unknown'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Yakin ingin menghapus warehouse ini?')) return;
    setIsSubmitting(true);
    try {
      const { apiDelete } = await import('@/lib/api');
      await apiDelete('Warehouse', warehouse.name);
      alert('✅ Warehouse berhasil dihapus dari ERP Frappe!');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Failed to delete Warehouse:', err);
      setError('Gagal menghapus Warehouse: ' + (err instanceof Error ? err.message : 'Unknown'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '480px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>Edit Warehouse</h2>
            <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>{warehouse.name}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Nama Warehouse *</label>
            <input required type="text" className="erp-input" style={{ fontSize: '13px' }} value={form.warehouse_name} onChange={e => setForm(f => ({ ...f, warehouse_name: e.target.value }))} />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Perusahaan (Otomatis)</label>
            <input 
              type="text" 
              readOnly 
              className="erp-input" 
              style={{ fontSize: '13px', background: '#f3f4f6', color: '#6B7280', cursor: 'not-allowed' }} 
              value={form.company} 
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.is_group} onChange={e => setForm(f => ({ ...f, is_group: e.target.checked }))} />
            Ini adalah parent warehouse (group)
          </label>

          {error && (
            <div style={{ background: '#fee2e2', borderRadius: '6px', padding: '10px', color: '#991b1b', fontSize: '12px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={handleDelete} disabled={isSubmitting} style={{ flex: 1, background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px', color: '#dc2626', fontWeight: 600, cursor: 'pointer' }}>
              <Trash2 size={15} /> Hapus
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ flex: 2 }}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Create Stock Entry Modal (RAW FETCH BYPASS & RESTRICTED TYPES)
function CreateStockEntryModal({ onClose, warehouses, items, onSuccess, userCompany }: { onClose: () => void; warehouses: any[]; items: any[]; onSuccess?: () => void; userCompany: string }) {
  // Hanya ijinkan 2 tipe sederhana yang mendukung 1 gudang
  const ALLOWED_ENTRY_TYPES = [
    { value: 'Material Receipt', label: 'Material Receipt (Penerimaan)' },
    { value: 'Material Issue', label: 'Material Issue (Pengeluaran)' }
  ];

  const [form, setForm] = useState({
    stock_entry_type: 'Material Receipt',
    company: userCompany,
    item_code: '',
    qty: '',
    warehouse: '', 
    posting_date: new Date().toISOString().split('T')[0],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Tampilkan semua warehouse bertipe Leaf (bukan group/folder)
  const activeWarehouses = useMemo(() => {
    return warehouses.filter((w: any) => (w.is_group === 0 || w.is_group === false) && w.company === userCompany);
  }, [warehouses, userCompany]);

  useEffect(() => {
    if (activeWarehouses.length > 0 && !form.warehouse) {
      setForm(f => ({ ...f, warehouse: activeWarehouses[0].name }));
    }
  }, [activeWarehouses, form.warehouse]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      if (!form.warehouse) throw new Error("Silakan pilih Warehouse terlebih dahulu");
      if (!form.item_code) throw new Error("Silakan pilih Item terlebih dahulu");
      
      const selectedItem = items.find((i: any) => i.item_code === form.item_code);
      const isIssue = form.stock_entry_type === 'Material Issue';

      const detailItem: any = {
        item_code: form.item_code,
        qty: parseFloat(form.qty),
        uom: selectedItem?.stock_uom || 'Nos',
        conversion_factor: 1,
      };

      if (isIssue) {
        detailItem.s_warehouse = form.warehouse;
      } else {
        detailItem.t_warehouse = form.warehouse;
        detailItem.basic_rate = selectedItem?.standard_rate || 100;
      }

      const stockEntryData: any = {
        stock_entry_type: form.stock_entry_type,
        posting_date: form.posting_date,
        company: form.company,
        set_posting_time: 1, 
        items: [detailItem]
      };

      if (isIssue) {
        stockEntryData.from_warehouse = form.warehouse;
      } else {
        stockEntryData.to_warehouse = form.warehouse;
      }

      const response = await fetch('/api/frappe/resource/Stock Entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stockEntryData)
      });

      const responseText = await response.text();
      let responseData;
      
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Server tidak merespons JSON. RAW: ${responseText.substring(0, 100)}`);
      }

      // Deteksi jika API Proxy merubah error 417 menjadi pesan "Server ERP busy"
      if (responseData.error === 'Server ERP busy' || (responseData.data && responseData.data.length === 0 && !responseData.name)) {
         throw new Error("DITOLAK OLEH ERPNEXT (417 Validation Error).\n\nPenyebab paling sering:\n1. Stok tidak cukup (jika Issue/Keluar)\n2. 'Default Inventory Account' atau 'Stock Adjustment Account' belum disetting di Master Company ERPNext.\n3. Cost Center belum terisi otomatis.");
      }

      if (!response.ok || responseData.exc || responseData.error) {
        let errorMessage = responseData.error || responseData.message || "Gagal menyimpan ke server ERPNext";
        if (responseData._server_messages) {
           try {
             const msgs = JSON.parse(responseData._server_messages);
             if (msgs.length > 0) errorMessage = JSON.parse(msgs[0]).message;
           } catch(e) {}
        }
        throw new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
      }

      const docName = responseData?.data?.name || responseData?.name || responseData?.message?.name;
      
      if (!docName) {
         throw new Error(`Data masuk, tapi ID gagal diekstrak. RAW: ${responseText.substring(0, 100)}`);
      }

      const submitUrl = `/api/frappe/resource/Stock%20Entry/${encodeURIComponent(docName)}`;
      const responseSubmit = await fetch(submitUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docstatus: 1 })
      });

      if (!responseSubmit.ok) {
         const submitErrText = await responseSubmit.text();
         throw new Error(`Gagal pada tahap Submit dokumen: ${submitErrText.substring(0, 150)}`);
      }
      
      alert('✅ Stock Entry berhasil dibuat dan stok otomatis terpotong/bertambah!');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Gagal saat memproses Stock Entry:', err);
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '480px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>Buat Stock Entry</h2>
            <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>Mutasi stok barang (Material Receipt/Issue)</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
            <X size={20} />
          </button>
        </div>

        {isSubmitting ? (
          <div style={{ textAlign: 'center', padding: '32px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>⏳</div>
            <p style={{ fontSize: '16px', fontWeight: 700 }}>Memproses ke ERP...</p>
            <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '8px' }}>Menyinkronkan data dan kalkulasi stok otomatis...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Tipe Transaksi *</label>
              <select
                required
                value={form.stock_entry_type}
                onChange={e => setForm(f => ({ ...f, stock_entry_type: e.target.value }))}
                className="erp-input"
                style={{ fontSize: '13px' }}
              >
                {ALLOWED_ENTRY_TYPES.map((t: any) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Tanggal Posting *</label>
                <input type="date" required className="erp-input" style={{ fontSize: '13px' }} value={form.posting_date} onChange={e => setForm(f => ({ ...f, posting_date: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Warehouse *</label>
                <select required className="erp-input" style={{ fontSize: '13px' }} value={form.warehouse} onChange={e => setForm(f => ({ ...f, warehouse: e.target.value }))}>
                  <option value="">Pilih Warehouse...</option>
                  {activeWarehouses.map((w: any) => <option key={w.name} value={w.name}>{w.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Perusahaan (Terisi Otomatis)</label>
              <input 
                type="text" 
                readOnly 
                className="erp-input" 
                style={{ fontSize: '13px', background: '#f3f4f6', color: '#6B7280', cursor: 'not-allowed' }} 
                value={form.company} 
              />
            </div>

            <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '10px' }}>Detail Item</p>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Pilih Item *</label>
                  <select required className="erp-input" style={{ fontSize: '13px' }} value={form.item_code} onChange={e => setForm(f => ({ ...f, item_code: e.target.value }))}>
                    <option value="">Cari item...</option>
                    {items.map((i: any) => <option key={i.name} value={i.item_code}>{i.item_code} - {i.item_name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Jumlah (Qty) *</label>
                  <input type="number" required placeholder="0" min="0.01" step="0.01" className="erp-input" style={{ fontSize: '13px' }} value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} />
                </div>
              </div>
            </div>

            {error && (
              <div style={{ background: '#fee2e2', borderRadius: '6px', padding: '10px', color: '#991b1b', fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                <strong style={{ display: 'block', marginBottom: '4px' }}>Gagal memproses Stock Entry:</strong>
                {error}
              </div>
            )}

            <div style={{ background: '#f0f7ff', borderRadius: '8px', padding: '10px 12px', fontSize: '11px', color: '#374151', lineHeight: 1.6, border: '1px solid #dbeafe' }}>
              <strong>Info:</strong> Form ini didesain untuk transaksi 1 gudang (Receipt/Issue). Untuk transaksi Manufacture/Transfer (Gudang Asal & Tujuan), silakan gunakan ERPNext.
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }} disabled={isSubmitting}>Batal</button>
              <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ flex: 2 }}>
                {isSubmitting ? 'Menyimpan...' : (<><Plus size={14} /> Proses Stock Entry</>)}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function StockPage() {
  const router = useRouter();
  
  const { can, canAccess, user } = useAuth();
  const userCompany = (user as any)?.company || 'Netra Vidya';

  const { items, warehouses, bins, stockEntries, isLoading, error, refetch } = useStockData();
  const [activeTab, setActiveTab] = useState('items');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateItemModal, setShowCreateItemModal] = useState(false);
  const [showCreateWarehouseModal, setShowCreateWarehouseModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);

  // Redirect if user doesn't have access to stock module
  React.useEffect(() => {
    if (!canAccess('stock')) {
      router.push('/dashboard');
    }
  }, [canAccess, router]);

  // =========================================================================
  // LOGIKA FILTER BERDASARKAN PERUSAHAAN (COMPANY)
  // =========================================================================
  
  // 1. Filter Warehouse
  const myWarehouses = useMemo(() => {
    return warehouses.filter((w: any) => w.company === userCompany);
  }, [warehouses, userCompany]);
  
  const myWarehouseNames = useMemo(() => {
    return myWarehouses.map((w: any) => w.name);
  }, [myWarehouses]);

  // 2. Filter Bin (Stok)
  const myBins = useMemo(() => {
    return bins.filter((b: any) => myWarehouseNames.includes(b.warehouse));
  }, [bins, myWarehouseNames]);

  // 3. Filter Stock Entries (DIPERBAIKI: Fallback mengecek gudang jika field company hilang)
  const myStockEntries = useMemo(() => {
    return stockEntries.filter((se: any) => {
      // Jika dari API ada datanya
      if (se.company && se.company === userCompany) return true;
      
      // Jika dari API data company hilang/kosong, kita cek gudangnya
      if (se.to_warehouse && myWarehouseNames.includes(se.to_warehouse)) return true;
      if (se.from_warehouse && myWarehouseNames.includes(se.from_warehouse)) return true;
      
      return false;
    });
  }, [stockEntries, userCompany, myWarehouseNames]);

  // =========================================================================

  // Calculate stock by category from filtered bins data
  const stockByCategory = React.useMemo(() => {
    if (myBins.length < 3) {
      return [
        { category: 'Bahan Baku', qty: 250 },
        { category: 'Finished Goods', qty: 120 },
        { category: 'Raw Materials', qty: 500 },
        { category: 'Products', qty: 5000 },
        { category: 'Other', qty: 8 },
      ];
    }
    
    const map: Record<string, number> = {};
    myBins.forEach((bin: any) => {
      const item = items.find((i: any) => i.item_code === bin.item_code);
      const cat = item?.item_group || 'Other';
      map[cat] = (map[cat] || 0) + (bin.actual_qty || 0);
    });
    const result = Object.entries(map).map(([category, qty]) => ({ category, qty }));
    if (result.length === 1 && result[0].category === 'Other' && result[0].qty === 0) {
      return [
        { category: 'Bahan Baku', qty: 250 },
        { category: 'Finished Goods', qty: 120 },
        { category: 'Raw Materials', qty: 500 },
        { category: 'Products', qty: 5000 },
        { category: 'Other', qty: 8 },
      ];
    }
    return result;
  }, [myBins, items]);

  const tabsWithCounts = [
    { id: 'items', label: 'Item', count: items.length },
    { id: 'warehouse', label: 'Warehouse', count: myWarehouses.length },
    { id: 'bin', label: 'Stock Level (Bin)', count: myBins.length },
    { id: 'stockentry', label: 'Stock Entry', count: myStockEntries.length },
  ];

  const filteredItems = items.filter((item: any) => {
    if (!searchQuery) return true;
    return item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.item_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.item_group.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredWarehouses = myWarehouses.filter((w: any) => {
    if (!searchQuery) return true;
    return w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.warehouse_name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredBins = myBins.filter((bin: any) => {
    if (!searchQuery) return true;
    return bin.item_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bin.warehouse.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const lowStockCount = myBins.filter((b: any) => b.actual_qty < 10).length;
  const totalStockValue = myBins.reduce((s: number, b: any) => s + (b.stock_value || 0), 0);

  const stats = [
    { label: 'Total Items', value: items.length, sub: 'Katalog global', icon: <Package size={22} />, color: '#0066B3', bg: 'linear-gradient(135deg, #eff6ff, #dbeafe)' },
    { label: 'Total Warehouses', value: myWarehouses.filter((w: any) => !w.is_group).length, sub: 'Gudang aktif perusahaan', icon: <Warehouse size={22} />, color: '#059669', bg: 'linear-gradient(135deg, #ecfdf5, #d1fae5)' },
    { label: 'Low Stock Alert', value: lowStockCount, sub: 'Perlu restock', icon: <AlertTriangle size={22} />, color: '#d97706', bg: 'linear-gradient(135deg, #fffbeb, #fef3c7)' },
    { label: 'Total Stock Value', value: formatRupiah(totalStockValue), sub: 'Nilai stok perusahaan saat ini', icon: <TrendingUp size={22} />, color: '#7c3aed', bg: 'linear-gradient(135deg, #f5f3ff, #ede9fe)' },
  ];

  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif", animation: 'fadeIn 0.3s ease-out' }}>
      {/* Loading/Error State */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#6B7280' }}>
          Memuat data...
        </div>
      )}
      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#991b1b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} />
          <span>Gagal memuat data: {error}</span>
          <button onClick={refetch} style={{ marginLeft: 'auto', background: '#ef4444', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>Coba Lagi</button>
        </div>
      )}

      {showCreateModal && <CreateStockEntryModal userCompany={userCompany} onClose={() => setShowCreateModal(false)} warehouses={myWarehouses} items={items} onSuccess={() => refetch()} />}
      {showCreateItemModal && <CreateItemModal onClose={() => setShowCreateItemModal(false)} onSuccess={() => refetch()} />}
      {selectedItem && <EditItemModal item={selectedItem} onClose={() => setSelectedItem(null)} onSuccess={() => refetch()} />}
      {showCreateWarehouseModal && <CreateWarehouseModal userCompany={userCompany} onClose={() => setShowCreateWarehouseModal(false)} onSuccess={() => refetch()} />}
      {selectedWarehouse && <EditWarehouseModal userCompany={userCompany} warehouse={selectedWarehouse} onClose={() => setSelectedWarehouse(null)} onSuccess={() => refetch()} />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>Modul Inventory</h1>
          <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '2px' }}>
            Manajemen stok khusus untuk perusahaan <strong>{userCompany}</strong>
          </p>
          <p style={{ fontSize: '11px', color: '#9CA3AF' }}>
            ERPNext Doctype: Item, Warehouse, Bin, Stock Entry
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary btn-sm"><Download size={14} /> Export</button>
          {can('create_item') && (
            <button className="btn btn-primary btn-sm" style={{ background: '#059669' }} onClick={() => setShowCreateItemModal(true)}>
              <Plus size={14} /> Item Baru
            </button>
          )}
          {can('create_warehouse') && activeTab === 'warehouse' && (
            <button className="btn btn-primary btn-sm" style={{ background: '#7c3aed' }} onClick={() => setShowCreateWarehouseModal(true)}>
              <Plus size={14} /> Warehouse Baru
            </button>
          )}
          {can('create_stock_entry') && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)}>
              <Plus size={14} /> Stock Entry
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '16px' }}>
        {stats.map((s) => (
          <div key={s.label} className="stat-card card-hover">
            <div>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '6px' }}>{s.label}</p>
              <p style={{ fontSize: '22px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>{s.value}</p>
              <p style={{ fontSize: '11px', color: '#6B7280', fontWeight: 500 }}>{s.sub}</p>
            </div>
            <div style={{ width: '44px', height: '44px', borderRadius: '11px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
              {s.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="chart-container" style={{ marginBottom: '16px' }}>
        <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '14px' }}>Stock Quantity per Kategori ({userCompany})</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={stockByCategory} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v) => [formatNumber(Number(v)) + ' pcs', 'Qty']} />
            <Bar dataKey="qty" radius={[4, 4, 0, 0]}>
              {stockByCategory.map((_, i) => (
                <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabs + Table */}
      <div className="chart-container">
        {/* Tabs & Search */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          {tabsWithCounts.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label} <span style={{
                background: activeTab === tab.id ? 'rgba(255,255,255,0.25)' : '#e5e7eb',
                color: activeTab === tab.id ? 'white' : '#6B7280',
                padding: '1px 7px', borderRadius: '10px', fontSize: '11px', marginLeft: '4px',
              }}>{tab.count}</span>
            </button>
          ))}
          <div style={{ marginLeft: 'auto', position: 'relative' }}>
            <Search size={13} color="#9CA3AF" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Cari item, warehouse..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ padding: '6px 10px 6px 30px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px', fontFamily: "'Montserrat', sans-serif", outline: 'none', width: '220px' }}
            />
          </div>
        </div>

        {/* Items Table */}
        {activeTab === 'items' && (
          <div style={{ overflowX: 'auto' }}>
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Item Code</th>
                  <th>Item Name</th>
                  <th>Grup</th>
                  <th>UOM</th>
                  <th style={{ textAlign: 'right' }}>Std Rate</th>
                  <th>Stock Item</th>
                  <th>Status</th>
                  {can('edit_item') && <th style={{ width: '60px' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item: any) => (
                  <tr key={item.name}>
                    <td>
                      <a href={`http://34.101.192.135:8080/app/item/${encodeURIComponent(item.name)}`} target="_blank" rel="noopener noreferrer"
                        style={{ color: '#0066B3', fontWeight: 700, fontSize: '13px', textDecoration: 'none' }}
                        onClick={e => e.stopPropagation()}>
                        {item.item_code}
                      </a>
                    </td>
                    <td style={{ fontWeight: 600, fontSize: '13px', color: '#111827' }}>{item.item_name}</td>
                    <td>
                      <span style={{
                        background: '#f3f4f6', color: '#374151', padding: '2px 8px',
                        borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                      }}>{item.item_group}</span>
                    </td>
                    <td style={{ fontSize: '12px', color: '#6B7280' }}>{item.stock_uom}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#111827' }}>{formatRupiah(item.standard_rate)}</td>
                    <td>
                      <span className={`badge ${item.is_stock_item ? 'badge-success' : 'badge-gray'}`}>
                        {item.is_stock_item ? 'Ya' : 'Tidak'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${item.disabled ? 'badge-danger' : 'badge-success'}`}>
                        {item.disabled ? 'Disabled' : 'Active'}
                      </span>
                    </td>
                    {can('edit_item') && (
                      <td>
                        <button onClick={() => setSelectedItem(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0066B3', padding: '4px' }}>
                          <Edit size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Warehouse Table */}
        {activeTab === 'warehouse' && (
          <table className="erp-table">
            <thead>
              <tr>
                <th>Warehouse Name</th>
                <th>Company</th>
                <th>Parent</th>
                <th>Type</th>
                <th>Status</th>
                {can('edit_warehouse') && <th style={{ width: '60px' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredWarehouses.map((w: any) => (
                <tr key={w.name}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0066B3', fontSize: '13px' }}>{w.name}</div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{w.warehouse_name}</div>
                  </td>
                  <td style={{ fontSize: '13px', color: '#374151' }}>{w.company}</td>
                  <td style={{ fontSize: '12px', color: '#6B7280' }}>{w.parent_warehouse || '-'}</td>
                  <td>
                    <span className={`badge ${w.is_group ? 'badge-purple' : 'badge-info'}`}>
                      {w.is_group ? 'Group' : 'Leaf'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${w.disabled ? 'badge-danger' : 'badge-success'}`}>
                      {w.disabled ? 'Disabled' : 'Active'}
                    </span>
                  </td>
                  {can('edit_warehouse') && (
                    <td>
                      <button onClick={() => setSelectedWarehouse(w)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0066B3', padding: '4px' }}>
                        <Edit size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {filteredWarehouses.length === 0 && (
                <tr>
                  <td colSpan={can('edit_warehouse') ? 6 : 5} style={{ textAlign: 'center', padding: '32px', color: '#6B7280' }}>
                    Belum ada gudang untuk perusahaan ini atau tidak ada hasil pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* Bin Table (Stock Level) */}
        {activeTab === 'bin' && (
          <div>
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', fontSize: '12px', color: '#92400e', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={14} color="#d97706" />
              {lowStockCount > 0 ? `${lowStockCount} item dengan stok di bawah threshold (≤10 pcs). Segera lakukan restock!` : 'Semua stok dalam kondisi normal.'}
            </div>
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Item Code</th>
                  <th>Warehouse</th>
                  <th style={{ textAlign: 'right' }}>Actual Qty</th>
                  <th style={{ textAlign: 'right' }}>Reserved Qty</th>
                  <th style={{ textAlign: 'right' }}>Projected Qty</th>
                  <th style={{ textAlign: 'right' }}>Stock Value</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredBins.map((bin) => {
                  const isLow = bin.actual_qty < 10;
                  return (
                    <tr key={bin.name} style={{ background: isLow ? '#fffbeb' : undefined }}>
                      <td>
                        <div style={{ color: '#0066B3', fontWeight: 700, fontSize: '13px' }}>{bin.item_code}</div>
                        <div style={{ fontSize: '10px', color: '#9CA3AF' }}>{bin.stock_uom}</div>
                      </td>
                      <td style={{ fontSize: '12px', color: '#374151' }}>{bin.warehouse}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: isLow ? '#d97706' : '#111827', fontSize: '14px' }}>
                        {formatNumber(bin.actual_qty)}
                      </td>
                      <td style={{ textAlign: 'right', color: '#ef4444', fontSize: '13px' }}>{formatNumber(bin.reserved_qty)}</td>
                      <td style={{ textAlign: 'right', color: bin.projected_qty < 0 ? '#ef4444' : '#059669', fontSize: '13px', fontWeight: 600 }}>
                        {formatNumber(bin.projected_qty)}
                      </td>
                      <td style={{ textAlign: 'right', fontSize: '13px', fontWeight: 600 }}>{formatRupiah(bin.stock_value)}</td>
                      <td>
                        {isLow
                          ? <span className="badge badge-warning">⚠ Low Stock</span>
                          : bin.projected_qty < 0
                            ? <span className="badge badge-danger">Defisit</span>
                            : <span className="badge badge-success">Normal</span>
                        }
                      </td>
                    </tr>
                  );
                })}
                {filteredBins.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#6B7280' }}>
                      Data stok kosong untuk perusahaan ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Stock Entry Table */}
        {activeTab === 'stockentry' && (
          <table className="erp-table">
            <thead>
              <tr>
                <th>Entry Name</th>
                <th>Tipe</th>
                <th>Tanggal</th>
                <th>Company</th>
                <th>From Warehouse</th>
                <th>To Warehouse</th>
                <th>Status</th>
                {can('delete_stock_entry') && <th style={{ width: '60px' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {myStockEntries.map((se: any) => (
                <tr key={se.name}>
                  <td style={{ color: '#0066B3', fontWeight: 700, fontSize: '13px' }}>{se.name}</td>
                  <td>
                    <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                       {se.stock_entry_type}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px', color: '#6B7280' }}>{formatDate(se.posting_date)}</td>
                  <td style={{ fontSize: '12px', color: '#374151' }}>{se.company || userCompany}</td>
                  <td style={{ fontSize: '12px', color: '#6B7280' }}>{se.from_warehouse || '-'}</td>
                  <td style={{ fontSize: '12px', color: '#6B7280' }}>{se.to_warehouse || '-'}</td>
                  <td>
                    <span className={`badge ${se.docstatus === 1 ? 'badge-success' : 'badge-gray'}`}>
                      {se.docstatus === 1 ? 'Submitted' : 'Draft'}
                    </span>
                  </td>
                  {can('delete_stock_entry') && (
                    <td>
                      <button 
                        onClick={async () => {
                          if (!confirm('Yakin ingin menghapus Stock Entry ini?')) return;
                          try {
                            const { apiDelete } = await import('@/lib/api');
                            await apiDelete('Stock Entry', se.name);
                            alert('✅ Stock Entry berhasil dihapus!');
                            refetch();
                          } catch (err) {
                            alert('Gagal menghapus: ' + (err instanceof Error ? err.message : 'Unknown'));
                          }
                        }} 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '4px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {myStockEntries.length === 0 && (
                <tr>
                  <td colSpan={can('delete_stock_entry') ? 8 : 7} style={{ textAlign: 'center', padding: '32px', color: '#6B7280' }}>
                    Belum ada Stock Entry untuk perusahaan ini.
                  </td>
                </tr>
              )}
            </tbody>
           </table>
        )}
      </div>

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}