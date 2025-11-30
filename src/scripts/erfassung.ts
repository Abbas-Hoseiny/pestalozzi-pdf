import type { PhotoEntryPayload } from "../lib/pdf";
import { generatePhotoPdf } from "../lib/pdf";
import { iconSvg } from "../lib/icons";

type Entry = {
  id: string;
  sourceFile: File;
  file: File;
  description: string;
  url: string;
};

const entries: Entry[] = [];
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];
type QualityConfig = Readonly<{
  maxEdge: number | null;
  mimeType: string;
  quality: number;
}>;

type PresetKey = "default" | "share";

const QUALITY_PRESETS: Record<PresetKey, QualityConfig> = {
  default: {
    maxEdge: 1800,
    mimeType: "image/jpeg",
    quality: 0.8,
  },
  share: {
    maxEdge: 1400,
    mimeType: "image/jpeg",
    quality: 0.72,
  },
};

const DEFAULT_PRESET: PresetKey = "default";
const SHARE_FALLBACK_PRESET: PresetKey = "share";
const SHARE_SIZE_LIMIT = 18 * 1024 * 1024;
let pendingFocusEntryId: string | null = null;
let lastPdfBlob: Blob | null = null;
let lastPdfFilename: string | null = null;
let lastPdfFile: File | null = null;
type ExportSnapshot = {
  sources: Array<{ file: File; description: string }>;
  preset: PresetKey;
};
let lastExportSnapshot: ExportSnapshot | null = null;

