const TARGET_COLOR = "#5c2483";
const ACCEPTED_TYPES = new Set(["application/pdf", "image/png", "image/jpeg"]);
const PDF_RENDER_SCALE = 6;
const ANTIALIAS_EDGE_THRESHOLD = 220;
const PAKO_URL = "https://cdnjs.cloudflare.com/ajax/libs/pako/2.1.0/pako.min.js";
const PDFJS_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js";
const PDF_WORKER_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

const state = {
  entries: [],
  selectedId: null,
  pdfjs: null,
};

const els = {
  clearButton: document.querySelector("#clearButton"),
  convertedCount: document.querySelector("#convertedCount"),
  dropZone: document.querySelector("#dropZone"),
  exportAllButton: document.querySelector("#exportAllButton"),
  exportSelectedButton: document.querySelector("#exportSelectedButton"),
  fileCount: document.querySelector("#fileCount"),
  fileInput: document.querySelector("#fileInput"),
  formatSelect: document.querySelector("#formatSelect"),
  includeBaseInput: document.querySelector("#includeBaseInput"),
  pageCount: document.querySelector("#pageCount"),
  pickFilesButton: document.querySelector("#pickFilesButton"),
  previewArea: document.querySelector("#previewArea"),
  statusPill: document.querySelector("#statusPill"),
  strictNeutralInput: document.querySelector("#strictNeutralInput"),
  thresholdInput: document.querySelector("#thresholdInput"),
  thresholdValue: document.querySelector("#thresholdValue"),
  template: document.querySelector("#pageTemplate"),
};

els.pickFilesButton.addEventListener("click", () => els.fileInput.click());
els.fileInput.addEventListener("change", (event) => handleFiles(event.target.files));
els.clearButton.addEventListener("click", clearAll);
els.exportSelectedButton.addEventListener("click", async () => {
  const entry = state.entries.find((item) => item.id === state.selectedId) ?? state.entries[0];
  if (entry) await downloadEntry(entry, els.formatSelect.value);
});
els.exportAllButton.addEventListener("click", exportAll);
els.thresholdInput.addEventListener("input", () => {
  els.thresholdValue.textContent = els.thresholdInput.value;
  rerenderProcessed();
});
els.strictNeutralInput.addEventListener("change", rerenderProcessed);

["dragenter", "dragover"].forEach((eventName) => {
  els.dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    els.dropZone.classList.add("is-dragging");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  els.dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    els.dropZone.classList.remove("is-dragging");
  });
});

els.dropZone.addEventListener("drop", (event) => handleFiles(event.dataTransfer.files));

async function handleFiles(fileList) {
  const files = [...fileList].filter((file) => ACCEPTED_TYPES.has(file.type));
  if (!files.length) {
    setStatus("Formato no compatible");
    return;
  }

  setStatus("Procesando...");
  els.previewArea.innerHTML = "";

  try {
    for (const file of files) {
      if (file.type === "application/pdf") {
        await processPdf(file);
      } else {
        await processImage(file);
      }
    }
    updateSummary();
    setStatus("Listo");
  } catch (error) {
    console.error(error);
    setStatus("No se pudo procesar");
    if (!state.entries.length) {
      renderEmptyState(error.message || "No se pudo procesar el archivo.");
    }
  } finally {
    els.fileInput.value = "";
  }
}

async function processImage(file) {
  const image = await loadImage(file);
  const source = document.createElement("canvas");
  source.width = image.naturalWidth;
  source.height = image.naturalHeight;
  source.getContext("2d").drawImage(image, 0, 0);
  addEntry(file.name, "Imagen", source);
}

async function processPdf(file) {
  const pdfjs = await getPdfJs().catch(() => {
    throw new Error("No se pudo cargar el motor PDF. Revisa la conexión e intenta de nuevo.");
  });
  const buffer = await file.arrayBuffer();
  const originalPdfBytes = new Uint8Array(buffer);
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: PDF_RENDER_SCALE });
    const vectorViewport = page.getViewport({ scale: 1 });
    const convertedSvgText = await buildPdfPageSvg(pdfjs, page, vectorViewport).catch(() => "");
    const source = document.createElement("canvas");
    source.width = Math.ceil(viewport.width);
    source.height = Math.ceil(viewport.height);
    await page.render({
      canvasContext: source.getContext("2d", { willReadFrequently: true }),
      viewport,
    }).promise;
    addEntry(file.name, `Página ${pageNumber} de ${pdf.numPages}`, source, PDF_RENDER_SCALE, {
      convertedSvgText,
      originalPdfBytes,
      sourceKind: "pdf",
    });
  }
}

async function buildPdfPageSvg(pdfjs, page, viewport) {
  if (typeof pdfjs.SVGGraphics !== "function") {
    return "";
  }

  const operatorList = await page.getOperatorList();
  const svgGraphics = new pdfjs.SVGGraphics(page.commonObjs, page.objs);
  svgGraphics.embedFonts = true;
  const svg = await svgGraphics.getSVG(operatorList, viewport);
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  svg.setAttribute("width", svgNumber(viewport.width));
  svg.setAttribute("height", svgNumber(viewport.height));
  svg.setAttribute("viewBox", `0 0 ${svgNumber(viewport.width)} ${svgNumber(viewport.height)}`);
  colorizeBlackSvgContent(svg);
  return new XMLSerializer().serializeToString(svg);
}

