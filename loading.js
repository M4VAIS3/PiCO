const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");

let progress = 0;

progressFill.style.width = "0%";
progressText.textContent = "0%";

// Simulasikan proses kompresi dengan yang lebih smooth
const interval = setInterval(() => {
  if (progress < 30) {
    progress += 8; // Proses awal lebih cepat (untuk loding yang lebih menarik)
  } else if (progress < 60) {
    progress += 5; // Proses tengah sedang (beri kesan sedang melakukan proses kompresi)
  } else if (progress < 90) {
    progress += 3; // Proses lebih lambat
  } else if (progress < 95) {
    progress += 1; // Proses sangat lambat (menambah kesan menunggu)
  }

  if (progress > 95) {
    progress = 95; // Batasi progress maksimal 95% sampai proses benar-benar selesai
  }

  progressFill.style.width = progress + "%";
  progressText.textContent = progress + "%";

  // cek apakah gambar yg terkompresi sudah ada di indexedDB, jika sudah maka anggap proses kompresi selesai
  if (progress >= 95) {
    checkCompressionCComplete();
  }
}, 150);

// FUngsi untuk cek apakah kompresi sudah selesai dan tersimpan di indexedDB
function checkCompressionCComplete() {
  const dbRequest = indexedDB.open("PiCODB", 1);

  dbRequest.onsuccess = (event) => {
    const db = event.target.result;
    const transaction = db.transaction(["images"], "readonly");
    const store = transaction.objectStore("images");
    const getRequest = store.get("compressedImage");

    getRequest.onsuccess = () => {
      if (getRequest.result && getRequest.result.blob) {
        // kondisi saat kompresi sudah selesai dan gambar terkompresi sudah tersimpan di indexedDB
        clearInterval(interval); // Hentikan interval progres
        progress = 100 // Set progress ke 100%
        progressFill.style.width = "100%";
        progressText.textContent = "100%";

        // Buat efek visual menunggu sebentar sebelum menampilkan hasil
        setTimeout(() => {
          window.location.href = "result.html"; // Pindah ke halaman hasil setelah progres selesai
        }, 300); // Tambahkan delay 300ms untuk efek visual
      }
    };
  };
}

// Buat peringangatan jika sudah lebih dari 95% tapi gambar kompresi belum tersedia, untuk menghindari stuck di loading
setTimeout(() => {
  clearInterval(interval); // Hentikan interval progres

  // lakukan cek ulang apakah gambar kompresi sudah tersedia di indexedDB
  const dbRequest = indexedDB.open("PiCODB", 1);
  dbRequest.onsuccess = (event) => {
    const db = event.target.result;
    const transaction = db.transaction(["images"], "readonly");
    const store = transaction.objectStore("images");
    const getRequest = store.get("compressedImage");

    getRequest.onsuccess = () => {
      if (getRequest.result && getRequest.result.blob) {
        // Jika gambar kompresi tersedia, pindah ke halaman hasil
        window.location.href = "result.html";
      } else {
        // Jika gambar kompresi tidak tersedia, tampilkan peringatan
        alert("Kompresi memakan waktu lebih lama. Silakan coba lagi nanti.");
        window.location.href = "index.html"; // Kembali ke halaman awal
      }
    };

    getRequest.onerror = () => {
      alert("Terjadi kesalahan saat memeriksa hasil kompresi.");
      window.location.href = "compress.html"; // Kembali ke halaman awal
    };
  };
}, 10000); // Cek setelah 10 detik jika masih di atas 95% tapi belum selesai