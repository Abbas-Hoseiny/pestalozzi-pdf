import { PDFDocument } from "pdf-lib";

export interface PhotoEntryPayload {
  file: File;
  description?: string;
}

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const PAGE_PADDING = 0;

const shouldYieldAfterPages = 1;

function yieldToMainThread() {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
}

async function embedImage(pdfDoc: PDFDocument, file: File) {
  const bytes = await file.arrayBuffer();
  const type = file.type.toLowerCase();
  if (type.includes("png")) {
    return pdfDoc.embedPng(bytes);
  }
  if (type.includes("jpg") || type.includes("jpeg")) {
    return pdfDoc.embedJpg(bytes);
  }
  if (type.includes("heic") || type.includes("heif")) {
    throw new Error(
      "HEIC/HEIF wird aktuell nicht unterstützt. Bitte als JPG/PNG aufnehmen."
    );
  }
  try {
    return pdfDoc.embedJpg(bytes);
  } catch (error) {
    console.error("Bild konnte nicht eingebettet werden", error);
    throw new Error("Bildformat wird nicht unterstützt.");
  }
}

export async function generatePhotoPdf(entries: PhotoEntryPayload[]) {
  if (!entries.length) {
    throw new Error("Keine Fotos vorhanden.");
  }

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle("Foto-Notizen");
  pdfDoc.setSubject("Bilddokumentation");

  for (const [index, entry] of entries.entries()) {
    const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
    const { width, height } = page.getSize();
    const img = await embedImage(pdfDoc, entry.file);

    const availableWidth = Math.max(width - PAGE_PADDING * 2, 1);
    const availableHeight = Math.max(height - PAGE_PADDING * 2, 1);
    const scale = Math.min(
      availableWidth / img.width,
      availableHeight / img.height,
      1
    );
    const drawWidth = img.width * scale;
    const drawHeight = img.height * scale;
    const imageX = (width - drawWidth) / 2;
    const imageY = (height - drawHeight) / 2;

    page.drawImage(img, {
      x: imageX,
      y: imageY,
      width: drawWidth,
      height: drawHeight,
    });

    if ((index + 1) % shouldYieldAfterPages === 0 && entries.length > 1) {
      await yieldToMainThread();
    }
  }

  return pdfDoc.save();
}
