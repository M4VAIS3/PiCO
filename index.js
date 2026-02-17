// ELEMENT 
const dropArea = document.getElementById("dropArea");
const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const fileInfo = document.getElementById("fileInfo");

// KONSTANTA
const FORMAT_DIDUKUNG = ["image/jpeg", "image/png"];
const UKURAN_MAKS = 10 * 1024 * 1024; // 10MB

// BUTTON
uploadBtn.addEventListener("click", () => fileInput.click());

// DRAG & DROP
dropArea.addEventListener("dragover", e => {
e.preventDefault();
dropArea.classList.add("dragover");
});

dropArea.addEventListener("dragleave", () => {
dropArea.classList.remove("dragover");
});

dropArea.addEventListener("drop", e => {
e.preventDefault();
dropArea.classList.remove("dragover");
handleFile(e.dataTransfer.files[0]);
});

fileInput.addEventListener("change", () => {
handleFile(fileInput.files[0]);
});

// HANDLER
function handleFile(file) {
if (!file) return;

fileInfo.textContent = "";
fileInfo.style.color = "#364153";

if (!FORMAT_DIDUKUNG.includes(file.type)) {
    fileInfo.textContent = "Format tidak didukung. Gunakan JPG atau PNG.";
    fileInfo.style.color = "#E11D48";
    return;
}

if (file.size > UKURAN_MAKS) {
    fileInfo.textContent = "Ukuran file melebihi 10 MB.";
    fileInfo.style.color = "#E11D48";
    return;
}

  // Simpan file langsung tanpa Base64
const reader = new FileReader();
reader.onload = () => {
    // Simpan sebagai ArrayBuffer (lebih efisien dari Base64)
    const arrayBuffer = reader.result;
    
    // Buat blob dari ArrayBuffer
    const blob = new Blob([arrayBuffer], { type: file.type });
    
    // Simpan ke IndexedDB untuk handle file besar
    const dbRequest = indexedDB.open("PiCODB", 1);
    
    dbRequest.onerror = () => {
    fileInfo.textContent = "Error membuka database.";
    fileInfo.style.color = "#E11D48";
    };
    
    dbRequest.onsuccess = (event) => {
    const db = event.target.result;
    const transaction = db.transaction(["images"], "readwrite");
    const store = transaction.objectStore("images");
    
    store.put({
        id: "originalImage",
        blob: blob,
        name: file.name,
        size: file.size,
        type: file.type
    });
    
    transaction.oncomplete = () => {
        window.location.href = "compress.html";
    };
    
    transaction.onerror = () => {
        fileInfo.textContent = "Error menyimpan file.";
        fileInfo.style.color = "#E11D48";
    };
    };
    
    dbRequest.onupgradeneeded = (event) => {
    const db = event.target.result;
    if (!db.objectStoreNames.contains("images")) {
        db.createObjectStore("images", { keyPath: "id" });
    }
    };
};

reader.readAsArrayBuffer(file);
}
