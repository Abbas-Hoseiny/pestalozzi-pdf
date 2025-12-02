import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage,
} from "pdf-lib";
import headerLogoAsset from "@assets/branding/logo.png";
import photoIconAsset from "@assets/branding/foto-icon.png";

export interface PhotoEntryPayload {
  file: File;
  description?: string;
}

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const PAGE_PADDING = 28;
const HEADER_HEIGHT = 68;
const HEADER_MARGIN_BOTTOM = 18;
const HEADER_PADDING_X = 28;
const HEADER_BG_COLOR = rgb(1, 1, 1);
const HEADER_ACCENT_COLOR = rgb(0.27, 0.54, 0.32);
const HEADER_TEXT_COLOR = rgb(0.1, 0.1, 0.1);
const LABEL_HEIGHT = 34;
const LABEL_GAP = 12;
const LABEL_ICON_MAX_HEIGHT = 26;
const LABEL_TEXT_COLOR = rgb(0.08, 0.45, 0.18);
const LABEL_TEXT_GAP = 10;
const DESCRIPTION_FONT_SIZE = 12;
const DESCRIPTION_LINE_GAP = 3;
const DESCRIPTION_GAP = 16;
const DESCRIPTION_TEXT_COLOR = rgb(0.12, 0.12, 0.12);
const ADDRESS_LINES = [
  "Pestalozzi Gemüsebau",
  "Pestalozzi-Kinderdorf 1",
  "78333 Stockach      ",
];

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
  const assets = await loadDocumentAssets(pdfDoc);

  for (const [index, entry] of entries.entries()) {
    const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
    const { width, height } = page.getSize();
    const img = await embedImage(pdfDoc, entry.file);
    drawHeaderBar(page, assets);

    const headerSpace = HEADER_HEIGHT + HEADER_MARGIN_BOTTOM;
    const labelSpace = LABEL_HEIGHT + LABEL_GAP;
    const availableWidth = Math.max(width - PAGE_PADDING * 2, 1);
    const availableHeight = Math.max(
      height - PAGE_PADDING * 2 - headerSpace - labelSpace,
      1
    );
    const scale = Math.min(
      availableWidth / img.width,
      availableHeight / img.height,
      1
    );
    const drawWidth = img.width * scale;
    const drawHeight = img.height * scale;
    const imageX = PAGE_PADDING + (availableWidth - drawWidth) / 2;
    const imageY = PAGE_PADDING + (availableHeight - drawHeight) / 2;

    const labelBaseY = imageY + drawHeight + LABEL_TEXT_GAP;
    drawEntryLabel(page, assets, `Foto ${index + 1}`, imageX, labelBaseY);

    page.drawImage(img, {
      x: imageX,
      y: imageY,
      width: drawWidth,
      height: drawHeight,
    });

    const description = entry.description?.trim();
    if (description) {
      drawDescriptionText(page, assets, description, {
        x: imageX,
        y: imageY - DESCRIPTION_GAP,
        maxWidth: drawWidth,
      });
    }

    if ((index + 1) % shouldYieldAfterPages === 0 && entries.length > 1) {
      await yieldToMainThread();
    }
  }

  return pdfDoc.save();
}

type DocumentAssets = {
  logo: PDFImage;
  entryIcon: PDFImage;
  font: PDFFont;
};

const assetByteCache = new Map<string, Uint8Array>();

async function loadDocumentAssets(
  pdfDoc: PDFDocument
): Promise<DocumentAssets> {
  const [logoBytes, iconBytes] = await Promise.all([
    loadAssetBytes(headerLogoAsset),
    loadAssetBytes(photoIconAsset),
  ]);
  const [logo, entryIcon] = await Promise.all([
    pdfDoc.embedPng(logoBytes),
    pdfDoc.embedPng(iconBytes),
  ]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  return { logo, entryIcon, font };
}

async function loadAssetBytes(assetPath: string) {
  const cached = assetByteCache.get(assetPath);
  if (cached) {
    return cached;
  }
  let bytes: Uint8Array;
  if (assetPath.startsWith("data:")) {
    bytes = decodeDataUrl(assetPath);
  } else {
    const response = await fetch(assetPath);
    const buffer = await response.arrayBuffer();
    bytes = new Uint8Array(buffer);
  }
  assetByteCache.set(assetPath, bytes);
  return bytes;
}

function decodeDataUrl(dataUrl: string) {
  const [, dataPart = ""] = dataUrl.split(",");
  const metadata = dataUrl.split(",")[0] ?? "";
  const isBase64 = metadata.includes("base64");
  const binaryString = isBase64 ? atob(dataPart) : decodeURIComponent(dataPart);
  const buffer = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i += 1) {
    buffer[i] = binaryString.charCodeAt(i);
  }
  return buffer;
}