async function getPdfJs() {
  if (state.pdfjs) return state.pdfjs;
  await loadScript(PDFJS_URL);
  const pdfjs = window.pdfjsLib;
  if (!pdfjs) {
    throw new Error("No se pudo cargar el motor PDF.");
  }
  pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
  state.pdfjs = pdfjs;
  return pdfjs;
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
      if ((src === PDFJS_URL && window.pdfjsLib) || (src === PAKO_URL && window.pako)) resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.append(script);
  });
}

function addEntry(fileName, label, sourceCanvas, sourceScale = 1, options = {}) {
  const id = crypto.randomUUID();
  const resultCanvas = document.createElement("canvas");
  const baseCanvas = document.createElement("canvas");
  const maskCanvas = document.createElement("canvas");
  const entry = {
    id,
    baseCanvas,
    blackPixels: 0,
    convertedSvgText: options.convertedSvgText || "",
    fileName,
    label,
    maskCanvas,
    resultCanvas,
    sourceCanvas,
    sourceKind: options.sourceKind || "image",
    sourceScale,
    originalPdfBytes: options.originalPdfBytes || null,
    vectorRects: [],
  };
  state.entries.push(entry);
  state.selectedId = id;
  processEntry(entry);
  renderEntry(entry);
}

function processEntry(entry) {
  const threshold = Number(els.thresholdInput.value);
  const strictNeutral = els.strictNeutralInput.checked;
  const { sourceCanvas, resultCanvas, baseCanvas, maskCanvas } = entry;
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  [resultCanvas, baseCanvas, maskCanvas].forEach((canvas) => {
    canvas.width = width;
    canvas.height = height;
  });

  const sourceContext = sourceCanvas.getContext("2d", { willReadFrequently: true });
  const resultContext = resultCanvas.getContext("2d", { willReadFrequently: true });
  const baseContext = baseCanvas.getContext("2d", { willReadFrequently: true });
  const maskContext = maskCanvas.getContext("2d", { willReadFrequently: true });
  const sourceData = sourceContext.getImageData(0, 0, width, height);
  const resultData = new ImageData(new Uint8ClampedArray(sourceData.data), width, height);
  const baseData = new ImageData(new Uint8ClampedArray(sourceData.data), width, height);
  const maskData = maskContext.createImageData(width, height);
  const rgb = hexToRgb(TARGET_COLOR);
  const coreMask = buildCoreMask(sourceData, threshold, strictNeutral);
  let blackPixels = 0;
  const vectorRects = [];
  let activeRects = new Map();

  for (let y = 0; y < height; y += 1) {
    const rowRuns = [];
    let runStart = null;

    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const r = sourceData.data[index];
      const g = sourceData.data[index + 1];
      const b = sourceData.data[index + 2];
      const a = sourceData.data[index + 3];
      const black =
        a > 0 &&
        isBlackElement(r, g, b, threshold, strictNeutral, x, y, width, height, coreMask);

      if (black) {
        resultData.data[index] = rgb.r;
        resultData.data[index + 1] = rgb.g;
        resultData.data[index + 2] = rgb.b;
        baseData.data[index + 3] = 0;
        maskData.data[index] = 255;
        maskData.data[index + 1] = 255;
        maskData.data[index + 2] = 255;
        maskData.data[index + 3] = 255;
        blackPixels += 1;
        if (runStart === null) runStart = x;
      } else if (runStart !== null) {
        rowRuns.push([runStart, x]);
        runStart = null;
      }
    }

    if (runStart !== null) rowRuns.push([runStart, width]);
    activeRects = extendVectorRects(rowRuns, y, activeRects, vectorRects);
  }

  for (const rect of activeRects.values()) {
    vectorRects.push(rect);
  }

  vectorRects.sort((a, b) => a.y - b.y || a.x - b.x || a.width - b.width);
  resultContext.putImageData(resultData, 0, 0);
  baseContext.putImageData(baseData, 0, 0);
  maskContext.putImageData(maskData, 0, 0);
  entry.blackPixels = blackPixels;
  entry.vectorRects = vectorRects;
}

function extendVectorRects(rowRuns, y, activeRects, vectorRects) {
  const nextActiveRects = new Map();

  for (const [start, end] of rowRuns) {
    const key = `${start},${end}`;
    const existing = activeRects.get(key);
    if (existing) {
      existing.height += 1;
      nextActiveRects.set(key, existing);
    } else {
      nextActiveRects.set(key, {
        height: 1,
        width: end - start,
        x: start,
        y,
      });
    }
  }

  for (const [key, rect] of activeRects) {
    if (!nextActiveRects.has(key)) vectorRects.push(rect);
  }

  return nextActiveRects;
}

function buildCoreMask(sourceData, threshold, strictNeutral) {
  const pixelCount = sourceData.width * sourceData.height;
  const mask = new Uint8Array(pixelCount);

  for (let pixel = 0; pixel < pixelCount; pixel += 1) {
    const index = pixel * 4;
    const r = sourceData.data[index];
    const g = sourceData.data[index + 1];
    const b = sourceData.data[index + 2];
    const a = sourceData.data[index + 3];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (a > 0 && max <= threshold && (!strictNeutral || max - min <= 12)) {
      mask[pixel] = 1;
    }
  }

  return mask;
}

