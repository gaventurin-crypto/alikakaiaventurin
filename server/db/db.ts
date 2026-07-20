import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { Product, Order, StoreCategory, SampleItem, SampleCategory, CustomOrder, ChatMessage, Coupon } from '../../src/types';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'user' | 'superadmin';
  status: 'active' | 'blocked';
  phone?: string;
  address?: string;
  postalCode?: string;
  lastName?: string;
  birthDate?: string;
  points?: number;
}

export interface DbSchema {
  products: Product[];
  categories: Array<{ id: string; name: string }>;
  orders: Order[];
  users: UserRecord[];
  coupons: Coupon[];
  cmsTexts: { about: string; terms: string; contact: string };
  storeSettings: { currencyUnit: 'تومان' | 'ریال'; shippingCost: number; taxPercent: number };
  sampleItems: SampleItem[];
  sampleCategories: SampleCategory[];
  customOrders: CustomOrder[];
  chatMessages: ChatMessage[];
  tickets?: any[];
  ticketMessages?: any[];
  inventoryLogs?: any[];
}

const DB_FILE_PATH = path.join(process.cwd(), 'server-db.json');

// Initial seed data
const initialProducts: Product[] = [
  {
    id: 'p1',
    title: 'گردنبند طلا با آویز تک‌نگین الماس',
    description: 'گردنبند ظریف و دست‌ساز از طلای ۱۸ عیار همراه با تک‌نگین الماس درخشان تراش برلیان. انتخابی بی‌نظیر برای درخشش در مهمانی‌ها و هدیه‌ای ماندگار برای عزیزان شما. کاملاً ضدحساسیت و آبکاری شده با رادیوم برای ثبات رنگ همیشگی.',
    price: 1850000,
    image: '/src/assets/images/luxury_necklace_1784386427279.jpg',
    category: 'necklace',
    stock: 8,
    variants: ['طلایی', 'نقره‌ای', 'رزگلد'],
    rating: 4.9,
    isFeatured: true,
    discount: 10
  },
  {
    id: 'p2',
    title: 'انگشتر لوکس طلا با نگین زمرد کلمبیا',
    description: 'انگشتر منحصر‌به‌فرد طرح مارکیز ساخته شده از طلای ۱۸ عیار با نگین زمرد طبیعی کلمبیا با رنگ سبز غلیظ و بی‌نقص. بدنه انگشتر با ظرافت خارق‌العاده مخراج‌کاری شده است. همراه با شناسنامه معتبر سنگ‌های قیمتی.',
    price: 2400000,
    image: '/src/assets/images/luxury_ring_1784386441851.jpg',
    category: 'ring',
    stock: 5,
    variants: ['طلایی', 'سفید'],
    rating: 5.0,
    isFeatured: true
  },
  {
    id: 'p3',
    title: 'گوشواره آویز لوکس با مروارید طبیعی',
    description: 'جفت گوشواره آویز فوق‌العاده زیبا متشکل از مرواریدهای آب شیرین طبیعی و زنجیر طلای باکیفیت. مرواریدها دارای درخشش صدفی خیره‌کننده و یکدست هستند. طراحی ارگونومیک قفل گوشواره مانع از خستگی گوش می‌شود.',
    price: 950000,
    image: '/src/assets/images/luxury_earrings_1784386456583.jpg',
    category: 'earrings',
    stock: 12,
    variants: ['طلایی', 'نقره‌ای'],
    rating: 4.8,
    isFeatured: true
  },
  {
    id: 'p4',
    title: 'دستبند زنجیری مدرن با آویزهای ظریف',
    description: 'دستبند زنانه مدرن با زنجیر چندلایه و آویزهای هندسی مینیمال مینیاتوری. این دستبند از استیل درجه یک جراحی (عیار ۳۱۶) با آبکاری طلای ۲۴ عیار ساخته شده است و برای استفاده روزانه کاملاً مناسب و مقاوم در برابر آب است.',
    price: 1200000,
    image: '/src/assets/images/luxury_bracelet_1784386471951.jpg',
    category: 'bracelet',
    stock: 15,
    variants: ['طلایی', 'رزگلد'],
    rating: 4.7,
    isFeatured: true,
    discount: 15
  },
  {
    id: 'p5',
    title: 'گردنبند چند ردیفه کارتیر و سکه الیزابت',
    description: 'ترکیب مدرن زنجیر ضخیم کارتیر به همراه زنجیر باریک و آویز سکه کلاسیک الیزابت. ساخته شده از فلز مس با پوشش آبکاری طلا زرد چندلایه. استایلی جسورانه و ترند برای دختران جوان علاقمند به مد مدرن.',
    price: 780000,
    image: '/src/assets/images/luxury_necklace_1784386427279.jpg',
    category: 'necklace',
    stock: 20,
    variants: ['طلایی'],
    rating: 4.6,
    discount: 5
  },
  {
    id: 'p6',
    title: 'انگشتر رینگ ظریف هفت نگین کریستال',
    description: 'انگشتر ردیفی مینیمال با هفت کریستال سواروسکی اصل مخراج‌کاری شده به صورت خطی. بسیار شیک برای استفاده تکی یا ست کردن با دیگر انگشترها (Stackable). بدون حساسیت پوستی و با ماندگاری رنگ مادام‌العمر.',
    price: 450000,
    image: '/src/assets/images/luxury_ring_1784386441851.jpg',
    category: 'ring',
    stock: 25,
    variants: ['طلایی', 'نقره‌ای', 'رزگلد'],
    rating: 4.9
  },
  {
    id: 'p7',
    title: 'گوشواره حلقه‌ای آیس‌کات با آبکاری رزگلد',
    description: 'گوشواره‌های حلقه‌ای سایز متوسط با تراش‌های الماسی آیس‌کات که نور را در تمام زوایا منعکس می‌کنند. دارای رنگ پرطرفدار رزگلد و قفل بسیار ایمن فرانسوی. انتخابی عالی برای هدیه روز زن.',
    price: 620000,
    image: '/src/assets/images/luxury_earrings_1784386456583.jpg',
    category: 'earrings',
    stock: 18,
    variants: ['رزگلد', 'طلایی'],
    rating: 4.5,
    discount: 20
  },
  {
    id: 'p8',
    title: 'دستبند زنجیری کارتیر ظریف کلاسیک',
    description: 'دستبند کارتیر همیشگی و کلاسیک با پهنای ۴ میلی‌متر. تماماً آبکاری طلا زرد، قفل طوطی درجه یک و امکان تنظیم طول دستبند با زنجیر اضافه کارشده در انتهای کار. دوام بسیار بالا و شستشوی آسان.',
    price: 890000,
    image: '/src/assets/images/luxury_bracelet_1784386471951.jpg',
    category: 'bracelet',
    stock: 14,
    variants: ['طلایی', 'نقره‌ای'],
    rating: 4.8
  }
];

