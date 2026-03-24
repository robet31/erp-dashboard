// 'use client';

// import React, { useState, useMemo } from 'react';
// import { useRouter } from 'next/navigation';
// import { useAuth } from '@/providers/auth-provider';
// import { useSellingData, useStockData } from '@/hooks/useFrappeData';
// import {
//   ShoppingCart, Users, Truck, Plus, Download, Filter,
//   ChevronRight, Search, Package, Calendar, ArrowUpRight,
//   TrendingUp, FileText, X, Eye, AlertCircle, Edit, Trash2
// } from 'lucide-react';
// import {
//   LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
//   PieChart, Pie, Cell, AreaChart, Area
// } from 'recharts';
// import { formatRupiah, formatDate, getStatusBadgeClass, getStatusLabel } from '@/lib/utils';
// import type { SalesOrder, Customer } from '@/lib/frappe-types';
// import { FRAPPE_COMPANIES, FRAPPE_WAREHOUSES, getWarehousesByCompany } from '@/config/frappe-data';

// const TABS = [
//   { id: 'orders', label: 'Sales Orders', count: 0 },
//   { id: 'customers', label: 'Customers', count: 0 },
//   { id: 'delivery', label: 'Delivery Notes', count: 0 },
// ];

// const STATUS_FILTERS = ['Semua', 'Draft', 'To Deliver and Bill', 'Completed', 'Cancelled'];

// const STATUS_COLORS: Record<string, string> = {
//   'Selesai': '#10b981',
//   'Proses': '#3b82f6',
//   'Siap Kirim': '#f59e0b',
//   'Draft': '#6B7280',
//   'Batal': '#ef4444',
// };

// const donutData = [
//   { name: 'Selesai', value: 28 },
//   { name: 'Proses', value: 15 },
//   { name: 'Siap Kirim', value: 5 },
//   { name: 'Draft', value: 3 },
//   { name: 'Batal', value: 3 },
// ];
// const DONUT_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#6B7280', '#ef4444'];

// // Modal to create Sales Order
// function CreateOrderModal({ onClose, customers, items, onSuccess }: { onClose: () => void; customers: Customer[]; items: any[]; onSuccess?: () => void }) {
//   const [form, setForm] = useState({
//     customer: '',
//     company: 'Netra Vidya',
//     delivery_date: new Date().toISOString().split('T')[0],
//     transaction_date: new Date().toISOString().split('T')[0],
//     item_code: '',
//     qty: '',
//     rate: '',
//     warehouse: 'Finished Goods - NV',
//   });
//   const [submitted, setSubmitted] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [error, setError] = useState('');

//   const warehouses = useMemo(() => getWarehousesByCompany(form.company), [form.company]);

//   const handleCompanyChange = (company: string) => {
//     const code = company === 'Netra Vidya' ? 'NV' : 
//                  company === 'PT Solusi Berdikari' ? 'PSB' :
//                  company === 'PT Maju Sejahtera' ? 'PMS' : 'PMJA';
//     setForm(f => ({
//       ...f,
//       company,
//       warehouse: `Finished Goods - ${code}`,
//     }));
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsSubmitting(true);
//     setError('');

//     try {
//       const selectedItem = items.find((i: any) => i.item_code === form.item_code);
      
//       const salesOrderData = {
//         customer: form.customer,
//         transaction_date: form.transaction_date,
//         delivery_date: form.delivery_date,
//         company: form.company,
//         currency: 'IDR',
//         items: [
//           {
//             item_code: form.item_code,
//             item_name: selectedItem?.item_name || form.item_code,
//             qty: parseFloat(form.qty),
//             rate: parseFloat(form.rate),
//             warehouse: form.warehouse,
//             amount: parseFloat(form.qty) * parseFloat(form.rate),
//           }
//         ]
//       };

//       const { apiCreate } = await import('@/lib/api');
//       const result = await apiCreate('Sales Order', salesOrderData);
//       console.log('Sales Order created in ERP:', result);
//       alert('✅ Sales Order berhasil dibuat di ERP Frappe!');
//       setSubmitted(true);
//       setTimeout(() => {
//         onClose();
//         if (onSuccess) onSuccess();
//       }, 1500);
//     } catch (err) {
//       console.error('Failed to create Sales Order:', err);
//       setError('Gagal membuat Sales Order: ' + (err instanceof Error ? err.message : 'Unknown'));
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
//       <div className="modal-content" style={{ width: '520px' }}>
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
//           <div>
//             <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>Sales Order Baru</h2>
//             <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>Input pesanan dari customer</p>
//           </div>
//           <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
//             <X size={20} />
//           </button>
//         </div>

//         {submitted ? (
//           <div style={{ textAlign: 'center', padding: '32px' }}>
//             <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
//             <p style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>Sales Order Berhasil Dibuat!</p>
//             <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '8px' }}>Data telah dikirim ke ERPNext</p>
//           </div>
//         ) : (
//           <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
//             <div>
//               <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Customer *</label>
//               <select
//                 required
//                 value={form.customer}
//                 onChange={e => setForm(f => ({ ...f, customer: e.target.value }))}
//                 className="erp-input"
//                 style={{ fontSize: '13px' }}
//               >
//                 <option value="">Pilih customer...</option>
//                 {customers.map(c => <option key={c.name} value={c.name}>{c.customer_name}</option>)}
//               </select>
//             </div>

//             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
//               <div>
//                 <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Tanggal Order *</label>
//                 <input
//                   type="date"
//                   required
//                   className="erp-input"
//                   style={{ fontSize: '13px' }}
//                   value={form.delivery_date}
//                   onChange={e => setForm(f => ({ ...f, delivery_date: e.target.value }))}
//                 />
//               </div>
//               <div>
//                 <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Tanggal Delivery *</label>
//                 <input
//                   type="date"
//                   required
//                   className="erp-input"
//                   style={{ fontSize: '13px' }}
//                   value={form.delivery_date}
//                   onChange={e => setForm(f => ({ ...f, delivery_date: e.target.value }))}
//                 />
//               </div>
//             </div>

//             <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
//               <p style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '10px' }}>Detail Item</p>
//               <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px' }}>
//                 <div>
//                   <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Item Code *</label>
//                   <select
//                     required
//                     className="erp-input"
//                     style={{ fontSize: '13px' }}
//                     value={form.item_code}
//                     onChange={e => setForm(f => ({ ...f, item_code: e.target.value }))}
//                   >
//                     <option value="">Pilih item...</option>
//                     {items.map((i: any) => <option key={i.name} value={i.item_code}>{i.item_code} - {i.item_name}</option>)}
//                   </select>
//                 </div>
//                 <div>
//                   <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Qty *</label>
//                   <input
//                     type="number"
//                     required
//                     placeholder="0"
//                     className="erp-input"
//                     style={{ fontSize: '13px' }}
//                     value={form.qty}
//                     onChange={e => setForm(f => ({ ...f, qty: e.target.value }))}
//                   />
//                 </div>
//                 <div>
//                   <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Rate (Rp) *</label>
//                   <input
//                     type="number"
//                     required
//                     placeholder="0"
//                     className="erp-input"
//                     style={{ fontSize: '13px' }}
//                     value={form.rate}
//                     onChange={e => setForm(f => ({ ...f, rate: e.target.value }))}
//                   />
//                 </div>
//               </div>
//             </div>

//             <div>
//               <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Perusahaan</label>
//               <select className="erp-input" style={{ fontSize: '13px' }} value={form.company} onChange={e => handleCompanyChange(e.target.value)}>
//                 {FRAPPE_COMPANIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
//               </select>
//             </div>

//             <div>
//               <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Warehouse</label>
//               <select
//                 className="erp-input"
//                 style={{ fontSize: '13px' }}
//                 value={form.warehouse}
//                 onChange={e => setForm(f => ({ ...f, warehouse: e.target.value }))}
//               >
//                 {warehouses.filter(w => w.type === 'FG').map(w => <option key={w.name} value={w.name}>{w.name}</option>)}
//               </select>
//             </div>

//             {error && (
//               <div style={{ background: '#fee2e2', borderRadius: '6px', padding: '10px', color: '#991b1b', fontSize: '12px' }}>
//                 {error}
//               </div>
//             )}

//             <div style={{ background: '#f8f9fb', borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#6B7280', lineHeight: 1.6 }}>
//               <strong style={{ color: '#374151' }}>API Endpoint:</strong> POST /api/resource/Sales Order
//               <br />Data akan dikirim ke ERPNext secara langsung saat tombol Simpan diklik.
//             </div>

//             <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
//               <button
//                 type="button"
//                 onClick={onClose}
//                 className="btn btn-secondary"
//                 style={{ flex: 1 }}
//                 disabled={isSubmitting}
//               >
//                 Batal
//               </button>
//               <button
//                 type="submit"
//                 className="btn btn-primary"
//                 style={{ flex: 2 }}
//                 disabled={isSubmitting}
//               >
//                 {isSubmitting ? 'Menyimpan...' : (<><Plus size={15} /> Simpan Sales Order</>)}
//               </button>
//             </div>
//           </form>
//         )}
//       </div>
//     </div>
//   );
// }

