import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Upload, MessageCircle, CheckCircle2, DollarSign,
  Clock, ArrowRight, Send, Trash2, ShieldCheck, CreditCard, ChevronLeft,
  Paperclip, Info, AlertCircle, ShoppingBag, Eye, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../lib/api';
import { formatPersianPrice, formatPersianNumber } from './ProductCard';

interface HandmadesViewProps {
  currentUser: any;
  onAuthRequired: (target: 'account' | 'handmades') => void;
  currencyUnit: 'تومان' | 'ریال';
  initialTab?: 'portfolio' | 'my-orders';
}

export default function HandmadesView({
  currentUser,
  onAuthRequired,
  currencyUnit,
  initialTab
}: HandmadesViewProps) {
  const [activeTab, setActiveTab] = useState<'portfolio' | 'my-orders'>(initialTab || 'portfolio');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Portfolio states
  const [samples, setSamples] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filterMaterial, setFilterMaterial] = useState<string | null>(null);
  const [filterStone, setFilterStone] = useState<string | null>(null);

  // Custom Order Form states
  const [baselineSample, setBaselineSample] = useState<any | null>(null);
  const [formMaterial, setFormMaterial] = useState<string>('gold');
  const [formStone, setFormStone] = useState<string>('diamond');
  const [formColor, setFormColor] = useState<string>('gold');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formImageBase64, setFormImageBase64] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);

  // User's custom orders list
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [chatImageBase64, setChatImageBase64] = useState<string>('');
  const [chatLoading, setChatLoading] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<any>(null);

  // Fetch initial data
  useEffect(() => {
    fetchPortfolio();
    if (currentUser) {
      fetchMyOrders();
    }
  }, [currentUser]);

  // Handle active order details refresh & chat polling
  useEffect(() => {
    if (selectedOrder) {
      fetchChatMessages(selectedOrder.id);
      
      // Start real-time chat polling every 4 seconds
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

  // Scroll to chat bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const fetchPortfolio = async () => {
    try {
      const items = await api.getSampleItems();
      setSamples(items);
      const cats = await api.getSampleCategories();
      setCategories(cats);
    } catch (err) {
      console.error("Error fetching handmade portfolio data:", err);
    }
  };

  const fetchMyOrders = async () => {
    try {
      const orders = await api.getMyCustomOrders();
      setMyOrders(orders);
    } catch (err) {
      console.error("Error fetching custom orders:", err);
    }
  };

  const refreshSelectedOrder = async (orderId: string) => {
    try {
      const orders = await api.getMyCustomOrders();
      setMyOrders(orders);
      const updated = orders.find((o: any) => o.id === orderId);
      if (updated) {
        setSelectedOrder(updated);
      }
      
      // Also fetch chat messages
      const msgs = await api.getChatMessages(orderId);
      setChatMessages(msgs);
    } catch (err) {
      console.error("Error polling order/chat status:", err);
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

  // Base64 file converter helper
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, isChat = false) => {
    const files = e.target.files;
    if (files && files[0]) {
      try {
        const base64 = await convertToBase64(files[0]);
        if (isChat) {
          setChatImageBase64(base64);
        } else {
          setFormImageBase64(base64);
        }
      } catch (err) {
        alert("خطا در خواندن فایل تصویر. لطفا تصویر دیگری انتخاب کنید.");
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      try {
        const base64 = await convertToBase64(e.dataTransfer.files[0]);
        setFormImageBase64(base64);
      } catch (err) {
        alert("خطا در پردازش تصویر کشیده شده.");
      }
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onAuthRequired('handmades');
      return;
    }

    if (!formDescription.trim()) {
      alert("لطفاً توضیحات زیورآلات سفارشی درخواستی خود را تشریح کنید.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.submitCustomOrder({
        description: formDescription,
        baselineSampleId: baselineSample ? baselineSample.id : undefined,
        uploadedSketchUrl: formImageBase64 || undefined,
        material: formMaterial,
        stone: formStone,
        color: formColor
      });

      setSubmitSuccess(true);
      setFormDescription('');
      setFormImageBase64('');
      setBaselineSample(null);
      await fetchMyOrders();
      
      // Auto transition to orders tab in 2 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
        setActiveTab('my-orders');
      }, 2000);
    } catch (err: any) {
      alert(err.message || "خطا در ثبت سفارش دست‌ساز جدید.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || (!chatInput.trim() && !chatImageBase64)) return;

    setChatLoading(true);
    try {
      await api.sendChatMessage(selectedOrder.id, chatInput, chatImageBase64 || undefined);
      setChatInput('');
      setChatImageBase64('');
      // Force instant refresh
      await refreshSelectedOrder(selectedOrder.id);
    } catch (err: any) {
      alert(err.message || "خطا در ارسال پیام.");
    } finally {
      setChatLoading(false);
    }
  };

  const handleAcceptPrice = async (orderId: string) => {
    if (confirm("آیا از تایید قیمت پیشنهادی کارشناس گالری اطمینان دارید؟ پس از تایید می‌توانید هزینه ساخت را به صورت آنلاین پرداخت کنید.")) {
      try {
        await api.acceptCustomOrderPrice(orderId);
        alert("✓ قیمت با موفقیت تایید شد. اکنون می‌توانید نسبت به پرداخت آنلاین هزینه اقدام کنید.");
        await refreshSelectedOrder(orderId);
      } catch (err: any) {
        alert(err.message || "خطا در تایید قیمت.");
      }
    }
  };

  const handlePayOrder = async (orderId: string) => {
    try {
      await api.payCustomOrder(orderId);
      alert("✓ شبیه‌ساز پرداخت ZarinPal موفقیت‌آمیز بود! فرآیند ساخت زیورآلات سفارشی شما در کارگاه مرکزی آغاز شد.");
      await refreshSelectedOrder(orderId);
    } catch (err: any) {
      alert(err.message || "خطا در پرداخت سفارشی.");
    }
  };

  // Helper translations for technical metadata labels
  const translateMaterial = (mat: string) => {
    switch(mat) {
      case 'gold': return 'طلای ۱۸ عیار استاندارد';
      case 'silver': return 'نقره استرلینگ ۹۲۵ عیار عالی';
      case 'rose-gold': return 'مس درجه یک با آبکاری چندلایه رزگلد';
      default: return mat;
    }
  };

  const translateStone = (stone: string) => {
    switch(stone) {
      case 'diamond': return 'برلیان اصل (تراش الماسی فوق درخشان)';
      case 'pearl': return 'مروارید طبیعی صدف آب شیرین';
      case 'emerald': return 'سنگ زمرد کلمبیا یا فیروزه نیشابور';
      case 'none': return 'بدون نگین (طراحی کاملا مینیمال و صیقلی)';
      default: return stone;
    }
  };

  // Dynamic filter logic
  const filteredSamples = samples.filter(item => {
    if (selectedCategory && item.category !== selectedCategory) return false;
    if (filterMaterial && item.material !== filterMaterial) return false;
    if (filterStone && item.stone !== filterStone) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 text-right" dir="rtl">
      
      {/* 1. Header Hero Panel */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-950 border border-slate-800 p-8 md:p-12 mb-10 shadow-2xl">
        <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-gold-500/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-gold-400/5 blur-3xl" />
        
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-gold-500/10 border border-gold-500/20 px-3.5 py-1 text-xs font-bold text-gold-400">
              <Sparkles size={14} className="animate-pulse" />
              <span>کارگاه جواهرسازی اختصاصی و دست‌ساز آونتورین</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-100 leading-tight">
              رویای خود را طراحی کنید؛ <span className="text-gold-400">ما آن را می‌سازیم</span>
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              اگر ایده، تصویر، نقاشی یا طرحی از یک زیورآلات مدنظر دارید، در این بخش بارگذاری کنید. با تکیه بر تجربه اساتید کارگاه طلاسازی آونتورین، در درگاهی صمیمی با طراحان به گفتگو پرداخته و در کوتاه‌ترین زمان، با شناسنامه اصالت و بهترین کیفیت ساخت دست‌ساز تحویل بگیرید.
            </p>
          </div>
          
          {/* Quick Info metrics */}
          <div className="flex gap-4 self-stretch md:self-auto justify-between bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl">
            <div className="text-center px-4 border-l border-slate-800">
              <span className="block text-xl font-bold text-gold-400 font-en-nums">۴۸ساعت</span>
              <span className="text-[10px] text-slate-500">بررسی و صدور پیش‌فاکتور</span>
            </div>
            <div className="text-center px-4">
              <span className="block text-xl font-bold text-gold-400 font-en-nums">۱۰۰٪</span>
              <span className="text-[10px] text-slate-500">ضمانت اصالت و تطابق</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Custom Tabs Control */}
      <div className="flex border-b border-slate-850 mb-8 gap-4">
        <button
          onClick={() => { setActiveTab('portfolio'); setSelectedOrder(null); }}
          className={`pb-4 text-sm font-extrabold transition-all duration-300 relative ${
            activeTab === 'portfolio' ? 'text-gold-400' : 'text-slate-400 hover:text-slate-200'
          }`}
          id="tab-handmade-portfolio"
        >
          <span>گالری مدل‌های دست‌ساز و سفارش جدید</span>
          {activeTab === 'portfolio' && (
            <motion.div layoutId="handmadeTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-400" />
          )}
        </button>

        <button
          onClick={() => {
            if (!currentUser) {
              onAuthRequired('handmades');
              return;
            }
            setActiveTab('my-orders');
          }}
          className={`pb-4 text-sm font-extrabold transition-all duration-300 relative flex items-center gap-2 ${
            activeTab === 'my-orders' ? 'text-gold-400' : 'text-slate-400 hover:text-slate-200'
          }`}
          id="tab-my-handmade-orders"
        >
          <span>سفارشات من و گفتگوی فنی</span>
          {currentUser && myOrders.length > 0 && (
            <span className="bg-gold-500 text-slate-950 text-[10px] font-black rounded-full px-1.5 py-0.5 font-en-nums">
              {myOrders.length}
            </span>
          )}
          {activeTab === 'my-orders' && (
            <motion.div layoutId="handmadeTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-400" />
          )}
        </button>
      </div>

      {/* 3. Render Views */}
      <AnimatePresence mode="wait">
        
        {/* ================= VIEW A: PORTFOLIO & NEW SUBMISSION ================= */}
        {activeTab === 'portfolio' && (
          <motion.div
            key="portfolio-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            
            {/* Right: Portfolio Catalog (8 columns) */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-100">آلبوم نمونه‌کارهای خاص گالری</h3>
                  <p className="text-xs text-slate-500">می‌توانید یکی از مدل‌های فوق را به عنوان الگوی ایده انتخاب و ویرایش کنید</p>
                </div>

                {/* Filter buttons */}
                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-3 py-1.5 rounded-full border transition-all ${
                      selectedCategory === null ? 'bg-gold-500 border-gold-500 text-slate-950 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    همه دسته‌بندی‌ها
                  </button>
                  {['ring', 'necklace', 'earrings', 'bracelet'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-full border transition-all ${
                        selectedCategory === cat ? 'bg-gold-500 border-gold-500 text-slate-950 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cat === 'ring' ? 'انگشترها' : cat === 'necklace' ? 'گردنبندها' : cat === 'earrings' ? 'گوشواره‌ها' : 'دستبندها'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sample Items Grid */}
              {filteredSamples.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
                  <AlertCircle className="mx-auto text-gold-400 mb-3" size={32} />
                  <p className="text-sm">هیچ نمونه‌کاری با فیلترهای انتخابی شما یافت نشد.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {filteredSamples.map((item) => {
                    const isSelected = baselineSample?.id === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`group bg-slate-900 border rounded-3xl p-4 transition-all duration-300 hover:border-gold-500/50 flex flex-col justify-between ${
                          isSelected ? 'border-gold-500 ring-1 ring-gold-500/50 shadow-xl shadow-gold-500/5' : 'border-slate-850'
                        }`}
                      >
                        <div>
                          {/* Image frame */}
                          <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-slate-950 border border-slate-800 mb-4">
                            <img
                              src={item.image}
                              alt={item.title}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute top-2.5 left-2.5 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-800 text-[10px] font-bold text-gold-400">
                              پایه سفارشی: {formatPersianPrice(item.basePrice)}
                            </div>
                          </div>

                          <h4 className="font-bold text-slate-100 text-sm mb-1">{item.title}</h4>
                          <p className="text-[11px] text-slate-400 leading-relaxed text-justify mb-3 line-clamp-2">{item.description}</p>
                          
                          {/* Meta specifications */}
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            <span className="text-[10px] bg-slate-950 border border-slate-850 text-slate-400 px-2.5 py-0.5 rounded-lg">
                              جنس: {translateMaterial(item.material)}
                            </span>
                            <span className="text-[10px] bg-slate-950 border border-slate-850 text-slate-400 px-2.5 py-0.5 rounded-lg">
                              سنگ: {translateStone(item.stone)}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => setBaselineSample(isSelected ? null : item)}
                          className={`w-full rounded-xl py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                              : 'bg-gold-500/10 text-gold-400 border border-gold-500/20 hover:bg-gold-500/20'
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <span>✕ لغو انتخاب الگو</span>
                            </>
                          ) : (
                            <>
                              <Sparkles size={14} />
                              <span>طراحی از روی این نمونه</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Left: Custom Design Request Form (4 columns) */}
            <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 self-start shadow-xl space-y-6">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-black text-slate-100">سفارش زیورآلات سفارشی</h3>
                <p className="text-[11px] text-slate-500">جزئیات و مشخصات قطعه مدنظر خود را مشخص کنید</p>
              </div>

              {submitSuccess ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center text-emerald-400 space-y-2">
                  <CheckCircle2 className="mx-auto text-emerald-400 mb-2" size={36} />
                  <h4 className="font-bold text-sm">درخواست شما با موفقیت ارسال شد!</h4>
                  <p className="text-[10px] text-slate-400">تا چند لحظه دیگر به برگه پیش‌نویس‌ها و گفتگوی فنی منتقل می‌شوید.</p>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
                  
                  {/* Selected baseline indicator */}
                  {baselineSample && (
                    <div className="bg-gold-500/5 border border-gold-500/20 rounded-2xl p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 overflow-hidden rounded-lg bg-slate-950 border border-slate-800">
                          <img src={baselineSample.image} alt="" className="h-full w-full object-cover" />
                        </div>
                        <div>
                          <span className="text-[10px] text-gold-400 block font-bold">طراحی بر اساس نمونه:</span>
                          <span className="text-[11px] text-slate-200 line-clamp-1">{baselineSample.title}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBaselineSample(null)}
                        className="text-slate-400 hover:text-rose-400 p-1 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}

                  {/* Dropdowns */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1.5">انتخاب فلز پایه (متریال)</label>
                    <select
                      value={formMaterial}
                      onChange={(e) => setFormMaterial(e.target.value)}
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-xs text-slate-200 outline-none"
                    >
                      <option value="gold">طلای ۱۸ عیار لوکس</option>
                      <option value="silver">نقره استرلینگ ۹۲۵ عیار عالی</option>
                      <option value="rose-gold">مس مرغوب با آبکاری رزگلد چند لایه</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1.5">انتخاب نگین یا سنگ قیمتی</label>
                    <select
                      value={formStone}
                      onChange={(e) => setFormStone(e.target.value)}
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-xs text-slate-200 outline-none"
                    >
                      <option value="diamond">الماس / برلیان درجه یک</option>
                      <option value="pearl">مروارید صدفی طبیعی</option>
                      <option value="emerald">سنگ زمرد یا فیروزه طبیعی</option>
                      <option value="none">ساده / بدون نگین</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1.5">رنگ محصول نهایی</label>
                    <select
                      value={formColor}
                      onChange={(e) => setFormColor(e.target.value)}
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-xs text-slate-200 outline-none"
                    >
                      <option value="gold">طلایی براق سنتی</option>
                      <option value="silver">سیلور / نقره‌ای درخشان</option>
                      <option value="rose-gold">رزگلد ملایم مدرن</option>
                    </select>
                  </div>

                  {/* Text Description */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1.5">شرح دقیق تغییرات و ایده ساخت *</label>
                    <textarea
                      required
                      rows={4}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="ابعاد، اندازه، وزن حدودی، نوشته یا حکاکی خاص و هر تغییری که مدنظر دارید در این بخش بنویسید..."
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-xs text-slate-200 outline-none resize-none placeholder:text-slate-600"
                    />
                  </div>

                  {/* Image/Sketch Drag-and-drop uploader */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1.5">بارگذاری تصویر الگو، نقاشی یا طرح دستی شما</label>
                    
                    {formImageBase64 ? (
                      <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-2 overflow-hidden aspect-video">
                        <img src={formImageBase64} alt="Sketch Preview" className="h-full w-full object-contain rounded-xl" />
                        <button
                          type="button"
                          onClick={() => setFormImageBase64('')}
                          className="absolute top-2 left-2 bg-slate-900/90 text-rose-400 hover:text-rose-300 p-1.5 rounded-full border border-slate-800"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <div
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 ${
                          dragActive ? 'border-gold-500 bg-gold-500/5' : 'border-slate-800 bg-slate-950/50 hover:border-slate-700 hover:bg-slate-950'
                        }`}
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={(e) => handleFileChange(e)}
                          className="hidden"
                          accept="image/*"
                        />
                        <Upload size={24} className="mx-auto text-slate-500 mb-2 group-hover:text-gold-400" />
                        <span className="block text-[10px] text-slate-400">کشیدن و رها کردن فایل عکس طرح</span>
                        <span className="block text-[9px] text-slate-500 mt-0.5">یا کلیک برای انتخاب از گالری تلفن/رایانه</span>
                      </div>
                    )}
                  </div>

                  {/* Submit CTA */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-xl bg-gold-500 hover:bg-gold-400 text-slate-950 font-black py-3 text-xs transition-all shadow-lg shadow-gold-500/10 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>در حال ثبت اطلاعات...</span>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>ارسال پیش‌نویس سفارش ساخت</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

          </motion.div>
        )}

        {/* ================= VIEW B: USER'S SUBMITTED ORDERS & LIVE CHAT ================= */}
        {activeTab === 'my-orders' && (
          <motion.div
            key="orders-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            
            {/* Right: Custom Orders history rail (5 columns) */}
            <div className={`${selectedOrder ? 'hidden lg:block lg:col-span-5' : 'lg:col-span-12'} space-y-4`}>
              <div>
                <h3 className="text-lg font-black text-slate-100">پیش‌نویس‌ها و سفارش‌های فعال شما</h3>
                <p className="text-xs text-slate-500">برای گفتگو با زرگران، دریافت فاکتور ساخت و پیگیری محصول کلیک کنید</p>
              </div>

              {myOrders.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
                  <ShoppingBag className="mx-auto text-gold-400/80 mb-3" size={32} />
                  <p className="text-sm">هنوز هیچ طرح سفارشی توسط شما به ثبت نرسیده است.</p>
                  <button
                    onClick={() => setActiveTab('portfolio')}
                    className="mt-4 bg-gold-500 hover:bg-gold-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
                  >
                    مرور گالری و ثبت طرح اول
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {myOrders.map((order) => {
                    const isSelected = selectedOrder?.id === order.id;
                    return (
                      <div
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className={`bg-slate-900 border p-4 rounded-2xl cursor-pointer transition-all duration-300 flex items-center justify-between gap-4 text-right ${
                          isSelected ? 'border-gold-500 bg-slate-850 shadow-lg shadow-gold-500/5' : 'border-slate-850 hover:bg-slate-850/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Order Sketch preview */}
                          <div className="h-12 w-12 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center text-gold-400 font-bold">
                            {order.uploadedSketchUrl ? (
                              <img src={order.uploadedSketchUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <Sparkles size={18} />
                            )}
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-200 text-xs font-en-nums">شناسه سفارشی: {order.id.slice(0, 6)}...</span>
                              <span className="text-[10px] text-slate-500 font-en-nums">
                                {new Date(order.createdAt).toLocaleDateString('fa-IR')}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-1">
                              {translateMaterial(order.material)} • {translateStone(order.stone)}
                            </span>
                          </div>
                        </div>

                        {/* Status Label badge with custom Iranian colors */}
                        <div className="text-left">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-[9px] font-bold ${
                            order.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            order.status === 'accepted' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse' :
                            order.status === 'priced' ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20 animate-bounce' :
                            order.status === 'chatting' ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' :
                            order.status === 'cancelled' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                            'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {order.status === 'paid' ? 'در حال ساخت' :
                             order.status === 'accepted' ? 'آماده پرداخت' :
                             order.status === 'priced' ? 'اعلام قیمت کارشناس' :
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

            {/* Left: Chat Pane & Specific order controls (7 columns) */}
            {selectedOrder ? (
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col h-[650px] justify-between shadow-2xl relative">
                
                {/* Close/Back button for mobile */}
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="absolute top-4 left-4 text-slate-400 hover:text-slate-100 lg:hidden flex items-center gap-1 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-[10px] font-bold z-10"
                >
                  <ChevronLeft size={14} />
                  <span>بازگشت به لیست</span>
                </button>

                {/* Sub-Pane 1: Order Metadata details */}
                <div className="border-b border-slate-800 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-100 text-sm">پیگیری سفارش ساخت دست‌ساز</span>
                    <span className="text-xs text-slate-500 font-en-nums">({selectedOrder.id})</span>
                  </div>
                  
                  {/* Visual Stepper */}
                  <div className="grid grid-cols-5 gap-1.5 mt-4 text-center text-[9px] text-slate-500 font-medium font-en-nums">
                    <div className="space-y-1">
                      <div className="h-1.5 rounded-full bg-gold-500" />
                      <span className="text-gold-400 font-bold block">بررسی اولیه</span>
                    </div>
                    <div className="space-y-1">
                      <div className={`h-1.5 rounded-full ${['chatting', 'priced', 'accepted', 'paid'].includes(selectedOrder.status) ? 'bg-gold-500' : 'bg-slate-850'}`} />
                      <span className={['chatting', 'priced', 'accepted', 'paid'].includes(selectedOrder.status) ? 'text-slate-300 font-bold' : ''}>گفتگوی فنی</span>
                    </div>
                    <div className="space-y-1">
                      <div className={`h-1.5 rounded-full ${['priced', 'accepted', 'paid'].includes(selectedOrder.status) ? 'bg-gold-500' : 'bg-slate-850'}`} />
                      <span className={['priced', 'accepted', 'paid'].includes(selectedOrder.status) ? 'text-slate-300 font-bold' : ''}>پیش‌فاکتور</span>
                    </div>
                    <div className="space-y-1">
                      <div className={`h-1.5 rounded-full ${['accepted', 'paid'].includes(selectedOrder.status) ? 'bg-gold-500' : 'bg-slate-850'}`} />
                      <span className={['accepted', 'paid'].includes(selectedOrder.status) ? 'text-slate-300 font-bold' : ''}>تایید قیمت</span>
                    </div>
                    <div className="space-y-1">
                      <div className={`h-1.5 rounded-full ${selectedOrder.status === 'paid' ? 'bg-emerald-500' : 'bg-slate-850'}`} />
                      <span className={selectedOrder.status === 'paid' ? 'text-emerald-400 font-bold' : ''}>در حال ساخت</span>
                    </div>
                  </div>
                </div>

                {/* Sub-Pane 2: Price Quotes & Sim Zarinpal Actions */}
                <AnimatePresence mode="wait">
                  {selectedOrder.adminPrice && selectedOrder.adminPrice > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-gold-500/20 p-4 rounded-2xl mb-4 text-right flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-lg shadow-gold-500/5"
                    >
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-extrabold text-gold-400">
                          <CheckCircle2 size={14} />
                          <span>قیمت برآورد شده توسط کارگاه ساخت:</span>
                        </div>
                        <span className="text-xl font-black text-slate-100 mt-1 block font-en-nums">
                          {formatPersianPrice(selectedOrder.adminPrice)}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">مدت زمان حدودی ساخت: ۵ الی ۷ روز کاری</span>
                      </div>

                      {/* State Action buttons */}
                      {selectedOrder.status === 'priced' && (
                        <button
                          onClick={() => handleAcceptPrice(selectedOrder.id)}
                          className="bg-gold-500 hover:bg-gold-400 text-slate-950 text-xs font-black px-5 py-2.5 rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-1"
                        >
                          <CheckCircle2 size={14} />
                          <span>تایید قیمت پیشنهادی</span>
                        </button>
                      )}

                      {selectedOrder.status === 'accepted' && (
                        <button
                          onClick={() => handlePayOrder(selectedOrder.id)}
                          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-stone-50 text-xs font-black px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/10 transition-all cursor-pointer flex items-center gap-1 animate-pulse"
                        >
                          <CreditCard size={14} />
                          <span>اتصال به درگاه پرداخت مستقیم ZarinPal</span>
                        </button>
                      )}

                      {selectedOrder.status === 'paid' && (
                        <div className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-xs font-extrabold text-emerald-400">
                          <ShieldCheck size={16} />
                          <span>پرداخت شده و در حال ساخت در کارگاه</span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Sub-Pane 3: Messages Thread Container */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 pl-2 mb-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                  
                  {/* System Initial Automatic welcome bubble */}
                  <div className="bg-slate-950/40 rounded-2xl border border-slate-850 p-3 text-center text-[10px] text-slate-500 max-w-lg mx-auto leading-relaxed">
                    🌟 طراحان فنی و اساتید طلاسازی گالری آونتورین در این بخش همراه شما هستند. می‌توانید سوالات، ابهامات، ابعاد دقیق، فاکتور و ترجیحات ساخت زیورآلات خود را به شکل گفتگوی دوطرفه پیگیری نمایید.
                  </div>

                  {chatMessages.length === 0 ? (
                    <div className="text-center py-12 text-[11px] text-slate-600">
                      پیامی در این مکالمه هنوز ارسال نشده است. اولین پیام خود را برای طراح بنویسید...
                    </div>
                  ) : (
                    chatMessages.map((msg: any) => {
                      const isAdmin = msg.sender === 'admin';
                      return (
                        <div
                          key={msg.id || msg._id}
                          className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}
                        >
                          <div className={`max-w-[80%] rounded-2xl p-3.5 space-y-2 border text-right shadow-md ${
                            isAdmin
                              ? 'bg-slate-950 border-slate-800 rounded-tr-none text-slate-100'
                              : 'bg-gold-500/5 border-gold-500/20 rounded-tl-none text-slate-200'
                          }`}>
                            {/* Sender title */}
                            <div className="flex items-center gap-1.5 justify-between border-b border-slate-800/40 pb-1 mb-1 text-[10px]">
                              <span className={`font-extrabold ${isAdmin ? 'text-gold-400' : 'text-slate-400'}`}>
                                {isAdmin ? 'پشتیبانی و طراح گالری آونتورین' : 'شما'}
                              </span>
                              <span className="text-[9px] text-slate-500 font-en-nums">
                                {new Date(msg.createdAt || Date.now()).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            {/* Message text content */}
                            <p className="text-xs leading-relaxed text-justify whitespace-pre-wrap">{msg.message}</p>

                            {/* Message attached sketch/image */}
                            {msg.imageUrl && (
                              <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-850 max-h-48">
                                <img
                                  src={msg.imageUrl}
                                  alt="Attached Sketch"
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

                {/* Sub-Pane 4: Input Panel */}
                <form onSubmit={handleSendChatMessage} className="space-y-3 pt-3 border-t border-slate-800">
                  
                  {/* Chat image attachment draft preview */}
                  {chatImageBase64 && (
                    <div className="relative rounded-xl bg-slate-950 border border-slate-800 p-1.5 inline-flex items-center gap-2 pr-3">
                      <span className="text-[10px] text-slate-400">یک تصویر پیوست شد</span>
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
                    {/* Send button */}
                    <button
                      type="submit"
                      disabled={chatLoading || (!chatInput.trim() && !chatImageBase64)}
                      className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-gold-500 text-slate-950 hover:bg-gold-400 active:scale-95 transition-all cursor-pointer disabled:opacity-40"
                    >
                      <Send size={16} />
                    </button>

                    {/* Text field input */}
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="پیام خود را به طراح گالری بنویسید..."
                      className="w-full h-10 rounded-xl bg-slate-950 border border-slate-800 px-4 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-gold-500/50"
                    />

                    {/* Attachment trigger */}
                    <button
                      type="button"
                      onClick={() => chatFileInputRef.current?.click()}
                      className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-gold-400 transition-colors"
                      title="ارسال عکس/اسکچ طرح"
                    >
                      <Paperclip size={18} />
                      <input
                        type="file"
                        ref={chatFileInputRef}
                        onChange={(e) => handleFileChange(e, true)}
                        className="hidden"
                        accept="image/*"
                      />
                    </button>
                  </div>
                </form>

              </div>
            ) : (
              <div className="hidden lg:flex lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 h-[650px] items-center justify-center text-center text-slate-500">
                <div className="space-y-2">
                  <MessageCircle className="mx-auto text-slate-700 mb-2" size={32} />
                  <p className="text-sm">جهت بارگذاری گفتگو، مشاهده شناسنامه ساخت یا دریافت پیش‌فاکتور، یکی از سفارش‌های خود را در ریل سمت راست انتخاب کنید.</p>
                </div>
              </div>
            )}

          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
