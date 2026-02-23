import { useState, useEffect } from 'react';
import { Report } from '../types';
import { FileSpreadsheet, Download, Search, Clock, MapPin, Printer } from 'lucide-react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { motion } from 'motion/react';

export default function ReportsArchive() {
  const [reports, setReports] = useState<Report[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    const res = await fetch('/api/reports');
    const data = await res.json();
    setReports(data);
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(reports.map(r => ({
      'المعرف': r.id,
      'اسم مدير المدرسة': r.teacher_name,
      'هاتف المدير': r.principal_phone || '',
      'تاريخ الزيارة': r.visit_date || '',
      'المحافظة': r.governorate || '',
      'الإدارة التعليمية': r.educational_admin || '',
      'اسم المدرسة': r.school_name || '',
      'كود المدرسة': r.school_id || '',
      'القسم': r.department,
      'ما تم إنجازه': r.accomplishments || '',
      'سلبيات': r.negatives || '',
      'مخالفات': r.violations || '',
      'الحالة': r.status === 'pending' ? 'قيد الانتظار' : r.status === 'resolved' ? 'تم الحل' : 'مرفوض',
      'التاريخ': format(new Date(r.created_at), 'PPP p', { locale: ar }),
      'الموقع (خط العرض)': r.location_lat || 'غير محدد',
      'الموقع (خط الطول)': r.location_lng || 'غير محدد'
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "التقارير");
    XLSX.writeFile(workbook, `تقارير_المتابعة_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rows = filteredReports.map(r => `
      <tr>
        <td>${r.id}</td>
        <td style="white-space: nowrap;">${format(new Date(r.created_at), 'yyyy/MM/dd HH:mm')}</td>
        <td style="font-weight: bold;">${r.teacher_name}</td>
        <td>${r.principal_phone || ''}</td>
        <td>${r.visit_date || ''}</td>
        <td>${r.governorate || ''}</td>
        <td>${r.educational_admin || ''}</td>
        <td>${r.school_name || ''}</td>
        <td>${r.school_id || ''}</td>
        <td>${r.department}</td>
        <td>${r.accomplishments || ''}</td>
        <td>${r.negatives || ''}</td>
        <td>${r.violations || ''}</td>
        <td>${r.location_lat && r.location_lng ? `${r.location_lat}, ${r.location_lng}` : 'غير متوفر'}</td>
        <td>${r.status === 'pending' ? 'قيد الانتظار' : r.status === 'resolved' ? 'تم الحل' : 'مرفوض'}</td>
      </tr>
    `).join('');

    const html = `
      <html dir="rtl">
        <head>
          <title>سجل التقارير المجمع</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=swap');
            body { 
              font-family: 'Noto Sans Arabic', 'Arial', sans-serif; 
              padding: 30px; 
              color: #1e293b;
              line-height: 1.5;
            }
            h1 { text-align: center; color: #4f46e5; margin-bottom: 5px; font-size: 24px; }
            .meta { text-align: center; font-size: 12px; color: #64748b; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #e2e8f0; padding: 12px 8px; text-align: right; font-size: 10px; }
            th { background-color: #f8fafc; font-weight: bold; color: #475569; white-space: nowrap; }
            tr:nth-child(even) { background-color: #fcfcfc; }
            @media print { 
              .no-print { display: none; }
              body { padding: 0; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
            }
          </style>
        </head>
        <body>
          <h1>سجل التقارير المجمع</h1>
          <div class="meta">تاريخ الاستخراج: ${format(new Date(), 'yyyy/MM/dd HH:mm')} | عدد التقارير: ${filteredReports.length}</div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>تاريخ التقرير</th>
                <th>مدير المدرسة</th>
                <th>الهاتف</th>
                <th>تاريخ الزيارة</th>
                <th>المحافظة</th>
                <th>الإدارة</th>
                <th>المدرسة</th>
                <th>الكود</th>
                <th>القسم</th>
                <th>ما تم إنجازه</th>
                <th>السلبيات</th>
                <th>المخالفات</th>
                <th>الموقع</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
          <div class="no-print" style="margin-top: 40px; text-align: center;">
            <button onclick="window.print()" style="padding: 14px 28px; background: #4f46e5; color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: bold; font-size: 16px; box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3);">حفظ كـ PDF / طباعة السجل</button>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const filteredReports = reports.filter(r => 
    r.teacher_name.includes(searchTerm) || r.details.includes(searchTerm)
  );

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">سجل التقارير المجمع</h1>
          <p className="text-slate-500">عرض وتصدير كافة التقارير المسجلة في النظام</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl font-bold shadow-lg transition-all"
          >
            <FileSpreadsheet size={20} />
            <span className="hidden sm:inline">تصدير إكسيل</span>
          </button>
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-3 rounded-xl font-bold shadow-lg transition-all"
          >
            <Printer size={20} />
            <span className="hidden sm:inline">تصدير PDF</span>
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text"
          placeholder="بحث في السجل..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pr-12 pl-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white shadow-sm"
        />
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-sm font-bold text-slate-700">التاريخ</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-700">مدير المدرسة</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-700">المدرسة</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-700">القسم</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-700">التقرير المجمع</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-700">المرفقات</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-700">الموقع</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-700">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                    {format(new Date(report.created_at), 'yyyy/MM/dd HH:mm')}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">{report.teacher_name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <div className="font-medium">{report.school_name}</div>
                    <div className="text-xs text-slate-400">{report.governorate} - {report.educational_admin}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold">
                      {report.department}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 max-w-xs">
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-indigo-600">تم الإنجاز:</div>
                      <div className="truncate">{report.accomplishments || '---'}</div>
                      <div className="text-xs font-bold text-amber-600">السلبيات:</div>
                      <div className="truncate">{report.negatives || '---'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex flex-col gap-1">
                      {report.image_url && (
                        <a href={report.image_url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline text-xs flex items-center gap-1">
                          <Download size={12} /> صورة
                        </a>
                      )}
                      {report.file_url && (
                        <a href={report.file_url} download="attachment" className="text-blue-600 hover:underline text-xs flex items-center gap-1">
                          <Download size={12} /> ملف
                        </a>
                      )}
                      {!report.image_url && !report.file_url && <span className="text-slate-400 text-xs">لا يوجد</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {report.location_lat && report.location_lng ? (
                      <a 
                        href={`https://www.google.com/maps?q=${report.location_lat},${report.location_lng}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 text-xs font-medium"
                      >
                        <MapPin size={14} />
                        عرض الخريطة
                      </a>
                    ) : (
                      <span className="text-slate-400 text-xs">غير متوفر</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                      report.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-indigo-50 text-indigo-700'
                    }`}>
                      {report.status === 'pending' ? 'قيد الانتظار' : 'تم الحل'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredReports.length === 0 && (
          <div className="p-12 text-center text-slate-400">
            لا توجد سجلات مطابقة للبحث
          </div>
        )}
      </div>
    </div>
  );
}