function isBlackElement(r, g, b, threshold, strictNeutral, x, y, width, height, coreMask) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const neutral = !strictNeutral || max - min <= 14;
  if (!neutral) return false;
  if (max <= threshold) return true;
  return max <= ANTIALIAS_EDGE_THRESHOLD && touchesCoreBlack(x, y, width, height, coreMask);
}

function touchesCoreBlack(x, y, width, height, coreMask) {
  for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
    const checkY = y + offsetY;
    if (checkY < 0 || checkY >= height) continue;

    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
      const checkX = x + offsetX;
      if (checkX < 0 || checkX >= width) continue;
      if (coreMask[checkY * width + checkX]) return true;
    }
  }

  return false;
}

function renderEntry(entry) {
  const node = els.template.content.firstElementChild.cloneNode(true);
  node.dataset.id = entry.id;
  node.classList.toggle("is-selected", state.selectedId === entry.id);
  node.querySelector("h3").textContent = entry.fileName;
  node.querySelector("p").textContent =
    `${entry.label} · ${formatEntrySize(entry)} · ` +
    `${entry.blackPixels.toLocaleString("es-PE")} píxeles convertidos`;

  const sourcePreview = node.querySelector(".source-canvas");
  const resultPreview = node.querySelector(".result-canvas");
  copyCanvas(entry.sourceCanvas, sourcePreview);
  copyCanvas(entry.resultCanvas, resultPreview);

  node.addEventListener("click", () => {
    state.selectedId = entry.id;
    document.querySelectorAll(".page-card").forEach((card) => {
      card.classList.toggle("is-selected", card.dataset.id === entry.id);
    });
  });
  node.querySelector(".download-svg").addEventListener("click", async (event) => {
    event.stopPropagation();
    await downloadEntry(entry, "svg");
  });
  node.querySelector(".download-ai").addEventListener("click", async (event) => {
    event.stopPropagation();
    await downloadEntry(entry, "ai");
  });
  node.querySelector(".download-pdf").addEventListener("click", async (event) => {
    event.stopPropagation();
    await downloadEntry(entry, "pdf");
  });
  node.querySelector(".download-jpg").addEventListener("click", async (event) => {
    event.stopPropagation();
    await downloadEntry(entry, "jpg");
  });
  els.previewArea.append(node);
}

function rerenderProcessed() {
  for (const entry of state.entries) {
    processEntry(entry);
    const node = document.querySelector(`[data-id="${entry.id}"]`);
    if (!node) continue;
    copyCanvas(entry.resultCanvas, node.querySelector(".result-canvas"));
    node.querySelector("p").textContent =
      `${entry.label} · ${formatEntrySize(entry)} · ` +
      `${entry.blackPixels.toLocaleString("es-PE")} píxeles convertidos`;
  }
  updateSummary();
}

function copyCanvas(source, target) {
  target.width = source.width;
  target.height = source.height;
  target.getContext("2d").drawImage(source, 0, 0);
}

