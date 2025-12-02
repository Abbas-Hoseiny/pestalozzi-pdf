const OPENCV_SRC =
  "https://cdn.jsdelivr.net/npm/@techstark/opencv-js@4.10.0/dist/opencv.js";

type CvModule = typeof import("@techstark/opencv-js");

declare global {
  interface Window {
    cv?: CvModule;
  }
}

let opencvPromise: Promise<CvModule> | null = null;

export function ensureVisionRuntime() {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("OpenCV kann nur im Browser geladen werden.")
    );
  }
  if (window.cv) {
    return Promise.resolve(window.cv);
  }
  if (!opencvPromise) {
    opencvPromise = new Promise<CvModule>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        `script[data-opencv="true"]`
      );
      if (existing) {
        existing.addEventListener("load", () => {
          if (window.cv) {
            resolve(window.cv);
          } else {
            reject(
              new Error(
                "OpenCV konnte nach dem Laden nicht initialisiert werden."
              )
            );
          }
        });
        existing.addEventListener("error", () => {
          reject(new Error("OpenCV-Skript konnte nicht geladen werden."));
        });
        return;
      }
      const script = document.createElement("script");
      script.async = true;
      script.src = OPENCV_SRC;
      script.crossOrigin = "anonymous";
      script.dataset.opencv = "true";
      script.onload = () => {
        if (window.cv) {
          resolve(window.cv);
        } else {
          reject(new Error("OpenCV konnte nicht initialisiert werden."));
        }
      };
      script.onerror = () => {
        reject(new Error("OpenCV-Skript konnte nicht geladen werden."));
      };
      document.head.appendChild(script);
    });
  }
  return opencvPromise;
}

export type DocumentWarpResult = {
  canvas: HTMLCanvasElement;
  corners: Array<{ x: number; y: number }>;
  success: boolean;
};

type Point = { x: number; y: number };

export async function autoCropDocument(
  sourceCanvas: HTMLCanvasElement
): Promise<DocumentWarpResult> {
  const cv = await ensureVisionRuntime();
  try {
    const srcMat = cv.imread(sourceCanvas);
    const gray = new cv.Mat();
    const blurred = new cv.Mat();
    const edges = new cv.Mat();
    cv.cvtColor(srcMat, gray, cv.COLOR_RGBA2GRAY, 0);
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);
    cv.Canny(blurred, edges, 75, 200, 3, false);

    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(
      edges,
      contours,
      hierarchy,
      cv.RETR_LIST,
      cv.CHAIN_APPROX_SIMPLE
    );

    let bestContour: cv.Mat | null = null;
    let bestArea = 0;
    for (let i = 0; i < contours.size(); i += 1) {
      const contour = contours.get(i);
      const perimeter = cv.arcLength(contour, true);
      const approx = new cv.Mat();
      cv.approxPolyDP(contour, approx, 0.02 * perimeter, true);
      if (approx.rows === 4 && cv.isContourConvex(approx)) {
        const area = cv.contourArea(approx);
        if (area > bestArea) {
          bestArea = area;
          if (bestContour) bestContour.delete();
          bestContour = approx;
        } else {
          approx.delete();
        }
      } else {
        approx.delete();
      }
    }

    if (!bestContour) {
      cleanup();
      return { canvas: sourceCanvas, corners: [], success: false };
    }

    const ordered = orderContourPoints(cv, bestContour);
    const target = computeDestinationSize(ordered.points);
    const dst = cv.matFromArray(4, 1, cv.CV_32FC2, [
      0,
      0,
      target.width,
      0,
      target.width,
      target.height,
      0,
      target.height,
    ]);
    const transform = cv.getPerspectiveTransform(ordered.mat, dst);
    const warped = new cv.Mat();
    cv.warpPerspective(
      srcMat,
      warped,
      transform,
      new cv.Size(target.width, target.height)
    );
    const outputCanvas = document.createElement("canvas");
    outputCanvas.width = target.width;
    outputCanvas.height = target.height;
    cv.imshow(outputCanvas, warped);

    cleanup();
    ordered.mat.delete();
    dst.delete();
    transform.delete();
    warped.delete();
    bestContour?.delete();

    return {
      canvas: outputCanvas,
      corners: ordered.points,
      success: true,
    };

    function cleanup() {
      srcMat.delete();
      gray.delete();
      blurred.delete();
      edges.delete();
      contours.delete();
      hierarchy.delete();
    }
  } catch (error) {
    console.error("Auto-Crop fehlgeschlagen", error);
    return { canvas: sourceCanvas, corners: [], success: false };
  }
}

function orderContourPoints(cv: CvModule, contour: cv.Mat) {
  const pts: Point[] = [];
  for (let i = 0; i < contour.rows; i += 1) {
    const baseIndex = i * contour.cols * contour.channels();
    pts.push({
      x: contour.data32S[baseIndex],
      y: contour.data32S[baseIndex + 1],
    });
  }
  const sumSorted = [...pts].sort((a, b) => a.x + a.y - (b.x + b.y));
  const diffSorted = [...pts].sort((a, b) => a.x - a.y - (b.x - b.y));
  const orderedPoints: Point[] = [
    sumSorted[0], // top-left
    diffSorted[diffSorted.length - 1], // top-right
    sumSorted[sumSorted.length - 1], // bottom-right
    diffSorted[0], // bottom-left
  ];
  const mat = new cv.Mat(4, 1, cv.CV_32FC2);
  orderedPoints.forEach((p, idx) => {
    mat.data32F[idx * 2] = p.x;
    mat.data32F[idx * 2 + 1] = p.y;
  });
  return { mat, points: orderedPoints };
}

function computeDestinationSize(points: Point[]) {
  const topWidth = distance(points[0], points[1]);
  const bottomWidth = distance(points[3], points[2]);
  const leftHeight = distance(points[0], points[3]);
  const rightHeight = distance(points[1], points[2]);
  const width = Math.max(topWidth, bottomWidth);
  const height = Math.max(leftHeight, rightHeight);
  return {
    width: Math.max(200, Math.ceil(width)),
    height: Math.max(200, Math.ceil(height)),
  };
}

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
