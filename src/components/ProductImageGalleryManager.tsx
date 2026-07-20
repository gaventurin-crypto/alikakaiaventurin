import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Upload, 
  Trash2, 
  ArrowRight, 
  ArrowLeft, 
  Plus, 
  Image as ImageIcon, 
  Check, 
  Eye, 
  Info,
  Sliders,
  Sparkles,
  Zap,
  HardDrive,
  RefreshCw,
  Crop
} from 'lucide-react';
import Cropper from 'react-easy-crop';
import { Product } from '../types';

interface ProductImageGalleryManagerProps {
  product: Product;
  onSaveGallery: (productId: string, images: string[]) => Promise<void> | void;
  onClose: () => void;
}

interface GalleryItem {
  id: string;
  url: string; // Current active Base64 or URL
  originalUrl: string; // Backup of the original raw Base64/URL to allow re-compression
  fileName: string;
  originalSize: number; // in bytes
  currentSize: number; // in bytes
  width: number;
  height: number;
  quality: number; // 0.1 to 1.0 (compression quality setting)
  isExisting: boolean; // Is it an already-saved database image URL?
}

// Beautiful preset luxury jewelry images from Unsplash for testing
const PRESET_GALLERY_IMAGES = [
  {
    name: 'حلقه الماس رویال',
    url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&auto=format&fit=crop&q=60'
  },
  {
    name: 'گردنبند نقره زمرد',
    url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=60'
  },
  {
    name: 'گوشواره مروارید لوکس',
    url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&auto=format&fit=crop&q=60'
  },
  {
    name: 'باکس جواهرات کلاسیک',
    url: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=600&auto=format&fit=crop&q=60'
  },
  {
    name: 'ست زنجیر و آویز طلا',
    url: 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=600&auto=format&fit=crop&q=60'
  },
  {
    name: 'گوشواره‌های دست‌ساز نگین‌دار',
    url: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=600&auto=format&fit=crop&q=60'
  }
];

/**
 * Image compressor using standard HTML Canvas API.
 * Keeps aspect ratio and scales image within maxWidth/maxHeight bounds.
 * Supports optional center-cropping to a square (1:1).
 */
const compressImage = (
  dataUrl: string, 
  quality: number, 
  maxWidth = 1000, 
  maxHeight = 1000,
  cropToSquare = false
): Promise<{ url: string; size: number; width: number; height: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      let sourceX = 0;
      let sourceY = 0;
      let sourceWidth = width;
      let sourceHeight = height;

      if (cropToSquare) {
        const minDim = Math.min(width, height);
        sourceX = Math.round((width - minDim) / 2);
        sourceY = Math.round((height - minDim) / 2);
        sourceWidth = minDim;
        sourceHeight = minDim;
        width = minDim;
        height = minDim;
      }

      // Keep aspect ratio & bound inside maxWidth/maxHeight
      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        // High quality scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(
          img, 
          sourceX, 
          sourceY, 
          sourceWidth, 
          sourceHeight, 
          0, 
          0, 
          width, 
          height
        );
      }

      // Convert to compressed JPEG format
      const compressedUrl = canvas.toDataURL('image/jpeg', quality);
      
      // Calculate approximate byte size of the base64 string
      const stringLength = compressedUrl.length - 'data:image/jpeg;base64,'.length;
      const sizeInBytes = Math.round(stringLength * 0.75);

      resolve({
        url: compressedUrl,
        size: sizeInBytes,
        width,
        height
      });
    };
    img.onerror = () => {
      // Fallback in case loading fails
      resolve({ url: dataUrl, size: 0, width: 0, height: 0 });
    };
  });
};

/**
 * Crops an image using canvas given the pixel coordinates from react-easy-crop.
 */
const getCroppedImg = (
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    // Allow loading cross-origin images for cropping if the server permits
    image.crossOrigin = 'anonymous';
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to create canvas context'));
        return;
      }

      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;

      // High quality scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };
    image.onerror = (err) => reject(err);
  });
};

