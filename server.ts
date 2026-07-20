import dotenv from "dotenv";
dotenv.config({ path: ".env" });

import express from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import { dbService } from './server/db/dbService';
import { PaymentService } from './server/services/PaymentService';
import { Product, Order, Coupon } from './src/types';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET || 'aventurin-ultra-secret-key-1405-gold';

app.use(express.json());

// Initialize Payment Service Layer
const paymentService = new PaymentService(process.env.ZARINPAL_MERCHANT_ID);

// Logger Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ================= AUTHENTICATION MIDDLEWARE =================

interface AuthRequest extends express.Request {
  user?: {
    id: string;
    email: string;
    role: 'admin' | 'user' | 'superadmin';
  };
}

const authenticateToken = (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'دسترسی غیرمجاز: توکن ارسال نشده است.' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      res.status(401).json({ message: 'توکن نامعتبر یا منقضی شده است.' });
      return;
    }
    req.user = user;
    next();
  });
};

const isAdmin = (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
    res.status(403).json({ message: 'دسترسی فقط مخصوص مدیران سیستم است.' });
    return;
  }
  next();
};

const isSuperAdmin = (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  if (!req.user || req.user.role !== 'superadmin') {
    res.status(403).json({ message: 'دسترسی فقط مخصوص مدیر کل سیستم است.' });
    return;
  }
  next();
};

// ================= API ENDPOINTS =================

// 1. Auth API
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, lastName, email, password, phone, address, postalCode, birthDate } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ message: 'وارد کردن نام، ایمیل و کلمه عبور الزامی است.' });
      return;
    }

    const existing = await dbService.getUserByEmail(email);
    if (existing) {
      res.status(400).json({ message: 'کاربری با این ایمیل قبلاً در سیستم ثبت‌نام کرده است.' });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const isTesterSuperAdmin = email.toLowerCase() === 'alikakai13722101@gmail.com' || email.toLowerCase() === 'alikakai2101@gmail.com';
    const newUser = await dbService.addUser({
      name,
      lastName: lastName || '',
      email: email.toLowerCase(),
      passwordHash,
      role: isTesterSuperAdmin ? 'superadmin' : 'user',
      status: 'active',
      phone: phone || '',
      address: address || '',
      postalCode: postalCode || '',
      birthDate: birthDate || '',
      points: 10 // Welcome points!
    });

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        lastName: newUser.lastName || '',
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        phone: newUser.phone,
        address: newUser.address,
        postalCode: newUser.postalCode,
        birthDate: newUser.birthDate || '',
        points: newUser.points || 10
      },
    });
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در ثبت‌نام کاربر: ' + err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: 'ایمیل و رمز عبور را وارد کنید.' });
      return;
    }

    const user = await dbService.getUserByEmail(email);

    if (!user) {
      res.status(400).json({ message: 'کاربری با این مشخصات یافت نشد.' });
      return;
    }

    if (user.status === 'blocked') {
      res.status(401).json({ message: 'حساب کاربری شما توسط مدیر مسدود شده است.' });
      return;
    }

    const validPassword = bcrypt.compareSync(password, user.passwordHash);
    if (!validPassword) {
      res.status(400).json({ message: 'کلمه عبور اشتباه است.' });
      return;
    }

    // Double check if this email is tester superadmin and upgrade role in database if it is not
    if ((email.toLowerCase() === 'alikakai13722101@gmail.com' || email.toLowerCase() === 'alikakai2101@gmail.com') && user.role !== 'superadmin') {
      user.role = 'superadmin';
      await dbService.updateUser(user.id, { role: 'superadmin' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        lastName: (user as any).lastName || '',
        email: user.email,
        role: user.role,
        status: user.status,
        phone: (user as any).phone || '',
        address: (user as any).address || '',
        postalCode: (user as any).postalCode || '',
        birthDate: (user as any).birthDate || '',
        points: (user as any).points || 0
      },
    });
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در ورود به حساب: ' + err.message });
  }
});

app.get('/api/auth/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return;
    const user = await dbService.getUserById(req.user.id);
    if (!user) {
      res.status(404).json({ message: 'کاربر یافت نشد.' });
      return;
    }
    res.json({
      id: user.id,
      name: user.name,
      lastName: (user as any).lastName || '',
      email: user.email,
      role: user.role,
      status: user.status,
      phone: (user as any).phone || '',
      address: (user as any).address || '',
      postalCode: (user as any).postalCode || '',
      birthDate: (user as any).birthDate || '',
      points: (user as any).points || 0
    });
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در واکشی مشخصات کاربر.' });
  }
});

