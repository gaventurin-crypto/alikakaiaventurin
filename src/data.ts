import { Product, StoreCategory } from './types';

export const INITIAL_PRODUCTS: Product[] = [
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
    image: '/src/assets/images/luxury_necklace_1784386427279.jpg', // Reused gorgeous necklace
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
    image: '/src/assets/images/luxury_ring_1784386441851.jpg', // Reused gorgeous ring
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
    image: '/src/assets/images/luxury_earrings_1784386456583.jpg', // Reused gorgeous earrings
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
    image: '/src/assets/images/luxury_bracelet_1784386471951.jpg', // Reused gorgeous bracelet
    category: 'bracelet',
    stock: 14,
    variants: ['طلایی', 'نقره‌ای'],
    rating: 4.8
  }
];

export const CATEGORIES: StoreCategory[] = [
  { id: 'necklace', name: 'گردنبندها', icon: 'Sparkles' },
  { id: 'ring', name: 'انگشترها', icon: 'Sparkle' },
  { id: 'earrings', name: 'گوشواره‌ها', icon: 'Gem' },
  { id: 'bracelet', name: 'دستبندها', icon: 'Layers' }
];

export const PROVINCES = [
  { name: 'تهران', cities: ['تهران', 'ری', 'تجریش', 'ورامین', 'اسلامشهر'] },
  { name: 'اصفهان', cities: ['اصفهان', 'کاشان', 'خمینی‌شهر', 'نجف‌آباد'] },
  { name: 'خراسان رضوی', cities: ['مشهد', 'سبزوار', 'نیشابور', 'تربت حیدریه'] },
  { name: 'فارس', cities: ['شیراز', 'مرودشت', 'جهرم', 'فسا'] },
  { name: 'آذربایجان شرقی', cities: ['تبریز', 'مراغه', 'مرند', 'میانه'] },
  { name: 'البرز', cities: ['کرج', 'فردیس', 'هشتگرد', 'نظرآباد'] },
  { name: 'مازندران', cities: ['ساری', 'بابل', 'آمل', 'قائم‌شهر', 'تنکابن'] },
  { name: 'گیلان', cities: ['رشت', 'بندر انزلی', 'لاهیجان', 'لنگرود'] },
  { name: 'یزد', cities: ['یزد', 'میبد', 'اردکان', 'بافق'] }
];
