import React, { useState, useEffect, useRef } from 'react';
import { Camera, MapPin, Send, CheckCircle2, AlertCircle, Loader2, Image as ImageIcon, X, Printer, FileText, FileUp, Paperclip } from 'lucide-react';
import { DEPARTMENTS } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

import { format } from 'date-fns';

export default function TeacherForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    teacher_name: '',
    department: DEPARTMENTS[0],
    details: '',
    governorate: '',
    educational_admin: '',
    school_id: '',
    school_name: '',
    principal_phone: '',
    visit_date: format(new Date(), 'yyyy-MM-dd'),
    accomplishments: '',
    negatives: '',
    violations: '',
    file_url: '',
  });
  const [image, setImage] = useState<string | null>(null);
  const [fileData, setFileData] = useState<{ name: string; data: string } | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [lastReport, setLastReport] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const nextStep = () => {
    if (step === 1) {
      if (!formData.governorate || !formData.educational_admin || !formData.school_name || !formData.school_id) {
        alert('يرجى ملء جميع حقول بيانات المدرسة');
        return;
      }
    } else if (step === 2) {
      if (!formData.teacher_name || !formData.principal_phone || !formData.visit_date) {
        alert('يرجى ملء جميع بيانات مدير المدرسة');
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  const prevStep = () => setStep(prev => prev - 1);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("تعذر الحصول على الموقع. يرجى التأكد من تفعيل الصلاحيات.");
        }
      );
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileData({
          name: file.name,
          data: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.accomplishments && !formData.negatives && !formData.violations) {
      alert('يرجى إكمال عناصر التقرير المجمع');
      return;
    }
    setIsSubmitting(true);
    setStatus('idle');

    try {
      const reportData = {
        ...formData,
        image_url: image,
        file_url: fileData?.data,
        location_lat: location?.lat,
        location_lng: location?.lng,
      };

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      });

      if (response.ok) {
        const result = await response.json();
        setLastReport(result);
        setStatus('success');
        setFormData({ 
          teacher_name: '', 
          department: DEPARTMENTS[0], 
          details: '',
          governorate: '',
          educational_admin: '',
          school_id: '',
          school_name: '',
          principal_phone: '',
          visit_date: format(new Date(), 'yyyy-MM-dd'),
          accomplishments: '',
          negatives: '',
          violations: '',
          file_url: '',
        });
        setImage(null);
        setFileData(null);
        setLocation(null);
        setStep(1);
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const printReport = () => {
    if (!lastReport) return;
    
    // Simple print approach for Arabic support
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html dir="rtl">
        <head>
          <title>تقرير متابعة - ${lastReport.teacher_name}</title>
          <style>
            body { font-family: 'Arial', sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #059669; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #059669; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .info-item { border: 1px solid #e5e7eb; padding: 15px; rounded: 8px; }
            .label { font-weight: bold; color: #6b7280; font-size: 14px; margin-bottom: 5px; }
            .value { font-size: 18px; }
            .details-box { border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
            .image-box { text-align: center; margin-top: 20px; }
            .image-box img { max-width: 100%; max-height: 400px; border-radius: 8px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">نظام المتابعة الذكي - تقرير بلاغ</div>
            <p>تاريخ التقرير: ${new Date(lastReport.created_at).toLocaleString('ar-EG')}</p>
          </div>
          
          <div class="info-grid">
            <div class="info-item">
              <div class="label">اسم مدير المدرسة</div>
              <div class="value">${lastReport.teacher_name}</div>
            </div>
            <div class="info-item">
              <div class="label">رقم هاتف مدير المدرسة</div>
              <div class="value">${lastReport.principal_phone || 'غير محدد'}</div>
            </div>
            <div class="info-item">
              <div class="label">تاريخ الزيارة</div>
              <div class="value">${lastReport.visit_date || 'غير محدد'}</div>
            </div>
            <div class="info-item">
              <div class="label">القسم المختص</div>
              <div class="value">${lastReport.department}</div>
            </div>
            <div class="info-item">
              <div class="label">المحافظة</div>
              <div class="value">${lastReport.governorate || 'غير محدد'}</div>
            </div>
            <div class="info-item">
              <div class="label">الإدارة التعليمية</div>
              <div class="value">${lastReport.educational_admin || 'غير محدد'}</div>
            </div>
            <div class="info-item">
              <div class="label">اسم المدرسة</div>
              <div class="value">${lastReport.school_name || 'غير محدد'}</div>
            </div>
            <div class="info-item">
              <div class="label">الرقم التعريفي للمدرسة</div>
              <div class="value">${lastReport.school_id || 'غير محدد'}</div>
            </div>
          </div>

          <div class="details-box">
            <div class="label">ما تم إنجازه</div>
            <div class="value">${lastReport.accomplishments || 'لا يوجد'}</div>
          </div>

          <div class="details-box">
            <div class="label">سلبيات لم يتم إنجازها أثناء الزيارة</div>
            <div class="value">${lastReport.negatives || 'لا يوجد'}</div>
          </div>

          <div class="details-box">
            <div class="label">مخالفات تم رصدها وعمل إثبات حالة</div>
            <div class="value">${lastReport.violations || 'لا يوجد'}</div>
          </div>

          ${lastReport.location_lat ? `
            <div class="info-item">
              <div class="label">الموقع الجغرافي</div>
              <div class="value">خط العرض: ${lastReport.location_lat} | خط الطول: ${lastReport.location_lng}</div>
            </div>
          ` : ''}

          ${lastReport.image_url ? `
            <div class="image-box">
              <div class="label">الصورة المرفقة</div>
              <img src="${lastReport.image_url}" />
            </div>
          ` : ''}

          <div class="no-print" style="margin-top: 40px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #059669; color: white; border: none; border-radius: 5px; cursor: pointer;">طباعة الآن</button>
          </div>
          
          <script>
            window.onload = () => {
              // window.print();
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100"
      >
        <div className="bg-emerald-600 p-8 text-white text-center">
          <h1 className="text-3xl font-bold mb-2">تقرير متابعة ميدانية</h1>
          <p className="opacity-90">الخطوة {step} من 3</p>
          <div className="flex justify-center gap-2 mt-4">
            {[1, 2, 3].map(s => (
              <div key={s} className={`h-2 w-12 rounded-full transition-all ${s <= step ? 'bg-white' : 'bg-white/30'}`} />
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-bold text-slate-800 border-b pb-2">بيانات المدرسة</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">المحافظة <span className="text-red-500">*</span></label>
                    <input
                      required
                      type="text"
                      value={formData.governorate}
                      onChange={(e) => setFormData({ ...formData, governorate: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                      placeholder="أدخل اسم المحافظة"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">الإدارة التعليمية <span className="text-red-500">*</span></label>
                    <input
                      required
                      type="text"
                      value={formData.educational_admin}
                      onChange={(e) => setFormData({ ...formData, educational_admin: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                      placeholder="أدخل اسم الإدارة"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">اسم المدرسة <span className="text-red-500">*</span></label>
                    <input
                      required
                      type="text"
                      value={formData.school_name}
                      onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                      placeholder="أدخل اسم المدرسة"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">الرقم التعريفي للمدرسة <span className="text-red-500">*</span></label>
                    <input
                      required
                      type="text"
                      value={formData.school_id}
                      onChange={(e) => setFormData({ ...formData, school_id: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                      placeholder="أدخل الكود التعريفي"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all"
                >
                  التالي
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-bold text-slate-800 border-b pb-2">بيانات مدير المدرسة</h2>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">اسم مدير المدرسة <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="text"
                    value={formData.teacher_name}
                    onChange={(e) => setFormData({ ...formData, teacher_name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                    placeholder="أدخل اسم مدير المدرسة الكامل"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">رقم هاتف مدير المدرسة <span className="text-red-500">*</span></label>
                    <input
                      required
                      type="tel"
                      value={formData.principal_phone}
                      onChange={(e) => setFormData({ ...formData, principal_phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                      placeholder="أدخل رقم الهاتف"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">تاريخ الزيارة <span className="text-red-500">*</span></label>
                    <input
                      required
                      type="date"
                      value={formData.visit_date}
                      onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 rounded-xl transition-all"
                  >
                    السابق
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all"
                  >
                    التالي
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-bold text-slate-800 border-b pb-2">تفاصيل التقرير</h2>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">القسم المختص <span className="text-red-500">*</span></label>
                  <select
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none bg-white"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">ما تم إنجازه <span className="text-red-500">*</span></label>
                    <textarea
                      required
                      value={formData.accomplishments}
                      onChange={(e) => setFormData({ ...formData, accomplishments: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none resize-none"
                      placeholder="اكتب ما تم إنجازه خلال الزيارة..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">سلبيات لم يتم إنجازها أثناء الزيارة <span className="text-red-500">*</span></label>
                    <textarea
                      required
                      value={formData.negatives}
                      onChange={(e) => setFormData({ ...formData, negatives: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none resize-none"
                      placeholder="اكتب السلبيات التي تم رصدها..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">مخالفات تم رصدها وعمل إثبات حالة <span className="text-red-500">*</span></label>
                    <textarea
                      required
                      value={formData.violations}
                      onChange={(e) => setFormData({ ...formData, violations: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none resize-none"
                      placeholder="اكتب المخالفات التي تم رصدها..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed transition-all ${
                      image ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:border-indigo-400 text-slate-500'
                    }`}
                  >
                    {image ? <CheckCircle2 size={18} /> : <Camera size={18} />}
                    <span className="text-xs font-medium">{image ? 'تم اختيار صورة' : 'إرفاق صورة'}</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.pdf,.xlsx,.xls';
                      input.onchange = (e) => handleFileChange(e as any);
                      input.click();
                    }}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed transition-all ${
                      fileData ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:border-indigo-400 text-slate-500'
                    }`}
                  >
                    {fileData ? <CheckCircle2 size={18} /> : <FileUp size={18} />}
                    <span className="text-xs font-medium">{fileData ? 'تم إرفاق ملف' : 'إرفاق ملف (PDF/Excel)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={getLocation}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed transition-all ${
                      location ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:border-indigo-400 text-slate-500'
                    }`}
                  >
                    {location ? <CheckCircle2 size={18} /> : <MapPin size={18} />}
                    <span className="text-xs font-medium">{location ? 'تم تحديد الموقع' : 'تحديد الموقع'}</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-4">
                  {image && (
                    <div className="relative inline-block">
                      <img src={image} alt="Preview" className="h-16 w-16 object-cover rounded-xl border border-slate-200" />
                      <button
                        type="button"
                        onClick={() => setImage(null)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                  {fileData && (
                    <div className="relative flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                      <Paperclip size={16} className="text-slate-400" />
                      <span className="text-xs text-slate-600 max-w-[100px] truncate">{fileData.name}</span>
                      <button
                        type="button"
                        onClick={() => setFileData(null)}
                        className="bg-red-500 text-white rounded-full p-1 shadow-lg"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 rounded-xl transition-all"
                  >
                    السابق
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <>
                        <Send size={20} />
                        <span>إرسال التقرير المجمع</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {status === 'success' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <div className="bg-indigo-50 text-indigo-700 p-4 rounded-xl flex items-center gap-3">
                  <CheckCircle2 />
                  <p className="font-medium">تم إرسال التقرير بنجاح! سيتم متابعته من قبل الإدارة.</p>
                </div>
                
                <button
                  type="button"
                  onClick={printReport}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white border-2 border-indigo-600 text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-all"
                >
                  <Printer size={20} />
                  <span>طباعة التقرير (PDF)</span>
                </button>
              </motion.div>
            )}
            {status === 'error' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-3"
              >
                <AlertCircle />
                <p className="font-medium">حدث خطأ أثناء الإرسال. يرجى المحاولة مرة أخرى.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </motion.div>
    </div>
  );
}