app.put('/api/auth/profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return;
    const { name, lastName, phone, address, postalCode, birthDate, password } = req.body;
    
    const updates: any = {
      name,
      lastName: lastName || '',
      phone: phone || '',
      address: address || '',
      postalCode: postalCode || '',
      birthDate: birthDate || ''
    };

    if (password && password.trim() !== '') {
      const salt = bcrypt.genSaltSync(10);
      updates.passwordHash = bcrypt.hashSync(password, salt);
    }

    const updated = await dbService.updateUser(req.user.id, updates);

    if (!updated) {
      res.status(404).json({ message: 'کاربر یافت نشد.' });
      return;
    }

    res.json({
      message: 'مشخصات با موفقیت به‌روزرسانی شد.',
      user: {
        id: updated.id,
        name: updated.name,
        lastName: updated.lastName || '',
        email: updated.email,
        role: updated.role,
        status: updated.status,
        phone: updated.phone || '',
        address: updated.address || '',
        postalCode: updated.postalCode || '',
        birthDate: updated.birthDate || '',
        points: updated.points || 0
      }
    });
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در به‌روزرسانی پروفایل: ' + err.message });
  }
});

// 2. Products API
app.get('/api/products', async (req, res) => {
  try {
    const productsList = await dbService.getProducts();
    res.json(productsList);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در واکشی محصولات.' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await dbService.getProductById(req.params.id);
    if (!product) {
      res.status(404).json({ message: 'محصول مورد نظر یافت نشد.' });
      return;
    }
    res.json(product);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در دریافت محصول.' });
  }
});

// Admin Products management
app.post('/api/admin/products', authenticateToken, isAdmin, async (req, res) => {
  try {
    const productData = req.body;
    if (!productData.title || !productData.price || !productData.category) {
      res.status(400).json({ message: 'اطلاعات وارد شده ناقص است.' });
      return;
    }

    const newProduct = await dbService.addProduct(productData);
    res.status(201).json(newProduct);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در ساخت محصول جدید.' });
  }
});

app.put('/api/admin/products/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const updated = await dbService.editProduct(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ message: 'محصول یافت نشد.' });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در ویرایش محصول.' });
  }
});

app.delete('/api/admin/products/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const success = await dbService.deleteProduct(req.params.id);
    if (!success) {
      res.status(404).json({ message: 'محصول یافت نشد.' });
      return;
    }
    res.json({ message: 'محصول با موفقیت حذف شد.' });
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در حذف محصول.' });
  }
});

// 3. Categories API
app.get('/api/categories', async (req, res) => {
  try {
    const categoriesList = await dbService.getCategories();
    res.json(categoriesList);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در واکشی دسته‌بندی‌ها.' });
  }
});

app.post('/api/admin/categories', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id, name, image, order, isActive } = req.body;
    if (!id || !name) {
      res.status(400).json({ message: 'اطلاعات دسته‌بندی ناقص است.' });
      return;
    }

    const currentCats = await dbService.getCategories();
    if (currentCats.some((c) => c.id === id)) {
      res.status(400).json({ message: 'این کد دسته‌بندی تکراری است.' });
      return;
    }

    const created = await dbService.addCategory(id, name, image, order, isActive);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در ایجاد دسته‌بندی جدید.' });
  }
});

app.put('/api/admin/categories/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, image, order, isActive } = req.body;
    const updated = await dbService.editCategory(req.params.id, { name, image, order, isActive });
    if (!updated) {
      res.status(404).json({ message: 'دسته‌بندی یافت نشد.' });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در ویرایش دسته‌بندی.' });
  }
});

app.delete('/api/admin/categories/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    await dbService.deleteCategory(req.params.id);
    res.json({ message: 'دسته‌بندی با موفقیت حذف شد.' });
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در حذف دسته‌بندی.' });
  }
});

// 4. Coupons API
app.get('/api/coupons', async (req, res) => {
  try {
    const couponsList = await dbService.getCoupons();
    res.json(couponsList);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در واکشی کوپن‌ها.' });
  }
});

app.post('/api/coupons/validate', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      res.status(400).json({ message: 'کد تخفیف ارسال نشده است.' });
      return;
    }

    const coupon = await dbService.getCouponByCode(code);

    if (!coupon) {
      res.status(404).json({ message: 'کد تخفیف معتبر نمی‌باشد.' });
      return;
    }

    const now = new Date();
    const expiry = new Date(coupon.expiryDate);
    if (now > expiry) {
      res.status(400).json({ message: 'اعتبار این کد تخفیف به اتمام رسیده است.' });
      return;
    }

    if (coupon.usageCount >= coupon.usageLimit) {
      res.status(400).json({ message: 'ظرفیت استفاده از این کد تخفیف به پایان رسیده است.' });
      return;
    }

    res.json(coupon);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در بررسی اعتبار کد تخفیف.' });
  }
});

