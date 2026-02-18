// ===== ELEMENT =====
const qualityRange = document.getElementById("qualityRange");
const qualityValue = document.getElementById("qualityValue");
const fileNameInput = document.querySelector(".file-input");
const cancelBtn = document.querySelector(".cancel-btn");
const compressBtn = document.querySelector(".compress-btn-main");

/// ==== KONFIGURASI ====
const API_URL = "https://pico-production.up.railway.app/api/compress";

// ===== LOAD IMAGE FROM INDEXEDDB =====
let originalImage = null;
let originalFileName = "";
let originalSize = 0;

// ===== HELPER: IndexedDB get pakai Promise =====
function dbGet(db, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(["images"], "readonly");
    const store = tx.objectStore("images");
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(new Error("Gagal mengambil " + key));
  });
}

// ===== HELPER: IndexedDB put pakai Promise =====
function dbPut(db, data) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(["images"], "readwrite");
    const store = tx.objectStore("images");
    store.put(data);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(new Error("Gagal menyimpan data"));
  });
}

// ===== HELPER: Buka IndexedDB =====
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("PiCODB", 1);
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => reject(new Error("Gagal membuka database"));
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("images")) {
        db.createObjectStore("images", { keyPath: "id" });
      }
    };
  });
}

// ===== LOAD IMAGE FROM INDEXEDDB =====
async function init() {
  let db;
  try {
    db = await openDB();
  } catch (err) {
    alert("Error membuka database.");
    window.location.href = "index.html";
    return;
  }

  try {
    const imageData = await dbGet(db, "originalImage");
    if (!imageData || !imageData.blob) {
      window.location.href = "index.html";
      return;
    }

    originalFileName = imageData.name;
    originalSize = imageData.size;

    // Convert blob ke base64
    const reader = new FileReader();
    reader.onload = (e) => {
      originalImage = e.target.result;
      initializeCompress();
    };
    reader.readAsDataURL(imageData.blob);
  } catch (err) {
    console.error("Error load original:", err);
    window.location.href = "index.html";
  }
}

init();

// ===== SLIDER =====
function updateSlider() {
  const value = qualityRange.value;
  const min = qualityRange.min;
  const max = qualityRange.max;
  const percent = ((value - min) / (max - min)) * 100;

  qualityValue.textContent = value + "%";
  qualityRange.style.background = `
    linear-gradient(
      to right,
      #FB668D 0%,
      #FB668D ${percent}%,
      #E5E7EB ${percent}%,
      #E5E7EB 100%
    )
  `;
}

updateSlider();
qualityRange.addEventListener("input", updateSlider);

// ===== INITIALIZE =====
function initializeCompress() {
  // ===== DEFAULT FILE NAME =====
  if (originalFileName) {
    const base = originalFileName.replace(/\.[^/.]+$/, "");
    fileNameInput.value = base + "_compressed.jpg";
  }
}

// ===== KOMPRES GAMBAR DENGAN PROGRAM PYTHON =====
compressBtn.addEventListener("click", async () => {
  if (!originalImage) {
    alert("Gambar belum dimuat. Silakan coba lagi.");
    return;
  }
  
  // non-aktifkan button saat proses kompresi
  compressBtn.disabled = true;
  const originalText = compressBtn.textContent;
  compressBtn.textContent = "Compressing...";
  compressBtn.style.opacity = "0.6";
  compressBtn.style.cursor = "wait";
  
  try {
    console.log("Mengirim request ke backend...");
    
    // Kirim request ke backend
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: originalImage, // base64 string
        quality: parseInt(qualityRange.value),
        filename: fileNameInput.value
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Kompresi gagal');
    }
    
    if (!result.success) {
      throw new Error('Backend mengembalikan status gagal');
    }

    console.log("Kompresi berhasil! Menyimpan hasil...");
    
    // konversi base64 hasil kompresi ke blob
    const compressedBase64 = result.compressed_image.split(',')[1];
    const byteCharacters = atob(compressedBase64);
    const byteArray = new Uint8Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteArray[i] = byteCharacters.charCodeAt(i);
    }
    const compressedBlob = new Blob([byteArray], { type: 'image/jpeg' });
    
    console.log("Blob size:", compressedBlob.size);
    console.log("Blob type:", compressedBlob.type);

    // Simpan data gambar terkompresi dengan struktur yang konsisten
    const db = await openDB();
    await dbPut(db, {
      id: "compressedImage",
      blob: compressedBlob,
      size: result.compressed_size,
      fileName: result.filename,
      quality: qualityRange.value,
      // Data tambahan untuk result page
      originalSize: result.original_size,
      reductionPercentage: result.reduction_percentage
    });
    
    console.log("Data tersimpan di IndexedDB, redirecting...");
    window.location.href = "loading.html";
    
  } catch (error) {
    console.error('Error:', error);
    
    // Cek jika error karena backend tidak running
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      alert('Backend tidak dapat diakses. Pastikan Flask server sudah berjalan di http://localhost:5000');
    } else {
      alert(`Terjadi kesalahan: ${error.message}`);
    }
    
    // Re-enable button jika error
    compressBtn.disabled = false;
    compressBtn.textContent = originalText;
    compressBtn.style.opacity = "1";
    compressBtn.style.cursor = "pointer";
  }
});

// ===== CANCEL =====
cancelBtn.addEventListener("click", () => {
  window.location.href = "index.html";
});