import mongoose, { Schema } from 'mongoose';
import { readDb, writeDb, UserRecord } from './db';
import { Product, Order, SampleItem, SampleCategory, CustomOrder, ChatMessage, Coupon } from '../../src/types';

// ==========================================
// 1. DYNAMIC MONGODB CONNECTION SETUP
// ==========================================
const MONGODB_URI = process.env.MONGODB_URI || '';
let isMongoConnected = false;

mongoose.set('bufferCommands', false);

if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => {
      console.log('✅ Connected to MongoDB Atlas successfully.');
      isMongoConnected = true;
      seedMongoIfEmpty();
    })
    .catch((err: any) => {
      console.log('ℹ️ MongoDB Atlas connection not established (possibly due to dynamic IP whitelist constraints).');
      console.log('ℹ️ System has successfully configured the fully optimized JSON-DB local database fallback.');
      isMongoConnected = false;
    });
} else {
  console.log('ℹ️ No MONGODB_URI found in environment variables. Running on fully functional JSON-DB local database.');
}

// ==========================================
// 2. MONGOOSE SCHEMA & MODEL DEFINITIONS (Typed as any for seamless API use)
// ==========================================

// Product Schema
const ProductSchema = new Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  images: [{ type: String }],
  category: { type: String, required: true },
  stock: { type: Number, required: true, default: 0 },
  variants: [{ type: String }],
  rating: { type: Number, default: 4.8 },
  isFeatured: { type: Boolean, default: false },
  discount: { type: Number, default: 0 }
});

const MongoProduct: any = mongoose.models.Product || mongoose.model('Product', ProductSchema);

// Category Schema
const CategorySchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  image: { type: String },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
});

const MongoCategory: any = mongoose.models.Category || mongoose.model('Category', CategorySchema);

// User Schema
const UserSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  lastName: { type: String, default: '' },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user', 'superadmin'], default: 'user' },
  status: { type: String, enum: ['active', 'blocked'], default: 'active' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  postalCode: { type: String, default: '' },
  birthDate: { type: String, default: '' },
  points: { type: Number, default: 0 }
});

const MongoUser: any = mongoose.models.User || mongoose.model('User', UserSchema);

// Order Schema
const OrderItemSchema = new Schema({
  productId: { type: String, required: true },
  productTitle: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  variant: { type: String }
});

const OrderSchema = new Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: false },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  province: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  address: { type: String, required: true },
  items: [OrderItemSchema],
  totalPrice: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  shippingCost: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  couponCode: { type: String, required: false },
  shippingMethod: { type: String, default: 'post' },
  paymentStatus: { type: String, required: true },
  trackingCode: { type: String, required: true },
  date: { type: String, required: true }
});

const MongoOrder: any = mongoose.models.Order || mongoose.model('Order', OrderSchema);

// Coupon Schema
const CouponSchema = new Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  type: { type: String, enum: ['percent', 'amount'], required: true },
  value: { type: Number, required: true },
  expiryDate: { type: String, required: true },
  usageLimit: { type: Number, required: true },
  usageCount: { type: Number, default: 0 }
});

const MongoCoupon: any = mongoose.models.Coupon || mongoose.model('Coupon', CouponSchema);

// CMS Schema
const CmsSchema = new Schema({
  about: { type: String, required: true },
  terms: { type: String, required: true },
  contact: { type: String, required: true }
}, { strict: false });

const MongoCms: any = mongoose.models.Cms || mongoose.model('Cms', CmsSchema);

// Store Settings Schema
const StoreSettingsSchema = new Schema({
  currencyUnit: { type: String, enum: ['تومان', 'ریال'], default: 'تومان' },
  shippingCost: { type: Number, default: 35000 },
  taxPercent: { type: Number, default: 9 }
});

const MongoStoreSettings: any = mongoose.models.StoreSettings || mongoose.model('StoreSettings', StoreSettingsSchema);

// ==========================================
// 2B. HANDMADES MONGOOSE SCHEMA DEFINITIONS
// ==========================================

const SampleItemSchema = new Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  basePrice: { type: Number },
  image: { type: String, required: true },
  material: { type: String, required: true },
  stone: { type: String, required: true },
  color: { type: String, required: true },
  createdAt: { type: String, required: true }
});

const MongoSampleItem: any = mongoose.models.SampleItem || mongoose.model('SampleItem', SampleItemSchema);

const SampleCategorySchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true }
});

const MongoSampleCategory: any = mongoose.models.SampleCategory || mongoose.model('SampleCategory', SampleCategorySchema);

const CustomOrderSchema = new Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  selectedSamples: [{ type: String }],
  uploadedImages: [{ type: String }],
  description: { type: String, required: true },
  status: { type: String, required: true },
  adminPrice: { type: Number },
  finalPrice: { type: Number },
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true }
});

const MongoCustomOrder: any = mongoose.models.CustomOrder || mongoose.model('CustomOrder', CustomOrderSchema);