app.post('/api/admin/coupons', authenticateToken, isAdmin, async (req, res) => {
  try {
    const couponData: Coupon = req.body;
    if (!couponData.code || !couponData.value) {
      res.status(400).json({ message: 'کد یا میزان تخفیف وارد نشده است.' });
      return;
    }

    const created = await dbService.addCoupon(couponData);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در ثبت کوپن جدید.' });
  }
});

app.delete('/api/admin/coupons/:code', authenticateToken, isAdmin, async (req, res) => {
  try {
    await dbService.deleteCoupon(req.params.code);
    res.json({ message: 'کد تخفیف با موفقیت حذف شد.' });
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در حذف کوپن.' });
  }
});

// 5. CMS Pages API
app.get('/api/cms', async (req, res) => {
  try {
    const cms = await dbService.getCmsTexts();
    res.json(cms);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در واکشی اطلاعات صفحات.' });
  }
});

app.post('/api/admin/cms', authenticateToken, isAdmin, async (req, res) => {
  try {
    const cms = await dbService.updateCmsTexts(req.body);
    res.json(cms);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در به‌روزرسانی اطلاعات CMS.' });
  }
});

// 6. Store Settings API
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await dbService.getStoreSettings();
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در واکشی تنظیمات فروشگاه.' });
  }
});

app.post('/api/admin/settings', authenticateToken, isAdmin, async (req, res) => {
  try {
    const settings = await dbService.updateStoreSettings(req.body);
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در به‌روزرسانی تنظیمات.' });
  }
});

// Database Connection Status API
app.get('/api/db-status', async (req, res) => {
  try {
    const isMongo = dbService.isMongo();
    const hasUri = !!process.env.MONGODB_URI;
    res.json({
      isMongo,
      hasUri,
      provider: isMongo ? 'mongodb' : 'json-db',
      nodeEnv: process.env.NODE_ENV,
      isProduction: process.env.NODE_ENV === 'production'
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Error checking DB status' });
  }
});

// 7. Orders API (Users and Admins)
app.get('/api/orders', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return;
    const ordersList = await dbService.getOrders();

    // If Admin, they can access all. If user, only their own (by phone or email matching)
    if (req.user.role === 'admin') {
      res.json(ordersList);
    } else {
      const userObj = await dbService.getUserById(req.user.id);
      if (!userObj) {
        res.status(404).json({ message: 'کاربر یافت نشد.' });
        return;
      }
      // Filter orders by phone or customer Name or email matching
      const userOrders = ordersList.filter(
        (o) => o.customerPhone === req.user?.email || o.customerName === userObj.name
      );
      res.json(userOrders);
    }
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در دریافت لیست سفارشات.' });
  }
});

app.post('/api/admin/orders/:id/status', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await dbService.updateOrderStatus(req.params.id, status);
    if (!updated) {
      res.status(404).json({ message: 'سفارش یافت نشد.' });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در به‌روزرسانی وضعیت سفارش.' });
  }
});

// Admin Users List (Admin can view list, SuperAdmin can manage them)
app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await dbService.getUsers();
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در دریافت لیست کاربران.' });
  }
});

app.put('/api/admin/users/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const updated = await dbService.updateUser(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ message: 'کاربر مورد نظر یافت نشد.' });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در ویرایش کاربر.' });
  }
});

// SUPERADMIN ONLY: Create admin or user
app.post('/api/admin/users', authenticateToken, isSuperAdmin, async (req, res) => {
  try {
    const { name, lastName, email, password, role, status, phone, address, postalCode, birthDate } = req.body;
    if (!name || !email || !password || !role) {
      res.status(400).json({ message: 'وارد کردن نام، ایمیل، کلمه عبور و نقش الزامی است.' });
      return;
    }

    const existing = await dbService.getUserByEmail(email);
    if (existing) {
      res.status(400).json({ message: 'کاربری با این ایمیل قبلاً ثبت نام شده است.' });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const newUser = await dbService.addUser({
      name,
      lastName: lastName || '',
      email: email.toLowerCase(),
      passwordHash,
      role: role || 'admin',
      status: status || 'active',
      phone: phone || '',
      address: address || '',
      postalCode: postalCode || '',
      birthDate: birthDate || '',
      points: Number(req.body.points || 0)
    });

    res.status(201).json(newUser);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در ایجاد کاربر جدید توسط مدیر کل: ' + err.message });
  }
});

// SUPERADMIN ONLY: Delete a user or admin
app.delete('/api/admin/users/:id', authenticateToken, isSuperAdmin, async (req, res) => {
  try {
    const success = await dbService.deleteUser(req.params.id);
    if (!success) {
      res.status(404).json({ message: 'کاربر یافت نشد.' });
      return;
    }
    res.json({ message: 'کاربر با موفقیت از سیستم حذف گردید.' });
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در حذف کاربر: ' + err.message });
  }
});

// SUPERADMIN ONLY: Change user or admin role
app.put('/api/admin/users/:id/role', authenticateToken, isSuperAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!role || !['user', 'admin', 'superadmin'].includes(role)) {
      res.status(400).json({ message: 'نقش ارسالی معتبر نمی‌باشد.' });
      return;
    }

    const updated = await dbService.updateUser(req.params.id, { role });
    if (!updated) {
      res.status(404).json({ message: 'کاربر مورد نظر یافت نشد.' });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در تغییر نقش کاربر: ' + err.message });
  }
});

