# 🎨 PiCO — Picture Compressor

> Solusi Simpel Buat Kompres Foto

PiCO adalah aplikasi web untuk mengompresi gambar menggunakan algoritma kompresi yang dibuat secara manual berbasis **Bilinear Interpolation** dan **Color Quantization**, diintegrasikan dengan backend Python (Flask) dan frontend berbasis HTML/CSS/JavaScript.

---

## ✨ Fitur

- 📤 Upload gambar melalui file explorer
- 🎚️ Slider pemilihan kualitas kompresi dari 10% hingga 100%
- ⚙️ Kompresi via backend Python menggunakan algoritma kompresi yang diciptakan secara manual
- 📊 Perbandingan ukuran sebelum & sesudah kompresi
- 💾 Download hasil kompresi langsung dari browser
- 🗄️ Penyimpanan sementara menggunakan IndexedDB

---

## 🛠️ Tech Stack

-> Frontend: HTML, CSS, Vanilla JavaScript
-> Backend: Python, Flask, Pillow (PIL)
-> Storage: IndexedDB
-> Integration: REST API, JSON, Base64

---

## 🔬 Algoritma Kompresi

PiCO menggunakan tiga tahap kompresi:

1. **Bilinear Interpolation** : Resize gambar berdasarkan persentase kualitas menggunakan _scale factor_ 0.5–1.0
2. **Color Quantization** : Mengurangi jumlah warna dari 4 _levels_ untuk kualitas 10% hingga 32 _levels_ untuk kualitas 100%
3. **JPEG Compression** : Simpan dengan JPEG quality mapping 30–95 berdasarkan persentase kualitas

---

## 📁 Struktur Project

pico/
├── app.py              # Backend Flask API
├── requirements.txt    # Python dependencies
├── index.html          # Halaman upload
├── compress.html       # Halaman setting kompresi
├── loading.html        # Halaman loading
├── result.html         # Halaman hasil kompresi
├── index.js            # Logic upload & IndexedDB
├── compress.js         # Logic kompresi & API call
├── loading.js          # Logic progress bar
├── result.js           # Logic display hasil
├── style.css           # Styling utama
├── loading.css         # Styling loading page
├── result.css          # Styling result page
└── assets/             # Gambar & aset statis

---

## 🚀 Cara Menjalankan (Local)

### Prasyarat
- Python 3.8+
- Browser modern (Chrome, Firefox, Edge)

### 1. Clone Repository
```bash
git clone https://github.com/username/pico.git
cd pico
```

### 2. Setup Backend
```bash
# Buat virtual environment
python -m venv venv

# Aktifkan virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Jalankan Backend
```bash
python PiCO.py
```
Backend berjalan di `http://localhost:5000`

Cek status: `http://localhost:5000/api/health`

### 4. Jalankan Frontend
```bash
python -m http.server 8000

# Atau bisa juga menggunakan opsi Live Server dengan cara klik kanan index.html → Open with Live Server
```
Buka browser: `http://localhost:8000`

---

## 🌐 API Reference

### `POST /api/compress`

Mengompresi gambar berdasarkan kualitas yang diberikan.

**Request Body:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQ...",
  "quality": 80,
  "filename": "foto_compressed.jpg"
}
```

**Response (Success):**
```json
{
  "success": true,
  "compressed_image": "data:image/jpeg;base64,/9j/4AAQ...",
  "original_size": 2048000,
  "compressed_size": 512000,
  "reduction_percentage": 75.0,
  "filename": "foto_compressed.jpg"
}
```

**Response (Error):**
```json
{
  "error": "Format tidak didukung! Gunakan: .jpg, .jpeg, .png"
}
```

### `GET /api/health`

Mengecek status backend.

**Response:**
```json
{
  "status": "OK",
  "message": "API PiCo sedang berjalan normal"
}
```

---

## ⚠️ Batasan

- Format yang didukung: JPG, JPEG, PNG
- Ukuran file maksimal: 10 MB
- Kualitas kompresi: 10%–100%

---

## 👥 Tim Pengembang

- Michio Avryant Gervaise
- Adhe Nurul Trimiyaby
- Salsabila Putri Ramadhani