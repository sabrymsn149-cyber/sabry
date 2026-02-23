export type ReportStatus = 'pending' | 'in_progress' | 'resolved' | 'rejected';

export interface Report {
  id: number;
  teacher_name: string;
  department: string;
  details: string;
  governorate?: string;
  educational_admin?: string;
  school_id?: string;
  school_name?: string;
  principal_phone?: string;
  visit_date?: string;
  accomplishments?: string;
  negatives?: string;
  violations?: string;
  file_url?: string;
  image_url?: string;
  location_lat?: number;
  location_lng?: number;
  status: ReportStatus;
  created_at: string;
}

export const DEPARTMENTS = [
  "متابعة شئون العاملين",
  "متابعة شئون الطلاب",
  "متابعة سجل التكليفات",
  "متابعة الوحدة المنتجة",
  "متابعة الجمعية التعاونية المدرسية",
  "متابعة المشاركة المجتمعية",
  "متابعة لائحة الانضباط المدرسي",
  "متابعة الصيانة الدورية",
  "متابعة الامن والسلامة المهنية",
  "متابعة المكتبة",
  "متابعة التقيمات",
  "متابعة الرواكد الخشبية والمعدنية",
  "متابعة تسلم الكتب والتابلت"
];