function ready() {
  const fileInput = document.querySelector<HTMLInputElement>("#photoInput");
  const list = document.querySelector<HTMLElement>("#photoList");
  const pdfButton = document.querySelector<HTMLButtonElement>("#pdfButton");
  const status = document.querySelector<HTMLElement>("#statusMessage");
  const shareButton = document.querySelector<HTMLButtonElement>("#shareButton");
  const downloadButton =
    document.querySelector<HTMLButtonElement>("#downloadButton");
  const quickCaptureButton = document.querySelector<HTMLButtonElement>(
    "#quickCaptureButton"
  );

  if (
    !fileInput ||
    !list ||
    !pdfButton ||
    !status ||
    !shareButton ||
    !downloadButton
  ) {
    return;
  }

  const triggerCameraCapture = (forceCamera = false) => {
    if (forceCamera) {
      fileInput.setAttribute("capture", "environment");
    } else {
      fileInput.removeAttribute("capture");
    }
    fileInput.click();
    if (forceCamera) {
      requestAnimationFrame(() => {
        fileInput.removeAttribute("capture");
      });
    }
  };

  let initialPointerHandler: ((event: PointerEvent) => void) | null = null;
  let initialKeyHandler: ((event: KeyboardEvent) => void) | null = null;

  const removeInitialCaptureHandlers = () => {
    if (initialPointerHandler) {
      window.removeEventListener("pointerdown", initialPointerHandler);
      initialPointerHandler = null;
    }
    if (initialKeyHandler) {
      window.removeEventListener("keydown", initialKeyHandler);
      initialKeyHandler = null;
    }
  };

  initialPointerHandler = () => {
    removeInitialCaptureHandlers();
    triggerCameraCapture(true);
  };

  initialKeyHandler = (event: KeyboardEvent) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.preventDefault();
    removeInitialCaptureHandlers();
    triggerCameraCapture(true);
  };

  window.addEventListener("pointerdown", initialPointerHandler, { once: true });
  window.addEventListener("keydown", initialKeyHandler);
  fileInput.addEventListener("click", removeInitialCaptureHandlers);
  fileInput.addEventListener("change", removeInitialCaptureHandlers, {
    once: true,
  });

  quickCaptureButton?.addEventListener("click", () => {
    removeInitialCaptureHandlers();
    triggerCameraCapture(true);
  });

  fileInput.addEventListener("change", async (event) => {
    fileInput.removeAttribute("capture");
    const files = Array.from(
      event.target instanceof HTMLInputElement ? event.target.files ?? [] : []
    );
    await addFiles(files, list, pdfButton, status, shareButton, downloadButton);
    fileInput.value = "";
  });

  pdfButton.addEventListener("click", async () => {
    if (!entries.length) {
      return;
    }
    resetGeneratedPdf(shareButton, downloadButton);
    setStatus(status, "PDF wird erstellt ...");
    pdfButton.disabled = true;
    pdfButton.dataset.loading = "true";
    try {
      const payload: PhotoEntryPayload[] = entries.map(
        ({ file, description }) => ({
          file,
          description,
        })
      );
      const bytes = await generatePhotoPdf(payload);
      const blob = new Blob([bytes], { type: "application/pdf" });
      const filename = `foto-notizen-${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`;
      const file = new File([bytes], filename, {
        type: "application/pdf",
        lastModified: Date.now(),
      });
      lastPdfBlob = blob;
      lastPdfFilename = filename;
      lastPdfFile = file;
      lastExportSnapshot = {
        sources: entries.map(({ sourceFile, description }) => ({
          file: sourceFile,
          description,
        })),
        preset: DEFAULT_PRESET,
      };
      clearEntries();
      render(list, pdfButton);
      updateExportButtons(shareButton, downloadButton);
      setStatus(status, "PDF erzeugt. Jetzt teilen oder speichern.");
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error
          ? error.message
          : "PDF konnte nicht erstellt werden.";
      setStatus(status, message, "error");
    } finally {
      pdfButton.dataset.loading = "false";
      pdfButton.disabled = entries.length === 0;
    }
  });

  shareButton.addEventListener("click", async () => {
    if (!lastPdfBlob || !lastPdfFilename || !lastPdfFile) {
      setStatus(status, "Bitte zuerst ein PDF erzeugen.", "error");
      return;
    }
    if (shareButton.disabled) {
      setStatus(
        status,
        "Teilen wird auf diesem Gerät nicht unterstützt.",
        "error"
      );
      return;
    }
    if (!(await ensureSharePdfIsReady(status, shareButton, downloadButton))) {
      return;
    }
    setStatus(status, "Share Sheet wird geöffnet ...");
    const shareResult = await tryShare(lastPdfFile);
    if (shareResult === "shared") {
      setStatus(status, "PDF geteilt.");
    } else if (shareResult === "aborted") {
      setStatus(status, "Teilen abgebrochen.");
    } else if (shareResult === "unsupported") {
      setStatus(
        status,
        "Teilen wird auf diesem Gerät nicht unterstützt.",
        "error"
      );
    } else {
      setStatus(status, "Teilen nicht möglich – bitte PDF speichern.", "error");
    }
  });

  downloadButton.addEventListener("click", () => {
    if (!lastPdfBlob || !lastPdfFilename) {
      setStatus(status, "Bitte zuerst ein PDF erzeugen.", "error");
      return;
    }
    triggerDownload(lastPdfBlob, lastPdfFilename);
    setStatus(status, "PDF gespeichert.");
  });

  render(list, pdfButton);
  updateExportButtons(shareButton, downloadButton);
}

async function addFiles(
  files: File[],
  list: HTMLElement,
  pdfButton: HTMLButtonElement,
  status: HTMLElement,
  shareButton: HTMLButtonElement,
  downloadButton: HTMLButtonElement
) {
  if (!files.length) return;
  resetGeneratedPdf(shareButton, downloadButton);
  let lastEntryId: string | null = null;
  for (const file of files) {
    try {
      const normalized = await convertFileToPreset(file, DEFAULT_PRESET);
      const url = URL.createObjectURL(normalized);
      const entryId = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
      entries.push({
        id: entryId,
        sourceFile: file,
        file: normalized,
        url,
        description: "",
      });
      lastEntryId = entryId;
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error
          ? error.message
          : `Datei ${file.name} konnte nicht verarbeitet werden.`;
      setStatus(status, message, "error");
    }
  }
  pendingFocusEntryId = lastEntryId;
  render(list, pdfButton);
  setStatus(status, `${entries.length} Foto(s) vorbereitet.`);
}

