import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';

import html2canvas from 'html2canvas';

/**
 * Downloads a single note as a file.
 * @param {Object} note - The note object { title, content }
 * @param {string} format - The format extension ('md', 'txt', or 'pdf')
 * @param {HTMLElement} element - The DOM element to capture for PDF
 */
export const downloadNote = async (note, format = 'md', element = null) => {
  if (!note || !note.content) return;
  
  if (format === 'pdf') {
    if (!element) {
      console.warn('PDF format requested but no DOM element was provided for capture.');
      return;
    }

    try {
      // 1. Add printing class for high-quality white-background look
      element.classList.add('printing-mode');

      // 2. Capture the element as canvas
      const canvas = await html2canvas(element, {
        scale: 2, // High resolution for crisp text
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // 3. Cleanup printing class
      element.classList.remove('printing-mode');

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Calculate how many px on canvas represent one A4 page height
      // We keep a small vertical margin (40px total)
      const contentWidth = pageWidth - 40; 
      const ratio = contentWidth / imgWidth;
      const canvasPageHeight = (pageHeight - 40) / ratio; // Height on canvas that fits one A4 page
      
      let heightLeft = imgHeight;
      let position = 0;
      let pageNumber = 1;

      while (heightLeft > 0) {
        // Add new page if not the first one
        if (pageNumber > 1) {
          doc.addPage();
        }

        // Slice and add the image segment
        // addImage parameters: data, type, x, y, width, height, alias, compression, rotation
        doc.addImage(
          canvas.toDataURL('image/jpeg', 0.95), 
          'JPEG', 
          20, // Margin X
          20, // Margin Y
          contentWidth, 
          imgHeight * ratio,
          `page-${pageNumber}`,
          'FAST',
          0
        );

        // If it's single page, we are done. If multi-page, we need to handle the Y offset.
        // jsPDF's addImage with fixed height/width doesn't slice automatically,
        // so we use a clipping/offset approach by adjusting the destination Y
        // and adding a white rectangle to cover overflow if needed, 
        // but for high compatibility we manually slice the canvas.

        // Refined approach: multiple calls to addImage with negative Y offsets
        // to show the "next" part of the long image on each page.
        if (pageNumber > 1) {
          // Reset the Y position for subsequent pages
          // This is a common trick with jsPDF to use one large image 
          // and "slide" it up on each page.
          doc.deletePage(pageNumber); 
          doc.addPage();
          doc.addImage(
            canvas.toDataURL('image/jpeg', 0.95),
            'JPEG',
            20,
            20 - (pageHeight - 40) * (pageNumber - 1), // Negative offset
            contentWidth,
            imgHeight * ratio
          );
        }

        heightLeft -= canvasPageHeight;
        pageNumber++;
      }
      
      doc.save(`${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
    } catch (err) {
      console.error('PDF Generation failed:', err);
      window.print(); 
    }
    return;
  }
  
  const blob = new Blob([note.content], { type: 'text/plain;charset=utf-8' });
  const fileName = `${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${format}`;
  saveAs(blob, fileName);
};

/**
 * Downloads a collection of notes as a ZIP file.
 * @param {string} collectionName - The name of the collection
 * @param {Array} notes - Array of note objects { title, content }
 */
export const downloadCollectionZip = async (collectionName, notes) => {
  if (!notes || notes.length === 0) return;

  const zip = new JSZip();
  const folder = zip.folder(collectionName.replace(/[^a-z0-9]/gi, '_'));

  notes.forEach((note, index) => {
    const safeTitle = note.title.replace(/[^a-z0-9]/gi, '_');
    // Prefix with index to maintain order (1-indexed)
    const fileName = `${String(index + 1).padStart(2, '0')}_${safeTitle}.md`;
    folder.file(fileName, note.content);
  });

  const content = await zip.generateAsync({ type: 'blob' });
  const zipFileName = `${collectionName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_collection.zip`;
  saveAs(content, zipFileName);
};