const initialCategories = [
  { id: 'all', name: 'همه موارد', image: '/src/assets/images/luxury_necklace_1784386427279.jpg', order: 1, isActive: true },
  { id: 'necklace', name: 'گردنبندها', image: '/src/assets/images/luxury_necklace_1784386427279.jpg', order: 2, isActive: true },
  { id: 'ring', name: 'انگشترها', image: '/src/assets/images/luxury_ring_1784386441851.jpg', order: 3, isActive: true },
  { id: 'earrings', name: 'گوشواره‌ها', image: '/src/assets/images/luxury_earrings_1784386456583.jpg', order: 4, isActive: true },
  { id: 'bracelet', name: 'دستبندها', image: '/src/assets/images/luxury_bracelet_1784386471951.jpg', order: 5, isActive: true },
];

const initialCoupons = [
  { code: 'AVENTURIN1405', type: 'percent' as const, value: 15, expiryDate: '2027-03-20', usageLimit: 100, usageCount: 0 },
  { code: 'OFF50', type: 'amount' as const, value: 50000, expiryDate: '2027-06-01', usageLimit: 50, usageCount: 0 },
];

export const defaultCms = {
  about: 'گالری آونتورین در سال ۱۳۹۸ با هدف طراحی و ارائه زیورآلات و بدلیجات لوکس و باکیفیت تاسیس شد. ما بر این باوریم که هر قطعه از اکسسوری، داستانی از ظرافت و شخصیت منحصربه‌فرد صاحب خود را روایت می‌کند. تیم طراحی ما با وسواس فراوان برترین متریال ضدحساسیت و سنگ‌های درخشان را دست‌چین کرده و با مجهزترین شیوه‌های آبکاری طلا و رادیوم عرضه می‌دارد.',
  terms: '۱. تمامی خریدهای گالری دارای ۷ روز ضمانت بازگشت کالا و تعویض بی‌قیدوشرط در صورت بروز نقص فنی یا عدم مطابقت با تصاویر می‌باشند.\n۲. ارسال سفارشات از طریق پست پیشتاز ظرف ۲ الی ۴ روز کاری انجام می‌پذیرد.\n۳. اطلاعات خریداران گرامی در سرورهای امن آونتورین ذخیره شده و متعهد به حفظ کامل حریم خصوصی شما هستیم.',
  contact: 'نشانی گالری: مرکزی، محلات، میدان مصطفی خمینی، گالری اونتورین\nتلفن پشتیبانی: ۰۹۳۹۹۳۱۱۸۷۵\nپست الکترونیک: galeriaventurin@gmail.com\nپشتیبانی آنلاین: تلگرام، ایتا، بله، روبیکا، اینستاگرام و واتساپ',
  header: {
    logoUrl: '/src/assets/images/luxury_necklace_1784386427279.jpg',
    topText: '✨ گالری آونتورین - ارائه دهنده زیورآلات لوکس و دست‌ساز با ۷ روز ضمانت بازگشت کالا ✨',
    menus: [
      { id: 'm-1', name: 'صفحه اصلی', link: '/', order: 1, isActive: true },
      { id: 'm-2', name: 'فروشگاه زیورآلات', link: '/shop', order: 2, isActive: true },
      { id: 'm-3', name: 'سفارش اختصاصی', link: '/custom', order: 3, isActive: true },
      { id: 'm-4', name: 'درباره ما', link: '/about', order: 4, isActive: true },
      { id: 'm-5', name: 'قوانین و مقررات', link: '/terms', order: 5, isActive: true },
    ],
    buttonText: 'سفارش اختصاصی',
    buttonLink: '/custom',
    socials: [
      { id: 's-1', name: 'Instagram', link: 'https://instagram.com/aventurin', icon: 'Instagram' },
      { id: 's-2', name: 'Telegram', link: 'https://t.me/aventurin', icon: 'Send' },
      { id: 's-3', name: 'Phone', link: 'tel:09399311875', icon: 'Phone' },
    ]
  },
  banners: [
    {
      id: 'b-1',
      imageUrl: '/src/assets/images/luxury_necklace_1784386427279.jpg',
      title: 'شکوه و درخشش زیورآلات دست‌ساز آونتورین',
      subtitle: 'کلکسیونی بی‌نظیر از بهترین طلا، نقره و سنگ‌های قیمتی دست‌چین با طراحی اختصاصی برای سخت‌پسندان',
      buttonText: 'مشاهده کلکسیون محصولات',
      buttonLink: '/shop',
      isActive: true,
      order: 1
    },
    {
      id: 'b-2',
      imageUrl: '/src/assets/images/luxury_ring_1784386441851.jpg',
      title: 'رویای خود را طراحی کنید و بسازید!',
      subtitle: 'سیستم منحصربه‌فرد ساخت طلا و زیورآلات سفارشی متناسب با بودجه و سلیقه خاص شما همراه با گفتگوی مستقیم با سازنده',
      buttonText: 'شروع ساخت زیورآلات سفارشی',
      buttonLink: '/custom',
      isActive: true,
      order: 2
    }
  ],
  middleSections: [
    {
      id: 'mid-1',
      title: 'چرا گالری آونتورین را انتخاب کنید؟',
      subtitle: 'ارسال سریع به سراسر کشور، ضمانت بازگشت وجه، استفاده از فلزات ضد حساسیت با ثبات رنگ بالا و شناسنامه اصالت سنگ.',
      imageUrl: '/src/assets/images/luxury_earrings_1784386456583.jpg',
      link: '/about',
      isActive: true,
      order: 1
    },
    {
      id: 'mid-2',
      title: 'مشاوره آنلاین و طراحی ۳ بعدی رایگان',
      subtitle: 'قبل از ساخت سفارش اختصاصی، طرح شما به صورت ۳ بعدی مدل‌سازی شده و تغییرات لازم با سلیقه شما اعمال خواهد شد.',
      imageUrl: '/src/assets/images/luxury_bracelet_1784386471951.jpg',
      link: '/custom',
      isActive: true,
      order: 2
    }
  ],
  footer: {
    aboutText: 'گالری آونتورین از سال ۱۳۹۸ با طراحی‌های خلاقانه و استفاده از برترین متریال زیورآلات، پاسخگوی سلیقه مشتریان شیک‌پوش ایرانی است. اصالت، کیفیت و رضایت مشتری سه اصل تغییرناپذیر ماست.',
    contactInfo: {
      address: 'مرکزی، محلات، میدان مصطفی خمینی، مجتمع لوکس تجاری، طبقه اول، واحد ۲۲',
      phone: '۰۹۳۹۹۳۱۱۸۷۵',
      email: 'galeriaventurin@gmail.com',
      workingHours: 'همه روزه از ساعت ۱۰ صبح الی ۹ شب'
    },
    links: [
      { id: 'fl-1', name: 'همه محصولات', link: '/shop', order: 1 },
      { id: 'fl-2', name: 'سفارش ساخت اختصاصی', link: '/custom', order: 2 },
      { id: 'fl-3', name: 'درباره ما', link: '/about', order: 3 },
      { id: 'fl-4', name: 'قوانین خرید و مرجوعی', link: '/terms', order: 4 }
    ],
    socials: [
      { id: 'fs-1', name: 'اینستاگرام', link: 'https://instagram.com/aventurin', icon: 'Instagram' },
      { id: 'fs-2', name: 'تلگرام', link: 'https://t.me/aventurin', icon: 'Send' },
      { id: 'fs-3', name: 'ایتا', link: 'https://eitaa.com/aventurin', icon: 'MessageSquare' },
      { id: 'fs-4', name: 'روبیکا', link: 'https://rubika.ir/aventurin', icon: 'MessageCircle' }
    ]
  },
  general: {
    title: 'گالری آونتورین | فروشگاه زیورآلات لوکس و سفارشی',
    description: 'خرید اینترنتی زیورآلات طلا، نقره و استیل باکیفیت بالا، ضد حساسیت و رنگ ثابت همراه با سیستم اختصاصی سفارش طراحی و ساخت آنلاین بدلیجات دست‌ساز.',
    logoUrl: '/src/assets/images/luxury_necklace_1784386427279.jpg',
    faviconUrl: '/favicon.ico',
    primaryColor: '#0f172a',
    accentColor: '#b45309',
    fontFamily: 'Inter',
    welcomeMessage: 'به دنیای درخشان و اختصاصی گالری آونتورین خوش آمدید!'
  }
};