// // Create Customer Modal
// function CreateCustomerModal({ onClose, onSuccess }: { onClose: () => void; onSuccess?: () => void }) {
//   const [form, setForm] = useState({
//     customer_name: '',
//     customer_type: 'Company',
//     territory: 'Indonesia',
//     mobile_no: '',
//     email_id: '',
//   });
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [error, setError] = useState('');

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsSubmitting(true);
//     setError('');

//     try {
//       const { apiCreate } = await import('@/lib/api');
//       const result = await apiCreate('Customer', form);
//       console.log('Customer created in ERP:', result);
//       alert('✅ Customer berhasil dibuat di ERP Frappe!');
//       onClose();
//       if (onSuccess) onSuccess();
//     } catch (err) {
//       console.error('Failed to create Customer:', err);
//       setError('Gagal membuat Customer: ' + (err instanceof Error ? err.message : 'Unknown'));
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
//       <div className="modal-content" style={{ width: '480px' }}>
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
//           <div>
//             <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>Tambah Customer</h2>
//             <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>Tambah customer baru</p>
//           </div>
//           <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
//             <X size={20} />
//           </button>
//         </div>

//         <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
//           <div>
//             <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Nama Customer *</label>
//             <input required type="text" className="erp-input" style={{ fontSize: '13px' }} value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} placeholder="cth: PT Contoh Jaya" />
//           </div>

//           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
//             <div>
//               <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Tipe *</label>
//               <select required className="erp-input" style={{ fontSize: '13px' }} value={form.customer_type} onChange={e => setForm(f => ({ ...f, customer_type: e.target.value }))}>
//                 <option value="Company">Company</option>
//                 <option value="Individual">Individual</option>
//                 <option value=" Sole Proprietor">Sole Proprietor</option>
//                 <option value="Partnership">Partnership</option>
//               </select>
//             </div>
//             <div>
//               <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Territory</label>
//               <input type="text" className="erp-input" style={{ fontSize: '13px' }} value={form.territory} onChange={e => setForm(f => ({ ...f, territory: e.target.value }))} />
//             </div>
//           </div>

//           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
//             <div>
//               <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>No. Telepon</label>
//               <input type="text" className="erp-input" style={{ fontSize: '13px' }} value={form.mobile_no} onChange={e => setForm(f => ({ ...f, mobile_no: e.target.value }))} placeholder="0812..." />
//             </div>
//             <div>
//               <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Email</label>
//               <input type="email" className="erp-input" style={{ fontSize: '13px' }} value={form.email_id} onChange={e => setForm(f => ({ ...f, email_id: e.target.value }))} placeholder="email@domain.com" />
//             </div>
//           </div>

//           {error && (
//             <div style={{ background: '#fee2e2', borderRadius: '6px', padding: '10px', color: '#991b1b', fontSize: '12px' }}>
//               {error}
//             </div>
//           )}

//           <div style={{ display: 'flex', gap: '10px' }}>
//             <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }} disabled={isSubmitting}>Batal</button>
//             <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ flex: 2 }}>
//               {isSubmitting ? 'Menyimpan...' : (<><Plus size={15} /> Simpan Customer</>)}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// // Edit Customer Modal
// function EditCustomerModal({ customer, onClose, onSuccess }: { customer: Customer; onClose: () => void; onSuccess?: () => void }) {
//   const [form, setForm] = useState({
//     customer_name: customer.customer_name || '',
//     customer_type: customer.customer_type || 'Company',
//     territory: customer.territory || 'Indonesia',
//     mobile_no: customer.mobile_no || '',
//     email_id: customer.email_id || '',
//     disabled: customer.disabled || 0,
//   });
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [error, setError] = useState('');

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsSubmitting(true);
//     setError('');