function buildSvg(entry) {
  if (entry.convertedSvgText && !els.includeBaseInput.checked) {
    return entry.convertedSvgText;
  }

  const width = exportWidth(entry);
  const height = exportHeight(entry);
  const title = escapeXml(`${entry.fileName} ${entry.label}`);
  const baseDataUrl = els.includeBaseInput.checked ? entry.baseCanvas.toDataURL("image/png") : "";
  const baseLayer = baseDataUrl
    ? `  <image id="original-without-black" href="${baseDataUrl}" xlink:href="${baseDataUrl}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="none"/>
`
    : "";
  const vectorPaths = buildSvgVectorPaths(entry);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${title}">
  <title>${title}</title>
${baseLayer}  <path id="converted-black-elements-vector" fill="${TARGET_COLOR}" fill-rule="nonzero" d="${vectorPaths}"/>
</svg>`;
}

function colorizeBlackSvgContent(svg) {
  const paintAttributes = ["fill", "stroke", "color"];
  const elements = [svg, ...svg.querySelectorAll("*")];

  for (const element of elements) {
    for (const attribute of paintAttributes) {
      const value = element.getAttribute(attribute);
      if (isConvertiblePlanPaint(value)) {
        element.setAttribute(attribute, TARGET_COLOR);
      }
    }

    applyDefaultPlanPaint(element);

    const style = element.getAttribute("style");
    if (style) {
      element.setAttribute("style", replacePlanPaintInStyle(style));
    }
  }

  for (const styleElement of svg.querySelectorAll("style")) {
    styleElement.textContent = replacePlanPaintInStyle(styleElement.textContent || "");
  }
}

function applyDefaultPlanPaint(element) {
  const tag = element.tagName.toLowerCase();
  const paintable = ["path", "text", "tspan", "rect", "circle", "ellipse", "polygon", "polyline", "line"];
  if (!paintable.includes(tag)) return;
  if (element.hasAttribute("fill") || element.hasAttribute("stroke") || element.hasAttribute("style")) return;
  if (tag === "line" || tag === "polyline") {
    element.setAttribute("stroke", TARGET_COLOR);
  } else {
    element.setAttribute("fill", TARGET_COLOR);
  }
}

function replacePlanPaintInStyle(style) {
  return style.replace(/(fill|stroke|color)\s*:\s*([^;{}]+)/gi, (match, property, value) => {
    return isConvertiblePlanPaint(value) ? `${property}: ${TARGET_COLOR}` : match;
  });
}

function isConvertiblePlanPaint(value) {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "none" ||
    normalized === "transparent" ||
    normalized === "currentcolor" ||
    normalized.startsWith("url(")
  ) {
    return false;
  }
  if (normalized === "black") return true;

  const parsed = parseCssColor(normalized);
  if (!parsed) return false;
  const max = Math.max(parsed.r, parsed.g, parsed.b);
  const min = Math.min(parsed.r, parsed.g, parsed.b);
  return parsed.a > 0 && max < 248 && max - min < 24;
}

function parseCssColor(value) {
  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const raw = hex[1];
    const expanded =
      raw.length === 3
        ? raw
            .split("")
            .map((char) => char + char)
            .join("")
        : raw;
    return {
      a: 1,
      b: Number.parseInt(expanded.slice(4, 6), 16),
      g: Number.parseInt(expanded.slice(2, 4), 16),
      r: Number.parseInt(expanded.slice(0, 2), 16),
    };
  }

  const rgb = value.match(
    /^rgba?\(\s*([\d.]+%?)\s*,\s*([\d.]+%?)\s*,\s*([\d.]+%?)(?:\s*,\s*([\d.]+))?\s*\)$/i,
  );
  if (!rgb) return null;

  return {
    a: rgb[4] === undefined ? 1 : Number(rgb[4]),
    b: cssChannelToByte(rgb[3]),
    g: cssChannelToByte(rgb[2]),
    r: cssChannelToByte(rgb[1]),
  };
}

function cssChannelToByte(value) {
  return value.endsWith("%") ? Math.round((Number.parseFloat(value) / 100) * 255) : Number(value);
}

function buildSvgVectorPaths(entry) {
  const scale = entry.sourceScale || 1;
  return entry.vectorRects
    .map((rect) => {
      const x = svgNumber(rect.x / scale);
      const y = svgNumber(rect.y / scale);
      const width = svgNumber(rect.width / scale);
      const height = svgNumber(rect.height / scale);
      return `M${x} ${y}h${width}v${height}h-${width}z`;
    })
    .join("");
}

async function downloadEntry(entry, format) {
  setStatus("Exportando...");
  if (format === "ai") {
    await downloadAi(entry);
    setStatus("Listo");
    return;
  }

  if (format === "pdf") {
    await downloadPdf(entry);
    setStatus("Listo");
    return;
  }

  if (format === "jpg") {
    await downloadJpg(entry);
    setStatus("Listo");
    return;
  }

  downloadBlob({
    blob: new Blob([buildSvg(entry)], { type: "image/svg+xml;charset=utf-8" }),
    filename: `${entryBaseName(entry)}.svg`,
  });
  setStatus("Listo");
}

async function downloadAi(entry) {
  const ai = entry.originalPdfBytes
    ? await buildRecoloredOriginalPdf(entry.originalPdfBytes)
    : buildIllustratorFile(entry);
  downloadBlob({
    blob: new Blob([ai], { type: "application/pdf" }),
    filename: `${entryBaseName(entry)}.ai`,
  });
}

async function downloadPdf(entry) {
  const pdf = entry.originalPdfBytes
    ? await buildRecoloredOriginalPdf(entry.originalPdfBytes)
    : buildIllustratorFile(entry);
  downloadBlob({
    blob: new Blob([pdf], { type: "application/pdf" }),
    filename: `${entryBaseName(entry)}.pdf`,
  });
}

async function downloadJpg(entry) {
  const canvas = buildHighQualityJpgCanvas(entry);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.98));
  downloadBlob({
    blob,
    filename: `${entryBaseName(entry)}.jpg`,
  });
}

function buildHighQualityJpgCanvas(entry) {
  const canvas = document.createElement("canvas");
  canvas.width = entry.sourceCanvas.width;
  canvas.height = entry.sourceCanvas.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(entry.sourceCanvas, 0, 0);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const target = hexToRgb(TARGET_COLOR);

  for (let index = 0; index < imageData.data.length; index += 4) {
    const alpha = imageData.data[index + 3];
    if (alpha === 0) continue;

    const r = imageData.data[index];
    const g = imageData.data[index + 1];
    const b = imageData.data[index + 2];
    if (isConvertibleRasterPaint(r, g, b)) {
      imageData.data[index] = target.r;
      imageData.data[index + 1] = target.g;
      imageData.data[index + 2] = target.b;
      imageData.data[index + 3] = 255;
    }
  }

  context.putImageData(imageData, 0, 0);
  return canvas;
}

function downloadBlob({ blob, filename }) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function exportAll() {
  state.entries.forEach((entry, index) => {
    setTimeout(() => downloadEntry(entry, els.formatSelect.value), index * 180);
  });
}

async function buildRecoloredOriginalPdf(originalBytes) {
  const pako = await getPako();
  const source = bytesToBinary(originalBytes);
  const objectRegex = /(\d+)\s+(\d+)\s+obj\b([\s\S]*?)endobj/g;
  const objects = [];
  const smaskObjects = findSoftMaskObjects(source);
  let match;
  let maxObjectNumber = 0;

  while ((match = objectRegex.exec(source))) {
    const number = Number(match[1]);
    const generation = Number(match[2]);
    const body = await recolorPdfObjectBody(match[3], pako, number, smaskObjects);
    maxObjectNumber = Math.max(maxObjectNumber, number);
    objects.push({ body, generation, number });
  }

  if (!objects.length) {
    throw new Error("No se pudo leer la estructura del PDF.");
  }

  const trailer = extractTrailer(source, maxObjectNumber + 1);
  return buildPdfFromObjects(objects, trailer, maxObjectNumber + 1);
}

function findSoftMaskObjects(source) {
  const smaskObjects = new Set();
  for (const match of source.matchAll(/\/SMask\s+(\d+)\s+\d+\s+R/g)) {
    smaskObjects.add(Number(match[1]));
  }
  return smaskObjects;
}

async function getPako() {
  if (window.pako) return window.pako;
  await loadScript(PAKO_URL);
  if (!window.pako) {
    throw new Error("No se pudo cargar el compresor PDF.");
  }
  return window.pako;
}

async function recolorPdfObjectBody(body, pako, objectNumber, smaskObjects) {
  const streamMatch = body.match(/\bstream\r?\n/);
  if (!streamMatch) {
    return body;
  }

  if (/\/Subtype\s*\/Image\b/.test(body)) {
    return smaskObjects.has(objectNumber) ? body : await recolorPdfImageObjectBody(body, pako);
  }

  if (!/\/FlateDecode\b/.test(body) || !isPdfContentStream(body)) return body;

  const streamStart = streamMatch.index + streamMatch[0].length;
  const declaredLength = Number((body.slice(0, streamMatch.index).match(/\/Length\s+(\d+)/) || [])[1]);
  if (!Number.isFinite(declaredLength) || declaredLength <= 0) return body;

  const streamEnd = streamStart + declaredLength;
  if (streamEnd > body.length) return body;

  const beforeStream = body.slice(0, streamStart);
  const streamBytes = binaryStringToUint8Array(body.slice(streamStart, streamEnd));
  const afterStream = body.slice(streamEnd);
  let inflated;

  try {
    inflated = pako.inflate(streamBytes);
  } catch {
    return body;
  }

  const content = bytesToBinary(inflated);
  if (isBinaryPdfStream(content)) return body;
  if (!hasPdfPaintOperators(content)) return body;

  const recolored = recolorPdfContentStream(content);
  if (recolored === content) return body;

  const deflated = pako.deflate(binaryStringToUint8Array(recolored));
  const updatedBeforeStream = beforeStream.replace(/\/Length\s+\d+/, `/Length ${deflated.length}`);
  return updatedBeforeStream + bytesToBinary(deflated) + afterStream;
}

function isPdfContentStream(body) {
  if (/\/FontFile|\/FontFile2|\/FontFile3|\/ToUnicode|\/CIDToGIDMap|\/ObjStm|\/Metadata\b/.test(body)) {
    return false;
  }

  return !/\/Subtype\s*\/Image\b/.test(body);
}

function isBinaryPdfStream(content) {
  let binaryControls = 0;
  const sampleLength = Math.min(content.length, 2000);

  for (let index = 0; index < sampleLength; index += 1) {
    const code = content.charCodeAt(index);
    if ((code >= 0 && code <= 8) || (code >= 14 && code <= 31)) binaryControls += 1;
  }

  return binaryControls > 8;
}

async function recolorPdfImageObjectBody(body, pako) {
  if (!/\/DCTDecode\b/.test(body)) return body;

  const streamMatch = body.match(/\bstream\r?\n/);
  if (!streamMatch) return body;

  const streamStart = streamMatch.index + streamMatch[0].length;
  const declaredLength = Number((body.slice(0, streamMatch.index).match(/\/Length\s+(\d+)/) || [])[1]);
  if (!Number.isFinite(declaredLength) || declaredLength <= 0) return body;

  const streamEnd = streamStart + declaredLength;
  if (streamEnd > body.length) return body;

  const beforeStream = body.slice(0, streamStart);
  const streamBytes = binaryStringToUint8Array(body.slice(streamStart, streamEnd));
  const afterStream = body.slice(streamEnd);
  let jpegBytes = streamBytes;

  if (/\/FlateDecode\b/.test(body)) {
    try {
      jpegBytes = pako.inflate(streamBytes);
    } catch {
      return body;
    }
  }

  let recoloredImage;
  try {
    recoloredImage = await recolorJpegBytes(jpegBytes, pako);
  } catch {
    return body;
  }

  if (!recoloredImage) return body;

  const updatedBeforeStream = updateImageDictionaryForFlateRgb(beforeStream, recoloredImage.bytes.length);
  return updatedBeforeStream + bytesToBinary(recoloredImage.bytes) + afterStream;
}

async function recolorJpegBytes(jpegBytes, pako) {
  const blob = new Blob([jpegBytes], { type: "image/jpeg" });
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(bitmap, 0, 0);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const target = hexToRgb(TARGET_COLOR);
  let changed = 0;

  for (let index = 0; index < imageData.data.length; index += 4) {
    const r = imageData.data[index];
    const g = imageData.data[index + 1];
    const b = imageData.data[index + 2];
    if (isConvertibleRasterPaint(r, g, b)) {
      imageData.data[index] = target.r;
      imageData.data[index + 1] = target.g;
      imageData.data[index + 2] = target.b;
      changed += 1;
    }
  }

  if (!changed) return null;

  context.putImageData(imageData, 0, 0);
  const outputData = context.getImageData(0, 0, canvas.width, canvas.height);
  const rgb = new Uint8Array(canvas.width * canvas.height * 3);
  let writeIndex = 0;

  for (let index = 0; index < outputData.data.length; index += 4) {
    rgb[writeIndex] = outputData.data[index];
    rgb[writeIndex + 1] = outputData.data[index + 1];
    rgb[writeIndex + 2] = outputData.data[index + 2];
    writeIndex += 3;
  }

  return {
    bytes: pako.deflate(rgb),
    height: canvas.height,
    width: canvas.width,
  };
}

function isConvertibleRasterPaint(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const luminance = r * 0.2126 + g * 0.7152 + b * 0.0722;
  return max < 252 && (max - min < 90 || luminance < 120);
}

function updateImageDictionaryForFlateRgb(beforeStream, length) {
  let updated = beforeStream
    .replace(/\/Length\s+\d+/, `/Length ${length}`)
    .replace(/\/Filter\s*\[[\s\S]*?\]/, "/Filter /FlateDecode")
    .replace(/\/Filter\s*\/[A-Za-z0-9]+/, "/Filter /FlateDecode")
    .replace(/\/DecodeParms\s*\[[\s\S]*?\]/, "")
    .replace(/\/DecodeParms\s*<<[\s\S]*?>>/, "")
    .replace(/\/Intent\s*\/[A-Za-z0-9]+/, "")
    .replace(/\/Name\s*\/[A-Za-z0-9]+/, "")
    .replace(/\/ColorSpace\s*\/DeviceGray/, "/ColorSpace /DeviceRGB")
    .replace(/\/ColorSpace\s*\/DeviceCMYK/, "/ColorSpace /DeviceRGB")
    .replace(/\/BitsPerComponent\s+\d+/, "/BitsPerComponent 8");

  if (!/\/ColorSpace\b/.test(updated)) {
    updated = updated.replace(/\/Subtype\s*\/Image\b/, "/Subtype /Image /ColorSpace /DeviceRGB");
  }

  return updated;
}

function hasPdfPaintOperators(content) {
  return (
    /(?:^|\s)(?:[-+]?\d*\.?\d+\s+){1,4}(?:rg|RG|g|G|k|K|sc|SC|scn|SCN)\b/.test(content) ||
    /\/DeviceGray\s+(?:CS|cs)\b/.test(content) ||
    /(?:^|\s)(?:S|s|f|F|B|b|Tj|TJ|Do)\b/.test(content)
  );
}

function recolorPdfContentStream(content) {
  return `${pdfPurpleRgb("RG")}\n${pdfPurpleRgb("rg")}\n${content}`
    .replace(/\/DeviceGray\s+CS\b/g, "/DeviceRGB CS")
    .replace(/\/DeviceGray\s+cs\b/g, "/DeviceRGB cs")
    .replace(/\/DeviceCMYK\s+CS\b/g, "/DeviceRGB CS")
    .replace(/\/DeviceCMYK\s+cs\b/g, "/DeviceRGB cs")
    .replace(/q\s+([-+]?\d*\.?\d+(?:\s+[-+]?\d*\.?\d+){5})\s+cm\s+\/([A-Za-z0-9_.-]+)\s+Do\s+Q/g, replaceBlackXObjectDraw)
    .replace(
      /q\s+([-+]?\d*\.?\d+(?:\s+[-+]?\d*\.?\d+){5})\s+cm\s+\/([A-Za-z0-9_.-]+)\s+Do([\s\S]*?)Q/g,
      replaceBlackXObjectDrawWithTail,
    )
    .replace(
      /(^|[\s\r\n])([-+]?\d*\.?\d+)\s+([-+]?\d*\.?\d+)\s+([-+]?\d*\.?\d+)\s+([-+]?\d*\.?\d+)\s+(sc|SC|scn|SCN)\b/g,
      (match, prefix, c, m, y, k, operator) =>
        isConvertiblePdfCmyk(Number(c), Number(m), Number(y), Number(k))
          ? `${prefix}${pdfPurpleRgb(operator === "SC" || operator === "SCN" ? "SC" : "sc")}`
          : match,
    )
    .replace(
      /(^|[\s\r\n])([-+]?\d*\.?\d+)\s+([-+]?\d*\.?\d+)\s+([-+]?\d*\.?\d+)\s+(rg|RG)\b/g,
      (match, prefix, r, g, b, operator) =>
        isConvertiblePdfRgb(Number(r), Number(g), Number(b))
          ? `${prefix}${pdfPurpleRgb(operator)}`
          : match,
    )
    .replace(
      /(^|[\s\r\n])([-+]?\d*\.?\d+)\s+([-+]?\d*\.?\d+)\s+([-+]?\d*\.?\d+)\s+(sc|SC|scn|SCN)\b/g,
      (match, prefix, r, g, b, operator) =>
        isConvertiblePdfRgb(Number(r), Number(g), Number(b))
          ? `${prefix}${pdfPurpleRgb(operator === "SC" || operator === "SCN" ? "SC" : "sc")}`
          : match,
    )
    .replace(/(^|[\s\r\n])([-+]?\d*\.?\d+)\s+(sc|SC|scn|SCN)\b/g, (match, prefix, gray, operator) =>
      Number(gray) < 0.96
        ? `${prefix}${pdfPurpleRgb(operator === "SC" || operator === "SCN" ? "SC" : "sc")}`
        : match,
    )
    .replace(/(^|[\s\r\n])([-+]?\d*\.?\d+)\s+(g|G)\b/g, (match, prefix, gray, operator) =>
      Number(gray) < 0.96 ? `${prefix}${pdfPurpleRgb(operator === "G" ? "RG" : "rg")}` : match,
    )
    .replace(
      /(^|[\s\r\n])([-+]?\d*\.?\d+)\s+([-+]?\d*\.?\d+)\s+([-+]?\d*\.?\d+)\s+([-+]?\d*\.?\d+)\s+(k|K)\b/g,
      (match, prefix, c, m, y, k, operator) =>
        isConvertiblePdfCmyk(Number(c), Number(m), Number(y), Number(k))
          ? `${prefix}${pdfPurpleCmyk(operator)}`
          : match,
    );
}

function isConvertiblePdfRgb(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const luminance = r * 0.2126 + g * 0.7152 + b * 0.0722;
  return max < 0.985 && (max - min < 0.22 || luminance < 0.5);
}

function isConvertiblePdfCmyk(c, m, y, k) {
  return k > 0.02 || (c > 0.85 && m > 0.85 && y > 0.85);
}

function pdfPurpleRgb(operator) {
  const rgb = hexToRgb(TARGET_COLOR);
  return `${pdfNumber(rgb.r / 255)} ${pdfNumber(rgb.g / 255)} ${pdfNumber(rgb.b / 255)} ${operator}`;
}

function pdfPurpleCmyk(operator) {
  return `0.800781 0.999999 0 0 ${operator}`;
}

function replaceBlackXObjectDraw(match, matrix, name) {
  const values = matrix.split(/\s+/).map(Number);
  const [a, b, c, d, e, f] = values;
  if (![a, b, c, d, e, f].every(Number.isFinite)) return match;

  const rgb = hexToRgb(TARGET_COLOR);
  const color = `${pdfNumber(rgb.r / 255)} ${pdfNumber(rgb.g / 255)} ${pdfNumber(rgb.b / 255)} rg`;
  return `q\n${color}\n${a} ${b} ${c} ${d} ${e} ${f} cm\n0 0 1 1 re\nf\nQ`;
}

function replaceBlackXObjectDrawWithoutQ(match, matrix, name) {
  return replaceBlackXObjectDraw(match, matrix, name);
}

function replaceBlackXObjectDrawWithTail(match, matrix, name, tail) {
  const replaced = replaceBlackXObjectDraw(match, matrix, name);
  const preserved = tail.replace(/\n?\/?[A-Za-z0-9_.-]+\s+Do\b/g, "");
  return `${replaced}${preserved}Q`;
}

function extractTrailer(source, size) {
  const trailerIndex = source.lastIndexOf("trailer");
  const trailerText = trailerIndex >= 0 ? source.slice(trailerIndex) : "";
  const root = (trailerText.match(/\/Root\s+(\d+\s+\d+\s+R)/) || [])[1];
  const info = (trailerText.match(/\/Info\s+(\d+\s+\d+\s+R)/) || [])[1];
  const id = (trailerText.match(/\/ID\s*(\[[\s\S]*?\])/) || [])[1];
  const encrypt = (trailerText.match(/\/Encrypt\s+(\d+\s+\d+\s+R)/) || [])[1];
  const parts = [`/Size ${size}`];
  if (root) parts.push(`/Root ${root}`);
  if (info) parts.push(`/Info ${info}`);
  if (id) parts.push(`/ID ${id}`);
  if (encrypt) parts.push(`/Encrypt ${encrypt}`);
  return `<< ${parts.join(" ")} >>`;
}

function buildPdfFromObjects(objects, trailer, size) {
  let pdf = "%PDF-1.7\n%\xDE\xAD\xBE\xEF\n";
  const offsets = new Map();
  const generations = new Map();

  for (const object of objects.sort((a, b) => a.number - b.number || a.generation - b.generation)) {
    offsets.set(object.number, pdf.length);
    generations.set(object.number, object.generation);
    pdf += `${object.number} ${object.generation} obj${object.body}endobj\n`;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${size}\n0000000000 65535 f \n`;
  for (let number = 1; number < size; number += 1) {
    const offset = offsets.get(number);
    if (offset === undefined) {
      pdf += "0000000000 65535 f \n";
    } else {
      pdf += `${String(offset).padStart(10, "0")} ${String(generations.get(number)).padStart(5, "0")} n \n`;
    }
  }

  pdf += `trailer\n${trailer}\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return binaryStringToUint8Array(pdf);
}

function buildIllustratorFile(entry) {
  const width = exportWidth(entry);
  const height = exportHeight(entry);
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
  ];
  const resources = [];
  let content = "";

  if (els.includeBaseInput.checked) {
    const jpegBytes = dataUrlToBytes(entry.baseCanvas.toDataURL("image/jpeg", 1));
    objects.push(
      makePdfStream(jpegBytes, {
        Type: "/XObject",
        Subtype: "/Image",
        Width: String(width),
        Height: String(height),
        ColorSpace: "/DeviceRGB",
        BitsPerComponent: "8",
        Filter: "/DCTDecode",
      }),
    );
    resources.push("/XObject << /Im0 4 0 R >>");
    content += `q\n${width} 0 0 ${height} 0 0 cm\n/Im0 Do\nQ\n`;
  }

  content += buildPdfVectorContent(entry, height);
  const contentStream = makePdfStream(asciiBytes(content));
  const title = pdfString(`${entry.fileName} ${entry.label}`);
  const contentObjectNumber = objects.length + 2;
  const infoObjectNumber = objects.length + 3;
  const resourceDictionary = resources.length ? ` /Resources << ${resources.join(" ")} >>` : "";

  objects.splice(
    2,
    0,
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}]${resourceDictionary} /Contents ${contentObjectNumber} 0 R >>`,
  );
  objects.push(
    contentStream,
    `<< /Title (${title}) /Creator (Morada Planos Color) /Producer (Morada Planos Color) >>`,
  );

  return buildPdf(objects, 1, infoObjectNumber);
}