// ================= SUPPORT TICKETS ENDPOINTS =================

// Create a new support ticket
app.post('/api/tickets', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return;
    const { subject, department, initialMessage } = req.body;
    if (!subject || !department || !initialMessage) {
      res.status(400).json({ message: 'وارد کردن موضوع، دپارتمان و متن پیام الزامی است.' });
      return;
    }

    const userObj = await dbService.getUserById(req.user.id);
    if (!userObj) {
      res.status(404).json({ message: 'کاربر یافت نشد.' });
      return;
    }

    const ticket = await dbService.createTicket({
      userId: req.user.id,
      customerName: userObj.name,
      customerPhone: userObj.phone || '',
      subject,
      department
    });

    // Add first message
    await dbService.addTicketMessage({
      ticketId: ticket.id,
      sender: 'user',
      senderName: userObj.name,
      message: initialMessage
    });

    res.status(201).json(ticket);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در ایجاد تیکت پشتیبانی: ' + err.message });
  }
});

// Get user's own tickets
app.get('/api/tickets/my', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return;
    const tickets = await dbService.getTicketsByUserId(req.user.id);
    res.json(tickets);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در دریافت تیکت‌های شما.' });
  }
});

// Get chat messages for a support ticket
app.get('/api/tickets/:id/chat', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return;
    const ticket = await dbService.getTicketById(req.params.id);
    if (!ticket) {
      res.status(404).json({ message: 'تیکت پشتیبانی یافت نشد.' });
      return;
    }

    // Verify ownership or admin access
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && ticket.userId !== req.user.id) {
      res.status(403).json({ message: 'شما دسترسی به این تیکت را ندارید.' });
      return;
    }

    const messages = await dbService.getTicketMessages(req.params.id);
    res.json(messages);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در دریافت پیام‌های تیکت.' });
  }
});

// Send a support ticket message
app.post('/api/tickets/:id/chat', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return;
    const { message } = req.body;
    if (!message || message.trim() === '') {
      res.status(400).json({ message: 'پیام ارسالی نمی‌تواند خالی باشد.' });
      return;
    }

    const ticket = await dbService.getTicketById(req.params.id);
    if (!ticket) {
      res.status(404).json({ message: 'تیکت پشتیبانی یافت نشد.' });
      return;
    }

    // Verify ownership or admin access
    const isUserAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
    if (!isUserAdmin && ticket.userId !== req.user.id) {
      res.status(403).json({ message: 'شما دسترسی به این تیکت را ندارید.' });
      return;
    }

    const userObj = await dbService.getUserById(req.user.id);
    const senderName = isUserAdmin ? 'پشتیبان گالری آونتورین' : (userObj?.name || 'مشتری');

    const newMessage = await dbService.addTicketMessage({
      ticketId: ticket.id,
      sender: isUserAdmin ? 'admin' : 'user',
      senderName,
      message
    });

    // Automatically mark as answered if admin sent the message, or open if user sent it
    const newStatus = isUserAdmin ? 'answered' : 'open';
    await dbService.updateTicketStatus(ticket.id, newStatus);

    res.status(201).json(newMessage);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در ارسال پیام تیکت: ' + err.message });
  }
});

// Admin-only: Get all tickets
app.get('/api/admin/tickets', authenticateToken, isAdmin, async (req, res) => {
  try {
    const tickets = await dbService.getTickets();
    res.json(tickets);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در دریافت تیکت‌های پشتیبانی.' });
  }
});

// Admin-only: Update status of a ticket
app.put('/api/admin/tickets/:id/status', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['open', 'answered', 'closed'].includes(status)) {
      res.status(400).json({ message: 'وضعیت ارسالی معتبر نمی‌باشد.' });
      return;
    }

    const updated = await dbService.updateTicketStatus(req.params.id, status);
    if (!updated) {
      res.status(404).json({ message: 'تیکت یافت نشد.' });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در به‌روزرسانی وضعیت تیکت.' });
  }
});

// ================= ZARINPAL IRANIAN PAYMENT GATEWAY INTEGRATION =================