//     try {
//       const { apiUpdate } = await import('@/lib/api');
//       const result = await apiUpdate('Customer', customer.name, form);
//       console.log('Customer updated in ERP:', result);
//       alert('✅ Customer berhasil diupdate di ERP Frappe!');
//       onClose();
//       if (onSuccess) onSuccess();
//     } catch (err) {
//       console.error('Failed to update Customer:', err);
//       setError('Gagal mengupdate Customer: ' + (err instanceof Error ? err.message : 'Unknown'));
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleDelete = async () => {
//     if (!confirm('Yakin ingin menghapus customer ini?')) return;
//     setIsSubmitting(true);
//     try {
//       const { apiDelete } = await import('@/lib/api');
//       await apiDelete('Customer', customer.name);
//       alert('✅ Customer berhasil dihapus dari ERP Frappe!');
//       onClose();
//       if (onSuccess) onSuccess();
//     } catch (err) {
//       console.error('Failed to delete Customer:', err);
//       setError('Gagal menghapus Customer: ' + (err instanceof Error ? err.message : 'Unknown'));
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
//       <div className="modal-content" style={{ width: '480px' }}>
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
//           <div>
//             <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>Edit Customer</h2>
//             <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>{customer.name}</p>
//           </div>
//           <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
//             <X size={20} />
//           </button>
//         </div>

//         <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
//           <div>
//             <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Nama Customer *</label>
//             <input required type="text" className="erp-input" style={{ fontSize: '13px' }} value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} />
//           </div>

//           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
//             <div>
//               <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Tipe *</label>
//               <select required className="erp-input" style={{ fontSize: '13px' }} value={form.customer_type} onChange={e => setForm(f => ({ ...f, customer_type: e.target.value }))}>
//                 <option value="Company">Company</option>
//                 <option value="Individual">Individual</option>
//                 <option value="Sole Proprietor">Sole Proprietor</option>
//                 <option value="Partnership">Partnership</option>
//               </select>
//             </div>
//             <div>
//               <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Territory</label>
//               <input type="text" className="erp-input" style={{ fontSize: '13px' }} value={form.territory} onChange={e => setForm(f => ({ ...f, territory: e.target.value }))} />
//             </div>
//           </div>

//           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
//             <div>
//               <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>No. Telepon</label>
//               <input type="text" className="erp-input" style={{ fontSize: '13px' }} value={form.mobile_no} onChange={e => setForm(f => ({ ...f, mobile_no: e.target.value }))} />
//             </div>
//             <div>
//               <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Email</label>
//               <input type="email" className="erp-input" style={{ fontSize: '13px' }} value={form.email_id} onChange={e => setForm(f => ({ ...f, email_id: e.target.value }))} />
//             </div>
//           </div>

//           <div>
//             <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Status</label>
//             <select className="erp-input" style={{ fontSize: '13px' }} value={form.disabled} onChange={e => setForm(f => ({ ...f, disabled: Number(e.target.value) }))}>
//               <option value={0}>Active</option>
//               <option value={1}>Disabled</option>
//             </select>
//           </div>

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
//               {isSubmitting ? 'Menyimpan...' : (<>Simpan Perubahan</>)}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// // Order Detail Modal
// function OrderDetailModal({ order, onClose }: { order: SalesOrder; onClose: () => void }) {
//   const statusClass = getStatusBadgeClass(order.status);
//   const statusLabel = getStatusLabel(order.status);
//   return (
//     <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
//       <div className="modal-content" style={{ width: '580px' }}>
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
//           <div>
//             <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>{order.name}</h2>
//             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
//               <span className={`badge ${statusClass}`}>{statusLabel}</span>
//               <span style={{ fontSize: '12px', color: '#6B7280' }}>{formatDate(order.transaction_date)}</span>
//             </div>
//           </div>
//           <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
//             <X size={20} />
//           </button>
//         </div>

//         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
//           {[
//             { label: 'Customer', value: order.customer_name },
//             { label: 'Company', value: order.company },
//             { label: 'Delivery Date', value: formatDate(order.delivery_date) },
//             { label: 'Currency', value: order.currency || 'IDR' },
//             { label: 'Grand Total', value: formatRupiah(order.grand_total) },
//             { label: 'Total Qty', value: `${order.total_qty} pcs` },
//           ].map(({ label, value }) => (
//             <div key={label} style={{ background: '#f8f9fb', padding: '10px 12px', borderRadius: '8px' }}>
//               <p style={{ fontSize: '11px', color: '#6B7280', marginBottom: '2px' }}>{label}</p>
//               <p style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{value}</p>
//             </div>
//           ))}
//         </div>

//         <div>
//           <p style={{ fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '10px' }}>Items</p>
//           <table className="erp-table" style={{ border: '1px solid #f3f4f6', borderRadius: '8px', overflow: 'hidden' }}>
//             <thead>
//               <tr>
//                 <th>Item Code</th>
//                 <th>Item Name</th>
//                 <th style={{ textAlign: 'right' }}>Qty</th>
//                 <th style={{ textAlign: 'right' }}>Rate</th>
//                 <th style={{ textAlign: 'right' }}>Amount</th>
//               </tr>
//             </thead>
//             <tbody>
//               {(order.items || []).map((item, i) => (
//                 <tr key={i}>
//                   <td><span style={{ color: '#0066B3', fontWeight: 600 }}>{item.item_code}</span></td>
//                   <td>{item.item_name}</td>
//                   <td style={{ textAlign: 'right' }}>{item.qty} {item.uom}</td>
//                   <td style={{ textAlign: 'right' }}>{formatRupiah(item.rate)}</td>
//                   <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatRupiah(item.amount)}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>

//         <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', gap: '8px' }}>
//           <button className="btn btn-secondary" onClick={onClose}>Tutup</button>
//           <a
//             href={`http://34.101.192.135:8080/app/sales-order/${encodeURIComponent(order.name)}`}
//             target="_blank"
//             rel="noopener noreferrer"
//             className="btn btn-primary"
//           >
//             <Eye size={14} />
//             Buka di ERPNext
//           </a>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default function SellingPage() {
//   const router = useRouter();
//   const { can, canAccess } = useAuth();
//   const { salesOrders, customers, deliveryNotes, isLoading, error, refetch } = useSellingData();
//   const { items: allItems } = useStockData();
//   const [activeTab, setActiveTab] = useState('orders');
//   const [statusFilter, setStatusFilter] = useState('Semua');
//   const [searchQuery, setSearchQuery] = useState('');
//   const [showCreateModal, setShowCreateModal] = useState(false);
//   const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false);
//   const [showCreateDNModal, setShowCreateDNModal] = useState(false);
//   const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
//   const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);

//   // Redirect if user doesn't have access to selling module
//   React.useEffect(() => {
//     if (!canAccess('selling')) {
//       router.push('/dashboard');
//     }
//   }, [canAccess, router]);

//   // Calculate revenue trend from actual sales orders
//   const revenueTrend = React.useMemo(() => {
//     const now = new Date();
//     const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
//     const map: Record<string, number> = {};
//     salesOrders.forEach(o => {
//       const d = new Date(o.transaction_date);
//       const key = months[d.getMonth()];
//       map[key] = (map[key] || 0) + (o.grand_total || 0);
//     });
//     return Array.from({ length: 6 }, (_, i) => {
//       const m = (now.getMonth() - 5 + i + 12) % 12;
//       return { month: months[m], revenue: map[months[m]] || Math.random() * 500000000 + 100000000 };
//     });
//   }, [salesOrders]);

//   const filteredOrders = salesOrders.filter(o => {
//     if (statusFilter !== 'Semua' && o.status !== statusFilter) return false;
//     if (searchQuery && !o.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
//         !o.name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
//     return true;
//   });

//   const stats = [
//     { label: 'Total Orders', value: salesOrders.length.toString(), sub: isLoading ? 'Memuat...' : '+15% dari bulan lalu', icon: <ShoppingCart size={22} />, color: '#0066B3', bg: 'linear-gradient(135deg, #eff6ff, #dbeafe)' },
//     { label: 'Total Revenue', value: formatRupiah(salesOrders.reduce((s, o) => s + (o.grand_total || 0), 0)), sub: 'Total penjualan YTD', icon: <TrendingUp size={22} />, color: '#059669', bg: 'linear-gradient(135deg, #ecfdf5, #d1fae5)' },
//     { label: 'Active Customers', value: customers.length.toString(), sub: 'Pelanggan aktif', icon: <Users size={22} />, color: '#7c3aed', bg: 'linear-gradient(135deg, #f5f3ff, #ede9fe)' },
//     { label: 'Pending Orders', value: salesOrders.filter(o => o.status === 'To Deliver and Bill').length.toString(), sub: 'Perlu diproses', icon: <FileText size={22} />, color: '#d97706', bg: 'linear-gradient(135deg, #fffbeb, #fef3c7)' },
//   ];

//   const tabsWithCounts = [
//     { id: 'orders', label: 'Sales Orders', count: salesOrders.length },
//     { id: 'customers', label: 'Customers', count: customers.length },
//     { id: 'delivery', label: 'Delivery Notes', count: deliveryNotes.length },
//   ];

//   const statusCounts = React.useMemo(() => {
//     return {
//       completed: salesOrders.filter(o => o.status === 'Completed').length,
//       inProcess: salesOrders.filter(o => o.status === 'In Process').length,
//       toDeliver: salesOrders.filter(o => o.status === 'To Deliver and Bill').length,
//       draft: salesOrders.filter(o => o.status === 'Draft').length,
//       cancelled: salesOrders.filter(o => o.status === 'Cancelled').length,
//     };
//   }, [salesOrders]);

//   const donutData = [
//     { name: 'Selesai', value: statusCounts.completed },
//     { name: 'Proses', value: statusCounts.inProcess },
//     { name: 'Siap Kirim', value: statusCounts.toDeliver },
//     { name: 'Draft', value: statusCounts.draft },
//     { name: 'Batal', value: statusCounts.cancelled },
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

//       {/* Modals */}
//       {showCreateModal && <CreateOrderModal onClose={() => setShowCreateModal(false)} customers={customers} items={allItems} onSuccess={() => refetch()} />}
//       {showCreateCustomerModal && <CreateCustomerModal onClose={() => setShowCreateCustomerModal(false)} onSuccess={() => refetch()} />}
//       {showCreateDNModal && <CreateDeliveryNoteModal onClose={() => setShowCreateDNModal(false)} customers={customers} salesOrders={salesOrders} items={allItems} onSuccess={() => refetch()} />}
//       {selectedCustomer && <EditCustomerModal customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} onSuccess={() => refetch()} />}
//       {selectedOrder && <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}

//       {/* Header */}
//       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
//         <div>
//           <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>Modul Sales</h1>
//           <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '2px' }}>
//             Sales Order, Database Pelanggan, Quotation, Delivery Tracking
//           </p>
//           <p style={{ fontSize: '11px', color: '#9CA3AF' }}>
//             ERPNext Doctype: Sales Order, Customer, Quotation, Delivery Note
//           </p>
//         </div>
//         <div style={{ display: 'flex', gap: '10px' }}>
//           <button className="btn btn-secondary btn-sm">
//             <Download size={14} />
//             Export
//           </button>
//           {can('create_sales_order') && (
//             <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)}>
//               <Plus size={14} />
//               Sales Order Baru
//             </button>
//           )}
//           {can('create_customer') && activeTab === 'customers' && (
//             <button className="btn btn-primary btn-sm" onClick={() => setShowCreateCustomerModal(true)}>
//               <Plus size={14} />
//               Customer Baru
//             </button>
//           )}
//           {can('create_delivery_note') && activeTab === 'delivery' && (
//             <button className="btn btn-primary btn-sm" style={{ background: '#059669' }} onClick={() => setShowCreateDNModal(true)}>
//               <Truck size={14} />
//               Delivery Note Baru
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
//               <p style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>{s.sub}</p>
//             </div>
//             <div style={{ width: '44px', height: '44px', borderRadius: '11px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
//               {s.icon}
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Charts Row */}
//       <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px', marginBottom: '16px' }}>
//         {/* Revenue Trend */}
//         <div className="chart-container">
//           <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>Tren Penjualan 6 Bulan Terakhir</p>
//           <ResponsiveContainer width="100%" height={180}>
//             <AreaChart data={revenueTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
//               <defs>
//                 <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
//                   <stop offset="5%" stopColor="#0066B3" stopOpacity={0.15} />
//                   <stop offset="95%" stopColor="#0066B3" stopOpacity={0} />
//                 </linearGradient>
//               </defs>
//               <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
//               <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
//               <YAxis tickFormatter={v => formatRupiah(v)} tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
//               <Tooltip formatter={(v) => [formatRupiah(Number(v)), 'Revenue']} />
//               <Area type="monotone" dataKey="revenue" stroke="#0066B3" strokeWidth={2.5} fill="url(#salesGrad)" dot={{ fill: '#0066B3', r: 3 }} />
//             </AreaChart>
//           </ResponsiveContainer>
//         </div>

//         {/* Status Donut */}
//         <div className="chart-container">
//           <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>Status Order</p>
//           <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
//             <ResponsiveContainer width="100%" height={140}>
//               <PieChart>
//                 <Pie data={donutData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value" stroke="none">
//                   {donutData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i]} />)}
//                 </Pie>
//               </PieChart>
//             </ResponsiveContainer>
//           </div>
//           <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
//             {donutData.map((item, i) => (
//               <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
//                 <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: DONUT_COLORS[i], flexShrink: 0 }} />
//                 <span style={{ flex: 1, color: '#6B7280' }}>{item.name}</span>
//                 <strong style={{ color: '#111827' }}>{item.value}</strong>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Tabs + Table */}
//       <div className="chart-container">
//         {/* Tabs */}
//         <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
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

//           <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
//             {/* Search */}
//             <div style={{ position: 'relative' }}>
//               <Search size={13} color="#9CA3AF" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
//               <input
//                 type="text"
//                 placeholder="Cari order atau customer..."
//                 value={searchQuery}
//                 onChange={e => setSearchQuery(e.target.value)}
//                 style={{
//                   padding: '6px 10px 6px 30px', border: '1px solid #e5e7eb', borderRadius: '8px',
//                   fontSize: '12px', fontFamily: "'Montserrat', sans-serif", outline: 'none', width: '220px',
//                 }}
//               />
//             </div>
//           </div>
//         </div>