const ChatMessageSchema = new Schema({
  id: { type: String, required: true, unique: true },
  orderId: { type: String, required: true },
  sender: { type: String, required: true },
  senderName: { type: String, required: true },
  message: { type: String, required: true },
  imageUrl: { type: String },
  createdAt: { type: String, required: true },
  expiresAt: { type: String, required: true }
});

const MongoChatMessage: any = mongoose.models.ChatMessage || mongoose.model('ChatMessage', ChatMessageSchema);

// Inventory Log Schema
const InventoryLogSchema = new Schema({
  id: { type: String, required: true, unique: true },
  productId: { type: String, required: true },
  productTitle: { type: String, required: true },
  type: { type: String, enum: ['in', 'out', 'damage', 'adjustment', 'sale'], required: true },
  quantity: { type: Number, required: true },
  previousStock: { type: Number, required: true },
  newStock: { type: Number, required: true },
  operator: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: String, required: true }
});

const MongoInventoryLog: any = mongoose.models.InventoryLog || mongoose.model('InventoryLog', InventoryLogSchema);

// Support Ticket Schemas
const SupportTicketSchema = new Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  subject: { type: String, required: true },
  department: { type: String, default: 'general' },
  status: { type: String, enum: ['open', 'answered', 'closed'], default: 'open' },
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true }
});

const MongoSupportTicket: any = mongoose.models.SupportTicket || mongoose.model('SupportTicket', SupportTicketSchema);

const SupportTicketMessageSchema = new Schema({
  id: { type: String, required: true, unique: true },
  ticketId: { type: String, required: true },
  sender: { type: String, enum: ['user', 'admin'], required: true },
  senderName: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: String, required: true }
});

const MongoSupportTicketMessage: any = mongoose.models.SupportTicketMessage || mongoose.model('SupportTicketMessage', SupportTicketMessageSchema);

// ==========================================
// 3. SEED DATA SYNCHRONIZATION WITH MONGO
// ==========================================
async function seedMongoIfEmpty() {
  try {
    const userCount = await MongoUser.countDocuments();
    if (userCount === 0) {
      console.log('🌱 MongoDB collections are empty. Migrating local JSON-DB seed data...');
      const localDb = readDb();

      await MongoProduct.insertMany(localDb.products as any);
      await MongoCategory.insertMany(localDb.categories as any);
      await MongoUser.insertMany(localDb.users as any);
      await MongoCoupon.insertMany(localDb.coupons as any);
      await MongoCms.create(localDb.cmsTexts as any);
      await MongoStoreSettings.create(localDb.storeSettings as any);

      if (localDb.orders.length > 0) {
        await MongoOrder.insertMany(localDb.orders as any);
      }

      if (localDb.sampleItems && localDb.sampleItems.length > 0) {
        await MongoSampleItem.insertMany(localDb.sampleItems as any);
      }
      if (localDb.sampleCategories && localDb.sampleCategories.length > 0) {
        await MongoSampleCategory.insertMany(localDb.sampleCategories as any);
      }
      if (localDb.customOrders && localDb.customOrders.length > 0) {
        await MongoCustomOrder.insertMany(localDb.customOrders as any);
      }
      if (localDb.chatMessages && localDb.chatMessages.length > 0) {
        await MongoChatMessage.insertMany(localDb.chatMessages as any);
      }
      if (localDb.inventoryLogs && localDb.inventoryLogs.length > 0) {
        await MongoInventoryLog.insertMany(localDb.inventoryLogs as any);
      }

      console.log('✅ Migration of local DB seed data to MongoDB Atlas completed successfully.');
    }
  } catch (err: any) {
    console.error('⚠️ Seeding database failed:', err.message);
  }
}

