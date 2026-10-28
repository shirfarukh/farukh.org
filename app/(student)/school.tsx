import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  Modal,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { doc, getDoc } from '@firebase/firestore';
import { ScreenWrapper } from '../../src/components/ui/ScreenWrapper';
import { useTheme } from '../../src/features/theme/ThemeContext';
import { HeaderPreferences } from '../../src/components/ui/HeaderPreferences';
import { useAuth } from '../../src/features/auth/useAuth';
import { db } from '../../src/lib/firebase';
import { getUserSchoolApplications } from '../../src/features/school/schoolApplicationApi';
import {
  SCHOOL_GRADE_MATERIALS,
  SchoolGradeMaterials,
  SchoolGradeMaterialItem,
} from '../../src/data/schoolGradeMaterials';
import { TeacherApplicationModal } from '../../src/components/school/TeacherApplicationModal';

interface SeniorPathwayInfo {
  name: string;
  faName: string;
  desc: string;
  faDesc: string;
}

interface GradeTrack {
  grade: number;
  stage: 'foundation' | 'senior';
  stageLabel: string;
  faStageLabel: string;
  title: string;
  faTitle: string;
  description: string;
  faDescription: string;
  facultyName: string;
  faFacultyName: string;
  facultyBio: string;
  faFacultyBio: string;
  subjects: string[];
  faSubjects: string[];
  keyTopics: string[];
  faKeyTopics: string[];
  onlineImplementation: string[];
  faOnlineImplementation: string[];
  seniorPathways?: SeniorPathwayInfo[];
}