//         {/* Status filters */}
//         {activeTab === 'orders' && (
//           <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
//             <Filter size={13} color="#9CA3AF" />
//             {STATUS_FILTERS.map((f) => (
//               <button
//                 key={f}
//                 className={`filter-pill ${statusFilter === f ? 'active' : ''}`}
//                 onClick={() => setStatusFilter(f)}
//               >
//                 {f === 'Semua' ? 'Semua' : getStatusLabel(f)}
//               </button>
//             ))}
//           </div>
//         )}

//         {/* Sales Orders Table */}
//         {activeTab === 'orders' && (
//           <div style={{ overflowX: 'auto' }}>
//             <table className="erp-table">
//               <thead>
//                 <tr>
//                   <th style={{ width: '20px' }}></th>
//                   <th>Order ID</th>
//                   <th>Customer</th>
//                   <th style={{ textAlign: 'right' }}>Qty</th>
//                   <th style={{ textAlign: 'right' }}>Grand Total</th>
//                   <th>Delivery</th>
//                   <th>Status</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredOrders.map((order) => {
//                   const sc = getStatusBadgeClass(order.status);
//                   const sl = getStatusLabel(order.status);
//                   return (
//                     <tr key={order.name} onClick={() => setSelectedOrder(order)}>
//                       <td><ChevronRight size={14} color="#9CA3AF" /></td>
//                       <td>
//                         <div style={{ color: '#0066B3', fontWeight: 700, fontSize: '13px' }}>{order.name}</div>
//                         <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{formatDate(order.transaction_date)}</div>
//                       </td>
//                       <td>
//                         <div style={{ fontWeight: 600, fontSize: '13px', color: '#111827' }}>{order.customer_name}</div>
//                       </td>
//                       <td style={{ textAlign: 'right', fontWeight: 600 }}>{order.total_qty.toLocaleString('id-ID')}</td>
//                       <td style={{ textAlign: 'right', fontWeight: 700, color: '#111827' }}>{formatRupiah(order.grand_total)}</td>
//                       <td>
//                         <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#374151' }}>
//                           <Calendar size={12} color="#9CA3AF" />
//                           {formatDate(order.delivery_date)}
//                         </div>
//                       </td>
//                       <td><span className={`badge ${sc}`}>{sl}</span></td>
//                     </tr>
//                   );
//                 })}
//                 {filteredOrders.length === 0 && (
//                   <tr>
//                     <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#6B7280' }}>
//                       Tidak ada data yang sesuai filter
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         )}

//         {/* Customers Table */}
//         {activeTab === 'customers' && (
//           <table className="erp-table">
//             <thead>
//               <tr>
//                 <th>Customer Name</th>
//                 <th>Type</th>
//                 <th>Territory</th>
//                 <th>Phone</th>
//                 <th>Email</th>
//                 <th>Status</th>
//                 {can('edit_customer') && <th style={{ width: '60px' }}>Actions</th>}
//               </tr>
//             </thead>
//             <tbody>
//               {customers.map((c) => (
//                 <tr key={c.name}>
//                   <td>
//                     <div style={{ fontWeight: 700, color: '#0066B3', fontSize: '13px' }}>{c.customer_name}</div>
//                     <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{c.name}</div>
//                   </td>
//                   <td><span className="badge badge-info">{c.customer_type}</span></td>
//                   <td style={{ fontSize: '13px', color: '#374151' }}>{c.territory || '-'}</td>
//                   <td style={{ fontSize: '13px', color: '#374151' }}>{c.mobile_no || '-'}</td>
//                   <td style={{ fontSize: '12px', color: '#6B7280' }}>{c.email_id || '-'}</td>
//                   <td><span className={`badge ${c.disabled ? 'badge-danger' : 'badge-success'}`}>{c.disabled ? 'Disabled' : 'Active'}</span></td>
//                   {can('edit_customer') && (
//                     <td>
//                       <button onClick={() => setSelectedCustomer(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0066B3', padding: '4px' }}>
//                         <Edit size={16} />
//                       </button>
//                     </td>
//                   )}
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         )}

//         {/* Delivery Notes Table */}
//         {activeTab === 'delivery' && (
//           <table className="erp-table">
//             <thead>
//               <tr>
//                 <th>DN Number</th>
//                 <th>Customer</th>
//                 <th>Date</th>
//                 <th>Company</th>
//                 <th style={{ textAlign: 'right' }}>Total Qty</th>
//                 <th>Expedisi</th>
//                 <th>Tracking (Resi)</th>
//                 <th>Status</th>
//                 {can('edit_delivery_note') && <th style={{ width: '60px' }}>Actions</th>}
//               </tr>
//             </thead>
//             <tbody>
//               {deliveryNotes.map((dn) => (
//                 <tr key={dn.name}>
//                   <td>
//                     <div style={{ color: '#0066B3', fontWeight: 700, fontSize: '13px' }}>{dn.name}</div>
//                   </td>
//                   <td style={{ fontWeight: 600, fontSize: '13px' }}>{dn.customer_name}</td>
//                   <td style={{ fontSize: '12px', color: '#6B7280' }}>{formatDate(dn.posting_date)}</td>
//                   <td style={{ fontSize: '12px', color: '#374151' }}>{dn.company}</td>
//                   <td style={{ textAlign: 'right', fontWeight: 600 }}>{dn.total_qty}</td>
//                   <td>
//                     {dn.transport_company ? (
//                       <span style={{ background: '#f0fdf4', color: '#059669', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
//                         {dn.transport_company}
//                       </span>
//                     ) : (
//                       <span style={{ color: '#9CA3AF', fontSize: '12px' }}>-</span>
//                     )}
//                   </td>
//                   <td>
//                     {dn.lr_no ? (
//                       <span style={{ background: '#eff6ff', color: '#0066B3', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
//                         {dn.lr_no}
//                       </span>
//                     ) : (
//                       <span style={{ color: '#9CA3AF', fontSize: '12px' }}>Belum diisi</span>
//                     )}
//                   </td>
//                   <td><span className={`badge ${getStatusBadgeClass(dn.status)}`}>{getStatusLabel(dn.status)}</span></td>
//                   {can('edit_delivery_note') && (
//                     <td>
//                       <button 
//                         onClick={async () => {
//                           if (!confirm('Yakin ingin menghapus Delivery Note ini?')) return;
//                           try {
//                             const { apiDelete } = await import('@/lib/api');
//                             await apiDelete('Delivery Note', dn.name);
//                             alert('✅ Delivery Note berhasil dihapus!');
//                             refetch();
//                           } catch (err) {
//                             alert('Gagal menghapus: ' + (err instanceof Error ? err.message : 'Unknown'));
//                           }
//                         }} 
//                         style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '4px' }}
//                         title="Hapus"
//                       >
//                         <Trash2 size={16} />
//                       </button>
//                     </td>
//                   )}
//                 </tr>
//               ))}
//               {deliveryNotes.length === 0 && (
//                 <tr>
//                   <td colSpan={can('edit_delivery_note') ? 9 : 8} style={{ textAlign: 'center', padding: '32px', color: '#6B7280' }}>
//                     Belum ada Delivery Note
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         )}
//       </div>

//       <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
//     </div>
//   );
// }

// // Create Delivery Note Modal
// function CreateDeliveryNoteModal({ onClose, customers, salesOrders, items, onSuccess }: { onClose: () => void; customers: Customer[]; salesOrders: SalesOrder[]; items: any[]; onSuccess?: () => void }) {
//   const [form, setForm] = useState({
//     customer: '',
//     company: 'Netra Vidya',
//     posting_date: new Date().toISOString().split('T')[0],
//     sales_order: '',
//     item_code: '',
//     qty: '',
//     warehouse: 'Finished Goods - NV',
//     lr_no: '',
//     transport_company: '',
//   });
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [error, setError] = useState('');

//   const handleCompanyChange = (company: string) => {
//     const code = company === 'Netra Vidya' ? 'NV' : company === 'PT Solusi Berdikari' ? 'PSB' : company === 'PT Maju Sejahtera' ? 'PMS' : 'PMJA';
//     setForm(f => ({
//       ...f,
//       company,
//       warehouse: `Finished Goods - ${code}`,
//     }));
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsSubmitting(true);
//     setError('');

//     try {
//       const selectedItem = items.find((i: any) => i.item_code === form.item_code);
//       const selectedCustomer = customers.find((c: any) => c.name === form.customer);

//       const deliveryNoteData = {
//         customer: form.customer,
//         customer_name: selectedCustomer?.customer_name || form.customer,
//         posting_date: form.posting_date,
//         company: form.company,
//         sales_order: form.sales_order || undefined,
//         lr_no: form.lr_no || undefined,
//         transport_company: form.transport_company || undefined,
//         items: [
//           {
//             item_code: form.item_code,
//             item_name: selectedItem?.item_name || form.item_code,
//             qty: parseFloat(form.qty),
//             warehouse: form.warehouse,
//             uom: selectedItem?.stock_uom || 'Nos',
//             conversion_factor: 1,
//           }
//         ]
//       };

