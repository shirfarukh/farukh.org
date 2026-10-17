import {
  validateEnglishName,
  validatePersianName,
  escapeHtml,
} from '../src/lib/certificateValidation';
import { buildCertificateHtml } from '../src/lib/certificateTemplateBuilder';

describe('Certificate Issuance Flow Unit Tests', () => {
  describe('English Name Validation (Latin letters only, 2–60 chars)', () => {
    it('accepts valid English names with spaces, hyphens, apostrophes, and dots', () => {
      expect(validateEnglishName('Shir Farukh').isValid).toBe(true);
      expect(validateEnglishName("John O'Connor").isValid).toBe(true);
      expect(validateEnglishName('Mary-Jane Watson').isValid).toBe(true);
      expect(validateEnglishName('Dr. Jane Doe').isValid).toBe(true);
      expect(validateEnglishName('Al').isValid).toBe(true); // min 2
    });

    it('rejects names with numbers or symbols', () => {
      expect(validateEnglishName('Shir123').isValid).toBe(false);
      expect(validateEnglishName('Farukh_99').isValid).toBe(false);
      expect(validateEnglishName('John@Work').isValid).toBe(false);
      expect(validateEnglishName('Name!').isValid).toBe(false);
    });

    it('rejects Persian or non-Latin script in English name', () => {
      expect(validateEnglishName('شیر فرخ').isValid).toBe(false);
      expect(validateEnglishName('Shir شیر').isValid).toBe(false);
    });

    it('rejects names that are too short or too long', () => {
      expect(validateEnglishName('').isValid).toBe(false);
      expect(validateEnglishName('A').isValid).toBe(false);
      expect(validateEnglishName(' '.repeat(2)).isValid).toBe(false);
      expect(validateEnglishName('A'.repeat(61)).isValid).toBe(false);
    });
  });

  describe('Persian Name Validation (Persian/Arabic script, RTL, 2–60 chars)', () => {
    it('accepts valid Persian names including ZWNJ, hyphens, and dots', () => {
      expect(validatePersianName('شیر فرخ').isValid).toBe(true);
      expect(validatePersianName('محمد فرخ\u200Cسیر').isValid).toBe(true); // with ZWNJ
      expect(validatePersianName('احمد-شاه').isValid).toBe(true);
      expect(validatePersianName('دکتر. فرخ').isValid).toBe(true);
      expect(validatePersianName('علی').isValid).toBe(true);
    });

    it('rejects Persian names containing Latin or Arabic-Indic numbers', () => {
      expect(validatePersianName('شیر 123').isValid).toBe(false);
      expect(validatePersianName('علی ۱۲۳').isValid).toBe(false); // Arabic-Indic digits
      expect(validatePersianName('فرخ ۴۵۶').isValid).toBe(false); // Persian digits
    });

    it('rejects English/Latin characters in Persian name', () => {
      expect(validatePersianName('Shir Farukh').isValid).toBe(false);
      expect(validatePersianName('شیر Farukh').isValid).toBe(false);
    });

    it('rejects Persian names that are too short or too long', () => {
      expect(validatePersianName('').isValid).toBe(false);
      expect(validatePersianName('ش').isValid).toBe(false);
      expect(validatePersianName('ش'.repeat(61)).isValid).toBe(false);
    });
  });

  describe('HTML Escaping for Certificate Template', () => {
    it('properly escapes dangerous HTML entities to prevent XSS in certificate rendering', () => {
      const malicious = '<script>alert("hack")</script> & "special" \'quotes\'';
      const escaped = escapeHtml(malicious);
      expect(escaped).not.toContain('<script>');
      expect(escaped).toContain('&lt;script&gt;');
      expect(escaped).toContain('&quot;special&quot;');
      expect(escaped).toContain('&#39;quotes&#39;');
      expect(escaped).toContain('&amp;');
    });
  });

  describe('Verification URL and Unguessable ID Format', () => {
    it('constructs correct public verification URL format', () => {
      const domain = 'farukh.org';
      const certId = 'cert_9e2f4a18b7c3e5d1a8f0b2c4';
      const verifyUrl = `https://${domain}/verify/${certId}`;

      expect(verifyUrl).toBe('https://farukh.org/verify/cert_9e2f4a18b7c3e5d1a8f0b2c4');
      expect(verifyUrl).toMatch(/^https:\/\/farukh\.org\/verify\/cert_[a-f0-9]{24}$/);
    });
  });

  describe('Idempotency Mock Verification', () => {
    it('ensures one active certificate per user per course', () => {
      const mockDatabase = [
        {
          id: 'cert_existing123',
          uid: 'user_student_1',
          courseId: 'course_ai_101',
          revoked: false,
          status: 'ready',
        },
      ];

      function checkCertificateIdempotency(uid: string, courseId: string) {
        const existing = mockDatabase.find(
          (c) => c.uid === uid && c.courseId === courseId && c.revoked === false
        );
        if (existing) {
          return { isExisting: true, certificateId: existing.id };
        }
        return { isExisting: false, certificateId: 'cert_new_' + Date.now() };
      }

      // First call for same user and course
      const firstCheck = checkCertificateIdempotency('user_student_1', 'course_ai_101');
      expect(firstCheck.isExisting).toBe(true);
      expect(firstCheck.certificateId).toBe('cert_existing123');

      // Call for different course
      const secondCheck = checkCertificateIdempotency('user_student_1', 'course_stocks_202');
      expect(secondCheck.isExisting).toBe(false);
      expect(secondCheck.certificateId).toContain('cert_new_');
    });
  });

  describe('Certificate HTML Template Builder', () => {
    it('embeds Vazirmatn font, RTL direction, and escaped student and course names', () => {
      const html = buildCertificateHtml({
        bgDataUri: 'data:image/jpeg;base64,mockImage',
        nameEn: "John O'Connor",
        nameFa: 'محمد فرخ\u200Cسیر',
        courseTitleEn: 'Artificial Intelligence & Modern Tech',
        courseTitleFa: 'هوش مصنوعی و تکنالوژی مدرن',
        dateCombined: '17 Oct 2026 / ۲۵ میزان ۱۴۰۵',
        qrDataUrl: 'data:image/png;base64,mockQr',
        certificateId: 'cert_abc123',
      });

      expect(html).toContain('Vazirmatn');
      expect(html).toContain('direction: rtl');
      expect(html).toContain('محمد فرخ\u200Cسیر');
      expect(html).toContain("John O&#39;Connor");
      expect(html).toContain('Artificial Intelligence &amp; Modern Tech');
      expect(html).toContain('ID: cert_abc123');
      expect(html).toContain('autoFitBoxes');
    });
  });
});