const GRADE_TRACKS: GradeTrack[] = [
  {
    grade: 7,
    stage: 'foundation',
    stageLabel: 'Foundation Stage (Grades 7–9)',
    faStageLabel: 'مقطع پایه‌ای متوسطه (صنوف ۷ الی ۹)',
    title: 'Grade 7: Core Foundations, Literacy & Digital Beginnings',
    faTitle: 'صنف هفتم: مبانی اکادمیک، سوادآموزی و ورود به دنیای دیجیتال',
    description: 'A foundational secondary year rebuilding academic literacy, numeracy, experimental science, social understanding, digital confidence, coding logic, and safe study habits.',
    faDescription: 'دوره بنیادین آموزشی جهت احیا و تعمیق سواد اکادمیک، ریاضیات، ساینس تجربی، درک جامعه، اعتمادبه‌نفس در فناوری دیجیتال و عادات یادگیری مستقل.',
    facultyName: 'Foundation Stage Academic Council',
    faFacultyName: 'هیئت اکادمیک مقطع پایه‌ای متوسطه',
    facultyBio: 'Certified online instructors dedicated to student-centered learning, interactive STEM, and digital literacy.',
    faFacultyBio: 'مدرسان برگزیده با تخصص در آموزش تعاملی مضامین ساینسی، زبان و سواد دیجیتال.',
    subjects: [
      'English Language',
      'Mathematics',
      'General Science',
      'Social Studies',
      'Dari / Pashto',
      'Digital Literacy',
      'Coding Foundations',
      'Life Skills',
      'Online Safety',
    ],
    faSubjects: [
      'زبان انگلیسی کاربردی',
      'ریاضیات پایه',
      'ساینس عمومی و تجربی',
      'مطالعات اجتماعی',
      'ادبیات دری و پشتو',
      'سواد دیجیتال و تایپینگ',
      'مبانی برنامه‌نویسی و بلاک‌کد',
      'مهارت‌های زندگی',
      'مصونیت و امنیت آنلاین',
    ],
    keyTopics: [
      'Basic grammar, vocabulary & short reading comprehension',
      'Numbers, fractions, decimals, percentages, ratios & basic geometry',
      'Living things, body basics, matter, energy & safe home observations',
      'Afghanistan geography, world maps, community & active citizenship',
      'Reading, writing, storytelling & clear personal expression',
      'Device basics, touch typing, email etiquette & LMS navigation',
      'Logic, sequence, pattern recognition & block coding concepts',
      'Passwords, privacy settings, safe communication & reporting concerns',
    ],
    faKeyTopics: [
      'دستور زبان، واژگان و درک متون کوتاه',
      'کسرها، اعداد اعشاری، نسبت و تناسب و هندسه پایه',
      'موجودات زنده، ماده و انرژی و آزمایش‌های ایمن خانگی',
      'جغرافیای افغانستان، نقشه‌های جهان، جامعه و تعلیمات مدنی',
      'اصول کار با کمپیوتر، تایپ سریع، آموزش LMS و رفتار آنلاین',
      'منطق الگوریتم، الگوها، بلاک‌کدینگ و مفاهیم وب',
      'امنیت رمز عبور، حریم خصوصی، ارتباط محترمانه و گزارش‌دهی',
    ],
    onlineImplementation: [
      'Live speaking practice & recorded grammar lessons',
      'Online problem sets & personalized teacher feedback',
      'Video demonstrations & safe home science observations',
      'Map tasks, discussions & short student presentations',
      'Browser-based block coding exercises & mini-projects',
      'Weekly reflection, mentor check-in & guardian safety notes',
    ],
    faOnlineImplementation: [
      'تمرین مکالمه زنده و جلسات ویدیویی گرامر',
      'حل کاربرگ‌های تعاملی با بازخورد استاد',
      'آزمایش‌های تجربی ایمن در منزل و ویدیوهای شبیه‌ساز',
      'تحلیل نقشه، مباحثات کلاسی و ارائه‌های کوتاه',
      'تمرین‌های آنلاین کدنویسی در براوزر و مینی‌پروژه‌ها',
      'گزارش پیشرفت هفتگی، منتورینگ فردی و آگاهی اولیا',
    ],
  },
  {
    grade: 8,
    stage: 'foundation',
    stageLabel: 'Foundation Stage (Grades 7–9)',
    faStageLabel: 'مقطع پایه‌ای متوسطه (صنوف ۷ الی ۹)',
    title: 'Grade 8: Intermediate Secondary, Web Design & AI Awareness',
    faTitle: 'صنف هشتم: پیش‌لیسه، توسعه وب و آشنایی با هوش مصنوعی',
    description: 'Expanding secondary comprehension with linear equations, physical forces, chemical changes, HTML/CSS webpage design, and ethical AI awareness.',
    faDescription: 'گسترش درک مطلب اکادمیک، حل معادلات میانه، بررسی نیروها و تغییرات کیمیاوی، طراحی صفحات وب با HTML/CSS و سواد هوش مصنوعی.',
    facultyName: 'STEM & Digital Technologies Department',
    faFacultyName: 'دیپارتمنت علوم ساینسی و فناوری‌های نوین',
    facultyBio: 'Educators focusing on scientific inquiry, web development, and responsible AI literacy.',
    faFacultyBio: 'استادان باسابقه با تمرکز بر تفکر ساینسی، فناوری وب و مبانی اخلاق در هوش مصنوعی.',
    subjects: [
      'English Language',
      'Mathematics',
      'Science',
      'Social Studies',
      'Dari / Pashto',
      'Digital Literacy',
      'Coding and Web',
      'AI Awareness',
      'Life Skills',
    ],
    faSubjects: [
      'زبان انگلیسی پیشرفته',
      'ریاضیات و احصائیه',
      'فیزیک و کیمیا',
      'جغرافیای منطقوی و تمدن‌ها',
      'نگارش رسمی دری و پشتو',
      'ابزارهای تحقیق و اسناد دیجیتال',
      'طراحی وب (HTML & CSS)',
      'آشنایی با هوش مصنوعی (AI)',
      'مهارت‌های زندگی و کار تیمی',
    ],
    keyTopics: [
      'Reading comprehension, grammar accuracy, essay basics & speaking confidence',
      'Integers, linear equations, percentages, geometry, graphs & probability',
      'Cells, ecosystems, forces, electricity, chemical changes & climate science',
      'Regional geography, world civilizations, government basics & culture',
      'Formal writing, analytical summaries, speeches & classical literature',
      'Documents, slides, spreadsheets, academic research & source verification',
      'HTML & CSS basics, logical layout & personal learning webpage creation',
      'What AI is, safe usage, limits, ethics reflection & academic honesty',
    ],
    faKeyTopics: [
      'درک مطلب پیشرفته، دقت گرامری و اصول انشا',
      'اعداد صحیح، معادلات خطی، قضایای هندسی و رسم گراف',
      'حجرات، اکوسیستم، نیروها، جریان برق، تعاملات کیمیاوی و اقلیم',
      'جغرافیای منطقوی، تمدن‌های بشری، مبانی حکومت و فرهنگ',
      'نگارش رسمی، خلاصه‌نویسی، سخنرانی و شعر و ادب',
      'کدنویسی مقدماتی HTML و CSS و ساخت صفحه وب یادگیری',
      'تعریف هوش مصنوعی، کاربرد ایمن، محدودیت‌ها و صداقت علمی',
    ],
    onlineImplementation: [
      'Reading circles, pronunciation audio recordings & writing feedback',
      'Interactive whiteboard practice & weekly graded quizzes',
      'Simulations, safe household experiments & structured lab reports',
      'Timeline projects, geographical map tasks & online student debates',
      'Personal webpage development & code validation',
      'Ethics reflections & guided AI comparison tasks',
    ],
    faOnlineImplementation: [
      'حلقه‌های کتابخوانی، ضبط تلفظ صحیح و نقد نوشتار',
      'تمرینات تعاملی تخته سفید و کوییزهای هفتگی',
      'شبیه‌سازی‌های ساینسی مجازی و گزارش‌های منظم لابراتوار',
      'پروژه‌های گاه‌شمار تاریخی، تحلیل نقشه و مناظره آنلاین',
      'توسعه صفحه اختصاصی وبسایت و اعتبارسنجی کدها',
      'جلسات تحلیل اخلاقی هوش مصنوعی و ارزیابی پاسخ‌ها',
    ],
  },
  {
    grade: 9,
    stage: 'foundation',
    stageLabel: 'Foundation Stage Completion',
    faStageLabel: 'تکمیل مقطع متوسطه و فراغت',
    title: 'Grade 9: Middle School Capstone & High School Readiness',
    faTitle: 'صنف نهم: فراغت مقطع متوسطه، جاوااسکریپت و آمادگی لیسه',
    description: 'Middle school graduation capstone combining structured academic essays, linear algebra, integrated sciences, JavaScript, cyber safety, and senior pathway choice.',
    faDescription: 'سال نهایی مقطع متوسطه با ترکیب نگارش مقالات استدلالی، الجبر خطی، ساینس جامع، برنامه‌نویسی جاوااسکریپت و انتخاب رشته لیسه.',
    facultyName: 'Secondary Graduation & Academic Council',
    faFacultyName: 'شورای عالی فراغت متوسطه و آمادگی عالی',
    facultyBio: 'Senior academic mentors supervising secondary completion and pathway counseling.',
    faFacultyBio: 'منتوران و استادان ارشد ناظر بر فراغت دوره متوسطه و راهنمایی انتخاب رشته لیسه.',
    subjects: [
      'English Language',
      'Mathematics',
      'Integrated Science',
      'Social Studies',
      'Dari / Pashto',
      'Digital Literacy',
      'Computer Science',
      'AI and Future Tech',
      'Life Skills',
    ],
    faSubjects: [
      'انگلیسی اکادمیک و مقاله‌نویسی',
      'الجبر و هندسه تحلیلی',
      'ساینس یکپارچه (بیولوژی، کیمیا، فیزیک)',
      'تاریخ معاصر، اقتصاد و حقوق بشر',
      'سخنرانی، ترجمه و متون دری/پشتو',
      'تحقیق آنلاین و امنیت سایبری',
      'علوم کامپیوتر (JavaScript)',
      'هوش مصنوعی و فناوری‌های آینده',
      'رهبری و برنامه‌ریزی تحصیلی',
    ],
    keyTopics: [
      'Academic reading, structured essays, argument writing & oral presentations',
      'Algebra, linear equations, coordinate geometry, statistics & function graphs',
      'Biology systems, chemistry foundations & core physics principles',
      'Modern history, regional geography, civics, economics & human rights',
      'Academic writing, formal public speaking & translation fundamentals',
      'Online research, productivity tools, cyber safety & media literacy',
      'Algorithms, HTML/CSS, JavaScript introduction & structured data basics',
      'AI for learning, prompt engineering, bias identification & privacy ethics',
    ],
    faKeyTopics: [
      'خوانش اکادمیک، مقاله‌نویسی ساختاریافته، استدلال و دفاع شفاهی',
      'الجبر، حل معادلات خطی، هندسه مختصاتی و تحلیل آمار',
      'سیستم‌های بیولوژیکی، مبانی ساختار اتمی کیمیا و قوانین فیزیک',
      'تاریخ جهان معاصر، اقتصاد کاربردی، مدنی و حقوق بنیادین بشر',
      'نگارش اکادمیک، فن سخنوری و اصول ترجمه متون',
      'امنیت سایبری، ارزیابی اعتبار منابع، سواد رسانه‌ای و پورتفولیو',
      'الگوریتم‌ها، مبانی زبان جاوااسکریپت و ساختار داده‌ها',
      'مهندسی پرامپت در هوش مصنوعی، تشخیص سوگیری و حریم خصوصی',
    ],
    onlineImplementation: [
      'Writing workshops, timed reading evaluations & oral speech defense',
      'Weekly problem sets with teacher whiteboard walkthroughs',
      'Virtual science labs, quizzes & experimental research planning',
      'Case studies, statistical data analysis & civic discussions',
      'Hands-on coding exercises & interactive website project',
      'Responsible AI research assignments & individual learning plans',
    ],
    faOnlineImplementation: [
      'کارگاه‌های مقاله‌نویسی، آزمون‌های سرعت خواندن و دفاع شفاهی',
      'حل تمارین هفتگی الجبر با ویدیوهای تحلیلی گام‌به‌گام',
      'لابراتوارهای شبیه‌ساز ساینس، کوئیزها و طراحی آزمایش‌ها',
      'مطالعه موردی، تحلیل داده‌های اقتصادی و مباحثه مدنی',
      'تمرین‌های عملی کدنویسی و ساخت وب‌سایت تعاملی',
      'تکالیف پژوهشی اخلاقی با AI و تدوین برنامه یادگیری فردی',
    ],
  },
  {
    grade: 10,
    stage: 'senior',
    stageLabel: 'Senior Secondary Stage (Grades 10–12)',
    faStageLabel: 'مقطع عالی لیسه و پیش‌دانشگاهی (صنوف ۱۰ الی ۱۲)',
    title: 'Grade 10: Senior Secondary & Core International Tracks',
    faTitle: 'صنف دهم: آغاز مقطع لیسه و دروازه ورود به استانداردهای بین‌المللی',
    description: 'Senior high school initiation: advanced trigonometry, cellular genetics, chemical reactions, web applications, and foundational alignment with GED & IGCSE standards.',
    faDescription: 'آغاز مقطع عالی لیسه با مثلثات پیشرفته، ژنتیک سلولی، پیوندهای کیمیاوی، توسعه وب و آمادگی بنیادین برای آزمون‌های بین‌المللی GED و IGCSE.',
    facultyName: 'Senior High School & International Prep Faculty',
    faFacultyName: 'هیئت تخصصی دوره عالی لیسه و آمادگی بین‌المللی',
    facultyBio: 'University professors and certified international curriculum instructors.',
    faFacultyBio: 'استادان پوهنتون و مدرسان بین‌المللی با سابقه تدریس استانداردهای GED و کمبریج.',
    subjects: [
      'English Academic Skills',
      'Mathematics',
      'Biology',
      'Chemistry',
      'Physics',
      'Social Studies',
      'Computer Science / ICT',
      'AI and Ethics',
      'Dari / Pashto',
      'Life Skills',
    ],
    faSubjects: [
      'مهارت‌های اکادمیک زبان انگلیسی',
      'الجبر، مثلثات و آمادگی GED/IGCSE',
      'بیولوژی و ژنتیک انسانی',
      'کیمیا: اتوم‌ها، پیوندها و تعاملات',
      'فیزیک: میخانیک، انرژی و امواج',
      'تاریخ و اقتصاد جهانی',
      'علوم کامپیوتر و پایگاه داده',
      'هوش مصنوعی، اخلاق و صحت داده‌ها',
      'نگارش اکادمیک دری و پشتو',
      'مدیریت مالی، برنامه‌ریزی و رهبری',
    ],
    keyTopics: [
      'Essay writing, grammar mastery, reading analysis & presentations',
      'Algebra, functions, trigonometry, geometry & GED/IGCSE problems',
      'Cells, human biology, genetics basics & ecosystems',
      'Atoms, elements, compounds, reactions, acids & bases',
      'Motion, forces, 2D kinematics, energy, electricity & waves',
      'Algorithms, full-stack web basics, spreadsheets & databases',
      'AI literacy, privacy protection, bias detection & academic integrity',
    ],
    faKeyTopics: [
      'نگارش مقالات تخصصی، تسلط بر ساختار متن و فن بیان',
      'تحلیل توابع ریاضی، مثلثات، هندسه و مسائل استاندارد GED/IGCSE',
      'ساختار سلولی، بیولوژی بدن انسان، مبانی ژنتیک و بوم‌شناسی',
      'ساختار الکترونی اتم‌ها، پیوندها، تیزاب‌ها و قلوی‌ها',
      'سینماتیک در دو بعد، نیروها، انرژی، مدارهای برقی و امواج',
      'الگوریتم‌ها، فرانت‌اند و بک‌اند، اکسل پیشرفته و دیتابیس',
      'سواد داده در هوش مصنوعی، حریم خصوصی و صداقت اکادمیک',
    ],
    onlineImplementation: [
      'Writing clinic labs, reading quizzes & speech audio evaluations',
      'Timed practice tests and video solution walkthroughs',
      'Virtual chemistry simulations & safe experiment demonstrations',
      'Digital document analysis, map work & collaborative forums',
      'Coding labs with automated testing & project repositories',
      'One-on-one mentor meetings & student development planning',
    ],
    faOnlineImplementation: [
      'کلینیک نگارش، آزمون‌های درک مطلب و ارزیابی صوتی سخنرانی',
      'آزمون‌های زمان‌دار و ویدیوهای تشریح جامع حل تست',
      'شبیه‌سازی‌های مجازی کیمیا و آزمایش‌های مستند علمی',
      'تحلیل اسناد تاریخی، کار با اطلس‌های دیجیتال و تالار گفتگو',
      'لابراتوار کدنویسی با تست خودکار و ثبت پروژه‌ها در گیت‌هاب',
      'جلسات اختصاصی منتورینگ و تدوین نقشه راه آینده',
    ],
    seniorPathways: [
      {
        name: 'Pathway A: GED Preparation',
        faName: 'مسیر اول: آمادگی دیپلوم بین‌المللی GED',
        desc: 'Language Arts, Mathematical Reasoning, Science, Social Studies, and Digital Portfolio.',
        faDesc: 'مهارت‌های زبانی، استدلال ریاضی، ساینس، علوم اجتماعی و پورتفولیوی دیجیتال.',
      },
      {
        name: 'Pathway B: IGCSE-Style Academic Track',
        faName: 'مسیر دوم: آمادگی اکادمیک الهام‌گرفته از کمبریج (IGCSE)',
        desc: 'English, Mathematics, Sciences (Biology, Chemistry, Physics), Computer Science & Economics.',
        faDesc: 'انگلیسی، ریاضیات، ساینس تخصصی (فیزیک، کیمیا، بیولوژی)، علوم کامپیوتر و اقتصاد.',
      },
      {
        name: 'Pathway C: Digital Skills Plus',
        faName: 'مسیر سوم: مهارت‌های جامع دیجیتال و بازار کار بین‌المللی',
        desc: 'Web Development, UI/UX Design, Productivity Tools, AI Workflows & Freelancing Basics.',
        faDesc: 'توسعه وب، طراحی دیجیتال، ابزارهای کاربردی، ابزارهای هوش مصنوعی و فریلنسینگ آنلاین.',
      },
    ],
  },
  {
    grade: 11,
    stage: 'senior',
    stageLabel: 'Senior Secondary Stage (Grades 10–12)',
    faStageLabel: 'مقطع عالی لیسه و پیش‌دانشگاهی (صنوف ۱۰ الی ۱۲)',
    title: 'Grade 11: Pre-Diploma Specialization & University Pathways',
    faTitle: 'صنف یازدهم: پیش‌دیپلوم تخصصی، کارآفرینی و آمادگی پوهنتون',
    description: 'Rigorous pre-diploma preparation: calculus limits, organic chemistry, wave physics, entrepreneurship, cybersecurity, and university admissions portfolios.',
    faDescription: 'برنامه درسی تخصصی پیش‌دیپلوم: حسابان و حد، کیمیای عضوی، فیزیک امواج، کارآفرینی، امنیت سایبری و ساخت رزومه برای دانشگاه‌ها.',
    facultyName: 'Advanced Sciences & Career Pathways Board',
    faFacultyName: 'شورای عالی علوم پیشرفته و بورسیه‌های بین‌المللی',
    facultyBio: 'Coaches and educators guiding students toward university admissions and international scholarships.',
    faFacultyBio: 'استادان و مشاوران ارشد هدایت‌کننده شاگردان به سوی پذیرش در پوهنتون‌ها و بورسیه‌های جهانی.',
    subjects: [
      'English Language Arts',
      'Mathematics',
      'Science',
      'Social Studies',
      'Computer Science / ICT',
      'Business / Economics',
      'AI and Future Work',
      'Dari / Pashto',
      'Career Readiness',
    ],
    faSubjects: [
      'نگارش تحلیلی و ادبیات انگلیسی',
      'ریاضیات عالی و احتمالات (Algebra II)',
      'علوم ساینسی پیشرفته (فیزیک، کیمیا، بیولوژی)',
      'مدنی، اقتصاد، تاریخ و تحلیل منابع',
      'برنامه‌نویسی وب و امنیت سایبری',
      'اقتصاد، بازار و کارآفرینی دیجیتال',
      'اتوماسیون و ابزارهای آینده کار با AI',
      'پژوهش و مقاله‌نویسی دری و پشتو',
      'آمادگی شغلی، رزومه‌نویسی و مصاحبه',
    ],
    keyTopics: [
      'Argumentative essay writing, evidence synthesis & vocabulary mastery',
      'Algebra II, pre-calculus, functions, probability & statistics',
      'Biology systems, organic chemistry applications & physics problems',
      'Civics, macroeconomics, historical source evaluation & global affairs',
      'JavaScript, full-stack web applications & cybersecurity fundamentals',
      'Entrepreneurship, digital markets, financial budgeting & business plans',
      'AI productivity, workflow automation, ethics & future careers',
      'Resume / CV building, scholarship research, email etiquette & interview prep',
    ],
    faKeyTopics: [
      'نگارش مقالات استدلالی مستند، استنتاج شواهد و واژگان اکادمیک',
      'جبر ۲، مقدمات حسابان، تحلیل توابع و احتمالات پیشرفته',
      'سیستم‌های پیچیده بیولوژی، کیمیای هایدروکاربن‌ها و مسائل فیزیک',
      'اقتصاد کلان، مدنی، نقد و اعتبارسنجی منابع تاریخی و مسائل جهان',
      'جاوااسکریپت، اپلیکیشن‌های پویا و اصول امنیت اطلاعات',
      'کارآفرینی، بازارهای دیجیتال، بودجه‌بندی و تدوین بیزنس‌پلان',
      'بهره‌وری با ابزارهای هوش مصنوعی، اتوماسیون و مشاغل آینده',
      'ساخت رزومه حرفه‌ای، شناسایی بورسیه‌ها و مهارت‌های مصاحبه',
    ],
    onlineImplementation: [
      'GED-style reading and persuasive writing workshops',
      'Timed practice testing with automated progress analytics',
      'Virtual laboratory experiments, graphical data interpretation & reports',
      'Primary source analysis and collaborative presentations',
      'Building interactive full-stack websites or digital tools',
      'Online business plan projects and startup presentations',
      'Responsible AI portfolio assignments and mentor reviews',
    ],
    faOnlineImplementation: [
      'کارگاه‌های انشای تحلیلی متناسب با آزمون‌های بین‌المللی GED',
      'آزمون‌های تستی زمان‌دار همراه با آنالیز دیجیتال پیشرفت',
      'لابراتوارهای مجازی، تحلیل نمودارهای تجربی و ارائه گزارش علمی',
      'تحلیل اسناد دست اول تاریخی و کنفرانس‌های گروهی آنلاین',
      'پیاده‌سازی وب‌اپلیکیشن کاربردی یا ابزار دیجیتال در سبد کار',
      'تدوین طرح کارآفرینی و ارائه بیزنس‌پلان به صورت وبینار',
      'تولید پروژه‌های عملی با هوش مصنوعی و ارزیابی تخصصی منتور',
    ],
    seniorPathways: [
      {
        name: 'Pathway A: GED Preparation',
        faName: 'مسیر اول: آمادگی دیپلوم بین‌المللی GED',
        desc: 'Advanced Language Arts, Mathematical Reasoning, Science, and University Guidance.',
        faDesc: 'استدلال زبانی پیشرفته، محاسبات و استدلال ریاضی، ساینس تخصصی و راهنمایی پذیرش.',
      },
      {
        name: 'Pathway B: IGCSE-Style Academic Track',
        faName: 'مسیر دوم: آمادگی اکادمیک الهام‌گرفته از کمبریج (IGCSE)',
        desc: 'Comprehensive syllabus in Mathematics, Physics, Chemistry, Biology & Economics.',
        faDesc: 'نصاب جامع ریاضیات، فیزیک، کیمیا، بیولوژی و مبانی اقتصاد بین‌المللی.',
      },
      {
        name: 'Pathway C: Digital Skills Plus',
        faName: 'مسیر سوم: مهارت‌های جامع دیجیتال و بازار کار بین‌المللی',
        desc: 'Full-stack Web Dev, Data Management, Cloud Basics, Automation & Remote Work Skills.',
        faDesc: 'توسعه وب، مدیریت داده‌ها، مبانی رایانش ابری، اتوماسیون و مهارت‌های کار از راه دور.',
      },
    ],
  },
  {
    grade: 12,
    stage: 'senior',
    stageLabel: 'Graduation Capstone & Global Baccalaureate',
    faStageLabel: 'دیپلوم فراغت، پورتفولیوی نهایی و پذیرش دانشگاه',
    title: 'Grade 12: High School Capstone, Portfolios & Global Access',
    faTitle: 'صنف دوازدهم: دیپلوم فراغت، پورتفولیوی بین‌المللی و بورسیه‌ها',
    description: 'Graduation capstone: university SOPs, calculus, nuclear physics, live digital portfolio defense, AI research, leadership project, and scholarship applications.',
    faDescription: 'سال نهایی فراغت: انگیزه‌نامه دانشگاهی، حسابان دیفرانسیل و انتگرال، فیزیک اتومی و هسته‌ای، دفاع از پورتفولیوی دیجیتال، پژوهش با AI، پروژه رهبری و اخذ بورسیه‌ها.',
    facultyName: 'Graduation Capstone & Global Admissions Board',
    faFacultyName: 'شورای عالی فراغت، دیپلوم بکلوریا و پذیرش دانشگاهی',
    facultyBio: 'Admissions advisors and senior professors dedicated to university placements, scholarships, and international credentials.',
    faFacultyBio: 'مشاوران ارشد پذیرش دانشگاهی و استادان متخصص در بورسیه‌های معتبر بین‌المللی و دیپلوم‌های معتبر جهانی.',
    subjects: [
      'English for University',
      'Mathematics for Exams',
      'Science for Exams',
      'Social Studies for Exams',
      'Digital Portfolio',
      'AI and Research Skills',
      'Leadership Project',
      'Career and University Readiness',
      'Safeguarding and Wellbeing',
    ],
    faSubjects: [
      'انگلیسی دانشگاهی و نگارش SOP',
      'ریاضیات جامع، حسابان و کانکور/GED',
      'علوم ساینسی جامع امتحانات',
      'مطالعات اجتماعی و اقتصادی نهایی',
      'پورتفولیوی دیجیتال و وبسایت پایانی',
      'پژوهش علمی و سواد پژوهش با AI',
      'پروژه رهبری و دادخواهی آموزش دختران',
      'آمادگی دانشگاه، پذیرش و بورسیه‌ها',
      'مصونیت، حمایت روانی و سلامت ذهن',
    ],
    keyTopics: [
      'Academic essays, Statement of Purpose (SOP) & research papers',
      'Calculus (derivatives & integrals), data, geometry & applied exam questions',
      'Modern physics, nuclear energy, comprehensive chemistry & biology reasoning',
      'History, civics, economics, geography & analytical document evaluation',
      'Final website, coding capstone project, digital CV & online portfolio',
      'Ethical AI research, source verification & academic productivity',
      'Girls’ education advocacy, community service & peer mentoring',
      'University scholarships, application packages, interview mastery & financial planning',
    ],
    faKeyTopics: [
      'نگارش مقالات دانشگاهی، انگیزه‌نامه تحصیلی (SOP) و چکیده پژوهش',
      'حسابان (مشتق و انتگرال)، تحلیل داده‌ها و سوالات کاربردی امتحانات',
      'فیزیک نوین و هسته‌ای، تعاملات جامع کیمیا و استدلال‌های بیولوژیکی',
      'تاریخ، اقتصاد، مدنی، تحلیل اسناد و جغرافیای تحلیلی جهان',
      'طراحی وب‌سایت نهایی، پروژه پایانی برنامه‌نویسی، رزومه دیجیتال زنده',
      'پژوهش اخلاقی، اعتبارسنجی منابع علمی و استفاده موثر از هوش مصنوعی',
      'پروژه عملی دادخواهی آموزش دختران، خدمت به جامعه و منتورینگ همسالان',
      'بسته‌های درخواست بورسیه، تکنیک‌های مصاحبه دانشگاهی و برنامه‌ریزی مالی',
    ],
    onlineImplementation: [
      'University writing clinic and personalized SOP revision',
      'Full-length mock exams (GED, IGCSE, Kankor) & remediation sessions',
      'Exam science practice, virtual lab experiments & comprehensive reports',
      'Source-based historical analysis & economic policy debates',
      'Final capstone website project defense before an academic committee',
      'Original research paper with ethical AI citation log',
      'Community leadership campaign or online mentoring initiative',
      'Complete university application package & mock interview panels',
    ],
    faOnlineImplementation: [
      'کلینیک نگارش دانشگاهی و بازبینی تخصصی و فردی انگیزه‌نامه (SOP)',
      'برگزاری آزمون‌های آزمایشی جامع شبیه‌ساز (GED، کانکور، IGCSE)',
      'تمرینات فشرده ساینسی، لابراتوار مجازی و ارائه گزارش‌های جامع',
      'تحلیل اسناد تاریخی بر اساس شواهد و مناظرات سیاست‌گذاری اقتصادی',
      'ارائه و دفاع زنده از پروژه وبسایت و پورتفولیو در برابر کمیته داوران',
      'نگارش مقاله پژوهشی با ثبت گزارش کاربری اخلاقی از ابزارهای AI',
      'اجرای کمپین رهبری آموزش دختران یا منتورینگ آنلاین برای شاگردان صنوف پایین‌تر',
      'تکمیل کامل پرونده درخواست بورسیه و شرکت در جلسات شبیه‌ساز مصاحبه',
    ],
    seniorPathways: [
      {
        name: 'Pathway A: GED Preparation',
        faName: 'مسیر اول: آمادگی دیپلوم بین‌المللی GED',
        desc: 'Official GED test mastery, university application portfolio, and credential verification.',
        faDesc: 'تسلط بر آزمون‌های رسمی GED، پرونده اپلای دانشگاه و تایید مدارک بین‌المللی.',
      },
      {
        name: 'Pathway B: IGCSE-Style Academic Track',
        faName: 'مسیر دوم: آمادگی اکادمیک الهام‌گرفته از کمبریج (IGCSE)',
        desc: 'Rigorous exam preparation in Sciences, Math, Literature & Economics for international diplomas.',
        faDesc: 'آمادگی فشرده ساینس، ریاضیات، ادبیات و اقتصاد برای اخذ دیپلوم‌های بین‌المللی.',
      },
      {
        name: 'Pathway C: Digital Skills Plus',
        faName: 'مسیر سوم: مهارت‌های جامع دیجیتال و بازار کار بین‌المللی',
        desc: 'Portfolio defense, professional certifications, freelancing setup & international remote careers.',
        faDesc: 'دفاع از پورتفولیو، گواهینامه‌های حرفه‌ای، فعالیت در پلتفرم‌های فریلنسینگ و کار ریموت.',
      },
    ],
  },
];