function render(list: HTMLElement, pdfButton: HTMLButtonElement) {
  if (!entries.length) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-inline";
    emptyState.innerHTML = `
        <span class="empty-icon">${iconSvg("image", 24)}</span>
        <span>Keine Fotos erfasst.</span>`;
    list.replaceChildren(emptyState);
    pdfButton.disabled = true;
    return;
  }
  const fragment = document.createDocumentFragment();
  const focusTarget = pendingFocusEntryId;
  entries.forEach((entry, index) => {
    const article = document.createElement("article");
    article.className = "photo-card content-card content-card--light";
    article.innerHTML = `
      <div class="photo-thumb">
        <img alt="Foto ${index + 1}" src="${entry.url}" />
      </div>
      <div class="photo-details">
        <header>
          <h3>Aufnahme ${index + 1}</h3>
          <div class="card-actions">
            <button type="button" data-action="up" aria-label="nach oben" ${
              index === 0 ? "disabled" : ""
            }>${iconSvg("arrow-up", 16)}</button>
            <button type="button" data-action="down" aria-label="nach unten" ${
              index === entries.length - 1 ? "disabled" : ""
            }>${iconSvg("arrow-down", 16)}</button>
            <button type="button" data-action="delete" aria-label="löschen">${iconSvg(
              "trash",
              16
            )}</button>
          </div>
        </header>
        <textarea rows="3" placeholder="Beschreibung ergänzen" data-entry="${
          entry.id
        }">${entry.description}</textarea>
      </div>`;

    article.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const action = btn.getAttribute("data-action");
        if (action === "delete") {
          removeEntry(index);
        } else if (action === "up") {
          moveEntry(index, -1);
        } else if (action === "down") {
          moveEntry(index, 1);
        }
        render(list, pdfButton);
      });
    });

    const textarea = article.querySelector("textarea");
    if (textarea) {
      textarea.addEventListener("input", () => {
        entry.description = textarea.value;
      });
      if (focusTarget && entry.id === focusTarget) {
        requestAnimationFrame(() => {
          textarea.focus();
          textarea.scrollIntoView({ behavior: "smooth", block: "center" });
        });
      }
    }

    fragment.appendChild(article);
  });

  list.replaceChildren(fragment);
  pdfButton.disabled = entries.length === 0;
  pendingFocusEntryId = null;
}

function resetGeneratedPdf(
  shareButton: HTMLButtonElement,
  downloadButton: HTMLButtonElement
) {
  lastPdfBlob = null;
  lastPdfFilename = null;
  lastPdfFile = null;
  lastExportSnapshot = null;
  updateExportButtons(shareButton, downloadButton);
}

function updateExportButtons(
  shareButton: HTMLButtonElement,
  downloadButton: HTMLButtonElement
) {
  const hasBlob = Boolean(lastPdfBlob && lastPdfFilename);
  const hasFile = Boolean(lastPdfFile);
  downloadButton.disabled = !hasBlob;
  const shareAvailable = hasBlob && hasFile && canUseShareForCurrentPdf();
  shareButton.disabled = !shareAvailable;
}