// ==========================================
// 4. UNIFIED DUAL-MODE SERVICE LAYER
// ==========================================
export const dbService = {
  // Check active DB provider type
  isMongo() {
    return isMongoConnected;
  },

  // ------------------------------------------
  // PRODUCTS
  // ------------------------------------------
  async getProducts(): Promise<Product[]> {
    if (isMongoConnected) {
      const items = await MongoProduct.find({}).lean();
      return items.map((p: any) => {
        const { _id, __v, ...rest } = p;
        return rest as Product;
      });
    } else {
      return readDb().products;
    }
  },

  async getProductById(id: string): Promise<Product | null> {
    if (isMongoConnected) {
      const p = await MongoProduct.findOne({ id }).lean();
      if (!p) return null;
      const { _id, __v, ...rest } = p as any;
      return rest as Product;
    } else {
      const p = readDb().products.find((prod) => prod.id === id);
      return p || null;
    }
  },

  async addProduct(data: Omit<Product, 'id'>): Promise<Product> {
    const generatedId = 'p-' + Math.floor(1000 + Math.random() * 9000).toString();
    const newProd: Product = {
      ...data,
      id: generatedId,
      rating: data.rating || 4.8
    };

    if (isMongoConnected) {
      const created = await MongoProduct.create(newProd as any);
      const { _id, __v, ...rest } = created.toObject();
      return rest as Product;
    } else {
      const local = readDb();
      local.products.push(newProd);
      writeDb(local);
      return newProd;
    }
  },

  async editProduct(id: string, data: Partial<Product>, operatorName = 'مدیر سیستم'): Promise<Product | null> {
    let previousStock = 0;
    let title = '';
    
    if (isMongoConnected) {
      const prev = await MongoProduct.findOne({ id }).lean() as any;
      if (prev) {
        previousStock = prev.stock || 0;
        title = prev.title || '';
      }
      const updated = await MongoProduct.findOneAndUpdate({ id }, { $set: data }, { new: true }).lean();
      if (!updated) return null;
      const { _id, __v, ...rest } = updated as any;
      const finalProd = rest as Product;

      if (data.stock !== undefined && data.stock !== previousStock) {
        const diff = data.stock - previousStock;
        await dbService.addInventoryLog({
          productId: id,
          productTitle: title || finalProd.title,
          type: diff > 0 ? 'in' : 'out',
          quantity: Math.abs(diff),
          previousStock,
          newStock: finalProd.stock,
          operator: operatorName,
          description: `به‌روزرسانی موجودی از ${previousStock} به ${finalProd.stock} (تغییر: ${diff > 0 ? '+' : ''}${diff})`
        });
      }
      return finalProd;
    } else {
      const local = readDb();
      const idx = local.products.findIndex((p) => p.id === id);
      if (idx === -1) return null;
      const prev = local.products[idx];
      previousStock = prev.stock || 0;
      title = prev.title || '';

      local.products[idx] = { ...local.products[idx], ...data };
      writeDb(local);
      const finalProd = local.products[idx];

      if (data.stock !== undefined && data.stock !== previousStock) {
        const diff = data.stock - previousStock;
        await dbService.addInventoryLog({
          productId: id,
          productTitle: title || finalProd.title,
          type: diff > 0 ? 'in' : 'out',
          quantity: Math.abs(diff),
          previousStock,
          newStock: finalProd.stock,
          operator: operatorName,
          description: `به‌روزرسانی موجودی از ${previousStock} به ${finalProd.stock} (تغییر: ${diff > 0 ? '+' : ''}${diff})`
        });
      }
      return finalProd;
    }
  },

  async deleteProduct(id: string): Promise<boolean> {
    if (isMongoConnected) {
      const result = await MongoProduct.deleteOne({ id });
      return result.deletedCount > 0;
    } else {
      const local = readDb();
      const filtered = local.products.filter((p) => p.id !== id);
      if (filtered.length === local.products.length) return false;
      local.products = filtered;
      writeDb(local);
      return true;
    }
  },

  // ------------------------------------------
  // CATEGORIES
  // ------------------------------------------
  async getCategories(): Promise<any[]> {
    if (isMongoConnected) {
      const items = await MongoCategory.find({}).lean();
      return items.map((c: any) => ({
        id: c.id,
        name: c.name,
        image: c.image || '',
        order: c.order || 0,
        isActive: c.isActive !== false
      })).sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    } else {
      const cats = readDb().categories || [];
      return cats.map((c: any) => ({
        id: c.id,
        name: c.name,
        image: c.image || '',
        order: c.order || 0,
        isActive: c.isActive !== false
      })).sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    }
  },

  async addCategory(id: string, name: string, image?: string, order?: number, isActive?: boolean): Promise<any> {
    const newCat = { id, name, image: image || '', order: order || 0, isActive: isActive !== false };
    if (isMongoConnected) {
      await MongoCategory.create(newCat);
      return newCat;
    } else {
      const local = readDb();
      local.categories = local.categories || [];
      local.categories.push(newCat);
      writeDb(local);
      return newCat;
    }
  },

  async editCategory(id: string, data: Partial<{ name: string; image: string; order: number; isActive: boolean }>): Promise<any> {
    if (isMongoConnected) {
      const updated = await MongoCategory.findOneAndUpdate({ id }, { $set: data }, { new: true }).lean();
      if (!updated) return null;
      const { _id, __v, ...rest } = updated as any;
      return rest;
    } else {
      const local = readDb();
      const idx = local.categories.findIndex((c) => c.id === id);
      if (idx === -1) return null;
      local.categories[idx] = { ...local.categories[idx], ...data };
      writeDb(local);
      return local.categories[idx];
    }
  },

  async deleteCategory(id: string): Promise<void> {
    if (isMongoConnected) {
      await MongoCategory.deleteOne({ id });
    } else {
      const local = readDb();
      local.categories = (local.categories || []).filter((c) => c.id !== id);
      writeDb(local);
    }
  },

  // ------------------------------------------
  // USERS & AUTH
  // ------------------------------------------
  async getUsers(): Promise<any[]> {
    if (isMongoConnected) {
      const list = await MongoUser.find({}).lean();
      return list.map((u: any) => {
        const { _id, __v, passwordHash, ...rest } = u;
        return rest;
      });
    } else {
      return readDb().users.map(({ passwordHash, ...rest }) => rest);
    }
  },

  async getUserByEmail(email: string): Promise<UserRecord | null> {
    if (isMongoConnected) {
      const u = await MongoUser.findOne({ email: email.toLowerCase() }).lean();
      if (!u) return null;
      const { _id, __v, ...rest } = u as any;
      return rest as UserRecord;
    } else {
      const u = readDb().users.find((user) => user.email.toLowerCase() === email.toLowerCase());
      return u || null;
    }
  },

  async getUserById(id: string): Promise<UserRecord | null> {
    if (isMongoConnected) {
      const u = await MongoUser.findOne({ id }).lean();
      if (!u) return null;
      const { _id, __v, ...rest } = u as any;
      return rest as UserRecord;
    } else {
      const u = readDb().users.find((user) => user.id === id);
      return u || null;
    }
  },

  async addUser(data: Omit<UserRecord, 'id'>): Promise<UserRecord> {
    const generatedId = 'u-' + Math.floor(100000 + Math.random() * 900000).toString();
    const newUser: UserRecord = {
      ...data,
      id: generatedId,
      email: data.email.toLowerCase()
    };

    if (isMongoConnected) {
      const created = await MongoUser.create(newUser as any);
      const { _id, __v, ...rest } = created.toObject();
      return rest as UserRecord;
    } else {
      const local = readDb();
      local.users.push(newUser);
      writeDb(local);
      return newUser;
    }
  },

  async updateUser(id: string, updates: Partial<UserRecord> & { name?: string; phone?: string; address?: string; postalCode?: string }): Promise<any | null> {
    if (isMongoConnected) {
      const updated = await MongoUser.findOneAndUpdate({ id }, { $set: updates }, { new: true }).lean();
      if (!updated) return null;
      const { _id, __v, passwordHash, ...rest } = updated as any;
      return rest;
    } else {
      const local = readDb();
      const u = local.users.find((user) => user.id === id);
      if (!u) return null;
      if (updates.role) u.role = updates.role;
      if (updates.status) u.status = updates.status;
      if (updates.name) u.name = updates.name;
      if (updates.phone !== undefined) (u as any).phone = updates.phone;
      if (updates.address !== undefined) (u as any).address = updates.address;
      if (updates.postalCode !== undefined) (u as any).postalCode = updates.postalCode;
      writeDb(local);
      const { passwordHash, ...rest } = u;
      return rest;
    }
  },

  // ------------------------------------------
  // COUPONS
  // ------------------------------------------
  async getCoupons(): Promise<Coupon[]> {
    if (isMongoConnected) {
      const list = await MongoCoupon.find({}).lean();
      return list.map((c: any) => {
        const { _id, __v, ...rest } = c;
        return rest as Coupon;
      });
    } else {
      return readDb().coupons;
    }
  },

  async getCouponByCode(code: string): Promise<Coupon | null> {
    if (isMongoConnected) {
      const c = await MongoCoupon.findOne({ code: code.toUpperCase() }).lean();
      if (!c) return null;
      const { _id, __v, ...rest } = c as any;
      return rest as Coupon;
    } else {
      const c = readDb().coupons.find((coup) => coup.code.toUpperCase() === code.toUpperCase());
      return c || null;
    }
  },

  async addCoupon(data: Coupon): Promise<Coupon> {
    const coupon: Coupon = {
      ...data,
      code: data.code.toUpperCase(),
      usageCount: 0
    };

    if (isMongoConnected) {
      const created = await MongoCoupon.create(coupon as any);
      const { _id, __v, ...rest } = created.toObject();
      return rest as Coupon;
    } else {
      const local = readDb();
      local.coupons.push(coupon);
      writeDb(local);
      return coupon;
    }
  },

  async incrementCouponUsage(code: string): Promise<void> {
    if (isMongoConnected) {
      await MongoCoupon.updateOne({ code: code.toUpperCase() }, { $inc: { usageCount: 1 } });
    } else {
      const local = readDb();
      const c = local.coupons.find((coup) => coup.code.toUpperCase() === code.toUpperCase());
      if (c) {
        c.usageCount += 1;
        writeDb(local);
      }
    }
  },

  async deleteCoupon(code: string): Promise<void> {
    if (isMongoConnected) {
      await MongoCoupon.deleteOne({ code: code.toUpperCase() });
    } else {
      const local = readDb();
      local.coupons = local.coupons.filter((c) => c.code.toUpperCase() !== code.toUpperCase());
      writeDb(local);
    }
  },

  // ------------------------------------------
  // CMS TEXTS
  // ------------------------------------------
  async getCmsTexts(): Promise<{ about: string; terms: string; contact: string }> {
    if (isMongoConnected) {
      const item = await MongoCms.findOne({}).lean();
      if (item) {
        const { _id, __v, ...rest } = item as any;
        return rest;
      }
      return { about: '', terms: '', contact: '' };
    } else {
      return readDb().cmsTexts;
    }
  },

  async updateCmsTexts(data: { about: string; terms: string; contact: string }): Promise<any> {
    if (isMongoConnected) {
      await MongoCms.deleteMany({}); // Keep only one document
      const created = await MongoCms.create(data as any);
      const { _id, __v, ...rest } = created.toObject();
      return rest;
    } else {
      const local = readDb();
      local.cmsTexts = { ...local.cmsTexts, ...data };
      writeDb(local);
      return local.cmsTexts;
    }
  },

  // ------------------------------------------
  // STORE SETTINGS
  // ------------------------------------------
  async getStoreSettings(): Promise<{ currencyUnit: 'تومان' | 'ریال'; shippingCost: number; taxPercent: number }> {
    if (isMongoConnected) {
      const item = await MongoStoreSettings.findOne({}).lean();
      if (item) {
        const { _id, __v, ...rest } = item as any;
        return rest;
      }
      return { currencyUnit: 'تومان', shippingCost: 35000, taxPercent: 9 };
    } else {
      return readDb().storeSettings;
    }
  },

  async updateStoreSettings(data: { currencyUnit: 'تومان' | 'ریال'; shippingCost: number; taxPercent: number }): Promise<any> {
    if (isMongoConnected) {
      await MongoStoreSettings.deleteMany({}); // Keep only one document
      const created = await MongoStoreSettings.create(data as any);
      const { _id, __v, ...rest } = created.toObject();
      return rest;
    } else {
      const local = readDb();
      local.storeSettings = { ...local.storeSettings, ...data };
      writeDb(local);
      return local.storeSettings;
    }
  },

  // ------------------------------------------
  // ORDERS
  // ------------------------------------------
  async getOrders(): Promise<Order[]> {
    if (isMongoConnected) {
      const list = await MongoOrder.find({}).lean();
      return list.map((o: any) => {
        const { _id, __v, ...rest } = o;
        return rest as Order;
      });
    } else {
      return readDb().orders;
    }
  },

  async getOrderById(id: string): Promise<Order | null> {
    if (isMongoConnected) {
      const o = await MongoOrder.findOne({ id }).lean();
      if (!o) return null;
      const { _id, __v, ...rest } = o as any;
      return rest as Order;
    } else {
      const o = readDb().orders.find((ord) => ord.id === id);
      return o || null;
    }
  },

  async getOrderByTrackingCode(code: string): Promise<Order | null> {
    if (isMongoConnected) {
      const o = await MongoOrder.findOne({ trackingCode: code }).lean();
      if (!o) return null;
      const { _id, __v, ...rest } = o as any;
      return rest as Order;
    } else {
      const o = readDb().orders.find((ord) => ord.trackingCode === code);
      return o || null;
    }
  },

  async addOrder(data: Order): Promise<Order> {
    if (isMongoConnected) {
      const created = await MongoOrder.create(data as any);
      const { _id, __v, ...rest } = created.toObject();
      return rest as Order;
    } else {
      const local = readDb();
      local.orders.push(data);
      writeDb(local);
      return data;
    }
  },

  async updateOrderStatus(id: string, status: string): Promise<Order | null> {
    if (isMongoConnected) {
      const updated = await MongoOrder.findOneAndUpdate({ id }, { $set: { paymentStatus: status } }, { new: true }).lean();
      if (!updated) return null;
      const { _id, __v, ...rest } = updated as any;
      return rest as Order;
    } else {
      const local = readDb();
      const order = local.orders.find((o) => o.id === id);
      if (!order) return null;
      order.paymentStatus = status as 'pending' | 'success' | 'failed';
      writeDb(local);
      return order;
    }
  },

  async updateOrderStatusByTrackingCode(trackingCode: string, status: string): Promise<Order | null> {
    if (isMongoConnected) {
      const updated = await MongoOrder.findOneAndUpdate({ trackingCode }, { $set: { paymentStatus: status } }, { new: true }).lean();
      if (!updated) return null;
      const { _id, __v, ...rest } = updated as any;
      return rest as Order;
    } else {
      const local = readDb();
      const order = local.orders.find((o) => o.trackingCode === trackingCode);
      if (!order) return null;
      order.paymentStatus = status as 'pending' | 'success' | 'failed';
      writeDb(local);
      return order;
    }
  },

  // ==========================================
  // HANDMADES: SAMPLE ITEMS
  // ==========================================
  async getSampleItems(): Promise<SampleItem[]> {
    if (isMongoConnected) {
      const items = await MongoSampleItem.find({}).lean();
      return items.map((p: any) => {
        const { _id, __v, ...rest } = p;
        return rest as SampleItem;
      });
    } else {
      const db = readDb();
      return db.sampleItems || [];
    }
  },

  async addSampleItem(data: Omit<SampleItem, 'id' | 'createdAt'>): Promise<SampleItem> {
    const generatedId = 's-' + Math.floor(1000 + Math.random() * 9000).toString();
    const newItem: SampleItem = {
      ...data,
      id: generatedId,
      createdAt: new Date().toISOString()
    };

    if (isMongoConnected) {
      const created = await MongoSampleItem.create(newItem as any);
      const { _id, __v, ...rest } = created.toObject();
      return rest as SampleItem;
    } else {
      const local = readDb();
      if (!local.sampleItems) local.sampleItems = [];
      local.sampleItems.push(newItem);
      writeDb(local);
      return newItem;
    }
  },

  async editSampleItem(id: string, data: Partial<SampleItem>): Promise<SampleItem | null> {
    if (isMongoConnected) {
      const updated = await MongoSampleItem.findOneAndUpdate({ id }, { $set: data }, { new: true }).lean();
      if (!updated) return null;
      const { _id, __v, ...rest } = updated as any;
      return rest as SampleItem;
    } else {
      const local = readDb();
      if (!local.sampleItems) local.sampleItems = [];
      const idx = local.sampleItems.findIndex((p) => p.id === id);
      if (idx === -1) return null;
      local.sampleItems[idx] = { ...local.sampleItems[idx], ...data };
      writeDb(local);
      return local.sampleItems[idx];
    }
  },

  async deleteSampleItem(id: string): Promise<boolean> {
    if (isMongoConnected) {
      const result = await MongoSampleItem.deleteOne({ id });
      return result.deletedCount > 0;
    } else {
      const local = readDb();
      if (!local.sampleItems) local.sampleItems = [];
      const filtered = local.sampleItems.filter((p) => p.id !== id);
      if (filtered.length === local.sampleItems.length) return false;
      local.sampleItems = filtered;
      writeDb(local);
      return true;
    }
  },

  // ==========================================
  // HANDMADES: SAMPLE CATEGORIES
  // ==========================================
  async getSampleCategories(): Promise<SampleCategory[]> {
    if (isMongoConnected) {
      const items = await MongoSampleCategory.find({}).lean();
      return items.map((c: any) => ({ id: c.id, name: c.name }));
    } else {
      const db = readDb();
      return db.sampleCategories || [];
    }
  },

  async addSampleCategory(id: string, name: string): Promise<SampleCategory> {
    const newCat = { id, name };
    if (isMongoConnected) {
      await MongoSampleCategory.create(newCat);
      return newCat;
    } else {
      const local = readDb();
      if (!local.sampleCategories) local.sampleCategories = [];
      local.sampleCategories.push(newCat);
      writeDb(local);
      return newCat;
    }
  },

  async deleteSampleCategory(id: string): Promise<boolean> {
    if (isMongoConnected) {
      const result = await MongoSampleCategory.deleteOne({ id });
      return result.deletedCount > 0;
    } else {
      const local = readDb();
      if (!local.sampleCategories) return false;
      const filtered = local.sampleCategories.filter((c) => c.id !== id);
      if (filtered.length === local.sampleCategories.length) return false;
      local.sampleCategories = filtered;
      writeDb(local);
      return true;
    }
  },

  // ==========================================
  // HANDMADES: CUSTOM ORDERS
  // ==========================================
  async getCustomOrders(): Promise<CustomOrder[]> {
    if (isMongoConnected) {
      const list = await MongoCustomOrder.find({}).lean();
      return list.map((o: any) => {
        const { _id, __v, ...rest } = o;
        return rest as CustomOrder;
      });
    } else {
      const db = readDb();
      return db.customOrders || [];
    }
  },

  async getCustomOrdersByUserId(userId: string): Promise<CustomOrder[]> {
    if (isMongoConnected) {
      const list = await MongoCustomOrder.find({ userId }).lean();
      return list.map((o: any) => {
        const { _id, __v, ...rest } = o;
        return rest as CustomOrder;
      });
    } else {
      const db = readDb();
      const orders = db.customOrders || [];
      return orders.filter((o) => o.userId === userId);
    }
  },

  async getCustomOrderById(id: string): Promise<CustomOrder | null> {
    if (isMongoConnected) {
      const o = await MongoCustomOrder.findOne({ id }).lean();
      if (!o) return null;
      const { _id, __v, ...rest } = o as any;
      return rest as CustomOrder;
    } else {
      const db = readDb();
      const orders = db.customOrders || [];
      const o = orders.find((ord) => ord.id === id);
      return o || null;
    }
  },

  async addCustomOrder(data: Omit<CustomOrder, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<CustomOrder> {
    const generatedId = 'co-' + Math.floor(1000 + Math.random() * 9000).toString();
    const newOrder: CustomOrder = {
      ...data,
      id: generatedId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (isMongoConnected) {
      const created = await MongoCustomOrder.create(newOrder as any);
      const { _id, __v, ...rest } = created.toObject();
      return rest as CustomOrder;
    } else {
      const local = readDb();
      if (!local.customOrders) local.customOrders = [];
      local.customOrders.push(newOrder);
      writeDb(local);
      return newOrder;
    }
  },

  async updateCustomOrderPrice(id: string, adminPrice: number): Promise<CustomOrder | null> {
    const now = new Date().toISOString();
    if (isMongoConnected) {
      const updated = await MongoCustomOrder.findOneAndUpdate(
        { id },
        { $set: { adminPrice, status: 'priced', updatedAt: now } },
        { new: true }
      ).lean();
      if (!updated) return null;
      const { _id, __v, ...rest } = updated as any;
      return rest as CustomOrder;
    } else {
      const local = readDb();
      if (!local.customOrders) return null;
      const order = local.customOrders.find((o) => o.id === id);
      if (!order) return null;
      order.adminPrice = adminPrice;
      order.status = 'priced';
      order.updatedAt = now;
      writeDb(local);
      return order;
    }
  },

  async updateCustomOrderStatus(id: string, status: CustomOrder['status'], finalPrice?: number): Promise<CustomOrder | null> {
    const now = new Date().toISOString();
    const updateFields: any = { status, updatedAt: now };
    if (finalPrice !== undefined) {
      updateFields.finalPrice = finalPrice;
    }

    if (isMongoConnected) {
      const updated = await MongoCustomOrder.findOneAndUpdate(
        { id },
        { $set: updateFields },
        { new: true }
      ).lean();
      if (!updated) return null;
      const { _id, __v, ...rest } = updated as any;
      return rest as CustomOrder;
    } else {
      const local = readDb();
      if (!local.customOrders) return null;
      const order = local.customOrders.find((o) => o.id === id);
      if (!order) return null;
      order.status = status;
      if (finalPrice !== undefined) {
        order.finalPrice = finalPrice;
      }
      order.updatedAt = now;
      writeDb(local);
      return order;
    }
  },

  // ==========================================
  // HANDMADES: CHAT MESSAGES
  // ==========================================
  async getChatMessages(orderId: string): Promise<ChatMessage[]> {
    if (isMongoConnected) {
      const list = await MongoChatMessage.find({ orderId }).sort({ createdAt: 1 }).lean();
      return list.map((m: any) => {
        const { _id, __v, ...rest } = m;
        return rest as ChatMessage;
      });
    } else {
      const db = readDb();
      const messages = db.chatMessages || [];
      return messages.filter((m) => m.orderId === orderId);
    }
  },

  async addChatMessage(data: Omit<ChatMessage, 'id' | 'createdAt' | 'expiresAt'>): Promise<ChatMessage> {
    const generatedId = 'msg-' + Math.floor(100000 + Math.random() * 900000).toString();
    const now = new Date();
    const expires = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 hours from now

    const newMessage: ChatMessage = {
      ...data,
      id: generatedId,
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString()
    };

    if (isMongoConnected) {
      const created = await MongoChatMessage.create(newMessage as any);
      const { _id, __v, ...rest } = created.toObject();
      return rest as ChatMessage;
    } else {
      const local = readDb();
      if (!local.chatMessages) local.chatMessages = [];
      local.chatMessages.push(newMessage);
      writeDb(local);
      return newMessage;
    }
  },

  async cleanupExpiredChatMessages(): Promise<number> {
    const nowStr = new Date().toISOString();
    let count = 0;

    if (isMongoConnected) {
      // Find orders that are NOT paid
      const unpaidOrders = await MongoCustomOrder.find({ status: { $ne: 'paid' } }).select('id').lean();
      const unpaidOrderIds = unpaidOrders.map((o: any) => o.id);

      // Delete expired chat messages belonging to unpaid orders
      const result = await MongoChatMessage.deleteMany({
        orderId: { $in: unpaidOrderIds },
        expiresAt: { $lt: nowStr }
      });
      count = result.deletedCount || 0;
    } else {
      const local = readDb();
      const unpaidOrderIds = (local.customOrders || [])
        .filter((o) => o.status !== 'paid')
        .map((o) => o.id);

      const beforeLen = (local.chatMessages || []).length;
      if (local.chatMessages) {
        local.chatMessages = local.chatMessages.filter((msg) => {
          const isUnpaid = unpaidOrderIds.includes(msg.orderId);
          const isExpired = new Date(msg.expiresAt) < new Date();
          return !(isUnpaid && isExpired);
        });
        count = beforeLen - local.chatMessages.length;
        if (count > 0) {
          writeDb(local);
        }
      }
    }
    return count;
  },

  async getInventoryLogs(): Promise<any[]> {
    if (isMongoConnected) {
      try {
        return await MongoInventoryLog.find().sort({ date: -1 }).lean();
      } catch (err) {
        console.warn('Mongo connection error fetching logs, fallback to local');
      }
    }
    const local = readDb();
    if (!local.inventoryLogs) {
      local.inventoryLogs = [];
      writeDb(local);
    }
    return [...local.inventoryLogs].sort((a, b) => b.date.localeCompare(a.date));
  },

  async addInventoryLog(log: {
    productId: string;
    productTitle: string;
    type: 'in' | 'out' | 'damage' | 'adjustment' | 'sale';
    quantity: number;
    previousStock: number;
    newStock: number;
    operator: string;
    description: string;
  }): Promise<any> {
    const newLog = {
      ...log,
      id: 'log-' + Math.floor(100000 + Math.random() * 900000).toString(),
      date: new Date().toISOString()
    };
    if (isMongoConnected) {
      try {
        const created = await MongoInventoryLog.create(newLog);
        return created.toObject();
      } catch (err) {
        console.warn('Mongo connection error saving log, fallback to local');
      }
    }
    const local = readDb();
    if (!local.inventoryLogs) {
      local.inventoryLogs = [];
    }
    local.inventoryLogs.push(newLog);
    writeDb(local);
    return newLog;
  },

  async deleteUser(id: string): Promise<boolean> {
    if (isMongoConnected) {
      const res = await MongoUser.deleteOne({ id });
      return res.deletedCount > 0;
    } else {
      const local = readDb();
      const initialLength = local.users.length;
      local.users = local.users.filter((u) => u.id !== id);
      writeDb(local);
      return local.users.length < initialLength;
    }
  },

  async getTicketsByUserId(userId: string): Promise<any[]> {
    if (isMongoConnected) {
      const list = await MongoSupportTicket.find({ userId }).sort({ updatedAt: -1 }).lean();
      return list.map((t: any) => {
        const { _id, __v, ...rest } = t;
        return rest;
      });
    } else {
      const db = readDb();
      const tickets = db.tickets || [];
      return tickets.filter((t) => t.userId === userId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }
  },

  async getTickets(): Promise<any[]> {
    if (isMongoConnected) {
      const list = await MongoSupportTicket.find({}).sort({ updatedAt: -1 }).lean();
      return list.map((t: any) => {
        const { _id, __v, ...rest } = t;
        return rest;
      });
    } else {
      const db = readDb();
      return db.tickets || [];
    }
  },

  async getTicketById(id: string): Promise<any | null> {
    if (isMongoConnected) {
      const t = await MongoSupportTicket.findOne({ id }).lean();
      if (!t) return null;
      const { _id, __v, ...rest } = t as any;
      return rest;
    } else {
      const db = readDb();
      const tickets = db.tickets || [];
      return tickets.find((t) => t.id === id) || null;
    }
  },

  async createTicket(ticketData: { userId: string; customerName: string; customerPhone: string; subject: string; department: string }): Promise<any> {
    const generatedId = 'tkt-' + Math.floor(100000 + Math.random() * 900000).toString();
    const now = new Date().toISOString();
    const newTicket = {
      ...ticketData,
      id: generatedId,
      status: 'open',
      createdAt: now,
      updatedAt: now
    };

    if (isMongoConnected) {
      const created = await MongoSupportTicket.create(newTicket);
      return created.toObject();
    } else {
      const db = readDb();
      if (!db.tickets) db.tickets = [];
      db.tickets.push(newTicket);
      writeDb(db);
      return newTicket;
    }
  },

  async updateTicketStatus(id: string, status: 'open' | 'answered' | 'closed'): Promise<any | null> {
    const now = new Date().toISOString();
    if (isMongoConnected) {
      const updated = await MongoSupportTicket.findOneAndUpdate({ id }, { $set: { status, updatedAt: now } }, { new: true }).lean();
      if (!updated) return null;
      const { _id, __v, ...rest } = updated as any;
      return rest;
    } else {
      const db = readDb();
      const tickets = db.tickets || [];
      const t = tickets.find((ticket) => ticket.id === id);
      if (!t) return null;
      t.status = status;
      t.updatedAt = now;
      writeDb(db);
      return t;
    }
  },

  async getTicketMessages(ticketId: string): Promise<any[]> {
    if (isMongoConnected) {
      const list = await MongoSupportTicketMessage.find({ ticketId }).sort({ createdAt: 1 }).lean();
      return list.map((m: any) => {
        const { _id, __v, ...rest } = m;
        return rest;
      });
    } else {
      const db = readDb();
      const messages = db.ticketMessages || [];
      return messages.filter((m) => m.ticketId === ticketId);
    }
  },

  async addTicketMessage(messageData: { ticketId: string; sender: 'user' | 'admin'; senderName: string; message: string }): Promise<any> {
    const generatedId = 'tmsg-' + Math.floor(100000 + Math.random() * 900000).toString();
    const now = new Date().toISOString();
    const newMessage = {
      ...messageData,
      id: generatedId,
      createdAt: now
    };

    if (isMongoConnected) {
      const created = await MongoSupportTicketMessage.create(newMessage);
      await MongoSupportTicket.findOneAndUpdate({ id: messageData.ticketId }, { $set: { updatedAt: now } });
      return created.toObject();
    } else {
      const db = readDb();
      if (!db.ticketMessages) db.ticketMessages = [];
      db.ticketMessages.push(newMessage);
      
      const tickets = db.tickets || [];
      const t = tickets.find((ticket) => ticket.id === messageData.ticketId);
      if (t) {
        t.updatedAt = now;
      }
      writeDb(db);
      return newMessage;
    }
  }
};