export default function SchoolClassesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ grade?: string }>();
  const { i18n } = useTranslation();
  const { colors, isDark } = useTheme();
  const isPersian = i18n.language?.startsWith('fa');
  const { user, isAdmin, login, logout, isSchoolTeacher, schoolTeacherApprovedGrades } = useAuth();

  const initialGrade = params.grade ? parseInt(params.grade, 10) : null;
  const [selectedGrade, setSelectedGrade] = useState<number | null>(initialGrade && !isNaN(initialGrade) ? initialGrade : null);

  // Teacher Application Modal State
  const [showTeacherModal, setShowTeacherModal] = useState(false);

  // In-app Material Reader / Viewer Modal State (Replaces external links)
  const [previewMaterial, setPreviewMaterial] = useState<SchoolGradeMaterialItem | null>(null);

  // Student Portal Login Form State
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccessNotice, setLoginSuccessNotice] = useState<string | null>(null);

  // Active in-dashboard classroom tab for enrolled student
  const [dashClassroomTab, setDashClassroomTab] = useState<'textbooks' | 'videos' | 'quizzes' | 'timetable'>('textbooks');

  // Active grade for learning materials hub modal
  const [activeMaterialGrade, setActiveMaterialGrade] = useState<number | null>(null);
  const [activeMaterialTab, setActiveMaterialTab] = useState<'textbooks' | 'videos' | 'quizzes'>('textbooks');

  // Active curriculum framework view tab
  const [activeCurriculumTab, setActiveCurriculumTab] = useState<'stages' | 'pathways' | 'delivery' | 'time'>('stages');

  // Query user applications
  const { data: userApplications = [], isLoading: isLoadingApps } = useQuery({
    queryKey: ['userSchoolApplications', user?.uid, user?.email],
    queryFn: () => getUserSchoolApplications(user?.uid, user?.email || undefined),
    enabled: !!(user?.uid || user?.email),
  });

  // Query user profile doc for approvedSchoolGrades
  const { data: userProfile } = useQuery({
    queryKey: ['userProfile', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null;
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        return snap.exists() ? snap.data() : null;
      } catch {
        return null;
      }
    },
    enabled: !!user?.uid,
  });

  // Calculate approved grades (STRICTLY limited to the student's accepted requested grade)
  const approvedGrades = useMemo(() => {
    if (isAdmin) {
      // System administrator has preview access to review all 6 grades
      return [7, 8, 9, 10, 11, 12];
    }

    const set = new Set<number>();

    // 1. Accepted application: strictly unlocks ONLY the specific grade the student applied for and was accepted into
    userApplications.forEach((app) => {
      if (app.status === 'accepted' && app.targetGrade) {
        set.add(Number(app.targetGrade));
      }
    });

    // 2. If no applications loaded yet, fallback to userProfile only for single requested grade
    if (set.size === 0 && userProfile?.approvedSchoolGrades && Array.isArray(userProfile.approvedSchoolGrades)) {
      const explicitRequested = userProfile?.targetGrade || userProfile?.schoolGrade || userProfile?.requestedGrade;
      if (explicitRequested && userProfile.approvedSchoolGrades.includes(Number(explicitRequested))) {
        set.add(Number(explicitRequested));
      } else if (userProfile.approvedSchoolGrades.length > 0) {
        // Enforce strict single-grade isolation: take only the first approved grade
        set.add(Number(userProfile.approvedSchoolGrades[0]));
      }
    }

    return Array.from(set);
  }, [userProfile, userApplications, isAdmin]);

  // Secure handler to ensure student can only open materials for their requested & approved grade
  const handleOpenGradeMaterials = (grade: number) => {
    const isAllowed = approvedGrades.includes(grade) || isAdmin;
    if (!isAllowed) {
      const enrolledStr = approvedGrades.length > 0 ? `صنف ${approvedGrades[0]}` : 'صنف درخواست‌شده';
      const msg = isPersian
        ? `دسترسی غیرمجاز: شما فقط به ${enrolledStr} دسترسی دارید و نمی‌توانید به مواد درسی صنف ${grade} دسترسی داشته باشید.`
        : `Access Restricted: You are only authorized to access ${enrolledStr}. You cannot access Grade ${grade}.`;
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(msg);
      } else {
        Alert.alert(isPersian ? 'عدم دسترسی' : 'Access Restricted', msg);
      }
      return;
    }
    setActiveMaterialGrade(grade);
  };

  // Calculate pending review grades
  const pendingGrades = useMemo(() => {
    return userApplications
      .filter((app) => app.status === 'pending' || app.status === 'reviewing')
      .map((app) => Number(app.targetGrade));
  }, [userApplications]);

  // Primary school application and student details
  const primaryApp = userApplications.length > 0 ? userApplications[0] : null;
  const derivedStudentId =
    primaryApp?.referenceNumber ||
    (user?.email?.split('@')[0]?.toUpperCase().startsWith('FOE-')
      ? user.email.split('@')[0].toUpperCase()
      : user?.displayName && user.displayName.startsWith('FOE-')
      ? user.displayName
      : null);
  const studentDisplayName =
    primaryApp?.studentFullName ||
    user?.displayName ||
    user?.email?.split('@')[0] ||
    (isPersian ? 'شاگرد مکتب' : 'Student');
  const activeEnrolledGrade =
    approvedGrades.length > 0
      ? approvedGrades[0]
      : primaryApp?.status === 'accepted'
      ? Number(primaryApp.targetGrade)
      : null;
  const enrolledMaterials = activeEnrolledGrade ? SCHOOL_GRADE_MATERIALS[activeEnrolledGrade] : null;

  const handleStudentLogin = async () => {
    setLoginError(null);
    setLoginSuccessNotice(null);
    const trimmedUser = usernameInput.trim();
    const trimmedPass = passwordInput.trim();

    if (!trimmedUser) {
      setLoginError(isPersian ? 'لطفاً نام کاربری یا شناسه شاگردی (مانند FOE-2026-XXXX) را وارد نمایید.' : 'Please enter your username or Student ID.');
      return;
    }
    if (!trimmedPass) {
      setLoginError(isPersian ? 'لطفاً رمز عبور را وارد نمایید.' : 'Please enter your password.');
      return;
    }

    setIsLoggingIn(true);
    try {
      await login(trimmedUser, trimmedPass);
      setLoginSuccessNotice(isPersian ? 'ورود با موفقیت انجام شد. خوش آمدید!' : 'Logged in successfully. Welcome!');
      setUsernameInput('');
      setPasswordInput('');
      router.replace('/(student)/school');
    } catch (err: any) {
      console.error('Student login error:', err);
      let msg = isPersian ? 'نام کاربری یا رمز عبور اشتباه است.' : 'Invalid username or password.';
      if (err?.code === 'auth/wrong-password') {
        msg = isPersian ? 'رمز عبور وارد شده نادرست است.' : 'Incorrect password.';
      } else if (err?.code === 'auth/user-not-found') {
        msg = isPersian ? 'شناسه شاگردی یافت نشد. لطفاً در صورت عدم ثبت‌نام، ابتدا فورم را ارسال کنید.' : 'Student ID not found. Please register first.';
      } else if (err?.message) {
        msg = err.message;
      }
      setLoginError(msg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleStudentLogout = async () => {
    try {
      await logout();
      setLoginSuccessNotice(null);
      setLoginError(null);
    } catch (err) {
      console.warn('Logout failed:', err);
    }
  };

  const displayedTracks = selectedGrade
    ? GRADE_TRACKS.filter((t) => t.grade === selectedGrade)
    : GRADE_TRACKS;

  const isModalGradeAllowed = activeMaterialGrade !== null && (approvedGrades.includes(activeMaterialGrade) || isAdmin);

  const currentGradeMaterials: SchoolGradeMaterials | null = (isModalGradeAllowed && activeMaterialGrade)
    ? SCHOOL_GRADE_MATERIALS[activeMaterialGrade] || null
    : null;

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header Navigation Bar */}
        <View
          style={{
            flexDirection: isPersian ? 'row-reverse' : 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <TouchableOpacity
            onPress={() => router.push('/(student)')}
            activeOpacity={0.8}
            style={{
              flexDirection: isPersian ? 'row-reverse' : 'row',
              alignItems: 'center',
              gap: 8,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 12,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.card,
              borderWidth: 1,
              borderColor: colors.cardBorder,
            }}
          >
            <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 13 }}>
              {isPersian ? '← بازگشت به کاتالوگ دوره‌ها' : '← Back to Catalog'}
            </Text>
          </TouchableOpacity>

          <HeaderPreferences />
        </View>

        {/* 1. School Student Portal Login Card (Shown when not logged in) */}
        {!user && (
          <View
            style={{
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.88)' : '#FFFFFF',
              borderRadius: 24,
              borderWidth: 2,
              borderColor: colors.gold,
              padding: 24,
              marginBottom: 24,
              shadowColor: colors.gold,
              shadowOpacity: isDark ? 0.35 : 0.15,
              shadowOffset: { width: 0, height: 6 },
              shadowRadius: 20,
              elevation: 6,
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: isPersian ? 'row-reverse' : 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 14,
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'center', gap: 10 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: isDark ? 'rgba(250, 204, 21, 0.2)' : 'rgba(250, 204, 21, 0.15)',
                    borderWidth: 1.5,
                    borderColor: colors.gold,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 22 }}>🎓</Text>
                </View>
                <View>
                  <Text style={{ color: colors.text, fontSize: 18, fontWeight: '900', textAlign: isPersian ? 'right' : 'left' }}>
                    {isPersian ? 'ورود شاگردان به صنف درسی (مکتب دختران)' : 'School Student Classroom Login'}
                  </Text>
                  <Text style={{ color: colors.gold, fontSize: 12, fontWeight: '700', textAlign: isPersian ? 'right' : 'left' }}>
                    {isPersian ? 'دسترسی سریع با شناسه شاگردی (آیدی FOE) و رمز عبور' : 'Access with Student ID (FOE-XXXX) & Password'}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', gap: 8, flexWrap: 'wrap' }}>
                <TouchableOpacity
                  onPress={() => router.push('/(student)/apply')}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 10,
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                  }}
                >
                  <Text style={{ color: colors.gold, fontSize: 12, fontWeight: '800' }}>
                    📝 {isPersian ? 'ثبت‌نام شاگرد' : 'Apply for Admission'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowTeacherModal(true)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 10,
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    borderWidth: 1,
                    borderColor: '#F59E0B',
                  }}
                >
                  <Text style={{ color: '#FCD34D', fontSize: 12, fontWeight: '800' }}>
                    👩‍🏫 {isPersian ? 'درخواست تدریس' : 'Request to Teach'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 13,
                lineHeight: 21,
                marginBottom: 18,
                textAlign: isPersian ? 'right' : 'left',
              }}
            >
              {isPersian
                ? 'شاگردانی که قبلاً فورم ثبت‌نام مکتب را ارسال کرده‌اند، می‌توانند با شناسه اختصاصی شاگردی (مانند FOE-2026-XXXX یا ایمیل) و رمز عبور خود مستقیماً وارد صنف درسی، کتب و ویدیوهای تدریس شوند.'
                : 'Students who completed the admission form can log in directly with their Student ID (e.g. FOE-2026-XXXX) or email and password to access textbooks, lessons, and timetable.'}
            </Text>

            {/* Inputs Grid */}
            <View style={{ gap: 14, marginBottom: 16 }}>
              {/* Username / Student ID Input */}
              <View>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 12.5,
                    fontWeight: '800',
                    marginBottom: 6,
                    textAlign: isPersian ? 'right' : 'left',
                  }}
                >
                  {isPersian ? 'نام کاربری یا شناسه شاگردی (Student ID):' : 'Username or Student ID:'}
                </Text>
                <TextInput
                  value={usernameInput}
                  onChangeText={setUsernameInput}
                  placeholder={isPersian ? 'مثال: FOE-2026-1234 یا ایمیل شاگرد' : 'e.g. FOE-2026-1234 or student email'}
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{
                    backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC',
                    borderWidth: 1.5,
                    borderColor: colors.cardBorder,
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    color: colors.text,
                    fontSize: 14,
                    textAlign: isPersian ? 'right' : 'left',
                  }}
                />
              </View>

              {/* Password Input */}
              <View>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 12.5,
                    fontWeight: '800',
                    marginBottom: 6,
                    textAlign: isPersian ? 'right' : 'left',
                  }}
                >
                  {isPersian ? 'رمز عبور صنف درسی:' : 'Classroom Password:'}
                </Text>
                <View
                  style={{
                    flexDirection: isPersian ? 'row-reverse' : 'row',
                    alignItems: 'center',
                    backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC',
                    borderWidth: 1.5,
                    borderColor: colors.cardBorder,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                  }}
                >
                  <TextInput
                    value={passwordInput}
                    onChangeText={setPasswordInput}
                    secureTextEntry={!showPassword}
                    placeholder={isPersian ? 'رمز عبور انتخابی شما در زمان ثبت‌نام' : 'Your password set during application'}
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      color: colors.text,
                      fontSize: 14,
                      textAlign: isPersian ? 'right' : 'left',
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={{ padding: 6 }}
                  >
                    <Text style={{ fontSize: 16 }}>{showPassword ? '👁️' : '🔒'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Error Banner */}
            {loginError && (
              <View
                style={{
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                  borderColor: '#EF4444',
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 14,
                  flexDirection: isPersian ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Text style={{ fontSize: 16 }}>⚠️</Text>
                <Text style={{ color: '#EF4444', fontSize: 12.5, fontWeight: '700', flex: 1, textAlign: isPersian ? 'right' : 'left' }}>
                  {loginError}
                </Text>
              </View>
            )}

            {/* Success Notice */}
            {loginSuccessNotice && (
              <View
                style={{
                  backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)',
                  borderColor: colors.success,
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 14,
                  flexDirection: isPersian ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Text style={{ fontSize: 16 }}>✅</Text>
                <Text style={{ color: colors.success, fontSize: 12.5, fontWeight: '700', flex: 1, textAlign: isPersian ? 'right' : 'left' }}>
                  {loginSuccessNotice}
                </Text>
              </View>
            )}

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleStudentLogin}
              disabled={isLoggingIn}
              style={{
                backgroundColor: colors.gold,
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: isPersian ? 'row-reverse' : 'row',
                gap: 8,
                shadowColor: colors.gold,
                shadowOpacity: 0.35,
                shadowOffset: { width: 0, height: 4 },
                shadowRadius: 10,
                elevation: 4,
                opacity: isLoggingIn ? 0.7 : 1,
              }}
            >
              {isLoggingIn ? (
                <ActivityIndicator size="small" color={isDark ? '#0F172A' : '#FFFFFF'} />
              ) : (
                <>
                  <Text style={{ fontSize: 16 }}>🔐</Text>
                  <Text style={{ color: isDark ? '#0F172A' : '#FFFFFF', fontWeight: '900', fontSize: 14.5 }}>
                    {isPersian ? 'ورود به صنف درسی مکتب' : 'Log In to Classroom'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* 2. Approved Student Classroom Dashboard (Shown when logged in and enrolled) */}
        {user && activeEnrolledGrade && (
          <View
            style={{
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.88)' : '#FFFFFF',
              borderRadius: 24,
              borderWidth: 2,
              borderColor: colors.success,
              padding: 24,
              marginBottom: 24,
              shadowColor: colors.success,
              shadowOpacity: isDark ? 0.3 : 0.15,
              shadowOffset: { width: 0, height: 6 },
              shadowRadius: 18,
              elevation: 5,
            }}
          >
            {/* Student Profile Header */}
            <View
              style={{
                flexDirection: isPersian ? 'row-reverse' : 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: 16,
                marginBottom: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.cardBorder,
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.12)',
                    borderWidth: 2,
                    borderColor: colors.success,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 24 }}>🎓</Text>
                </View>
                <View>
                  <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ color: colors.text, fontSize: 18, fontWeight: '900', textAlign: isPersian ? 'right' : 'left' }}>
                      {studentDisplayName}
                    </Text>
                    <View
                      style={{
                        backgroundColor: 'rgba(34, 197, 94, 0.15)',
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 99,
                        borderWidth: 1,
                        borderColor: colors.success,
                      }}
                    >
                      <Text style={{ color: colors.success, fontSize: 11, fontWeight: '800' }}>
                        ✓ {isPersian ? 'شاگرد رسمی' : 'Enrolled Student'}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
                    {derivedStudentId && (
                      <Text style={{ color: colors.gold, fontSize: 12, fontWeight: '800' }}>
                        🆔 {derivedStudentId}
                      </Text>
                    )}
                    <Text style={{ color: colors.textMuted, fontSize: 11 }}>•</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700' }}>
                      {isPersian ? `صنف ${activeEnrolledGrade} نصاب ملی معارف` : `Grade ${activeEnrolledGrade} National Curriculum`}
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleStudentLogout}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 12,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  flexDirection: isPersian ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Text style={{ fontSize: 14 }}>🚪</Text>
                <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 12 }}>
                  {isPersian ? 'خروج از حساب' : 'Log Out'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Classroom Hub Tabs */}
            <View
              style={{
                flexDirection: isPersian ? 'row-reverse' : 'row',
                flexWrap: 'wrap',
                gap: 8,
                marginBottom: 16,
              }}
            >
              {[
                { key: 'textbooks', fa: `📖 کتب درسی (${enrolledMaterials?.textbooks.length || 0})`, en: `📖 Textbooks (${enrolledMaterials?.textbooks.length || 0})` },
                { key: 'videos', fa: `🎥 ویدیوهای آموزشی (${enrolledMaterials?.videoLessons.length || 0})`, en: `🎥 Video Lessons (${enrolledMaterials?.videoLessons.length || 0})` },
                { key: 'quizzes', fa: `📝 خودسنجی و آزمون (${enrolledMaterials?.practiceQuizzes.length || 0})`, en: `📝 Practice Exams (${enrolledMaterials?.practiceQuizzes.length || 0})` },
                { key: 'timetable', fa: '📅 تقسیم اوقات هفته', en: '📅 Weekly Timetable' },
              ].map((tab) => {
                const isActive = dashClassroomTab === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    onPress={() => setDashClassroomTab(tab.key as any)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 12,
                      backgroundColor: isActive ? colors.gold : (isDark ? 'rgba(255, 255, 255, 0.05)' : colors.card),
                      borderWidth: 1,
                      borderColor: isActive ? colors.gold : colors.cardBorder,
                    }}
                  >
                    <Text
                      style={{
                        color: isActive ? (isDark ? '#0F172A' : '#FFFFFF') : colors.textSecondary,
                        fontWeight: '800',
                        fontSize: 12.5,
                      }}
                    >
                      {isPersian ? tab.fa : tab.en}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Tab 1: Textbooks */}
            {dashClassroomTab === 'textbooks' && (
              <View style={{ gap: 10 }}>
                {enrolledMaterials?.textbooks.map((tb) => (
                  <View
                    key={tb.id}
                    style={{
                      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC',
                      borderRadius: 14,
                      padding: 14,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                      flexDirection: isPersian ? 'row-reverse' : 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontWeight: '800', fontSize: 13.5, textAlign: isPersian ? 'right' : 'left' }}>
                        {isPersian ? tb.faTitle : tb.title}
                      </Text>
                      <Text style={{ color: colors.gold, fontSize: 11, fontWeight: '700', marginTop: 3, textAlign: isPersian ? 'right' : 'left' }}>
                        {isPersian ? tb.faSubject : tb.subject} • {tb.durationOrPages}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setPreviewMaterial(tb)}
                      style={{
                        backgroundColor: colors.gold,
                        borderRadius: 10,
                        paddingVertical: 8,
                        paddingHorizontal: 14,
                      }}
                    >
                      <Text style={{ color: isDark ? '#0F172A' : '#FFFFFF', fontWeight: '800', fontSize: 12 }}>
                        📖 {isPersian ? 'مطالعه کتاب' : 'Read Book'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Tab 2: Video Lessons */}
            {dashClassroomTab === 'videos' && (
              <View style={{ gap: 10 }}>
                {enrolledMaterials?.videoLessons.map((vid) => (
                  <View
                    key={vid.id}
                    style={{
                      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC',
                      borderRadius: 14,
                      padding: 14,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                      flexDirection: isPersian ? 'row-reverse' : 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontWeight: '800', fontSize: 13.5, textAlign: isPersian ? 'right' : 'left' }}>
                        {isPersian ? vid.faTitle : vid.title}
                      </Text>
                      <Text style={{ color: colors.gold, fontSize: 11, fontWeight: '700', marginTop: 3, textAlign: isPersian ? 'right' : 'left' }}>
                        {isPersian ? vid.faSubject : vid.subject} • {vid.durationOrPages || (isPersian ? 'جلسه تصویری' : 'Video Lesson')}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setPreviewMaterial(vid)}
                      style={{
                        backgroundColor: colors.cardHover,
                        borderColor: colors.goldBorder,
                        borderWidth: 1,
                        borderRadius: 10,
                        paddingVertical: 8,
                        paddingHorizontal: 14,
                      }}
                    >
                      <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 12 }}>
                        ▶ {isPersian ? 'مشاهده درس' : 'Watch Video'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Tab 3: Practice Quizzes */}
            {dashClassroomTab === 'quizzes' && (
              <View style={{ gap: 10 }}>
                {enrolledMaterials?.practiceQuizzes.map((quiz) => (
                  <View
                    key={quiz.id}
                    style={{
                      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC',
                      borderRadius: 14,
                      padding: 14,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                      flexDirection: isPersian ? 'row-reverse' : 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontWeight: '800', fontSize: 13.5, textAlign: isPersian ? 'right' : 'left' }}>
                        {isPersian ? quiz.faTitle : quiz.title}
                      </Text>
                      <Text style={{ color: colors.gold, fontSize: 11, fontWeight: '700', marginTop: 3, textAlign: isPersian ? 'right' : 'left' }}>
                        {isPersian ? quiz.faSubject : quiz.subject} • {quiz.durationOrPages || (isPersian ? 'آزمون خودسنجی' : 'Practice Quiz')}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setActiveMaterialGrade(activeEnrolledGrade)}
                      style={{
                        backgroundColor: colors.gold,
                        borderRadius: 10,
                        paddingVertical: 8,
                        paddingHorizontal: 14,
                      }}
                    >
                      <Text style={{ color: isDark ? '#0F172A' : '#FFFFFF', fontWeight: '800', fontSize: 12 }}>
                        ✏ {isPersian ? 'شروع آزمون' : 'Take Exam'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Tab 4: Weekly Timetable */}
            {dashClassroomTab === 'timetable' && (
              <View style={{ gap: 8 }}>
                {[
                  { dayFa: 'شنبه', dayEn: 'Saturday', subjectsFa: 'الجبر و ریاضیات • بیولوژی و فیزیولوژی • دستور زبان و ادبیات دری', subjectsEn: 'Mathematics • Biology • Dari Grammar & Literature' },
                  { dayFa: 'یکشنبه', dayEn: 'Sunday', subjectsFa: 'مفاهیم کیمیا • فیزیک و میخانیک • زبان پشتو', subjectsEn: 'Chemistry • Physics • Pashto Language' },
                  { dayFa: 'دوشنبه', dayEn: 'Monday', subjectsFa: 'هندسه تحلیلی • جغرافیای طبیعی • تاریخ معاصر و تعلیمات مدنی', subjectsEn: 'Geometry • Physical Geography • History & Civics' },
                  { dayFa: 'سه‌شنبه', dayEn: 'Tuesday', subjectsFa: 'زبان انگلیسی تخصصی • حل تمرینات ریاضی • بیولوژی تجربی', subjectsEn: 'English • Math Practice Exercises • Experimental Biology' },
                  { dayFa: 'چهارشنبه', dayEn: 'Wednesday', subjectsFa: 'کیمیا و فیزیک در لابراتوار • سواد دیجیتال و کامپیوتر • ورزش و صحت', subjectsEn: 'Science Lab • Computer & Digital Literacy • Health Education' },
                  { dayFa: 'پنجشنبه', dayEn: 'Thursday', subjectsFa: 'مرور کلی هفتگی • آزمون خودسنجی • رفع اشکال و سوالات با هیئت تدریسی', subjectsEn: 'Weekly Review • Self-Assessment Exam • Q&A with Teachers' },
                ].map((item, idx) => (
                  <View
                    key={idx}
                    style={{
                      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC',
                      borderRadius: 12,
                      padding: 12,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                      flexDirection: isPersian ? 'row-reverse' : 'row',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: colors.gold,
                        borderRadius: 8,
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        minWidth: 70,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: isDark ? '#0F172A' : '#FFFFFF', fontWeight: '800', fontSize: 11.5 }}>
                        {isPersian ? item.dayFa : item.dayEn}
                      </Text>
                    </View>
                    <Text style={{ color: colors.text, fontSize: 12.5, fontWeight: '700', flex: 1, textAlign: isPersian ? 'right' : 'left' }}>
                      {isPersian ? item.subjectsFa : item.subjectsEn}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* 3. Application Under Review Banner (Shown when logged in and application is pending) */}
        {user && !activeEnrolledGrade && pendingGrades.length > 0 && (
          <View
            style={{
              backgroundColor: isDark ? 'rgba(234, 179, 8, 0.12)' : 'rgba(254, 240, 138, 0.25)',
              borderRadius: 22,
              borderWidth: 1.5,
              borderColor: colors.gold,
              padding: 22,
              marginBottom: 24,
            }}
          >
            <View
              style={{
                flexDirection: isPersian ? 'row-reverse' : 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 24 }}>⏳</Text>
                <Text style={{ color: colors.gold, fontSize: 17, fontWeight: '900', textAlign: isPersian ? 'right' : 'left' }}>
                  {isPersian ? `درخواست شمولیت شما برای صنف ${pendingGrades[0]} در حال بررسی است` : `Application for Grade ${pendingGrades[0]} is Under Review`}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleStudentLogout}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 10,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                }}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 11.5 }}>
                  🚪 {isPersian ? 'خروج از حساب' : 'Log Out'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 22, textAlign: isPersian ? 'right' : 'left' }}>
              {isPersian
                ? `شاگرد گرامی ${studentDisplayName}؛ فورم ثبت‌نام شما با شناسه پیگیری ${derivedStudentId || 'FOE'} با موفقیت به هیئت پذیرش مکتب ارسال گردیده است. اداره مکتب در حال اعتبارسنجی اسناد می‌باشد. به محض تأیید، صنف درسی و کتب در همین صفحه برای شما بازگشایی خواهند شد.`
                : `Dear student ${studentDisplayName}; your registration form (ID: ${derivedStudentId || 'FOE'}) is currently under review by school administration. Upon approval, your classroom will unlock here automatically.`}
            </Text>
          </View>
        )}

        {/* 4. Admin Navigation Ribbon (Shown when user is Admin) */}
        {user && isAdmin && !activeEnrolledGrade && pendingGrades.length === 0 && (
          <View
            style={{
              backgroundColor: isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.08)',
              borderRadius: 20,
              borderWidth: 1.5,
              borderColor: '#6366F1',
              padding: 18,
              marginBottom: 24,
              flexDirection: isPersian ? 'row-reverse' : 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <Text style={{ fontSize: 24 }}>👑</Text>
              <View>
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800', textAlign: isPersian ? 'right' : 'left' }}>
                  {isPersian ? 'پنل مدیریت مکتب (دسترسی ویژه مدیر)' : 'School Administrator Panel'}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: isPersian ? 'right' : 'left' }}>
                  {isPersian ? 'شما دسترسی کامل به تمامی صنوف ۷ الی ۱۲ و بررسی فورم‌های ثبت‌نام شاگردان دارید.' : 'You have full access to all Grades 7–12 and student application approvals.'}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={() => router.push('/admin/school-applications')}
                style={{
                  backgroundColor: '#6366F1',
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12 }}>
                  📋 {isPersian ? 'بررسی فورم‌های شاگردان' : 'Review Applications'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleStudentLogout}
                style={{
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                }}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 12 }}>
                  🚪 {isPersian ? 'خروج' : 'Log Out'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 5. Registered Student Notice - Application Not Submitted Yet */}
        {user && !isAdmin && !activeEnrolledGrade && pendingGrades.length === 0 && (
          <View
            style={{
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.88)' : '#FFFFFF',
              borderRadius: 22,
              borderWidth: 1.5,
              borderColor: colors.goldBorder,
              padding: 22,
              marginBottom: 24,
            }}
          >
            <View
              style={{
                flexDirection: isPersian ? 'row-reverse' : 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 24 }}>📝</Text>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', textAlign: isPersian ? 'right' : 'left' }}>
                  {isPersian ? `خوش آمدید، ${studentDisplayName}` : `Welcome, ${studentDisplayName}`}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleStudentLogout}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 10,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                }}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 11.5 }}>
                  🚪 {isPersian ? 'خروج از حساب' : 'Log Out'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 22, marginBottom: 14, textAlign: isPersian ? 'right' : 'left' }}>
              {isPersian
                ? 'شما وارد سیستم شده‌اید اما هنوز فورمی جهت شمولیت در صنوف مکتب دختران (صنف ۷ الی ۱۲) ارسال نکرده‌اید. برای دسترسی به کتب، دروس و ویدیوهای صنف مورد نظر خود، لطفاً فورم ثبت‌نام را تکمیل فرمایید.'
                : 'You are signed in, but have not submitted an admission application for Grades 7–12 yet. Please complete the registration form to unlock your classroom.'}
            </Text>

            <TouchableOpacity
              onPress={() => router.push('/(student)/apply')}
              style={{
                backgroundColor: colors.gold,
                paddingVertical: 10,
                paddingHorizontal: 18,
                borderRadius: 12,
                alignSelf: isPersian ? 'flex-end' : 'flex-start',
                flexDirection: isPersian ? 'row-reverse' : 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Text style={{ color: isDark ? '#0F172A' : '#FFFFFF', fontWeight: '800', fontSize: 13 }}>
                📝 {isPersian ? 'تکمیل فورم آنلاین ثبت‌نام مکتب' : 'Complete Admission Form'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Hero Banner Card */}
        <View
          style={{
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.65)' : '#FFFFFF',
            borderRadius: 24,
            borderWidth: 1.5,
            borderColor: colors.goldBorder,
            padding: 24,
            marginBottom: 24,
            shadowColor: colors.gold,
            shadowOpacity: isDark ? 0.25 : 0.08,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 16,
            elevation: 4,
          }}
        >
          <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <View style={{ backgroundColor: isDark ? 'rgba(250, 204, 21, 0.15)' : 'rgba(250, 204, 21, 0.22)', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: colors.goldBorder }}>
              <Text style={{ color: colors.gold, fontSize: 11, fontWeight: '800' }}>
                {isPersian ? 'نصاب بین‌المللی آموزش آنلاین دختران (FOE) • صنوف ۷ الی ۱۲' : 'FOE INTERNATIONAL ONLINE SECONDARY CURRICULUM • GRADES 7 TO 12'}
              </Text>
            </View>
          </View>

          <Text style={{ color: colors.text, fontSize: 24, fontWeight: '900', marginBottom: 8, textAlign: isPersian ? 'right' : 'left' }}>
            {isPersian ? 'نصاب بین‌المللی آموزش آنلاین دختران افغانستان' : 'International Online Curriculum for Afghan Girls'}
          </Text>

          <Text style={{ color: colors.textSecondary, fontSize: 13.5, lineHeight: 22, marginBottom: 16, textAlign: isPersian ? 'right' : 'left' }}>
            {isPersian
              ? 'یک مسیر مصون، کاملاً آنلاین و آینده‌نگر برای تداوم آموزش دوره ثانوی دختران افغانستان. تلفیقی هدفمند از مضامین اساسی اکادمیک، همراستایی با استاندارد دیپلوم بین‌المللی GED، عمق مضامین الهام‌گرفته از کمبریج (IGCSE)، سواد دیجیتال، برنامه‌نویسی و اخلاق کاربردی هوش مصنوعی.'
              : 'A safe, fully online, future-ready secondary education pathway for Afghan girls. Combines essential academic subjects, GED-aligned preparation, IGCSE-inspired subject depth, digital literacy, coding, AI awareness, life skills, safeguarding, and measurable learning evidence.'}
          </Text>

          {/* Action Buttons: Apply for School & Apply to Teach */}
          <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
            <TouchableOpacity
              onPress={() => router.push('/(student)/apply')}
              style={{
                backgroundColor: colors.gold,
                borderRadius: 14,
                paddingVertical: 12,
                paddingHorizontal: 22,
                flexDirection: isPersian ? 'row-reverse' : 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Text style={{ color: isDark ? '#0F172A' : '#FFFFFF', fontWeight: '900', fontSize: 13.5 }}>
                📝 {isPersian ? 'ثبت‌نام آنلاین در مکتب (فورم پذیرش)' : 'Online School Registration Form'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowTeacherModal(true)}
              style={{
                backgroundColor: isDark ? '#1E293B' : '#FEF3C7',
                borderColor: '#F59E0B',
                borderWidth: 1.5,
                borderRadius: 14,
                paddingVertical: 12,
                paddingHorizontal: 20,
                flexDirection: isPersian ? 'row-reverse' : 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Text style={{ color: isDark ? '#FCD34D' : '#92400E', fontWeight: '900', fontSize: 13.5 }}>
                👩‍🏫 {isPersian ? 'درخواست تدریس در مکتب (ویژه آموزگاران دختران)' : 'Request to Teach (Girls’ School Teachers)'}
              </Text>
            </TouchableOpacity>

            {(isSchoolTeacher || isAdmin) && (
              <TouchableOpacity
                onPress={() => router.push('/instructor/school-lessons' as any)}
                style={{
                  backgroundColor: '#3B82F6',
                  borderRadius: 14,
                  paddingVertical: 12,
                  paddingHorizontal: 18,
                  flexDirection: isPersian ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 13.5 }}>
                  🏫 {isPersian ? 'ورود به پنل تدریس مکتب شما →' : 'Enter Your School Teacher Studio →'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Teacher Recruitment Callout Card */}
          <View
            style={{
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.85)' : '#FFFBEB',
              borderRadius: 18,
              borderWidth: 1.5,
              borderColor: '#F59E0B',
              padding: 16,
              marginBottom: 20,
              flexDirection: isPersian ? 'row-reverse' : 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <View style={{ flex: 1, minWidth: 260 }}>
              <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Text style={{ fontSize: 22 }}>👩‍🏫</Text>
                <Text style={{ color: colors.text, fontWeight: '900', fontSize: 15, textAlign: isPersian ? 'right' : 'left' }}>
                  {isPersian ? 'فراخوان همکاری ویژه معلمان و استادان مکاتب دخترانه' : 'Call for Former Afghan Girls’ School Teachers'}
                </Text>
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: 12.5, lineHeight: 20, textAlign: isPersian ? 'right' : 'left' }}>
                {isPersian
                  ? 'اولویت قطعی و شرط اساسی پذیرش، داشتن سابقه تدریس رسمی در مکاتب دخترانه است. پس از تایید کمیته علمی، پنل تدریس برای صنوف تایید شده فعال خواهد شد.'
                  : 'Prior official teaching experience in Afghan girls’ schools is strictly required. Upon board approval, lesson creation is authorized for your assigned grades.'}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setShowTeacherModal(true)}
              style={{
                backgroundColor: '#F59E0B',
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: '#0F172A', fontWeight: '900', fontSize: 12.5 }}>
                {isPersian ? 'ارسال فورم تدریس ←' : 'Submit Teaching Form ←'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Filter Grade Pills */}
          <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: 6 }}>
            <TouchableOpacity
              onPress={() => setSelectedGrade(null)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 99,
                backgroundColor: selectedGrade === null ? colors.gold : (isDark ? 'rgba(255,255,255,0.06)' : colors.card),
                borderWidth: 1,
                borderColor: selectedGrade === null ? colors.gold : colors.cardBorder,
              }}
            >
              <Text style={{ color: selectedGrade === null ? (isDark ? '#0F172A' : '#FFFFFF') : colors.text, fontWeight: '800', fontSize: 12 }}>
                {isPersian ? 'همه صنوف (۷ الی ۱۲)' : 'All Grades (7–12)'}
              </Text>
            </TouchableOpacity>

            {[7, 8, 9, 10, 11, 12].map((g) => {
              const isSelected = selectedGrade === g;
              const isApproved = approvedGrades.includes(g);
              const isOtherGradeLocked = user && !isAdmin && approvedGrades.length > 0 && !isApproved;
              return (
                <TouchableOpacity
                  key={g}
                  onPress={() => setSelectedGrade(g)}
                  style={{
                    paddingHorizontal: 13,
                    paddingVertical: 7,
                    borderRadius: 99,
                    backgroundColor: isSelected ? colors.gold : (isDark ? 'rgba(255,255,255,0.06)' : colors.card),
                    borderWidth: 1,
                    borderColor: isApproved ? colors.success : (isOtherGradeLocked ? colors.cardBorder : (isSelected ? colors.gold : colors.cardBorder)),
                    flexDirection: isPersian ? 'row-reverse' : 'row',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Text style={{ color: isSelected ? (isDark ? '#0F172A' : '#FFFFFF') : colors.text, fontWeight: '800', fontSize: 12 }}>
                    {isPersian ? `صنف ${g}` : `Grade ${g}`}
                  </Text>
                  {isApproved && (
                    <Text style={{ fontSize: 10, color: colors.success, fontWeight: '900' }}>✓</Text>
                  )}
                  {isOtherGradeLocked && (
                    <Text style={{ fontSize: 9, opacity: 0.5 }}>🔒</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* International Curriculum Framework & Architecture Section */}
        <View
          style={{
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.75)' : '#FFFFFF',
            borderRadius: 24,
            borderWidth: 1.5,
            borderColor: colors.goldBorder,
            padding: 22,
            marginBottom: 24,
            shadowColor: colors.gold,
            shadowOpacity: isDark ? 0.2 : 0.08,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 14,
            elevation: 3,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: isPersian ? 'row-reverse' : 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 14,
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'center', gap: 10 }}>
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  backgroundColor: isDark ? 'rgba(250, 204, 21, 0.2)' : 'rgba(250, 204, 21, 0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: colors.goldBorder,
                }}
              >
                <Text style={{ fontSize: 20 }}>🌐</Text>
              </View>
              <View>
                <Text style={{ color: colors.text, fontSize: 17, fontWeight: '900', textAlign: isPersian ? 'right' : 'left' }}>
                  {isPersian
                    ? 'چارچوب جامع نصاب بین‌المللی آموزش آنلاین (صنوف ۷ الی ۱۲)'
                    : 'International Online Secondary Curriculum Framework'}
                </Text>
                <Text style={{ color: colors.gold, fontSize: 12, fontWeight: '700', textAlign: isPersian ? 'right' : 'left' }}>
                  {isPersian
                    ? 'تطبیق با بافت افغانستان + همراستا با GED + الهام‌گرفته از کمبریج (IGCSE) + سواد هوش مصنوعی و مهارت‌های آینده'
                    : 'Afghan Context + GED-Aligned + IGCSE-Inspired + Future Digital Skills & AI'}
                </Text>
              </View>
            </View>
          </View>

          {/* Framework Tabs */}
          <View
            style={{
              flexDirection: isPersian ? 'row-reverse' : 'row',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.cardBorder,
              paddingBottom: 12,
            }}
          >
            {[
              { key: 'stages', fa: '🎓 مقاطع آموزشی (پایه و لیسه)', en: '🎓 Grade Bands & Stages' },
              { key: 'pathways', fa: '🚀 مسیرهای سه‌گانه لیسه (۱۰–۱۲)', en: '🚀 Senior Pathways (10–12)' },
              { key: 'delivery', fa: '💻 الگوی تطبیق آنلاین و مصونیت', en: '💻 Online Delivery Model' },
              { key: 'time', fa: '⏱️ ساعات پیشنهادی مطالعه در هفته', en: '⏱️ Weekly Study Time' },
            ].map((tab) => {
              const isActive = activeCurriculumTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveCurriculumTab(tab.key as any)}
                  style={{
                    paddingHorizontal: 13,
                    paddingVertical: 7,
                    borderRadius: 12,
                    backgroundColor: isActive ? colors.gold : (isDark ? 'rgba(255, 255, 255, 0.05)' : colors.card),
                    borderWidth: 1,
                    borderColor: isActive ? colors.gold : colors.cardBorder,
                  }}
                >
                  <Text
                    style={{
                      color: isActive ? (isDark ? '#0F172A' : '#FFFFFF') : colors.text,
                      fontWeight: '800',
                      fontSize: 12,
                    }}
                  >
                    {isPersian ? tab.fa : tab.en}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Tab 1: Stages & Graduate Profile */}
          {activeCurriculumTab === 'stages' && (
            <View style={{ gap: 12 }}>
              <View
                style={{
                  backgroundColor: isDark ? 'rgba(15, 23, 42, 0.55)' : '#F8FAFC',
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  gap: 8,
                }}
              >
                <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#3B82F6' }}>
                    <Text style={{ color: '#3B82F6', fontSize: 11.5, fontWeight: '800' }}>
                      {isPersian ? 'مقطع اول: صنوف ۷ الی ۹' : 'STAGE 1: GRADES 7–9'}
                    </Text>
                  </View>
                  <Text style={{ color: colors.text, fontSize: 14.5, fontWeight: '800' }}>
                    {isPersian ? 'مقطع پایه‌ای متوسطه (Foundation Stage)' : 'Foundation Stage: Literacy & Numeracy'}
                  </Text>
                </View>
                <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 21, textAlign: isPersian ? 'right' : 'left' }}>
                  {isPersian
                    ? 'احیا و تثبیت مهارت‌های سوادآموزی اکادمیک، تفکر محاسباتی و ریاضیات، علوم تجربی ساینسی، درک مسائل اجتماعی و جغرافیای جهان، اعتمادبه‌نفس در فضای دیجیتال، مبانی برنامه‌نویسی و کدنویسی، آگاهی از هوش مصنوعی و رعایت مصونیت آنلاین و عادات مطالعه مستقل.'
                    : 'Rebuilding literacy, numeracy, experimental science, social understanding, digital confidence, coding foundations, AI awareness, online safety, and disciplined self-study habits.'}
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: isDark ? 'rgba(15, 23, 42, 0.55)' : '#F8FAFC',
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  gap: 8,
                }}
              >
                <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ backgroundColor: 'rgba(234, 179, 8, 0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: colors.gold }}>
                    <Text style={{ color: colors.gold, fontSize: 11.5, fontWeight: '800' }}>
                      {isPersian ? 'مقطع دوم: صنوف ۱۰ الی ۱۲' : 'STAGE 2: GRADES 10–12'}
                    </Text>
                  </View>
                  <Text style={{ color: colors.text, fontSize: 14.5, fontWeight: '800' }}>
                    {isPersian ? 'مقطع عالی لیسه و مسیرهای بین‌المللی (Senior Stage)' : 'Senior Stage: Academic Depth & Global Pathways'}
                  </Text>
                </View>
                <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 21, textAlign: isPersian ? 'right' : 'left' }}>
                  {isPersian
                    ? 'تعمیق مضامین تخصصی ساینسی و ریاضیات عالی، آمادگی جامع برای آزمون‌های بین‌المللی GED و استانداردهای الهام‌گرفته از IGCSE، ایجاد پورتفولیوی دیجیتال زنده، دسترسی به بورسیه‌های دانشگاهی و اخذ دیپلوم معتبر فراغت.'
                    : 'Strengthening academic depth, GED readiness, IGCSE-style preparation, university access, live digital capstone portfolio defense, international scholarships, and career development.'}
                </Text>
              </View>

              {/* Graduate Profile Ribbon */}
              <View
                style={{
                  backgroundColor: isDark ? 'rgba(34, 197, 94, 0.12)' : 'rgba(34, 197, 94, 0.08)',
                  borderRadius: 14,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: colors.success,
                  gap: 6,
                }}
              >
                <Text style={{ color: colors.success, fontSize: 12.5, fontWeight: '800', textAlign: isPersian ? 'right' : 'left' }}>
                  🌟 {isPersian ? 'شاخص‌های فارغ‌التحصیلان صنف ۱۲ مکتب آنلاین فاروق (FOE Graduate Profile):' : 'Farukh Online Education Graduate Profile (Grade 12):'}
                </Text>
                <Text style={{ color: colors.text, fontSize: 12, lineHeight: 19, textAlign: isPersian ? 'right' : 'left' }}>
                  {isPersian
                    ? '• تسلط بر ارتباطات رسا به زبان‌های انگلیسی، دری و پشتو • حل مسائل ریاضی و تحلیلی در دنیای واقعی • درک عمیق فیزیک، کیمیا، بیولوژی و تفکر ساینسی • استفاده خلاقانه و اخلاقی از ابزارهای هوش مصنوعی • دفاع از پورتفولیوی دیجیتال شخصی و وبسایت آنلاین • آمادگی کامل جهت پذیرش در دانشگاه‌ها و بورسیه‌های بین‌المللی.'
                    : '• Confident trilingual communication (English, Dari, Pashto) • Academic and real-world mathematical problem solving • Biology, Chemistry, Physics & scientific reasoning • Safe and productive use of digital & AI tools • Defense of live digital portfolio and coding capstone • Preparation for international university admissions & scholarships.'}
                </Text>
              </View>
            </View>
          )}

          {/* Tab 2: Senior Pathways */}
          {activeCurriculumTab === 'pathways' && (
            <View style={{ gap: 12 }}>
              {[
                {
                  letter: 'A',
                  titleFa: 'مسیر اول: آمادگی دیپلوم بین‌المللی GED',
                  titleEn: 'Pathway A: GED Preparation Track',
                  tagFa: 'همراستا با استانداردهای آزمون عمومی GED',
                  tagEn: 'GED-Aligned Secondary Pathway',
                  descFa: 'مشتمل بر مهارت‌های استدلال زبانی (Language Arts)، استدلال ریاضی (Mathematical Reasoning)، ساینس (Science)، مطالعات اجتماعی (Social Studies) و تشکیل پورتفولیوی مدارک جهت ارائه به دانشگاه‌های بین‌المللی.',
                  descEn: 'Focuses on Reasoning Through Language Arts, Mathematical Reasoning, Science, Social Studies, and Digital Portfolio support for accredited international credentials.',
                },
                {
                  letter: 'B',
                  titleFa: 'مسیر دوم: آمادگی اکادمیک الهام‌گرفته از کمبریج (IGCSE)',
                  titleEn: 'Pathway B: IGCSE-Style Academic Preparation',
                  tagFa: 'عمق علمی استاندارد کمبریج بین‌المللی',
                  tagEn: 'IGCSE Subject Depth & Rigor',
                  descFa: 'برنامه تخصصی شامل زبان انگلیسی، ریاضیات پیشرفته، بیولوژی، کیمیا، فیزیک، علوم کامپیوتر یا ICT و مبانی اقتصاد و مطالعات تجاری.',
                  descEn: 'Academic rigor across English, Mathematics, Biology, Chemistry, Physics, Computer Science or ICT, and Economics or Business Studies.',
                },
                {
                  letter: 'C',
                  titleFa: 'مسیر سوم: مهارت‌های فوق‌العاده دیجیتال (Digital Skills Plus)',
                  titleEn: 'Pathway C: Digital Skills Plus Track',
                  tagFa: 'فناوری، هوش مصنوعی و بازار کار بین‌المللی',
                  tagEn: 'Tech, AI & Remote Work Career Readiness',
                  descFa: 'آموزش تخصصی توسعه وبسایت‌ها، طراحی دیجیتال، تسلط بر ابزارهای اداری و پژوهشی، هوش مصنوعی برای کار و یادگیری، فریلنسینگ آنلاین و ارتباطات کاری بین‌المللی.',
                  descEn: 'Practical mastery of Web Development, Digital Design, Productivity Tools, AI for Learning & Work, Online Freelancing, and International Career Communication.',
                },
              ].map((pathway, idx) => (
                <View
                  key={idx}
                  style={{
                    backgroundColor: isDark ? 'rgba(15, 23, 42, 0.55)' : '#F8FAFC',
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                    gap: 6,
                  }}
                >
                  <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                    <Text style={{ color: colors.text, fontSize: 14.5, fontWeight: '900' }}>
                      {isPersian ? pathway.titleFa : pathway.titleEn}
                    </Text>
                    <View style={{ backgroundColor: isDark ? 'rgba(250, 204, 21, 0.15)' : 'rgba(250, 204, 21, 0.22)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                      <Text style={{ color: colors.gold, fontSize: 11, fontWeight: '800' }}>
                        {isPersian ? pathway.tagFa : pathway.tagEn}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ color: colors.textSecondary, fontSize: 12.5, lineHeight: 20, textAlign: isPersian ? 'right' : 'left' }}>
                    {isPersian ? pathway.descFa : pathway.descEn}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Tab 3: Online Delivery Model & Safeguarding */}
          {activeCurriculumTab === 'delivery' && (
            <View style={{ gap: 10 }}>
              {[
                { icon: '📡', titleFa: 'صنوف درسی زنده (Live Classes)', titleEn: 'Teacher-Led Live Classes', descFa: 'تدریس مستقیم توسط اساتید با تعامل زنده، پرسش و پاسخ و تمرین هدایت‌شده.', descEn: 'Teacher-led online lessons with live interaction and guided problem-solving.' },
                { icon: '💾', titleFa: 'دروس ضبط‌شده کم‌حجم (Recorded Lessons)', titleEn: 'Low-Bandwidth Recorded Lessons', descFa: 'ویدیوهای فشرده و دروس قابل دانلود مناسب برای اینترنت ضعیف و دستگاه‌های اشتراکی.', descEn: 'Short, compressed videos optimized for weak internet connections and shared household devices.' },
                { icon: '📝', titleFa: 'تکالیف و خودآموزی (Self-Paced Tasks)', titleEn: 'Weekly Self-Paced Assignments', descFa: 'تمرینات هفتگی، کتابخوانی، حل تمارین و کوییزهای تثبیت یادگیری.', descEn: 'Weekly assignments, readings, quizzes, and independent learning exercises.' },
                { icon: '🤝', titleFa: 'پشتیبانی منتورینگ (Mentor Support)', titleEn: 'Dedicated Mentor Support', descFa: 'پیگیری حضور، ایجاد انگیزه، سلامت روان و حمایت مستمر آموزشی.', descEn: 'Attendance follow-up, motivation, wellbeing check-ins, and academic coaching.' },
                { icon: '📁', titleFa: 'پورتفولیوی دیجیتال (Digital Portfolio)', titleEn: 'Digital Portfolio Assessment', descFa: 'مجموعه دستاوردهای نوشتاری، پروژه‌های کدنویسی، ارائه‌ها و مدارک شاگردان.', descEn: 'Writing, coding projects, presentations, and verified certificate artifacts.' },
                { icon: '🔒', titleFa: 'مصونیت و امنیت آنلاین (Online Safeguarding)', titleEn: 'Safeguarding & Online Safety', descFa: 'حساب‌های امن، فضاهای خصوصی یادگیری، کد رفتاری استادان، عدم افشای هویت شاگردان و مکانیزم امن گزارش‌دهی.', descEn: 'Secure accounts, private learning spaces, teacher code of conduct, confidential identity protection, and concern reporting.' },
              ].map((item, idx) => (
                <View
                  key={idx}
                  style={{
                    backgroundColor: isDark ? 'rgba(15, 23, 42, 0.55)' : '#F8FAFC',
                    borderRadius: 14,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                    flexDirection: isPersian ? 'row-reverse' : 'row',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <Text style={{ fontSize: 22 }}>{item.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontWeight: '800', fontSize: 13, textAlign: isPersian ? 'right' : 'left' }}>
                      {isPersian ? item.titleFa : item.titleEn}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 11.5, lineHeight: 18, textAlign: isPersian ? 'right' : 'left' }}>
                      {isPersian ? item.descFa : item.descEn}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Tab 4: Weekly Time Allocation */}
          {activeCurriculumTab === 'time' && (
            <View style={{ gap: 10 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 12.5, textAlign: isPersian ? 'right' : 'left' }}>
                {isPersian
                  ? 'جدول ساعات پیشنهادی مطالعه در هفته جهت تعادل یادگیری و آمادگی کامل اکادمیک (مجموعاً ۲۲ الی ۲۷ ساعت در هفته):'
                  : 'Suggested weekly time allocation for balanced academic mastery and deep skill development (22–27 weekly hours):'}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {[
                  { subjectFa: 'زبان انگلیسی', subjectEn: 'English Language', hours: '4–5 hrs/week' },
                  { subjectFa: 'ریاضیات', subjectEn: 'Mathematics', hours: '4–5 hrs/week' },
                  { subjectFa: 'ساینس تجربی', subjectEn: 'Sciences (Bio/Chem/Phys)', hours: '3–4 hrs/week' },
                  { subjectFa: 'سواد دیجیتال و کامپیوتر', subjectEn: 'Digital / Computer Science', hours: '3–4 hrs/week' },
                  { subjectFa: 'مطالعات اجتماعی', subjectEn: 'Social Studies & History', hours: '2–3 hrs/week' },
                  { subjectFa: 'ادبیات دری و پشتو', subjectEn: 'Dari / Pashto Communication', hours: '2 hrs/week' },
                  { subjectFa: 'مهارت‌های زندگی و آمادگی شغلی', subjectEn: 'Life Skills & Career Prep', hours: '1–2 hrs/week' },
                  { subjectFa: 'هوش مصنوعی و فناوری‌های نوین', subjectEn: 'AI & Future Technology', hours: '1 hr/week' },
                  { subjectFa: 'منتورینگ و پورتفولیو', subjectEn: 'Mentoring & Portfolio', hours: '1 hr/week' },
                ].map((item, idx) => (
                  <View
                    key={idx}
                    style={{
                      flex: 1,
                      minWidth: 160,
                      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.55)' : '#F8FAFC',
                      borderRadius: 12,
                      padding: 10,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                      flexDirection: isPersian ? 'row-reverse' : 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700' }}>
                      {isPersian ? item.subjectFa : item.subjectEn}
                    </Text>
                    <View style={{ backgroundColor: colors.gold, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 }}>
                      <Text style={{ color: isDark ? '#0F172A' : '#FFFFFF', fontSize: 10.5, fontWeight: '800' }}>
                        {item.hours}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Grade Tracks List */}
        <View style={{ gap: 20 }}>
          {displayedTracks.map((item) => {
            const title = isPersian ? item.faTitle : item.title;
            const desc = isPersian ? item.faDescription : item.description;
            const faculty = isPersian ? item.faFacultyName : item.facultyName;
            const facultyBio = isPersian ? item.faFacultyBio : item.facultyBio;
            const subjects = isPersian ? item.faSubjects : item.subjects;
            const keyTopics = isPersian ? item.faKeyTopics : item.keyTopics;

            const isApproved = approvedGrades.includes(item.grade);
            const isPending = !isApproved && pendingGrades.includes(item.grade);
            const isOtherGradeLocked = user && !isAdmin && approvedGrades.length > 0 && !isApproved;

            return (
              <View
                key={item.grade}
                style={{
                  backgroundColor: isDark ? 'rgba(15, 23, 42, 0.65)' : '#FFFFFF',
                  borderRadius: 22,
                  borderWidth: 1.5,
                  borderColor: isApproved
                    ? colors.success
                    : isOtherGradeLocked
                    ? colors.cardBorder
                    : (isDark ? 'rgba(250, 204, 21, 0.25)' : 'rgba(226, 232, 240, 0.9)'),
                  padding: 20,
                  shadowColor: isApproved ? colors.success : '#000',
                  shadowOpacity: isApproved ? 0.15 : 0.08,
                  shadowRadius: 12,
                  elevation: 3,
                }}
              >
                {/* Grade Header */}
                <View
                  style={{
                    flexDirection: isPersian ? 'row-reverse' : 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                    paddingBottom: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.cardBorder,
                  }}
                >
                  <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'center', gap: 10 }}>
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: isApproved ? colors.success : (isOtherGradeLocked ? colors.cardHover : colors.gold),
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ color: isApproved ? '#FFFFFF' : (isDark ? '#FFFFFF' : '#0F172A'), fontWeight: '900', fontSize: 16 }}>
                        {item.grade}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <View
                          style={{
                            backgroundColor: item.stage === 'senior' ? (isDark ? 'rgba(234, 179, 8, 0.18)' : 'rgba(234, 179, 8, 0.15)') : (isDark ? 'rgba(59, 130, 246, 0.18)' : 'rgba(59, 130, 246, 0.12)'),
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 6,
                            borderWidth: 1,
                            borderColor: item.stage === 'senior' ? colors.gold : '#3B82F6',
                          }}
                        >
                          <Text style={{ color: item.stage === 'senior' ? colors.gold : '#3B82F6', fontSize: 10, fontWeight: '800' }}>
                            {isPersian ? item.faStageLabel : item.stageLabel}
                          </Text>
                        </View>
                      </View>
                      <Text style={{ color: colors.text, fontWeight: '800', fontSize: 17, textAlign: isPersian ? 'right' : 'left' }}>
                        {title}
                      </Text>
                      <Text style={{ color: isApproved ? colors.success : (isOtherGradeLocked ? colors.textMuted : colors.gold), fontWeight: '700', fontSize: 11.5 }}>
                        {isApproved
                          ? (isPersian ? 'صنف فعال و تایید شده شما ✓' : 'Your Approved Enrolled Grade ✓')
                          : isOtherGradeLocked
                          ? (isPersian ? 'خارج از برنامه شمولیت شما 🔒' : 'Not Included in Your Enrollment 🔒')
                          : (isPersian ? 'نصاب بین‌المللی آموزش آنلاین دختران (FOE)' : 'FOE International Online Curriculum')}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      backgroundColor: colors.cardHover,
                      borderRadius: 99,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                    }}
                  >
                    <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700' }}>
                      {subjects.length} {isPersian ? 'مضمون درسی' : 'Subjects'}
                    </Text>
                  </View>
                </View>

                {/* Admission & Approval Status Ribbon */}
                {isApproved ? (
                  <View
                    style={{
                      backgroundColor: isDark ? 'rgba(34, 197, 94, 0.14)' : 'rgba(34, 197, 94, 0.1)',
                      borderColor: colors.success,
                      borderWidth: 1,
                      borderRadius: 12,
                      paddingVertical: 10,
                      paddingHorizontal: 14,
                      marginBottom: 14,
                      flexDirection: isPersian ? 'row-reverse' : 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                    }}
                  >
                    <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                      <Text style={{ fontSize: 16 }}>✅</Text>
                      <Text style={{ color: colors.success, fontSize: 12.5, fontWeight: '800', textAlign: isPersian ? 'right' : 'left', flex: 1 }}>
                        {isPersian
                          ? 'شمولیت شما توسط اداره تأیید گردیده است! دسترسی کامل به تمام کتب، دروس و ویدیوهای صنف فعال می‌باشد.'
                          : 'Application approved by administration! Full access to all curriculum materials, textbooks, and lessons is active.'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleOpenGradeMaterials(item.grade)}
                      style={{
                        backgroundColor: colors.success,
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 11.5 }}>
                        {isPersian ? 'ورود به مواد درسی ←' : 'Open Materials →'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : isOtherGradeLocked ? (
                  <View
                    style={{
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
                      borderColor: colors.cardBorder,
                      borderWidth: 1,
                      borderRadius: 12,
                      paddingVertical: 10,
                      paddingHorizontal: 14,
                      marginBottom: 14,
                      flexDirection: isPersian ? 'row-reverse' : 'row',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>🔒</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 12, lineHeight: 18, fontWeight: '700', textAlign: isPersian ? 'right' : 'left', flex: 1 }}>
                      {isPersian
                        ? `شمولیت شما منحصراً در صنف ${approvedGrades[0]} است. مطابق درخواست اولیه، مواد درسی، کتب و ویدیوهای صنف ${item.grade} برای حساب شما مسدود می‌باشد.`
                        : `You are exclusively enrolled in Grade ${approvedGrades[0]}. Materials for Grade ${item.grade} are restricted and not accessible with your student account.`}
                    </Text>
                  </View>
                ) : isPending ? (
                  <View
                    style={{
                      backgroundColor: isDark ? 'rgba(234, 179, 8, 0.14)' : 'rgba(234, 179, 8, 0.1)',
                      borderColor: colors.goldBorder,
                      borderWidth: 1,
                      borderRadius: 12,
                      paddingVertical: 10,
                      paddingHorizontal: 14,
                      marginBottom: 14,
                      flexDirection: isPersian ? 'row-reverse' : 'row',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>⏳</Text>
                    <Text style={{ color: colors.gold, fontSize: 12, lineHeight: 18, fontWeight: '700', textAlign: isPersian ? 'right' : 'left', flex: 1 }}>
                      {isPersian
                        ? 'درخواست شمولیت شما به اداره مکتب ارسال شده و در حال بررسی است. در صورت لزوم با شما تماس گرفته می‌شود و به محض تأیید اداره، تمامی مواد و کتب درسی این صنف برای شما فعال می‌گردد.'
                        : 'Your application has been sent to school administration and is currently under review. If necessary, we will contact you. Upon approval, all materials for this grade will unlock here.'}
                    </Text>
                  </View>
                ) : (
                  <View
                    style={{
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                      borderColor: colors.cardBorder,
                      borderWidth: 1,
                      borderRadius: 12,
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      marginBottom: 14,
                      flexDirection: isPersian ? 'row-reverse' : 'row',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <Text style={{ fontSize: 13 }}>🔒</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 11.5, textAlign: isPersian ? 'right' : 'left', flex: 1 }}>
                      {isPersian
                        ? 'دسترسی به کتب، ویدیوهای تفصیلی و آزمون‌های این صنف نیازمند ارسال فورم ثبت‌نام و تأیید اداره مکتب می‌باشد.'
                        : 'Full access to textbooks, lessons, and quizzes requires submitting a registration form and administrative approval.'}
                    </Text>
                  </View>
                )}

                {/* Description */}
                <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 21, marginBottom: 14, textAlign: isPersian ? 'right' : 'left' }}>
                  {desc}
                </Text>

                {/* Subjects Pills */}
                <View style={{ marginBottom: 14 }}>
                  <Text style={{ color: colors.gold, fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginBottom: 6, textTransform: 'uppercase', textAlign: isPersian ? 'right' : 'left' }}>
                    {isPersian ? 'مضامین اصلی برنامه درسی:' : 'CORE SUBJECTS:'}
                  </Text>
                  <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: 6 }}>
                    {subjects.map((sub, sIdx) => (
                      <View
                        key={sIdx}
                        style={{
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                          borderRadius: 8,
                          paddingHorizontal: 9,
                          paddingVertical: 4,
                          borderWidth: 1,
                          borderColor: colors.cardBorder,
                        }}
                      >
                        <Text style={{ color: colors.text, fontSize: 11, fontWeight: '600' }}>
                          {sub}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Key Syllabus Topics */}
                <View style={{ backgroundColor: isDark ? 'rgba(15, 23, 42, 0.45)' : 'rgba(241, 245, 249, 0.7)', borderRadius: 14, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.cardBorder }}>
                  <Text style={{ color: colors.gold, fontSize: 10.5, fontWeight: '800', letterSpacing: 0.5, marginBottom: 6, textAlign: isPersian ? 'right' : 'left' }}>
                    {isPersian ? 'سرفصل‌های آموزشی برجسته:' : 'KEY SYLLABUS TOPICS:'}
                  </Text>
                  {keyTopics.map((topic, tIdx) => (
                    <Text key={tIdx} style={{ color: colors.text, fontSize: 12, lineHeight: 18, textAlign: isPersian ? 'right' : 'left' }}>
                      • {topic}
                    </Text>
                  ))}
                </View>

                {/* Online Implementation Model */}
                {item.onlineImplementation && item.onlineImplementation.length > 0 && (
                  <View style={{ backgroundColor: isDark ? 'rgba(15, 23, 42, 0.35)' : 'rgba(248, 250, 252, 0.9)', borderRadius: 14, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.cardBorder }}>
                    <Text style={{ color: colors.gold, fontSize: 10.5, fontWeight: '800', letterSpacing: 0.5, marginBottom: 6, textAlign: isPersian ? 'right' : 'left' }}>
                      {isPersian ? 'الگوی تطبیق و آموزش آنلاین:' : 'ONLINE IMPLEMENTATION MODEL:'}
                    </Text>
                    {(isPersian ? item.faOnlineImplementation : item.onlineImplementation).map((impl, iIdx) => (
                      <Text key={iIdx} style={{ color: colors.textSecondary, fontSize: 11.5, lineHeight: 18, textAlign: isPersian ? 'right' : 'left' }}>
                        ✓ {impl}
                      </Text>
                    ))}
                  </View>
                )}

                {/* Senior Pathways Options */}
                {item.seniorPathways && item.seniorPathways.length > 0 && (
                  <View style={{ backgroundColor: isDark ? 'rgba(250, 204, 21, 0.08)' : 'rgba(254, 240, 138, 0.2)', borderRadius: 14, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: colors.goldBorder }}>
                    <Text style={{ color: colors.gold, fontSize: 11, fontWeight: '900', letterSpacing: 0.5, marginBottom: 8, textAlign: isPersian ? 'right' : 'left' }}>
                      🚀 {isPersian ? 'مسیرهای تخصصی دوره لیسه (Senior Pathways):' : 'AVAILABLE SENIOR PATHWAYS:'}
                    </Text>
                    <View style={{ gap: 6 }}>
                      {item.seniorPathways.map((sp, spIdx) => (
                        <View key={spIdx} style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'flex-start', gap: 6 }}>
                          <Text style={{ color: colors.gold, fontWeight: '900', fontSize: 12 }}>•</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 11.5, textAlign: isPersian ? 'right' : 'left' }}>
                              {isPersian ? sp.faName : sp.name}
                            </Text>
                            <Text style={{ color: colors.textSecondary, fontSize: 10.5, lineHeight: 15, textAlign: isPersian ? 'right' : 'left' }}>
                              {isPersian ? sp.faDesc : sp.desc}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Bottom Actions and Material Hub Entrance */}
                <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.cardBorder, paddingTop: 12, flexWrap: 'wrap', gap: 10 }}>
                  <View style={{ flex: 1, minWidth: 220 }}>
                    <Text style={{ color: colors.text, fontWeight: '700', fontSize: 12, textAlign: isPersian ? 'right' : 'left' }}>
                      👨‍🏫 {faculty}
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 1, textAlign: isPersian ? 'right' : 'left' }}>
                      {facultyBio}
                    </Text>
                  </View>

                  <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', gap: 8, alignItems: 'center' }}>
                    {isApproved ? (
                      <TouchableOpacity
                        onPress={() => handleOpenGradeMaterials(item.grade)}
                        style={{
                          backgroundColor: colors.success,
                          borderRadius: 10,
                          paddingVertical: 9,
                          paddingHorizontal: 16,
                          flexDirection: isPersian ? 'row-reverse' : 'row',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '900' }}>
                          📚 {isPersian ? `مشاهده مواد درسی صنف ${item.grade}` : `View Grade ${item.grade} Materials`}
                        </Text>
                      </TouchableOpacity>
                    ) : isOtherGradeLocked ? (
                      <View
                        style={{
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
                          borderRadius: 10,
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          borderWidth: 1,
                          borderColor: colors.cardBorder,
                        }}
                      >
                        <Text style={{ color: colors.textMuted, fontSize: 11.5, fontWeight: '800' }}>
                          🔒 {isPersian ? `قفل (فقط صنف ${approvedGrades[0]})` : `Locked (Only Grade ${approvedGrades[0]})`}
                        </Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => router.push({ pathname: '/(student)/apply', params: { grade: String(item.grade) } } as any)}
                        style={{
                          backgroundColor: colors.gold,
                          borderRadius: 10,
                          paddingVertical: 8,
                          paddingHorizontal: 14,
                        }}
                      >
                        <Text style={{ color: isDark ? '#0F172A' : '#FFFFFF', fontSize: 12, fontWeight: '800' }}>
                          {isPersian ? `ثبت‌نام صنف ${item.grade} ←` : `Apply for Grade ${item.grade} →`}
                        </Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      onPress={() => {
                        const msg = isPersian
                          ? `جهت استعلام سرفصل‌ها و مشاوره اکادمیک صنف ${item.grade}، با بخش آموزش Farukh Online Education در ارتباط باشید (ایمیل: info@farukh.org).`
                          : `For academic inquiries regarding Grade ${item.grade}, contact Farukh Online Education at info@farukh.org.`;
                        if (Platform.OS === 'web' && typeof window !== 'undefined') {
                          window.alert(msg);
                        } else {
                          Alert.alert(isPersian ? 'راهنمای صنف' : 'Grade Information', msg);
                        }
                      }}
                      style={{
                        backgroundColor: colors.cardHover,
                        borderColor: colors.cardBorder,
                        borderWidth: 1,
                        borderRadius: 10,
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                      }}
                    >
                      <Text style={{ color: colors.text, fontSize: 11.5, fontWeight: '700' }}>
                        {isPersian ? 'استعلام' : 'Inquiry'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Grade Materials Hub Modal (Unlocked for Approved Students & Admin) */}
      <Modal
        visible={activeMaterialGrade !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActiveMaterialGrade(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 16,
          }}
        >
          <View
            style={{
              backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
              borderRadius: 24,
              borderWidth: 1.5,
              borderColor: colors.goldBorder,
              width: '100%',
              maxWidth: 760,
              maxHeight: '90%',
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            {/* Modal Header */}
            <View
              style={{
                padding: 18,
                borderBottomWidth: 1,
                borderBottomColor: colors.cardBorder,
                flexDirection: isPersian ? 'row-reverse' : 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: isDark ? 'rgba(30, 41, 59, 0.8)' : '#F8FAFC',
              }}
            >
              <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'center', gap: 10 }}>
                <View
                  style={{
                    backgroundColor: isModalGradeAllowed ? colors.gold : colors.textMuted,
                    borderRadius: 10,
                    width: 32,
                    height: 32,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: isModalGradeAllowed ? (isDark ? '#0F172A' : '#FFFFFF') : '#FFFFFF', fontWeight: '900', fontSize: 15 }}>
                    {isModalGradeAllowed ? activeMaterialGrade : '🔒'}
                  </Text>
                </View>
                <View>
                  <Text style={{ color: colors.text, fontWeight: '900', fontSize: 16, textAlign: isPersian ? 'right' : 'left' }}>
                    {isPersian
                      ? `مرکز مواد درسی و کتب صنف ${activeMaterialGrade}`
                      : `Grade ${activeMaterialGrade} Learning Materials`}
                  </Text>
                  <Text style={{ color: isModalGradeAllowed ? colors.success : '#EF4444', fontSize: 11, fontWeight: '700' }}>
                    {isModalGradeAllowed
                      ? `✓ ${isPersian ? 'دسترسی تأیید شده توسط اداره مکتب' : 'Approved by School Administration'}`
                      : `🔒 ${isPersian ? 'عدم دسترسی: خارج از صنف شمولیت شما' : 'Access Restricted: Not Enrolled'}`}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setActiveMaterialGrade(null)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.cardHover,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                }}
              >
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {!isModalGradeAllowed ? (
              <View style={{ padding: 36, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
                <View
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 4,
                  }}
                >
                  <Text style={{ fontSize: 28 }}>🔒</Text>
                </View>
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: '900', textAlign: 'center' }}>
                  {isPersian
                    ? `دسترسی به صنف ${activeMaterialGrade} مجاز نمی‌باشد`
                    : `Access to Grade ${activeMaterialGrade} Restricted`}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13.5, textAlign: 'center', lineHeight: 22, maxWidth: 480 }}>
                  {isPersian
                    ? `شمولیت شما منحصراً برای ${approvedGrades.length > 0 ? `صنف ${approvedGrades[0]}` : 'صنف درخواست‌شده'} فعال گردیده است. به منظور حفظ استانداردهای آموزشی مکتب دیجیتال، شاگردان تنها به کتب، دروس ویدیویی و آزمون‌های همان صنفی که در آن ثبت‌نام نموده‌اند دسترسی دارند.`
                    : `Your student enrollment is strictly limited to ${approvedGrades.length > 0 ? `Grade ${approvedGrades[0]}` : 'your requested grade'}. Textbooks, video lessons, and exams for other grades are locked.`}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setActiveMaterialGrade(null);
                    if (approvedGrades.length > 0) {
                      setActiveMaterialGrade(approvedGrades[0]);
                    }
                  }}
                  style={{
                    backgroundColor: colors.gold,
                    paddingVertical: 10,
                    paddingHorizontal: 22,
                    borderRadius: 12,
                    marginTop: 8,
                  }}
                >
                  <Text style={{ color: isDark ? '#0F172A' : '#FFFFFF', fontWeight: '800', fontSize: 13.5 }}>
                    {isPersian
                      ? (approvedGrades.length > 0 ? `ورود به صنف اختصاصی من (صنف ${approvedGrades[0]})` : 'بستن پنجره')
                      : (approvedGrades.length > 0 ? `Go to My Enrolled Grade (${approvedGrades[0]})` : 'Close')}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Modal Tabs */}
                <View
                  style={{
                    flexDirection: isPersian ? 'row-reverse' : 'row',
                    borderBottomWidth: 1,
                    borderBottomColor: colors.cardBorder,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    backgroundColor: isDark ? 'rgba(15, 23, 42, 0.5)' : '#FFFFFF',
                    gap: 8,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => setActiveMaterialTab('textbooks')}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      borderRadius: 10,
                      backgroundColor: activeMaterialTab === 'textbooks' ? colors.gold : 'transparent',
                    }}
                  >
                    <Text
                      style={{
                        color: activeMaterialTab === 'textbooks' ? (isDark ? '#0F172A' : '#FFFFFF') : colors.textSecondary,
                        fontWeight: '800',
                        fontSize: 12.5,
                      }}
                    >
                      📖 {isPersian ? 'کتب درسی رسمی' : 'Textbooks'} ({currentGradeMaterials?.textbooks.length || 0})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setActiveMaterialTab('videos')}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      borderRadius: 10,
                      backgroundColor: activeMaterialTab === 'videos' ? colors.gold : 'transparent',
                    }}
                  >
                    <Text
                      style={{
                        color: activeMaterialTab === 'videos' ? (isDark ? '#0F172A' : '#FFFFFF') : colors.textSecondary,
                        fontWeight: '800',
                        fontSize: 12.5,
                      }}
                    >
                      🎥 {isPersian ? 'ویدیوهای آموزشی' : 'Video Lessons'} ({currentGradeMaterials?.videoLessons.length || 0})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setActiveMaterialTab('quizzes')}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      borderRadius: 10,
                      backgroundColor: activeMaterialTab === 'quizzes' ? colors.gold : 'transparent',
                    }}
                  >
                    <Text
                      style={{
                        color: activeMaterialTab === 'quizzes' ? (isDark ? '#0F172A' : '#FFFFFF') : colors.textSecondary,
                        fontWeight: '800',
                        fontSize: 12.5,
                      }}
                    >
                      📝 {isPersian ? 'آزمون‌های خودسنجی' : 'Practice Exams'} ({currentGradeMaterials?.practiceQuizzes.length || 0})
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Modal Body Content */}
                <ScrollView
                  contentContainerStyle={{ padding: 18, gap: 12 }}
                  showsVerticalScrollIndicator={false}
                >
                  {activeMaterialTab === 'textbooks' && currentGradeMaterials?.textbooks && (
                    <>
                      <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 4, textAlign: isPersian ? 'right' : 'left' }}>
                        {isPersian
                          ? 'تمامی کتب رسمی صنف مربوطه مطابق نصاب تعلیمی وزارت معارف جهت مطالعه و دانلود دیجیتال:'
                          : 'All official curriculum textbooks available for digital study and download:'}
                      </Text>
                      {currentGradeMaterials.textbooks.map((tb) => (
                        <View
                          key={tb.id}
                          style={{
                            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.55)' : '#F8FAFC',
                            borderRadius: 14,
                            padding: 14,
                            borderWidth: 1,
                            borderColor: colors.cardBorder,
                            flexDirection: isPersian ? 'row-reverse' : 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 12,
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14, textAlign: isPersian ? 'right' : 'left' }}>
                              {isPersian ? tb.faTitle : tb.title}
                            </Text>
                            <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                              <Text style={{ color: colors.gold, fontSize: 11, fontWeight: '700' }}>
                                {isPersian ? tb.faSubject : tb.subject}
                              </Text>
                              <Text style={{ color: colors.textMuted, fontSize: 11 }}>•</Text>
                              <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                                {tb.durationOrPages}
                              </Text>
                            </View>
                          </View>
                          <TouchableOpacity
                            onPress={() => setPreviewMaterial(tb)}
                            style={{
                              backgroundColor: colors.gold,
                              paddingVertical: 8,
                              paddingHorizontal: 14,
                              borderRadius: 10,
                            }}
                          >
                            <Text style={{ color: isDark ? '#0F172A' : '#FFFFFF', fontWeight: '800', fontSize: 12 }}>
                              📖 {isPersian ? 'مطالعه کتاب' : 'Read Book'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </>
                  )}

                  {activeMaterialTab === 'videos' && currentGradeMaterials?.videoLessons && (
                    <>
                      <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 4, textAlign: isPersian ? 'right' : 'left' }}>
                        {isPersian
                          ? 'جلسات ویدیویی تدریس مباحث کلیدی توسط اساتید باسابقه:'
                          : 'Recorded instructional videos explaining core syllabus topics:'}
                      </Text>
                      {currentGradeMaterials.videoLessons.map((vid) => (
                        <View
                          key={vid.id}
                          style={{
                            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.55)' : '#F8FAFC',
                            borderRadius: 14,
                            padding: 14,
                            borderWidth: 1,
                            borderColor: colors.cardBorder,
                            flexDirection: isPersian ? 'row-reverse' : 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 12,
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14, textAlign: isPersian ? 'right' : 'left' }}>
                              {isPersian ? vid.faTitle : vid.title}
                            </Text>
                            <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                              <Text style={{ color: colors.gold, fontSize: 11, fontWeight: '700' }}>
                                {isPersian ? vid.faSubject : vid.subject}
                              </Text>
                              <Text style={{ color: colors.textMuted, fontSize: 11 }}>•</Text>
                              <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                                ⏱️ {vid.durationOrPages}
                              </Text>
                            </View>
                          </View>
                          <TouchableOpacity
                            onPress={() => setPreviewMaterial(vid)}
                            style={{
                              backgroundColor: colors.primary,
                              paddingVertical: 8,
                              paddingHorizontal: 14,
                              borderRadius: 10,
                            }}
                          >
                            <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12 }}>
                              ▶️ {isPersian ? 'مشاهده درس' : 'Watch Lesson'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </>
                  )}

                  {activeMaterialTab === 'quizzes' && currentGradeMaterials?.practiceQuizzes && (
                    <>
                      <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 4, textAlign: isPersian ? 'right' : 'left' }}>
                        {isPersian
                          ? 'امتحانات شبیه‌ساز و ارزیابی خودسنجی جهت تثبیت یادگیری شاگردان:'
                          : 'Self-assessment tests and simulated diagnostic exams:'}
                      </Text>
                      {currentGradeMaterials.practiceQuizzes.map((qz) => (
                        <View
                          key={qz.id}
                          style={{
                            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.55)' : '#F8FAFC',
                            borderRadius: 14,
                            padding: 14,
                            borderWidth: 1,
                            borderColor: colors.cardBorder,
                            flexDirection: isPersian ? 'row-reverse' : 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 12,
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14, textAlign: isPersian ? 'right' : 'left' }}>
                              {isPersian ? qz.faTitle : qz.title}
                            </Text>
                            <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                              <Text style={{ color: colors.gold, fontSize: 11, fontWeight: '700' }}>
                                {isPersian ? qz.faSubject : qz.subject}
                              </Text>
                              <Text style={{ color: colors.textMuted, fontSize: 11 }}>•</Text>
                              <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                                📝 {qz.durationOrPages}
                              </Text>
                            </View>
                          </View>
                          <TouchableOpacity
                            onPress={() => alert(isPersian ? `آزمون "${qz.faTitle}" در حال آماده‌سازی و بارگذاری است.` : `Practice test "${qz.title}" is loading.`)}
                            style={{
                              backgroundColor: colors.gold,
                              paddingVertical: 8,
                              paddingHorizontal: 14,
                              borderRadius: 10,
                            }}
                          >
                            <Text style={{ color: isDark ? '#0F172A' : '#FFFFFF', fontWeight: '800', fontSize: 12 }}>
                              ✍️ {isPersian ? 'شروع آزمون' : 'Start Exam'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Teacher Application Modal (For Girls' School Educators) */}
      <TeacherApplicationModal
        visible={showTeacherModal}
        onClose={() => setShowTeacherModal(false)}
        onSuccess={(ref) => {
          // Success feedback already displayed inside modal
        }}
      />

      {/* Internal In-App Material Reader / Viewer Modal (Zero external links) */}
      <Modal
        visible={previewMaterial !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setPreviewMaterial(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 16,
          }}
        >
          <View
            style={{
              backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
              borderRadius: 24,
              borderWidth: 1.5,
              borderColor: colors.goldBorder,
              width: '100%',
              maxWidth: 620,
              padding: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.5,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            {previewMaterial && (
              <>
                <View
                  style={{
                    flexDirection: isPersian ? 'row-reverse' : 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.cardBorder,
                    paddingBottom: 14,
                  }}
                >
                  <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'center', gap: 10 }}>
                    <Text style={{ fontSize: 28 }}>
                      {previewMaterial.type === 'textbook' ? '📖' : previewMaterial.type === 'video' ? '🎬' : '📝'}
                    </Text>
                    <View>
                      <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900', textAlign: isPersian ? 'right' : 'left' }}>
                        {isPersian ? previewMaterial.faTitle : previewMaterial.title}
                      </Text>
                      <Text style={{ color: colors.gold, fontSize: 11.5, fontWeight: '700', textAlign: isPersian ? 'right' : 'left' }}>
                        {isPersian ? previewMaterial.faSubject : previewMaterial.subject} • {previewMaterial.durationOrPages}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => setPreviewMaterial(null)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: colors.textSecondary, fontWeight: 'bold' }}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View
                  style={{
                    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                    marginBottom: 18,
                  }}
                >
                  <Text style={{ color: colors.gold, fontSize: 12.5, fontWeight: '800', marginBottom: 6, textAlign: isPersian ? 'right' : 'left' }}>
                    {isPersian ? 'راهنمای مطالعه و محتوای درس در پلتفرم Farukh' : 'Internal Learning Guide & Syllabus Overview'}
                  </Text>
                  <Text style={{ color: colors.text, fontSize: 13, lineHeight: 22, textAlign: isPersian ? 'right' : 'left' }}>
                    {isPersian
                      ? 'این منبع آموزشی به صورت کاملاً یکپارچه و بهینه‌سازی‌شده برای انترنت کم‌سرعت درون سامانه تعبیه گردیده است. جلسات ویدیویی و متون کتاب‌ها مستقیماً در کلاس‌های اختصاصی هر صنف توسط آموزگاران مکتب تدریس و پشتیبانی می‌شوند.'
                      : 'This educational resource is fully integrated and optimized for low-bandwidth access within the platform. Recorded lessons and text materials are supported and guided by verified school teachers in your classroom.'}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => setPreviewMaterial(null)}
                  style={{
                    backgroundColor: colors.gold,
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: isDark ? '#0F172A' : '#FFFFFF', fontWeight: '800', fontSize: 13 }}>
                    {isPersian ? 'متوجه شدم (بازگشت به درس‌ها)' : 'Understood (Back to Lessons)'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}
