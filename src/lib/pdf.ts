import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import firmLogo from "@assets/branding/logo-firmen.png";
import potIcon from "@assets/branding/pot-single.png";

export interface PhotoEntryPayload {
  file: File;
  description?: string;
}

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const PAGE_MARGIN = 40;
const HEADER_HEIGHT = 88;
const TEXT_BOX_HEIGHT = 120;
const GAP_AFTER_HEADER = PAGE_MARGIN;
const GAP_IMAGE_TEXT = 12;

const leaf = rgb(0.165, 0.435, 0.259);
const leafMuted = rgb(0.29, 0.35, 0.3);
const headerBackground = rgb(1, 1, 1);
const headerBorder = rgb(0.882, 0.933, 0.86);
const boxBackground = rgb(0.982, 0.988, 0.975);

const shouldYieldAfterPages = 1;

function yieldToMainThread() {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
}

type AssetSource = string | { src: string };

async function fetchBytes(src: AssetSource): Promise<Uint8Array> {
  const url = typeof src === "string" ? src : src.src;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Asset konnte nicht geladen werden");
  }
  return new Uint8Array(await response.arrayBuffer());
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

function wrapText(text: string, limit: number, font: any, size: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    const width = font.widthOfTextAtSize(candidate, size);
    if (width > limit && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  });
  if (current) {
    lines.push(current);
  }
  return lines;
}

export async function generatePhotoPdf(entries: PhotoEntryPayload[]) {
  if (!entries.length) {
    throw new Error("Keine Fotos vorhanden.");
  }

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle("Foto-Notizen");
  pdfDoc.setSubject("Bilddokumentation");
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const logoImage = await pdfDoc.embedPng(await fetchBytes(firmLogo));
  const potImage = await pdfDoc.embedPng(await fetchBytes(potIcon));

  for (const [index, entry] of entries.entries()) {
    const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
    const { width, height } = page.getSize();
    const hasHeader = index === 0;
    const reservedTop = hasHeader
      ? HEADER_HEIGHT + GAP_AFTER_HEADER
      : GAP_AFTER_HEADER;

    if (hasHeader) {
      const headerY = height - PAGE_MARGIN - HEADER_HEIGHT;
      page.drawRectangle({
        x: PAGE_MARGIN,
        y: headerY,
        width: width - PAGE_MARGIN * 2,
        height: HEADER_HEIGHT,
        color: headerBackground,
        borderColor: headerBorder,
        borderWidth: 1,
      });

      const logoHeight = 42;
      const logoWidth = (logoHeight / logoImage.height) * logoImage.width;
      const headerInnerWidth = width - PAGE_MARGIN * 2;
      const logoX = PAGE_MARGIN + (headerInnerWidth - logoWidth) / 2;
      page.drawImage(logoImage, {
        x: logoX,
        y: headerY + HEADER_HEIGHT / 2 - logoHeight / 2,
        width: logoWidth,
        height: logoHeight,
      });
    }

    const descriptionText = (entry.description ?? "").trim();
    const hasDescription = descriptionText.length > 0;

    const maxImageWidth = width - PAGE_MARGIN * 2;
    const topContentY = height - PAGE_MARGIN - reservedTop;
    const bottomReserved =
      PAGE_MARGIN + (hasDescription ? TEXT_BOX_HEIGHT + GAP_IMAGE_TEXT : 0);
    const maxImageHeight = topContentY - bottomReserved;
    const img = await embedImage(pdfDoc, entry.file);

    const scale = Math.min(
      maxImageWidth / img.width,
      maxImageHeight / img.height,
      1
    );
    const drawWidth = img.width * scale;
    const drawHeight = img.height * scale;
    const imageX = PAGE_MARGIN + (maxImageWidth - drawWidth) / 2;
    const imageY = topContentY - drawHeight;
    page.drawImage(img, {
      x: imageX,
      y: imageY,
      width: drawWidth,
      height: drawHeight,
    });

    const label = `Foto ${index + 1}`;
    const labelFontSize = 12;
    const labelY = height - PAGE_MARGIN - reservedTop + 18;
    const labelIconHeight = 16;
    const labelIconWidth = (labelIconHeight / potImage.height) * potImage.width;
    const labelIconY = labelY - (labelIconHeight - labelFontSize) / 2;
    page.drawImage(potImage, {
      x: imageX,
      y: labelIconY,
      width: labelIconWidth,
      height: labelIconHeight,
    });
    page.drawText(label, {
      x: imageX + labelIconWidth + 6,
      y: labelY,
      font: boldFont,
      size: labelFontSize,
      color: leaf,
    });

    if (hasDescription) {
      const textBoxY = imageY - TEXT_BOX_HEIGHT - GAP_IMAGE_TEXT;
      page.drawRectangle({
        x: PAGE_MARGIN,
        y: textBoxY,
        width: width - PAGE_MARGIN * 2,
        height: TEXT_BOX_HEIGHT,
        color: rgb(1, 1, 1),
        borderColor: boxBackground,
        borderWidth: 1,
      });

      const lines = wrapText(
        descriptionText,
        width - PAGE_MARGIN * 2 - 32,
        regularFont,
        10.5
      );
      lines.slice(0, 6).forEach((line, lineIndex) => {
        page.drawText(line, {
          x: PAGE_MARGIN + 16,
          y: textBoxY + TEXT_BOX_HEIGHT - 28 - lineIndex * 14,
          font: regularFont,
          size: 10.5,
          color: leafMuted,
        });
      });
    }

    if ((index + 1) % shouldYieldAfterPages === 0 && entries.length > 1) {
      await yieldToMainThread();
    }
  }

  return pdfDoc.save();
}
