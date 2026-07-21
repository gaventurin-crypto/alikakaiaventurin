import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Trash2, Edit3, Package, Users, DollarSign, AlertCircle, Search,
  RefreshCw, Eye, CheckCircle, Clock, Settings, Tag, FileText, ChevronDown,
  X, Send, Paperclip, CheckCircle2, ShieldCheck, Mail, Info, Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ConfirmModal, { ConfirmDialogConfig } from './ConfirmModal';
import { api } from '../lib/api';
import { formatPersianPrice, formatPersianNumber } from './ProductCard';

export default function AdminHandmades() {
  const [subTab, setSubTab] = useState<'samples' | 'orders'>('orders');

  // Samples Portfolio State
  const [samples, setSamples] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isEditingSample, setIsEditingSample] = useState<boolean>(false);
  const [editingSampleId, setEditingSampleId] = useState<string | null>(null);

  // Sample Form Fields
  const [sampleTitle, setSampleTitle] = useState('');
  const [sampleDesc, setSampleDesc] = useState('');
  const [samplePrice, setSamplePrice] = useState<number | ''>('');
  const [sampleCategory, setSampleCategory] = useState('ring');
  const [sampleMaterial, setSampleMaterial] = useState('gold');
  const [sampleStone, setSampleStone] = useState('diamond');
  const [sampleColor, setSampleColor] = useState('gold');
  const [sampleImage, setSampleImage] = useState('/src/assets/images/luxury_ring_1784386441851.jpg');

  // New Category State
  const [newCatName, setNewCatName] = useState('');

  // Custom Orders State
  const [customOrders, setCustomOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatImageBase64, setChatImageBase64] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [adminPriceInput, setAdminPriceInput] = useState<number | ''>('');

  const chatFileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<any>(null);

  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogConfig | null>(null);

  const triggerToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (typeof window !== 'undefined' && typeof (window as any).showToast === 'function') {
      (window as any).showToast(message, type);
    } else {
      console[type === 'error' ? 'error' : 'log'](message);
    }
  };

  // Image presets
  const samplePresets = [
    { name: 'انگشتر زمرد لوکس', path: '/src/assets/images/luxury_ring_1784386441851.jpg' },
    { name: 'گردنبند تک‌نگین الماس', path: '/src/assets/images/luxury_necklace_1784386427279.jpg' },
    { name: 'گوشواره آویز مروارید', path: '/src/assets/images/luxury_earrings_1784386456583.jpg' },
    { name: 'دستبند زنجیری کلاسیک', path: '/src/assets/images/luxury_bracelet_1784386471951.jpg' },
  ];

  useEffect(() => {
    fetchSamples();
    fetchOrders();
  }, []);

  // Poll chat messages for selected order
  useEffect(() => {
    if (selectedOrder) {
      fetchChatMessages(selectedOrder.id);
      setAdminPriceInput(selectedOrder.adminPrice || '');

      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = setInterval(() => {
        refreshSelectedOrder(selectedOrder.id);
      }, 4000);
    } else {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }

    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, [selectedOrder]);

  // Scroll chat bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const fetchSamples = async () => {
    try {
      const items = await api.getSampleItems();
      setSamples(items);
      const cats = await api.getSampleCategories();
      setCategories(cats);
    } catch (err) {
      console.error("Error fetching admin samples:", err);
    }
  };

  const fetchOrders = async () => {
    try {
      const orders = await api.getAllCustomOrders();
      setCustomOrders(orders);
    } catch (err) {
      console.error("Error fetching admin custom orders:", err);
    }
  };

  const refreshSelectedOrder = async (orderId: string) => {
    try {
      const orders = await api.getAllCustomOrders();
      setCustomOrders(orders);
      const updated = orders.find((o: any) => o.id === orderId);
      if (updated) {
        setSelectedOrder(updated);
      }

      const msgs = await api.getChatMessages(orderId);
      setChatMessages(msgs);
    } catch (err) {
      console.error("Error polling admin chat:", err);
    }
  };

  const fetchChatMessages = async (orderId: string) => {
    try {
      const msgs = await api.getChatMessages(orderId);
      setChatMessages(msgs);
    } catch (err) {
      console.error("Error fetching chat messages:", err);
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleChatFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      try {
        const base64 = await convertToBase64(files[0]);
        setChatImageBase64(base64);
      } catch (err) {
        triggerToast("خطا در پردازش تصویر ضمیمه.", 'error');
      }
    }
  };

  const handleSampleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sampleTitle || !samplePrice) {
      triggerToast("لطفا فیلدهای الزامی را مقداردهی کنید.", 'error');
      return;
    }

    const payload = {
      title: sampleTitle,
      description: sampleDesc,
      basePrice: Number(samplePrice),
      category: sampleCategory,
      material: sampleMaterial,
      stone: sampleStone,
      color: sampleColor,
      image: sampleImage
    };

    try {
      if (editingSampleId) {
        await api.editSampleItem(editingSampleId, payload);
        triggerToast("✓ نمونه‌کار با موفقیت ویرایش شد.", 'success');
      } else {
        await api.addSampleItem(payload);
        triggerToast("✓ نمونه‌کار جدید به کاتالوگ سفارشی اضافه شد.", 'success');
      }
      resetSampleForm();
      fetchSamples();
    } catch (err: any) {
      triggerToast(err.message || "خطا در ثبت نمونه‌کار.", 'error');
    }
  };

  const handleEditInit = (item: any) => {
    setEditingSampleId(item.id);
    setSampleTitle(item.title);
    setSampleDesc(item.description);
    setSamplePrice(item.basePrice);
    setSampleCategory(item.category);
    setSampleMaterial(item.material);
    setSampleStone(item.stone);
    setSampleColor(item.color);
    setSampleImage(item.image);
    setIsEditingSample(true);
  };

  const handleDeleteSample = (id: string) => {
    setConfirmDialog({
      title: 'حذف نمونه‌کار سفارشی',
      message: 'آیا از حذف این نمونه‌کار سفارشی مطمئن هستید؟ این عمل غیرقابل بازگشت است.',
      onConfirm: async () => {
        try {
          await api.deleteSampleItem(id);
          triggerToast('نمونه‌کار انتخابی با موفقیت حذف گردید.', 'success');
          fetchSamples();
        } catch (err: any) {
          triggerToast(err.message || 'خطا در حذف نمونه‌کار.', 'error');
        } finally {
          setConfirmDialog(null);
        }
      }
    });
  };

  const resetSampleForm = () => {
    setEditingSampleId(null);
    setSampleTitle('');
    setSampleDesc('');
    setSamplePrice('');
    setSampleCategory('ring');
    setSampleMaterial('gold');
    setSampleStone('diamond');
    setSampleColor('gold');
    setSampleImage('/src/assets/images/luxury_ring_1784386441851.jpg');
    setIsEditingSample(false);
  };

  const handleAddSampleCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      await api.addSampleCategory(newCatName.trim());
      triggerToast("✓ دسته‌بندی جدید ثبت شد.", 'success');
      setNewCatName('');
      fetchSamples();
    } catch (err: any) {
      triggerToast(err.message || "خطا در افزودن دسته‌بندی.", 'error');
    }
  };

  const handleDeleteSampleCategory = (id: string) => {
    setConfirmDialog({
      title: 'حذف دسته‌بندی دست‌ساز',
      message: 'آیا از حذف این دسته‌بندی دست‌ساز مطمئن هستید؟',
      onConfirm: async () => {
        try {
          await api.deleteSampleCategory(id);
          triggerToast('دسته‌بندی با موفقیت حذف شد.', 'success');
          fetchSamples();
        } catch (err: any) {
          triggerToast(err.message || 'خطا در حذف دسته‌بندی.', 'error');
        } finally {
          setConfirmDialog(null);
        }
      }
    });
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || (!chatInput.trim() && !chatImageBase64)) return;

    setChatLoading(true);
    try {
      await api.sendChatMessage(selectedOrder.id, chatInput, chatImageBase64 || undefined);
      setChatInput('');
      setChatImageBase64('');
      await refreshSelectedOrder(selectedOrder.id);
    } catch (err: any) {
      triggerToast(err.message || "خطا در ارسال پیام.", 'error');
    } finally {
      setChatLoading(false);
    }
  };


  const handleUpdatePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || adminPriceInput === '') return;

    try {
      await api.updateCustomOrderPrice(selectedOrder.id, Number(adminPriceInput));
      triggerToast(`✓ قیمت برآوردی ${formatPersianPrice(Number(adminPriceInput))} روی فاکتور ثبت شد و فاکتور به عنوان صادر شده تغییر یافت.`, 'success');
      await refreshSelectedOrder(selectedOrder.id);
    } catch (err: any) {
      triggerToast(err.message || "خطا در صدور قیمت.", 'error');
    }
  };

  const handleUpdateOrderStatus = async (status: string) => {
    if (!selectedOrder) return;
    try {
      await api.updateCustomOrderStatus(selectedOrder.id, status);
      triggerToast(`وضعیت سفارش به "${status}" تغییر یافت.`, 'success');
      await refreshSelectedOrder(selectedOrder.id);
    } catch (err: any) {
      triggerToast(err.message || "خطا در به‌روزرسانی وضعیت.", 'error');
    }
  };

  // Help labels
  const translateMaterial = (mat: string) => {
    switch(mat) {
      case 'gold': return 'طلا زرد ۱۸ عیار';
      case 'silver': return 'نقره استرلینگ ۹۲۵';
      case 'rose-gold': return 'رزگلد لوکس چندلایه';
      default: return mat;
    }
  };

  const translateStone = (stone: string) => {
    switch(stone) {
      case 'diamond': return 'الماس / برلیان';
      case 'pearl': return 'مروارید طبیعی صدف';
      case 'emerald': return 'زمرد کلمبیا یا فیروزه';
      case 'none': return 'بدون نگین';
      default: return stone;
    }
  };

  return (
    <div className="space-y-6 text-right">
      
      {/* Tab select row */}
      <div className="flex border-b border-slate-850 gap-4 mb-4">
        <button
          onClick={() => { setSubTab('orders'); setSelectedOrder(null); }}
          className={`pb-3 text-xs font-extrabold transition-all duration-200 relative flex items-center gap-1.5 cursor-pointer ${
            subTab === 'orders' ? 'text-gold-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock size={14} />
          <span>سفارشات دست‌ساز فعال ({customOrders.length})</span>
          {subTab === 'orders' && <motion.div layoutId="subTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-400" />}
        </button>

        <button
          onClick={() => { setSubTab('samples'); setSelectedOrder(null); }}
          className={`pb-3 text-xs font-extrabold transition-all duration-200 relative flex items-center gap-1.5 cursor-pointer ${
            subTab === 'samples' ? 'text-gold-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Package size={14} />
          <span>مدیریت نمونه‌کارهای گالری</span>
          {subTab === 'samples' && <motion.div layoutId="subTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-400" />}
        </button>
      </div>

      <AnimatePresence mode="wait">
        
        {/* ================= ADMIN TAB 1: CUSTOM ORDERS WORKFLOW ================= */}
        {subTab === 'orders' && (
          <motion.div
            key="admin-orders"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            
            {/* Orders rail listing (5 columns) */}
            <div className={`${selectedOrder ? 'hidden lg:block lg:col-span-4' : 'lg:col-span-12'} space-y-3`}>
              {customOrders.length === 0 ? (
                <div className="bg-slate-900 border border-slate-850 rounded-2xl p-8 text-center text-slate-500 text-xs">
                  هیچ سفارش یا پیش‌نویس زیورآلات سفارشی یافت نشد.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {customOrders.map((order) => {
                    const isSelected = selectedOrder?.id === order.id;
                    return (
                      <div
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className={`bg-slate-900 border p-4 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-3 text-right ${
                          isSelected ? 'border-gold-500 bg-slate-850 shadow-md' : 'border-slate-850 hover:bg-slate-850/50'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-100 text-xs font-en-nums">شناسه: {order.id.slice(0, 6)}</span>
                            <span className="text-[10px] text-slate-500 font-en-nums">
                              {new Date(order.createdAt).toLocaleDateString('fa-IR')}
                            </span>
                          </div>
                          
                          <div className="text-[10px] text-slate-400 space-y-0.5 mt-1">
                            <div className="font-bold text-gold-300">مشتری: {order.userName}</div>
                            <div>نوع کالا: {translateMaterial(order.material)} • {translateStone(order.stone)}</div>
                          </div>
                        </div>

                        <div>
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-[9px] font-bold ${
                            order.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse' :
                            order.status === 'accepted' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            order.status === 'priced' ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20' :
                            order.status === 'chatting' ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' :
                            order.status === 'cancelled' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                            'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {order.status === 'paid' ? '✓ در حال ساخت' :
                             order.status === 'accepted' ? 'تایید قیمت توسط مشتری' :
                             order.status === 'priced' ? 'فاکتور صادر شده' :
                             order.status === 'chatting' ? 'گفتگوی فنی' :
                             order.status === 'cancelled' ? 'لغو شده' : 'بررسی اولیه'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Chat & Price quote manager (8 columns) */}
            {selectedOrder ? (
              <div className="lg:col-span-8 bg-slate-900 border border-slate-850 rounded-2xl p-6 flex flex-col h-[650px] justify-between shadow-2xl relative">
                
                {/* Back button */}
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="absolute top-4 left-4 text-slate-400 hover:text-slate-100 lg:hidden flex items-center gap-1 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 text-[10px]"
                >
                  <span>بازگشت به لیست</span>
                </button>

                {/* Sub-Pane 1: Order Details & Price Setter */}
                <div className="border-b border-slate-800 pb-4 mb-4 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-right">
                    <div>
                      <h4 className="font-black text-slate-100 text-sm">جزئیات درخواست سفارشی کاربر</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">کاربر: {selectedOrder.userName} ({selectedOrder.userEmail})</p>
                    </div>

                    {/* Change Status manual controller */}
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="text-slate-400 font-bold">تغییر زنده وضعیت:</span>
                      <select
                        value={selectedOrder.status}
                        onChange={(e) => handleUpdateOrderStatus(e.target.value)}
                        className="rounded-lg bg-slate-950 border border-slate-800 px-2 py-1 text-[10px] font-bold text-gold-400 cursor-pointer outline-none"
                      >
                        <option value="pending">بررسی اولیه</option>
                        <option value="chatting">گفتگوی فنی</option>
                        <option value="priced">اعلام قیمت فاکتور</option>
                        <option value="accepted">تایید مشتری (آماده پرداخت)</option>
                        <option value="paid">پرداخت موفق (در حال ساخت)</option>
                        <option value="cancelled">لغو سفارش</option>
                      </select>
                    </div>
                  </div>

                  {/* Summary of what they submitted */}
                  <div className="bg-slate-950 rounded-xl p-3 border border-slate-850 text-xs text-slate-300 space-y-1 leading-relaxed">
                    <div><span className="font-bold text-gold-400">توضیحات ایده کاربر:</span> {selectedOrder.description}</div>
                    <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-500 pt-2 border-t border-slate-850/60 font-en-nums mt-1.5">
                      <div>فلز: {translateMaterial(selectedOrder.material)}</div>
                      <div>نگین: {translateStone(selectedOrder.stone)}</div>
                      <div>رنگ: {selectedOrder.color === 'gold' ? 'طلایی' : selectedOrder.color === 'silver' ? 'نقره‌ای' : 'رزگلد'}</div>
                    </div>
                    {selectedOrder.uploadedSketchUrl && (
                      <div className="pt-2">
                        <span className="text-[10px] text-slate-500 font-bold block mb-1">طرح دستی/اسکچ ارسالی کاربر:</span>
                        <a href={selectedOrder.uploadedSketchUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-[10px] text-gold-400 font-bold">
                          <Eye size={12} />
                          <span>مشاهده فایل ضمیمه در تب جدید</span>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Price Setting form block */}
                  <form onSubmit={handleUpdatePrice} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-850 text-xs">
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-slate-400 font-bold shrink-0">برآورد قیمت ساخت (تومان):</span>
                      <input
                        type="number"
                        required
                        placeholder="مثال: ۳۴۰۰۰۰۰"
                        value={adminPriceInput}
                        onChange={(e) => setAdminPriceInput(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs text-slate-200 outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-gold-500 hover:bg-gold-400 text-slate-950 font-black px-4 py-2 rounded-lg transition-colors text-xs flex items-center gap-1.5 cursor-pointer justify-center"
                    >
                      <DollarSign size={14} />
                      <span>ثبت و صدور فاکتور</span>
                    </button>
                  </form>
                </div>

                {/* Sub-Pane 2: Chat Feed Thread */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 pl-2 mb-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-12 text-[11px] text-slate-600">
                      مکالمه‌ای هنوز ثبت نشده است. پیامی ارسال کنید تا مشتری آن را دریافت کند.
                    </div>
                  ) : (
                    chatMessages.map((msg: any) => {
                      const isMe = msg.sender === 'admin';
                      return (
                        <div
                          key={msg.id || msg._id}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[80%] rounded-2xl p-3.5 space-y-2 border text-right shadow-md ${
                            isMe
                              ? 'bg-slate-950 border-slate-800 rounded-tr-none text-slate-100'
                              : 'bg-gold-500/5 border-gold-500/20 rounded-tl-none text-slate-200'
                          }`}>
                            {/* Header */}
                            <div className="flex items-center gap-1.5 justify-between border-b border-slate-800/40 pb-1 mb-1 text-[10px]">
                              <span className={`font-extrabold ${isMe ? 'text-gold-400' : 'text-slate-400'}`}>
                                {isMe ? 'شما (ادمین گالری)' : `مشتری: ${selectedOrder.userName}`}
                              </span>
                              <span className="text-[9px] text-slate-500 font-en-nums">
                                {new Date(msg.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            {/* Body */}
                            <p className="text-xs leading-relaxed text-justify whitespace-pre-wrap">{msg.message}</p>

                            {/* Attached image */}
                            {msg.imageUrl && (
                              <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-850 max-h-48">
                                <img
                                  src={msg.imageUrl}
                                  alt=""
                                  className="w-full object-contain max-h-48 cursor-pointer"
                                  referrerPolicy="no-referrer"
                                  onClick={() => window.open(msg.imageUrl, '_blank')}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Sub-Pane 3: Input Area */}
                <form onSubmit={handleSendChatMessage} className="space-y-3 pt-3 border-t border-slate-800">
                  {chatImageBase64 && (
                    <div className="relative rounded-xl bg-slate-950 border border-slate-800 p-1.5 inline-flex items-center gap-2 pr-3">
                      <span className="text-[10px] text-slate-400">یک طرح پیوست گردید</span>
                      <button
                        type="button"
                        onClick={() => setChatImageBase64('')}
                        className="text-rose-400 hover:text-rose-300 p-1 rounded-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={chatLoading || (!chatInput.trim() && !chatImageBase64)}
                      className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-gold-500 text-slate-950 hover:bg-gold-400 active:scale-95 transition-all cursor-pointer disabled:opacity-40"
                    >
                      <Send size={16} />
                    </button>

                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="پیامی برای مشتری بنویسید..."
                      className="w-full h-10 rounded-xl bg-slate-950 border border-slate-800 px-4 text-xs text-slate-200 outline-none focus:border-gold-500/50"
                    />

                    <button
                      type="button"
                      onClick={() => chatFileInputRef.current?.click()}
                      className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-gold-400 transition-colors"
                      title="ضمیمه کردن عکس/اسکچ جدید"
                    >
                      <Paperclip size={18} />
                      <input
                        type="file"
                        ref={chatFileInputRef}
                        onChange={handleChatFileChange}
                        className="hidden"
                        accept="image/*"
                      />
                    </button>
                  </div>
                </form>

              </div>
            ) : (
              <div className="hidden lg:flex lg:col-span-8 bg-slate-900 border border-slate-850 rounded-2xl p-6 h-[650px] items-center justify-center text-center text-slate-500">
                <div className="space-y-2">
                  <Clock className="mx-auto text-slate-700 mb-2" size={32} />
                  <p className="text-sm">سفارشی را در ستون سمت راست انتخاب کنید تا گفتگوی زنده طراح و صدور پیش‌فاکتور قیمت آغاز شود.</p>
                </div>
              </div>
            )}

          </motion.div>
        )}

        {/* ================= ADMIN TAB 2: PORTFOLIO SAMPLES MANAGEMENT ================= */}
        {subTab === 'samples' && (
          <motion.div
            key="admin-samples"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            
            {/* Left Column: Sample Form Creator (5 columns) */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-850 rounded-2xl p-6 self-start space-y-6">
              <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
                <div>
                  <h4 className="font-black text-slate-100 text-xs">
                    {editingSampleId ? 'ویرایش اطلاعات نمونه‌کار' : 'افزودن نمونه‌کار دست‌ساز جدید'}
                  </h4>
                  <p className="text-[9px] text-slate-500">برای الهام به مشتریان روی کاتالوگ نمایش داده می‌شود</p>
                </div>
                {editingSampleId && (
                  <button onClick={resetSampleForm} className="text-rose-400 hover:text-rose-300 text-[10px] font-bold">لغو ویرایش</button>
                )}
              </div>

              <form onSubmit={handleSampleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">عنوان فارسی نمونه‌کار *</label>
                  <input
                    type="text"
                    required
                    value={sampleTitle}
                    onChange={(e) => setSampleTitle(e.target.value)}
                    placeholder="مثال: آویز گردنبند دست‌ساز طرح پرواز"
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">توضیح متریال و شناسنامه کار</label>
                  <textarea
                    rows={3}
                    value={sampleDesc}
                    onChange={(e) => setSampleDesc(e.target.value)}
                    placeholder="شرح متدهای جواهرسازی سنتی به کار رفته، نوع بافت، ظرافت و مخراج‌کاری نگین‌ها..."
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-200 outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">هزینه ساخت پایه (تومان) *</label>
                    <input
                      type="number"
                      required
                      value={samplePrice}
                      onChange={(e) => setSamplePrice(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="مثال: ۲۴۰۰۰۰۰"
                      className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-200 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">دسته‌بندی اکسسوری</label>
                    <select
                      value={sampleCategory}
                      onChange={(e) => setSampleCategory(e.target.value)}
                      className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-200 outline-none cursor-pointer"
                    >
                      <option value="ring">انگشترها</option>
                      <option value="necklace">گردنبندها</option>
                      <option value="earrings">گوشواره‌ها</option>
                      <option value="bracelet">دستبندها</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">فلز پایه</label>
                    <select
                      value={sampleMaterial}
                      onChange={(e) => setSampleMaterial(e.target.value)}
                      className="w-full rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-2 text-[10px] text-slate-200 outline-none cursor-pointer"
                    >
                      <option value="gold">طلای ۱۸ عیار</option>
                      <option value="silver">نقره استرلینگ</option>
                      <option value="rose-gold">مس/رزگلد چندلایه</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">گوهر یا مروارید</label>
                    <select
                      value={sampleStone}
                      onChange={(e) => setSampleStone(e.target.value)}
                      className="w-full rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-2 text-[10px] text-slate-200 outline-none cursor-pointer"
                    >
                      <option value="diamond">برلیان اصل</option>
                      <option value="pearl">مروارید طبیعی</option>
                      <option value="emerald">سنگ فیروزه/زمرد</option>
                      <option value="none">ساده (بدون نگین)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">پالت رنگ کار نهایی</label>
                    <select
                      value={sampleColor}
                      onChange={(e) => setSampleColor(e.target.value)}
                      className="w-full rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-2 text-[10px] text-slate-200 outline-none cursor-pointer"
                    >
                      <option value="gold">طلایی براق</option>
                      <option value="silver">سیلور / سفید</option>
                      <option value="rose-gold">رزگلد کلاسیک</option>
                    </select>
                  </div>
                </div>

                {/* Preset image path selector */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5">انتخاب تصویر نمونه‌کار</label>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {samplePresets.map((preset, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSampleImage(preset.path)}
                        className={`aspect-square rounded-xl overflow-hidden cursor-pointer border transition-all ${
                          sampleImage === preset.path ? 'border-gold-500 scale-105 shadow shadow-gold-500/20' : 'border-slate-800 opacity-60'
                        }`}
                        title={preset.name}
                      >
                        <img src={preset.path} alt="" className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={sampleImage}
                    onChange={(e) => setSampleImage(e.target.value)}
                    placeholder="آدرس تصویر دلخواه..."
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-[10px] text-slate-300 outline-none"
                    dir="ltr"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-gold-500 hover:bg-gold-400 text-slate-950 font-black py-2.5 text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <CheckCircle size={14} />
                  <span>{editingSampleId ? 'اعمال تغییرات روی نمونه‌کار' : 'ثبت نمونه‌کار جدید در کاتالوگ'}</span>
                </button>
              </form>
            </div>

            {/* Right Column: List of existing samples & Sample category creator (7 columns) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Sample Categories Manager inside block */}
              <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4 space-y-4">
                <h4 className="text-slate-100 font-extrabold text-xs">تعریف دسته‌بندی برای جواهرات دست‌ساز</h4>
                
                <form onSubmit={handleAddSampleCategory} className="flex gap-2 text-xs">
                  <input
                    type="text"
                    required
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="عنوان دسته‌بندی (مانند: انگشترهای دست‌ساز)"
                    className="flex-1 rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 outline-none"
                  />
                  <button type="submit" className="bg-gold-500 hover:bg-gold-400 text-slate-950 font-black px-4 py-1.5 rounded-lg text-xs cursor-pointer">
                    ثبت دسته‌بندی
                  </button>
                </form>

                <div className="flex flex-wrap gap-2 text-[10px]">
                  {categories.map((cat) => (
                    <span key={cat.id} className="inline-flex items-center gap-1 rounded-lg bg-slate-950 border border-slate-850 px-2.5 py-1 text-slate-300">
                      <span>{cat.name}</span>
                      <button
                        onClick={() => handleDeleteSampleCategory(cat.id)}
                        className="text-slate-500 hover:text-rose-400 transition-colors mr-1"
                        title="حذف دسته‌بندی"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Table of samples */}
              <div className="bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-850 bg-slate-950/40">
                  <h4 className="text-xs font-black text-slate-100">آلبوم کل نمونه‌کارهای فعال</h4>
                </div>

                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-right">
                    <thead className="bg-slate-950 text-slate-500 font-bold border-b border-slate-850">
                      <tr>
                        <th className="p-3">طرح</th>
                        <th className="p-3">عنوان</th>
                        <th className="p-3">شاخص ساخت پایه</th>
                        <th className="p-3">متریال / سنگ</th>
                        <th className="p-3 text-center">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/60 text-slate-300">
                      {samples.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-850/20 transition-colors">
                          <td className="p-3">
                            <div className="h-10 w-10 overflow-hidden rounded-lg border border-slate-800">
                              <img src={item.image} alt="" className="h-full w-full object-cover" />
                            </div>
                          </td>
                          <td className="p-3 font-bold text-slate-100">{item.title}</td>
                          <td className="p-3 font-en-nums">{formatPersianPrice(item.basePrice)}</td>
                          <td className="p-3">
                            <span className="text-[10px] block text-slate-400">{translateMaterial(item.material)}</span>
                            <span className="text-[9px] block text-slate-500">{translateStone(item.stone)}</span>
                          </td>
                          <td className="p-3">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleEditInit(item)}
                                className="p-1.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                                title="ویرایش"
                              >
                                <Edit3 size={12} />
                              </button>
                              <button
                                onClick={() => handleDeleteSample(item.id)}
                                className="p-1.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
                                title="حذف"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </motion.div>
        )}

      </AnimatePresence>

      <ConfirmModal confirmDialog={confirmDialog} onClose={() => setConfirmDialog(null)} />

    </div>
  );
}