async function ensureSharePdfIsReady(
  status: HTMLElement,
  shareButton: HTMLButtonElement,
  downloadButton: HTMLButtonElement
) {
  if (!lastPdfFile || lastPdfFile.size <= SHARE_SIZE_LIMIT) {
    return true;
  }
  if (!lastExportSnapshot) {
    setStatus(
      status,
      "PDF zu groß zum Teilen – bitte erneut im Papier-Modus erzeugen.",
      "error"
    );
    return false;
  }
  if (lastExportSnapshot.preset === SHARE_FALLBACK_PRESET) {
    setStatus(
      status,
      "PDF ist trotz Papier-Modus zu groß – bitte weniger Fotos auswählen.",
      "error"
    );
    return false;
  }
  setStatus(status, "PDF wird für das Teilen verkleinert ...");
  shareButton.dataset.loading = "true";
  try {
    const payload = await buildPayloadFromSources(
      lastExportSnapshot.sources,
      SHARE_FALLBACK_PRESET
    );
    const bytes = await generatePhotoPdf(payload);
    const blob = new Blob([bytes], { type: "application/pdf" });
    const filenameBase =
      lastPdfFilename?.replace(/\.pdf$/i, "") ??
      `foto-notizen-${new Date().toISOString().slice(0, 10)}`;
    const optimizedFilename = `${filenameBase}-kompakt.pdf`;
    lastPdfBlob = blob;
    lastPdfFile = new File([bytes], optimizedFilename, {
      type: "application/pdf",
      lastModified: Date.now(),
    });
    lastPdfFilename = optimizedFilename;
    lastExportSnapshot = {
      sources: lastExportSnapshot.sources,
      preset: SHARE_FALLBACK_PRESET,
    };
    updateExportButtons(shareButton, downloadButton);
    setStatus(status, "PDF verkleinert – Share Sheet wird geöffnet ...");
    return true;
  } catch (error) {
    console.error("PDF konnte nicht für Sharing optimiert werden", error);
    setStatus(status, "PDF konnte nicht verkleinert werden.", "error");
    return false;
  } finally {
    shareButton.dataset.loading = "false";
  }
}

function canUseShareForCurrentPdf() {
  if (!lastPdfFile) {
    return false;
  }
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");
  if (!isMobile) {
    return false;
  }
  if (!navigator.canShare || !navigator.share) {
    return false;
  }
  return true;
}

function removeEntry(position: number) {
  const [entry] = entries.splice(position, 1);
  if (entry?.url) {
    URL.revokeObjectURL(entry.url);
  }
}

function clearEntries() {
  while (entries.length) {
    const entry = entries.pop();
    if (entry?.url) {
      URL.revokeObjectURL(entry.url);
    }
  }
  pendingFocusEntryId = null;
}

function moveEntry(position: number, delta: number) {
  const target = position + delta;
  if (target < 0 || target >= entries.length) {
    return;
  }
  const [item] = entries.splice(position, 1);
  entries.splice(target, 0, item);
}

function setStatus(
  element: HTMLElement,
  message: string,
  tone: "info" | "error" = "info"
) {
  const copy = element.querySelector<HTMLElement>("[data-role='status-copy']");
  if (copy) {
    copy.textContent = message;
  } else {
    element.textContent = message;
  }
  element.dataset.tone = tone;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

type ShareResult = "shared" | "aborted" | "failed" | "unsupported";

async function tryShare(file: File): Promise<ShareResult> {
  if (!navigator.canShare || !navigator.share) {
    return "unsupported";
  }
  const isMobilePlatform = /Android|iPhone|iPad|iPod/i.test(
    navigator.userAgent || ""
  );
  if (!isMobilePlatform) {
    return "unsupported";
  }
  const supportsFiles = (() => {
    try {
      return navigator.canShare?.({ files: [file] }) ?? false;
    } catch (error) {
      console.warn("canShare-Dateien nicht verfügbar", error);
      return false;
    }
  })();
  if (!supportsFiles) {
    return "unsupported";
  }
  try {
    await navigator.share({
      files: [file],
      title: "Fotoerfassung & Notizen",
      text: `PDF im Anhang: ${file.name}`,
    });
    return "shared";
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return "aborted";
    }
    console.error("Teilen nicht möglich", error);
    return "failed";
  }
}