const defaultSettings = {
  currencyUnit: 'تومان' as const,
  shippingCost: 35000,
  taxPercent: 9
};

const initialSampleCategories: SampleCategory[] = [
  { id: 'sc-1', name: 'انگشترهای سفارشی' },
  { id: 'sc-2', name: 'گردنبندهای سفارشی' },
  { id: 'sc-3', name: 'گوشواره‌های سفارشی' },
  { id: 'sc-4', name: 'دستبندهای سفارشی' }
];

const initialSampleItems: SampleItem[] = [
  {
    id: 's-1',
    title: 'رینگ دست‌ساز طرح پروانه طلایی',
    description: 'انگشتر فوق‌العاده ظریف و دست‌ساز از طلای ۱۸ عیار با آویز متحرک مینیاتوری پروانه و نگین‌های کوچک برلیان اصل.',
    category: 'ring',
    basePrice: 3200000,
    image: '/src/assets/images/luxury_ring_1784386441851.jpg',
    material: 'gold',
    stone: 'diamond',
    color: 'gold',
    createdAt: new Date().toISOString()
  },
  {
    id: 's-2',
    title: 'گردنبند دست‌ساز آبشاری نقره با مروارید',
    description: 'گردنبند نقره استرلینگ ۹۲۵ دست‌ساز طرح آبشاری همراه با مرواریدهای آب شیرین بیضی و زنجیر کارشده بسیار ظریف.',
    category: 'necklace',
    basePrice: 1950000,
    image: '/src/assets/images/luxury_necklace_1784386427279.jpg',
    material: 'silver',
    stone: 'pearl',
    color: 'silver',
    createdAt: new Date().toISOString()
  },
  {
    id: 's-3',
    title: 'گوشواره آویز هندسی مینیمال رزگلد',
    description: 'گوشواره آویز بلند دست‌ساز با خطوط هندسی متقاطع از جنس استیل ضدحساسیت با روکش آبکاری رزگلد چند لایه.',
    category: 'earrings',
    basePrice: 850000,
    image: '/src/assets/images/luxury_earrings_1784386456583.jpg',
    material: 'rose-gold',
    stone: 'none',
    color: 'rose-gold',
    createdAt: new Date().toISOString()
  },
  {
    id: 's-4',
    title: 'دستبند النگویی طرح بافت امپراطور',
    description: 'دستبند النگویی فوق‌العاده مستحکم ساخته شده با متدهای سنتی بافت فلز از جنس نقره سیاه قلم همراه با نگین فیروزه نیشابور.',
    category: 'bracelet',
    basePrice: 2400000,
    image: '/src/assets/images/luxury_bracelet_1784386471951.jpg',
    material: 'silver',
    stone: 'emerald',
    color: 'silver',
    createdAt: new Date().toISOString()
  }
];

