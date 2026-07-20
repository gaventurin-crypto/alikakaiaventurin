import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Gift,
  Truck,
  RotateCcw,
  ShieldCheck,
  Star,
  ChevronDown,
  ShoppingBag,
  MessageCircle,
  Eye,
  X,
  Plus,
  Minus,
  Check,
  Heart,
  ExternalLink,
  Info,
  Lock,
  User,
  Key,
  Mail,
  Smartphone,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Header from './components/Header';
import Footer from './components/Footer';
import AdminPanel from './components/AdminPanel';
import UserPages from './components/UserPages';
import PaymentGateway from './components/PaymentGateway';
import { Product, CartItem, Order, Coupon } from './types';
import { formatPersianPrice, formatPersianNumber } from './components/ProductCard';
import { api } from './lib/api';

export default function App() {
  // Core e-commerce states fetched from backend
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [cmsTexts, setCmsTexts] = useState({ about: '', terms: '', contact: '' });
  const [storeSettings, setStoreSettings] = useState({ currencyUnit: 'تومان' as 'تومان' | 'ریال', shippingCost: 35000, taxPercent: 9 });
  const [profile, setProfile] = useState({
    name: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    postalCode: '',
    birthDate: '',
    points: 0,
    role: 'user'
  });

  // Navigation & filters
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    if (term.trim() !== '') {
      setCurrentView('shop');
      setUserView('catalog');
    }
  };
  const [currentView, setCurrentView] = useState<'shop' | 'admin'>('shop');
  const [userView, setUserView] = useState<'home' | 'catalog' | 'categories' | 'product' | 'cart' | 'checkout' | 'account' | 'about' | 'contact' | 'terms'>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // User auth state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authError, setAuthError] = useState('');
  const [authRedirectTarget, setAuthRedirectTarget] = useState<'admin' | 'account' | null>(null);

  // Active user list for back-office (admin only)
  const [usersList, setUsersList] = useState<any[]>([]);

  // Payment gateway trigger state
  const [activePayment, setActivePayment] = useState<{
    isOpen: boolean;
    amount: number;
    authority: string;
    customerData: any;
  } | null>(null);

  // Success modal triggers after verified checkout payment
  const [successOrder, setSuccessOrder] = useState<{
    trackingCode: string;
    customerName: string;
    totalAmount: number;
  } | null>(null);

  interface ToastItem {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Central function to pull latest server-side database states
  const refreshServerState = async () => {
    // 1. Fetch public/unprotected store data first
    try {
      const prodList = await api.getProducts();
      setProducts(prodList);

      const catList = await api.getCategories();
      setCategories(catList);

      const couponList = await api.getCoupons();
      setCoupons(couponList);

      const cms = await api.getCmsTexts();
      setCmsTexts(cms);

      const settings = await api.getStoreSettings();
      setStoreSettings(settings);
    } catch (err) {
      console.error('Failed to load public server database states:', err);
    }

    // 2. Fetch authenticated user data safely if a local session exists
    const user = api.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      try {
        // Fetch detailed orders list (backend filters appropriately if role is user or admin)
        const orderList = await api.getOrders();
        setOrders(orderList);

        // Fetch user list if admin or superadmin
        if (user.role === 'admin' || user.role === 'superadmin') {
          const userRecords = await api.getUsers();
          setUsersList(userRecords);
        }
      } catch (err: any) {
        console.warn('User session validation failed (token likely expired or invalid). Clearing session.', err);
        // Automatically clear session so user can login cleanly and doesn't get blocked
        api.logout();
        setCurrentUser(null);
      }
    }
  };

  useEffect(() => {
    refreshServerState();

    // Attach global toast helper and replace blocky native alert dialog
    (window as any).showToast = showToast;
    window.alert = (message: string) => {
      let type: 'success' | 'error' | 'info' = 'info';
      if (message.includes('✓') || message.includes('موفقیت') || message.includes('شد') || message.includes('موفق')) {
        type = 'success';
      } else if (message.includes('خطا') || message.includes('متأسفانه') || message.includes('اشتباه') || message.includes('ناقص')) {
        type = 'error';
      }
      showToast(message, type);
    };

    // Load Cart from localStorage (cart is local-first)
    const savedCart = localStorage.getItem('aventurin_cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // SEO standard: Dynamic tab title updating based on routing views
  useEffect(() => {
    if (currentView === 'admin') {
      document.title = 'پنل مدیریت فروشگاه | گالری آونتورین';
    } else {
      switch (userView) {
        case 'home':
          document.title = 'گالری زیورآلات و اکسسوری لوکس آونتورین | خرید آنلاین بدلیجات خاص';
          break;
        case 'catalog':
          document.title = 'کاتالوگ و لیست محصولات | گالری آونتورین';
          break;
        case 'categories':
          document.title = 'دسته‌بندی اکسسوری‌ها | گالری آونتورین';
          break;
        case 'product':
          document.title = selectedProduct ? `${selectedProduct.title} | گالری آونتورین` : 'جزئیات محصول | گالری آونتورین';
          break;
        case 'cart':
          document.title = 'سبد خرید شما | گالری آونتورین';
          break;
        case 'checkout':
          document.title = 'تسویه حساب و پرداخت | گالری آونتورین';
          break;
        case 'account':
          document.title = 'حساب کاربری و سوابق خرید | گالری آونتورین';
          break;
        case 'about':
          document.title = 'درباره ما و داستان گالری | گالری آونتورین';
          break;
        case 'contact':
          document.title = 'تماس با ما و شعب حضوری | گالری آونتورین';
          break;
        case 'terms':
          document.title = 'قوانین و مقررات خرید | گالری آونتورین';
          break;
        default:
          document.title = 'گالری آونتورین | زیورآلات و بدلیجات طرح طلا';
      }
    }
  }, [currentView, userView, selectedProduct]);

  // Set Profile fields whenever currentUser is refreshed
  useEffect(() => {
    if (currentUser) {
      setProfile({
        name: currentUser.name || '',
        lastName: currentUser.lastName || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        address: currentUser.address || '',
        postalCode: currentUser.postalCode || '',
        birthDate: currentUser.birthDate || '',
        points: currentUser.points || 0,
        role: currentUser.role || 'user'
      });
    } else {
      setProfile({
        name: '',
        lastName: '',
        phone: '',
        email: '',
        address: '',
        postalCode: '',
        birthDate: '',
        points: 0,
        role: 'user'
      });
    }
  }, [currentUser]);

  // Sync cart helper
  const saveCartToStorage = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('aventurin_cart', JSON.stringify(newCart));
  };

  // Auth Submit Handlers
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    try {
      if (authTab === 'login') {
        const res = await api.login(authEmail, authPassword);
        setCurrentUser(res.user);
        setIsAuthOpen(false);

        // Notify client
        showToast('ورود با موفقیت انجام شد!');

        // Reload orders
        const orderList = await api.getOrders();
        setOrders(orderList);

        if (res.user.role === 'admin' || res.user.role === 'superadmin') {
          const userRecords = await api.getUsers();
          setUsersList(userRecords);
        }

        // Handle redirect
        if (authRedirectTarget === 'admin') {
          if (res.user.role === 'admin' || res.user.role === 'superadmin') {
            setCurrentView('admin');
          } else {
            alert('حساب کاربری شما دسترسی مدیریت ندارد.');
            setCurrentView('shop');
            setUserView('home');
          }
        } else if (authRedirectTarget === 'account') {
          setUserView('account');
        } else if (authRedirectTarget === 'handmades') {
          setUserView('handmades');
        }
      } else {
        const res = await api.register({
          name: authName,
          email: authEmail,
          password: authPassword,
          phone: authPhone,
        });
        setCurrentUser(res.user);
        setIsAuthOpen(false);
        showToast('ثبت‌نام با موفقیت انجام شد!');

        const orderList = await api.getOrders();
        setOrders(orderList);

        if (authRedirectTarget === 'account') {
          setUserView('account');
        } else if (authRedirectTarget === 'handmades') {
          setUserView('handmades');
        }
      }

      // Reset fields
      setAuthEmail('');
      setAuthPassword('');
      setAuthName('');
      setAuthPhone('');
      setAuthRedirectTarget(null);
    } catch (err: any) {
      setAuthError(err.message || 'خطا در احراز هویت.');
    }
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setOrders([]);
    setUsersList([]);
    setCurrentView('shop');
    setUserView('home');
    showToast('با موفقیت از حساب کاربری خارج شدید.');
  };

  // Back-office Product Actions (Proxying to server API)
  const handleAddProduct = async (newProd: Omit<Product, 'id'>) => {
    try {
      await api.addProduct(newProd);
      await refreshServerState();
      alert('زیورآلات با موفقیت به کاتالوگ فروشگاه افزوده شد.');
    } catch (err: any) {
      alert(err.message || 'خطا در ثبت محصول.');
    }
  };

  const handleEditProduct = async (id: string, updatedFields: Partial<Product>) => {
    try {
      await api.editProduct(id, updatedFields);
      await refreshServerState();
    } catch (err: any) {
      alert(err.message || 'خطا در ویرایش محصول.');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('آیا از حذف این زیورآلات از کاتالوگ فروشگاه اطمینان دارید؟')) {
      try {
        await api.deleteProduct(id);
        await refreshServerState();
        alert('محصول با موفقیت حذف گردید.');
      } catch (err: any) {
        alert(err.message || 'خطا در حذف محصول.');
      }
    }
  };

  // Categories Actions
  const handleAddCategory = async (id: string, name: string) => {
    try {
      await api.addCategory(id, name);
      await refreshServerState();
      alert('دسته‌بندی جدید ثبت شد.');
    } catch (err: any) {
      alert(err.message || 'خطا در ثبت دسته‌بندی.');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('آیا از حذف این دسته‌بندی اطمینان دارید؟')) {
      try {
        await api.deleteCategory(id);
        await refreshServerState();
        alert('دسته‌بندی حذف شد.');
      } catch (err: any) {
        alert(err.message || 'خطا در حذف دسته‌بندی.');
      }
    }
  };

  // User updates
  const handleUpdateUser = async (id: string, updates: any) => {
    try {
      if (id) {
        await api.updateUser(id, updates);
      }
      await refreshServerState();
    } catch (err: any) {
      alert(err.message || 'خطا در به‌روزرسانی کاربر.');
    }
  };

  // Coupon Actions
  const handleAddCoupon = async (coupon: Coupon) => {
    try {
      await api.addCoupon(coupon);
      await refreshServerState();
      alert('کد تخفیف با موفقیت فعال شد.');
    } catch (err: any) {
      alert(err.message || 'خطا در ایجاد کد تخفیف.');
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    if (confirm('آیا مایل به حذف این کد تخفیف هستید؟')) {
      try {
        await api.deleteCoupon(code);
        await refreshServerState();
        alert('کد تخفیف حذف گردید.');
      } catch (err: any) {
        alert(err.message || 'خطا در حذف تخفیف.');
      }
    }
  };

  // CMS Updates
  const handleUpdateCMSTexts = async (cms: any) => {
    try {
      await api.updateCmsTexts(cms);
      setCmsTexts(cms);
      alert('محتوای صفحات به‌روزرسانی شد.');
    } catch (err: any) {
      alert(err.message || 'خطا در ذخیره محتوا.');
    }
  };

  // Store Settings
  const handleUpdateStoreSettings = async (settings: any) => {
    try {
      await api.updateStoreSettings(settings);
      setStoreSettings(settings);
      alert('تنظیمات فروشگاه ذخیره گردید.');
    } catch (err: any) {
      alert(err.message || 'خطا در ذخیره تنظیمات.');
    }
  };

  // Profile Update (Visual for user view)
  const handleUpdateProfile = async (p: any) => {
    try {
      const res = await api.updateProfile({
        name: p.name,
        lastName: p.lastName,
        phone: p.phone,
        address: p.address,
        postalCode: p.postalCode,
        birthDate: p.birthDate,
        password: p.password
      });
      setProfile({
        name: res.user.name || '',
        lastName: res.user.lastName || '',
        email: res.user.email || '',
        phone: res.user.phone || '',
        address: res.user.address || '',
        postalCode: res.user.postalCode || '',
        birthDate: res.user.birthDate || '',
        points: res.user.points || 0,
        role: res.user.role || 'user'
      });
      setCurrentUser(res.user);
      showToast('تغییرات پروفایل با موفقیت در پایگاه داده گالری ذخیره شد.', 'success');
    } catch (err: any) {
      showToast(err.message || 'خطا در به‌روزرسانی پروفایل.', 'error');
    }
  };

  // Add to cart action
  const handleAddToCart = (product: Product, variant: string) => {
    if (product.stock === 0) {
      alert('متأسفانه موجودی این محصول به اتمام رسیده است.');
      return;
    }

    const updatedCart = [...cart];
    const existingIndex = updatedCart.findIndex(
      (item) => item.product.id === product.id && item.selectedVariant === variant
    );

    if (existingIndex > -1) {
      if (updatedCart[existingIndex].quantity >= product.stock) {
        alert(`متأسفانه امکان خرید بیشتر وجود ندارد. حداکثر موجودی محصول ${formatPersianNumber(product.stock)} عدد است.`);
        return;
      }
      updatedCart[existingIndex].quantity += 1;
    } else {
      updatedCart.push({ product, quantity: 1, selectedVariant: variant });
    }

    saveCartToStorage(updatedCart);
    setUserView('cart'); // Go to cart screen
    showToast('محصول با موفقیت به سبد خرید افزوده شد!');
  };

  // Update Quantity
  const handleUpdateQuantity = (productId: string, variant: string, change: number) => {
    const updatedCart = cart
      .map((item) => {
        if (item.product.id === productId && item.selectedVariant === variant) {
          const newQty = item.quantity + change;
          if (newQty > item.product.stock) {
            alert(`حداکثر موجودی این کالا در انبار ${formatPersianNumber(item.product.stock)} عدد می‌باشد.`);
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      })
      .filter((item) => item.quantity > 0);

    saveCartToStorage(updatedCart);
  };

  // Remove Item
  const handleRemoveItem = (productId: string, variant: string) => {
    const updatedCart = cart.filter(
      (item) => !(item.product.id === productId && item.selectedVariant === variant)
    );
    saveCartToStorage(updatedCart);
  };

  // Admin Order Status Update
  const handleUpdateOrderStatus = async (id: string, status: string) => {
    try {
      await api.updateOrderStatus(id, status);
      await refreshServerState();
    } catch (err: any) {
      alert(err.message || 'خطا در تغییر وضعیت سفارش.');
    }
  };

  // Trigger Checkout Proceed (Launch Shaparak)
  const handleProceedToPayment = async (customerData: any) => {
    // If not logged in, prompt they must login first to complete checkout
    if (!currentUser) {
      setAuthRedirectTarget('account');
      setAuthTab('login');
      setIsAuthOpen(true);
      alert('لطفاً ابتدا وارد حساب کاربری خود شوید تا سفارش شما متصل شود.');
      return;
    }

    const subtotal = cart.reduce((sum, item) => {
      const hasDiscount = item.product.discount && item.product.discount > 0;
      const finalPrice = hasDiscount
        ? item.product.price * (1 - (item.product.discount || 0) / 100)
        : item.product.price;
      return sum + finalPrice * item.quantity;
    }, 0);
    const shippingCost = subtotal >= 500000 ? 0 : storeSettings.shippingCost;
    const finalAmount = subtotal + shippingCost;

    try {
      const session = await api.createPaymentSession(finalAmount, null, cart, customerData);
      setActivePayment({
        isOpen: true,
        amount: finalAmount,
        authority: session.authority,
        customerData,
      });
    } catch (err: any) {
      alert(err.message || 'خطا در راه‌اندازی درگاه پرداخت.');
    }
  };

  // Payment Webhook/Callback simulation Success Handler
  const handlePaymentSuccess = async (trackingCode: string) => {
    if (!activePayment) return;

    try {
      const result = await api.verifyPayment(activePayment.authority, 'OK');
      if (result.status === 'success') {
        saveCartToStorage([]); // Clear cart
        setSuccessOrder({
          trackingCode: trackingCode,
          customerName: activePayment.customerData.name,
          totalAmount: activePayment.amount,
        });

        // Pull updated stocks and orders from backend
        await refreshServerState();
      } else {
        alert(result.message || 'خطا در تایید تراکنش درگاه بانکی.');
      }
    } catch (err: any) {
      alert(err.message || 'خطا در برقراری ارتباط با وب‌سرویس بانک.');
    } finally {
      setActivePayment(null);
    }
  };

  // Payment Cancel Handler
  const handlePaymentCancel = async () => {
    if (activePayment) {
      try {
        await api.verifyPayment(activePayment.authority, 'FAIL');
      } catch (e) {
        console.error('Failed to report transaction failure:', e);
      }
    }
    setActivePayment(null);
    alert('تراکنش پرداخت توسط کاربر لغو گردید. کالاها کماکان در سبد خرید شما در دسترس است.');
  };

  // Navigation Routing Safety
  const handleAdminPanelToggle = () => {
    if (currentView === 'shop') {
      if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin')) {
        setCurrentView('admin');
      } else {
        // Prompt for admin login
        setAuthRedirectTarget('admin');
        setAuthTab('login');
        setIsAuthOpen(true);
      }
    } else {
      setCurrentView('shop');
    }
  };

  const handleAccountViewToggle = () => {
    setCurrentView('shop');
    if (currentUser) {
      setUserView('account');
    } else {
      setAuthRedirectTarget('account');
      setAuthTab('login');
      setIsAuthOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between font-sans selection:bg-gold-200" id="app-root">
      
      {/* HEADER COMPONENT */}
      <Header
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => {
          setCurrentView('shop');
          setUserView('cart');
        }}
        onAdminClick={handleAdminPanelToggle}
        onHomeClick={() => {
          setCurrentView('shop');
          setUserView('home');
        }}
        onCategorySelect={(cat) => {
          setActiveCategory(cat);
          setCurrentView('shop');
          setUserView('catalog');
        }}
        activeCategory={activeCategory}
        currentView={currentView}
        searchTerm={searchTerm}
        setSearchTerm={handleSearchChange}
        onHandmadesClick={() => {
          setCurrentView('shop');
          setUserView('handmades');
        }}
        onAboutClick={() => {
          setCurrentView('shop');
          setUserView('about');
        }}
        onContactClick={() => {
          setCurrentView('shop');
          setUserView('contact');
        }}
        userView={userView}
        cms={cmsTexts}
        currentUser={currentUser}
        onAccountClick={handleAccountViewToggle}
        onLogout={handleLogout}
      />

      {/* CORE CONTENT ROUTER */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          
          {/* VIEW 1: SHOPPING CLIENT APP */}
          {currentView === 'shop' && (
            <motion.div
              key="shop-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <UserPages
                products={products}
                cart={cart}
                orders={orders}
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                searchTerm={searchTerm}
                setSearchTerm={handleSearchChange}
                onAddToCart={handleAddToCart}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onProceedToPayment={handleProceedToPayment}
                userView={userView}
                setUserView={(view: any) => {
                  if (view === 'account' && !currentUser) {
                    setAuthRedirectTarget('account');
                    setIsAuthOpen(true);
                  } else if (view === 'handmades' && !currentUser) {
                    setAuthRedirectTarget('handmades');
                    setIsAuthOpen(true);
                  } else {
                    setUserView(view);
                  }
                }}
                selectedProduct={selectedProduct}
                setSelectedProduct={setSelectedProduct}
                aboutText={cmsTexts.about || ''}
                termsText={cmsTexts.terms || ''}
                contactText={cmsTexts.contact || ''}
                currencyUnit={storeSettings.currencyUnit}
                shippingCostSetting={storeSettings.shippingCost}
                taxPercent={storeSettings.taxPercent}
                profile={profile}
                onUpdateProfile={handleUpdateProfile}
                coupons={coupons}
                currentUser={currentUser}
                onAuthRequired={(target: 'account' | 'handmades') => {
                  setAuthRedirectTarget(target);
                  setIsAuthOpen(true);
                }}
                onLogout={handleLogout}
                cms={cmsTexts}
                categories={categories as any[]}
              />
            </motion.div>
          )}

          {/* VIEW 2: REINFORCED ADMIN PANEL */}
          {currentView === 'admin' && currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin') && (
            <motion.div
              key="admin-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AdminPanel
                currentUser={currentUser}
                products={products}
                orders={orders}
                onAddProduct={handleAddProduct}
                onEditProduct={handleEditProduct}
                onDeleteProduct={handleDeleteProduct}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                categories={categories}
                onAddCategory={handleAddCategory}
                onDeleteCategory={handleDeleteCategory}
                users={usersList}
                onUpdateUser={handleUpdateUser}
                coupons={coupons}
                onAddCoupon={handleAddCoupon}
                onDeleteCoupon={handleDeleteCoupon}
                cmsTexts={cmsTexts}
                onUpdateCMSTexts={handleUpdateCMSTexts}
                storeSettings={storeSettings}
                onUpdateStoreSettings={handleUpdateStoreSettings}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* FOOTER COMPONENT */}
      <Footer cms={cmsTexts} />

      {/* AUTH OVERLAY MODAL */}
      <AnimatePresence>
        {isAuthOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAuthOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl overflow-hidden text-right"
              dir="rtl"
              id="auth-modal"
            >
              {/* Radial decor */}
              <div className="absolute inset-0 bg-gradient-radial from-gold-500/5 via-transparent to-transparent pointer-events-none" />

              <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
                <span className="text-sm font-black text-slate-100 font-serif flex items-center gap-1.5">
                  <Lock size={16} className="text-gold-400" />
                  {authTab === 'login' ? 'ورود به حساب کاربری' : 'عضویت در گالری آونتورین'}
                </span>
                <button
                  onClick={() => setIsAuthOpen(false)}
                  className="rounded-full p-1.5 text-slate-500 hover:text-slate-100 hover:bg-slate-850 transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Toggle tab */}
              <div className="flex bg-slate-950 rounded-xl p-1 mb-6 border border-slate-850/80">
                <button
                  type="button"
                  onClick={() => { setAuthTab('login'); setAuthError(''); }}
                  className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all ${
                    authTab === 'login' ? 'bg-gold-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-100'
                  }`}
                >
                  ورود
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthTab('register'); setAuthError(''); }}
                  className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all ${
                    authTab === 'register' ? 'bg-gold-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-100'
                  }`}
                >
                  ثبت‌نام جدید
                </button>
              </div>

              {authError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-4 py-2.5 rounded-xl mb-4 text-justify leading-relaxed">
                  ⚠️ {authError}
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authTab === 'register' && (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1.5">نام و نام خانوادگی</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={authName}
                          onChange={(e) => setAuthName(e.target.value)}
                          placeholder="مانند: الناز کریمی"
                          className="w-full rounded-xl bg-slate-950 border border-slate-800 pr-10 pl-4 py-2.5 text-xs text-slate-100 outline-none focus:border-gold-500 transition-all"
                        />
                        <User size={14} className="absolute top-3.5 right-3.5 text-slate-500" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1.5">شماره تلفن همراه (موبایل)</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={authPhone}
                          onChange={(e) => setAuthPhone(e.target.value)}
                          placeholder="مانند: 09123456789"
                          className="w-full rounded-xl bg-slate-950 border border-slate-800 pr-10 pl-4 py-2.5 text-xs text-slate-100 outline-none focus:border-gold-500 transition-all text-left"
                          dir="ltr"
                        />
                        <Smartphone size={14} className="absolute top-3.5 right-3.5 text-slate-500" />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5">آدرس پست الکترونیکی (ایمیل)</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 pr-10 pl-4 py-2.5 text-xs text-slate-100 outline-none focus:border-gold-500 transition-all text-left"
                      dir="ltr"
                    />
                    <Mail size={14} className="absolute top-3.5 right-3.5 text-slate-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5">رمز عبور</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 pr-10 pl-4 py-2.5 text-xs text-slate-100 outline-none focus:border-gold-500 transition-all text-left"
                      dir="ltr"
                    />
                    <Key size={14} className="absolute top-3.5 right-3.5 text-slate-500" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-gold-500 hover:bg-gold-400 text-slate-950 font-bold py-3 text-xs transition-all shadow-lg shadow-gold-500/10 cursor-pointer"
                >
                  {authTab === 'login' ? 'ورود به حساب کاربری' : 'ثبت نام و ایجاد حساب'}
                </button>
              </form>

              {/* Collapsible Developer Sandbox (Discreet and Professional) */}
              <div className="mt-6 border-t border-slate-800 pt-4">
                <details className="group">
                  <summary className="text-[10px] font-bold text-slate-500 cursor-pointer list-none flex items-center justify-between hover:text-slate-300 transition-colors">
                    <span>🛠️ بخش توسعه و ورود آسان (مخصوص تست سیستم)</span>
                    <span className="transition-transform group-open:rotate-180 text-[8px]">▼</span>
                  </summary>
                  <div className="mt-3 flex flex-col gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                    <button
                      onClick={() => {
                        setAuthEmail('alikakai2101@gmail.com');
                        setAuthPassword('admin123');
                        setAuthTab('login');
                      }}
                      type="button"
                      className="w-full text-right hover:bg-slate-850 px-2.5 py-1.5 rounded-lg text-[10px] text-gold-400/90 transition-all flex items-center justify-between"
                    >
                      <span>🔑 مدیریت کل: alikakai2101@gmail.com</span>
                      <span className="font-mono text-[9px] bg-gold-500/10 text-gold-400 px-1.5 py-0.5 rounded">پر کردن</span>
                    </button>
                    <button
                      onClick={() => {
                        setAuthEmail('maryam@example.com');
                        setAuthPassword('user123');
                        setAuthTab('login');
                      }}
                      type="button"
                      className="w-full text-right hover:bg-slate-850 px-2.5 py-1.5 rounded-lg text-[10px] text-slate-400 transition-all flex items-center justify-between"
                    >
                      <span>🔑 حساب کاربری دمو: maryam@example.com</span>
                      <span className="font-mono text-[9px] bg-slate-850 text-slate-300 px-1.5 py-0.5 rounded">پر کردن</span>
                    </button>
                  </div>
                </details>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FULL-SCREEN SHAPARAK PAYMENT GATEWAY SIMULATOR OVERLAY */}
      <AnimatePresence>
        {activePayment && activePayment.isOpen && (
          <PaymentGateway
            amount={activePayment.amount}
            merchantName="گالری زیورآلات لوکس آونتورین"
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentCancel={handlePaymentCancel}
          />
        )}
      </AnimatePresence>

      {/* FINAL CHECKOUT ORDER SUCCESS CONFIRMED DIALOG */}
      <AnimatePresence>
        {successOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg rounded-3xl bg-slate-900 p-8 text-center shadow-2xl border border-gold-500/30 overflow-hidden"
              dir="rtl"
              id="success-confirmed-dialog"
            >
              <div className="absolute inset-0 bg-gradient-radial from-gold-500/5 via-transparent to-transparent pointer-events-none" />

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4 animate-bounce">
                <Check size={32} className="stroke-[3]" />
              </div>

              <h3 className="text-xl font-black text-slate-100">سفارش شما با موفقیت ثبت گردید!</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed max-w-sm mx-auto">
                {successOrder.customerName} عزیز، از خرید و اعتماد شما به گالری زیورآلات آونتورین صمیمانه سپاسگزاریم. سفارش شما جهت بسته‌بندی و ارسال کالا به بخش انبار مخابره گردید.
              </p>

              {/* Order quick summary card */}
              <div className="w-full bg-slate-950 rounded-2xl p-5 my-6 text-right text-xs space-y-3 border border-slate-800">
                <div className="flex justify-between border-b border-slate-900 pb-2.5 font-en-nums">
                  <span className="text-slate-500">کد رهگیری تراکنش:</span>
                  <span className="text-gold-400 font-mono font-bold text-sm">{successOrder.trackingCode}</span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-2.5 font-en-nums">
                  <span className="text-slate-500">مجموع تراکنش نهایی:</span>
                  <span className="text-slate-100 font-extrabold text-sm">{formatPersianPrice(successOrder.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">وضعیت سفارش:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    آماده تحویل به پست پیشتاز
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 mb-6 leading-relaxed">
                کد رهگیری مرسوله پستی پس از تحویل بسته به مامور اداره پست برای شماره موبایل شما پیامک خواهد شد. جهت رهگیری یا پشتیبانی سفارش می‌توانید با کارشناسان گالری تماس حاصل فرمایید.
              </p>

              <button
                onClick={() => {
                  setSuccessOrder(null);
                  setUserView('account'); // Open order history
                }}
                className="w-full rounded-xl bg-gold-500 hover:bg-gold-400 text-slate-950 py-3.5 text-sm font-bold transition-all shadow-lg shadow-gold-500/10 cursor-pointer font-sans"
                id="btn-close-success-dialog"
              >
                مشاهده فاکتور و سابقه سفارشات
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GLOBAL BEAUTIFIED TOAST NOTIFICATION CONTAINER */}
      <div className="fixed bottom-6 left-6 z-50 space-y-3 max-w-sm pointer-events-none" dir="rtl">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className={`p-4 rounded-2xl shadow-xl backdrop-blur-md border flex items-center gap-3 pointer-events-auto w-full text-right ${
                toast.type === 'success' ? 'bg-slate-900/95 border-emerald-500/30 text-emerald-300' :
                toast.type === 'error' ? 'bg-slate-900/95 border-rose-500/30 text-rose-300' :
                'bg-slate-900/95 border-gold-500/30 text-gold-300'
              }`}
            >
              <div className={`p-1.5 rounded-xl flex items-center justify-center ${
                toast.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                toast.type === 'error' ? 'bg-rose-500/10 text-rose-400' :
                'bg-gold-500/10 text-gold-400'
              }`}>
                {toast.type === 'success' ? <Check size={16} /> :
                 toast.type === 'error' ? <X size={16} /> :
                 <Info size={16} />}
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold leading-relaxed">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-slate-500 hover:text-slate-300 transition-colors p-1"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}