// Initiates a payment session
app.post('/api/payment/create', async (req, res) => {
  try {
    const { amount, couponCode, items, customerData } = req.body;

    if (!amount || !customerData || !items) {
      res.status(400).json({ message: 'اطلاعات فاکتور ناقص است.' });
      return;
    }

    const orderId = 'ord-' + Math.floor(100000 + Math.random() * 900000).toString();

    // 1. Initialize Zarinpal Payment Session via Abstract PaymentService
    const description = `خرید آنلاین گالری زیورآلات آونتورین - سفارش #${orderId}`;
    const paymentResponse = await paymentService.requestPayment(amount, orderId, description);

    if (!paymentResponse.success) {
      res.status(500).json({ message: 'خطا در راه‌اندازی درگاه پرداخت زرین‌پال.' });
      return;
    }

    // 2. Create a pending Order first in DB
    const pendingOrder: Order = {
      id: orderId,
      customerName: customerData.name,
      customerPhone: customerData.phone,
      province: customerData.province,
      city: customerData.city,
      postalCode: customerData.postalCode,
      address: customerData.address,
      items: items.map((item: any) => ({
        productId: item.product.id,
        productTitle: item.product.title,
        quantity: item.quantity,
        price: item.product.price * (1 - (item.product.discount || 0) / 100),
        variant: item.selectedVariant,
      })),
      totalPrice: amount,
      paymentStatus: 'pending',
      trackingCode: paymentResponse.authority,
      date: new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date()),
    };

    await dbService.addOrder(pendingOrder);

    // If coupon code was used, increment usage count
    if (couponCode) {
      await dbService.incrementCouponUsage(couponCode);
    }

    res.json({
      authority: paymentResponse.authority,
      paymentUrl: paymentResponse.paymentUrl,
      orderId: pendingOrder.id,
    });
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در برقراری ارتباط با درگاه پرداخت: ' + err.message });
  }
});

// Custom webhook/redirect verification route (Callback verify)
app.post('/api/payment/verify', async (req, res) => {
  try {
    const { authority, status } = req.body;

    if (!authority || !status) {
      res.status(400).json({ message: 'پارامترهای ارسالی نامعتبر است.' });
      return;
    }

    const order = await dbService.getOrderByTrackingCode(authority);
    if (!order) {
      res.status(404).json({ message: 'تراکنش معتبر یافت نشد.' });
      return;
    }

    if (status === 'OK') {
      // 1. Verify via abstraction PaymentService (Production API check if real, or simulator check if ZP-*)
      const verification = await paymentService.verifyPayment(authority, order.totalPrice);

      if (verification.success) {
        // Update Order Status to success
        await dbService.updateOrderStatus(order.id, 'success');

        // Decrease product stocks accordingly
        for (const item of order.items) {
          const product = await dbService.getProductById(item.productId);
          if (product) {
            const newStock = Math.max(product.stock - item.quantity, 0);
            await dbService.editProduct(item.productId, { stock: newStock }, 'سیستم (خرید مشتری)');
          }
        }

        // Award loyalty club points (1 point per 10,000 Tomans)
        if (order.userId) {
          const userObj = await dbService.getUserById(order.userId);
          if (userObj) {
            const earnedPoints = Math.floor((order.totalPrice || order.amount || 0) / 10000);
            if (earnedPoints > 0) {
              const currentPoints = (userObj as any).points || 0;
              await dbService.updateUser(order.userId, { points: currentPoints + earnedPoints });
              console.log(`Awarded ${earnedPoints} customer loyalty points to user ${order.userId}`);
            }
          }
        }

        res.json({ status: 'success', order, trackingCode: authority, refId: verification.refId });
      } else {
        await dbService.updateOrderStatus(order.id, 'failed');
        res.status(400).json({ status: 'failed', message: verification.message });
      }
    } else {
      await dbService.updateOrderStatus(order.id, 'failed');
      res.json({ status: 'failed', message: 'پرداخت توسط کاربر لغو شد یا ناموفق بود.' });
    }
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در تایید وضعیت پرداخت تراکنش: ' + err.message });
  }
});

// Production support callback redirect route (useful for traditional form action return targets)
app.get('/api/payment/callback', async (req, res) => {
  const { Authority, Status, orderId } = req.query;
  const authorityStr = typeof Authority === 'string' ? Authority : '';
  const statusStr = typeof Status === 'string' ? Status : '';
  const orderIdStr = typeof orderId === 'string' ? orderId : '';

  if (authorityStr && statusStr) {
    const query = new URLSearchParams({
      paymentVerify: '1',
      authority: authorityStr,
      status: statusStr,
    });

    if (orderIdStr) {
      query.set('orderId', orderIdStr);
    }

    res.redirect(`/index.html?${query.toString()}`);
    return;
  }

  res.redirect('/index.html');
});

// ==========================================
// HANDMADES (CUSTOM DESIGN PORTFOLIO) API
// ==========================================

