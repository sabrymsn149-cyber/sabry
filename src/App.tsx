import { useState, useEffect } from 'react';
import TeacherForm from './components/TeacherForm';
import ReportsArchive from './components/ReportsArchive';
import { ClipboardList, FileSpreadsheet, School, Download, Package, Archive } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [view, setView] = useState<'teacher' | 'archive'>('teacher');
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const downloadBackup = async () => {
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_reports_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Backup failed:', error);
      alert('فشل في إنشاء نسخة احتياطية');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans relative">
      {/* Background Image Overlay */}
      <div 
        className="fixed inset-0 z-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'url("https://picsum.photos/seed/tech/1920/1080")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
                <School className="text-white" size={24} />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent hidden sm:block">
                نظام المتابعة الميدانية
              </span>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setView('teacher')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  view === 'teacher' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <ClipboardList size={18} />
                <span>إرسال تقرير</span>
              </button>
              <button
                onClick={() => setView('archive')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  view === 'archive' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <FileSpreadsheet size={18} />
                <span>سجل التقارير</span>
              </button>
            </div>

            <div className="hidden md:flex items-center gap-2">
              {installPrompt && (
                <button
                  onClick={handleInstall}
                  className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-all border border-indigo-200"
                  title="تثبيت التطبيق على الجهاز"
                >
                  <Download size={14} />
                  <span>تثبيت</span>
                </button>
              )}
              <button
                onClick={downloadBackup}
                className="flex items-center gap-2 bg-slate-50 text-slate-600 px-3 py-2 rounded-lg text-xs font-bold hover:bg-slate-100 transition-all border border-slate-200"
                title="تحميل نسخة احتياطية من البيانات"
              >
                <Archive size={14} />
                <span>نسخة احتياطية</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="py-8 relative z-10">
        <motion.div
          key={view}
          initial={{ opacity: 0, x: view === 'teacher' ? 20 : -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {view === 'teacher' ? <TeacherForm /> : <ReportsArchive />}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-slate-400 text-sm border-t border-slate-200 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} نظام المتابعة الميدانية الذكي - جميع الحقوق محفوظة</p>
          <div className="flex items-center gap-4">
            <button onClick={downloadBackup} className="hover:text-indigo-600 transition-colors flex items-center gap-1">
              <Archive size={14} /> ضغط البيانات
            </button>
            {installPrompt && (
              <button onClick={handleInstall} className="hover:text-indigo-600 transition-colors flex items-center gap-1">
                <Download size={14} /> تنزيل التطبيق
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Mobile Install Prompt */}
      <AnimatePresence>
        {installPrompt && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="md:hidden fixed bottom-4 left-4 right-4 z-50"
          >
            <div className="bg-white p-4 rounded-2xl shadow-2xl border border-slate-100 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2 rounded-lg">
                  <School className="text-white" size={20} />
                </div>
                <div>
                  <div className="font-bold text-sm">تثبيت التطبيق</div>
                  <div className="text-xs text-slate-500">للوصول السريع والمتابعة</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setInstallPrompt(null)}
                  className="text-slate-400 p-2"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleInstall}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-indigo-200"
                >
                  تثبيت
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
