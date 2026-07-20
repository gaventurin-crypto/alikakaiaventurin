import React from 'react';
import { ShoppingCart, Star, Eye } from 'lucide-react';
import { motion } from 'motion/react';
import { Product } from '../types';

interface ProductCardProps {
  key?: string;
  product: Product;
  onAddToCart: (product: Product, variant: string) => void;
  onQuickView: (product: Product) => void;
  categories?: Array<{ id: string; name: string }>;
}

// Helper to convert numbers to Persian locales
export function formatPersianPrice(num: number): string {
  const formatted = new Intl.NumberFormat('fa-IR').format(num);
  return `${formatted} تومان`;
}

export function formatPersianNumber(num: number | string): string {
  return new Intl.NumberFormat('fa-IR').format(Number(num));
}

export default function ProductCard({ product, onAddToCart, onQuickView, categories = [] }: ProductCardProps) {
  const hasDiscount = product.discount && product.discount > 0;
  const discountedPrice = hasDiscount
    ? product.price * (1 - (product.discount || 0) / 100)
    : product.price;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ type: 'spring', damping: 20, stiffness: 100 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-sm transition-all duration-300 hover:border-gold-500/50 hover:shadow-lg hover:shadow-gold-500/5"
      id={`product-card-${product.id}`}
    >
      {/* Badges container */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
        {hasDiscount && (
          <span className="rounded-full bg-rose-500 px-2.5 py-1 text-[11px] font-extrabold text-white shadow-sm">
            {formatPersianNumber(product.discount || 0)}٪ تخفیف
          </span>
        )}
        {product.stock <= 3 && product.stock > 0 && (
          <span className="rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-bold text-slate-950 shadow-sm">
            فقط {formatPersianNumber(product.stock)} عدد باقی مانده
          </span>
        )}
        {product.stock === 0 && (
          <span className="rounded-full bg-slate-700 px-2.5 py-1 text-[10px] font-bold text-slate-300 shadow-sm">
            ناموجود
          </span>
        )}
      </div>

      {/* Image container */}
      <div className="relative aspect-square overflow-hidden bg-slate-950">
        <img
          src={product.image}
          alt={product.title}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        
        {/* Hover action overlay */}
        <div className="absolute inset-0 bg-slate-950/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-center justify-center gap-3">
          <button
            onClick={() => onQuickView(product)}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 text-slate-100 shadow-md transition-transform duration-300 hover:scale-110 hover:bg-gold-500 hover:text-slate-950"
            title="مشاهده جزئیات"
            id={`btn-quick-view-${product.id}`}
          >
            <Eye size={20} />
          </button>
          
          {product.stock > 0 && (
            <button
              onClick={() => onAddToCart(product, product.variants?.[0] || 'طلایی')}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-500 text-slate-950 shadow-md transition-transform duration-300 hover:scale-110 hover:bg-gold-400"
              title="افزودن سریع به سبد خرید"
              id={`btn-quick-add-${product.id}`}
            >
              <ShoppingCart size={20} className="stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>

      {/* Info Content */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Category & Rating */}
        <div className="flex items-center justify-between gap-1 text-xs text-slate-400 mb-1.5">
          <span className="font-medium text-gold-400">
            {categories.find((c) => c.id === product.category)?.name || 
             (product.category === 'necklace' ? 'گردنبند' :
              product.category === 'ring' ? 'انگشتر' :
              product.category === 'earrings' ? 'گوشواره' :
              product.category === 'bracelet' ? 'دستبند' : product.category)}
          </span>
          <div className="flex items-center gap-0.5 text-amber-400">
            <Star size={13} className="fill-amber-400" />
            <span className="font-semibold font-en-nums">{formatPersianNumber(product.rating || 5)}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="line-clamp-2 text-sm font-semibold text-slate-100 group-hover:text-gold-400 transition-colors duration-200 h-10 mb-3 leading-relaxed">
          {product.title}
        </h3>

        {/* Variations capsules preview */}
        <div className="flex flex-wrap gap-1 mb-4 h-5 overflow-hidden">
          {(product.variants || []).map((v, idx) => (
            <span
              key={idx}
              className="rounded bg-slate-800 px-2 py-0.5 text-[9px] text-slate-400 border border-slate-700/60"
            >
              {v}
            </span>
          ))}
        </div>

        {/* Pricing & Add to Cart button */}
        <div className="mt-auto pt-3 border-t border-slate-800 flex items-center justify-between">
          <div className="flex flex-col">
            {hasDiscount && (
              <span className="text-slate-500 line-through text-xs font-en-nums">
                {formatPersianPrice(product.price)}
              </span>
            )}
            <span className="text-sm font-extrabold text-slate-100 font-en-nums">
              {formatPersianPrice(discountedPrice)}
            </span>
          </div>

          <button
            onClick={() => onQuickView(product)}
            className="rounded-xl border border-gold-500/20 bg-gold-500/10 px-3.5 py-1.5 text-xs font-bold text-gold-400 hover:bg-gold-500 hover:text-slate-950 hover:border-gold-500 transition-all duration-300"
            id={`btn-view-${product.id}`}
          >
            خرید و انتخاب
          </button>
        </div>
      </div>
    </motion.div>
  );
}