// 1. Get sample categories
app.get('/api/sample-categories', async (req, res) => {
  try {
    const cats = await dbService.getSampleCategories();
    res.json(cats);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در دریافت دسته‌بندی‌های سفارشی.' });
  }
});

// 2. Add sample category
app.post('/api/admin/sample-categories', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      res.status(400).json({ message: 'نام دسته‌بندی الزامی است.' });
      return;
    }
    const generatedId = 'sc-' + Math.floor(1000 + Math.random() * 9000).toString();
    const cat = await dbService.addSampleCategory(generatedId, name);
    res.status(201).json(cat);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در ثبت دسته‌بندی سفارشی.' });
  }
});

// 3. Delete sample category
app.delete('/api/admin/sample-categories/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const success = await dbService.deleteSampleCategory(req.params.id);
    if (!success) {
      res.status(404).json({ message: 'دسته‌بندی مورد نظر یافت نشد.' });
      return;
    }
    res.json({ success: true, message: 'دسته‌بندی با موفقیت حذف شد.' });
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در حذف دسته‌بندی سفارشی.' });
  }
});

// 4. Get sample portfolio items
app.get('/api/sample-items', async (req, res) => {
  try {
    const items = await dbService.getSampleItems();
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در دریافت لیست نمونه‌کارها.' });
  }
});

// 5. Add sample portfolio item
app.post('/api/admin/sample-items', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { title, description, category, basePrice, image, material, stone, color } = req.body;
    if (!title || !description || !category || !image || !material || !stone || !color) {
      res.status(400).json({ message: 'تکمیل تمامی فیلدها الزامی است.' });
      return;
    }
    const item = await dbService.addSampleItem({
      title,
      description,
      category,
      basePrice: basePrice ? Number(basePrice) : undefined,
      image,
      material,
      stone,
      color
    });
    res.status(201).json(item);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در ثبت نمونه‌کار جدید.' });
  }
});

// 6. Edit sample portfolio item
app.put('/api/admin/sample-items/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const item = await dbService.editSampleItem(req.params.id, req.body);
    if (!item) {
      res.status(404).json({ message: 'نمونه‌کار یافت نشد.' });
      return;
    }
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در ویرایش نمونه‌کار.' });
  }
});

// 7. Delete sample portfolio item
app.delete('/api/admin/sample-items/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const success = await dbService.deleteSampleItem(req.params.id);
    if (!success) {
      res.status(404).json({ message: 'نمونه‌کار یافت نشد.' });
      return;
    }
    res.json({ success: true, message: 'نمونه‌کار با موفقیت حذف شد.' });
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در حذف نمونه‌کار.' });
  }
});

// 8. Submit custom handmade order
app.post('/api/custom-orders', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return;
    const { 
      customerName, 
      customerPhone, 
      selectedSamples, 
      uploadedImages, 
      description,
      material,
      stone,
      color,
      baselineSampleId,
      uploadedSketchUrl
    } = req.body;

    if (!description) {
      res.status(400).json({ message: 'تکمیل فیلد توضیحات الزامی است.' });
      return;
    }

    // Resolve user details securely from database if not explicitly provided
    const userObj = await dbService.getUserById(req.user.id);
    const resolvedName = customerName || userObj?.name || 'مشتری گرامی';
    const resolvedPhone = customerPhone || (userObj as any)?.phone || '۰۹۳۹۹۳۱۱۸۷۵';

    const finalUploadedImages = uploadedImages || (uploadedSketchUrl ? [uploadedSketchUrl] : []);
    const finalSelectedSamples = selectedSamples || (baselineSampleId ? [baselineSampleId] : []);

    const order = await dbService.addCustomOrder({
      userId: req.user.id,
      customerName: resolvedName,
      customerPhone: resolvedPhone,
      selectedSamples: finalSelectedSamples,
      uploadedImages: finalUploadedImages,
      description,
      material: material || undefined,
      stone: stone || undefined,
      color: color || undefined,
      category: baselineSampleId || undefined
    });

    // Create automatic initial message from admin
    await dbService.addChatMessage({
      orderId: order.id,
      sender: 'admin',
      senderName: 'پشتیبانی آونتورین',
      message: 'سلام! درخواست سفارش دست‌ساز شما با موفقیت ثبت شد. به‌زودی طراحان ما جزئیات سفارش شما را بررسی کرده و قیمت تخمینی و توضیحات تکمیلی را از طریق همین چت به اطلاع شما می‌رسانند. در صورت نیاز به ارسال تصویر یا توضیحات بیشتر، همین‌جا پیام ارسال کنید.',
    });

    res.status(201).json(order);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در ثبت سفارش اختصاصی دست‌ساز.' });
  }
});