function drawHeaderBar(page: PDFPage, assets: DocumentAssets) {
  const { width, height } = page.getSize();
  const headerY = height - HEADER_HEIGHT;
  page.drawRectangle({
    x: 0,
    y: headerY,
    width,
    height: HEADER_HEIGHT,
    color: HEADER_BG_COLOR,
  });
  page.drawRectangle({
    x: 0,
    y: headerY,
    width,
    height: 3,
    color: HEADER_ACCENT_COLOR,
  });

  const logoMaxWidth = 120;
  const logoMaxHeight = HEADER_HEIGHT - 24;
  const logoScale = Math.min(
    logoMaxWidth / assets.logo.width,
    logoMaxHeight / assets.logo.height,
    1
  );
  const logoWidth = assets.logo.width * logoScale;
  const logoHeight = assets.logo.height * logoScale;
  const logoY = headerY + (HEADER_HEIGHT - logoHeight) / 2;

  page.drawImage(assets.logo, {
    x: HEADER_PADDING_X,
    y: logoY,
    width: logoWidth,
    height: logoHeight,
  });

  const fontSize = 11;
  const lineHeight = fontSize + 3;
  ADDRESS_LINES.forEach((line, index) => {
    const textWidth = assets.font.widthOfTextAtSize(line, fontSize);
    const textX = width - HEADER_PADDING_X - textWidth;
    const textY = headerY + HEADER_HEIGHT - (index + 1) * lineHeight - 8;
    page.drawText(line, {
      x: textX,
      y: textY,
      size: fontSize,
      font: assets.font,
      color: HEADER_TEXT_COLOR,
    });
  });
}

function drawEntryLabel(
  page: PDFPage,
  assets: DocumentAssets,
  text: string,
  anchorX: number,
  baseY: number
) {
  const iconScale = Math.min(
    LABEL_ICON_MAX_HEIGHT / assets.entryIcon.height,
    LABEL_ICON_MAX_HEIGHT / assets.entryIcon.width,
    1
  );
  const iconWidth = assets.entryIcon.width * iconScale;
  const iconHeight = assets.entryIcon.height * iconScale;
  page.drawImage(assets.entryIcon, {
    x: anchorX,
    y: baseY + (LABEL_HEIGHT - iconHeight) / 2,
    width: iconWidth,
    height: iconHeight,
  });

  const fontSize = 14;
  const textX = anchorX + iconWidth + 10;
  const textY = baseY + (LABEL_HEIGHT - fontSize) / 2;
  page.drawText(text, {
    x: textX,
    y: textY,
    size: fontSize,
    font: assets.font,
    color: LABEL_TEXT_COLOR,
  });
}

function drawDescriptionText(
  page: PDFPage,
  assets: DocumentAssets,
  text: string,
  area: { x: number; y: number; maxWidth: number }
) {
  const fontSize = DESCRIPTION_FONT_SIZE;
  const lines = wrapTextIntoLines(assets.font, text, fontSize, area.maxWidth);
  let cursorY = area.y;
  for (const line of lines) {
    page.drawText(line, {
      x: area.x,
      y: cursorY,
      size: fontSize,
      font: assets.font,
      color: DESCRIPTION_TEXT_COLOR,
    });
    cursorY -= fontSize + DESCRIPTION_LINE_GAP;
    if (cursorY < PAGE_PADDING) {
      break;
    }
  }
}

function wrapTextIntoLines(
  font: PDFFont,
  text: string,
  fontSize: number,
  maxWidth: number
) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const lineWidth = font.widthOfTextAtSize(testLine, fontSize);
    if (lineWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}