export const ProductImageGalleryManager: React.FC<ProductImageGalleryManagerProps> = ({
  product,
  onSaveGallery,
  onClose
}) => {
  // Initialize with product's existing images mapped to rich GalleryItems
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [inputUrl, setInputUrl] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Bulk upload progress state
  const [bulkProgress, setBulkProgress] = useState<{
    total: number;
    current: number;
    currentFileName: string;
    percentage: number;
  } | null>(null);

  const [autoCropSquare, setAutoCropSquare] = useState(true);

  // Active preview item in user preview section
  const [activePreviewIdx, setActivePreviewIdx] = useState(0);

  // Cropper states
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState<number>(1); // Default 1:1 for jewelry products
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isCroppingProgress, setIsCroppingProgress] = useState(false);

  // Load existing product images on mount
  useEffect(() => {
    const existing: GalleryItem[] = (product.images || []).map((url, idx) => ({
      id: `existing-${idx}`,
      url: url,
      originalUrl: url,
      fileName: `تصویر ذخیره شده ${idx + 1}`,
      originalSize: 0, // database image, original size unknown initially
      currentSize: 0,
      width: 0,
      height: 0,
      quality: 0.8,
      isExisting: true
    }));
    setGalleryItems(existing);
    
    // Asynchronously load dimensions & estimates for existing images
    existing.forEach((item) => {
      const img = new Image();
      img.src = item.url;
      img.onload = () => {
        setGalleryItems(prev => prev.map(p => {
          if (p.id === item.id) {
            return {
              ...p,
              width: img.width,
              height: img.height,
              // Approximate current size of online files if base64, or estimation
              currentSize: p.url.startsWith('data:') 
                ? Math.round((p.url.length - p.url.indexOf(',') - 1) * 0.75) 
                : 150000 // default 150KB estimate for direct server URLs
            };
          }
          return p;
        }));
      };
    });

    if (existing.length > 0) {
      setSelectedItemId(existing[0].id);
    }
  }, [product.images]);

  // Combined active array for the user visualizer
  const allImageUrls = [product.image, ...galleryItems.map(item => item.url)];

  // Process selected file uploads
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    processFiles(files);
  };

  const processFiles = async (files: FileList) => {
    const total = files.length;
    if (total === 0) return;

    for (let i = 0; i < total; i++) {
      const file = files[i];

      // Update progress state
      setBulkProgress({
        total,
        current: i + 1,
        currentFileName: file.name,
        percentage: Math.round((i / total) * 100),
      });

      if (!file.type.startsWith('image/')) {
        showStatus(`فایل "${file.name}" به دلیل قالب نامعتبر نادیده گرفته شد. فقط تصویر مجاز است.`, 'error');
        continue;
      }

      const reader = new FileReader();
      const loadPromise = new Promise<GalleryItem>((resolve, reject) => {
        reader.onload = async (event) => {
          if (event.target?.result) {
            const rawBase64 = event.target.result as string;
            
            try {
              // Initial compression with recommended quality 0.75 and optional cropToSquare
              const compressed = await compressImage(rawBase64, 0.75, 1200, 1200, autoCropSquare);
              
              resolve({
                id: Math.random().toString(36).substring(2, 9),
                url: compressed.url,
                originalUrl: rawBase64,
                fileName: file.name,
                originalSize: file.size,
                currentSize: compressed.size,
                width: compressed.width,
                height: compressed.height,
                quality: 0.75,
                isExisting: false
              });
            } catch (err) {
              reject(err);
            }
          } else {
            reject('خطا در خواندن فایل.');
          }
        };
        reader.onerror = () => reject('خطا در بارگذاری فایل.');
        reader.readAsDataURL(file);
      });

      try {
        const newItem = await loadPromise;
        setGalleryItems(prev => {
          const updated = [...prev, newItem];
          setSelectedItemId(newItem.id); // focus on newly added item
          return updated;
        });
      } catch (err) {
        console.error(err);
        showStatus(`خطا در پردازش تصویر "${file.name}".`, 'error');
      }
    }

    // Set final complete progress
    setBulkProgress(prev => prev ? { ...prev, percentage: 100 } : null);
    
    // Clear progress after a short delay
    setTimeout(() => {
      setBulkProgress(null);
    }, 1500);

    showStatus(`تعداد ${formatPersianNumber(total)} تصویر با موفقیت پردازش و به آلبوم اضافه شد.`, 'success');
  };

  // Drag and Drop handles
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  // Add Image via URL
  const handleAddUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = inputUrl.trim();
    if (!url) return;

    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
      showStatus('آدرس تصویر نامعتبر است. آدرس باید با http یا https یا اسلش / شروع شود.', 'error');
      return;
    }

    const isDuplicate = galleryItems.some(item => item.url === url);
    if (isDuplicate) {
      showStatus('این آدرس تصویر قبلاً در گالری وجود دارد.', 'error');
      return;
    }

    const newId = Math.random().toString(36).substring(2, 9);
    const newItem: GalleryItem = {
      id: newId,
      url: url,
      originalUrl: url,
      fileName: `تصویر درج شده با آدرس وب`,
      originalSize: 0,
      currentSize: 120000, // standard estimate
      width: 0,
      height: 0,
      quality: 0.8,
      isExisting: false
    };

    setGalleryItems(prev => [...prev, newItem]);
    setSelectedItemId(newId);
    setInputUrl('');
    showStatus('تصویر خارجی با موفقیت اضافه شد.', 'success');

    // Attempt to resolve dimensions
    const img = new Image();
    img.src = url;
    img.onload = () => {
      setGalleryItems(prev => prev.map(p => p.id === newId ? { ...p, width: img.width, height: img.height } : p));
    };
  };

  // Add Preset Jewelry Image
  const handleAddPreset = async (url: string) => {
    const isDuplicate = galleryItems.some(item => item.url === url);
    if (isDuplicate) {
      showStatus('این تصویر از قبل در گالری وجود دارد.', 'error');
      return;
    }

    const newId = Math.random().toString(36).substring(2, 9);
    const newItem: GalleryItem = {
      id: newId,
      url: url,
      originalUrl: url,
      fileName: 'نمونه زیورآلات پریست',
      originalSize: 220000, // Preset size approximation
      currentSize: 95000,
      width: 600,
      height: 600,
      quality: 0.75,
      isExisting: false
    };

    setGalleryItems(prev => [...prev, newItem]);
    setSelectedItemId(newId);
    showStatus('تصویر آماده با موفقیت به آلبوم اضافه شد.', 'success');
  };

  // Handle live changes to the compression slider
  const handleQualityChange = async (itemId: string, quality: number) => {
    // Find the item
    const item = galleryItems.find(p => p.id === itemId);
    if (!item) return;

    // Only compress local Base64 files, direct URLs can't be re-compressed in client-side canvas easily due to CORS
    if (!item.originalUrl.startsWith('data:')) {
      // Just update local quality value
      setGalleryItems(prev => prev.map(p => p.id === itemId ? { ...p, quality } : p));
      return;
    }

    // Run canvas compression on the original backup URL with the new quality value
    const compressed = await compressImage(item.originalUrl, quality, 1200, 1200);

    setGalleryItems(prev => prev.map(p => {
      if (p.id === itemId) {
        return {
          ...p,
          url: compressed.url,
          currentSize: compressed.size,
          width: compressed.width,
          height: compressed.height,
          quality: quality
        };
      }
      return p;
    }));
  };

  // Turn off cropping mode when switching items
  useEffect(() => {
    setIsCropping(false);
  }, [selectedItemId]);

  // Handle Crop Application
  const handleApplyCrop = async () => {
    if (!selectedItem) return;
    if (!croppedAreaPixels) {
      showStatus('لطفاً محدوده برش تصویر را مشخص کنید.', 'error');
      return;
    }

    setIsCroppingProgress(true);
    try {
      const sourceImage = selectedItem.originalUrl || selectedItem.url;
      // 1. Crop image
      const croppedBase64 = await getCroppedImg(sourceImage, croppedAreaPixels);

      // 2. Compress cropped image
      const compressed = await compressImage(croppedBase64, selectedItem.quality, selectedItem.width || 1200, selectedItem.height || 1200);

      // 3. Update item
      setGalleryItems(prev => prev.map(p => {
        if (p.id === selectedItemId) {
          return {
            ...p,
            url: compressed.url,
            currentSize: compressed.size,
            width: compressed.width,
            height: compressed.height
          };
        }
        return p;
      }));

      setIsCropping(false);
      showStatus('برش تصویر و هم‌ترازی با موفقیت اعمال شد.', 'success');
    } catch (err) {
      console.error(err);
      showStatus('خطا در برش تصویر. تصاویر خارجی به دلیل محدودیت مرورگر قابل برش نیستند.', 'error');
    } finally {
      setIsCroppingProgress(false);
    }
  };

  // Move gallery order
  const moveImage = (index: number, direction: 'prev' | 'next') => {
    if (direction === 'prev' && index === 0) return;
    if (direction === 'next' && index === galleryItems.length - 1) return;

    const newItems = [...galleryItems];
    const targetIdx = direction === 'prev' ? index - 1 : index + 1;
    
    const temp = newItems[index];
    newItems[index] = newItems[targetIdx];
    newItems[targetIdx] = temp;

    setGalleryItems(newItems);

    // Synchronize active user preview index if needed
    const prevIndexInAll = index + 1;
    const targetIndexInAll = targetIdx + 1;
    if (activePreviewIdx === prevIndexInAll) {
      setActivePreviewIdx(targetIndexInAll);
    } else if (activePreviewIdx === targetIndexInAll) {
      setActivePreviewIdx(prevIndexInAll);
    }
  };

  // Delete image
  const deleteImage = (itemId: string) => {
    const itemIndex = galleryItems.findIndex(p => p.id === itemId);
    if (itemIndex === -1) return;

    setGalleryItems(prev => prev.filter(p => p.id !== itemId));
    showStatus('تصویر از آلبوم موقت حذف شد.', 'success');

    if (selectedItemId === itemId) {
      const remaining = galleryItems.filter(p => p.id !== itemId);
      setSelectedItemId(remaining.length > 0 ? remaining[0].id : null);
    }

    // Adjust user preview slider index
    const deletedIndexInAll = itemIndex + 1;
    if (activePreviewIdx === deletedIndexInAll) {
      setActivePreviewIdx(0); // reset to main cover image
    } else if (activePreviewIdx > deletedIndexInAll) {
      setActivePreviewIdx(prev => prev - 1);
    }
  };

  // Save the complete gallery list back to database
  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const imageUrls = galleryItems.map(item => item.url);
      await onSaveGallery(product.id, imageUrls);
      showStatus('گالری تصاویر بهینه‌سازی شده با موفقیت ذخیره شد.', 'success');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      showStatus(err.message || 'خطا در ذخیره‌سازی اطلاعات گالری.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const showStatus = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => {
      setMessage(current => current?.text === text ? null : current);
    }, 4000);
  };

  // Helper calculations for selected item optimization report
  const selectedItem = galleryItems.find(p => p.id === selectedItemId);
  const sizeReducedBytes = selectedItem 
    ? (selectedItem.originalSize > 0 ? selectedItem.originalSize - selectedItem.currentSize : 0) 
    : 0;
  const reductionPercentage = selectedItem && selectedItem.originalSize > 0
    ? Math.round((sizeReducedBytes / selectedItem.originalSize) * 100)
    : 0;

  // Evaluate loading speed quality
  const getOptimizationGrade = (sizeInBytes: number) => {
    if (sizeInBytes === 0) return { label: 'نامشخص', color: 'text-slate-400 border-slate-800', bg: 'bg-slate-900', speed: 'بسیار سریع' };
    const sizeKb = sizeInBytes / 1024;
    if (sizeKb <= 120) {
      return { 
        label: 'فوق‌العاده و بهینه 🟢', 
        color: 'text-emerald-400 border-emerald-500/30', 
        bg: 'bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.05)]',
        speed: '۰.۱ ثانیه (فوری)' 
      };
    }
    if (sizeKb <= 250) {
      return { 
        label: 'خوب و مناسب وب 🟢', 
        color: 'text-teal-400 border-teal-500/20', 
        bg: 'bg-teal-500/5', 
        speed: '۰.۳ ثانیه (عالی)' 
      };
    }
    if (sizeKb <= 450) {
      return { 
        label: 'کمی سنگین 🟡', 
        color: 'text-amber-400 border-amber-500/20', 
        bg: 'bg-amber-500/5', 
        speed: '۰.۷ ثانیه (متوسط)' 
      };
    }
    return { 
      label: 'بسیار سنگین (بهینه‌سازی شود) 🔴', 
      color: 'text-rose-400 border-rose-500/20', 
      bg: 'bg-rose-500/5 pulse-border', 
      speed: 'بیش از ۲.۰ ثانیه (کند)' 
    };
  };

  const currentGrade = selectedItem ? getOptimizationGrade(selectedItem.currentSize) : null;

  return (
    <div id="gallery-manager-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
      <motion.div 
        id="gallery-manager-container"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-6xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col my-auto"
      >
        {/* HEADER */}
        <div id="gallery-manager-header" className="flex items-center justify-between border-b border-slate-800 p-5 sm:p-6 bg-slate-900/50">
          <div className="text-right">
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2.5 w-2.5 rounded-full bg-gold-400 animate-pulse" />
              <h2 className="text-sm font-black text-slate-100 sm:text-base flex items-center gap-2">
                <Sparkles size={18} className="text-gold-400" />
                <span>مدیریت و بهینه‌سازی آلبوم تصاویر محصولات</span>
              </h2>
            </div>
            <p className="text-[11px] text-slate-400">
              آپلود هوشمند، فشرده‌سازی خودکار و بازبینی خروجی نهایی برای <span className="text-gold-400 font-bold">{product.title}</span>
            </p>
          </div>

          <button 
            id="gallery-manager-close-btn"
            onClick={onClose}
            className="rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 transition-all cursor-pointer"
            title="بستن پنجره"
          >
            <X size={18} />
          </button>
        </div>

        {/* NOTIFICATIONS */}
        <AnimatePresence>
          {message && (
            <motion.div
              id="gallery-manager-status-bar"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={`px-6 py-3.5 text-xs font-bold text-center border-b ${
                message.type === 'success' 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}
            >
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAIN BODY WORKSPACE */}
        <div id="gallery-manager-workspace" className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-5 sm:p-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          
          {/* COLUMN 1: INTERACTIVE IMAGE LIST & UPLOADER (4 Cols) */}
          <div id="gallery-manager-left-panel" className="lg:col-span-4 space-y-4">
            <span className="block text-xs font-black text-slate-200 text-right">افزودن و ترتیب‌بندی تصاویر</span>
            
            {/* DRAG-DROP UPLOADER */}
            <div 
              id="gallery-drag-drop-zone"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-2xl p-5 transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                isDragOver 
                  ? 'border-gold-500 bg-gold-500/5' 
                  : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
              }`}
            >
              <input 
                id="gallery-file-input"
                type="file" 
                multiple 
                accept="image/*" 
                onChange={handleFileUpload} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={bulkProgress !== null}
              />
              {bulkProgress ? (
                <div className="w-full space-y-2.5 text-center">
                  <div className="mx-auto bg-gold-500/10 text-gold-400 border border-gold-500/20 rounded-full h-8 w-8 flex items-center justify-center animate-spin">
                    <RefreshCw size={14} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-200">در حال پردازش تصاویر...</p>
                    <p className="text-[9px] text-slate-400 font-en-nums">
                      پردازش تصویر {formatPersianNumber(bulkProgress.current)} از {formatPersianNumber(bulkProgress.total)}
                    </p>
                    <p className="text-[8px] text-gold-400 truncate max-w-full px-4 font-mono">
                      {bulkProgress.currentFileName}
                    </p>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-950 rounded-full h-1 overflow-hidden mt-1">
                    <div 
                      className="bg-gold-500 h-full transition-all duration-300"
                      style={{ width: `${bulkProgress.percentage}%` }}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-slate-900 border border-slate-800 rounded-full p-2.5 mb-2 text-gold-400">
                    <Upload size={18} />
                  </div>
                  <span className="text-[11px] font-bold text-slate-200 block mb-0.5">آپلود و فشرده‌سازی خودکار</span>
                  <span className="text-[9px] text-slate-500 block">فایل را بکشید یا برای انتخاب کلیک کنید</span>
                </>
              )}
            </div>

            {/* AUTO-CROP SQUARE OPTION FOR BULK UPLOAD */}
            <div id="gallery-auto-crop-toggle" className="flex items-center justify-between bg-slate-950/40 border border-slate-850 rounded-2xl p-3 text-right">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => setAutoCropSquare(!autoCropSquare)}>
                <div className={`w-8 h-4.5 rounded-full p-0.5 transition-all duration-200 ${autoCropSquare ? 'bg-gold-500' : 'bg-slate-800'}`}>
                  <div className={`bg-slate-900 w-3.5 h-3.5 rounded-full shadow-md transition-all duration-200 ${autoCropSquare ? 'translate-x-3.5' : 'translate-x-0'}`} />
                </div>
                <span className="text-[10px] text-slate-400 font-bold select-none cursor-pointer">برش خودکار ۱:۱ (مربع)</span>
              </div>
              <span className="text-[9px] font-black text-slate-400">تنظیمات کادربندی آپلود</span>
            </div>

            {/* QUICK ACTIONS FOR TESTING (PRESETS) */}
            <div id="gallery-presets-section" className="bg-slate-950/30 border border-slate-850 rounded-2xl p-3.5 space-y-2">
              <span className="block text-[10px] font-black text-slate-400 text-right">درج سریع نمونه‌های آتلیه‌ای زیورآلات</span>
              <div className="grid grid-cols-2 gap-1.5">
                {PRESET_GALLERY_IMAGES.slice(0, 4).map((preset, idx) => (
                  <button
                    id={`gallery-preset-btn-${idx}`}
                    key={idx}
                    type="button"
                    onClick={() => handleAddPreset(preset.url)}
                    className="flex items-center gap-1.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 rounded-xl p-1.5 text-right transition-all group cursor-pointer text-slate-300"
                  >
                    <img src={preset.url} className="h-6 w-6 rounded object-cover border border-slate-800" referrerPolicy="no-referrer" />
                    <span className="text-[8px] font-bold truncate flex-1">{preset.name}</span>
                    <Plus size={8} className="text-slate-500 group-hover:text-gold-400" />
                  </button>
                ))}
              </div>
            </div>

            {/* IMAGES THUMBNAILS LIST */}
            <div id="gallery-list-section" className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] text-slate-500 font-bold font-en-nums">آلبوم: {formatPersianNumber(galleryItems.length)} تصویر فرعی</span>
                <span className="text-[10px] font-black text-slate-400">ترتیب و انتخاب</span>
              </div>

              {galleryItems.length === 0 ? (
                <div id="gallery-empty-state" className="flex flex-col items-center justify-center p-8 bg-slate-950/20 border border-slate-850 rounded-2xl text-center">
                  <ImageIcon size={24} className="text-slate-700 mb-2" />
                  <p className="text-[11px] text-slate-400">تصویری به آلبوم اضافه نشده است.</p>
                </div>
              ) : (
                <div id="gallery-thumbnails-vertical" className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                  {galleryItems.map((item, idx) => {
                    const isSelected = selectedItemId === item.id;
                    const sizeKb = Math.round(item.currentSize / 1024);
                    return (
                      <motion.div
                        id={`gallery-thumb-card-${item.id}`}
                        key={item.id}
                        layoutId={`item-${item.id}`}
                        className={`p-2 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-slate-800/40 border-gold-500/50 shadow-md shadow-gold-500/5' 
                            : 'bg-slate-950/40 border-slate-850 hover:border-slate-800'
                        }`}
                        onClick={() => setSelectedItemId(item.id)}
                      >
                        {/* Number Indicator / Order Badge */}
                        <div className="bg-slate-900 border border-slate-800 text-[9px] font-bold rounded-md h-5 w-5 flex items-center justify-center text-slate-400 font-en-nums">
                          {idx + 1}
                        </div>

                        {/* Thumbnail */}
                        <img 
                          src={item.url} 
                          className="h-11 w-11 rounded-lg object-cover bg-slate-900 border border-slate-850 flex-shrink-0" 
                          referrerPolicy="no-referrer"
                        />

                        {/* Info details */}
                        <div className="flex-1 min-w-0 text-right">
                          <p className="text-[10px] font-bold text-slate-200 truncate">{item.fileName}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 font-en-nums">
                            {sizeKb > 0 ? (
                              <span className="text-[9px] text-slate-400 bg-slate-900 border border-slate-800 px-1 py-0.25 rounded font-mono">
                                {formatPersianNumber(sizeKb)} KB
                              </span>
                            ) : (
                              <span className="text-[9px] text-slate-500">آنالیز نشده</span>
                            )}
                            {item.originalSize > 0 && item.originalSize !== item.currentSize && (
                              <span className="text-[8px] text-emerald-400 bg-emerald-950/20 px-1 rounded">
                                %{formatPersianNumber(Math.round(((item.originalSize - item.currentSize) / item.originalSize) * 100))}-
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Order Controls & Delete Button */}
                        <div className="flex flex-col gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                          <div className="flex gap-1">
                            <button
                              id={`gallery-move-up-${idx}`}
                              type="button"
                              onClick={() => moveImage(idx, 'prev')}
                              disabled={idx === 0}
                              className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-20 cursor-pointer"
                              title="انتقال به قبل"
                            >
                              <ArrowRight size={10} className="rotate-90 sm:rotate-0" />
                            </button>
                            <button
                              id={`gallery-move-down-${idx}`}
                              type="button"
                              onClick={() => moveImage(idx, 'next')}
                              disabled={idx === galleryItems.length - 1}
                              className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-20 cursor-pointer"
                              title="انتقال به بعد"
                            >
                              <ArrowLeft size={10} className="rotate-90 sm:rotate-0" />
                            </button>
                          </div>
                          <button
                            id={`gallery-item-del-${item.id}`}
                            type="button"
                            onClick={() => deleteImage(item.id)}
                            className="p-1 rounded bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/20 text-rose-400 transition-all text-center flex items-center justify-center cursor-pointer"
                            title="حذف از آلبوم"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* INPUT URL */}
            <form id="gallery-url-form" onSubmit={handleAddUrl} className="bg-slate-950/20 border border-slate-850 rounded-2xl p-3 space-y-2">
              <label className="block text-[9px] font-black text-slate-400 text-right">افزودن تصویر با آدرس اینترنتی (URL)</label>
              <div className="flex gap-1.5">
                <input 
                  id="gallery-url-input"
                  type="text"
                  placeholder="https://example.com/ring.jpg"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-100 outline-none text-left font-mono"
                />
                <button 
                  id="gallery-url-submit"
                  type="submit" 
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-gold-400 rounded-lg px-3 py-1 text-[10px] font-bold transition-all cursor-pointer"
                >
                  افزودن
                </button>
              </div>
            </form>

          </div>

          {/* COLUMN 2: OPTIMIZER UTILITY (5 Cols) */}
          <div id="gallery-manager-mid-panel" className="lg:col-span-5 bg-slate-950/20 border border-slate-850 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-850 pb-2 mb-4">
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Sliders size={12} className="text-gold-400" />
                  <span>پنل آنالیز و بهینه‌سازی تصاویر (زنده)</span>
                </span>
                <h4 className="text-xs font-black text-slate-300">امکانات فشرده‌ساز</h4>
              </div>

              {selectedItem ? (
                isCropping ? (
                  <div id="cropping-control-panel" className="space-y-4 text-right">
                    <div className="relative w-full h-64 bg-slate-950 rounded-xl overflow-hidden border border-slate-850">
                      <Cropper
                        image={selectedItem.originalUrl || selectedItem.url}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspect}
                        onCropChange={setCrop}
                        onCropComplete={(_, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)}
                        onZoomChange={setZoom}
                      />
                    </div>

                    {/* Aspect Ratio Selector */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-400">تنظیم نسبت ابعاد تصویر (تراز بندی)</label>
                      <div className="grid grid-cols-4 gap-1.5 font-en-nums">
                        {[
                          { label: '۱:۱ (مربع)', val: 1 },
                          { label: '۴:۳ (کلاسیک)', val: 4 / 3 },
                          { label: '۳:۲ (عکاسی)', val: 3 / 2 },
                          { label: '۱۶:۹ (عریز)', val: 16 / 9 },
                        ].map((item) => (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => setAspect(item.val)}
                            className={`px-1 py-1.5 rounded-lg text-[9px] font-bold transition-all cursor-pointer text-center ${
                              aspect === item.val
                                ? 'bg-gold-500 text-slate-950 shadow-md shadow-gold-500/10'
                                : 'bg-slate-900 hover:bg-slate-800 border border-slate-850 text-slate-300'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Zoom Slider */}
                    <div className="space-y-1.5 bg-slate-900 border border-slate-850 rounded-xl p-3">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-gold-400 font-mono font-bold font-en-nums">{formatPersianNumber(zoom.toFixed(1))}x</span>
                        <span className="text-slate-300 font-bold">بزرگ‌نمایی</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="3"
                        step="0.1"
                        value={zoom}
                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                        className="w-full accent-gold-500 h-1 bg-slate-950 rounded cursor-pointer"
                      />
                    </div>

                    {/* Action buttons inside cropping mode */}
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleApplyCrop}
                        disabled={isCroppingProgress}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/30 text-slate-950 font-black py-2.5 px-3 rounded-xl text-[10px] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {isCroppingProgress ? (
                          <>
                            <RefreshCw size={12} className="animate-spin" />
                            <span>در حال اعمال برش...</span>
                          </>
                        ) : (
                          <>
                            <Check size={12} />
                            <span>برش و ذخیره موقت</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsCropping(false)}
                        className="bg-slate-900 hover:bg-slate-850 border border-slate-850 text-slate-400 py-2.5 px-4 rounded-xl text-[10px] transition-all cursor-pointer"
                      >
                        انصراف
                      </button>
                    </div>
                  </div>
                ) : (
                  <div id="optimization-control-panel" className="space-y-4">
                    
                    {/* Visual Preview of Item Being Optimized */}
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-850 flex items-center justify-center group">
                      <img 
                        src={selectedItem.url} 
                        className="h-full w-full object-contain bg-slate-950/80" 
                        referrerPolicy="no-referrer"
                        alt="Compressing preview"
                      />

                      {/* Crop Button Overlay on Hover */}
                      <div className="absolute inset-0 bg-slate-950/75 opacity-0 group-hover:opacity-100 transition-all duration-250 flex flex-col items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setCrop({ x: 0, y: 0 });
                            setZoom(1);
                            setIsCropping(true);
                          }}
                          className="bg-gold-500 hover:bg-gold-400 text-slate-950 p-3.5 rounded-full shadow-xl hover:scale-110 transition-all flex items-center justify-center cursor-pointer"
                          title="شروع برش و تراز بندی ابعاد"
                        >
                          <Crop size={20} />
                        </button>
                        <span className="text-[10px] font-black text-gold-400">برش تصویر و کادربندی ابعاد</span>
                      </div>
                      
                      {/* Size Overlay badge */}
                      <div className="absolute bottom-2 right-2 bg-slate-900/90 border border-slate-800 rounded-lg px-2 py-1 text-[9px] text-slate-200 font-mono font-en-nums">
                        {selectedItem.width > 0 && `${formatPersianNumber(selectedItem.width)} × ${formatPersianNumber(selectedItem.height)} px`}
                      </div>

                      {/* Source Indicator Badge */}
                      <span className="absolute top-2 left-2 bg-slate-900/90 border border-slate-800 text-slate-400 rounded-lg px-2 py-0.5 text-[8px] font-bold">
                        {selectedItem.url.startsWith('data:') ? 'فایل محلی آپلود شده' : 'آدرس اینترنتی خارجی'}
                      </span>
                    </div>

                    {/* Inline action button for direct crop visibility */}
                    <button
                      type="button"
                      onClick={() => {
                        setCrop({ x: 0, y: 0 });
                        setZoom(1);
                        setIsCropping(true);
                      }}
                      className="w-full py-2.5 px-3 border border-dashed border-gold-500/30 hover:border-gold-500/50 bg-gold-500/5 hover:bg-gold-500/10 rounded-xl text-[10px] font-black text-gold-400 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Crop size={14} />
                      <span>ابزار برش و هم‌ترازی ابعاد تصویر (Crop Tool)</span>
                    </button>

                  {/* QUALITY SLIDER CONTROL */}
                  <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gold-400 font-black font-en-nums bg-gold-400/10 px-1.5 py-0.5 rounded">
                        {formatPersianNumber(Math.round(selectedItem.quality * 100))}% کیفیت
                      </span>
                      <span className="text-xs font-bold text-slate-300">میزان تراکم و بهینه‌سازی</span>
                    </div>

                    <input 
                      id="compression-quality-slider"
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={selectedItem.quality}
                      onChange={(e) => handleQualityChange(selectedItem.id, parseFloat(e.target.value))}
                      disabled={!selectedItem.url.startsWith('data:')}
                      className="w-full accent-gold-500 h-1.5 bg-slate-950 rounded-lg cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    />

                    {!selectedItem.url.startsWith('data:') && (
                      <p className="text-[8px] text-slate-500 text-right leading-relaxed font-bold">
                        ⚠️ بهینه‌سازی زنده فقط برای تصاویر آپلودی محلی فعال است. تصاویر خارجی مستقیماً آدرس‌دهی می‌شوند.
                      </p>
                    )}
                  </div>

                  {/* DETAILED DIAGNOSTICS & OPTIMIZATION REPORT */}
                  <div className="space-y-2.5">
                    <span className="block text-[10px] font-black text-slate-400 text-right">چک‌لیست بهینه‌سازی موتور جستجو (SEO Check)</span>
                    
                    {/* Grade status card */}
                    {currentGrade && (
                      <div className={`border rounded-2xl p-3 text-right transition-all flex items-center justify-between ${currentGrade.color} ${currentGrade.bg}`}>
                        <div className="font-en-nums text-[9px] text-slate-400 text-left">
                          <p>سرعت لود تقریبی:</p>
                          <p className="font-bold text-slate-100 mt-0.5">{currentGrade.speed}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-400">وضعیت و حجم تصویر:</p>
                          <p className="text-xs font-black mt-0.5">{currentGrade.label}</p>
                        </div>
                      </div>
                    )}

                    {/* Metric Stats Rows */}
                    <div className="grid grid-cols-2 gap-2 font-en-nums">
                      
                      <div className="bg-slate-900 border border-slate-850 rounded-xl p-2.5 text-right flex items-center gap-2">
                        <div className="text-gold-400"><HardDrive size={14} /></div>
                        <div>
                          <span className="block text-[8px] text-slate-500">حجم ذخیره‌سازی کنونی</span>
                          <span className="text-[10px] font-bold text-slate-200">
                            {selectedItem.currentSize > 0 
                              ? `${formatPersianNumber(Math.round(selectedItem.currentSize / 1024))} KB` 
                              : 'محاسبه نشده'}
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-900 border border-slate-850 rounded-xl p-2.5 text-right flex items-center gap-2">
                        <div className="text-emerald-400"><Zap size={14} /></div>
                        <div>
                          <span className="block text-[8px] text-slate-500">کاهش حجم فایل (Saving)</span>
                          <span className="text-[10px] font-bold text-emerald-400">
                            {selectedItem.originalSize > 0 && reductionPercentage > 0 
                              ? `٪${formatPersianNumber(reductionPercentage)} کاهش حجم` 
                              : 'فاقد فشرده‌سازی'}
                          </span>
                        </div>
                      </div>

                    </div>

                    {/* Original vs Compressed Size comparative progress bar */}
                    {selectedItem.originalSize > 0 && selectedItem.originalSize > selectedItem.currentSize && (
                      <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 space-y-1.5 font-en-nums">
                        <div className="flex justify-between text-[8px] text-slate-500">
                          <span>خروجی نهایی: {formatPersianNumber(Math.round(selectedItem.currentSize / 1024))} KB</span>
                          <span>حجم اولیه: {formatPersianNumber(Math.round(selectedItem.originalSize / 1024))} KB</span>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden flex flex-row-reverse">
                          <div 
                            className="bg-emerald-500 h-full" 
                            style={{ width: `${100 - reductionPercentage}%` }} 
                          />
                          <div 
                            className="bg-slate-750 h-full" 
                            style={{ width: `${reductionPercentage}%` }} 
                          />
                        </div>
                        <p className="text-[8px] text-slate-400 text-center font-bold">
                          🎉 بهینه‌سازی عالی! حجم به میزان {formatPersianNumber(Math.round((selectedItem.originalSize - selectedItem.currentSize) / 1024))} KB کمتر شد.
                        </p>
                      </div>
                    )}

                  </div>

                </div>
              )
              ) : (
                <div id="optimization-no-selected" className="flex flex-col items-center justify-center p-12 text-center text-slate-500 h-64 border border-dashed border-slate-850 rounded-2xl">
                  <Sliders size={28} className="mb-2 text-slate-600" />
                  <p className="text-xs">یک تصویر را از لیست سمت راست انتخاب کنید تا تنظیمات بهینه‌سازی و عیارسنجی حجم آن فعال شود.</p>
                </div>
              )}
            </div>

            {/* SYSTEM INFOGRAPHICS IN BOTTOM OF CONTROL */}
            <div className="bg-slate-950/60 rounded-xl p-3 text-right text-[9px] text-slate-400 space-y-1 mt-4">
              <div className="flex gap-1 items-start text-gold-400 font-bold mb-1">
                <Info size={11} className="mt-0.5 flex-shrink-0" />
                <span>استاندارد گالری زیورآلات لوکس:</span>
              </div>
              <p>• ابعاد استاندارد پیشنهادی: ۱۰۰۰ در ۱۰۰۰ پیکسل عکاسی مربع است.</p>
              <p>• فشرده‌سازی با الگوریتم Canvas کیفیت ذرات درخشان فلزات طلا و الماس را کاملاً حفظ می‌کند.</p>
            </div>
          </div>

          {/* COLUMN 3: LIVE CUSTOMER DETAIL PAGE PREVIEW (3 Cols) */}
          <div id="gallery-manager-right-panel" className="lg:col-span-3 bg-slate-950/40 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-850 pb-2 mb-3">
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Eye size={12} className="text-gold-400" />
                  <span>نمایش نهایی در موبایل خریدار</span>
                </span>
                <h4 className="text-[10px] font-black text-slate-400">پیش‌نمایش آنلاین</h4>
              </div>

              {/* PHONE FRAME MOCKUP */}
              <div id="gallery-phone-mockup" className="bg-slate-900 border border-slate-800 rounded-3xl p-3 shadow-inner relative space-y-3 max-w-[240px] mx-auto">
                
                {/* Speaker grill & camera notch */}
                <div className="w-20 h-3.5 bg-slate-950 rounded-full mx-auto flex items-center justify-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-850" />
                  <div className="w-8 h-0.5 bg-slate-850 rounded-full" />
                </div>

                {/* Simulated product photo slider area */}
                <div id="gallery-preview-cover-panel" className="relative aspect-square rounded-xl overflow-hidden bg-slate-950 border border-slate-850">
                  <img 
                    src={allImageUrls[activePreviewIdx] || product.image} 
                    className="h-full w-full object-cover transition-all duration-300" 
                    referrerPolicy="no-referrer"
                    alt="eCommerce visual mockup"
                  />

                  {/* Sticker details */}
                  {activePreviewIdx === 0 && (
                    <span className="absolute top-2 right-2 rounded bg-gold-400 text-slate-950 px-1.5 py-0.25 text-[6px] font-black shadow-sm">
                      کاور اصلی
                    </span>
                  )}
                  {activePreviewIdx > 0 && (
                    <span className="absolute top-2 right-2 rounded bg-slate-950/80 border border-slate-800 text-slate-300 px-1.5 py-0.25 text-[6px] font-bold">
                      عکس {formatPersianNumber(activePreviewIdx)}
                    </span>
                  )}
                </div>

                {/* Micro Thumbnail slider below */}
                <div id="gallery-preview-thumbs-row" className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none justify-center">
                  {allImageUrls.map((img, idx) => {
                    const isActive = activePreviewIdx === idx;
                    return (
                      <button
                        id={`gallery-preview-thumb-btn-${idx}`}
                        key={idx}
                        type="button"
                        onClick={() => setActivePreviewIdx(idx)}
                        className={`h-7 w-7 rounded overflow-hidden border bg-slate-950 transition-all flex-shrink-0 relative ${
                          isActive 
                            ? 'border-gold-500 scale-105' 
                            : 'border-slate-800 opacity-60'
                        }`}
                      >
                        <img src={img} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      </button>
                    );
                  })}
                </div>

                {/* Under the visual detail summary mockup */}
                <div className="space-y-1 text-right pt-1.5 border-t border-slate-850 font-en-nums">
                  <p className="text-[10px] font-black text-slate-100 truncate">{product.title}</p>
                  <div className="flex justify-between items-center text-[9px]">
                    <span className="text-gold-400 font-bold">{formatPersianNumber(product.price.toLocaleString())} تومان</span>
                    <span className="text-slate-500">امتیاز {formatPersianNumber(product.rating)} ⭐</span>
                  </div>
                </div>

              </div>
            </div>

            {/* RE-COMPRESS ALL BUTTON FOR INSTANT BULK CONVERSION */}
            <div className="pt-4 border-t border-slate-850 mt-4">
              <p className="text-[8px] text-slate-500 text-right leading-relaxed mb-2">
                فشرده‌ساز تصاویر گالری با فشرده‌سازی اطلاعات در مرورگر، حجم درخواست‌های دیتابیس را بهینه کرده و سرعت بارگذاری نهایی فروشگاه شما را افزایش می‌دهد.
              </p>
            </div>
          </div>

        </div>

        {/* BOTTOM SAVE/CANCEL ACTIONS */}
        <div id="gallery-manager-footer" className="bg-slate-950/40 border-t border-slate-800 px-6 py-4 flex flex-row-reverse gap-3">
          <button
            id="gallery-manager-save-btn"
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 sm:flex-none rounded-xl bg-gold-500 hover:bg-gold-400 disabled:bg-gold-500/40 text-slate-950 font-black px-8 py-3 text-xs cursor-pointer transition-all flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>در حال اعمال بهینه‌سازی دیتابیس...</span>
              </>
            ) : (
              <>
                <Check size={14} />
                <span>ذخیره گالری بهینه‌سازی شده</span>
              </>
            )}
          </button>

          <button
            id="gallery-manager-cancel-btn"
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 sm:flex-none rounded-xl border border-slate-850 hover:bg-slate-800 text-slate-400 px-6 py-3 text-xs cursor-pointer transition-all"
          >
            انصراف
          </button>
        </div>

      </motion.div>
    </div>
  );
};

// Simple helper to convert English digits to Persian
function formatPersianNumber(n: number | string): string {
  const numStr = n.toString();
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return numStr.replace(/[0-9]/g, (w) => farsiDigits[parseInt(w)]);
}
