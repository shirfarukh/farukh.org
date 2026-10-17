// Certificate Name Validation Rules (Shared between Client & Cloud Functions)
// Requirement:
// - English: Latin letters only, letters, spaces, hyphen, apostrophe, dot; 2–60 chars.
// - Persian: Persian/Arabic script, letters, spaces, hyphen, apostrophe, dot; 2–60 chars.

export interface NameValidationResult {
  isValid: boolean;
  errorEn?: string;
  errorFa?: string;
}

export function validateEnglishName(rawName: unknown): NameValidationResult {
  if (typeof rawName !== 'string') {
    return {
      isValid: false,
      errorEn: 'Full name in English is required.',
      errorFa: 'نام کامل به انگلیسی الزامی است.',
    };
  }

  const trimmed = rawName.trim();

  if (trimmed.length < 2) {
    return {
      isValid: false,
      errorEn: 'English name must be at least 2 characters.',
      errorFa: 'نام انگلیسی باید حداقل ۲ حرف باشد.',
    };
  }

  if (trimmed.length > 60) {
    return {
      isValid: false,
      errorEn: 'English name must not exceed 60 characters.',
      errorFa: 'نام انگلیسی نباید بیشتر از ۶۰ حرف باشد.',
    };
  }

  // Latin letters only, spaces, hyphen, apostrophe, dot. No digits, no symbols.
  const enRegex = /^[A-Za-z\s.'-]+$/;
  if (!enRegex.test(trimmed)) {
    return {
      isValid: false,
      errorEn: 'English name must contain Latin letters only (letters, spaces, hyphen, apostrophe, dot). No numbers or special symbols.',
      errorFa: 'نام انگلیسی باید فقط با حروف لاتین (بدون ارقام یا علائم خاص) نوشته شود.',
    };
  }

  return { isValid: true };
}

export function validatePersianName(rawName: unknown): NameValidationResult {
  if (typeof rawName !== 'string') {
    return {
      isValid: false,
      errorEn: 'Full name in Persian is required.',
      errorFa: 'نام کامل به فارسی الزامی است.',
    };
  }

  const trimmed = rawName.trim();

  if (trimmed.length < 2) {
    return {
      isValid: false,
      errorEn: 'Persian name must be at least 2 characters.',
      errorFa: 'نام فارسی باید حداقل ۲ حرف باشد.',
    };
  }

  if (trimmed.length > 60) {
    return {
      isValid: false,
      errorEn: 'Persian name must not exceed 60 characters.',
      errorFa: 'نام فارسی نباید بیشتر از ۶۰ حرف باشد.',
    };
  }

  // No digits allowed (Latin, Arabic, or Persian numbers)
  if (/[\d\u0660-\u0669\u06F0-\u06F9]/.test(trimmed)) {
    return {
      isValid: false,
      errorEn: 'Persian name cannot contain numbers.',
      errorFa: 'نام فارسی نباید شامل ارقام یا اعداد باشد.',
    };
  }

  // Persian/Arabic letters, spaces, hyphen, apostrophe, dot, ZWNJ (\u200C), ZWJ (\u200D)
  const faRegex = /^[\u0621-\u064A\u0671-\u06D3\u067E\u0686\u0698\u06AF\uFB50-\uFDFF\uFE70-\uFEFF\u200C\u200D\s.'-]+$/;
  if (!faRegex.test(trimmed)) {
    return {
      isValid: false,
      errorEn: 'Persian name must contain Persian/Arabic letters only.',
      errorFa: 'نام فارسی باید فقط با حروف زبان فارسی/دری نوشته شود.',
    };
  }

  return { isValid: true };
}

export function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