function buildPdfVectorContent(entry, pageHeight) {
  const rgb = hexToRgb(TARGET_COLOR);
  const scale = entry.sourceScale || 1;
  const chunks = [`q\n${pdfNumber(rgb.r / 255)} ${pdfNumber(rgb.g / 255)} ${pdfNumber(rgb.b / 255)} rg\n`];

  for (const rect of entry.vectorRects) {
    const x = pdfNumber(rect.x / scale);
    const y = pdfNumber(pageHeight - (rect.y + rect.height) / scale);
    const width = pdfNumber(rect.width / scale);
    const height = pdfNumber(rect.height / scale);
    chunks.push(`${x} ${y} ${width} ${height} re\n`);
  }

  chunks.push("f\nQ\n");
  return chunks.join("");
}

function makePdfStream(bytes, dictionary = {}) {
  const dict = Object.entries(dictionary)
    .map(([key, value]) => `/${key} ${value}`)
    .join(" ");
  return `<< ${dict}${dict ? " " : ""}/Length ${bytes.length} >>\nstream\n${bytesToBinary(bytes)}\nendstream`;
}

function buildPdf(objects, rootObject, infoObject) {
  let pdf = "%PDF-1.4\n% Adobe Illustrator compatible\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets[index + 1] = pdf.length;
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index <= objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf +=
    `trailer\n<< /Size ${objects.length + 1} /Root ${rootObject} 0 R /Info ${infoObject} 0 R >>\n` +
    `startxref\n${xrefOffset}\n%%EOF`;
  return binaryStringToUint8Array(pdf);
}

