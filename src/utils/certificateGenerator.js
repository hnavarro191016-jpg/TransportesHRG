import * as jspdfLib from 'jspdf';
const jsPDF = jspdfLib.jsPDF || jspdfLib.default || jspdfLib;

function getBase64ImageFromUrl(imageUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      let canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      let ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      let dataURL = canvas.toDataURL('image/jpeg');
      resolve(dataURL);
    };
    img.onerror = error => reject(error);
    img.src = imageUrl;
  });
}

export const generateCertificate = async (employeeName, courseName, score, date, validityMonths) => {
  // Create a landscape PDF (A4)
  const doc = new jsPDF('landscape', 'pt', 'a4');
  
  // Dimensions
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Background/Border
  doc.setLineWidth(10);
  doc.setDrawColor(22, 163, 74); // success green var(--color-success)
  doc.rect(20, 20, pageWidth - 40, pageHeight - 40);
  
  doc.setLineWidth(2);
  doc.setDrawColor(44, 62, 80); 
  doc.rect(28, 28, pageWidth - 56, pageHeight - 56);

  try {
    // Attempt to load and add the logo.jpg from public folder
    const imgData = await getBase64ImageFromUrl('/logo.jpg');
    // x, y, width, height (adjust size accordingly)
    doc.addImage(imgData, 'JPEG', pageWidth / 2 - 60, 40, 120, 50);
  } catch (e) {
    console.error('No se pudo cargar el logo', e);
  }

  // Logo / Header (Text simulation for now)
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138); // blue-900 (primary)
  doc.text('TRANSPORTES ROMO HRG', pageWidth / 2, 110, { align: 'center' });
  
  doc.setFontSize(16);
  doc.setTextColor(100, 100, 100);
  doc.text('Certificado de Capacitación y Competencia', pageWidth / 2, 135, { align: 'center' });

  // Body
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text('Se otorga el presente documento a:', pageWidth / 2, 180, { align: 'center' });

  // Employee Name
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39); // gray-900
  doc.text(employeeName.toUpperCase(), pageWidth / 2, 230, { align: 'center' });

  // Course Name
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Por haber aprobado satisfactoriamente el curso:', pageWidth / 2, 280, { align: 'center' });

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 163, 74); // green
  doc.text(courseName.toUpperCase(), pageWidth / 2, 330, { align: 'center' });

  // Details
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Calificación obtenida: ${score}%`, pageWidth / 2, 370, { align: 'center' });
  doc.text(`Fecha de expedición: ${date}`, pageWidth / 2, 390, { align: 'center' });
  
  const expiration = validityMonths > 0 
    ? `Válido por ${validityMonths} meses` 
    : 'Sin fecha de vencimiento';
  doc.text(expiration, pageWidth / 2, 410, { align: 'center' });

  // Signatures
  doc.setLineWidth(1);
  doc.setDrawColor(0, 0, 0);
  
  // Left signature
  doc.line(150, 480, 350, 480);
  doc.text('Instructor Calificado', 250, 500, { align: 'center' });
  
  // Right signature
  doc.line(pageWidth - 350, 480, pageWidth - 150, 480);
  doc.text('Recursos Humanos', pageWidth - 250, 500, { align: 'center' });

  // Folio
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  const folio = `Folio: HRG-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
  doc.text(folio, pageWidth - 100, pageHeight - 40, { align: 'center' });

  // Save the PDF
  const filename = `Certificado_${employeeName.replace(/\s+/g, '_')}_${courseName.replace(/\s+/g, '')}.pdf`;
  doc.save(filename);
};