// Create the JSON file with hashed password for admin and default user
export function initDb() {
  if (fs.existsSync(DB_FILE_PATH)) {
    try {
      const data = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(data); // Validate JSON format
      // Upgrade database format in place if handmades arrays are missing
      let mutated = false;
      if (!parsed.sampleItems) { parsed.sampleItems = initialSampleItems; mutated = true; }
      if (!parsed.sampleCategories) { parsed.sampleCategories = initialSampleCategories; mutated = true; }
      if (!parsed.customOrders) { parsed.customOrders = []; mutated = true; }
      if (!parsed.chatMessages) { parsed.chatMessages = []; mutated = true; }
      if (!parsed.inventoryLogs) { parsed.inventoryLogs = []; mutated = true; }
      if (!parsed.tickets) { parsed.tickets = []; mutated = true; }
      if (!parsed.ticketMessages) { parsed.ticketMessages = []; mutated = true; }
      
      // CMS and Layout upgrade
      if (!parsed.cmsTexts) {
        parsed.cmsTexts = defaultCms;
        mutated = true;
      } else if (!parsed.cmsTexts.header || !parsed.cmsTexts.banners || !parsed.cmsTexts.middleSections || !parsed.cmsTexts.footer || !parsed.cmsTexts.general) {
        parsed.cmsTexts = { ...defaultCms, ...parsed.cmsTexts };
        mutated = true;
      }

      // Categories upgrade
      if (!parsed.categories || parsed.categories.length === 0 || !parsed.categories.some((c: any) => c.hasOwnProperty('isActive'))) {
        parsed.categories = initialCategories;
        mutated = true;
      }

      if (mutated) {
        fs.writeFileSync(DB_FILE_PATH, JSON.stringify(parsed, null, 2), 'utf-8');
        console.log('✅ Local database format successfully upgraded in place to support handmades and dynamic CMS.');
      }
      return;
    } catch (e) {
      console.error('Corruption detected in database, re-initializing database...');
    }
  }

  // Pre-hash password for initial accounts
  const salt = bcrypt.genSaltSync(10);
  const adminHash = bcrypt.hashSync('admin123', salt);
  const userHash = bcrypt.hashSync('user123', salt);

  const initialUsers: UserRecord[] = [
    {
      id: 'u-1',
      name: 'مریم حسینی',
      email: 'maryam@example.com',
      passwordHash: userHash,
      role: 'user',
      status: 'active'
    },
    {
      id: 'u-2',
      name: 'مدیریت گالری آونتورین',
      email: 'alikakai2101@gmail.com',
      passwordHash: adminHash,
      role: 'admin',
      status: 'active'
    },
    {
      id: 'u-3',
      name: 'آرش علوی',
      email: 'arash@example.com',
      passwordHash: userHash,
      role: 'user',
      status: 'blocked'
    },
    {
      id: 'u-4',
      name: 'پشتیبانی فنی سیستم',
      email: 'admin@aventurin.com',
      passwordHash: adminHash,
      role: 'admin',
      status: 'active'
    }
  ];

  const schema: DbSchema = {
    products: initialProducts,
    categories: initialCategories,
    orders: [],
    users: initialUsers,
    coupons: initialCoupons,
    cmsTexts: defaultCms,
    storeSettings: defaultSettings,
    sampleItems: initialSampleItems,
    sampleCategories: initialSampleCategories,
    customOrders: [],
    chatMessages: [],
    tickets: [],
    ticketMessages: [],
    inventoryLogs: []
  };

  fs.writeFileSync(DB_FILE_PATH, JSON.stringify(schema, null, 2), 'utf-8');
  console.log('Database initialized successfully at ' + DB_FILE_PATH);
}

export function readDb(): DbSchema {
  if (!fs.existsSync(DB_FILE_PATH)) {
    initDb();
  }
  const data = fs.readFileSync(DB_FILE_PATH, 'utf-8');
  return JSON.parse(data) as DbSchema;
}

export function writeDb(data: DbSchema) {
  fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}
