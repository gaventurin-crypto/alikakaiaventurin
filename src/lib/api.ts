import { Product, Order, Coupon } from '../types';

const BASE_URL = '/api';

function getHeaders() {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = localStorage.getItem('aventurin_jwt_token');
  if (token && token !== 'null' && token !== 'undefined' && token.trim() !== '') {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(endpoint: string, options: RequestInit = {}, retries = 2, delay = 1000): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {}),
    },
  };

  let lastError: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay * attempt));
        console.log(`Retrying request to ${url} (Attempt ${attempt}/${retries})...`);
      }

      const response = await fetch(url, config);
      
      const contentType = response.headers.get('content-type');
      let data: any;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`پاسخ سرور در قالب JSON نبود (کد ${response.status}). متن پاسخ: ${text.slice(0, 100)}`);
      }

      if (!response.ok) {
        throw new Error(data.message || 'خطایی در ارتباط با سرور رخ داده است.');
      }

      return data as T;
    } catch (err: any) {
      lastError = err;
      console.warn(`Request to ${url} failed on attempt ${attempt}:`, err.message);
      
      // Do not retry client-side errors like unauthorized, incorrect password, or bad coupon codes
      if (
        responseHasStatus(err, [401, 403, 400, 404]) ||
        (err.message && (
          err.message.includes('غیرمجاز') || 
          err.message.includes('اشتباه') || 
          err.message.includes('معتبر نیست') ||
          err.message.includes('تکراری')
        ))
      ) {
        throw err;
      }
    }
  }

  throw lastError || new Error('خطا در ارتباط با سرور.');
}

// Helper to check response status from custom errors
function responseHasStatus(error: any, statuses: number[]): boolean {
  if (error && error.status && statuses.includes(error.status)) return true;
  return false;
}

