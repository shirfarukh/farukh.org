import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper } from '../../src/components/ui/ScreenWrapper';
import { useTheme } from '../../src/features/theme/ThemeContext';
import { HeaderPreferences } from '../../src/components/ui/HeaderPreferences';

interface GradeTrack {
  grade: number;
  title: string;
  faTitle: string;
  description: string;
  faDescription: string;
  coverUrl: string;
  facultyName: string;
  faFacultyName: string;
  facultyBio: string;
  faFacultyBio: string;
  subjects: string[];
  faSubjects: string[];
  keyTopics: string[];
  faKeyTopics: string[];
}

const GRADE_TRACKS: GradeTrack[] = [
  {
    grade: 7,
    title: 'Grade 7: Middle School Science & Humanities',
    faTitle: 'صنف هفتم: علوم تجربی و ادبیات متوسطه',
    description: 'Fundamental algebraic equations, world physical geography, introductory biology, and Persian & Pashto grammar.',
    faDescription: 'معادلات مقدماتی جبر، جغرافیای طبیعی جهان، ساختار بدن انسان و دستور زبان دری و پشتو.',
    coverUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop',
    facultyName: 'Faculty of Sciences & Literature',
    faFacultyName: 'هیئت تدریسی علوم ساینسی و ادبیات',
    facultyBio: 'Specialists in middle school mathematics, experimental sciences, and linguistic studies.',
    faFacultyBio: 'متخصصان آموزش ریاضیات دوره متوسطه، علوم تجربی و ادبیات زبان فارسی و پشتو.',
    subjects: ['Algebra & Geometry', 'Biology', 'Chemistry Basics', 'Dari Grammar', 'Pashto', 'World Geography', 'Civics'],
    faSubjects: ['جبر و هندسه مقدماتی', 'بیولوژی و فیزیولوژی', 'مفاهیم اولیه کیمیا', 'دستور زبان دری', 'زبان پشتو', 'جغرافیای جهان', 'مدنی و اخلاق'],
    keyTopics: ['Linear Equations in Math', 'Ecosystems & Energy Flow', 'Elements and Compounds in Nature'],
    faKeyTopics: ['معادلات خطی یک مجهولی', 'چرخه زیست‌محیطی و اکوسیستم', 'شناخت عناصر و ترکیبات اولیه طبیعت'],
  },
  {
    grade: 8,
    title: 'Grade 8: Pre-High School Advanced Curriculum',
    faTitle: 'صنف هشتم: علوم پیشرفته و آمادگی لیسه',
    description: 'Preparation for senior secondary with intermediate physics, organic chemistry foundations, and geometric logic.',
    faDescription: 'آمادگی جامع برای ورود به لیسه با فیزیک مقدماتی، مبانی کیمیا، هندسه تحلیلی و تاریخ معاصر.',
    coverUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop',
    facultyName: 'National Curriculum Faculty Board',
    faFacultyName: 'هیئت معلمان نصاب ملی معارف',
    facultyBio: 'Senior instructors focused on problem-solving, science experiments, and analytical thinking.',
    faFacultyBio: 'استادان باسابقه با تمرکز بر حل مسأله، آزمایش‌های علمی و مهارت‌های تفکر تحلیلی.',
    subjects: ['Physics (Forces & Motion)', 'Chemistry', 'Biology', 'Algebra', 'Geometry', 'History of Afghanistan', 'English'],
    faSubjects: ['فیزیک (نیرو و حرکت)', 'کیمیای عمومی', 'بیولوژی سلولی', 'جبر پیشرفته', 'هندسه و زوایا', 'تاریخ معاصر افغانستان', 'زبان انگلیسی'],
    keyTopics: ['Laws of Motion & Mechanics', 'Chemical Bonds & Reactions', 'Historical Treaties & National Era'],
    faKeyTopics: ['قوانین حرکت و نیرو در فیزیک', 'پیوندهای کیمیاوی و واکنش‌ها', 'معاهدات تاریخی و روند شکل‌گیری کشور'],
  },
  {
    grade: 9,
    title: 'Grade 9: Middle School Graduation Syllabus',
    faTitle: 'صنف نهم: دوره فراغت از متوسطه و ورود به لیسه',
    description: 'Comprehensive graduation syllabus completing middle school requirements with national exam preparation standards.',
    faDescription: 'دوره تکمیلی دوره متوسطه و آمادگی امتحانات با استانداردهای رسمی وزارت معارف کشور.',
    coverUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop',
    facultyName: 'Secondary School Certification Board',
    faFacultyName: 'هیئت علمی ارزیابی و تصدیق متوسطه',
    facultyBio: 'Certified Afghan educators delivering lessons matched lesson-by-lesson to official textbooks.',
    faFacultyBio: 'معلمان رسمی با تدریس گام‌به‌گام و مطابق با کتاب‌های چاپ وزارت معارف.',
    subjects: ['Physics', 'Chemistry', 'Biology & Genetics', 'Mathematics', 'Dari Literature', 'Pashto', 'Computer Literacy'],
    faSubjects: ['فیزیک عمومی', 'کیمیا و جدول مندلیف', 'ژنتیک و وراثت', 'ریاضیات جامع', 'ادبیات معاصر دری', 'پشتو', 'مبانی کمپیوتر'],
    keyTopics: ['Electromagnetism Principles', 'Periodic Table & Formulas', 'Inheritance & Genetics Fundamentals'],
    faKeyTopics: ['مبانی الکترومقناطیس و جریان برق', 'جدول تناوبی و فرمول‌های کیمیاوی', 'اصول وراثت و ژنتیک مندیل'],
  },
  {
    grade: 10,
    title: 'Grade 10: Senior High School (Lycee) Division',
    faTitle: 'صنف دهم: دوره عالی لیسه و مبانی کنکور',
    description: 'High school curriculum in natural sciences, advanced trigonometry, classical Persian literature, and technical physics.',
    faDescription: 'دوره اول لیسه با مثلثات، فیزیک میکانیک، کیمیای غیرعضوی و ادبیات کهن فارسی و پشتو.',
    coverUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop',
    facultyName: 'High School Lycee Faculty',
    faFacultyName: 'هیئت اساتید لیسه عالی فرخ',
    facultyBio: 'University lecturers and high school professors dedicated to Afghan women’s secondary education.',
    faFacultyBio: 'استادان باسابقه لیسه و پوهنتون متعهد به تداوم آموزش دختران در سراسر افغانستان.',
    subjects: ['Trigonometry & Functions', 'Classical Mechanics', 'Inorganic Chemistry', 'Human Biology', 'Philosophy', 'English'],
    faSubjects: ['مثلثات و توابع ریاضی', 'فیزیک میکانیک نیوتنی', 'کیمیای غیرعضوی', 'بیولوژی پیشرفته انسان', 'فلسفه و منطق', 'انگلیسی پیشرفته'],
    keyTopics: ['Trigonometric Proofs', 'Thermodynamics & Energy', 'Cellular Respiration in Biology'],
    faKeyTopics: ['اثبات نسبت‌ها و اتحادهای مثلثاتی', 'ترمودینامیک و قوانین انرژی', 'تنفس سلولی و چرخه کربس'],
  },
  {
    grade: 11,
    title: 'Grade 11: Advanced Science & Pre-University',
    faTitle: 'صنف یازدهم: علوم پیشرفته و آمادگی پوهنتون',
    description: 'Analytical calculus, organic chemistry, optical physics, and comprehensive literary text analysis.',
    faDescription: 'حسابان تحلیلی و حد، کیمیای عضوی، فیزیک نور و عدسیه‌ها، و تحلیل متون نظم و نثر.',
    coverUrl: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&auto=format&fit=crop',
    facultyName: 'Pre-University Academic Board',
    faFacultyName: 'هیئت علمی پیش‌دانشگاهی و آمادگی کنکور',
    facultyBio: 'Specialists in high school sciences preparing students for regional and international academic standards.',
    faFacultyBio: 'اساتید متخصص علوم تجربی و ساینسی با استانداردسازی مطالب برای پیشرفت تحصیلی.',
    subjects: ['Calculus & Limits', 'Optics & Waves', 'Organic Chemistry', 'Molecular Biology', 'Dari Poetry', 'Pashto Literature'],
    faSubjects: ['مفهوم حد و مشتق در حسابان', 'فیزیک نور و امواج', 'کیمیای عضوی (هیدروکاربن‌ها)', 'بیولوژی مولکولی', 'شعر و سبک‌شناسی دری', 'ادبیات کهن پشتو'],
    keyTopics: ['Derivatives & Slope Analysis', 'Wave Refraction & Dispersion', 'Carbon Chains & Isomers'],
    faKeyTopics: ['مشتق‌گیری و تحلیل توابع جبری', 'شکست و تداخل امواج نوری', 'ساختار زنجیره‌های کاربنی و ایزومرها'],
  },
  {
    grade: 12,
    title: 'Grade 12: High School Baccalaureate (Graduation)',
    faTitle: 'صنف دوازدهم: دوره تکمیلی فراغت لیسه (بکلوریا)',
    description: 'Official 12th grade completion syllabus, national Kankor exam preparation, atomic physics, and comprehensive assessments.',
    faDescription: 'برنامه رسمی دوره دوازدهم، آمادگی جامع آزمون کانکور، فیزیک اتومی، کیمیای پیشرفته و امتحانات بکلوریا.',
    coverUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop',
    facultyName: 'National Baccalaureate & Kankor Faculty',
    faFacultyName: 'هیئت عالی اساتید بکلوریا و کانکور ملی',
    facultyBio: 'Master Afghan professors preparing students to succeed in university entrance examinations.',
    faFacultyBio: 'برترین استادان آمادگی کانکور و سنجش تحصیلی با بیش از ۱۵ سال تجربه تدریس.',
    subjects: ['Integral Calculus', 'Atomic & Nuclear Physics', 'Biochemistry', 'Kankor Science Prep', 'Advanced Dari & Pashto', 'English'],
    faSubjects: ['انتگرال و کاربردهای آن', 'فیزیک اتومی و هسته‌ای', 'بیوشیمی و متابولیسم', 'تست‌زنی جامع کانکور', 'ادبیات تخصصی', 'زبان تخصصی'],
    keyTopics: ['Definite & Indefinite Integrals', 'Quantum & Nuclear Physics', 'Comprehensive Kankor Formula Bank'],
    faKeyTopics: ['محاسبه سطوح با انتگرال معین', 'مدل‌های اتومی و فیزیک کوانتوم', 'بانک فرمول‌ها و نکات کلیدی کانکور'],
  },
];