async function convertFileToPreset(
  file: File,
  presetKey: PresetKey
): Promise<File> {
  const isHeic =
    /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
  if (isHeic) {
    throw new Error(
      "HEIC aktuell nicht unterstützt – bitte als JPG/PNG speichern."
    );
  }
  if (!file.type.startsWith("image/")) {
    throw new Error(
      `Dateityp ${file.type || "unbekannt"} wird nicht unterstützt.`
    );
  }
  const config = QUALITY_PRESETS[presetKey];
  const { image, orientation, cleanup } = await loadImageWithOrientation(file);
  const canvas = renderImageToCanvas(image, orientation, config);

  const preserveMime =
    presetKey === DEFAULT_PRESET && ALLOWED_FILE_TYPES.includes(file.type);
  const targetMime = preserveMime ? file.type : config.mimeType;
  const qualityValue = /jpe?g/i.test(targetMime) ? config.quality : undefined;
  const blob = await canvasToBlob(canvas, targetMime, qualityValue);
  cleanup?.();
  const extension = mimeTypeToExtension(targetMime);
  return new File([blob], ensureExtension(file.name, extension), {
    type: targetMime,
  });
}

async function buildPayloadFromSources(
  sources: Array<{ file: File; description: string }>,
  preset: PresetKey
) {
  const payload: PhotoEntryPayload[] = [];
  for (const source of sources) {
    const processed = await convertFileToPreset(source.file, preset);
    payload.push({ file: processed, description: source.description });
  }
  return payload;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Bild konnte nicht geladen werden."));
    };
    img.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Bild konnte nicht komprimiert werden."));
        }
      },
      type,
      quality
    );
  });
}

function ensureExtension(name: string, extension: string) {
  if (name.toLowerCase().endsWith(extension)) {
    return name;
  }
  return `${name.replace(/\.[^.]+$/, "")}${extension}`;
}

function mimeTypeToExtension(type: string) {
  if (type.includes("png")) {
    return ".png";
  }
  if (type.includes("webp")) {
    return ".webp";
  }
  return ".jpg";
}

function renderImageToCanvas(
  image: CanvasImageSource,
  orientation: number,
  config: QualityConfig
) {
  const { width: sourceWidth, height: sourceHeight } =
    getSourceDimensions(image);
  const targetEdge = config.maxEdge ?? Math.max(sourceWidth, sourceHeight);
  const scale = Math.min(1, targetEdge / Math.max(sourceWidth, sourceHeight));
  const width = Math.round(sourceWidth * scale);
  const height = Math.round(sourceHeight * scale);

  const finalOrientation = orientation || 1;
  const { width: canvasWidth, height: canvasHeight } = getOrientedSize(
    width,
    height,
    finalOrientation
  );

  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas-Kontext nicht verfügbar.");
  }
  if (finalOrientation !== 1) {
    applyOrientationTransform(ctx, finalOrientation, width, height);
  }
  ctx.drawImage(image, 0, 0, width, height);
  return canvas;
}

function getOrientedSize(width: number, height: number, orientation: number) {
  if ([5, 6, 7, 8].includes(orientation)) {
    return { width: height, height: width };
  }
  return { width, height };
}

function applyOrientationTransform(
  ctx: CanvasRenderingContext2D,
  orientation: number,
  width: number,
  height: number
) {
  switch (orientation) {
    case 2:
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      break;
    case 3:
      ctx.translate(width, height);
      ctx.rotate(Math.PI);
      break;
    case 4:
      ctx.translate(0, height);
      ctx.scale(1, -1);
      break;
    case 5:
      ctx.rotate(0.5 * Math.PI);
      ctx.scale(1, -1);
      break;
    case 6:
      ctx.rotate(0.5 * Math.PI);
      ctx.translate(0, -height);
      break;
    case 7:
      ctx.rotate(0.5 * Math.PI);
      ctx.translate(width, -height);
      ctx.scale(-1, 1);
      break;
    case 8:
      ctx.rotate(-0.5 * Math.PI);
      ctx.translate(-width, 0);
      break;
    default:
      break;
  }
}

