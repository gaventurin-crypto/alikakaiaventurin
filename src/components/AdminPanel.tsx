import React, { useState, useEffect } from 'react';
import {
  Plus, Trash2, Edit3, Package, Users, DollarSign, AlertCircle, Search,
  RefreshCw, Eye, CheckCircle, Clock, Settings, Tag, FileText, ChevronDown,
  ToggleLeft, Lock, ArrowRight, BookOpen, Compass, ShieldAlert, CheckSquare, X,
  Database, Server, AlertTriangle, Images, Minus, Menu, Info, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Order, Coupon } from '../types';
import { formatPersianPrice, formatPersianNumber } from './ProductCard';
import { api } from '../lib/api';
import AdminHandmades from './AdminHandmades';
import ConfirmModal, { ConfirmDialogConfig } from './ConfirmModal';
import { ProductImageGalleryManager } from './ProductImageGalleryManager';

interface AdminPanelProps {
  currentUser?: any;
  products: Product[];
  orders: Order[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onEditProduct: (id: string, product: Partial<Product>) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateOrderStatus: (id: string, status: string) => void;

  // New features
  categories: Array<{ id: string; name: string }>;
  onAddCategory: (id: string, name: string) => void;
  onDeleteCategory: (id: string) => void;

  users: Array<{ id: string; name: string; email: string; role: 'admin' | 'user' | 'superadmin'; status: 'active' | 'blocked'; phone?: string; birthDate?: string; points?: number }>;
  onUpdateUser: (id: string, updates: any) => void;

  coupons: Coupon[];
  onAddCoupon: (coupon: Coupon) => void;
  onDeleteCoupon: (code: string) => void;

  cmsTexts: { about: string; terms: string; contact: string };
  onUpdateCMSTexts: (cms: any) => void;

  storeSettings: { currencyUnit: 'تومان' | 'ریال'; shippingCost: number; taxPercent: number };
  onUpdateStoreSettings: (settings: any) => void;
}

export default function AdminPanel({
  currentUser,
  products,
  orders,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onUpdateOrderStatus,
  categories,
  onAddCategory,
  onDeleteCategory,
  users,
  onUpdateUser,
  coupons,
  onAddCoupon,
  onDeleteCoupon,
  cmsTexts,
  onUpdateCMSTexts,
  storeSettings,
  onUpdateStoreSettings,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'categories' | 'orders' | 'users' | 'cms' | 'coupons' | 'settings' | 'handmades' | 'inventory' | 'support'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');

  // --- SMART INVENTORY AND WAREHOUSE MANAGEMENT STATES ---
  const [inventoryLogs, setInventoryLogs] = useState<any[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState(false);
  const [invProductId, setInvProductId] = useState('');
  const [invType, setInvType] = useState<'in' | 'out' | 'damage' | 'adjustment'>('in');
  const [invQty, setInvQty] = useState<number | ''>('');
  const [invDescription, setInvDescription] = useState('');
  const [invOperator, setInvOperator] = useState('مدیر سیستم');
  const [invLogSearch, setInvLogSearch] = useState('');
  const [invLogTypeFilter, setInvLogTypeFilter] = useState('all');

  const fetchInventoryLogs = () => {
    setIsLogsLoading(true);
    api.getInventoryLogs()
      .then(setInventoryLogs)
      .catch(err => triggerToast('خطا در دریافت تاریخچه دفتر معین انبار.', 'error'))
      .finally(() => setIsLogsLoading(false));
  };

  useEffect(() => {
    if (activeTab === 'inventory') {
      fetchInventoryLogs();
      // Set default product ID if available
      if (products && products.length > 0 && !invProductId) {
        setInvProductId(products[0].id);
      }
    }
  }, [activeTab]);
  const [dbStatus, setDbStatus] = useState<{ isMongo: boolean; hasUri: boolean; provider: 'mongodb' | 'json-db' } | null>(null);

  // --- LUXURY NOTIFICATION & CONFIRMATION STATES ---
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogConfig | null>(null);

  // Mobile Layout states
  const [isMobileTabMenuOpen, setIsMobileTabMenuOpen] = useState(false);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);

  // --- SUPERADMIN USER CREATION STATES ---
  const [newUserName, setNewUserName] = useState('');
  const [newUserLastName, setNewUserLastName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'user' | 'admin' | 'superadmin'>('admin');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserBirthDate, setNewUserBirthDate] = useState('');
  const [newUserPoints, setNewUserPoints] = useState<number>(0);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [userPointsEdits, setUserPointsEdits] = useState<Record<string, number>>({});

  // --- ADMIN SUPPORT TICKETS AND REAL-TIME MESSAGING ---
  const [adminTickets, setAdminTickets] = useState<any[]>([]);
  const [adminActiveTicketId, setAdminActiveTicketId] = useState<string | null>(null);
  const [adminTicketMessages, setAdminTicketMessages] = useState<any[]>([]);
  const [adminChatInput, setAdminChatInput] = useState('');
  const [isAdminTicketsLoading, setIsAdminTicketsLoading] = useState(false);
  const [isAdminTicketChatLoading, setIsAdminTicketChatLoading] = useState(false);

  const fetchAdminTickets = async () => {
    setIsAdminTicketsLoading(true);
    try {
      const list = await api.getAllAdminTickets();
      setAdminTickets(list);
    } catch (e) {
      console.error(e);
      triggerToast('خطا در بارگذاری تیکت‌های پشتیبانی برای مدیریت.', 'error');
    } finally {
      setIsAdminTicketsLoading(false);
    }
  };

  const fetchAdminTicketChat = async (ticketId: string) => {
    setIsAdminTicketChatLoading(true);
    try {
      const msgs = await api.getTicketChat(ticketId);
      setAdminTicketMessages(msgs);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAdminTicketChatLoading(false);
    }
  };

  const handleAdminSendTicketMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminActiveTicketId || !adminChatInput.trim()) return;
    try {
      await api.sendTicketChatMessage(adminActiveTicketId, adminChatInput);
      setAdminChatInput('');
      fetchAdminTicketChat(adminActiveTicketId);
      fetchAdminTickets();
      triggerToast('پاسخ شما با موفقیت ارسال شد.', 'success');
    } catch (err: any) {
      triggerToast(err.message || 'خطا در ارسال پاسخ.', 'error');
    }
  };

  const handleCloseTicket = async (ticketId: string) => {
    try {
      await api.updateTicketStatus(ticketId, 'closed');
      fetchAdminTickets();
      setAdminActiveTicketId(null);
      triggerToast('تیکت با موفقیت بسته شد.', 'success');
    } catch (err: any) {
      triggerToast(err.message || 'خطا در بستن تیکت.', 'error');
    }
  };

  const handleMarkAsAnswered = async (ticketId: string) => {
    try {
      await api.updateTicketStatus(ticketId, 'answered');
      fetchAdminTickets();
      triggerToast('وضعیت تیکت به پاسخ‌داده‌شده تغییر یافت.', 'success');
    } catch (err: any) {
      triggerToast(err.message || 'خطا در تغییر وضعیت تیکت.', 'error');
    }
  };

