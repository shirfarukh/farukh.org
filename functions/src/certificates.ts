import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as QRCode from 'qrcode';
import { z } from 'zod';
import { validateInput } from './middleware';

export async function issueCertificateInternal(uid: string, courseId: string, scorePercent: number) {
  const db = admin.firestore();

  // 1. Idempotency Check: search existing non-revoked certificate
  const existingSnap = await db.collection('certificates')
    .where('uid', '==', uid)
    .where('courseId', '==', courseId)
    .where('revoked', '==', false)
    .get();

  if (!existingSnap.empty) {
    const existing = existingSnap.docs[0];
    return { certificateId: existing.id, pdfPath: existing.data().pdfPath };
  }

  // 2. Fetch User & Course Info
  const userDoc = await db.collection('users').doc(uid).get();
  const userData = userDoc.exists ? userDoc.data() : { displayName: 'Student' };
  const studentName = userData?.displayName || 'Student';

  const courseDoc = await db.collection('courses').doc(courseId).get();
  const courseTitle = courseDoc.exists ? courseDoc.data()?.title || 'Course' : 'Course';

  // 3. Generate Unique Certificate ID & Verification URL
  const certificateRef = db.collection('certificates').doc();
  const certificateId = certificateRef.id;
  const verifyUrl = `https://${process.env.GCLOUD_PROJECT || 'demo-learning-app'}.web.app/verify/${certificateId}`;

  // 4. Generate QR Code Buffer
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 200 });
  const qrImageBase64 = qrDataUrl.split(',')[1];
  const qrBuffer = Buffer.from(qrImageBase64, 'base64');

  // 5. Create PDF Document using pdf-lib
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([1000, 700]);
  const { width, height } = page.getSize();

  const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Background border
  page.drawRectangle({
    x: 30,
    y: 30,
    width: width - 60,
    height: height - 60,
    borderColor: rgb(0.15, 0.38, 0.92),
    borderWidth: 4,
  });

  // Certificate Header
  page.drawText('CERTIFICATE OF COMPLETION', {
    x: 230,
    y: 560,
    size: 32,
    font: titleFont,
    color: rgb(0.06, 0.09, 0.16),
  });

  page.drawText('THIS IS PROUDLY PRESENTED TO', {
    x: 350,
    y: 490,
    size: 14,
    font: regularFont,
    color: rgb(0.4, 0.45, 0.55),
  });

  // Student Name
  page.drawText(studentName.toUpperCase(), {
    x: 250,
    y: 420,
    size: 28,
    font: titleFont,
    color: rgb(0.15, 0.38, 0.92),
  });

  page.drawText('For successfully passing the final examination for the course:', {
    x: 270,
    y: 360,
    size: 14,
    font: regularFont,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Course Title
  page.drawText(courseTitle, {
    x: 250,
    y: 310,
    size: 22,
    font: titleFont,
    color: rgb(0.06, 0.09, 0.16),
  });

  // Details
  const issueDateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  page.drawText(`Score: ${scorePercent}%  |  Date: ${issueDateStr}  |  ID: ${certificateId}`, {
    x: 230,
    y: 240,
    size: 12,
    font: regularFont,
    color: rgb(0.4, 0.4, 0.4),
  });

  // Embed QR Code
  const qrImage = await pdfDoc.embedPng(qrBuffer);
  page.drawImage(qrImage, {
    x: 80,
    y: 80,
    width: 100,
    height: 100,
  });

  page.drawText('Scan to Verify', {
    x: 90,
    y: 65,
    size: 10,
    font: regularFont,
    color: rgb(0.5, 0.5, 0.5),
  });

  const pdfBytes = await pdfDoc.save();

  // 6. Upload PDF to Firebase Storage
  const pdfPath = `certificates/${certificateId}.pdf`;
  const bucket = admin.storage().bucket();
  const file = bucket.file(pdfPath);
  await file.save(Buffer.from(pdfBytes), {
    contentType: 'application/pdf',
    public: true,
  });

  // 7. Write Certificate Document to Firestore
  await certificateRef.set({
    uid,
    courseId,
    studentName,
    courseTitle,
    scorePercent,
    issuedAt: admin.firestore.FieldValue.serverTimestamp(),
    pdfPath,
    revoked: false,
  });

  return { certificateId, pdfPath };
}

const VerifyCertificateSchema = z.object({
  certificateId: z.string(),
});

export const verifyCertificate = onCall(async (request) => {
  const { certificateId } = validateInput(VerifyCertificateSchema, request.data);
  const db = admin.firestore();

  const certDoc = await db.collection('certificates').doc(certificateId).get();
  if (!certDoc.exists) {
    throw new HttpsError('not-found', 'Certificate not found.');
  }

  const certData = certDoc.data()!;
  return {
    certificateId,
    studentName: certData.studentName,
    courseTitle: certData.courseTitle,
    scorePercent: certData.scorePercent,
    issuedAt: certData.issuedAt,
    revoked: certData.revoked || false,
    pdfPath: certData.pdfPath,
  };
});
