import React, { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw, Smartphone, CreditCard, Lock, ArrowRight, CheckCircle2, XCircle, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatPersianPrice, formatPersianNumber } from './ProductCard';

interface PaymentGatewayProps {
  amount: number;
  merchantName: string;
  onPaymentSuccess: () => void;
  onPaymentCancel: () => void;
}

export default function PaymentGateway({
  amount,
  merchantName,
  onPaymentSuccess,
  onPaymentCancel,
}: PaymentGatewayProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [cvv2, setCvv2] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(120);
  const [errorMsg, setErrorMsg] = useState('');
  const [successInfoMsg, setSuccessInfoMsg] = useState('');

  // Receipt screens
  const [paymentResult, setPaymentResult] = useState<'success' | 'failed' | null>(null);
  const [receiptTracking, setReceiptTracking] = useState('');

  // Generate a random captcha code on load
  const generateCaptcha = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setCaptchaCode(code);
    setCaptchaInput('');
    setErrorMsg('');
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  // Timer logic for simulated OTP SMS token
  useEffect(() => {
    let timerId: NodeJS.Timeout;
    if (isOtpSent && otpTimer > 0) {
      timerId = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
    } else if (otpTimer === 0) {
      setIsOtpSent(false);
      setOtpTimer(120);
      setSuccessInfoMsg('');
    }
    return () => clearTimeout(timerId);
  }, [isOtpSent, otpTimer]);

  const handleSendOtp = () => {
    setErrorMsg('');
    setIsOtpSent(true);
    setOtpTimer(120);
    setSuccessInfoMsg('رمز دوم یکبار مصرف (OTP) شبیه‌سازی و ارسال شد: ۱۲۳۴۵');
  };

  // Auto space card number every 4 digits
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    const input = e.target.value.replace(/\D/g, '');
    const truncated = input.slice(0, 16);
    const formatted = truncated.replace(/(\d{4})(?=\d)/g, '$1-');
    setCardNumber(formatted);
  };

  // Helper to detect Iranian bank name based on card prefix
  const getBankDetails = (num: string) => {
    const cleanNum = num.replace(/-/g, '');
    if (cleanNum.startsWith('603799')) return { name: 'بانک ملی ایران', color: 'from-blue-700 to-blue-900 text-white' };
    if (cleanNum.startsWith('610433')) return { name: 'بانک ملت', color: 'from-rose-600 to-rose-850 text-white' };
    if (cleanNum.startsWith('621986')) return { name: 'بانک سامان', color: 'from-cyan-600 to-cyan-800 text-white' };
    if (cleanNum.startsWith('627412') || cleanNum.startsWith('502229')) return { name: 'بانک پاسارگاد', color: 'from-amber-600 to-amber-800 text-slate-950 font-bold' };
    if (cleanNum.startsWith('589210')) return { name: 'بانک سپه', color: 'from-emerald-700 to-emerald-900 text-white' };
    if (cleanNum.startsWith('622106')) return { name: 'بانک پارسیان', color: 'from-indigo-600 to-indigo-900 text-white' };
    return { name: 'کارت عضو شتاب', color: 'from-slate-800 to-slate-900 text-slate-100' };
  };

  const bank = getBankDetails(cardNumber);

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessInfoMsg('');
    
    const cleanCard = cardNumber.replace(/-/g, '');
    
    if (cleanCard.length < 16) {
      setErrorMsg('شماره کارت باید ۱۶ رقمی باشد.');
      return;
    }
    if (cvv2.length < 3) {
      setErrorMsg('کد CVV2 نامعتبر است (باید ۳ یا ۴ رقم باشد).');
      return;
    }
    if (!expMonth || !expYear) {
      setErrorMsg('تاریخ انقضای کارت را مشخص نمایید.');
      return;
    }
    if (captchaInput !== captchaCode) {
      setErrorMsg('کد امنیتی کپچا اشتباه وارد شده است.');
      generateCaptcha();
      return;
    }
    if (!isOtpSent) {
      setErrorMsg('لطفاً ابتدا دکمه درخواست رمز پویا را کلیک کنید.');
      return;
    }
    if (otpInput !== '12345') {
      setErrorMsg('رمز دوم یکبار مصرف اشتباه است. (راهنما: رمز شبیه‌سازی شده ۱۲۳۴۵ است)');
      return;
    }

    // Success Simulation
    const tracking = 'TR-' + Math.floor(10000000 + Math.random() * 90000000).toString();
    setReceiptTracking(tracking);
    setPaymentResult('success');
  };

  const handleFinalizeSuccess = () => {
    onPaymentSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950 flex flex-col justify-between text-slate-100 font-sans" dir="rtl" id="shaparak-gateway">
      
      {/* SHAPARAK BANKING HEADER */}
      <div className="bg-slate-900 text-slate-100 py-4 shadow-lg border-b border-slate-800">
        <div className="mx-auto max-w-4xl px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-600 text-slate-950 font-black font-serif shadow-lg">
              ش
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold tracking-tight">درگاه پرداخت الکترونیکی شاپرک</h2>
              <p className="text-[10px] text-slate-400">شبکه الکترونیکی پرداخت کارت بانک مرکزی جمهوری اسلامی ایران</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold bg-slate-950 rounded-lg px-3.5 py-2 border border-slate-800">
            <ShieldCheck className="text-emerald-400 animate-pulse" size={16} />
            <span className="text-slate-300">اتصال امن و رمزنگاری‌شده (SSL)</span>
          </div>
        </div>
      </div>

      {/* GATEWAY CENTRAL FORM */}
      <div className="mx-auto my-8 w-full max-w-3xl px-4 flex-1 flex flex-col justify-center">
        
        <AnimatePresence mode="wait">
          {!paymentResult ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden"
            >
              
              {/* Payment Details Ribbon */}
              <div className="bg-slate-950 border-b border-slate-850 p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-slate-500 block font-bold">پذیرنده فروشگاهی:</span>
                  <span className="text-sm font-extrabold text-gold-400 mt-1 block flex items-center gap-1">
                    <Sparkles size={14} />
                    {merchantName}
                  </span>
                </div>
                <div className="sm:text-left">
                  <span className="text-[10px] text-slate-500 block font-bold">مبلغ قابل پرداخت:</span>
                  <span className="text-base font-extrabold text-slate-100 mt-1 block font-en-nums">
                    {formatPersianPrice(amount)}
                  </span>
                </div>
              </div>

              {/* ERROR & INFO MESSAGE BANNERS */}
              <AnimatePresence>
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-rose-500/10 border-b border-rose-500/20 px-6 py-3.5 text-xs text-rose-400 flex items-center gap-2 font-medium"
                  >
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{errorMsg}</span>
                  </motion.div>
                )}
                {successInfoMsg && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-3.5 text-xs text-emerald-400 flex items-center gap-2 font-medium"
                  >
                    <CheckCircle2 size={15} className="shrink-0" />
                    <span>{successInfoMsg}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Central Banking Form */}
              <form onSubmit={handlePaySubmit} className="p-6 space-y-6">
                
                {/* Visual Debit Card Layout preview */}
                <div className={`relative rounded-2xl p-5 bg-gradient-to-br ${bank.color} shadow-lg overflow-hidden transition-all duration-500 border border-white/5`}>
                  {/* Subtle card chips and stripes */}
                  <div className="absolute top-4 left-4 h-8 w-11 bg-amber-400/25 rounded-lg border border-amber-300/30" />
                  <div className="flex items-center justify-between mb-8">
                    <span className="text-xs font-bold tracking-wider">{bank.name}</span>
                    <CreditCard size={22} className="opacity-80" />
                  </div>
                  
                  <div className="text-center text-sm sm:text-lg font-bold font-mono tracking-widest text-white mb-5">
                    {cardNumber || 'xxxx-xxxx-xxxx-xxxx'}
                  </div>

                  <div className="flex justify-between items-center text-[11px] opacity-90 font-mono">
                    <span>CVV2: {cvv2 || '***'}</span>
                    <span>انقضا: {expYear ? `۱۴${expYear}` : '**'}/{expMonth || '**'}</span>
                  </div>
                </div>

                {/* Grid fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  
                  {/* Card Number Input */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-400 mb-1.5 flex items-center gap-1">
                      <CreditCard size={14} className="text-gold-400" />
                      شماره کارت ۱۶ رقمی
                    </label>
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="xxxx-xxxx-xxxx-xxxx"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-gold-500 transition-all text-left font-mono font-bold tracking-widest"
                      dir="ltr"
                    />
                  </div>

                  {/* CVV2 and Expiry */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5">کد امنیتی کارت (CVV2)</label>
                    <input
                      type="password"
                      required
                      maxLength={4}
                      value={cvv2}
                      onChange={(e) => { setErrorMsg(''); setCvv2(e.target.value.replace(/\D/g, '')); }}
                      placeholder="۳ یا ۴ رقم پشت کارت"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-gold-500 transition-all text-left font-mono font-bold"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5">تاریخ انقضای کارت</label>
                    <div className="flex gap-2">
                      <select
                        required
                        value={expMonth}
                        onChange={(e) => { setErrorMsg(''); setExpMonth(e.target.value); }}
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm text-slate-100 outline-none focus:border-gold-500"
                      >
                        <option value="" className="bg-slate-900">ماه</option>
                        {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((m) => (
                          <option key={m} value={m} className="bg-slate-900">{m}</option>
                        ))}
                      </select>
                      <select
                        required
                        value={expYear}
                        onChange={(e) => { setErrorMsg(''); setExpYear(e.target.value); }}
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm text-slate-100 outline-none focus:border-gold-500"
                      >
                        <option value="" className="bg-slate-900">سال</option>
                        {['۰۴', '۰۵', '۰۶', '۰۷', '۰۸', '۰۹', '۱۰'].map((y, idx) => (
                          <option key={idx} value={String(5 + idx).padStart(2, '0')} className="bg-slate-900">۱۴{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Captcha row */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5">کد امنیتی تصویری (کپچا)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        maxLength={4}
                        value={captchaInput}
                        onChange={(e) => { setErrorMsg(''); setCaptchaInput(e.target.value.replace(/\D/g, '')); }}
                        placeholder="کد روبرو را وارد کنید"
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-gold-500 transition-all text-left font-mono font-bold"
                        dir="ltr"
                      />
                      <div className="flex items-center gap-2 shrink-0 bg-slate-950 border border-slate-800 rounded-xl px-3 select-none font-serif font-black italic tracking-widest text-gold-400">
                        <span className="line-through decoration-slate-600 text-sm font-en-nums">{captchaCode}</span>
                        <button
                          type="button"
                          onClick={generateCaptcha}
                          className="text-slate-500 hover:text-gold-400 transition-colors p-1"
                        >
                          <RefreshCw size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* OTP SMS Token simulated triggers */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5 flex items-center justify-between">
                      <span>رمز دوم یکبار مصرف (پویا)</span>
                      {isOtpSent && (
                        <span className="text-[10px] text-slate-500 font-mono">اعتبار: {otpTimer} ثانیه</span>
                      )}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        disabled={!isOtpSent}
                        required={isOtpSent}
                        maxLength={5}
                        value={otpInput}
                        onChange={(e) => { setErrorMsg(''); setOtpInput(e.target.value.replace(/\D/g, '')); }}
                        placeholder={isOtpSent ? "۱۲۳۴۵ را وارد کنید" : "ابتدا دکمه درخواست را بزنید"}
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-gold-500 transition-all text-left font-mono font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="rounded-xl bg-gold-500 hover:bg-gold-400 text-slate-950 px-4 py-3 text-xs font-extrabold transition-all shrink-0 flex items-center gap-1 shadow-lg shadow-gold-500/10 cursor-pointer"
                      >
                        <Smartphone size={14} />
                        <span>{isOtpSent ? 'ارسال مجدد' : 'درخواست رمز'}</span>
                      </button>
                    </div>
                  </div>

                </div>

                {/* Pay and Cancel Action buttons */}
                <div className="flex gap-3 pt-5 border-t border-slate-800/80">
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-3.5 text-sm transition-all shadow-lg shadow-emerald-500/15 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Lock size={16} />
                    <span>پرداخت امن و نهایی</span>
                  </button>
                  <button
                    type="button"
                    onClick={onPaymentCancel}
                    className="rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 px-6 py-3.5 text-sm font-bold transition-all cursor-pointer"
                  >
                    انصراف
                  </button>
                </div>

              </form>
            </motion.div>
          ) : (
            /* SUCCESS OR FAILED RESULT SCREEN */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden p-8 text-center"
            >
              {paymentResult === 'success' ? (
                <>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4 animate-bounce">
                    <CheckCircle2 size={34} className="stroke-[2.5]" />
                  </div>
                  <h3 className="text-lg font-black text-slate-100">پرداخت شما با موفقیت انجام شد</h3>
                  <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
                    تراکنش مالی تایید شد و فاکتور خرید شما برای گالری آونتورین ارسال گردید. سفارش شما به زودی بسته‌بندی و ارسال می‌شود.
                  </p>

                  <div className="w-full bg-slate-950 rounded-2xl p-5 my-6 text-right text-xs space-y-3 border border-slate-850">
                    <div className="flex justify-between border-b border-slate-850 pb-2">
                      <span className="text-slate-500">نام پذیرنده:</span>
                      <span className="text-slate-300 font-bold">{merchantName}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-850 pb-2">
                      <span className="text-slate-500">کد مرجع بانکی:</span>
                      <span className="text-gold-400 font-mono font-bold text-sm font-en-nums">{receiptTracking}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-850 pb-2">
                      <span className="text-slate-500">مبلغ پرداخت شده:</span>
                      <span className="text-slate-100 font-extrabold text-sm font-en-nums">{formatPersianPrice(amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">وضعیت تراکنش:</span>
                      <span className="text-emerald-400 font-extrabold">موفق (نشسته به حساب)</span>
                    </div>
                  </div>

                  <button
                    onClick={handleFinalizeSuccess}
                    className="w-full rounded-xl bg-gold-500 hover:bg-gold-400 text-slate-950 py-3.5 text-sm font-bold transition-all shadow-lg shadow-gold-500/10 flex items-center justify-center gap-1.5 cursor-pointer"
                    id="btn-return-shop"
                  >
                    <span>تکمیل خرید و بازگشت به گالری</span>
                    <ArrowRight size={16} />
                  </button>
                </>
              ) : (
                <>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-4">
                    <XCircle size={34} className="stroke-[2.5]" />
                  </div>
                  <h3 className="text-lg font-black text-slate-100">تراکنش با خطا مواجه شد</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    درخواست پرداخت مالی توسط بانک صادرکننده کارت رد شد یا توسط کاربر لغو گردید.
                  </p>

                  <button
                    onClick={onPaymentCancel}
                    className="mt-8 w-full rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 py-3.5 text-sm font-bold transition-all cursor-pointer"
                    id="btn-return-shop-fail"
                  >
                    بازگشت به سبد خرید فروشگاه
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* FOOTER OF BANK */}
      <div className="bg-slate-900 py-4 text-center text-[10px] text-slate-500 border-t border-slate-800">
        <p>© تمامی حقوق مادی و معنوی این سامانه متعلق به شرکت شبکه الکترونیکی پرداخت کارت (شاپرک) می‌باشد.</p>
      </div>

    </div>
  );
}
