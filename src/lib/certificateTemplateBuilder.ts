import { escapeHtml } from './certificateValidation';
import { DEFAULT_CERTIFICATE_FIELDS, CertificateFieldConfig } from '../types/certificate';

export function buildCertificateHtml(params: {
  bgDataUri: string;
  nameEn: string;
  nameFa: string;
  courseTitleEn: string;
  courseTitleFa: string;
  dateCombined: string;
  qrDataUrl: string;
  certificateId: string;
  fields?: CertificateFieldConfig[];
}): string {
  const fields = params.fields && params.fields.length > 0 ? params.fields : DEFAULT_CERTIFICATE_FIELDS;

  const fieldMap: Record<string, CertificateFieldConfig> = {};
  for (const f of fields) {
    fieldMap[f.id] = f;
  }

  const fNameFa = fieldMap['nameFa'] || DEFAULT_CERTIFICATE_FIELDS[0];
  const fCourseFa = fieldMap['courseFa'] || DEFAULT_CERTIFICATE_FIELDS[1];
  const fNameEn = fieldMap['nameEn'] || DEFAULT_CERTIFICATE_FIELDS[2];
  const fCourseEn = fieldMap['courseEn'] || DEFAULT_CERTIFICATE_FIELDS[3];
  const fDate = fieldMap['date'] || DEFAULT_CERTIFICATE_FIELDS[4];
  const fQr = fieldMap['qr'] || DEFAULT_CERTIFICATE_FIELDS[5];
  const fCertId = fieldMap['certificateId'] || DEFAULT_CERTIFICATE_FIELDS[6];

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
