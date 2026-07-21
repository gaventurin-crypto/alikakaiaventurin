export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string;
  images?: string[];
  category: string;
  stock: number;
  variants?: string[];
  rating?: number;
  isFeatured?: boolean;
  discount?: number;
  isActive?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: string;
}

export interface Order {
  id: string;
  trackingCode: string;
  items: {
    productId: string;
    title?: string;
    productTitle?: string;
    price: number;
    quantity: number;
    variant?: string;
    image?: string;
  }[];
  amount?: number;
  totalPrice?: number;
  totalAmount?: number;
  shippingCost?: number;
  tax?: number;
  discountAmount?: number;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  customerPostalCode?: string;
  province?: string;
  city?: string;
  postalCode?: string;
  address?: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'success';
  shippingStatus?: 'pending' | 'processing' | 'shipped' | 'delivered';
  couponCode?: string;
  shippingMethod?: 'post' | 'express' | string;
  createdAt?: string;
  date?: string;
  paymentGateway?: string;
  userId?: string;
}

export interface Coupon {
  code: string;
  type: 'percent' | 'amount';
  value: number;
  expiryDate: string;
  usageLimit: number;
  usageCount: number;
}

export interface CustomOrder {
  id: string;
  trackingCode?: string;
  userId?: string;
  category?: string;
  material?: string;
  stone?: string;
  color?: string;
  description?: string;
  estimatedPrice?: number;
  adminPrice?: number;
  finalPrice?: number;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  customerPostalCode?: string;
  selectedSamples?: any[];
  uploadedImages?: string[];
  status: 'pending' | 'chatting' | 'priced' | 'accepted' | 'paid' | 'completed' | 'canceled' | 'rejected';
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatMessage {
  id: string;
  orderId?: string;
  userId?: string;
  sender: 'user' | 'admin' | 'system';
  senderName?: string;
  text?: string;
  message?: string;
  imageUrl?: string;
  createdAt: string;
  expiresAt?: string;
}

export interface SampleItem {
  id: string;
  title: string;
  description: string;
  category: string;
  basePrice: number;
  image: string;
  material: string;
  stone: string;
  color: string;
  createdAt: string;
}

export interface CMSHeader {
  logoUrl: string;
  topText: string;
  menus: { id: string; name: string; link: string; order: number; isActive: boolean }[];
  buttonText: string;
  buttonLink: string;
  socials: { id: string; name: string; link: string; icon: string }[];
}

export interface CMSBanner {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  isActive: boolean;
  order: number;
}

export interface CMSMiddleSection {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  link: string;
  isActive: boolean;
  order: number;
}

export interface CMSFooter {
  aboutText: string;
  contactInfo: {
    address: string;
    phone: string;
    email: string;
    workingHours?: string;
  };
  links: { id: string; name: string; link: string; order: number }[];
  socials: { id: string; name: string; link: string; icon: string }[];
}

export interface CMSGeneralSettings {
  title: string;
  description: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  welcomeMessage: string;
}

export interface CMSTexts {
  about: string;
  terms: string;
  contact: string;
  header?: CMSHeader;
  banners?: CMSBanner[];
  middleSections?: CMSMiddleSection[];
  footer?: CMSFooter;
  general?: CMSGeneralSettings;
}

export interface StoreCategory {
  id: string;
  name: string;
  image?: string;
  order?: number;
  isActive?: boolean;
  icon?: string;
  description?: string;
}

export interface SampleCategory {
  id: string;
  name: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  subject: string;
  department: string; // 'support' | 'sales' | 'handmades' | 'general'
  status: 'open' | 'answered' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface SupportTicketMessage {
  id: string;
  ticketId: string;
  sender: 'user' | 'admin';
  senderName: string;
  message: string;
  createdAt: string;
}