function updateSummary() {
  const fileNames = new Set(state.entries.map((entry) => entry.fileName));
  els.fileCount.textContent = fileNames.size;
  els.pageCount.textContent = state.entries.length;
  els.convertedCount.textContent = state.entries
    .reduce((sum, entry) => sum + entry.blackPixels, 0)
    .toLocaleString("es-PE");
  const hasEntries = state.entries.length > 0;
  els.clearButton.disabled = !hasEntries;
  els.exportAllButton.disabled = !hasEntries;
  els.exportSelectedButton.disabled = !hasEntries;
}

function clearAll() {
  state.entries = [];
  state.selectedId = null;
  els.previewArea.innerHTML = "";
  renderEmptyState("La vista previa aparecerá aquí");
  updateSummary();
  setStatus("Listo");
}

function renderEmptyState(title) {
  els.previewArea.innerHTML = `
    <div class="empty-state">
      <h2>${title}</h2>
      <p>Verás cada plano en columnas antes/después, con descarga SVG, AI, PDF o JPG individual.</p>
    </div>
  `;
}

function setStatus(text) {
  els.statusPill.textContent = text;
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = URL.createObjectURL(file);
  });
}

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

function escapeXml(value) {
  return value.replace(/[<>&'"]/g, (char) => {
    const map = { "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" };
    return map[char];
  });
}