export const api = {
  // Auth
  async login(email: string, password: string) {
    const res = await request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('aventurin_jwt_token', res.token);
    localStorage.setItem('aventurin_user', JSON.stringify(res.user));
    return res;
  },

  async register(userData: any) {
    const res = await request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    localStorage.setItem('aventurin_jwt_token', res.token);
    localStorage.setItem('aventurin_user', JSON.stringify(res.user));
    return res;
  },

  logout() {
    localStorage.removeItem('aventurin_jwt_token');
    localStorage.removeItem('aventurin_user');
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('aventurin_user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        return null;
      }
    }
    return null;
  },

  async getProfile() {
    return request<any>('/auth/me');
  },

  async updateProfile(profileData: { name: string; lastName?: string; phone: string; address: string; postalCode: string; birthDate?: string; password?: string }) {
    const res = await request<{ message: string; user: any }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
    localStorage.setItem('aventurin_user', JSON.stringify(res.user));
    return res;
  },

  // Products
  async getProducts() {
    return request<Product[]>('/products');
  },

  async getProduct(id: string) {
    return request<Product>(`/products/${id}`);
  },

  async addProduct(product: Omit<Product, 'id' | 'rating'>) {
    return request<Product>('/admin/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  },

  async editProduct(id: string, product: Partial<Product>) {
    return request<Product>(`/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  },

  async deleteProduct(id: string) {
    return request<{ message: string }>(`/admin/products/${id}`, {
      method: 'DELETE',
    });
  },

  // Categories
  async getCategories() {
    return request<Array<{ id: string; name: string; image?: string; order?: number; isActive?: boolean }>>('/categories');
  },

  async addCategory(id: string, name: string, image?: string, order?: number, isActive?: boolean) {
    return request<any>('/admin/categories', {
      method: 'POST',
      body: JSON.stringify({ id, name, image, order, isActive }),
    });
  },

  async editCategory(id: string, data: Partial<{ name: string; image: string; order: number; isActive: boolean }>) {
    return request<any>(`/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteCategory(id: string) {
    return request<any>(`/admin/categories/${id}`, {
      method: 'DELETE',
    });
  },

  // Coupons
  async getCoupons() {
    return request<Coupon[]>('/coupons');
  },

  async validateCoupon(code: string) {
    return request<Coupon>('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },

  async addCoupon(coupon: Coupon) {
    return request<Coupon>('/admin/coupons', {
      method: 'POST',
      body: JSON.stringify(coupon),
    });
  },

  async deleteCoupon(code: string) {
    return request<any>(`/admin/coupons/${code}`, {
      method: 'DELETE',
    });
  },

  // CMS Content
  async getCmsTexts() {
    return request<{ about: string; terms: string; contact: string }>('/cms');
  },

  async updateCmsTexts(cms: { about: string; terms: string; contact: string }) {
    return request<any>('/admin/cms', {
      method: 'POST',
      body: JSON.stringify(cms),
    });
  },

  // Store Settings
  async getStoreSettings() {
    return request<{ currencyUnit: 'تومان' | 'ریال'; shippingCost: number; taxPercent: number }>('/settings');
  },

  async updateStoreSettings(settings: { currencyUnit: 'تومان' | 'ریال'; shippingCost: number; taxPercent: number }) {
    return request<any>('/admin/settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  },

  // Orders
  async getOrders() {
    return request<Order[]>('/orders');
  },

  async updateOrderStatus(id: string, status: string) {
    return request<Order>(`/admin/orders/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  },

  // Users List (Admin)
  async getUsers() {
    return request<any[]>('/admin/users');
  },

  async updateUser(id: string, updates: any) {
    return request<any>(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Zarinpal Gateway Creation & Verification
  async createPaymentSession(amount: number, couponCode: string | null, items: any[], customerData: any) {
    return request<{ authority: string; paymentUrl: string; orderId: string }>('/payment/create', {
      method: 'POST',
      body: JSON.stringify({ amount, couponCode, items, customerData }),
    });
  },

  async verifyPayment(authority: string, status: 'OK' | 'FAIL') {
    return request<{ status: 'success' | 'failed'; order?: Order; trackingCode?: string; message?: string }>('/payment/verify', {
      method: 'POST',
      body: JSON.stringify({ authority, status }),
    });
  },

  async getDbStatus() {
    return request<{ isMongo: boolean; hasUri: boolean; provider: 'mongodb' | 'json-db' }>('/db-status');
  },

  // ==========================================
  // HANDMADES (CUSTOM DESIGN PORTFOLIO) API CLIENT
  // ==========================================
  async getSampleCategories() {
    return request<any[]>('/sample-categories');
  },

  async addSampleCategory(name: string) {
    return request<any>('/admin/sample-categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  async deleteSampleCategory(id: string) {
    return request<any>(`/admin/sample-categories/${id}`, {
      method: 'DELETE',
    });
  },

  async getSampleItems() {
    return request<any[]>('/sample-items');
  },

  async addSampleItem(item: any) {
    return request<any>('/admin/sample-items', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  async editSampleItem(id: string, item: any) {
    return request<any>(`/admin/sample-items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    });
  },

  async deleteSampleItem(id: string) {
    return request<any>(`/admin/sample-items/${id}`, {
      method: 'DELETE',
    });
  },

  async submitCustomOrder(order: any) {
    return request<any>('/custom-orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  },

  async getMyCustomOrders() {
    return request<any[]>('/custom-orders/my');
  },

  async getAllCustomOrders() {
    return request<any[]>('/admin/custom-orders');
  },

  async updateCustomOrderPrice(id: string, adminPrice: number) {
    return request<any>(`/admin/custom-orders/${id}/price`, {
      method: 'PUT',
      body: JSON.stringify({ adminPrice }),
    });
  },

  async updateCustomOrderStatus(id: string, status: string) {
    return request<any>(`/admin/custom-orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  async acceptCustomOrderPrice(id: string) {
    return request<any>(`/custom-orders/${id}/accept-price`, {
      method: 'POST',
    });
  },

  async payCustomOrder(id: string) {
    return request<any>(`/custom-orders/${id}/pay`, {
      method: 'POST',
    });
  },

  async getChatMessages(orderId: string) {
    return request<any[]>(`/custom-orders/${orderId}/chat`);
  },

  async sendChatMessage(orderId: string, message: string, imageUrl?: string) {
    return request<any>(`/custom-orders/${orderId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message, imageUrl }),
    });
  },

  // Inventory & Warehouse Management
  async getInventoryLogs() {
    return request<any[]>('/admin/inventory/logs');
  },

  async adjustInventory(productId: string, type: 'in' | 'out' | 'damage' | 'adjustment', quantity: number, description: string, operator?: string) {
    return request<any>('/admin/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({ productId, type, quantity, description, operator }),
    });
  },

  // Support Tickets API
  async createTicket(ticketData: { subject: string; department: string; initialMessage: string }) {
    return request<any>('/tickets', {
      method: 'POST',
      body: JSON.stringify(ticketData),
    });
  },

  async getMyTickets() {
    return request<any[]>('/tickets/my');
  },

  async getTicketChat(ticketId: string) {
    return request<any[]>(`/tickets/${ticketId}/chat`);
  },

  async sendTicketChatMessage(ticketId: string, message: string) {
    return request<any>(`/tickets/${ticketId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  async getAllAdminTickets() {
    return request<any[]>('/admin/tickets');
  },

  async updateTicketStatus(ticketId: string, status: 'open' | 'answered' | 'closed') {
    return request<any>(`/admin/tickets/${ticketId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // SuperAdmin User management
  async createAdminUser(userData: any) {
    return request<any>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async deleteAdminUser(id: string) {
    return request<any>(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  },

  async updateAdminUserRole(id: string, role: 'user' | 'admin' | 'superadmin') {
    return request<any>(`/admin/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }
};
