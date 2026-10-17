import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import * as QRCode from 'qrcode';
import { z } from 'zod';
import { validateEnglishName, validatePersianName, escapeHtml } from './validation';
import { assertAdmin, validateInput } from './middleware';

export interface FieldCoord {
  id: string;
  top: number;
  left: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  fontStyle?: string;
  color: string;
  textAlign: string;
  direction: 'ltr' | 'rtl';
}

const DEFAULT_FIELDS: FieldCoord[] = [
  {
    id: 'nameFa',
    top: 26.8,
    left: 42.0,
    width: 25.5,
    height: 4.0,
    fontSize: 32,
    fontFamily: 'Vazirmatn, sans-serif',
    fontWeight: '800',
    color: '#0b1a30',
    textAlign: 'center',
    direction: 'rtl',
  },
  {
    id: 'courseFa',
    top: 32.5,
    left: 10.5,
    width: 58.0,
    height: 3.8,
    fontSize: 26,
    fontFamily: 'Vazirmatn, sans-serif',
    fontWeight: '700',
    color: '#0b1a30',
    textAlign: 'center',
    direction: 'rtl',
  },
  {
    id: 'nameEn',
    top: 54.8,
    left: 28.0,
    width: 50.0,
    height: 4.0,
    fontSize: 34,
    fontFamily: "'Playfair Display', serif",
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#0b1a30',
    textAlign: 'center',
    direction: 'ltr',
  },
  {
    id: 'courseEn',
    top: 60.8,
    left: 48.5,
    width: 41.0,
    height: 4.0,
    fontSize: 25,
    fontFamily: "'Inter', sans-serif",
    fontWeight: '700',
    color: '#0b1a30',
    textAlign: 'center',
    direction: 'ltr',
  },
  {
    id: 'date',
    top: 81.8,
    left: 31.0,
    width: 14.0,
    height: 3.0,
    fontSize: 14,
    fontFamily: "'Inter', 'Vazirmatn', sans-serif",
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    direction: 'ltr',
  },
  {
    id: 'qr',
    top: 73.1,
    left: 15.6,
    width: 7.2,
    height: 9.7,
    fontSize: 0,
    fontFamily: 'sans-serif',
    fontWeight: 'normal',
    color: '#000000',
    textAlign: 'center',
    direction: 'ltr',
  },
  {
    id: 'certificateId',
    top: 89.2,
    left: 11.0,
    width: 16.5,
    height: 2.5,
    fontSize: 13,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
    direction: 'ltr',
  },
];

async function getChromiumExecutablePath(): Promise<string> {
  if (process.platform === 'darwin') {
    const macPaths = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
    ];
    for (const p of macPaths) {
      if (fs.existsSync(p)) return p;
    }
  }
  // In Linux / Cloud Functions
  return await chromium.executablePath();
}

function loadDefaultTemplateBase64(): string {
  const possiblePaths = [
    path.join(__dirname, 'assets', 'certificate-template-default.jpg'),
    path.join(__dirname, '..', 'src', 'assets', 'certificate-template-default.jpg'),
    path.join(process.cwd(), 'assets', 'certificate-template-default.jpg'),
    path.join(process.cwd(), '..', 'assets', 'certificate-template-default.jpg'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return fs.readFileSync(p).toString('base64');
    }
  }
  return '';
}