// 9. Get user's custom orders
app.get('/api/custom-orders/my', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return;
    const orders = await dbService.getCustomOrdersByUserId(req.user.id);
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در دریافت سفارش‌های اختصاصی.' });
  }
});

// 10. Get all custom orders (Admin view)
app.get('/api/admin/custom-orders', authenticateToken, isAdmin, async (req, res) => {
  try {
    const orders = await dbService.getCustomOrders();
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در دریافت تمامی سفارش‌های اختصاصی.' });
  }
});

// 11. Propose price for custom order (Admin)
app.put('/api/admin/custom-orders/:id/price', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { adminPrice } = req.body;
    const parsedAdminPrice = Number(adminPrice);

    if (adminPrice === undefined || adminPrice === null || Number.isNaN(parsedAdminPrice)) {
      res.status(400).json({ message: 'وارد کردن مبلغ پیشنهادی الزامی است.' });
      return;
    }

    const order = await dbService.updateCustomOrderPrice(req.params.id, parsedAdminPrice);
    if (!order) {
      res.status(404).json({ message: 'سفارش یافت نشد.' });
      return;
    }

    // Auto system message
    await dbService.addChatMessage({
      orderId: order.id,
      sender: 'admin',
      senderName: 'سیستم آونتورین',
      message: `قیمت نهایی ساخت سفارش شما توسط کارشناس گالری برآورد شد: ${Number(adminPrice).toLocaleString('fa-IR')} تومان. جهت نهایی‌سازی ساخت، لطفا این قیمت را تایید کرده و دکمه پرداخت سفارش را بزنید.`,
    });

    res.json(order);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در ثبت قیمت پیشنهادی ادمین.' });
  }
});

// 12. Update custom order status (Admin)
app.put('/api/admin/custom-orders/:id/status', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await dbService.updateCustomOrderStatus(req.params.id, status);
    if (!order) {
      res.status(404).json({ message: 'سفارش یافت نشد.' });
      return;
    }

    let statusText = '';
    if (status === 'chatting') statusText = 'آغاز گفتگو و مشاوره فنی';
    else if (status === 'canceled') statusText = 'لغو شده توسط کارشناس';

    await dbService.addChatMessage({
      orderId: order.id,
      sender: 'admin',
      senderName: 'سیستم آونتورین',
      message: `وضعیت سفارش دست‌ساز شما تغییر کرد به: ${statusText}`,
    });

    res.json(order);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در تغییر وضعیت سفارش.' });
  }
});

// 13. Accept custom order price (User)
app.post('/api/custom-orders/:id/accept-price', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return;
    const order = await dbService.getCustomOrderById(req.params.id);
    if (!order) {
      res.status(404).json({ message: 'سفارش یافت نشد.' });
      return;
    }
    if (order.userId !== req.user.id) {
      res.status(401).json({ message: 'عدم دسترسی به سفارش دیگران.' });
      return;
    }
    const updated = await dbService.updateCustomOrderStatus(req.params.id, 'accepted');

    await dbService.addChatMessage({
      orderId: updated!.id,
      sender: 'user',
      senderName: updated!.customerName,
      message: 'من قیمت برآورد شده را تایید می‌کنم. لطفا شرایط پرداخت را آماده نمایید.',
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در تایید قیمت سفارش.' });
  }
});

// 14. Pay for custom order (User simulated checkout)
app.post('/api/custom-orders/:id/pay', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return;
    const order = await dbService.getCustomOrderById(req.params.id);
    if (!order) {
      res.status(404).json({ message: 'سفارش یافت نشد.' });
      return;
    }
    if (order.userId !== req.user.id) {
      res.status(401).json({ message: 'عدم دسترسی به سفارش.' });
      return;
    }
    const priceToPay = order.adminPrice || 0;
    const updated = await dbService.updateCustomOrderStatus(req.params.id, 'paid', priceToPay);

    await dbService.addChatMessage({
      orderId: updated!.id,
      sender: 'admin',
      senderName: 'سیستم پرداخت آونتورین',
      message: `🎉 پرداخت موفقیت‌آمیز فاکتور ساخت سفارش دست‌ساز به مبلغ ${priceToPay.toLocaleString('fa-IR')} تومان با موفقیت در سیستم ثبت گردید. این سفارش با اولویت بالا وارد کارگاه جواهرسازی آونتورین شد و فرآیند ساخت آغاز گردید. گفتگوی این سفارش برای همیشه ذخیره شده و عکس‌ها منقضی نخواهند شد.`,
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در فرآیند پرداخت سفارش دست‌ساز.' });
  }
});