function pdfString(value) {
  return value.replace(/[\\()]/g, "\\$&");
}

function pdfNumber(value) {
  return Number(value.toFixed(6)).toString();
}

function svgNumber(value) {
  return Number(value.toFixed(3)).toString();
}

function exportWidth(entry) {
  return svgNumber(entry.sourceCanvas.width / (entry.sourceScale || 1));
}

function exportHeight(entry) {
  return svgNumber(entry.sourceCanvas.height / (entry.sourceScale || 1));
}

function formatEntrySize(entry) {
  return `${exportWidth(entry)} x ${exportHeight(entry)}`;
}

function asciiBytes(value) {
  return new TextEncoder().encode(value);
}

function dataUrlToBytes(dataUrl) {
  const base64 = dataUrl.split(",")[1];
  const binary = atob(base64);
  return binaryStringToUint8Array(binary);
}

function binaryStringToUint8Array(value) {
  const bytes = new Uint8Array(value.length);
  for (let index = 0; index < value.length; index += 1) {
    bytes[index] = value.charCodeAt(index) & 0xff;
  }
  return bytes;
}

function bytesToBinary(bytes) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return binary;
}

function entryBaseName(entry) {
  return `${slugify(entry.fileName)}-${slugify(entry.label)}`;
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

renderEmptyState("La vista previa aparecerá aquí");
updateSummary();