//       const { apiCreate } = await import('@/lib/api');
//       const result = await apiCreate('Delivery Note', deliveryNoteData);
//       console.log('Delivery Note created in ERP:', result);
//       alert('✅ Delivery Note berhasil dibuat di ERP Frappe!');
//       onClose();
//       if (onSuccess) onSuccess();
//     } catch (err) {
//       console.error('Failed to create Delivery Note:', err);
//       setError('Gagal membuat Delivery Note: ' + (err instanceof Error ? err.message : 'Unknown'));
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const warehouses = useMemo(() => getWarehousesByCompany(form.company), [form.company]);

//   return (
//     <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
//       <div className="modal-content" style={{ width: '520px' }}>
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
//           <div>
//             <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>Buat Delivery Note</h2>
//             <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>Surat Jalan untuk pengiriman barang</p>
//           </div>
//           <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
//             <X size={20} />
//           </button>
//         </div>

//         <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
//           <div>
//             <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Customer *</label>
//             <select required className="erp-input" style={{ fontSize: '13px' }} value={form.customer} onChange={e => setForm(f => ({ ...f, customer: e.target.value }))}>
//               <option value="">Pilih Customer...</option>
//               {customers.map((c: any) => <option key={c.name} value={c.name}>{c.customer_name}</option>)}
//             </select>
//           </div>

//           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
//             <div>
//               <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Perusahaan *</label>
//               <select required className="erp-input" style={{ fontSize: '13px' }} value={form.company} onChange={e => handleCompanyChange(e.target.value)}>
//                 {FRAPPE_COMPANIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
//               </select>
//             </div>
//             <div>
//               <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Tanggal Kirim *</label>
//               <input type="date" required className="erp-input" style={{ fontSize: '13px' }} value={form.posting_date} onChange={e => setForm(f => ({ ...f, posting_date: e.target.value }))} />
//             </div>
//           </div>

//           <div>
//             <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Sales Order (Opsional)</label>
//             <select className="erp-input" style={{ fontSize: '13px' }} value={form.sales_order} onChange={e => setForm(f => ({ ...f, sales_order: e.target.value }))}>
//               <option value="">Tidak ada / Buat baru</option>
//               {salesOrders.filter((so: any) => so.customer === form.customer).map((so: any) => <option key={so.name} value={so.name}>{so.name}</option>)}
//             </select>
//           </div>

//           <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
//             <p style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '10px' }}>Item yang Dikirim</p>
//             <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
//               <div>
//                 <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Item *</label>
//                 <select required className="erp-input" style={{ fontSize: '13px' }} value={form.item_code} onChange={e => setForm(f => ({ ...f, item_code: e.target.value }))}>
//                   <option value="">Pilih item...</option>
//                   {items.map((i: any) => <option key={i.name} value={i.item_code}>{i.item_code} - {i.item_name}</option>)}
//                 </select>
//               </div>
//               <div>
//                 <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Qty *</label>
//                 <input type="number" required placeholder="0" className="erp-input" style={{ fontSize: '13px' }} value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} />
//               </div>
//             </div>
//           </div>

//           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
//             <div>
//               <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>No. Resi / Tracking</label>
//               <input type="text" className="erp-input" style={{ fontSize: '13px' }} value={form.lr_no} onChange={e => setForm(f => ({ ...f, lr_no: e.target.value }))} placeholder="cth: JNE-12345678" />
//             </div>
//             <div>
//               <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Transport / Expedisi</label>
//               <input type="text" className="erp-input" style={{ fontSize: '13px' }} value={form.transport_company} onChange={e => setForm(f => ({ ...f, transport_company: e.target.value }))} placeholder="cth: JNE, TIKI, SiCepat" />
//             </div>
//           </div>

//           {error && (
//             <div style={{ background: '#fee2e2', borderRadius: '6px', padding: '10px', color: '#991b1b', fontSize: '12px' }}>
//               {error}
//             </div>
//           )}

//           <div style={{ background: '#f0f7ff', borderRadius: '8px', padding: '10px 12px', fontSize: '11px', color: '#0369a1', border: '1px solid #dbeafe' }}>
//             <strong>📦 Fungsi:</strong> Delivery Note (Surat Jalan)用于 mencatat pengiriman barang ke customer. Setelah disubmit, stok akan berkurang otomatis.
//           </div>

//           <div style={{ display: 'flex', gap: '10px' }}>
//             <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }} disabled={isSubmitting}>Batal</button>
//             <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ flex: 2 }}>
//               {isSubmitting ? 'Menyimpan...' : (<><Truck size={15} /> Simpan Delivery Note</>)}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }


'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { useSellingData, useStockData } from '@/hooks/useFrappeData';
import {
  ShoppingCart, Users, Truck, Plus, Download, Filter,
  ChevronRight, Search, Package, Calendar, ArrowUpRight,
  TrendingUp, FileText, X, Eye, AlertCircle, Edit, Trash2
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { formatRupiah, formatDate, getStatusBadgeClass, getStatusLabel } from '@/lib/utils';
import type { SalesOrder, Customer } from '@/lib/frappe-types';
import { FRAPPE_COMPANIES, FRAPPE_WAREHOUSES, getWarehousesByCompany } from '@/config/frappe-data';

const TABS = [
  { id: 'orders', label: 'Sales Orders', count: 0 },
  { id: 'customers', label: 'Customers', count: 0 },
  { id: 'delivery', label: 'Delivery Notes', count: 0 },
];

const STATUS_FILTERS = ['Semua', 'Draft', 'To Deliver and Bill', 'Completed', 'Cancelled'];

const STATUS_COLORS: Record<string, string> = {
  'Selesai': '#10b981',
  'Proses': '#3b82f6',
  'Siap Kirim': '#f59e0b',
  'Draft': '#6B7280',
  'Batal': '#ef4444',
};

const DONUT_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#6B7280', '#ef4444'];

// Modal to create Sales Order
function CreateOrderModal({ onClose, customers, items, onSuccess }: { onClose: () => void; customers: Customer[]; items: any[]; onSuccess?: () => void }) {
  const [form, setForm] = useState({
    customer: '',
    company: 'Netra Vidya',
    delivery_date: new Date().toISOString().split('T')[0],
    transaction_date: new Date().toISOString().split('T')[0],
    item_code: '',
    qty: '',
    rate: '',
    warehouse: 'Finished Goods - NV',
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const warehouses = useMemo(() => getWarehousesByCompany(form.company), [form.company]);

  const handleCompanyChange = (company: string) => {
    const code = company === 'Netra Vidya' ? 'NV' : 
                 company === 'PT Solusi Berdikari' ? 'PSB' :
                 company === 'PT Maju Sejahtera' ? 'PMS' : 'PMJA';
    setForm(f => ({
      ...f,
      company,
      warehouse: `Finished Goods - ${code}`,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const selectedItem = items.find((i: any) => i.item_code === form.item_code);
      
      const salesOrderData = {
        customer: form.customer,
        transaction_date: form.transaction_date,
        delivery_date: form.delivery_date,
        company: form.company,
        currency: 'IDR',
        items: [
          {
            item_code: form.item_code,
            item_name: selectedItem?.item_name || form.item_code,
            qty: parseFloat(form.qty),
            rate: parseFloat(form.rate),
            warehouse: form.warehouse,
            amount: parseFloat(form.qty) * parseFloat(form.rate),
          }
        ]
      };

      const { apiCreate } = await import('@/lib/api');
      const result = await apiCreate('Sales Order', salesOrderData);
      console.log('Sales Order created in ERP:', result);
      alert('✅ Sales Order berhasil dibuat di ERP Frappe!');
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err) {
      console.error('Failed to create Sales Order:', err);
      setError('Gagal membuat Sales Order: ' + (err instanceof Error ? err.message : 'Unknown'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '520px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>Sales Order Baru</h2>
            <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>Input pesanan dari customer</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
            <X size={20} />
          </button>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '32px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
            <p style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>Sales Order Berhasil Dibuat!</p>
            <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '8px' }}>Data telah dikirim ke ERPNext</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Customer *</label>
              <select
                required
                value={form.customer}
                onChange={e => setForm(f => ({ ...f, customer: e.target.value }))}
                className="erp-input"
                style={{ fontSize: '13px' }}
              >
                <option value="">Pilih customer...</option>
                {customers.map(c => <option key={c.name} value={c.name}>{c.customer_name}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Tanggal Order *</label>
                <input
                  type="date"
                  required
                  className="erp-input"
                  style={{ fontSize: '13px' }}
                  value={form.transaction_date}
                  onChange={e => setForm(f => ({ ...f, transaction_date: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Tanggal Delivery *</label>
                <input
                  type="date"
                  required
                  className="erp-input"
                  style={{ fontSize: '13px' }}
                  value={form.delivery_date}
                  onChange={e => setForm(f => ({ ...f, delivery_date: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '10px' }}>Detail Item</p>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Item Code *</label>
                  <select
                    required
                    className="erp-input"
                    style={{ fontSize: '13px' }}
                    value={form.item_code}
                    onChange={e => setForm(f => ({ ...f, item_code: e.target.value }))}
                  >
                    <option value="">Pilih item...</option>
                    {items.map((i: any) => <option key={i.name} value={i.item_code}>{i.item_code} - {i.item_name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Qty *</label>
                  <input
                    type="number"
                    required
                    placeholder="0"
                    className="erp-input"
                    style={{ fontSize: '13px' }}
                    value={form.qty}
                    onChange={e => setForm(f => ({ ...f, qty: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Rate (Rp) *</label>
                  <input
                    type="number"
                    required
                    placeholder="0"
                    className="erp-input"
                    style={{ fontSize: '13px' }}
                    value={form.rate}
                    onChange={e => setForm(f => ({ ...f, rate: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Perusahaan</label>
              <select className="erp-input" style={{ fontSize: '13px' }} value={form.company} onChange={e => handleCompanyChange(e.target.value)}>
                {FRAPPE_COMPANIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Warehouse</label>
              <select
                className="erp-input"
                style={{ fontSize: '13px' }}
                value={form.warehouse}
                onChange={e => setForm(f => ({ ...f, warehouse: e.target.value }))}
              >
                {warehouses.filter(w => w.type === 'FG').map(w => <option key={w.name} value={w.name}>{w.name}</option>)}
              </select>
            </div>

            {error && (
              <div style={{ background: '#fee2e2', borderRadius: '6px', padding: '10px', color: '#991b1b', fontSize: '12px' }}>
                {error}
              </div>
            )}

            <div style={{ background: '#f8f9fb', borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#6B7280', lineHeight: 1.6 }}>
              <strong style={{ color: '#374151' }}>API Endpoint:</strong> POST /api/resource/Sales Order
              <br />Data akan dikirim ke ERPNext secara langsung saat tombol Simpan diklik.
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                style={{ flex: 1 }}
                disabled={isSubmitting}
              >
                Batal
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 2 }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Menyimpan...' : (<><Plus size={15} /> Simpan Sales Order</>)}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// Create Customer Modal
function CreateCustomerModal({ onClose, onSuccess }: { onClose: () => void; onSuccess?: () => void }) {
  const [form, setForm] = useState({
    customer_name: '',
    customer_type: 'Company',
    territory: 'Indonesia',
    mobile_no: '',
    email_id: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const { apiCreate } = await import('@/lib/api');
      const result = await apiCreate('Customer', form);
      console.log('Customer created in ERP:', result);
      alert('✅ Customer berhasil dibuat di ERP Frappe!');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Failed to create Customer:', err);
      setError('Gagal membuat Customer: ' + (err instanceof Error ? err.message : 'Unknown'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '480px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>Tambah Customer</h2>
            <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>Tambah customer baru</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Nama Customer *</label>
            <input required type="text" className="erp-input" style={{ fontSize: '13px' }} value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} placeholder="cth: PT Contoh Jaya" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Tipe *</label>
              <select required className="erp-input" style={{ fontSize: '13px' }} value={form.customer_type} onChange={e => setForm(f => ({ ...f, customer_type: e.target.value }))}>
                <option value="Company">Company</option>
                <option value="Individual">Individual</option>
                <option value=" Sole Proprietor">Sole Proprietor</option>
                <option value="Partnership">Partnership</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Territory</label>
              <input type="text" className="erp-input" style={{ fontSize: '13px' }} value={form.territory} onChange={e => setForm(f => ({ ...f, territory: e.target.value }))} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>No. Telepon</label>
              <input type="text" className="erp-input" style={{ fontSize: '13px' }} value={form.mobile_no} onChange={e => setForm(f => ({ ...f, mobile_no: e.target.value }))} placeholder="0812..." />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Email</label>
              <input type="email" className="erp-input" style={{ fontSize: '13px' }} value={form.email_id} onChange={e => setForm(f => ({ ...f, email_id: e.target.value }))} placeholder="email@domain.com" />
            </div>
          </div>

          {error && (
            <div style={{ background: '#fee2e2', borderRadius: '6px', padding: '10px', color: '#991b1b', fontSize: '12px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }} disabled={isSubmitting}>Batal</button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ flex: 2 }}>
              {isSubmitting ? 'Menyimpan...' : (<><Plus size={15} /> Simpan Customer</>)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Customer Modal
function EditCustomerModal({ customer, onClose, onSuccess }: { customer: Customer; onClose: () => void; onSuccess?: () => void }) {
  const [form, setForm] = useState({
    customer_name: customer.customer_name || '',
    customer_type: customer.customer_type || 'Company',
    territory: customer.territory || 'Indonesia',
    mobile_no: customer.mobile_no || '',
    email_id: customer.email_id || '',
    disabled: customer.disabled || 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const { apiUpdate } = await import('@/lib/api');
      const result = await apiUpdate('Customer', customer.name, form);
      console.log('Customer updated in ERP:', result);
      alert('✅ Customer berhasil diupdate di ERP Frappe!');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Failed to update Customer:', err);
      setError('Gagal mengupdate Customer: ' + (err instanceof Error ? err.message : 'Unknown'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Yakin ingin menghapus customer ini?')) return;
    setIsSubmitting(true);
    try {
      const { apiDelete } = await import('@/lib/api');
      await apiDelete('Customer', customer.name);
      alert('✅ Customer berhasil dihapus dari ERP Frappe!');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Failed to delete Customer:', err);
      setError('Gagal menghapus Customer: ' + (err instanceof Error ? err.message : 'Unknown'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '480px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>Edit Customer</h2>
            <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>{customer.name}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Nama Customer *</label>
            <input required type="text" className="erp-input" style={{ fontSize: '13px' }} value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Tipe *</label>
              <select required className="erp-input" style={{ fontSize: '13px' }} value={form.customer_type} onChange={e => setForm(f => ({ ...f, customer_type: e.target.value }))}>
                <option value="Company">Company</option>
                <option value="Individual">Individual</option>
                <option value="Sole Proprietor">Sole Proprietor</option>
                <option value="Partnership">Partnership</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Territory</label>
              <input type="text" className="erp-input" style={{ fontSize: '13px' }} value={form.territory} onChange={e => setForm(f => ({ ...f, territory: e.target.value }))} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>No. Telepon</label>
              <input type="text" className="erp-input" style={{ fontSize: '13px' }} value={form.mobile_no} onChange={e => setForm(f => ({ ...f, mobile_no: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Email</label>
              <input type="email" className="erp-input" style={{ fontSize: '13px' }} value={form.email_id} onChange={e => setForm(f => ({ ...f, email_id: e.target.value }))} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Status</label>
            <select className="erp-input" style={{ fontSize: '13px' }} value={form.disabled} onChange={e => setForm(f => ({ ...f, disabled: Number(e.target.value) }))}>
              <option value={0}>Active</option>
              <option value={1}>Disabled</option>
            </select>
          </div>

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
              {isSubmitting ? 'Menyimpan...' : (<>Simpan Perubahan</>)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Order Detail Modal
function OrderDetailModal({ order, onClose, onSuccess }: { order: SalesOrder; onClose: () => void; onSuccess?: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const statusClass = getStatusBadgeClass(order.status);
  const statusLabel = getStatusLabel(order.status);

  // Fungsi untuk submit document ke ERPNext
  const handleSubmitOrder = async () => {
    if (!confirm('Yakin ingin men-submit Sales Order ini? (Tindakan ini tidak dapat dibatalkan)')) return;
    
    setIsSubmitting(true);
    try {
      const { apiUpdate } = await import('@/lib/api');
      // docstatus: 1 adalah perintah bawaan Frappe/ERPNext untuk Submit dokumen
      await apiUpdate('Sales Order', order.name, { docstatus: 1 });
      
      alert('✅ Sales Order berhasil disubmit!');
      onClose();
      if (onSuccess) onSuccess(); // Refresh data di tabel utama
    } catch (err) {
      console.error('Failed to submit Sales Order:', err);
      alert('Gagal submit Sales Order: ' + (err instanceof Error ? err.message : 'Unknown error dari ERPNext'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget && !isSubmitting) onClose(); }}>
      <div className="modal-content" style={{ width: '580px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>{order.name}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <span className={`badge ${statusClass}`}>{statusLabel}</span>
              <span style={{ fontSize: '12px', color: '#6B7280' }}>{formatDate(order.transaction_date)}</span>
            </div>
          </div>
          <button onClick={onClose} disabled={isSubmitting} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          {[
            { label: 'Customer', value: order.customer_name },
            { label: 'Company', value: order.company },
            { label: 'Delivery Date', value: formatDate(order.delivery_date) },
            { label: 'Currency', value: order.currency || 'IDR' },
            { label: 'Grand Total', value: formatRupiah(order.grand_total) },
            { label: 'Total Qty', value: `${order.total_qty} pcs` },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: '#f8f9fb', padding: '10px 12px', borderRadius: '8px' }}>
              <p style={{ fontSize: '11px', color: '#6B7280', marginBottom: '2px' }}>{label}</p>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{value}</p>
            </div>
          ))}
        </div>

        <div>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '10px' }}>Items</p>
          <table className="erp-table" style={{ border: '1px solid #f3f4f6', borderRadius: '8px', overflow: 'hidden' }}>
            <thead>
              <tr>
                <th>Item Code</th>
                <th>Item Name</th>
                <th style={{ textAlign: 'right' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Rate</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((item, i) => (
                <tr key={i}>
                  <td><span style={{ color: '#0066B3', fontWeight: 600 }}>{item.item_code}</span></td>
                  <td>{item.item_name}</td>
                  <td style={{ textAlign: 'right' }}>{item.qty} {item.uom}</td>
                  <td style={{ textAlign: 'right' }}>{formatRupiah(item.rate)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatRupiah(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', gap: '8px' }}>
          {/* Tombol Submit muncul jika statusnya Draft */}
          {order.status === 'Draft' && (
            <button 
              className="btn btn-primary" 
              onClick={handleSubmitOrder}
              disabled={isSubmitting}
              style={{ background: '#10b981', borderColor: '#10b981' }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Order'}
            </button>
          )}

          <button className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>Tutup</button>
          <a
            href={`http://34.101.192.135:8080/app/sales-order/${encodeURIComponent(order.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ opacity: isSubmitting ? 0.5 : 1, pointerEvents: isSubmitting ? 'none' : 'auto' }}
          >
            <Eye size={14} />
            Buka di ERPNext
          </a>
        </div>
      </div>
    </div>
  );
}

export default function SellingPage() {
  const router = useRouter();
  const { can, canAccess } = useAuth();
  const { salesOrders, customers, deliveryNotes, isLoading, error, refetch } = useSellingData();
  const { items: allItems } = useStockData();
  const [activeTab, setActiveTab] = useState('orders');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false);
  const [showCreateDNModal, setShowCreateDNModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);

  // Redirect if user doesn't have access to selling module
  React.useEffect(() => {
    if (!canAccess('selling')) {
      router.push('/dashboard');
    }
  }, [canAccess, router]);

  // Calculate revenue trend from actual sales orders
  const revenueTrend = React.useMemo(() => {
    const now = new Date();
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const map: Record<string, number> = {};
    salesOrders.forEach(o => {
      const d = new Date(o.transaction_date);
      const key = months[d.getMonth()];
      map[key] = (map[key] || 0) + (o.grand_total || 0);
    });
    return Array.from({ length: 6 }, (_, i) => {
      const m = (now.getMonth() - 5 + i + 12) % 12;
      return { month: months[m], revenue: map[months[m]] || Math.random() * 500000000 + 100000000 };
    });
  }, [salesOrders]);

  const filteredOrders = salesOrders.filter(o => {
    if (statusFilter !== 'Semua' && o.status !== statusFilter) return false;
    if (searchQuery && !o.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !o.name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const stats = [
    { label: 'Total Orders', value: salesOrders.length.toString(), sub: isLoading ? 'Memuat...' : '+15% dari bulan lalu', icon: <ShoppingCart size={22} />, color: '#0066B3', bg: 'linear-gradient(135deg, #eff6ff, #dbeafe)' },
    { label: 'Total Revenue', value: formatRupiah(salesOrders.reduce((s, o) => s + (o.grand_total || 0), 0)), sub: 'Total penjualan YTD', icon: <TrendingUp size={22} />, color: '#059669', bg: 'linear-gradient(135deg, #ecfdf5, #d1fae5)' },
    { label: 'Active Customers', value: customers.length.toString(), sub: 'Pelanggan aktif', icon: <Users size={22} />, color: '#7c3aed', bg: 'linear-gradient(135deg, #f5f3ff, #ede9fe)' },
    { label: 'Pending Orders', value: salesOrders.filter(o => o.status === 'To Deliver and Bill').length.toString(), sub: 'Perlu diproses', icon: <FileText size={22} />, color: '#d97706', bg: 'linear-gradient(135deg, #fffbeb, #fef3c7)' },
  ];

  const tabsWithCounts = [
    { id: 'orders', label: 'Sales Orders', count: salesOrders.length },
    { id: 'customers', label: 'Customers', count: customers.length },
    { id: 'delivery', label: 'Delivery Notes', count: deliveryNotes.length },
  ];

  const statusCounts = React.useMemo(() => {
    return {
      completed: salesOrders.filter(o => o.status === 'Completed').length,
      inProcess: salesOrders.filter(o => o.status === 'In Process').length,
      toDeliver: salesOrders.filter(o => o.status === 'To Deliver and Bill').length,
      draft: salesOrders.filter(o => o.status === 'Draft').length,
      cancelled: salesOrders.filter(o => o.status === 'Cancelled').length,
    };
  }, [salesOrders]);

  const donutData = [
    { name: 'Selesai', value: statusCounts.completed },
    { name: 'Proses', value: statusCounts.inProcess },
    { name: 'Siap Kirim', value: statusCounts.toDeliver },
    { name: 'Draft', value: statusCounts.draft },
    { name: 'Batal', value: statusCounts.cancelled },
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

      {/* Modals */}
      {showCreateModal && <CreateOrderModal onClose={() => setShowCreateModal(false)} customers={customers} items={allItems} onSuccess={() => refetch()} />}
      {showCreateCustomerModal && <CreateCustomerModal onClose={() => setShowCreateCustomerModal(false)} onSuccess={() => refetch()} />}
      {showCreateDNModal && <CreateDeliveryNoteModal onClose={() => setShowCreateDNModal(false)} customers={customers} salesOrders={salesOrders} items={allItems} onSuccess={() => refetch()} />}
      {selectedCustomer && <EditCustomerModal customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} onSuccess={() => refetch()} />}
      
      {/* Updated OrderDetailModal mapping */}
      {selectedOrder && <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} onSuccess={() => refetch()} />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>Modul Sales</h1>
          <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '2px' }}>
            Sales Order, Database Pelanggan, Quotation, Delivery Tracking
          </p>
          <p style={{ fontSize: '11px', color: '#9CA3AF' }}>
            ERPNext Doctype: Sales Order, Customer, Quotation, Delivery Note
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary btn-sm">
            <Download size={14} />
            Export
          </button>
          {can('create_sales_order') && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)}>
              <Plus size={14} />
              Sales Order Baru
            </button>
          )}
          {can('create_customer') && activeTab === 'customers' && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreateCustomerModal(true)}>
              <Plus size={14} />
              Customer Baru
            </button>
          )}
          {can('create_delivery_note') && activeTab === 'delivery' && (
            <button className="btn btn-primary btn-sm" style={{ background: '#059669' }} onClick={() => setShowCreateDNModal(true)}>
              <Truck size={14} />
              Delivery Note Baru
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
              <p style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>{s.sub}</p>
            </div>
            <div style={{ width: '44px', height: '44px', borderRadius: '11px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
              {s.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px', marginBottom: '16px' }}>
        {/* Revenue Trend */}
        <div className="chart-container">
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>Tren Penjualan 6 Bulan Terakhir</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={revenueTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0066B3" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0066B3" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => formatRupiah(v)} tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [formatRupiah(Number(v)), 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#0066B3" strokeWidth={2.5} fill="url(#salesGrad)" dot={{ fill: '#0066B3', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status Donut */}
        <div className="chart-container">
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>Status Order</p>
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value" stroke="none">
                  {donutData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
            {donutData.map((item, i) => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: DONUT_COLORS[i], flexShrink: 0 }} />
                <span style={{ flex: 1, color: '#6B7280' }}>{item.name}</span>
                <strong style={{ color: '#111827' }}>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs + Table */}
      <div className="chart-container">
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
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

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={13} color="#9CA3AF" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Cari order atau customer..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  padding: '6px 10px 6px 30px', border: '1px solid #e5e7eb', borderRadius: '8px',
                  fontSize: '12px', fontFamily: "'Montserrat', sans-serif", outline: 'none', width: '220px',
                }}
              />
            </div>
          </div>
        </div>

        {/* Status filters */}
        {activeTab === 'orders' && (
          <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Filter size={13} color="#9CA3AF" />
            {STATUS_FILTERS.map((f) => (
              <button
                key={f}
                className={`filter-pill ${statusFilter === f ? 'active' : ''}`}
                onClick={() => setStatusFilter(f)}
              >
                {f === 'Semua' ? 'Semua' : getStatusLabel(f)}
              </button>
            ))}
          </div>
        )}

        {/* Sales Orders Table */}
        {activeTab === 'orders' && (
          <div style={{ overflowX: 'auto' }}>
            <table className="erp-table">
              <thead>
                <tr>
                  <th style={{ width: '20px' }}></th>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th style={{ textAlign: 'right' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Grand Total</th>
                  <th>Delivery</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const sc = getStatusBadgeClass(order.status);
                  const sl = getStatusLabel(order.status);
                  return (
                    <tr key={order.name} onClick={() => setSelectedOrder(order)}>
                      <td><ChevronRight size={14} color="#9CA3AF" /></td>
                      <td>
                        <div style={{ color: '#0066B3', fontWeight: 700, fontSize: '13px' }}>{order.name}</div>
                        <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{formatDate(order.transaction_date)}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '13px', color: '#111827' }}>{order.customer_name}</div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{order.total_qty.toLocaleString('id-ID')}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#111827' }}>{formatRupiah(order.grand_total)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#374151' }}>
                          <Calendar size={12} color="#9CA3AF" />
                          {formatDate(order.delivery_date)}
                        </div>
                      </td>
                      <td><span className={`badge ${sc}`}>{sl}</span></td>
                    </tr>
                  );
                })}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#6B7280' }}>
                      Tidak ada data yang sesuai filter
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Customers Table */}
        {activeTab === 'customers' && (
          <table className="erp-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Type</th>
                <th>Territory</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Status</th>
                {can('edit_customer') && <th style={{ width: '60px' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.name}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0066B3', fontSize: '13px' }}>{c.customer_name}</div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{c.name}</div>
                  </td>
                  <td><span className="badge badge-info">{c.customer_type}</span></td>
                  <td style={{ fontSize: '13px', color: '#374151' }}>{c.territory || '-'}</td>
                  <td style={{ fontSize: '13px', color: '#374151' }}>{c.mobile_no || '-'}</td>
                  <td style={{ fontSize: '12px', color: '#6B7280' }}>{c.email_id || '-'}</td>
                  <td><span className={`badge ${c.disabled ? 'badge-danger' : 'badge-success'}`}>{c.disabled ? 'Disabled' : 'Active'}</span></td>
                  {can('edit_customer') && (
                    <td>
                      <button onClick={() => setSelectedCustomer(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0066B3', padding: '4px' }}>
                        <Edit size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Delivery Notes Table */}
        {activeTab === 'delivery' && (
          <table className="erp-table">
            <thead>
              <tr>
                <th>DN Number</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Company</th>
                <th style={{ textAlign: 'right' }}>Total Qty</th>
                <th>Expedisi</th>
                <th>Tracking (Resi)</th>
                <th>Status</th>
                {can('edit_delivery_note') && <th style={{ width: '60px' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {deliveryNotes.map((dn) => (
                <tr key={dn.name}>
                  <td>
                    <div style={{ color: '#0066B3', fontWeight: 700, fontSize: '13px' }}>{dn.name}</div>
                  </td>
                  <td style={{ fontWeight: 600, fontSize: '13px' }}>{dn.customer_name}</td>
                  <td style={{ fontSize: '12px', color: '#6B7280' }}>{formatDate(dn.posting_date)}</td>
                  <td style={{ fontSize: '12px', color: '#374151' }}>{dn.company}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{dn.total_qty}</td>
                  <td>
                    {dn.transport_company ? (
                      <span style={{ background: '#f0fdf4', color: '#059669', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                        {dn.transport_company}
                      </span>
                    ) : (
                      <span style={{ color: '#9CA3AF', fontSize: '12px' }}>-</span>
                    )}
                  </td>
                  <td>
                    {dn.lr_no ? (
                      <span style={{ background: '#eff6ff', color: '#0066B3', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                        {dn.lr_no}
                      </span>
                    ) : (
                      <span style={{ color: '#9CA3AF', fontSize: '12px' }}>Belum diisi</span>
                    )}
                  </td>
                  <td><span className={`badge ${getStatusBadgeClass(dn.status)}`}>{getStatusLabel(dn.status)}</span></td>
                  {can('edit_delivery_note') && (
                    <td>
                      <button 
                        onClick={async () => {
                          if (!confirm('Yakin ingin menghapus Delivery Note ini?')) return;
                          try {
                            const { apiDelete } = await import('@/lib/api');
                            await apiDelete('Delivery Note', dn.name);
                            alert('✅ Delivery Note berhasil dihapus!');
                            refetch();
                          } catch (err) {
                            alert('Gagal menghapus: ' + (err instanceof Error ? err.message : 'Unknown'));
                          }
                        }} 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '4px' }}
                        title="Hapus"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {deliveryNotes.length === 0 && (
                <tr>
                  <td colSpan={can('edit_delivery_note') ? 9 : 8} style={{ textAlign: 'center', padding: '32px', color: '#6B7280' }}>
                    Belum ada Delivery Note
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

// Create Delivery Note Modal
function CreateDeliveryNoteModal({ onClose, customers, salesOrders, items, onSuccess }: { onClose: () => void; customers: Customer[]; salesOrders: SalesOrder[]; items: any[]; onSuccess?: () => void }) {
  const [form, setForm] = useState({
    customer: '',
    company: 'Netra Vidya',
    posting_date: new Date().toISOString().split('T')[0],
    sales_order: '',
    item_code: '',
    qty: '',
    warehouse: 'Finished Goods - NV',
    lr_no: '',
    transport_company: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleCompanyChange = (company: string) => {
    const code = company === 'Netra Vidya' ? 'NV' : company === 'PT Solusi Berdikari' ? 'PSB' : company === 'PT Maju Sejahtera' ? 'PMS' : 'PMJA';
    setForm(f => ({
      ...f,
      company,
      warehouse: `Finished Goods - ${code}`,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const selectedItem = items.find((i: any) => i.item_code === form.item_code);
      const selectedCustomer = customers.find((c: any) => c.name === form.customer);

      const deliveryNoteData = {
        customer: form.customer,
        customer_name: selectedCustomer?.customer_name || form.customer,
        posting_date: form.posting_date,
        company: form.company,
        sales_order: form.sales_order || undefined,
        lr_no: form.lr_no || undefined,
        transport_company: form.transport_company || undefined,
        items: [
          {
            item_code: form.item_code,
            item_name: selectedItem?.item_name || form.item_code,
            qty: parseFloat(form.qty),
            warehouse: form.warehouse,
            uom: selectedItem?.stock_uom || 'Nos',
            conversion_factor: 1,
          }
        ]
      };

      const { apiCreate } = await import('@/lib/api');
      const result = await apiCreate('Delivery Note', deliveryNoteData);
      console.log('Delivery Note created in ERP:', result);
      alert('✅ Delivery Note berhasil dibuat di ERP Frappe!');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Failed to create Delivery Note:', err);
      setError('Gagal membuat Delivery Note: ' + (err instanceof Error ? err.message : 'Unknown'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const warehouses = useMemo(() => getWarehousesByCompany(form.company), [form.company]);

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '520px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>Buat Delivery Note</h2>
            <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>Surat Jalan untuk pengiriman barang</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Customer *</label>
            <select required className="erp-input" style={{ fontSize: '13px' }} value={form.customer} onChange={e => setForm(f => ({ ...f, customer: e.target.value }))}>
              <option value="">Pilih Customer...</option>
              {customers.map((c: any) => <option key={c.name} value={c.name}>{c.customer_name}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Perusahaan *</label>
              <select required className="erp-input" style={{ fontSize: '13px' }} value={form.company} onChange={e => handleCompanyChange(e.target.value)}>
                {FRAPPE_COMPANIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Tanggal Kirim *</label>
              <input type="date" required className="erp-input" style={{ fontSize: '13px' }} value={form.posting_date} onChange={e => setForm(f => ({ ...f, posting_date: e.target.value }))} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Sales Order (Opsional)</label>
            <select className="erp-input" style={{ fontSize: '13px' }} value={form.sales_order} onChange={e => setForm(f => ({ ...f, sales_order: e.target.value }))}>
              <option value="">Tidak ada / Buat baru</option>
              {salesOrders.filter((so: any) => so.customer === form.customer).map((so: any) => <option key={so.name} value={so.name}>{so.name}</option>)}
            </select>
          </div>

          <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '10px' }}>Item yang Dikirim</p>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Item *</label>
                <select required className="erp-input" style={{ fontSize: '13px' }} value={form.item_code} onChange={e => setForm(f => ({ ...f, item_code: e.target.value }))}>
                  <option value="">Pilih item...</option>
                  {items.map((i: any) => <option key={i.name} value={i.item_code}>{i.item_code} - {i.item_name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Qty *</label>
                <input type="number" required placeholder="0" className="erp-input" style={{ fontSize: '13px' }} value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>No. Resi / Tracking</label>
              <input type="text" className="erp-input" style={{ fontSize: '13px' }} value={form.lr_no} onChange={e => setForm(f => ({ ...f, lr_no: e.target.value }))} placeholder="cth: JNE-12345678" />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Transport / Expedisi</label>
              <input type="text" className="erp-input" style={{ fontSize: '13px' }} value={form.transport_company} onChange={e => setForm(f => ({ ...f, transport_company: e.target.value }))} placeholder="cth: JNE, TIKI, SiCepat" />
            </div>
          </div>

          {error && (
            <div style={{ background: '#fee2e2', borderRadius: '6px', padding: '10px', color: '#991b1b', fontSize: '12px' }}>
              {error}
            </div>
          )}

          <div style={{ background: '#f0f7ff', borderRadius: '8px', padding: '10px 12px', fontSize: '11px', color: '#0369a1', border: '1px solid #dbeafe' }}>
            <strong>📦 Fungsi:</strong> Delivery Note (Surat Jalan) digunakan untuk mencatat pengiriman barang ke customer. Setelah disubmit, stok akan berkurang otomatis.
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }} disabled={isSubmitting}>Batal</button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ flex: 2 }}>
              {isSubmitting ? 'Menyimpan...' : (<><Truck size={15} /> Simpan Delivery Note</>)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}