  // --- SUPERADMIN USER ACTIONS AND CREATION HANDLERS ---
  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail || !newUserPassword) {
      triggerToast('وارد کردن نام، پست الکترونیک و کلمه عبور الزامی است.', 'error');
      return;
    }
    setIsCreatingUser(true);
    try {
      await api.createAdminUser({
        name: newUserName,
        lastName: newUserLastName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
        phone: newUserPhone,
        birthDate: newUserBirthDate,
        points: Number(newUserPoints || 0),
        status: 'active'
      });
      triggerToast(`کاربر جدید با نقش ${newUserRole === 'superadmin' ? 'مدیر کل' : newUserRole === 'admin' ? 'مدیر سیستم' : 'کاربر عادی'} ثبت گردید.`, 'success');
      setNewUserName('');
      setNewUserLastName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserPhone('');
      setNewUserBirthDate('');
      setNewUserPoints(0);
      onUpdateUser('', { refreshOnly: true });
    } catch (err: any) {
      triggerToast(err.message || 'خطا در ساخت کاربر جدید.', 'error');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin' | 'superadmin') => {
    try {
      await api.updateAdminUserRole(userId, newRole);
      triggerToast('نقش کاربری با موفقیت تغییر یافت.', 'success');
      onUpdateUser('', { refreshOnly: true });
    } catch (err: any) {
      triggerToast(err.message || 'خطا در تغییر نقش کاربر.', 'error');
    }
  };

  const handleDeleteUserSubmit = async (userId: string) => {
    setConfirmModal({
      title: 'حذف دائم کاربر',
      message: 'آیا از حذف دائم این کاربر اطمینان دارید؟ تمام سوابق و سفارشات مرتبط حذف خواهند شد.',
      onConfirm: async () => {
        try {
          await api.deleteAdminUser(userId);
          triggerToast('کاربر با موفقیت از سیستم حذف گردید.', 'success');
          onUpdateUser('', { refreshOnly: true });
        } catch (err: any) {
          triggerToast(err.message || 'خطا در حذف کاربر.', 'error');
        } finally {
          setConfirmModal(null);
        }
      }
    });
  };

  const handlePointsChangeSubmit = async (userId: string, newPoints: number) => {
    try {
      await api.updateUser(userId, { points: newPoints });
      triggerToast(`امتیاز وفاداری با موفقیت به ${formatPersianNumber(newPoints)} تغییر یافت.`, 'success');
      onUpdateUser('', { refreshOnly: true });
    } catch (err: any) {
      triggerToast(err.message || 'خطا در تغییر امتیاز کاربر.', 'error');
    }
  };

  useEffect(() => {
    let interval: any;
    if (adminActiveTicketId) {
      fetchAdminTicketChat(adminActiveTicketId);
      interval = setInterval(() => {
        fetchAdminTicketChat(adminActiveTicketId);
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [adminActiveTicketId]);

  useEffect(() => {
    if (activeTab === 'support') {
      fetchAdminTickets();
    }
  }, [activeTab]);

  const triggerToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  useEffect(() => {
    api.getDbStatus()
      .then(status => setDbStatus(status))
      .catch(err => console.error("Could not fetch database connection status", err));
  }, []);

  // 1. PRODUCT FORM STATE
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [discount, setDiscount] = useState<number | ''>('');
  const [category, setCategory] = useState<string>('necklace');
  const [stock, setStock] = useState<number | ''>('');
  const [image, setImage] = useState('');
  const [variantsText, setVariantsText] = useState('طلایی، نقره‌ای');
  const [variantsList, setVariantsList] = useState<string[]>(['طلایی', 'نقره‌ای']);
  const [newVariantInput, setNewVariantInput] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [selectedGalleryProduct, setSelectedGalleryProduct] = useState<Product | null>(null);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Preset accessory images
  const imagePresets = [
    { name: 'گردنبند تک‌نگین', path: '/src/assets/images/luxury_necklace_1784386427279.jpg' },
    { name: 'انگشتر زمرد کلمبیا', path: '/src/assets/images/luxury_ring_1784386441851.jpg' },
    { name: 'گوشواره مروارید', path: '/src/assets/images/luxury_earrings_1784386456583.jpg' },
    { name: 'دستبند زنجیری', path: '/src/assets/images/luxury_bracelet_1784386471951.jpg' },
  ];

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !category || stock === '' || !image) {
      triggerToast('لطفاً تمامی فیلدهای الزامی ستاره‌دار را پر کنید.', 'error');
      return;
    }

    const productData = {
      title,
      description,
      price: Number(price),
      discount: discount !== '' ? Number(discount) : 0,
      category,
      stock: Number(stock),
      image,
      variants: variantsList,
      isFeatured,
      isActive,
      rating: 4.8,
    };

    if (editingId) {
      onEditProduct(editingId, productData);
      triggerToast(`تغییرات محصول "${title}" با موفقیت ذخیره و اعمال شد.`, 'success');
      setEditingId(null);
    } else {
      onAddProduct(productData);
      triggerToast(`کالای جدید "${title}" با موفقیت به انبار فروشگاه افزوده شد.`, 'success');
    }

    setIsProductFormOpen(false); // Close mobile drawer/modal

    // Reset Form
    setTitle('');
    setDescription('');
    setPrice('');
    setDiscount('');
    setCategory('necklace');
    setStock('');
    setImage('');
    setVariantsList(['طلایی', 'نقره‌ای']);
    setIsFeatured(false);
    setIsActive(true);
  };

  const handleEditInit = (p: Product) => {
    setEditingId(p.id);
    setTitle(p.title);
    setDescription(p.description);
    setPrice(p.price);
    setDiscount(p.discount || '');
    setCategory(p.category);
    setStock(p.stock);
    setImage(p.image);
    setVariantsList(p.variants || []);
    setIsFeatured(p.isFeatured || false);
    setIsActive(p.isActive !== false);
    setIsProductFormOpen(true); // Automatically open the sliding sheet on mobile!
    window.scrollTo({ top: 150, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setPrice('');
    setDiscount('');
    setCategory('necklace');
    setStock('');
    setImage('');
    setVariantsList(['طلایی', 'نقره‌ای']);
    setIsFeatured(false);
    setIsActive(true);
    setIsProductFormOpen(false);
  };

  // Inline Quick Stock adjustment functions (No full submit required!)
  const handleQuickStockUpdate = async (p: Product, delta: number) => {
    const newStock = Math.max(0, p.stock + delta);
    try {
      await onEditProduct(p.id, { stock: newStock });
      triggerToast(`موجودی محصول "${p.title}" به ${formatPersianNumber(newStock)} عدد تغییر یافت.`, 'success');
    } catch (err: any) {
      triggerToast(err.message || 'خطا در ثبت موجودی جدید.', 'error');
    }
  };

  const handleQuickStockInput = async (p: Product, val: number) => {
    if (isNaN(val) || val < 0) return;
    try {
      await onEditProduct(p.id, { stock: val });
      triggerToast(`موجودی محصول "${p.title}" به ${formatPersianNumber(val)} عدد تغییر یافت.`, 'success');
    } catch (err: any) {
      triggerToast(err.message || 'خطا در تغییر موجودی کالا.', 'error');
    }
  };

  // 2. CATEGORY FORM STATE
  const [newCatId, setNewCatId] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatId || !newCatName) return;
    onAddCategory(newCatId.toLowerCase().trim(), newCatName.trim());
    triggerToast(`دسته‌بندی جدید "${newCatName}" با موفقیت ثبت شد.`, 'success');
    setNewCatId('');
    setNewCatName('');
  };

  // 3. COUPONS FORM STATE
  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState<'percent' | 'amount'>('percent');
  const [couponValue, setCouponValue] = useState<number | ''>('');
  const [couponExpiry, setCouponExpiry] = useState('');
  const [couponLimit, setCouponLimit] = useState<number | ''>('');

  const handleCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode || !couponValue || !couponExpiry || !couponLimit) return;
    onAddCoupon({
      code: couponCode.toUpperCase().trim(),
      type: couponType,
      value: Number(couponValue),
      expiryDate: couponExpiry,
      usageLimit: Number(couponLimit),
      usageCount: 0,
    });
    triggerToast(`کد تخفیف جدید "${couponCode.toUpperCase().trim()}" با موفقیت فعال شد.`, 'success');
    setCouponCode('');
    setCouponValue('');
    setCouponExpiry('');
    setCouponLimit('');
  };

  // 4. CMS FORM STATE
  const [cmsAbout, setCmsAbout] = useState(cmsTexts?.about || '');
  const [cmsTerms, setCmsTerms] = useState(cmsTexts?.terms || '');
  const [cmsContact, setCmsContact] = useState(cmsTexts?.contact || '');

  // Sub-tab state for CMS
  const [cmsSubTab, setCmsSubTab] = useState<'banners' | 'middle' | 'header' | 'footer' | 'pages'>('banners');

  // Header state
  const [headerLogoText, setHeaderLogoText] = useState('');
  const [headerTopAlert, setHeaderTopAlert] = useState('');
  const [headerMenuItems, setHeaderMenuItems] = useState<any[]>([]);

  // Banners state
  const [cmsBanners, setCmsBanners] = useState<any[]>([]);

  // Middle sections state
  const [cmsMiddleSections, setCmsMiddleSections] = useState<any[]>([]);

  // Footer state
  const [footerBrandIntro, setFooterBrandIntro] = useState('');
  const [footerCopyText, setFooterCopyText] = useState('');
  const [footerPhone, setFooterPhone] = useState('');
  const [footerEmail, setFooterEmail] = useState('');
  const [footerAddress, setFooterAddress] = useState('');
  const [footerWorkingHours, setFooterWorkingHours] = useState('');
  const [footerQuickLinks, setFooterQuickLinks] = useState<any[]>([]);
  const [footerSocialLinks, setFooterSocialLinks] = useState<any[]>([]);

  useEffect(() => {
    if (cmsTexts) {
      setCmsAbout(cmsTexts.about || '');
      setCmsTerms(cmsTexts.terms || '');
      setCmsContact(cmsTexts.contact || '');
      
      const h = (cmsTexts as any).header || {};
      setHeaderLogoText(h.logoText || 'آونتورین');
      setHeaderTopAlert(h.topAlertText || '✨ ارسال رایگان خرید‌های بالای ۱ میلیون تومان | ضمانت اصالت و تعویض ۷ روزه ✨');
      setHeaderMenuItems(h.menuItems || [
        { id: '1', title: 'صفحه اصلی', link: '/home', order: 1 },
        { id: '2', title: 'کاتالوگ محصولات', link: '/catalog', order: 2 },
        { id: '3', title: 'درباره ما', link: '/about', order: 3 },
        { id: '4', title: 'تماس با ما', link: '/contact', order: 4 },
        { id: '5', title: 'قوانین و مقررات', link: '/terms', order: 5 }
      ]);

      setCmsBanners((cmsTexts as any).banners || [
        {
          id: 'b-default',
          title: 'زیبایی اصیل در جزییات درخشان گالری آونتورین',
          subtitle: 'کلکسیون جدید زیورآلات طلایی آبکاری شده ۱۴۰۵',
          imageUrl: '/src/assets/images/jewelry_hero_banner_1784386410125.jpg',
          buttonText: 'مشاهده کاتالوگ فروشگاه',
          buttonLink: '/catalog',
          isActive: true,
          order: 1
        }
      ]);

      setCmsMiddleSections((cmsTexts as any).middleSections || [
        {
          id: 'm-default-1',
          title: 'کیفیت و دوام بی‌نظیر بدلیجات لوکس',
          subtitle: 'تضمین ثبات رنگ اکسسوری‌ها، عدم استفاده از نیکل (ضدحساسیت) و استفاده از مروارید‌های صدفی طبیعی آب شیرین.',
          imageUrl: '/src/assets/images/aventurin_jewelry_crafting_1784400780210.jpg',
          link: '/about',
          isActive: true,
          order: 1
        }
      ]);

      const f = (cmsTexts as any).footer || {};
      setFooterBrandIntro(f.brandIntro || 'گالری آونتورین ارائه‌دهنده باکیفیت‌ترین و ظریف‌ترین اکسسوری‌ها و بدلیجات لوکس و آبکاری طلا با مروارید‌های طبیعی صدفی آب شیرین.');
      setFooterCopyText(f.copyText || '© ۱۴۰۵ تمامی حقوق برای گالری آونتورین محفوظ است.');
      setFooterPhone(f.phone || '۰۹۱۲۳۴۵۶۷۸۹');
      setFooterEmail(f.email || 'info@aventurin.com');
      setFooterAddress(f.address || 'تهران، خیابان ولیعصر، مجتمع تجاری لوکس، طبقه اول، واحد ۱۲');
      setFooterWorkingHours(f.workingHours || 'شنبه تا پنجشنبه ساعت ۱۰ الی ۲۱');
      setFooterQuickLinks(f.quickLinks || [
        { id: 'ql-1', title: 'کاتالوگ محصولات', link: '/catalog' },
        { id: 'ql-2', title: 'درباره ما', link: '/about' },
        { id: 'ql-3', title: 'تماس با ما', link: '/contact' },
        { id: 'ql-4', title: 'قوانین و شرایط مرجوعی', link: '/terms' }
      ]);
      setFooterSocialLinks(f.socialLinks || [
        { id: 'sl-1', name: 'اینستاگرام', url: 'https://instagram.com/aventurin', icon: 'instagram' },
        { id: 'sl-2', name: 'تلگرام', url: 'https://t.me/aventurin', icon: 'telegram' }
      ]);
    }
  }, [cmsTexts]);

  const handleCmsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCMSTexts({
      about: cmsAbout,
      terms: cmsTerms,
      contact: cmsContact,
      header: {
        logoText: headerLogoText,
        topAlertText: headerTopAlert,
        menuItems: headerMenuItems,
      },
      banners: cmsBanners,
      middleSections: cmsMiddleSections,
      footer: {
        brandIntro: footerBrandIntro,
        copyText: footerCopyText,
        phone: footerPhone,
        email: footerEmail,
        address: footerAddress,
        workingHours: footerWorkingHours,
        quickLinks: footerQuickLinks,
        socialLinks: footerSocialLinks,
      }
    });
    triggerToast('تغییرات محتوای CMS با موفقیت ذخیره و در سایت اعمال شد!', 'success');
  };

  // 5. SETTINGS FORM STATE
  const [setCurrency, setSetCurrency] = useState<'تومان' | 'ریال'>(storeSettings.currencyUnit);
  const [setShipping, setSetShipping] = useState<number>(storeSettings.shippingCost);
  const [setTax, setSetTax] = useState<number>(storeSettings.taxPercent);

  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateStoreSettings({
      currencyUnit: setCurrency,
      shippingCost: Number(setShipping),
      taxPercent: Number(setTax),
    });
    triggerToast('تنظیمات پایه و مالی درگاه با موفقیت به‌روزرسانی شد!', 'success');
  };

  // Calculations for Dashboard
  const totalRevenue = orders
    .filter((o) => o.paymentStatus === 'success')
    .reduce((sum, o) => sum + o.totalPrice, 0);

  const totalSalesCount = orders.filter((o) => o.paymentStatus === 'success').length;
  const lowStockCount = products.filter((p) => p.stock <= 3 && p.stock > 0).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  const filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 text-right text-slate-100" dir="rtl">
      
      {/* Title & Responsive Tab Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between border-b border-slate-800 pb-5 mb-8 gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-gold-500 animate-pulse inline-block"></span>
            پنل مدیریت پیشرفته گالری آونتورین
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            کنترل انبار، تعریف کوپن‌های تخفیف، ویرایش اطلاعات ایستای CMS و مانیتورینگ سفارشات
          </p>
        </div>

        {/* Desktop Tab Switcher (Visible on Large Screens) */}
        <div className="hidden lg:flex flex-wrap gap-2">
          {[
            { id: 'dashboard', name: 'داشبورد آمار', icon: <DollarSign size={14} /> },
            { id: 'products', name: 'محصولات', icon: <Package size={14} /> },
            { id: 'categories', name: 'دسته‌بندی‌ها', icon: <Compass size={14} /> },
            { id: 'orders', name: 'سفارش‌ها', icon: <Clock size={14} /> },
            { id: 'users', name: 'کاربران', icon: <Users size={14} /> },
            { id: 'coupons', name: 'کوپن تخفیف', icon: <Tag size={14} /> },
            { id: 'cms', name: 'محتوای CMS', icon: <FileText size={14} /> },
            { id: 'handmades', name: 'سفارشات دست‌ساز', icon: <RefreshCw size={14} /> },
            { id: 'inventory', name: 'انبارداری هوشمند', icon: <Database size={14} /> },
            { id: 'settings', name: 'تنظیمات', icon: <Settings size={14} /> },
            { id: 'support', name: 'پشتیبانی تیکت‌ها', icon: <HelpCircle size={14} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === tab.id 
                  ? 'bg-gold-500 text-slate-950 font-bold shadow-lg shadow-gold-500/15 scale-[1.02]' 
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {tab.icon}
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Mobile & Tablet Tab Selector Dropdown Menu */}
        <div className="block lg:hidden relative w-full">
          <button
            onClick={() => setIsMobileTabMenuOpen(!isMobileTabMenuOpen)}
            className="w-full flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-200 font-bold hover:border-gold-500/30 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2 text-gold-400">
              {(() => {
                const map: Record<string, any> = {
                  dashboard: <DollarSign size={16} />,
                  products: <Package size={16} />,
                  categories: <Compass size={16} />,
                  orders: <Clock size={16} />,
                  users: <Users size={16} />,
                  coupons: <Tag size={16} />,
                  cms: <FileText size={16} />,
                  handmades: <RefreshCw size={16} />,
                  inventory: <Database size={16} />,
                  settings: <Settings size={16} />,
                  support: <HelpCircle size={16} />,
                };
                return map[activeTab] || <Package size={16} />;
              })()}
              <span className="text-slate-100 font-bold">
                ابزار فعلی: {(() => {
                  const map: Record<string, string> = {
                    dashboard: 'داشبورد آمار',
                    products: 'مدیریت محصولات و کالاها',
                    categories: 'مدیریت دسته‌بندی‌ها',
                    orders: 'تراکنش‌ها و سفارش‌ها',
                    users: 'مدیریت کاربران سیستم',
                    coupons: 'کوپن تخفیف و پروموشن',
                    cms: 'تغییر محتوای پویا (CMS)',
                    handmades: 'سفارشات دست‌ساز سفارشی',
                    inventory: 'سیستم انبارداری و کنترل موجودی هوشمند',
                    settings: 'تنظیمات پایه و مالی فروشگاه',
                    support: 'مرکز تیکت‌های پشتیبانی کاربران',
                  };
                  return map[activeTab] || 'محصولات';
                })()}
              </span>
            </div>
            <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isMobileTabMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isMobileTabMenuOpen && (
              <>
                {/* Backdrop overlay */}
                <div className="fixed inset-0 z-30" onClick={() => setIsMobileTabMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-40 p-2 divide-y divide-slate-850/60 overflow-hidden"
                >
                  {[
                    { id: 'dashboard', name: 'داشبورد آمار و تحلیل', icon: <DollarSign size={15} /> },
                    { id: 'products', name: 'مدیریت محصولات و انبار', icon: <Package size={15} /> },
                    { id: 'categories', name: 'مدیریت دسته‌بندی‌ها', icon: <Compass size={15} /> },
                    { id: 'orders', name: 'مدیریت فاکتورها و سفارش‌ها', icon: <Clock size={15} /> },
                    { id: 'users', name: 'مدیریت کاربران و دسترسی‌ها', icon: <Users size={15} /> },
                    { id: 'coupons', name: 'مدیریت کوپن‌های تخفیف', icon: <Tag size={15} /> },
                    { id: 'cms', name: 'محتوای پویا و صفحات CMS', icon: <FileText size={15} /> },
                    { id: 'handmades', name: 'سفارشات دست‌ساز گالری', icon: <RefreshCw size={15} /> },
                    { id: 'inventory', name: 'مدیریت انبارداری و کنترل موجودی', icon: <Database size={15} /> },
                    { id: 'settings', name: 'تنظیمات پایه و نرخ‌ها', icon: <Settings size={15} /> },
                    { id: 'support', name: 'پشتیبانی تیکت‌ها و گفتگو', icon: <HelpCircle size={15} /> },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as any);
                        setIsMobileTabMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-xs text-right transition-colors cursor-pointer ${
                        activeTab === tab.id 
                          ? 'bg-gold-500/10 text-gold-400 font-extrabold' 
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/40'
                      }`}
                    >
                      <span className={activeTab === tab.id ? 'text-gold-400' : 'text-slate-500'}>
                        {tab.icon}
                      </span>
                      <span>{tab.name}</span>
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Database Connection Status Notification Banner */}
      {dbStatus && (
        <div className="mb-8">
          {dbStatus.isMongo ? (
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-xs text-emerald-400">
              <Database size={18} className="shrink-0" />
              <div>
                <span className="font-extrabold block">اتصال امن به پایگاه داده ابری (MongoDB Atlas) برقرار است</span>
                <span className="text-[10px] text-emerald-500/80 mt-0.5 block">تمام اطلاعات فروشگاه شما به طور خودکار روی سرویس ابری همگام‌سازی می‌شود.</span>
              </div>
            </div>
          ) : dbStatus.hasUri ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-xs text-amber-400">
              <div className="flex items-start gap-3 flex-1">
                <AlertTriangle size={20} className="shrink-0 text-amber-500 mt-0.5" />
                <div>
                  <span className="font-extrabold block text-sm">⚠️ هشدار: عدم امکان اتصال به خوشه MongoDB Atlas (احتمالاً به دلیل محدودیت IP)</span>
                  <p className="text-[10px] text-amber-500/80 mt-1 leading-relaxed">
                    متغیر MONGODB_URI در محیط برنامه شما تعریف شده است، اما ارتباط با سرور MongoDB به دلیل مسدود بودن IP سرور در فایروال اطلس با شکست مواجه شد.
                    <span className="font-bold text-slate-100 block mt-1.5 bg-slate-950/40 p-2 rounded-xl border border-slate-800">
                      💡 راه‌حل هوشمند سیستم: جای نگرانی نیست! جهت تداوم فروشگاه و جلوگیری از اختلال در کارکرد سبد خرید، کاتالوگ و ثبت سفارش، سیستم به صورت کاملاً خودکار به بانک اطلاعاتی محلی JSON-DB سوئیچ کرده است. پس از ثبت و مجوزدهی به آی‌پی در پنل اطلس، سیستم به شکل زنده به دیتابیس ابری متصل خواهد شد.
                    </span>
                  </p>
                </div>
              </div>
              <div className="mt-3 sm:mt-0 shrink-0 text-left">
                <a
                  href="https://www.mongodb.com/docs/atlas/security-whitelist/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg px-4 py-2 text-xs text-center transition-all shadow"
                >
                  آموزش ثبت IP اطلس
                </a>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400">
              <Server size={18} className="shrink-0" />
              <div>
                <span className="font-extrabold block">پایگاه داده محلی بسیار بهینه فعال است</span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">برای استفاده از دیتابیس ابری، متغیر MONGODB_URI را در بخش تنظیمات AI Studio اضافه کنید.</span>
              </div>
            </div>
          )}
        </div>
      )}

      <AnimatePresence mode="wait">
        
        {/* ================= TAB 1: DASHBOARD ================= */}
        {activeTab === 'dashboard' && (
          <motion.div
            key="dash-tab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            {/* Bento Grid counters */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
                <span className="text-[10px] text-slate-500 block">کل فروش موفق درگاه</span>
                <h4 className="text-base sm:text-lg font-black text-emerald-400 font-en-nums">{formatPersianPrice(totalRevenue)}</h4>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
                <span className="text-[10px] text-slate-500 block">سفارشات تحویل شده</span>
                <h4 className="text-base sm:text-lg font-black text-slate-100 font-en-nums">{formatPersianNumber(totalSalesCount)} فاکتور</h4>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
                <span className="text-[10px] text-slate-500 block">آیتم‌های روبه اتمام</span>
                <h4 className="text-base sm:text-lg font-black text-amber-500 font-en-nums">{formatPersianNumber(lowStockCount)} محصول</h4>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
                <span className="text-[10px] text-slate-500 block">اقلام کاملا ناموجود</span>
                <h4 className="text-base sm:text-lg font-black text-rose-500 font-en-nums">{formatPersianNumber(outOfStockCount)} تنوع</h4>
              </div>
            </div>

            {/* Simulated monthly sales bar-chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div>
                <h3 className="text-xs font-extrabold text-gold-400">نمودار ستونی فروش ماهانه ۱۴۰۵ (تومان)</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">شبیه‌سازی تراکنش‌های مالی گالری</p>
              </div>

              <div className="flex h-36 items-end gap-3 pt-6 border-b border-slate-800">
                {[
                  { month: 'فروردین', sales: 4500000, h: 'h-[30%]' },
                  { month: 'اردیبهشت', sales: 6200000, h: 'h-[45%]' },
                  { month: 'خرداد', sales: 8100000, h: 'h-[60%]' },
                  { month: 'تیر', sales: 12500000, h: 'h-[95%]', active: true },
                ].map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <div className="w-full text-center text-[9px] text-slate-400 font-en-nums truncate">{formatPersianPrice(item.sales)}</div>
                    <div className={`w-full rounded-t-lg ${item.active ? 'bg-gold-500' : 'bg-slate-800'} ${item.h} transition-all hover:opacity-85`} />
                    <span className="text-[10px] text-slate-500 pt-1">{item.month}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Orders inside Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
                <h3 className="text-xs font-black text-slate-100">سفارشات اخیر فاکتور شده</h3>
                {orders.length === 0 ? (
                  <p className="text-xs text-slate-500">هیچ سفارش ثبت شده‌ای پیدا نشد.</p>
                ) : (
                  <div className="divide-y divide-slate-850">
                    {orders.slice(-4).reverse().map(o => (
                      <div key={o.id} className="flex justify-between items-center py-2.5 text-xs font-en-nums">
                        <div>
                          <span className="font-bold text-slate-200 block">{o.customerName}</span>
                          <span className="text-[10px] text-slate-500">کد رهگیری: {o.trackingCode}</span>
                        </div>
                        <div className="text-left">
                          <span className="font-black text-gold-400 block">{formatPersianPrice(o.totalPrice)}</span>
                          <span className={`text-[9px] rounded-full px-1.5 py-0.5 ${o.paymentStatus === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                            {o.paymentStatus === 'success' ? 'موفق' : 'ناموفق / منتظر'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stock alerts column */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
                <h3 className="text-xs font-black text-slate-100">محصولات با موجودی بحرانی</h3>
                <div className="space-y-3">
                  {products.filter(p => p.stock <= 4).slice(0, 4).map(p => (
                    <div key={p.id} className="flex items-center gap-3 bg-slate-950 p-2 rounded-xl border border-slate-850">
                      <img src={p.image} className="h-10 w-10 rounded-lg object-cover bg-slate-900" referrerPolicy="no-referrer" />
                      <div className="flex-1 min-w-0 text-right">
                        <span className="text-xs font-bold text-slate-200 truncate block">{p.title}</span>
                        <span className="text-[9px] text-slate-500">موجودی انبار: {formatPersianNumber(p.stock)} عدد</span>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-1 rounded ${p.stock === 0 ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {p.stock === 0 ? 'اتمام موجودی' : 'روبه اتمام'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </motion.div>
        )}

        {/* ================= TAB 2: PRODUCTS ================= */}
        {activeTab === 'products' && (
          <motion.div
            key="prod-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* 
              Desktop Sidebar Form (Visible on large screens only).
              Avoids visual clutter on wide screens.
            */}
            <div className="hidden lg:block lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 h-fit space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                <h3 className="text-sm font-black text-gold-400">
                  {editingId ? '✍️ ویرایش اطلاعات کالا' : '➕ افزودن محصول جدید به انبار'}
                </h3>
                {editingId && (
                  <button 
                    onClick={cancelEdit} 
                    className="text-[10px] bg-slate-850 hover:bg-slate-800 px-2.5 py-1.5 rounded-lg text-slate-400 font-bold transition-colors cursor-pointer"
                  >
                    لغو ویرایش
                  </button>
                )}
              </div>

              {/* Form content */}
              <form onSubmit={handleProductSubmit} className="space-y-4 text-right">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5">نام کامل کالا *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثال: انگشتر زمرد سلطنتی آبکاری شده"
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 outline-none focus:border-gold-500/50 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1.5">قیمت کالا (تومان) *</label>
                    <input
                      type="number"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="مثال: 980000"
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 outline-none focus:border-gold-500/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1.5">موجودی عددی انبار *</label>
                    <input
                      type="number"
                      required
                      value={stock}
                      onChange={(e) => setStock(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="مثال: 15"
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 outline-none focus:border-gold-500/50 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1.5">تخفیف ویژه (٪)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="مثال: 15"
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 outline-none focus:border-gold-500/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1.5">انتخاب دسته‌بندی *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-xs text-slate-300 outline-none focus:border-gold-500/50 transition-colors"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Dynamic tag-based variants */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5">مدیریت رنگ و تنوع طرح‌ها</label>
                  <div className="flex flex-wrap gap-1.5 mb-2 p-2 bg-slate-950 rounded-xl border border-slate-800">
                    {variantsList.map((v, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 bg-gold-500/10 text-gold-400 border border-gold-500/20 px-2 py-1 rounded-lg text-[10px] font-bold"
                      >
                        <span>{v}</span>
                        <button
                          type="button"
                          onClick={() => setVariantsList(variantsList.filter((_, i) => i !== idx))}
                          className="text-gold-500 hover:text-rose-400 font-bold transition-colors cursor-pointer"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                    {variantsList.length === 0 && (
                      <span className="text-[10px] text-slate-500">بدون تنوع (فقط مدل پایه)</span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newVariantInput}
                      onChange={(e) => setNewVariantInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = newVariantInput.trim();
                          if (val && !variantsList.includes(val)) {
                            setVariantsList([...variantsList, val]);
                            setNewVariantInput('');
                          }
                        }
                      }}
                      placeholder="افزودن تنوع جدید... (کلید Enter)"
                      className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-[10px] text-slate-100 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = newVariantInput.trim();
                        if (val && !variantsList.includes(val)) {
                          setVariantsList([...variantsList, val]);
                          setNewVariantInput('');
                        }
                      }}
                      className="rounded-xl bg-slate-800 hover:bg-slate-750 text-gold-400 border border-slate-800 px-3 py-2 text-[10px] font-bold cursor-pointer"
                    >
                      افزودن
                    </button>
                  </div>
                  
                  {/* Suggestions */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {['طلایی', 'نقره‌ای', 'رزگلد', 'سفید صدفی', 'زمردی', 'یاقوتی', 'فری‌سایز'].map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        disabled={variantsList.includes(sug)}
                        onClick={() => setVariantsList([...variantsList, sug])}
                        className="text-[8px] bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-850 rounded-md px-1.5 py-0.5 transition-all cursor-pointer disabled:opacity-20"
                      >
                        +{sug}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main product image with Base64 File upload */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5">تصویر اصلی محصول *</label>
                  {image && (
                    <div className="relative h-28 w-28 mx-auto mb-3 rounded-2xl overflow-hidden border border-slate-800 group">
                      <img src={image} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-[9px] text-gold-400 font-bold">نمای زنده</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      placeholder="آدرس اینترنتی یا مسیر عکس..."
                      className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 outline-none text-left"
                      dir="ltr"
                    />
                    
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (event.target?.result) {
                                setImage(event.target.result as string);
                                triggerToast('تصویر با موفقیت بارگذاری و اعمال شد.', 'success');
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <button
                        type="button"
                        className="rounded-xl bg-gold-500/10 hover:bg-gold-500/20 border border-gold-500/20 text-gold-400 px-3.5 py-2.5 text-xs font-bold cursor-pointer"
                      >
                        آپلود فایل
                      </button>
                    </div>
                  </div>
                  
                  {/* Presets */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {imagePresets.map((pr, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setImage(pr.path)}
                        className={`text-[8px] rounded-md px-1.5 py-0.5 border transition-all cursor-pointer ${
                          image === pr.path 
                            ? 'border-gold-500 text-gold-400 bg-gold-500/10 font-bold' 
                            : 'border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {pr.name}
                      </button>
                    ))}
                  </div>
                  
                  {/* Advanced Gallery trigger if editing */}
                  {editingId ? (
                    <button
                      type="button"
                      onClick={() => {
                        const prod = products.find(p => p.id === editingId);
                        if (prod) setSelectedGalleryProduct(prod);
                      }}
                      className="w-full mt-3 flex items-center justify-center gap-1.5 bg-slate-950 hover:bg-slate-900 text-slate-300 border border-slate-850 hover:border-slate-800 rounded-xl py-2.5 text-[10px] font-bold transition-all cursor-pointer"
                    >
                      <Images size={13} className="text-gold-400" />
                      <span>مدیریت گالری تصاویر بهینه‌سازی شده این محصول ({products.find(p => p.id === editingId)?.images?.length || 0} عکس فرعی)</span>
                    </button>
                  ) : (
                    <div className="mt-3 text-[9px] text-slate-400 bg-slate-950/45 border border-slate-850 p-2.5 rounded-xl flex items-start gap-1.5 leading-relaxed">
                      <Info size={12} className="text-gold-500 mt-0.5 shrink-0" />
                      <span>پس از ذخیره‌سازی و ثبت کالا در انبار، دکمه «مدیریت آلبوم تصاویر فرعی» برای اضافه کردن گالری تصاویر به کالا فعال خواهد شد.</span>
                    </div>
                  )}
                </div>

                {/* Status Toggles: isFeatured and isActive */}
                <div className="grid grid-cols-2 gap-4 bg-slate-950/40 border border-slate-850 rounded-2xl p-3">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setIsFeatured(!isFeatured)}
                      className={`w-8 h-4.5 rounded-full p-0.5 transition-all duration-200 ${isFeatured ? 'bg-gold-500' : 'bg-slate-800'}`}
                    >
                      <div className={`bg-slate-900 w-3.5 h-3.5 rounded-full shadow-md transition-all duration-200 ${isFeatured ? 'translate-x-3.5' : 'translate-x-0'}`} />
                    </button>
                    <span className="text-[9px] font-black text-slate-300">محصول ویژه</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setIsActive(!isActive)}
                      className={`w-8 h-4.5 rounded-full p-0.5 transition-all duration-200 ${isActive ? 'bg-gold-500' : 'bg-slate-800'}`}
                    >
                      <div className={`bg-slate-900 w-3.5 h-3.5 rounded-full shadow-md transition-all duration-200 ${isActive ? 'translate-x-3.5' : 'translate-x-0'}`} />
                    </button>
                    <span className="text-[9px] font-black text-slate-300">نمایش در سایت</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5">توضیحات و خصوصیات فنی کالا</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="ابعاد، ضد حساسیت بودن عیار آبکاری و ..."
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 outline-none resize-none focus:border-gold-500/50 transition-colors"
                  />
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-800">
                  <button 
                    type="submit" 
                    className="flex-1 rounded-xl bg-gold-500 hover:bg-gold-400 text-slate-950 font-black py-3 text-xs transition-transform hover:scale-[1.01] cursor-pointer"
                  >
                    {editingId ? 'ثبت تغییرات نهایی کالا' : 'افزودن محصول به لیست فروشگاه'}
                  </button>
                </div>
              </form>
            </div>

            {/* 
              Products List section. Fits perfectly next to the form or spans fully on mobile.
            */}
            <div className="col-span-1 lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-100">لیست و وضعیت موجودی انبار کالاها</h3>
                  <p className="text-[10px] text-slate-500 mt-1">تغییر زنده موجودی، افزودن به گالری تصاویر و ویرایش مشخصات کالا</p>
                </div>

                {/* Search Bar & Mobile Add Trigger */}
                <div className="flex items-center gap-2">
                  <div className="relative w-full sm:w-52">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="جستجو در انبار..."
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-slate-100 outline-none focus:border-gold-500/30 transition-colors"
                    />
                    <Search size={14} className="absolute left-3.5 top-2.5 text-slate-500" />
                  </div>

                  {/* Add button visible only on mobile/tablet to toggle sheet drawer */}
                  <button
                    onClick={() => {
                      cancelEdit();
                      setIsProductFormOpen(true);
                    }}
                    className="lg:hidden flex items-center justify-center gap-1 bg-gold-500 text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs shrink-0 cursor-pointer"
                  >
                    <Plus size={16} />
                    <span>کالای جدید</span>
                  </button>
                </div>
              </div>

              {/* 
                DESKTOP TABLE (Visible on medium screen and above) 
              */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 font-bold">
                      <th className="py-3">کالا</th>
                      <th className="py-3">دسته‌بندی</th>
                      <th className="py-3">قیمت اصلی</th>
                      <th className="py-3 text-center">موجودی انبار (تنظیم زنده)</th>
                      <th className="py-3 text-left pl-4">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 font-en-nums">
                    {filteredProducts.map(p => (
                      <tr key={p.id} className="hover:bg-slate-950/20 transition-colors group">
                        <td className="py-3.5 flex items-center gap-3">
                          <img 
                            src={p.image} 
                            className="h-10 w-10 rounded-xl object-cover bg-slate-950 border border-slate-800" 
                            referrerPolicy="no-referrer" 
                          />
                          <div className="max-w-[200px]">
                            <span className="text-slate-200 font-bold block truncate" title={p.title}>{p.title}</span>
                            <span className="text-[9px] text-slate-500 truncate block mt-0.5">
                              {p.variants ? p.variants.join('، ') : 'بدون تنوع'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5">
                          <span className="text-slate-400 font-medium text-[11px]">
                            {categories.find(c => c.id === p.category)?.name || p.category}
                          </span>
                        </td>
                        <td className="py-3.5">
                          {p.discount ? (
                            <div>
                              <span className="text-slate-300 font-bold block">{formatPersianPrice(p.price - (p.price * p.discount / 100))}</span>
                              <span className="text-[10px] text-slate-500 line-through block mt-0.5">{formatPersianPrice(p.price)}</span>
                            </div>
                          ) : (
                            <span className="text-slate-300 font-bold">{formatPersianPrice(p.price)}</span>
                          )}
                        </td>
                        <td className="py-3.5">
                          <div className="flex flex-col items-center gap-1.5">
                            <div className="flex items-center gap-1" dir="ltr">
                              <button
                                onClick={() => handleQuickStockUpdate(p, -1)}
                                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
                                title="کاهش موجودی انبار"
                              >
                                <Minus size={11} />
                              </button>
                              <input
                                type="number"
                                value={p.stock}
                                onChange={(e) => handleQuickStockInput(p, parseInt(e.target.value) || 0)}
                                className="w-12 text-center bg-slate-950 border border-slate-850 rounded-lg text-[11px] py-1 text-slate-100 font-bold outline-none focus:border-gold-500/30"
                              />
                              <button
                                onClick={() => handleQuickStockUpdate(p, 1)}
                                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
                                title="افزایش موجودی انبار"
                              >
                                <Plus size={11} />
                              </button>
                            </div>
                            {p.stock <= 3 && (
                              <span className={`text-[9px] font-extrabold ${p.stock === 0 ? 'text-rose-500' : 'text-amber-500 animate-pulse'}`}>
                                {p.stock === 0 ? '⚠️ تمام شده' : '🚨 رو به اتمام'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 text-left pl-2">
                          <div className="inline-flex items-center gap-1 bg-slate-950 rounded-xl p-1 border border-slate-850">
                            <button 
                              onClick={() => setSelectedGalleryProduct(p)} 
                              className="text-slate-400 hover:text-gold-400 hover:bg-slate-900 p-2 rounded-lg transition-all cursor-pointer" 
                              title="مدیریت آلبوم تصاویر کالا"
                            >
                              <Images size={14} />
                            </button>
                            <button 
                              onClick={() => handleEditInit(p)} 
                              className="text-slate-400 hover:text-blue-400 hover:bg-slate-900 p-2 rounded-lg transition-all cursor-pointer"
                              title="ویرایش مشخصات"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button 
                              onClick={() => {
                                setConfirmModal({
                                  title: 'حذف دائمی محصول از انبار',
                                  message: `آیا از حذف محصول "${p.title}" اطمینان دارید؟ تمام سوابق و گالری این محصول در سیستم به صورت کامل حذف خواهند شد.`,
                                  onConfirm: () => {
                                    onDeleteProduct(p.id);
                                    triggerToast(`محصول "${p.title}" با موفقیت حذف گردید.`, 'success');
                                    setConfirmModal(null);
                                  }
                                });
                              }} 
                              className="text-slate-400 hover:text-rose-400 hover:bg-slate-900 p-2 rounded-lg transition-all cursor-pointer"
                              title="حذف کالا"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 
                MOBILE CARDS GRID (Visible on small screens only).
                Fully optimized touch interface.
              */}
              <div className="block md:hidden space-y-4">
                {filteredProducts.map(p => (
                  <div 
                    key={p.id}
                    className="bg-slate-950 border border-slate-850 rounded-2xl p-4 space-y-4 shadow-md text-right relative overflow-hidden"
                  >
                    {p.stock === 0 && (
                      <div className="absolute top-2 left-2 bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[8px] font-black px-2 py-0.5 rounded-full">
                        ناموجود
                      </div>
                    )}
                    
                    <div className="flex gap-3">
                      <img 
                        src={p.image} 
                        className="h-14 w-14 rounded-xl object-cover bg-slate-900 border border-slate-800" 
                        referrerPolicy="no-referrer" 
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-black text-slate-100 block truncate">{p.title}</span>
                        <span className="text-[10px] text-gold-400 mt-1 block">
                          دسته‌بندی: {categories.find(c => c.id === p.category)?.name || p.category}
                        </span>
                        <span className="text-xs font-extrabold text-slate-300 block mt-1.5">
                          {formatPersianPrice(p.discount ? (p.price - (p.price * p.discount / 100)) : p.price)}
                        </span>
                      </div>
                    </div>

                    {/* Stock Quick Adjustment and Action row */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-900 gap-2">
                      {/* Live Stock adjuster */}
                      <div className="flex items-center gap-1" dir="ltr">
                        <button
                          onClick={() => handleQuickStockUpdate(p, -1)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
                        >
                          <Minus size={11} />
                        </button>
                        <input
                          type="number"
                          value={p.stock}
                          onChange={(e) => handleQuickStockInput(p, parseInt(e.target.value) || 0)}
                          className="w-12 text-center bg-slate-950 border border-slate-850 rounded-lg text-xs py-1 text-slate-100 font-bold outline-none"
                        />
                        <button
                          onClick={() => handleQuickStockUpdate(p, 1)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
                        >
                          <Plus size={11} />
                        </button>
                        <span className="text-[9px] text-slate-500 font-bold mr-1 block sm:hidden">موجودی:</span>
                      </div>

                      {/* Control buttons */}
                      <div className="flex items-center gap-1 bg-slate-900 rounded-xl p-0.5 border border-slate-800">
                        <button
                          onClick={() => setSelectedGalleryProduct(p)}
                          className="text-slate-400 hover:text-gold-400 p-2 rounded-lg cursor-pointer"
                          title="گالری"
                        >
                          <Images size={13} />
                        </button>
                        <button
                          onClick={() => handleEditInit(p)}
                          className="text-slate-400 hover:text-blue-400 p-2 rounded-lg cursor-pointer"
                          title="ویرایش"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => {
                            setConfirmModal({
                              title: 'حذف محصول',
                              message: `آیا از حذف محصول "${p.title}" مطمئن هستید؟`,
                              onConfirm: () => {
                                onDeleteProduct(p.id);
                                triggerToast(`محصول "${p.title}" با موفقیت حذف گردید.`, 'success');
                                setConfirmModal(null);
                              }
                            });
                          }}
                          className="text-slate-400 hover:text-rose-400 p-2 rounded-lg cursor-pointer"
                          title="حذف"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= TAB 3: CATEGORIES ================= */}
        {activeTab === 'categories' && (
          <motion.div
            key="cat-tab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {/* Add Category */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 h-fit space-y-4">
              <h3 className="text-xs font-black text-gold-400 pb-3 border-b border-slate-850">افزودن دسته‌بندی جدید</h3>
              <form onSubmit={handleCategorySubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5">کد یکتا دسته‌بندی (انگلیسی و بدون فاصله) *</label>
                  <input
                    type="text"
                    required
                    value={newCatId}
                    onChange={(e) => setNewCatId(e.target.value)}
                    placeholder="مثال: necklace, ring, anklet"
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 outline-none text-left"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5">نام فارسی دسته‌بندی *</label>
                  <input
                    type="text"
                    required
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="مثال: گردنبندهای چند ردیفه"
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 outline-none"
                  />
                </div>
                <button type="submit" className="w-full rounded-xl bg-gold-500 hover:bg-gold-400 text-slate-950 font-extrabold py-3 text-xs cursor-pointer">
                  افزودن دسته‌بندی به سیستم
                </button>
              </form>
            </div>

            {/* Categories List */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-xs font-black text-slate-100 pb-3 border-b border-slate-850">دسته‌بندی‌های فعال فروشگاه</h3>
              <div className="divide-y divide-slate-850">
                {categories.map((c) => (
                  <div key={c.id} className="flex justify-between items-center py-3">
                    <div>
                      <span className="font-bold text-slate-200 block text-xs">{c.name}</span>
                      <span className="text-[9px] text-slate-500 font-mono" dir="ltr">{c.id}</span>
                    </div>
                    {c.id !== 'all' && (
                      <button
                        onClick={() => onDeleteCategory(c.id)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 transition-colors cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= TAB 4: ORDERS ================= */}
        {activeTab === 'orders' && (
          <motion.div
            key="order-tab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4"
          >
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <h3 className="text-xs font-black text-slate-100">تراکنش‌ها و فاکتورهای رسمی درگاه</h3>
              <span className="text-[10px] bg-slate-950 px-2.5 py-1 rounded-full text-slate-400 font-en-nums">کل خریدها: {formatPersianNumber(orders.length)} ثبت</span>
            </div>

            {orders.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-10">سفارشی هنوز ثبت نشده است.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 font-bold">
                      <th className="py-2.5">کد رهگیری</th>
                      <th className="py-2.5">مشتری گیرنده</th>
                      <th className="py-2.5">تلفن همراه</th>
                      <th className="py-2.5">جمع کل پرداختی</th>
                      <th className="py-2.5 text-center">وضعیت مالی</th>
                      <th className="py-2.5 text-center">جزئیات فاکتور</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 font-en-nums">
                    {orders.slice().reverse().map(o => (
                      <tr key={o.id} className="hover:bg-slate-950/20">
                        <td className="py-3 font-mono font-bold text-gold-400 text-xs">{o.trackingCode}</td>
                        <td className="py-3 text-slate-200 font-semibold">{o.customerName}</td>
                        <td className="py-3 text-slate-400">{o.customerPhone}</td>
                        <td className="py-3 text-slate-200 font-bold">{formatPersianPrice(o.totalPrice)}</td>
                        <td className="py-3 text-center">
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                            o.paymentStatus === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            o.paymentStatus === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {o.paymentStatus === 'success' ? 'پرداخت موفق' :
                             o.paymentStatus === 'pending' ? 'در انتظار تایید' : 'تراکنش ناموفق'}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <button
                            onClick={() => setSelectedOrder(o)}
                            className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-850 text-[10px] font-bold text-slate-400 hover:text-gold-400 transition-colors cursor-pointer"
                          >
                            نمایش فاکتور
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {/* ================= TAB 5: USERS (SUPERADMIN / ADMIN PANEL) ================= */}
        {activeTab === 'users' && (
          <motion.div
            key="user-tab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* SUPERADMIN-ONLY CREATION SECTION */}
            {currentUser?.role === 'superadmin' && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
                  <Plus size={16} className="text-gold-400" />
                  <h3 className="text-xs font-black text-slate-100">ثبت مدیر یا کاربر جدید در سیستم (سطح دسترسی مدیر کل)</h3>
                </div>

                <form onSubmit={handleCreateUserSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 text-right">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">نام</label>
                    <input
                      type="text"
                      required
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      className="w-full rounded-xl bg-slate-950 border border-slate-850 px-3 py-2 text-xs text-slate-100 outline-none"
                      placeholder="نام کوچک"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">نام خانوادگی</label>
                    <input
                      type="text"
                      value={newUserLastName}
                      onChange={(e) => setNewUserLastName(e.target.value)}
                      className="w-full rounded-xl bg-slate-950 border border-slate-850 px-3 py-2 text-xs text-slate-100 outline-none"
                      placeholder="نام خانوادگی"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">پست الکترونیکی (ایمیل)</label>
                    <input
                      type="email"
                      required
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="w-full rounded-xl bg-slate-950 border border-slate-850 px-3 py-2 text-xs text-slate-100 outline-none text-left"
                      dir="ltr"
                      placeholder="example@gmail.com"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">کلمه عبور (پسورد)</label>
                    <input
                      type="password"
                      required
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      className="w-full rounded-xl bg-slate-950 border border-slate-850 px-3 py-2 text-xs text-slate-100 outline-none text-left"
                      dir="ltr"
                      placeholder="حداقل ۶ کاراکتر"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">شماره تماس</label>
                    <input
                      type="text"
                      value={newUserPhone}
                      onChange={(e) => setNewUserPhone(e.target.value)}
                      className="w-full rounded-xl bg-slate-950 border border-slate-850 px-3 py-2 text-xs text-slate-100 outline-none text-left"
                      dir="ltr"
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">تاریخ تولد</label>
                    <input
                      type="text"
                      value={newUserBirthDate}
                      onChange={(e) => setNewUserBirthDate(e.target.value)}
                      className="w-full rounded-xl bg-slate-950 border border-slate-850 px-3 py-2 text-xs text-slate-100 outline-none text-left"
                      dir="ltr"
                      placeholder="۱۳۷۲/۱۰/۲۱"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">امتیاز باشگاه مشتریان اولیه</label>
                    <input
                      type="number"
                      value={newUserPoints || ''}
                      onChange={(e) => setNewUserPoints(Number(e.target.value))}
                      className="w-full rounded-xl bg-slate-950 border border-slate-850 px-3 py-2 text-xs text-slate-100 outline-none text-left"
                      dir="ltr"
                      placeholder="مثال: ۱۰"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">نقش دسترسی در سیستم</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as any)}
                      className="w-full rounded-xl bg-slate-950 border border-slate-850 px-3 py-2 text-xs text-slate-100 outline-none"
                    >
                      <option value="user">کاربر عادی (مشتری گالری)</option>
                      <option value="admin">مدیر سیستم (ادمین گالری)</option>
                      <option value="superadmin">مدیر کل (دسترسی نامحدود)</option>
                    </select>
                  </div>

                  <div className="md:col-span-4 pt-2">
                    <button
                      type="submit"
                      disabled={isCreatingUser}
                      className="rounded-xl bg-gold-500 hover:bg-gold-400 text-slate-950 font-black px-6 py-2.5 text-xs transition-colors cursor-pointer"
                    >
                      {isCreatingUser ? 'در حال ایجاد حساب...' : 'ایجاد و ذخیره کاربر'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* USERS LIST SECTION */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <h3 className="text-xs font-black text-slate-100 pb-3 border-b border-slate-850 flex items-center gap-2">
                <Users size={16} className="text-gold-400" />
                <span>لیست جامع کاربران و مدیران ثبت شده گالری آونتورین</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 font-bold">
                      <th className="py-3 px-2">نام و نام خانوادگی</th>
                      <th className="py-3 px-2">اطلاعات تماس</th>
                      <th className="py-3 px-2">نقش دسترسی</th>
                      <th className="py-3 px-2 text-center">باشگاه مشتریان (امتیاز)</th>
                      <th className="py-3 px-2 text-center">وضعیت حساب</th>
                      <th className="py-3 px-2 text-center">مدیریت حساب</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {users.map((u) => {
                      const currentEditPoints = userPointsEdits[u.id] !== undefined ? userPointsEdits[u.id] : (u.points || 0);
                      return (
                        <tr key={u.id} className="hover:bg-slate-950/20">
                          <td className="py-4 px-2">
                            <span className="font-extrabold text-slate-200 block">{u.name} {(u as any).lastName || ''}</span>
                            <span className="text-[10px] text-slate-500 font-serif block mt-0.5">{u.email}</span>
                          </td>
                          <td className="py-4 px-2">
                            <span className="text-[10px] text-slate-300 font-en-nums block">{u.phone || 'بدون شماره'}</span>
                            <span className="text-[9px] text-slate-500 font-en-nums block mt-0.5">تولد: {u.birthDate || 'ثبت نشده'}</span>
                          </td>
                          <td className="py-4 px-2">
                            {currentUser?.role === 'superadmin' ? (
                              <select
                                value={u.role}
                                onChange={(e) => handleRoleChange(u.id, e.target.value as any)}
                                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[10px] text-slate-200 outline-none"
                              >
                                <option value="user">کاربر عادی</option>
                                <option value="admin">مدیر سیستم</option>
                                <option value="superadmin">مدیر کل</option>
                              </select>
                            ) : (
                              <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${
                                u.role === 'superadmin' ? 'bg-rose-500/10 text-rose-400' :
                                u.role === 'admin' ? 'bg-gold-500/10 text-gold-400' : 'bg-slate-800 text-slate-400'
                              }`}>
                                {u.role === 'superadmin' ? 'مدیر کل' : u.role === 'admin' ? 'مدیر سیستم' : 'کاربر عادی'}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-2 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <input
                                type="number"
                                value={currentEditPoints}
                                onChange={(e) => setUserPointsEdits({ ...userPointsEdits, [u.id]: Number(e.target.value) })}
                                className="w-12 text-center bg-slate-950 border border-slate-800 rounded px-1 py-1 text-[10px] text-slate-100 font-en-nums outline-none"
                              />
                              <button
                                onClick={() => handlePointsChangeSubmit(u.id, currentEditPoints)}
                                className="text-[8px] bg-gold-500/15 text-gold-400 px-1.5 py-1 rounded hover:bg-gold-500 hover:text-slate-950 transition-all font-bold cursor-pointer"
                              >
                                ثبت امتیاز
                              </button>
                            </div>
                          </td>
                          <td className="py-4 px-2 text-center">
                            <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${u.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                              {u.status === 'active' ? 'فعال' : 'مسدود'}
                            </span>
                          </td>
                          <td className="py-4 px-2 text-center">
                            <div className="flex justify-center items-center gap-1.5">
                              <button
                                onClick={() => onUpdateUser(u.id, { status: u.status === 'active' ? 'blocked' : 'active' })}
                                className="text-[9px] text-slate-400 hover:text-gold-400 border border-slate-800 bg-slate-950 px-2 py-1 rounded-lg transition-all cursor-pointer"
                              >
                                {u.status === 'active' ? 'مسدود کردن' : 'فعال‌سازی'}
                              </button>

                              {currentUser?.role === 'superadmin' && u.id !== currentUser.id && (
                                <button
                                  onClick={() => handleDeleteUserSubmit(u.id)}
                                  className="text-[9px] text-rose-400 hover:text-rose-300 border border-rose-950/40 bg-rose-950/15 p-1 rounded-lg transition-all cursor-pointer"
                                  title="حذف کامل کاربر"
                                >
                                  <Trash2 size={11} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= TAB 6: COUPONS ================= */}
        {activeTab === 'coupons' && (
          <motion.div
            key="coupon-tab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-12 gap-8"
          >
            {/* Create Coupon form */}
            <div className="md:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 h-fit space-y-4">
              <h3 className="text-xs font-black text-gold-400 pb-3 border-b border-slate-850">ایجاد کد تخفیف جدید</h3>
              <form onSubmit={handleCouponSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5">کد تخفیف (ترجیحاً حروف بزرگ انگلیسی) *</label>
                  <input
                    type="text"
                    required
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="مثال: GOLD1405"
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 outline-none text-left"
                    dir="ltr"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1.5">نوع تخفیف *</label>
                    <select
                      value={couponType}
                      onChange={(e: any) => setCouponType(e.target.value)}
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-xs text-slate-350 outline-none"
                    >
                      <option value="percent">درصدی (٪)</option>
                      <option value="amount">مبلغ ثابت (تومان)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1.5">میزان تخفیف *</label>
                    <input
                      type="number"
                      required
                      value={couponValue}
                      onChange={(e) => setCouponValue(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="درصد یا مبلغ کسر شده"
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1.5">مهلت اعتبار (تاریخ میلادی) *</label>
                    <input
                      type="date"
                      required
                      value={couponExpiry}
                      onChange={(e) => setCouponExpiry(e.target.value)}
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-xs text-slate-350 outline-none text-left"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1.5">سقف تعداد استفاده کل *</label>
                    <input
                      type="number"
                      required
                      value={couponLimit}
                      onChange={(e) => setCouponLimit(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="مثال: 50"
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 outline-none"
                    />
                  </div>
                </div>

                <button type="submit" className="w-full rounded-xl bg-gold-500 hover:bg-gold-400 text-slate-950 font-extrabold py-3 text-xs cursor-pointer">
                  تولید و ثبت کد تخفیف
                </button>
              </form>
            </div>

            {/* Coupons list */}
            <div className="md:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-xs font-black text-slate-100 pb-3 border-b border-slate-850">کدهای تخفیف معتبر فروشگاه</h3>
              
              {coupons.length === 0 ? (
                <p className="text-xs text-slate-500">کد تخفیفی تعریف نشده است.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 font-bold">
                        <th className="py-2">کد</th>
                        <th className="py-2">نوع و میزان تخفیف</th>
                        <th className="py-2">مهلت اعتبار</th>
                        <th className="py-2 text-center">تعداد مصرف شده</th>
                        <th className="py-2 text-center">حذف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 font-en-nums">
                      {coupons.map((c) => (
                        <tr key={c.code} className="hover:bg-slate-950/20">
                          <td className="py-3 font-mono font-bold text-gold-400 text-xs">{c.code}</td>
                          <td className="py-3 text-slate-200">
                            {c.type === 'percent' ? `${formatPersianNumber(c.value)}٪ تخفیف کل` : `${formatPersianPrice(c.value)} کسر مبلغ`}
                          </td>
                          <td className="py-3 text-slate-400 font-serif text-[11px]">{c.expiryDate}</td>
                          <td className="py-3 text-center text-slate-400">
                            {formatPersianNumber(c.usageCount)} از {formatPersianNumber(c.usageLimit)}
                          </td>
                          <td className="py-3 text-center">
                            <button onClick={() => onDeleteCoupon(c.code)} className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer">
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ================= TAB 7: CMS ================= */}
        {activeTab === 'cms' && (
          <motion.div
            key="cms-tab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-slate-850 mb-6 gap-4">
              <div>
                <h3 className="text-sm font-black text-slate-100">مدیریت محتوای پویا و ظاهر سایت (CMS)</h3>
                <p className="text-[10px] text-slate-500">کنترل کامل تمام متون، بنرها، لوگو، منو، فوتر و داستان برند بدون نیاز به تغییر در کد</p>
              </div>
              
              {/* CMS Sub-Tabs Navigation */}
              <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-xl border border-slate-850">
                {[
                  { id: 'banners', label: 'اسلایدرها (Banners)' },
                  { id: 'middle', label: 'بخش‌های میانی (Promo)' },
                  { id: 'header', label: 'هدر و لوگو (Header)' },
                  { id: 'footer', label: 'فوتر و شبکه‌ها (Footer)' },
                  { id: 'pages', label: 'صفحات فرعی (Pages)' }
                ].map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setCmsSubTab(sub.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                      cmsSubTab === sub.id ? 'bg-gold-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCmsSubmit} className="space-y-6">
              
              {/* SUB-TAB 1: BANNERS (HERO SLIDERS) */}
              {cmsSubTab === 'banners' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-gold-400">بنرهای اسلایدر صفحه اصلی</h4>
                    <button
                      type="button"
                      onClick={() => {
                        setCmsBanners([
                          ...cmsBanners,
                          {
                            id: 'b-' + Date.now(),
                            title: 'عنوان بنر جدید',
                            subtitle: 'زیرعنوان یا برچسب بنر',
                            imageUrl: '/src/assets/images/jewelry_hero_banner_1784386410125.jpg',
                            buttonText: 'مشاهده کاتالوگ فروشگاه',
                            buttonLink: '/catalog',
                            isActive: true,
                            order: cmsBanners.length + 1
                          }
                        ]);
                      }}
                      className="inline-flex items-center gap-1 bg-gold-500/10 hover:bg-gold-500/20 text-gold-400 px-3 py-1.5 rounded-xl border border-gold-500/20 text-[10px] font-bold cursor-pointer"
                    >
                      <Plus size={12} />
                      افزودن بنر اسلایدر جدید
                    </button>
                  </div>

                  <div className="space-y-4">
                    {cmsBanners.map((banner, idx) => (
                      <div key={banner.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-3 relative">
                        <div className="absolute top-4 left-4 flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setCmsBanners(cmsBanners.filter(b => b.id !== banner.id));
                            }}
                            className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-1">ترتیب نمایش</label>
                            <input
                              type="number"
                              value={banner.order || 0}
                              onChange={(e) => {
                                const newBanners = [...cmsBanners];
                                newBanners[idx].order = Number(e.target.value);
                                setCmsBanners(newBanners);
                              }}
                              className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-100"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-1">وضعیت فعال بودن</label>
                            <select
                              value={banner.isActive !== false ? 'true' : 'false'}
                              onChange={(e) => {
                                const newBanners = [...cmsBanners];
                                newBanners[idx].isActive = e.target.value === 'true';
                                setCmsBanners(newBanners);
                              }}
                              className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-100"
                            >
                              <option value="true">فعال</option>
                              <option value="false">غیرفعال (مخفی)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-1">دکمه لینک شونده به</label>
                            <input
                              type="text"
                              value={banner.buttonLink || ''}
                              onChange={(e) => {
                                const newBanners = [...cmsBanners];
                                newBanners[idx].buttonLink = e.target.value;
                                setCmsBanners(newBanners);
                              }}
                              className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-100 font-mono text-left"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-1">عنوان اصلی بنر</label>
                            <input
                              type="text"
                              value={banner.title || ''}
                              onChange={(e) => {
                                const newBanners = [...cmsBanners];
                                newBanners[idx].title = e.target.value;
                                setCmsBanners(newBanners);
                              }}
                              className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-100"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-1">زیرعنوان (برچسب بالای عنوان)</label>
                            <input
                              type="text"
                              value={banner.subtitle || ''}
                              onChange={(e) => {
                                const newBanners = [...cmsBanners];
                                newBanners[idx].subtitle = e.target.value;
                                setCmsBanners(newBanners);
                              }}
                              className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-100"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-1">آدرس عکس پس‌زمینه بنر</label>
                            <input
                              type="text"
                              value={banner.imageUrl || ''}
                              onChange={(e) => {
                                const newBanners = [...cmsBanners];
                                newBanners[idx].imageUrl = e.target.value;
                                setCmsBanners(newBanners);
                              }}
                              className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-100 font-mono text-left"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-1">متن دکمه اکشن</label>
                            <input
                              type="text"
                              value={banner.buttonText || ''}
                              onChange={(e) => {
                                const newBanners = [...cmsBanners];
                                newBanners[idx].buttonText = e.target.value;
                                setCmsBanners(newBanners);
                              }}
                              className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-100"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {cmsBanners.length === 0 && (
                      <p className="text-center text-xs text-slate-500 py-6 bg-slate-950 rounded-2xl border border-dashed border-slate-800">هیچ بنر اسلایدری یافت نشد. بنر جدید اضافه کنید.</p>
                    )}
                  </div>
                </div>
              )}

              {/* SUB-TAB 2: MIDDLE SECTIONS */}
              {cmsSubTab === 'middle' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-gold-400">بخش‌های معرفی و کاتالوگ میانی صفحه اصلی</h4>
                    <button
                      type="button"
                      onClick={() => {
                        setCmsMiddleSections([
                          ...cmsMiddleSections,
                          {
                            id: 'm-' + Date.now(),
                            title: 'عنوان بخش میانی',
                            subtitle: 'متن و توضیحات این بخش معرفی...',
                            imageUrl: '/src/assets/images/aventurin_jewelry_crafting_1784400780210.jpg',
                            link: '/about',
                            isActive: true,
                            order: cmsMiddleSections.length + 1
                          }
                        ]);
                      }}
                      className="inline-flex items-center gap-1 bg-gold-500/10 hover:bg-gold-500/20 text-gold-400 px-3 py-1.5 rounded-xl border border-gold-500/20 text-[10px] font-bold cursor-pointer"
                    >
                      <Plus size={12} />
                      افزودن بخش میانی جدید
                    </button>
                  </div>

                  <div className="space-y-4">
                    {cmsMiddleSections.map((sec, idx) => (
                      <div key={sec.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-3 relative">
                        <div className="absolute top-4 left-4 flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setCmsMiddleSections(cmsMiddleSections.filter(s => s.id !== sec.id));
                            }}
                            className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] text-slate-500 mb-1">عنوان بخش</label>
                            <input
                              type="text"
                              value={sec.title || ''}
                              onChange={(e) => {
                                const newSecs = [...cmsMiddleSections];
                                newSecs[idx].title = e.target.value;
                                setCmsMiddleSections(newSecs);
                              }}
                              className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-100"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-1">ترتیب نمایش</label>
                            <input
                              type="number"
                              value={sec.order || 0}
                              onChange={(e) => {
                                const newSecs = [...cmsMiddleSections];
                                newSecs[idx].order = Number(e.target.value);
                                setCmsMiddleSections(newSecs);
                              }}
                              className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-100"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-1">وضعیت نمایش</label>
                            <select
                              value={sec.isActive !== false ? 'true' : 'false'}
                              onChange={(e) => {
                                const newSecs = [...cmsMiddleSections];
                                newSecs[idx].isActive = e.target.value === 'true';
                                setCmsMiddleSections(newSecs);
                              }}
                              className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-100"
                            >
                              <option value="true">فعال</option>
                              <option value="false">غیرفعال (مخفی)</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-500 mb-1">توضیحات کوتاه معرفی</label>
                          <textarea
                            rows={2}
                            value={sec.subtitle || ''}
                            onChange={(e) => {
                              const newSecs = [...cmsMiddleSections];
                              newSecs[idx].subtitle = e.target.value;
                              setCmsMiddleSections(newSecs);
                            }}
                            className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-100 outline-none resize-none leading-relaxed"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-1">آدرس آیکون یا تصویر معرفی (بزرگ)</label>
                            <input
                              type="text"
                              value={sec.imageUrl || ''}
                              onChange={(e) => {
                                const newSecs = [...cmsMiddleSections];
                                newSecs[idx].imageUrl = e.target.value;
                                setCmsMiddleSections(newSecs);
                              }}
                              className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-100 font-mono text-left"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-1">لینک مقصد کلیک دکمه کاتالوگ</label>
                            <input
                              type="text"
                              value={sec.link || ''}
                              onChange={(e) => {
                                const newSecs = [...cmsMiddleSections];
                                newSecs[idx].link = e.target.value;
                                setCmsMiddleSections(newSecs);
                              }}
                              className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-100 font-mono text-left"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {cmsMiddleSections.length === 0 && (
                      <p className="text-center text-xs text-slate-500 py-6 bg-slate-950 rounded-2xl border border-dashed border-slate-800">هیچ بخش میانی یافت نشد. بخش جدید اضافه کنید.</p>
                    )}
                  </div>
                </div>
              )}

              {/* SUB-TAB 3: HEADER */}
              {cmsSubTab === 'header' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gold-400 pb-2 border-b border-slate-850">تنظیمات عمومی هدر و منوی سایت</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">متن لوگو نوشتاری سایت</label>
                      <input
                        type="text"
                        value={headerLogoText}
                        onChange={(e) => setHeaderLogoText(e.target.value)}
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">متن نوار هدر بالای صفحه (Alert / Banner Text)</label>
                      <input
                        type="text"
                        value={headerTopAlert}
                        onChange={(e) => setHeaderTopAlert(e.target.value)}
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-slate-400">آیتم‌های منوی ناوبری هدر (Navigation Menu)</span>
                      <button
                        type="button"
                        onClick={() => {
                          setHeaderMenuItems([
                            ...headerMenuItems,
                            { id: 'menu-' + Date.now(), title: 'آیتم منوی جدید', link: '/catalog', order: headerMenuItems.length + 1 }
                          ]);
                        }}
                        className="inline-flex items-center gap-1 bg-gold-500/10 hover:bg-gold-500/20 text-gold-400 px-2 py-1 rounded-lg border border-gold-500/20 text-[9px] font-bold cursor-pointer"
                      >
                        <Plus size={10} />
                        افزودن لینک منو
                      </button>
                    </div>

                    <div className="space-y-2">
                      {headerMenuItems.map((item, idx) => (
                        <div key={item.id} className="bg-slate-950/60 p-3 rounded-xl border border-slate-850 flex flex-wrap sm:flex-nowrap items-center gap-3">
                          <div className="w-16">
                            <label className="block text-[8px] text-slate-500 mb-0.5">ترتیب</label>
                            <input
                              type="number"
                              value={item.order || 0}
                              onChange={(e) => {
                                const newItems = [...headerMenuItems];
                                newItems[idx].order = Number(e.target.value);
                                setHeaderMenuItems(newItems);
                              }}
                              className="w-full rounded-lg bg-slate-900 border border-slate-800 px-2 py-1 text-xs text-slate-100 text-center"
                            />
                          </div>
                          <div className="flex-1 min-w-[120px]">
                            <label className="block text-[8px] text-slate-500 mb-0.5">عنوان پیوند</label>
                            <input
                              type="text"
                              value={item.title || ''}
                              onChange={(e) => {
                                const newItems = [...headerMenuItems];
                                newItems[idx].title = e.target.value;
                                setHeaderMenuItems(newItems);
                              }}
                              className="w-full rounded-lg bg-slate-900 border border-slate-800 px-2 py-1 text-xs text-slate-100"
                            />
                          </div>
                          <div className="flex-1 min-w-[120px]">
                            <label className="block text-[8px] text-slate-500 mb-0.5">پیوند به آدرس (روتر داخلی یا خارجی)</label>
                            <input
                              type="text"
                              value={item.link || ''}
                              onChange={(e) => {
                                const newItems = [...headerMenuItems];
                                newItems[idx].link = e.target.value;
                                setHeaderMenuItems(newItems);
                              }}
                              className="w-full rounded-lg bg-slate-900 border border-slate-800 px-2 py-1 text-xs text-slate-100 font-mono text-left"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setHeaderMenuItems(headerMenuItems.filter(i => i.id !== item.id));
                            }}
                            className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg self-end cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB 4: FOOTER */}
              {cmsSubTab === 'footer' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gold-400 pb-2 border-b border-slate-850">تنظیمات فوتر، راه‌های ارتباطی و شبکه‌های اجتماعی</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">توضیحات معرفی برند (ستون اول فوتر)</label>
                      <textarea
                        rows={3}
                        value={footerBrandIntro}
                        onChange={(e) => setFooterBrandIntro(e.target.value)}
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs text-slate-100 outline-none resize-none leading-relaxed"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">متن کپی‌رایت انتهای سایت</label>
                      <textarea
                        rows={3}
                        value={footerCopyText}
                        onChange={(e) => setFooterCopyText(e.target.value)}
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs text-slate-100 outline-none resize-none leading-relaxed"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">تلفن پشتیبانی فوتر</label>
                      <input
                        type="text"
                        value={footerPhone}
                        onChange={(e) => setFooterPhone(e.target.value)}
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-xs text-slate-100 font-mono text-left"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">ایمیل رسمی گالری</label>
                      <input
                        type="email"
                        value={footerEmail}
                        onChange={(e) => setFooterEmail(e.target.value)}
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-xs text-slate-100 font-mono text-left"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">آدرس فیزیکی گالری</label>
                      <input
                        type="text"
                        value={footerAddress}
                        onChange={(e) => setFooterAddress(e.target.value)}
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-xs text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">ساعات کاری گالری</label>
                      <input
                        type="text"
                        value={footerWorkingHours}
                        onChange={(e) => setFooterWorkingHours(e.target.value)}
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-xs text-slate-100"
                      />
                    </div>
                  </div>

                  {/* Quick links & socials */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {/* Quick links list */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-slate-400">لینک‌های سریع فوتر (Quick Links)</span>
                        <button
                          type="button"
                          onClick={() => {
                            setFooterQuickLinks([
                              ...footerQuickLinks,
                              { id: 'ql-' + Date.now(), title: 'لینک جدید', link: '/catalog' }
                            ]);
                          }}
                          className="inline-flex items-center gap-1 bg-gold-500/10 hover:bg-gold-500/20 text-gold-400 px-2 py-1 rounded-lg border border-gold-500/20 text-[9px] font-bold cursor-pointer"
                        >
                          <Plus size={10} />
                          افزودن لینک سریع
                        </button>
                      </div>
                      <div className="space-y-2 max-h-[160px] overflow-y-auto">
                        {footerQuickLinks.map((item, idx) => (
                          <div key={item.id} className="bg-slate-950/60 p-2 rounded-xl border border-slate-850 flex items-center gap-2">
                            <input
                              type="text"
                              value={item.title || ''}
                              onChange={(e) => {
                                const newLinks = [...footerQuickLinks];
                                newLinks[idx].title = e.target.value;
                                setFooterQuickLinks(newLinks);
                              }}
                              className="w-1/2 rounded-lg bg-slate-900 border border-slate-800 px-2 py-1 text-xs text-slate-100"
                              placeholder="عنوان"
                            />
                            <input
                              type="text"
                              value={item.link || ''}
                              onChange={(e) => {
                                const newLinks = [...footerQuickLinks];
                                newLinks[idx].link = e.target.value;
                                setFooterQuickLinks(newLinks);
                              }}
                              className="w-1/2 rounded-lg bg-slate-900 border border-slate-800 px-2 py-1 text-xs text-slate-100 font-mono text-left"
                              placeholder="آدرس"
                            />
                            <button
                              type="button"
                              onClick={() => setFooterQuickLinks(footerQuickLinks.filter(l => l.id !== item.id))}
                              className="p-1 text-rose-500 hover:bg-rose-500/10 rounded cursor-pointer"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Social networks list */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-slate-400">شبکه‌های اجتماعی و آیکون‌ها (Socials)</span>
                        <button
                          type="button"
                          onClick={() => {
                            setFooterSocialLinks([
                              ...footerSocialLinks,
                              { id: 'sl-' + Date.now(), name: 'اینستاگرام جدید', url: 'https://instagram.com/', icon: 'instagram' }
                            ]);
                          }}
                          className="inline-flex items-center gap-1 bg-gold-500/10 hover:bg-gold-500/20 text-gold-400 px-2 py-1 rounded-lg border border-gold-500/20 text-[9px] font-bold cursor-pointer"
                        >
                          <Plus size={10} />
                          افزودن شبکه اجتماعی
                        </button>
                      </div>
                      <div className="space-y-2 max-h-[160px] overflow-y-auto">
                        {footerSocialLinks.map((item, idx) => (
                          <div key={item.id} className="bg-slate-950/60 p-2 rounded-xl border border-slate-850 flex items-center gap-2">
                            <input
                              type="text"
                              value={item.name || ''}
                              onChange={(e) => {
                                const newSocials = [...footerSocialLinks];
                                newSocials[idx].name = e.target.value;
                                setFooterSocialLinks(newSocials);
                              }}
                              className="w-1/3 rounded-lg bg-slate-900 border border-slate-800 px-2 py-1 text-xs text-slate-100"
                              placeholder="نام (مثلا تلگرام)"
                            />
                            <input
                              type="text"
                              value={item.url || ''}
                              onChange={(e) => {
                                const newSocials = [...footerSocialLinks];
                                newSocials[idx].url = e.target.value;
                                setFooterSocialLinks(newSocials);
                              }}
                              className="w-1/3 rounded-lg bg-slate-900 border border-slate-800 px-2 py-1 text-xs text-slate-100 font-mono text-left"
                              placeholder="آدرس اینترنتی"
                            />
                            <select
                              value={item.icon || 'instagram'}
                              onChange={(e) => {
                                const newSocials = [...footerSocialLinks];
                                newSocials[idx].icon = e.target.value;
                                setFooterSocialLinks(newSocials);
                              }}
                              className="w-1/4 rounded-lg bg-slate-900 border border-slate-800 px-2 py-1 text-xs text-slate-100 font-bold"
                            >
                              <option value="instagram">Instagram</option>
                              <option value="telegram">Telegram</option>
                              <option value="whatsapp">WhatsApp</option>
                              <option value="phone">Phone</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => setFooterSocialLinks(footerSocialLinks.filter(s => s.id !== item.id))}
                              className="p-1 text-rose-500 hover:bg-rose-500/10 rounded cursor-pointer"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB 5: STATIC PAGES */}
              {cmsSubTab === 'pages' && (
                <div className="space-y-5">
                  <h4 className="text-xs font-bold text-gold-400 pb-2 border-b border-slate-850">متن تفصیلی صفحات فرعی و درباره ما</h4>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">متن صفحه «داستان برند و درباره ما»</label>
                    <textarea
                      rows={6}
                      value={cmsAbout}
                      onChange={(e) => setCmsAbout(e.target.value)}
                      className="w-full rounded-2xl bg-slate-950 border border-slate-800 p-4 text-xs text-slate-100 outline-none resize-none leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">متن صفحه «قوانین، مقررات و حریم خصوصی»</label>
                    <textarea
                      rows={6}
                      value={cmsTerms}
                      onChange={(e) => setCmsTerms(e.target.value)}
                      className="w-full rounded-2xl bg-slate-950 border border-slate-800 p-4 text-xs text-slate-100 outline-none resize-none leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">نشانی، تلفن و اطلاعات تماس «تماس با ما»</label>
                    <textarea
                      rows={4}
                      value={cmsContact}
                      onChange={(e) => setCmsContact(e.target.value)}
                      className="w-full rounded-2xl bg-slate-950 border border-slate-800 p-4 text-xs text-slate-100 outline-none resize-none leading-relaxed"
                    />
                  </div>
                </div>
              )}

              <button type="submit" className="w-full rounded-xl bg-gold-500 hover:bg-gold-400 text-slate-950 font-extrabold py-3.5 text-xs transition-colors cursor-pointer shadow-lg shadow-gold-500/10">
                ذخیره و اعمال همزمان تمامی تنظیمات پویای محتوا (CMS)
              </button>
            </form>
          </motion.div>
        )}

        {/* ================= TAB 8: SETTINGS ================= */}
        {activeTab === 'settings' && (
          <motion.div
            key="set-tab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl mx-auto"
          >
            <h3 className="text-xs font-black text-slate-100 pb-3 border-b border-slate-850 mb-5">تنظیمات پایه و تعرفه های حمل و مالیات فروشگاه</h3>
            
            <form onSubmit={handleSettingsSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">واحد پول سیستم</label>
                  <select
                    value={setCurrency}
                    onChange={(e: any) => setSetCurrency(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-xs text-slate-350 outline-none"
                  >
                    <option value="تومان">تومان ایران</option>
                    <option value="ریال">ریال ایران</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">مالیات بر ارزش افزوده (٪)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={setTax}
                    onChange={(e) => setSetTax(Number(e.target.value))}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">هزینه ثابت ارسال پستی (تومان)</label>
                <input
                  type="number"
                  value={setShipping}
                  onChange={(e) => setSetShipping(Number(e.target.value))}
                  placeholder="مثال: 35000"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1.5">خریدهای بیش از ۵۰۰,۰۰۰ تومان به صورت خودکار واجد شرایط ارسال رایگان می‌گردند.</p>
              </div>

              <button type="submit" className="w-full rounded-xl bg-gold-500 hover:bg-gold-400 text-slate-950 font-extrabold py-3.5 text-xs transition-colors cursor-pointer">
                به‌روزرسانی و اعمال تنظیمات پایه فروشگاه
              </button>
            </form>
          </motion.div>
        )}

        {/* ================= TAB 9: HANDMADES & CUSTOM ORDERS ================= */}
        {activeTab === 'handmades' && (
          <motion.div
            key="handmades-tab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AdminHandmades />
          </motion.div>
        )}

        {/* ================= TAB 10: SMART INVENTORY & WAREHOUSE ================= */}
        {activeTab === 'inventory' && (
          <motion.div
            key="inventory-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="space-y-6 text-right"
            dir="rtl"
          >
            {/* Top Info Banner */}
            <div className="rounded-2xl border border-gold-500/20 bg-gradient-to-r from-gold-500/5 to-transparent p-5 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-gold-400 flex items-center gap-2">
                  <Database size={16} />
                  سیستم مدیریت پیشرفته و انبارداری هوشمند گالری
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                  این بخش مجهز به الگوریتم تحلیل ارزش کالایی (ABC Analysis) و موتور تخمین ریسک اتمام موجودی بر اساس سرعت فروش ۳۰ روز گذشته گالری آونتورین می‌باشد. تراکنش‌های ورود، خروج و ضایعات کالا در دفتر معین انبار به صورت آنی ثبت می‌گردند.
                </p>
              </div>
              <button
                onClick={fetchInventoryLogs}
                className="flex items-center gap-1 bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100 px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                <RefreshCw size={12} className={isLogsLoading ? "animate-spin" : ""} />
                به‌روزرسانی دفتر انبار
              </button>
            </div>

            {/* Calculations for Warehouse */}
            {(() => {
              const totalItemsInWarehouse = products.reduce((sum, p) => sum + (p.stock || 0), 0);
              const totalValuation = products.reduce((sum, p) => sum + ((p.stock || 0) * (p.price || 0)), 0);
              const outOfStockItems = products.filter(p => (p.stock || 0) === 0);
              const lowStockItems = products.filter(p => (p.stock || 0) <= 3 && (p.stock || 0) > 0);

              // 1. ABC Analysis Algorithm
              // Sort products by their total value in stock (price * stock) descending
              const sortedByValue = [...products].map(p => ({
                ...p,
                totalValue: (p.stock || 0) * (p.price || 0)
              })).sort((a, b) => b.totalValue - a.totalValue);

              const cumulativeSumValue = sortedByValue.reduce((sum, p) => sum + p.totalValue, 0);
              let runningSum = 0;

              const abcProducts = sortedByValue.map(p => {
                runningSum += p.totalValue;
                let classification: 'A' | 'B' | 'C' = 'C';
                if (cumulativeSumValue > 0) {
                  const percentage = (runningSum / cumulativeSumValue) * 100;
                  if (percentage <= 60) classification = 'A'; // Top 60% of cumulative value
                  else if (percentage <= 85) classification = 'B'; // Next 25% of cumulative value
                  else classification = 'C'; // Remaining 15%
                } else {
                  classification = 'C';
                }
                return { ...p, classification };
              });

              // 2. Sales velocity and stockout predictor algorithm (last 30 days)
              const successfulOrders = orders.filter(o => o.paymentStatus === 'success' || o.paymentStatus === 'paid');
              const salesVelocityMap: Record<string, number> = {};
              
              successfulOrders.forEach(o => {
                const orderItems = o.items || [];
                orderItems.forEach(item => {
                  if (item.productId) {
                    salesVelocityMap[item.productId] = (salesVelocityMap[item.productId] || 0) + (item.quantity || 1);
                  }
                });
              });

              const inventoryRiskList = products.map(p => {
                const unitsSoldIn30Days = salesVelocityMap[p.id] || 0;
                const dailySalesRate = unitsSoldIn30Days / 30;
                let daysRemaining = Infinity;
                let riskStatus: 'normal' | 'warning' | 'critical' = 'normal';

                if (dailySalesRate > 0) {
                  daysRemaining = p.stock / dailySalesRate;
                  if (daysRemaining <= 5) riskStatus = 'critical';
                  else if (daysRemaining <= 15) riskStatus = 'warning';
                } else if (p.stock === 0) {
                  riskStatus = 'critical';
                  daysRemaining = 0;
                }

                return {
                  ...p,
                  unitsSoldIn30Days,
                  dailySalesRate,
                  daysRemaining,
                  riskStatus
                };
              });

              // Apply search or filters to logs
              const filteredLogs = inventoryLogs.filter(log => {
                const matchesSearch = log.productTitle.toLowerCase().includes(invLogSearch.toLowerCase()) || 
                                      log.productId.toLowerCase().includes(invLogSearch.toLowerCase()) ||
                                      log.description.toLowerCase().includes(invLogSearch.toLowerCase());
                const matchesType = invLogTypeFilter === 'all' || log.type === invLogTypeFilter;
                return matchesSearch && matchesType;
              });

              const handleAdjustStockSubmit = async (e: React.FormEvent) => {
                e.preventDefault();
                if (!invProductId) {
                  triggerToast('لطفاً محصول مورد نظر را انتخاب نمایید.', 'error');
                  return;
                }
                if (invQty === '' || Number(invQty) <= 0) {
                  triggerToast('تعداد تراکنش انبار باید بزرگتر از صفر باشد.', 'error');
                  return;
                }
                if (!invDescription) {
                  triggerToast('لطفاً شرح یا دلیل تراکنش انبار را بنویسید.', 'error');
                  return;
                }

                try {
                  const targetProd = products.find(p => p.id === invProductId);
                  if (!targetProd) return;

                  const updatedProduct = await api.adjustInventory(
                    invProductId,
                    invType,
                    Number(invQty),
                    invDescription,
                    invOperator
                  );

                  // Update parent state in-place to reflect new stock
                  onEditProduct(invProductId, { stock: updatedProduct.stock });
                  
                  triggerToast(`تراکنش انبار با موفقیت ثبت شد. موجودی جدید کالا: ${updatedProduct.stock} عدد`, 'success');
                  
                  // Clear form
                  setInvQty('');
                  setInvDescription('');
                  
                  // Refresh logs ledger
                  fetchInventoryLogs();
                } catch (err: any) {
                  triggerToast(err.message || 'خطا در ثبت تراکنش انبار.', 'error');
                }
              };

              return (
                <div className="space-y-6">
                  {/* Warehouse Stats Cards */}
                  <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <div className="rounded-2xl border border-slate-850 bg-slate-900/50 p-4 shadow-sm">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">کل اقلام در انبار</span>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-100">{formatPersianNumber(totalItemsInWarehouse)}</span>
                        <span className="text-[10px] text-slate-500 font-semibold">عدد کالا</span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-850 bg-slate-900/50 p-4 shadow-sm">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">ارزش برآوردی موجودی انبار</span>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-gold-400">{formatPersianPrice(totalValuation)}</span>
                        <span className="text-[10px] text-slate-500 font-semibold">تومان</span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-850 bg-slate-900/50 p-4 shadow-sm">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">اقلام رو به اتمام</span>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className={`text-2xl font-black ${lowStockItems.length > 0 ? 'text-amber-500' : 'text-slate-100'}`}>
                          {formatPersianNumber(lowStockItems.length)}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold">کالا (کمتر از ۳ عدد)</span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-850 bg-slate-900/50 p-4 shadow-sm">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">کالاهای بدون موجودی</span>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className={`text-2xl font-black ${outOfStockItems.length > 0 ? 'text-rose-500 animate-pulse' : 'text-slate-100'}`}>
                          {formatPersianNumber(outOfStockItems.length)}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold">کالا (ناموجود)</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    {/* Left Column: Smart Analytics (8 cols) */}
                    <div className="lg:col-span-8 space-y-6">
                      {/* Section 1: ABC Jewelry Value Classification */}
                      <div className="rounded-2xl border border-slate-850 bg-slate-900/40 p-5 space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                          <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                            <Compass size={14} className="text-gold-400" />
                            طبقه‌بندی هوشمند کالایی جواهرات (ABC Analysis)
                          </h4>
                          <span className="text-[10px] text-slate-500 font-medium">اولویت‌بندی امنیتی و سرمایه‌ای محصولات</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          بر اساس فرمول‌های جهانی مدیریت انبار، کالاهای <span className="text-gold-400 font-bold">گروه A</span> شامل محصولات گران‌بهایی هستند که بیشترین ارزش موجودی انبار را دارند و نیازمند بیشترین حفاظت فیزیکی و دقت مالی هستند. کالاهای <span className="text-slate-300 font-bold">گروه B</span> ارزش متوسط و <span className="text-slate-500 font-bold">گروه C</span> دارای ارزش ریالی پایین‌تر و تراکم موجودی بالاتری هستند.
                        </p>

                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                          {abcProducts.map(p => (
                            <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-900/80 hover:border-slate-800 transition-colors">
                              <div className="flex items-center gap-2.5">
                                <img src={p.image} className="w-8 h-8 rounded-lg object-cover bg-slate-900 border border-slate-850" referrerPolicy="no-referrer" />
                                <div className="text-right">
                                  <h5 className="text-[11px] font-bold text-slate-200 line-clamp-1">{p.title}</h5>
                                  <span className="text-[9px] text-slate-500">
                                    موجودی: {formatPersianNumber(p.stock)} عدد | ارزش کل: {formatPersianPrice(p.totalValue)} تومان
                                  </span>
                                </div>
                              </div>
                              <div>
                                {p.classification === 'A' ? (
                                  <span className="px-2.5 py-1 text-[9px] font-black rounded-lg bg-gold-500/10 text-gold-400 border border-gold-500/20 shadow-sm shadow-gold-500/5">
                                    کلاس A (ارزش بسیار بالا)
                                  </span>
                                ) : p.classification === 'B' ? (
                                  <span className="px-2.5 py-1 text-[9px] font-bold rounded-lg bg-slate-200/10 text-slate-300 border border-slate-200/20">
                                    کلاس B (ارزش متوسط)
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 text-[9px] rounded-lg bg-slate-800/10 text-slate-500 border border-slate-800/20">
                                    کلاس C (ارزش معمولی)
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Section 2: Sales Run Rate & Stockout Forecast */}
                      <div className="rounded-2xl border border-slate-850 bg-slate-900/40 p-5 space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                          <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                            <Clock size={14} className="text-amber-400" />
                            تخمین هوشمند فرسودگی موجودی و پیش‌بینی ریسک
                          </h4>
                          <span className="text-[10px] text-slate-500 font-medium">سرعت فروش ۳۰ روز گذشته گالری</span>
                        </div>

                        <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                          {inventoryRiskList.map(p => (
                            <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-900/80 gap-3">
                              <div className="flex items-center gap-2.5">
                                <img src={p.image} className="w-8 h-8 rounded-lg object-cover bg-slate-900" referrerPolicy="no-referrer" />
                                <div className="text-right">
                                  <h5 className="text-[11px] font-bold text-slate-200">{p.title}</h5>
                                  <span className="text-[9px] text-slate-500">
                                    تعداد فروش در ۳۰ روز گذشته: {formatPersianNumber(p.unitsSoldIn30Days)} عدد
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-slate-900/80 pt-2 sm:pt-0">
                                <span className="text-[10px] text-slate-400">
                                  سرعت فروش روزانه: <span className="font-bold text-slate-200">{p.dailySalesRate.toFixed(2)}</span>
                                </span>

                                {p.stock === 0 ? (
                                  <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                    اتمام موجودی!
                                  </span>
                                ) : p.riskStatus === 'critical' ? (
                                  <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse">
                                    تأمین فوری! (کمتر از {formatPersianNumber(Math.ceil(p.daysRemaining))} روز)
                                  </span>
                                ) : p.riskStatus === 'warning' ? (
                                  <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-500/5 text-amber-400/80 border border-amber-500/10">
                                    هشدار شارژ ({formatPersianNumber(Math.ceil(p.daysRemaining))} روز باقی‌مانده)
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    شرایط پایدار (کفایت موجودی)
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Transaction intake Form (4 cols) */}
                    <div className="lg:col-span-4">
                      <div className="rounded-2xl border border-slate-850 bg-slate-900/40 p-5 space-y-4 sticky top-6">
                        <div className="border-b border-slate-850 pb-3">
                          <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                            <Plus size={14} className="text-emerald-400" />
                            ثبت تراکنش و مغایرت‌گیری انبار
                          </h4>
                          <span className="text-[9px] text-slate-500 block mt-1">تغییر فیزیکی یا ورود فاکتور جدید زیورآلات</span>
                        </div>

                        <form onSubmit={handleAdjustStockSubmit} className="space-y-4">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-1.5">انتخاب کالا / محصول مربوطه</label>
                            <select
                              value={invProductId}
                              onChange={(e) => setInvProductId(e.target.value)}
                              className="w-full rounded-xl bg-slate-950 border border-slate-850 px-3 py-2.5 text-xs text-slate-100 outline-none cursor-pointer"
                            >
                              {products.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.title} (موجودی فعلی: {p.stock} عدد)
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 block mb-1.5">نوع تراکنش انبار</label>
                              <select
                                value={invType}
                                onChange={(e) => setInvType(e.target.value as any)}
                                className="w-full rounded-xl bg-slate-950 border border-slate-850 px-3 py-2.5 text-xs text-slate-100 outline-none cursor-pointer"
                              >
                                <option value="in">ورود کالا (شارژ انبار)</option>
                                <option value="out">خروج کالا (فروش/کسری)</option>
                                <option value="damage">ثبت ضایعات (خرابی کالا)</option>
                                <option value="adjustment">اصلاح مستقیم موجودی</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-slate-400 block mb-1.5">تعداد اقلام (مثبت)</label>
                              <input
                                type="number"
                                required
                                min="1"
                                placeholder="تعداد"
                                value={invQty}
                                onChange={(e) => setInvQty(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-full rounded-xl bg-slate-950 border border-slate-850 px-3 py-2.5 text-xs text-slate-100 outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-1.5">ثبت‌کننده / اپراتور سیستم</label>
                            <input
                              type="text"
                              required
                              value={invOperator}
                              onChange={(e) => setInvOperator(e.target.value)}
                              className="w-full rounded-xl bg-slate-950 border border-slate-850 px-3 py-2.5 text-xs text-slate-100 outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-1.5">شرح دلیل تراکنش / ورود فاکتور</label>
                            <textarea
                              required
                              rows={3}
                              placeholder="مثال: شارژ خرید تابستانه طلا، یا کسر بابت خرابی قفل گوشواره..."
                              value={invDescription}
                              onChange={(e) => setInvDescription(e.target.value)}
                              className="w-full rounded-xl bg-slate-950 border border-slate-850 p-3 text-xs text-slate-100 outline-none resize-none leading-relaxed"
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold py-3 rounded-xl text-xs transition-colors cursor-pointer shadow-lg shadow-emerald-600/10"
                          >
                            ثبت نهایی تراکنش انبارداری
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>

                  {/* Warehouse Audit Ledger Logs Table */}
                  <div className="rounded-2xl border border-slate-850 bg-slate-900/40 p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-850 pb-4 gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                          <Database size={14} className="text-gold-400" />
                          دفتر معین انبار و تاریخچه تراکنش‌های سیستمی و دستی (Ledger)
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-1">لیست ممیزی کامل تمامی فرآیندهای ورود، خروج، فروش و آسیب کالاها</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                          <Search size={12} className="absolute right-3 top-3 text-slate-500" />
                          <input
                            type="text"
                            placeholder="جستجو در دفتر انبار..."
                            value={invLogSearch}
                            onChange={(e) => setInvLogSearch(e.target.value)}
                            className="rounded-xl bg-slate-950 border border-slate-850 pr-8 pl-3 py-2 text-[11px] text-slate-100 outline-none w-[180px] text-right"
                          />
                        </div>

                        <select
                          value={invLogTypeFilter}
                          onChange={(e) => setInvLogTypeFilter(e.target.value)}
                          className="rounded-xl bg-slate-950 border border-slate-850 px-3 py-2 text-[11px] text-slate-100 outline-none cursor-pointer"
                        >
                          <option value="all">تمامی انواع</option>
                          <option value="in">ورود کالا</option>
                          <option value="out">خروج کالا</option>
                          <option value="damage">ضایعات</option>
                          <option value="sale">فروش سیستمی</option>
                        </select>
                      </div>
                    </div>

                    {isLogsLoading ? (
                      <div className="flex flex-col items-center justify-center py-12 space-y-2">
                        <RefreshCw size={24} className="animate-spin text-gold-400" />
                        <span className="text-xs text-slate-500">در حال دریافت ممیزی انبار...</span>
                      </div>
                    ) : filteredLogs.length === 0 ? (
                      <div className="text-center py-12 text-slate-500 text-xs">
                        {invLogSearch || invLogTypeFilter !== 'all' ? 'هیچ تراکنشی با فیلترهای بالا مطابقت ندارد.' : 'هنوز هیچ تراکنشی در دفتر معین انبار گالری ثبت نشده است.'}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                          <thead>
                            <tr className="border-b border-slate-850 text-slate-400 font-bold text-[10px]">
                              <th className="pb-3 text-right">کالا / محصول</th>
                              <th className="pb-3 text-center">نوع تراکنش</th>
                              <th className="pb-3 text-center">تغییر موجودی</th>
                              <th className="pb-3 text-right">علت / شرح رویداد</th>
                              <th className="pb-3 text-center">ثبت‌کننده</th>
                              <th className="pb-3 text-left">تاریخ ثبت تراکنش</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-850/60">
                            {filteredLogs.map((log) => (
                              <tr key={log.id} className="hover:bg-slate-850/10 transition-colors">
                                <td className="py-3.5 pr-1">
                                  <div className="text-[11px] font-bold text-slate-200">{log.productTitle}</div>
                                  <div className="text-[9px] text-slate-500 font-mono">شناسه: {log.productId}</div>
                                </td>
                                <td className="py-3.5 text-center">
                                  {log.type === 'in' ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                      ورود کالا
                                    </span>
                                  ) : log.type === 'damage' ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                      ضایعات
                                    </span>
                                  ) : log.type === 'sale' ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                      فروش سیستمی
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                      خروج / اصلاح
                                    </span>
                                  )}
                                </td>
                                <td className="py-3.5 text-center font-bold">
                                  <div className="text-[11px] text-slate-200" dir="ltr">
                                    {log.type === 'in' ? '+' : '-'}{formatPersianNumber(log.quantity)}
                                  </div>
                                  <div className="text-[9px] text-slate-500 font-medium">
                                    ({formatPersianNumber(log.previousStock)} ➔ {formatPersianNumber(log.newStock)})
                                  </div>
                                </td>
                                <td className="py-3.5 text-slate-300 text-[11px] max-w-xs leading-relaxed">
                                  {log.description}
                                </td>
                                <td className="py-3.5 text-center text-slate-400 text-[11px]">
                                  {log.operator}
                                </td>
                                <td className="py-3.5 text-left text-slate-500 text-[10px] font-mono">
                                  {new Date(log.date).toLocaleDateString('fa-IR')} - {new Date(log.date).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ================= TAB 11: SUPPORT TICKETS & CHAT ================= */}
        {activeTab === 'support' && (
          <motion.div
            key="support-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-right animate-fade-in"
            dir="rtl"
          >
            {/* Left column: Ticket list */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
              <h3 className="text-xs font-black text-gold-400 pb-3 border-b border-slate-850 flex items-center gap-2">
                <HelpCircle size={16} />
                <span>تیکت‌های پشتیبانی کاربران ({formatPersianNumber(adminTickets.length)})</span>
              </h3>

              {isAdminTicketsLoading && adminTickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <div className="animate-spin h-6 w-6 border-2 border-gold-500 border-t-transparent rounded-full" />
                  <span className="text-[10px] text-slate-400">در حال دریافت لیست تیکت‌ها...</span>
                </div>
              ) : adminTickets.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  هیچ تیکت پشتیبانی در سیستم ثبت نشده است.
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
                  {adminTickets.map((ticket) => {
                    const isSelected = adminActiveTicketId === ticket.id;
                    return (
                      <button
                        key={ticket.id}
                        onClick={() => setAdminActiveTicketId(ticket.id)}
                        className={`w-full text-right p-4 rounded-2xl border transition-all flex flex-col gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-gold-500/10 border-gold-500/30 text-slate-100'
                            : 'bg-slate-950/40 border-slate-850 hover:border-slate-800 text-slate-300 hover:text-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-extrabold text-[11px] truncate max-w-[180px]">
                            {ticket.subject}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            ticket.status === 'open' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' :
                            ticket.status === 'answered' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {ticket.status === 'open' ? 'باز' :
                             ticket.status === 'answered' ? 'پاسخ داده شده' : 'بسته شده'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 w-full mt-1">
                          <span>{ticket.userName} ({ticket.userEmail})</span>
                          <span className="font-mono text-[9px]">
                            {new Date(ticket.createdAt).toLocaleDateString('fa-IR')}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right column: Active chat box */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col h-[650px] shadow-xl overflow-hidden">
              {adminActiveTicketId ? (
                (() => {
                  const activeTicket = adminTickets.find((t) => t.id === adminActiveTicketId);
                  return (
                    <div className="flex flex-col h-full justify-between">
                      {/* Chat Header */}
                      <div className="border-b border-slate-850 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                        <div>
                          <span className="text-[10px] text-slate-500 block">مکالمه پشتیبانی با</span>
                          <h4 className="text-xs font-black text-slate-200">
                            {activeTicket?.userName} <span className="font-mono text-slate-500 text-[10px]">({activeTicket?.userEmail})</span>
                          </h4>
                          <span className="text-[10px] text-gold-400 mt-1 block">موضوع: {activeTicket?.subject}</span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1.5 shrink-0">
                          {activeTicket?.status !== 'answered' && activeTicket?.status !== 'closed' && (
                            <button
                              onClick={() => handleMarkAsAnswered(adminActiveTicketId)}
                              className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 border border-emerald-500/20 rounded-lg px-2.5 py-1.5 text-[9px] font-black transition-all cursor-pointer"
                            >
                              تغییر به پاسخ‌داده‌شده
                            </button>
                          )}
                          {activeTicket?.status !== 'closed' && (
                            <button
                              onClick={() => handleCloseTicket(adminActiveTicketId)}
                              className="bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 rounded-lg px-2.5 py-1.5 text-[9px] font-black transition-all cursor-pointer"
                            >
                              بستن تیکت
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Messages Container */}
                      <div className="flex-1 overflow-y-auto my-4 space-y-3 p-2 bg-slate-950/20 rounded-2xl border border-slate-850/40 scrollbar-thin">
                        {isAdminTicketChatLoading && adminTicketMessages.length === 0 ? (
                          <div className="flex items-center justify-center h-full">
                            <div className="animate-spin h-5 w-5 border-2 border-gold-500 border-t-transparent rounded-full" />
                          </div>
                        ) : adminTicketMessages.length === 0 ? (
                          <div className="text-center text-slate-500 py-12 text-xs">
                            هیچ پیامی در این تیکت رد و بدل نشده است. گفتگو را آغاز نمایید.
                          </div>
                        ) : (
                          adminTicketMessages.map((msg) => {
                            const isUserSender = msg.senderRole === 'user';
                            return (
                              <div
                                key={msg.id}
                                className={`flex flex-col max-w-[85%] rounded-2xl p-3.5 space-y-1 ${
                                  isUserSender
                                    ? 'bg-slate-800/40 border border-slate-800 text-slate-200 mr-auto rounded-tl-none'
                                    : 'bg-gold-500/10 border border-gold-500/20 text-slate-100 ml-auto rounded-tr-none'
                                }`}
                              >
                                <span className="text-[9px] text-slate-500 font-extrabold">
                                  {isUserSender ? 'کاربر خریدار' : `مدیر گالری (${msg.senderName})`}
                                </span>
                                <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                                <span className="text-[8px] text-slate-500 text-left font-mono block mt-1">
                                  {new Date(msg.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Message Input Box */}
                      {activeTicket?.status === 'closed' ? (
                        <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-3 text-center text-xs text-slate-500 shrink-0">
                          این تیکت بسته شده است و امکان ارسال پیام جدید وجود ندارد. جهت پاسخ‌دهی مجدد ابتدا وضعیت را تغییر دهید.
                        </div>
                      ) : (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleAdminSendTicketMessage(e);
                          }}
                          className="flex gap-2 items-center shrink-0"
                        >
                          <input
                            type="text"
                            value={adminChatInput}
                            onChange={(e) => setAdminChatInput(e.target.value)}
                            placeholder="پاسخ خود را بنویسید..."
                            className="flex-1 rounded-xl bg-slate-950 border border-slate-850 px-4 py-3 text-xs text-slate-100 outline-none hover:border-slate-800 focus:border-gold-500/40 transition-colors"
                          />
                          <button
                            type="submit"
                            className="bg-gold-500 hover:bg-gold-400 text-slate-950 font-black rounded-xl px-5 py-3 text-xs transition-colors cursor-pointer shrink-0"
                          >
                            ارسال پاسخ
                          </button>
                        </form>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="flex flex-col items-center justify-center h-full space-y-3 text-center text-slate-500">
                  <HelpCircle size={32} className="text-slate-600 animate-pulse" />
                  <span className="text-xs">لطفاً از ستون کناری، یک تیکت فعال را برای شروع پاسخ‌دهی و مکالمه انتخاب کنید.</span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ================= OVERLAYS: 0. ADVANCED IMAGE GALLERY MANAGER ================= */}
        <AnimatePresence>
          {selectedGalleryProduct && (
            <ProductImageGalleryManager
              product={selectedGalleryProduct}
              onSaveGallery={async (productId, images) => {
                try {
                  await onEditProduct(productId, { images });
                  // Update the local state so the manager reflects the newly-saved list of images
                  setSelectedGalleryProduct(prev => prev ? { ...prev, images } : null);
                  triggerToast('آلبوم تصاویر فرعی محصول با موفقیت به‌روزرسانی و ذخیره شد.', 'success');
                } catch (err: any) {
                  triggerToast(err.message || 'خطا در به‌روزرسانی گالری تصاویر.', 'error');
                }
              }}
              onClose={() => setSelectedGalleryProduct(null)}
            />
          )}
        </AnimatePresence>

        <ConfirmModal
          confirmDialog={confirmModal}
          onClose={() => setConfirmModal(null)}
        />

      {/* ================= OVERLAYS: 2. PREMIUM TOAST STACK ================= */}
      <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-50 space-y-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              className="pointer-events-auto w-full rounded-2xl bg-slate-900 border border-slate-850 p-3.5 shadow-2xl flex items-center justify-between gap-3 text-right"
            >
              <div className="flex items-center gap-3">
                {t.type === 'success' && (
                  <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle size={16} />
                  </div>
                )}
                {t.type === 'error' && (
                  <div className="h-7 w-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
                    <AlertCircle size={16} />
                  </div>
                )}
                {t.type === 'info' && (
                  <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                    <AlertCircle size={16} />
                  </div>
                )}
                <span className="text-[11px] font-bold text-slate-200 leading-relaxed">{t.message}</span>
              </div>
              <button
                onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
                className="text-slate-500 hover:text-slate-300 p-1 rounded transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ================= OVERLAYS: 3. MOBILE SLIDING DRAWER SHEET FORM ================= */}
      <AnimatePresence>
        {isProductFormOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex items-end justify-center">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProductFormOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            {/* Sheet drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-h-[90vh] rounded-t-[2.5rem] bg-slate-900 border-t border-slate-800 p-6 shadow-2xl text-right flex flex-col overflow-hidden z-10"
            >
              {/* Top notch indicator */}
              <div className="w-12 h-1 bg-slate-800 rounded-full mx-auto mb-4 shrink-0" />
              
              {/* Header */}
              <div className="flex justify-between items-center border-b border-slate-850 pb-3 mb-4 shrink-0">
                <span className="text-xs font-black text-gold-400">
                  {editingId ? '✍️ ویرایش مشخصات کالا' : '➕ افزودن کالا جدید به انبار'}
                </span>
                <button
                  onClick={() => setIsProductFormOpen(false)}
                  className="p-1 text-slate-500 hover:text-slate-300 bg-slate-950 rounded-lg cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto pb-6 space-y-4 pr-1 scrollbar-thin">
                <form onSubmit={handleProductSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1.5">نام کامل کالا *</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="مثال: انگشتر زمرد سلطنتی آبکاری شده"
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1.5">قیمت کالا (تومان) *</label>
                      <input
                        type="number"
                        required
                        value={price}
                        onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="مثال: 980000"
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1.5">موجودی عددی انبار *</label>
                      <input
                        type="number"
                        required
                        value={stock}
                        onChange={(e) => setStock(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="مثال: 15"
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1.5">تخفیف ویژه (٪)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="مثال: 15"
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1.5">انتخاب دسته‌بندی *</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-xs text-slate-300 outline-none"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Dynamic tag-based variants */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1.5">مدیریت رنگ و تنوع طرح‌ها</label>
                    <div className="flex flex-wrap gap-1.5 mb-2 p-2 bg-slate-950 rounded-xl border border-slate-800">
                      {variantsList.map((v, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 bg-gold-500/10 text-gold-400 border border-gold-500/20 px-2 py-1 rounded-lg text-[10px] font-bold"
                        >
                          <span>{v}</span>
                          <button
                            type="button"
                            onClick={() => setVariantsList(variantsList.filter((_, i) => i !== idx))}
                            className="text-gold-500 hover:text-rose-400 font-bold transition-colors cursor-pointer"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                      {variantsList.length === 0 && (
                        <span className="text-[10px] text-slate-500">بدون تنوع (فقط مدل پایه)</span>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newVariantInput}
                        onChange={(e) => setNewVariantInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = newVariantInput.trim();
                            if (val && !variantsList.includes(val)) {
                              setVariantsList([...variantsList, val]);
                              setNewVariantInput('');
                            }
                          }
                        }}
                        placeholder="افزودن تنوع جدید..."
                        className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-[10px] text-slate-100 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = newVariantInput.trim();
                          if (val && !variantsList.includes(val)) {
                            setVariantsList([...variantsList, val]);
                            setNewVariantInput('');
                          }
                        }}
                        className="rounded-xl bg-slate-800 hover:bg-slate-750 text-gold-400 border border-slate-800 px-3 py-2 text-[10px] font-bold cursor-pointer"
                      >
                        افزودن
                      </button>
                    </div>
                    
                    {/* Suggestions */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {['طلایی', 'نقره‌ای', 'رزگلد', 'سفید صدفی', 'زمردی', 'یاقوتی', 'فری‌سایز'].map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          disabled={variantsList.includes(sug)}
                          onClick={() => setVariantsList([...variantsList, sug])}
                          className="text-[8px] bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-850 rounded-md px-1.5 py-0.5 transition-all cursor-pointer disabled:opacity-20"
                        >
                          +{sug}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Image with Base64 */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1.5">تصویر اصلی محصول *</label>
                    {image && (
                      <div className="relative h-24 w-24 mx-auto mb-3 rounded-2xl overflow-hidden border border-slate-800">
                        <img src={image} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        placeholder="آدرس اینترنتی یا مسیر عکس..."
                        className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 outline-none text-left"
                        dir="ltr"
                      />
                      
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) {
                                  setImage(event.target.result as string);
                                  triggerToast('تصویر با موفقیت بارگذاری و اعمال شد.', 'success');
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <button
                          type="button"
                          className="rounded-xl bg-gold-500/10 hover:bg-gold-500/20 border border-gold-500/20 text-gold-400 px-3 py-2 text-xs font-bold cursor-pointer"
                        >
                          آپلود
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mt-2">
                      {imagePresets.map((pr, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setImage(pr.path)}
                          className={`text-[8px] rounded-md px-1.5 py-0.5 border transition-all cursor-pointer ${
                            image === pr.path 
                              ? 'border-gold-500 text-gold-400 bg-gold-500/10 font-bold' 
                              : 'border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {pr.name}
                        </button>
                      ))}
                    </div>

                    {/* Advanced Gallery trigger if editing */}
                    {editingId && (
                      <button
                        type="button"
                        onClick={() => {
                          const prod = products.find(p => p.id === editingId);
                          if (prod) setSelectedGalleryProduct(prod);
                        }}
                        className="w-full mt-3 flex items-center justify-center gap-1.5 bg-slate-950 hover:bg-slate-900 text-slate-300 border border-slate-850 hover:border-slate-800 rounded-xl py-2 text-[10px] font-bold transition-all cursor-pointer"
                      >
                        <Images size={12} className="text-gold-400" />
                        <span>مدیریت گالری تصاویر بهینه‌سازی شده این محصول ({products.find(p => p.id === editingId)?.images?.length || 0} عکس فرعی)</span>
                      </button>
                    )}
                  </div>

                  {/* Featured & Active Toggles for Mobile */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-950/40 border border-slate-850 rounded-2xl p-3">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setIsFeatured(!isFeatured)}
                        className={`w-8 h-4.5 rounded-full p-0.5 transition-all duration-200 ${isFeatured ? 'bg-gold-500' : 'bg-slate-800'}`}
                      >
                        <div className={`bg-slate-900 w-3.5 h-3.5 rounded-full shadow-md transition-all duration-200 ${isFeatured ? 'translate-x-3.5' : 'translate-x-0'}`} />
                      </button>
                      <span className="text-[9px] font-black text-slate-300">محصول ویژه</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setIsActive(!isActive)}
                        className={`w-8 h-4.5 rounded-full p-0.5 transition-all duration-200 ${isActive ? 'bg-gold-500' : 'bg-slate-800'}`}
                      >
                        <div className={`bg-slate-900 w-3.5 h-3.5 rounded-full shadow-md transition-all duration-200 ${isActive ? 'translate-x-3.5' : 'translate-x-0'}`} />
                      </button>
                      <span className="text-[9px] font-black text-slate-300">نمایش در سایت</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1.5">توضیحات و خصوصیات فنی کالا</label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="ابعاد، ضد حساسیت بودن عیار آبکاری و ..."
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-gold-500 text-slate-950 font-black py-3.5 text-xs transition-transform hover:scale-[1.01] cursor-pointer"
                  >
                    {editingId ? 'ثبت تغییرات نهایی کالا' : 'افزودن محصول جدید'}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