type LoadedImage = {
  image: CanvasImageSource;
  orientation: number;
  cleanup?: () => void;
};

async function loadImageWithOrientation(file: File): Promise<LoadedImage> {
  // Try to read EXIF first; fall back to upright if unavailable.
  const orientation = (await readExifOrientation(file)) ?? 1;

  // Prefer ImageBitmap to avoid layout side effects and free memory afterwards.
  // Modern browsers auto-apply EXIF orientation when loading images via createImageBitmap.
  // We use imageOrientation: 'none' to prevent browser auto-rotation, so we can
  // apply orientation transforms ourselves for consistent behavior.
  if (typeof createImageBitmap === "function") {
    try {
      // Try to disable browser auto-rotation by using imageOrientation: 'none'
      // This gives us consistent control over orientation handling.
      const bitmap = await createImageBitmap(file, {
        imageOrientation: "none",
      });
      return {
        image: bitmap,
        orientation,
        cleanup: () => bitmap.close?.(),
      };
    } catch (error) {
      // imageOrientation option may not be supported in older browsers
      // In that case, createImageBitmap auto-rotates, so we set orientation to 1
      try {
        const bitmap = await createImageBitmap(file);
        return {
          image: bitmap,
          orientation: 1, // Browser already applied rotation
          cleanup: () => bitmap.close?.(),
        };
      } catch (innerError) {
        console.warn("ImageBitmap konnte nicht erstellt werden, fallback", innerError);
      }
    }
  }

  const img = await loadImage(file);
  return { image: img, orientation };
}

function getSourceDimensions(image: CanvasImageSource) {
  const maybeImg = image as HTMLImageElement;
  const width =
    (maybeImg.naturalWidth || (maybeImg as any).width || 0) as number;
  const height =
    (maybeImg.naturalHeight || (maybeImg as any).height || 0) as number;
  return { width, height };
}

async function readExifOrientation(file: File): Promise<number | null> {
  const isJpeg =
    /jpe?g/i.test(file.type) || /\.(jpe?g)$/i.test(file.name ?? "");
  if (!isJpeg) {
    return null;
  }
  let buffer: ArrayBuffer;
  try {
    buffer = await file.arrayBuffer();
  } catch (error) {
    console.warn("Exif konnte nicht gelesen werden", error);
    return null;
  }
  const view = new DataView(buffer);
  if (view.getUint16(0, false) !== 0xffd8) {
    return null;
  }
  let offset = 2;
  while (offset < view.byteLength) {
    if (view.getUint16(offset, false) === 0xffe1) {
      const length = view.getUint16(offset + 2, false);
      if (length < 10) {
        return null;
      }
      const exifStart = offset + 4;
      if (view.getUint32(exifStart, false) !== 0x45786966) {
        offset += length + 2;
        continue;
      }
      const tiffOffset = exifStart + 6;
      const little = view.getUint16(tiffOffset, false) === 0x4949;
      const firstIfdOffset = view.getUint32(tiffOffset + 4, little);
      if (firstIfdOffset < 0x00000008) {
        return null;
      }
      let dirOffset = tiffOffset + firstIfdOffset;
      const entries = view.getUint16(dirOffset, little);
      dirOffset += 2;
      for (let i = 0; i < entries; i++) {
        const entryOffset = dirOffset + i * 12;
        const tag = view.getUint16(entryOffset, little);
        if (tag === 0x0112) {
          return view.getUint16(entryOffset + 8, little);
        }
      }
      return null;
    }
    const segmentLength = view.getUint16(offset + 2, false);
    if (segmentLength <= 0) {
      break;
    }
    offset += segmentLength + 2;
  }
  return null;
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", ready);
} else {
  ready();
}