export function buildCertificateHtml(params: {
  bgDataUri: string;
  nameEn: string;
  nameFa: string;
  courseTitleEn: string;
  courseTitleFa: string;
  dateCombined: string;
  qrDataUrl: string;
  certificateId: string;
  fields?: FieldCoord[];
}): string {
  const fields = params.fields && params.fields.length > 0 ? params.fields : DEFAULT_FIELDS;

  const fieldMap: Record<string, FieldCoord> = {};
  for (const f of fields) {
    fieldMap[f.id] = f;
  }

  const fNameFa = fieldMap['nameFa'] || DEFAULT_FIELDS[0];
  const fCourseFa = fieldMap['courseFa'] || DEFAULT_FIELDS[1];
  const fNameEn = fieldMap['nameEn'] || DEFAULT_FIELDS[2];
  const fCourseEn = fieldMap['courseEn'] || DEFAULT_FIELDS[3];
  const fDate = fieldMap['date'] || DEFAULT_FIELDS[4];
  const fQr = fieldMap['qr'] || DEFAULT_FIELDS[5];
  const fCertId = fieldMap['certificateId'] || DEFAULT_FIELDS[6];

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Certificate - ${escapeHtml(params.nameEn)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@500;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=Inter:wght@500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      margin: 0;
      padding: 0;
      background-color: #0b1329;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .cert-container {
      position: relative;
      width: 1920px;
      height: 1434px;
      background-image: url('${params.bgDataUri}');
      background-size: 100% 100%;
      background-repeat: no-repeat;
      overflow: hidden;
    }
    .field {
      position: absolute;
      display: flex;
      align-items: center;
      white-space: nowrap;
      overflow: hidden;
      line-height: 1.2;
    }
    .auto-shrink {
      display: inline-block;
      white-space: nowrap;
    }
    .field-name-fa {
      top: ${fNameFa.top}%;
      left: ${fNameFa.left}%;
      width: ${fNameFa.width}%;
      height: ${fNameFa.height}%;
      justify-content: ${fNameFa.textAlign};
      font-family: ${fNameFa.fontFamily};
      font-weight: ${fNameFa.fontWeight};
      font-size: ${fNameFa.fontSize}px;
      color: ${fNameFa.color};
      direction: ${fNameFa.direction};
    }
    .field-course-fa {
      top: ${fCourseFa.top}%;
      left: ${fCourseFa.left}%;
      width: ${fCourseFa.width}%;
      height: ${fCourseFa.height}%;
      justify-content: ${fCourseFa.textAlign};
      font-family: ${fCourseFa.fontFamily};
      font-weight: ${fCourseFa.fontWeight};
      font-size: ${fCourseFa.fontSize}px;
      color: ${fCourseFa.color};
      direction: ${fCourseFa.direction};
    }
    .field-name-en {
      top: ${fNameEn.top}%;
      left: ${fNameEn.left}%;
      width: ${fNameEn.width}%;
      height: ${fNameEn.height}%;
      justify-content: ${fNameEn.textAlign};
      font-family: ${fNameEn.fontFamily};
      font-weight: ${fNameEn.fontWeight};
      font-style: ${fNameEn.fontStyle || 'italic'};
      font-size: ${fNameEn.fontSize}px;
      color: ${fNameEn.color};
      letter-spacing: 0.5px;
    }
    .field-course-en {
      top: ${fCourseEn.top}%;
      left: ${fCourseEn.left}%;
      width: ${fCourseEn.width}%;
      height: ${fCourseEn.height}%;
      justify-content: ${fCourseEn.textAlign};
      font-family: ${fCourseEn.fontFamily};
      font-weight: ${fCourseEn.fontWeight};
      font-size: ${fCourseEn.fontSize}px;
      color: ${fCourseEn.color};
    }
    .field-date {
      top: ${fDate.top}%;
      left: ${fDate.left}%;
      width: ${fDate.width}%;
      height: ${fDate.height}%;
      justify-content: ${fDate.textAlign};
      font-family: ${fDate.fontFamily};
      font-weight: ${fDate.fontWeight};
      font-size: ${fDate.fontSize}px;
      color: ${fDate.color};
    }
    .field-qr {
      top: ${fQr.top}%;
      left: ${fQr.left}%;
      width: ${fQr.width}%;
      height: ${fQr.height}%;
    }
    .field-qr img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .field-cert-id {
      top: ${fCertId.top}%;
      left: ${fCertId.left}%;
      width: ${fCertId.width}%;
      height: ${fCertId.height}%;
      justify-content: ${fCertId.textAlign};
      font-family: ${fCertId.fontFamily};
      font-weight: ${fCertId.fontWeight};
      font-size: ${fCertId.fontSize}px;
      color: ${fCertId.color};
    }
  </style>
</head>
<body>
  <div class="cert-container">
    <div class="field field-name-fa"><span class="auto-shrink">${escapeHtml(params.nameFa)}</span></div>
    <div class="field field-course-fa"><span class="auto-shrink">${escapeHtml(params.courseTitleFa)}</span></div>
    <div class="field field-name-en"><span class="auto-shrink">${escapeHtml(params.nameEn)}</span></div>
    <div class="field field-course-en"><span class="auto-shrink">${escapeHtml(params.courseTitleEn)}</span></div>
    <div class="field field-date"><span class="auto-shrink">${escapeHtml(params.dateCombined)}</span></div>
    <div class="field field-qr"><img src="${params.qrDataUrl}" alt="Verification QR Code" /></div>
    <div class="field field-cert-id">ID: ${escapeHtml(params.certificateId)}</div>
  </div>

  <script>
    // Auto-shrink text to fit inside container box
    function autoFitBoxes() {
      document.querySelectorAll('.field').forEach(function(field) {
        var span = field.querySelector('.auto-shrink');
        if (!span) return;
        var style = window.getComputedStyle(field);
        var currentSize = parseFloat(style.fontSize);
        var minSize = 12;
        while ((span.scrollWidth > field.clientWidth || span.scrollHeight > field.clientHeight) && currentSize > minSize) {
          currentSize -= 1;
          field.style.fontSize = currentSize + 'px';
        }
      });
    }
    window.addEventListener('load', autoFitBoxes);
    autoFitBoxes();
  </script>
</body>
</html>
`;
}

// -------------------------------------------------------------
// Cloud Function: issueCertificate
// Memory: 1GiB - 2GiB, Timeout: 60s
// -------------------------------------------------------------
const IssueCertificateSchema = z.object({
  attemptId: z.string().min(1),
  nameEn: z.string().min(2).max(60),
  nameFa: z.string().min(2).max(60),
});

export const issueCertificate = onCall({
  memory: '1GiB',
  timeoutSeconds: 60,
  maxInstances: 10,
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated to request certificate issuance.');
  }

  const { attemptId, nameEn: rawNameEn, nameFa: rawNameFa } = validateInput(IssueCertificateSchema, request.data);

  // Validate English name
  const enValidation = validateEnglishName(rawNameEn);
  if (!enValidation.isValid) {
    throw new HttpsError('invalid-argument', enValidation.errorEn || 'Invalid English name.');
  }

  // Validate Persian name
  const faValidation = validatePersianName(rawNameFa);
  if (!faValidation.isValid) {
    throw new HttpsError('invalid-argument', faValidation.errorEn || 'Invalid Persian name.');
  }

  const nameEn = rawNameEn.trim();
  const nameFa = rawNameFa.trim();
  const uid = request.auth.uid;
  const db = admin.firestore();

  // 1. Verify Attempt & Ownership
  const attemptRef = db.collection('examAttempts').doc(attemptId);
  const attemptDoc = await attemptRef.get();

  if (!attemptDoc.exists) {
    throw new HttpsError('not-found', 'Final exam attempt not found.');
  }

  const attemptData = attemptDoc.data()!;

  if (attemptData.uid !== uid) {
    throw new HttpsError('permission-denied', 'You do not own this exam attempt.');
  }

  if (!attemptData.passed) {
    throw new HttpsError('failed-precondition', 'Exam attempt was not passed. Minimum 80% is required for certificate.');
  }

  const courseId = attemptData.courseId;

  // 2. Idempotency Check: search for existing non-revoked certificate
  const existingSnap = await db.collection('certificates')
    .where('uid', '==', uid)
    .where('courseId', '==', courseId)
    .where('revoked', '==', false)
    .get();

  if (!existingSnap.empty) {
    const existing = existingSnap.docs[0];
    const existingData = existing.data();
    return {
      certificateId: existing.id,
      status: existingData.status || 'ready',
      pdfPath: existingData.pdfPath,
      jpgPath: existingData.jpgPath,
      nameEn: existingData.nameEn,
      nameFa: existingData.nameFa,
      isExisting: true,
    };
  }

  // 3. Fetch Course Info
  const courseDoc = await db.collection('courses').doc(courseId).get();
  const courseData = courseDoc.exists ? courseDoc.data() : null;
  const courseTitleEn = courseData?.title || 'Certified Course';
  const courseTitleFa = courseData?.faTitle || courseData?.title || 'دوره تخصصی';

  // 4. Generate random unguessable Certificate ID
  const certificateId = 'cert_' + crypto.randomBytes(12).toString('hex');

  // Format Dates server-side (Gregorian & Jalali)
  const now = new Date();
  const dateGregorian = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(now);
  const dateJalali = new Intl.DateTimeFormat('fa-AF-u-ca-persian', { year: 'numeric', month: 'long', day: 'numeric' }).format(now);
  const dateCombined = `${dateGregorian} / ${dateJalali}`;

  // 5. Verification URL & QR code
  const permanentDomain = process.env.PERMANENT_DOMAIN || 'farukh.org';
  const verifyUrl = `https://${permanentDomain}/verify/${certificateId}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 300 });

  // 6. Write initial document with status: 'generating'
  const certRef = db.collection('certificates').doc(certificateId);
  await certRef.set({
    certificateId,
    uid,
    courseId,
    attemptId,
    nameEn,
    nameFa,
    studentName: nameEn,
    courseTitle: courseTitleEn,
    courseTitleEn,
    courseTitleFa,
    scorePercent: attemptData.scorePercent || 100,
    issuedAt: admin.firestore.FieldValue.serverTimestamp(),
    dateGregorian,
    dateJalali,
    templateId: 'default',
    status: 'generating',
    revoked: false,
  });

  try {
    // 7. Check for Course-specific Certificate Template in Firestore
    const templateDoc = await db.collection('courses').doc(courseId).collection('certificateTemplate').doc('default').get();
    let bgDataUri = '';
    let customFields: FieldCoord[] | undefined = undefined;

    if (templateDoc.exists) {
      const tData = templateDoc.data();
      if (tData?.backgroundUrl) {
        bgDataUri = tData.backgroundUrl;
      }
      if (tData?.fields && Array.isArray(tData.fields)) {
        customFields = tData.fields;
      }
    }

    if (!bgDataUri) {
      const defaultB64 = loadDefaultTemplateBase64();
      bgDataUri = defaultB64 ? `data:image/jpeg;base64,${defaultB64}` : '';
    }

    // 8. Build HTML Template with embedded Vazirmatn + Latin fonts
    const html = buildCertificateHtml({
      bgDataUri,
      nameEn,
      nameFa,
      courseTitleEn,
      courseTitleFa,
      dateCombined,
      qrDataUrl,
      certificateId,
      fields: customFields,
    });

    // 9. Launch Headless Chromium & Render High-Resolution PDF + JPG
    const executablePath = await getChromiumExecutablePath();
    const browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: process.platform === 'darwin'
        ? ['--no-sandbox', '--disable-setuid-sandbox']
        : chromium.args,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1434, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: ['load', 'domcontentloaded'] });

    const pdfBuffer = await page.pdf({
      width: '1920px',
      height: '1434px',
      printBackground: true,
      preferCSSPageSize: true,
    });

    const jpgBuffer = await page.screenshot({
      type: 'jpeg',
      quality: 95,
      fullPage: true,
    });

    await browser.close();

    // 10. Save to Storage (PDF and JPG)
    const pdfPath = `certificates/${certificateId}.pdf`;
    const jpgPath = `certificates/${certificateId}.jpg`;
    const bucket = admin.storage().bucket();

    await bucket.file(pdfPath).save(Buffer.from(pdfBuffer), {
      contentType: 'application/pdf',
      metadata: {
        certificateId,
        uid,
        courseId,
      },
    });

    await bucket.file(jpgPath).save(Buffer.from(jpgBuffer), {
      contentType: 'image/jpeg',
      metadata: {
        certificateId,
        uid,
        courseId,
      },
    });

    // 11. Update Certificate Document to status: 'ready'
    await certRef.update({
      status: 'ready',
      pdfPath,
      jpgPath,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 12. Lock Student Name permanently in User Profile
    await db.collection('users').doc(uid).set({
      nameEn,
      nameFa,
      nameLocked: true,
      lastCertificateIssuedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    return {
      certificateId,
      status: 'ready',
      pdfPath,
      jpgPath,
      nameEn,
      nameFa,
    };
  } catch (err: any) {
    console.error('Error during certificate rendering or storage:', err);
    await certRef.update({
      status: 'failed',
      renderError: err.message || 'Rendering error',
    });
    throw new HttpsError('internal', `Certificate generation failed: ${err.message}`);
  }
});

// -------------------------------------------------------------
// Cloud Function: verifyCertificate (Public Bilingual Verification)
// -------------------------------------------------------------
const VerifyCertificateSchema = z.object({
  certificateId: z.string().min(1),
});

export const verifyCertificate = onCall(async (request) => {
  const { certificateId } = validateInput(VerifyCertificateSchema, request.data);
  const db = admin.firestore();

  const certDoc = await db.collection('certificates').doc(certificateId).get();
  if (!certDoc.exists) {
    throw new HttpsError('not-found', 'Certificate not found.');
  }

  const certData = certDoc.data()!;

  // Returns ONLY public fields (Names, Course, Date, Status, Revoked)
  return {
    certificateId,
    valid: !certData.revoked && certData.status === 'ready',
    revoked: certData.revoked || false,
    revokedReason: certData.revokedReason || null,
    nameEn: certData.nameEn || certData.studentName || 'Certified Student',
    nameFa: certData.nameFa || '',
    courseTitleEn: certData.courseTitleEn || certData.courseTitle || 'Certified Course',
    courseTitleFa: certData.courseTitleFa || '',
    dateGregorian: certData.dateGregorian || '',
    dateJalali: certData.dateJalali || '',
    scorePercent: certData.scorePercent,
    status: certData.status || 'ready',
    pdfPath: certData.pdfPath,
    jpgPath: certData.jpgPath,
  };
});

// -------------------------------------------------------------
// Cloud Function: adminRevokeCertificate (Admin Only)
// -------------------------------------------------------------
const RevokeCertificateSchema = z.object({
  certificateId: z.string().min(1),
  reason: z.string().optional(),
});

export const adminRevokeCertificate = onCall(async (request) => {
  assertAdmin(request);
  const { certificateId, reason } = validateInput(RevokeCertificateSchema, request.data);
  const db = admin.firestore();

  const certRef = db.collection('certificates').doc(certificateId);
  const certDoc = await certRef.get();
  if (!certDoc.exists) {
    throw new HttpsError('not-found', 'Certificate not found.');
  }

  await certRef.update({
    revoked: true,
    revokedAt: admin.firestore.FieldValue.serverTimestamp(),
    revokedReason: reason || 'Administrative revocation',
  });

  return { success: true, certificateId, revoked: true };
});

// -------------------------------------------------------------
// Cloud Function: adminReissueCertificate (Admin Only)
// -------------------------------------------------------------
const ReissueCertificateSchema = z.object({
  certificateId: z.string().min(1),
});

export const adminReissueCertificate = onCall(async (request) => {
  assertAdmin(request);
  const { certificateId } = validateInput(ReissueCertificateSchema, request.data);
  const db = admin.firestore();

  const certRef = db.collection('certificates').doc(certificateId);
  const certDoc = await certRef.get();
  if (!certDoc.exists) {
    throw new HttpsError('not-found', 'Certificate not found.');
  }

  await certRef.update({
    revoked: false,
    revokedAt: null,
    revokedReason: null,
    reissuedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true, certificateId, revoked: false };
});

// -------------------------------------------------------------
// Cloud Function: adminSaveCertificateTemplate (Admin Only)
// -------------------------------------------------------------
const SaveTemplateSchema = z.object({
  courseId: z.string().min(1),
  template: z.object({
    backgroundUrl: z.string(),
    fields: z.array(z.any()),
  }),
});

export const adminSaveCertificateTemplate = onCall(async (request) => {
  assertAdmin(request);
  const { courseId, template } = validateInput(SaveTemplateSchema, request.data);
  const db = admin.firestore();

  await db.collection('courses').doc(courseId).collection('certificateTemplate').doc('default').set({
    ...template,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  return { success: true, courseId };
});