export default function AfghanistanGirlsSchoolScreen() {
  const { colors, isDark } = useTheme();
  const { i18n } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ grade?: string }>();
  const isPersian = i18n.language?.startsWith('fa');
  
  const initialGrade = params.grade ? parseInt(params.grade, 10) : undefined;
  const [selectedGrade, setSelectedGrade] = useState<number | 'all'>(
    initialGrade && [7, 8, 9, 10, 11, 12].includes(initialGrade) ? initialGrade : 'all'
  );

  React.useEffect(() => {
    if (params.grade) {
      const g = parseInt(params.grade, 10);
      if ([7, 8, 9, 10, 11, 12].includes(g)) {
        setSelectedGrade(g);
      }
    }
  }, [params.grade]);

  const filteredTracks = selectedGrade === 'all'
    ? GRADE_TRACKS
    : GRADE_TRACKS.filter((t) => t.grade === selectedGrade);

  const handleOpenEmailApplication = (gradeNumber?: number) => {
    const gradeLabel = gradeNumber ? `Grade ${gradeNumber} (صنف ${gradeNumber})` : 'All Grades (صنوف ۷ تا ۱۲)';
    const subject = encodeURIComponent(`Official Academic School Application: ${gradeLabel}`);
    const body = encodeURIComponent(
      `Hello Admissions Board at FARUKH.ORG,\n\n` +
      `I am submitting an official student application for enrollment in the Afghanistan Online Academic School for Girls (Grades 7-12).\n\n` +
      `--- APPLICATION DETAILS ---\n` +
      `Student Full Name (نام و تخلص متعلم):\n` +
      `Desired Academic Grade (صنف تحصیلی مورد نظر): ${gradeLabel}\n` +
      `City / Province (ولایت و موقعیت): \n` +
      `Guardian Full Name (نام ولی متعلم):\n` +
      `Contact WhatsApp / Phone (شماره تماس یا واتساپ):\n` +
      `Previous School (مکتب قبلی در صورت وجود):\n\n` +
      `Please register this student confidentially and send back the official learning materials and access credentials.\n\n` +
      `Thank you.`
    );
    Linking.openURL(`mailto:info@farukh.org?subject=${subject}&body=${body}`);
  };

  return (
    <ScreenWrapper>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        {/* Header Navigation Bar */}
        <View
          style={{
            flexDirection: isPersian ? 'row-reverse' : 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
            paddingVertical: 4,
          }}
        >
          <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 16 }}>
                {isPersian ? '→' : '←'}
              </Text>
            </TouchableOpacity>
            <View>
              <Text style={{ color: colors.gold, fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', textAlign: isPersian ? 'right' : 'left' }}>
                {isPersian ? 'مکتب رسمی تحصیلی (مستقل از دوره‌ها)' : 'OFFICIAL ACADEMIC SCHOOL • SEPARATE FROM COURSES'}
              </Text>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: '900', textAlign: isPersian ? 'right' : 'left' }}>
                {isPersian ? 'مکتب آنلاین دختران افغانستان' : 'Afghanistan Girls Academic School'}
              </Text>
            </View>
          </View>
          <HeaderPreferences compact />
        </View>

        {/* Hero & National Mission Banner */}
        <View
          style={{
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.55)' : 'rgba(255, 255, 255, 0.85)',
            borderRadius: 24,
            borderWidth: 1,
            borderColor: colors.goldBorder,
            padding: 20,
            marginBottom: 22,
            shadowColor: '#000',
            shadowOpacity: isDark ? 0.3 : 0.08,
            shadowOffset: { width: 0, height: 6 },
            shadowRadius: 18,
            elevation: 6,
            ...(Platform.OS === 'web'
              ? { backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }
              : {}) as any,
          }}
        >
          <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <View style={{ backgroundColor: isDark ? 'rgba(250, 204, 21, 0.15)' : 'rgba(250, 204, 21, 0.22)', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: colors.goldBorder }}>
              <Text style={{ color: colors.gold, fontSize: 11, fontWeight: '800' }}>
                {isPersian ? 'مکتب رسمی تحصیلی • نصاب رسمی وزارت معارف' : 'OFFICIAL ACADEMIC SCHOOL • NATIONAL CURRICULUM'}
              </Text>
            </View>
            <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700' }}>
              {isPersian ? 'صنوف ۷ الی ۱۲' : 'Grades 7–12'}
            </Text>
          </View>

          <Text style={{ color: colors.text, fontSize: 21, fontWeight: '900', marginBottom: 8, lineHeight: 30, textAlign: isPersian ? 'right' : 'left' }}>
            {isPersian
              ? 'آموزش رسمی مکتب برای دختران افغانستان (شروع از صنف هفتم)'
              : 'Official Academic School for Afghan Girls (Starting from Grade 7)'}
          </Text>

          <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 22, marginBottom: 16, textAlign: isPersian ? 'right' : 'left' }}>
            {isPersian
              ? 'در پاسخ به ممنوعیت آموزش رسمی دختران از صنف هفتم به بعد در مکاتب افغانستان، این سامانه به عنوان یک «مکتب رسمی تحصیلی» و کاملاً مستقل و مجزا از دوره‌های آزاد و مهارتی طراحی شده است. تمام سرفصل‌ها مستقیماً مطابق با نصاب رسمی و کتاب‌های درسی وزارت معارف (از صنف ۷ تا ۱۲) در محیطی امن و محرمانه تدریس می‌گردد.'
              : 'In response to official bans on girls attending secondary education starting from Grade 7 in Afghanistan, FARUKH.ORG provides this formal academic school—strictly separate from vocational and skill courses. It delivers the complete official Ministry of Education curriculum from Grade 7 to Grade 12 in a safe and confidential environment.'}
          </Text>

          {/* Exclusive Confidential Registration Notice */}
          <View
            style={{
              backgroundColor: isDark ? 'rgba(250, 204, 21, 0.08)' : 'rgba(254, 240, 138, 0.3)',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.goldBorder,
              padding: 14,
              marginBottom: 16,
            }}
          >
            <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Text style={{ color: colors.gold, fontWeight: '900', fontSize: 13 }}>
                {isPersian ? 'توجه بسیار مهم درباره ثبت‌نام رسمی مکتب:' : 'Important Academic Registration Notice:'}
              </Text>
            </View>
            <Text style={{ color: isDark ? '#FDE047' : '#854D0E', fontSize: 12, lineHeight: 20, fontWeight: '600', textAlign: isPersian ? 'right' : 'left' }}>
              {isPersian
                ? 'این بخش مکتب رسمی تحصیلی است و با دوره‌های آزاد تفاوت دارد. به منظور حفظ امنیت و حریم خصوصی متعلمین، ثبت‌نام به صورت خودکار یا باز نبوده و صرفاً از طریق مکاتبه رسمی و تأیید پرونده تحصیلی با ایمیل انجام می‌شود.'
                : 'This is an official academic school, separate from regular training courses. To guarantee student safety and privacy, admission is processed via confidential direct email registration.'}
            </Text>
          </View>

          {/* Action Button: Apply via Email */}
          <TouchableOpacity
            onPress={() => handleOpenEmailApplication()}
            activeOpacity={0.85}
            style={{
              backgroundColor: colors.primary,
              borderRadius: 16,
              paddingVertical: 14,
              paddingHorizontal: 20,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: colors.primary,
              shadowOpacity: 0.3,
              shadowRadius: 10,
              flexDirection: isPersian ? 'row-reverse' : 'row',
              gap: 8,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}>
              {isPersian ? 'ارسال درخواست ثبت‌نام محرمانه متعلمین (ایمیل) →' : 'Submit Confidential Student Application (Email) →'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Grade Selector Tabs (All Grades, Grade 7 to 12) */}
        <View style={{ marginBottom: 18 }}>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: 10, textAlign: isPersian ? 'right' : 'left' }}>
            {isPersian ? 'انتخاب صنف تحصیلی (نصاب رسمی معارف - صنوف ۷ الی ۱۲):' : 'Select Academic Grade Syllabus (Grades 7–12):'}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              flexDirection: isPersian ? 'row-reverse' : 'row',
              gap: 8,
              paddingBottom: 4,
            }}
          >
            <TouchableOpacity
              onPress={() => setSelectedGrade('all')}
              activeOpacity={0.8}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 9,
                borderRadius: 99,
                backgroundColor: selectedGrade === 'all' ? colors.gold : colors.cardHover,
                borderWidth: 1,
                borderColor: selectedGrade === 'all' ? colors.gold : colors.cardBorder,
              }}
            >
              <Text
                style={{
                  color: selectedGrade === 'all' ? (isDark ? '#0F172A' : '#FFFFFF') : colors.textSecondary,
                  fontWeight: '800',
                  fontSize: 12.5,
                }}
              >
                {isPersian ? 'همه صنوف (۷ تا ۱۲)' : 'All Grades (7–12)'}
              </Text>
            </TouchableOpacity>

            {[7, 8, 9, 10, 11, 12].map((g) => {
              const isSelected = selectedGrade === g;
              return (
                <TouchableOpacity
                  key={g}
                  onPress={() => setSelectedGrade(g)}
                  activeOpacity={0.8}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 9,
                    borderRadius: 99,
                    backgroundColor: isSelected ? colors.gold : colors.cardHover,
                    borderWidth: 1,
                    borderColor: isSelected ? colors.gold : colors.cardBorder,
                  }}
                >
                  <Text
                    style={{
                      color: isSelected ? (isDark ? '#0F172A' : '#FFFFFF') : colors.textSecondary,
                      fontWeight: '800',
                      fontSize: 12.5,
                    }}
                  >
                    {isPersian ? `صنف ${g}` : `Grade ${g}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Grade Tracks List */}
        <View style={{ gap: 20 }}>
          {filteredTracks.map((item) => {
            const title = isPersian ? item.faTitle : item.title;
            const desc = isPersian ? item.faDescription : item.description;
            const facultyName = isPersian ? item.faFacultyName : item.facultyName;
            const facultyBio = isPersian ? item.faFacultyBio : item.facultyBio;
            const subjects = isPersian ? item.faSubjects : item.subjects;
            const keyTopics = isPersian ? item.faKeyTopics : item.keyTopics;

            return (
              <View
                key={item.grade}
                style={{
                  backgroundColor: isDark ? 'rgba(30, 41, 59, 0.48)' : 'rgba(255, 255, 255, 0.85)',
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(250, 204, 21, 0.24)' : 'rgba(226, 232, 240, 0.9)',
                  overflow: 'hidden',
                  shadowColor: '#000',
                  shadowOpacity: isDark ? 0.25 : 0.06,
                  shadowOffset: { width: 0, height: 6 },
                  shadowRadius: 18,
                  elevation: 5,
                  ...(Platform.OS === 'web'
                    ? { backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }
                    : {}) as any,
                }}
              >
                {/* Upper Split Card: Cover & Faculty Information */}
                <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', padding: 12, gap: 12, height: 195 }}>
                  <View style={{ flex: 1, borderRadius: 18, overflow: 'hidden', position: 'relative', backgroundColor: colors.bg, borderWidth: 1, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }}>
                    <Image source={{ uri: item.coverUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    <View style={{ position: 'absolute', top: 8, left: isPersian ? undefined : 8, right: isPersian ? 8 : undefined, backgroundColor: isDark ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.9)', borderRadius: 99, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.4)' }}>
                      <Text style={{ color: colors.gold, fontSize: 9, fontWeight: '800' }}>
                        {isPersian ? `صنف ${item.grade} معارف` : `GRADE ${item.grade}`}
                      </Text>
                    </View>
                    <View style={{ position: 'absolute', bottom: 8, left: isPersian ? undefined : 8, right: isPersian ? 8 : undefined, backgroundColor: isDark ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.9)', borderRadius: 99, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.35)' }}>
                      <Text style={{ color: colors.gold, fontSize: 9, fontWeight: '800' }}>
                        {isPersian ? 'نصاب رسمی وزارت' : 'Official Syllabus'}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flex: 1, borderRadius: 18, backgroundColor: isDark ? 'rgba(15, 23, 42, 0.55)' : 'rgba(248, 250, 252, 0.75)', borderWidth: 1, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.85)', padding: 12, justifyContent: 'space-between' }}>
                    <View>
                      <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isDark ? 'rgba(250, 204, 21, 0.15)' : 'rgba(250, 204, 21, 0.2)', borderWidth: 1, borderColor: colors.goldBorder, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ color: colors.gold, fontSize: 11, fontWeight: '800' }}>{item.grade}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: colors.gold, fontSize: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6, textAlign: isPersian ? 'right' : 'left' }}>
                            {isPersian ? 'کادر آموزشی صنف' : 'GRADE FACULTY'}
                          </Text>
                          <Text style={{ color: colors.text, fontSize: 12, fontWeight: '800', textAlign: isPersian ? 'right' : 'left' }} numberOfLines={1}>
                            {facultyName}
                          </Text>
                        </View>
                      </View>
                      <Text style={{ color: colors.textSecondary, fontSize: 10, lineHeight: 15, fontStyle: 'italic', textAlign: isPersian ? 'right' : 'left' }} numberOfLines={4}>
                        "{facultyBio}"
                      </Text>
                    </View>
                    <View style={{ alignSelf: isPersian ? 'flex-end' : 'flex-start', backgroundColor: isDark ? 'rgba(250, 204, 21, 0.1)' : 'rgba(250, 204, 21, 0.15)', borderWidth: 1, borderColor: colors.goldBorder, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ color: colors.gold, fontSize: 8.5, fontWeight: '800' }}>
                        {isPersian ? 'معلمان تأییدشده' : 'Certified Teachers'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Lower Card: Title, Subjects & Key Topics */}
                <View style={{ paddingHorizontal: 16, paddingBottom: 16, paddingTop: 4 }}>
                  <Text style={{ color: colors.text, fontWeight: '800', fontSize: 17, marginBottom: 6, lineHeight: 24, textAlign: isPersian ? 'right' : 'left' }}>
                    {title}
                  </Text>

                  {/* Subject Pills */}
                  <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
                    {subjects.map((sub, sIdx) => (
                      <View key={sIdx} style={{ backgroundColor: colors.cardHover, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: colors.cardBorder }}>
                        <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '600' }}>{sub}</Text>
                      </View>
                    ))}
                  </View>

                  <Text style={{ color: colors.textSecondary, fontSize: 12.5, lineHeight: 19, marginBottom: 12, textAlign: isPersian ? 'right' : 'left' }} numberOfLines={2}>
                    {desc}
                  </Text>

                  {/* Key Syllabus Topics */}
                  <View style={{ backgroundColor: isDark ? 'rgba(15, 23, 42, 0.4)' : 'rgba(241, 245, 249, 0.65)', borderRadius: 14, borderWidth: 1, borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(226, 232, 240, 0.8)', padding: 12, marginBottom: 14 }}>
                    <Text style={{ color: colors.gold, fontSize: 10, fontWeight: '800', marginBottom: 6, letterSpacing: 0.8, textAlign: isPersian ? 'right' : 'left' }}>
                      {isPersian ? 'محورهای اصلی برنامه درسی:' : 'CORE SYLLABUS TOPICS:'}
                    </Text>
                    {keyTopics.map((topic, tIdx) => (
                      <View key={tIdx} style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'center', paddingVertical: 2 }}>
                        <Text style={{ color: colors.text, fontSize: 11.5, textAlign: isPersian ? 'right' : 'left' }}>
                          • {topic}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Actions: Email Registration */}
                  <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', gap: 10 }}>
                    <TouchableOpacity
                      onPress={() => handleOpenEmailApplication(item.grade)}
                      activeOpacity={0.85}
                      style={{
                        flex: 1,
                        backgroundColor: colors.primary,
                        borderRadius: 14,
                        paddingVertical: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12.5 }}>
                        {isPersian ? `ارسال درخواست ثبت‌نام صنف ${item.grade} (ایمیل)` : `Apply via Email for Grade ${item.grade}`}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Confidential Admissions Direct Help Card */}
        <View
          style={{
            marginTop: 28,
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.7)' : 'rgba(248, 250, 252, 0.85)',
            borderWidth: 1,
            borderColor: colors.goldBorder,
            borderRadius: 20,
            padding: 20,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 15, marginBottom: 6, textAlign: 'center' }}>
            {isPersian ? 'دفتر پذیرش محرمانه مکتب دختران' : 'Confidential Admissions Desk'}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12.5, lineHeight: 20, textAlign: 'center', marginBottom: 14 }}>
            {isPersian
              ? 'اگر سوال یا مشکلی در ارسال اطلاعات دارید، می‌توانید مستقیماً به آدرس ایمیل زیر پیام دهید تا همکاران ما پرونده تحصیلی متعلم را تنظیم کنند:'
              : 'For direct inquiry, registration verification, or assistance, reach our admissions team directly at:'}
          </Text>
          <TouchableOpacity
            onPress={() => Linking.openURL('mailto:info@farukh.org?subject=Inquiry%20Regarding%20Afghan%20Girls%20School')}
            style={{
              backgroundColor: isDark ? 'rgba(250, 204, 21, 0.15)' : 'rgba(250, 204, 21, 0.25)',
              borderWidth: 1,
              borderColor: colors.goldBorder,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 99,
            }}
          >
            <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 13 }}>
              info@farukh.org
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}
