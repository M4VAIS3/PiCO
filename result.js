// ===== STATE =====
let originalImage = null;
let compressedImage = null;
let originalSize = 0;
let compressedSize = 0;
let outputName = "compressed.jpg";
let reductionPercentage = 0;

// ===== ELEMENTS =====
const originalImgEl = document.getElementById("originalImage");
const compressedImgEl = document.getElementById("compressedImage");
const badgeOriginal = document.getElementById("badgeOriginal");
const badgeCompressed = document.getElementById("badgeCompressed");
const infoOriginal = document.getElementById("infoOriginal");
const infoCompressed = document.getElementById("infoCompressed");
const infoSaving = document.getElementById("infoSaving");
const downloadBtn = document.getElementById("downloadBtn");

// ===== FORMAT SIZE =====
function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

// ===== DISPLAY =====
function displayImages() {
  originalImgEl.src = originalImage;
  compressedImgEl.src = compressedImage;

  const saving = reductionPercentage > 0
    ? Math.round(reductionPercentage)
    : Math.max(0, Math.round((1 - compressedSize / originalSize) * 100));

  badgeOriginal.textContent = formatSize(originalSize);
  badgeCompressed.textContent = formatSize(compressedSize);
  infoOriginal.textContent = formatSize(originalSize);
  infoCompressed.textContent = formatSize(compressedSize);
  infoSaving.textContent = saving + "%";
}

// ===== HELPER: Blob ke base64 =====
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error("FileReader error"));
    reader.readAsDataURL(blob);
  });
}

// ===== HELPER =====
function dbGet(db, key) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["images"], "readonly");
    const store = transaction.objectStore("images");
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(new Error("Gagal mengambil " + key));
  });
}

// ===== MAIN: Load sequential, bukan concurrent =====
async function loadAndDisplay() {
  let db;

  // Buka DB
  try {
    db = await new Promise((resolve, reject) => {
      const req = indexedDB.open("PiCODB", 1);
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = () => reject(new Error("Gagal membuka database"));
    });
  } catch (err) {
    console.error(err);
    alert("Error membuka database.");
    window.location.href = "index.html";
    return;
  }

  // Load original 
  try {
    const data = await dbGet(db, "originalImage");
    if (!data || !data.blob) throw new Error("Tidak ditemukan");
    originalSize = data.size;
    originalImage = await blobToBase64(data.blob);
  } catch (err) {
    console.error("Error original:", err);
    alert("Gambar original tidak ditemukan. Silakan upload ulang.");
    window.location.href = "index.html";
    return;
  }

  // Load compressed 
  try {
    const data = await dbGet(db, "compressedImage");
    if (!data || !data.blob) throw new Error("Tidak ditemukan");
    compressedSize = data.size;
    outputName = data.fileName || "compressed.jpg";
    if (data.originalSize) originalSize = data.originalSize;
    if (data.reductionPercentage) reductionPercentage = data.reductionPercentage;
    compressedImage = await blobToBase64(data.blob);
  } catch (err) {
    console.error("Error compressed:", err);
    alert("Hasil kompresi tidak ditemukan. Silakan compress ulang.");
    window.location.href = "compress.html";
    return;
  }

  // Tampilkan setelah keduanya siap
  displayImages();
}

loadAndDisplay();

// ===== DOWNLOAD =====
downloadBtn.addEventListener("click", () => {
  if (!compressedImage) {
    alert("Gambar terkompresi belum siap.");
    return;
  }
  const a = document.createElement("a");
  a.href = compressedImage;
  a.download = outputName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});