// 15. Get chat messages
app.get('/api/custom-orders/:id/chat', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return;
    const order = await dbService.getCustomOrderById(req.params.id);
    if (!order) {
      res.status(404).json({ message: 'سفارش یافت نشد.' });
      return;
    }
    // Verify participation
    if (req.user.role !== 'admin' && order.userId !== req.user.id) {
      res.status(401).json({ message: 'عدم دسترسی به گفتگوی این سفارش.' });
      return;
    }
    const messages = await dbService.getChatMessages(req.params.id);
    res.json(messages);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در دریافت پیام‌ها.' });
  }
});

// 16. Send chat message
app.post('/api/custom-orders/:id/chat', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return;
    const order = await dbService.getCustomOrderById(req.params.id);
    if (!order) {
      res.status(404).json({ message: 'سفارش یافت نشد.' });
      return;
    }
    // Verify participation
    if (req.user.role !== 'admin' && order.userId !== req.user.id) {
      res.status(401).json({ message: 'عدم دسترسی به گفتگوی این سفارش.' });
      return;
    }

    const { message, imageUrl } = req.body;
    if (!message && !imageUrl) {
      res.status(400).json({ message: 'متن پیام یا تصویر الزامی است.' });
      return;
    }

    const userObj = await dbService.getUserById(req.user.id);
    const senderName = req.user.role === 'admin' ? 'مدیریت آونتورین' : (userObj?.name || 'مشتری گرامی');

    const newMessage = await dbService.addChatMessage({
      orderId: order.id,
      sender: req.user.role === 'admin' ? 'admin' : 'user',
      senderName,
      message: message || '',
      imageUrl: imageUrl || undefined
    });

    // If order was in pending state and user writes, transition to chatting state
    if (order.status === 'pending') {
      await dbService.updateCustomOrderStatus(order.id, 'chatting');
    }

    res.status(201).json(newMessage);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در ارسال پیام.' });
  }
});

// 17. Get Inventory Logs (Admin)
app.get('/api/admin/inventory/logs', authenticateToken, isAdmin, async (req, res) => {
  try {
    const logs = await dbService.getInventoryLogs();
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در دریافت لیست تراکنش‌های انبار.' });
  }
});

// 18. Manual Inventory Adjustment (Admin)
app.post('/api/admin/inventory/adjust', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { productId, type, quantity, description, operator } = req.body;
    if (!productId || !type || quantity === undefined) {
      res.status(400).json({ message: 'مشخصات تغییر موجودی کامل نیست.' });
      return;
    }
    const product = await dbService.getProductById(productId);
    if (!product) {
      res.status(404).json({ message: 'محصول یافت نشد.' });
      return;
    }

    const previousStock = product.stock || 0;
    let newStock = previousStock;

    if (type === 'in') {
      newStock = previousStock + Number(quantity);
    } else if (type === 'out' || type === 'damage') {
      newStock = Math.max(previousStock - Number(quantity), 0);
    } else if (type === 'adjustment') {
      newStock = Number(quantity);
    }

    const customOperator = operator || 'مدیر سیستم';
    const updated = await dbService.editProduct(productId, { stock: newStock }, customOperator);

    if (!updated) {
      res.status(500).json({ message: 'خطا در بروزرسانی موجودی کالا.' });
      return;
    }

    if (type === 'damage') {
      await dbService.addInventoryLog({
        productId,
        productTitle: product.title,
        type: 'damage',
        quantity: Number(quantity),
        previousStock,
        newStock,
        operator: customOperator,
        description: description || `ثبت ضایعات کالا: تعداد ${quantity} عدد به دلیل معیوب بودن یا تعمیر از انبار خارج شد.`
      });
    }

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در ثبت تغییر انبارداری.' });
  }
});

// Global Error Handler for Mongoose and Network database issues (Phase 2.2 fallback)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (
    err.name === 'MongooseError' || 
    err.name === 'MongoNetworkError' || 
    (err.message && err.message.includes('buffering timed out'))
  ) {
    console.warn('[AI Studio] Database offline — returning fallback response');
    if (req.method === 'GET') {
      return res.json(req.path.endsWith('s') || req.path.endsWith('s/') ? [] : {});
    }
    return res.status(503).json({ error: 'Service temporarily unavailable (database offline)' });
  }
  console.error('[Express Global Error]:', err);
  res.status(500).json({ message: 'خطا در سرور داخلی: ' + err.message });
});

// Serve frontend with Vite middleware in development
async function startServer() {
  const isProduction = process.env.NODE_ENV !== 'development';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Periodic automatic pruning for unpaid custom order chats (runs every 15 minutes in background)
  setInterval(async () => {
    try {
      const prunedCount = await dbService.cleanupExpiredChatMessages();
      if (prunedCount > 0) {
        console.log(`[Automatic Chat Pruner] Pruned ${prunedCount} expired temporary chat messages/images.`);
      }
    } catch (err: any) {
      console.error('[Automatic Chat Pruner Error]:', err.message);
    }
  }, 15 * 60 * 1000);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
