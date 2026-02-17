# Aplikasi PiCo: Picture Compressor - Solusi Simpel Buat Kompres Foto!
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import os
import io
import base64
import logging

logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
CORS(app) # Menyalakan CORS dapat diakses dari frontend

# buat konstanta untuk validasi seluruh file gambar
FORMAT_DIDUKUNG = ['.jpg', '.jpeg', '.png']
UKURAN_MAKS = 10 * 1024 * 1024  # 10 MB

# fungsi untuk memvalidasi path, ukuran, dan ekstensi atau format dari file gambar
def validate_image(file_size, filename):
    """Melakukan validasi file yang dikirim dari Frontend atau user"""
    # cek ekstensi/format file gambar yang diinputkan
    _, ext = os.path.splitext(filename) # Pisahkan nama file dengan ekstensinya untuk di cek
    if ext.lower() not in FORMAT_DIDUKUNG: #ext.lower() untuk merubah string ke huruf kecil semua 
        raise ValueError(f"Format tidak didukung! Gunakan: {', '.join(FORMAT_DIDUKUNG)}") # cetak pesan error jika format tidak sesuai
    
    if file_size > UKURAN_MAKS:
        raise ValueError("Ukuran file melebihi 10 MB!")
    
    return True

# fungsi untuk resize gambar secara manual menggunakan algoritma Bilinear Interpolation
def resize_image_manual(img, scale_factor):
    """Resize gambar secara manual menggunakan algoritma Bilinear Interpolation"""
    original_width, original_height = img.size # simpan ukuran asli gambar ke dalam variabel
    # Hitung ukuran baru setelah di-resize kemudian disimpan ke variabel baru
    new_width = int(original_width * scale_factor)
    new_height = int(original_height * scale_factor)
    
    # Buat image baru dengan ukuran yang sudah di-resize
    new_img = Image.new(img.mode, (new_width, new_height))
    pixels = img.load() # load pixel dari gambar asli
    new_pixels = new_img.load() # load pixel dari gambar baru
    
    # Algoritma Bilinear Interpolation
    for y in range(new_height):
        for x in range(new_width):
            # Mapping koordinat baru ke koordinat lama
            src_x = x * (original_width - 1) / (new_width - 1) if new_width > 1 else 0
            src_y = y * (original_height - 1) / (new_height - 1) if new_height > 1 else 0
            
            # Ambil 4 pixel terdekat
            x1 = int(src_x)
            y1 = int(src_y)
            x2 = min(x1 + 1, original_width - 1)
            y2 = min(y1 + 1, original_height - 1)
            
            # Hitung bobot untuk interpolasi
            wx = src_x - x1
            wy = src_y - y1
            
            # Ambil nilai-nilai pixel dan lakukan interpolasi
            if img.mode == 'RGB':
                p11 = pixels[x1, y1]
                p12 = pixels[x1, y2]
                p21 = pixels[x2, y1]
                p22 = pixels[x2, y2]
                
                # Interpolasi untuk setiap channel (R, G, B)
                new_pixel = tuple([
                    int(
                        p11[i] * (1 - wx) * (1 - wy) +
                        p21[i] * wx * (1 - wy) +
                        p12[i] * (1 - wx) * wy +
                        p22[i] * wx * wy
                    )
                    for i in range(3)
                ])
            else:  # Opsi jika gambar dalam mode Grayscale
                p11 = pixels[x1, y1]
                p12 = pixels[x1, y2]
                p21 = pixels[x2, y1]
                p22 = pixels[x2, y2]
                
                new_pixel = int(
                    p11 * (1 - wx) * (1 - wy) +
                    p21 * wx * (1 - wy) +
                    p12 * (1 - wx) * wy +
                    p22 * wx * wy
                )
            
            new_pixels[x, y] = new_pixel
    
    return new_img # kembalikan gambar yang sudah di-resize

# fungsi untuk color quantization atau mengurangi jumlah warna secara manual
def quantize_colors(img, levels):
    """Kuantisasi warna (color quantization) untuk mengurangi jumlah warna pada gambar"""
    # inisialisasi pixel dan ukuran gambar yang asli ke dalam variabel
    pixels = img.load()
    width, height = img.size
    
    # Hitung step untuk kuantisasi warna
    step = 256 // levels # 256 karena range warna dari 0-255
    
    # Proses kuantisasi warna
    for y in range(height):
        for x in range(width):
            if img.mode == 'RGB':
                r, g, b = pixels[x, y]
                # Quantize setiap channel
                r = (r // step) * step
                g = (g // step) * step
                b = (b // step) * step
                pixels[x, y] = (r, g, b)
            else:  # Grayscale
                pixel_value = pixels[x, y]
                pixels[x, y] = (pixel_value // step) * step
    
    return img

@app.route('/api/compress', methods=['POST'])
# fungsi utama untuk melakukan proses kompresi gambar
def compress_image_api():
    """API endpoint untuk mengompresi gambar"""
    try:
        # ambil request data
        data = request.get_json()

        if not data or 'image' not in data or 'quality' not in data:
            return jsonify({'error': 'Data tidak lengkap!'}), 400
        
        # lakukan validasi tipe data image harus berupa string base64 dan quality harus berupa angka
        image_raw = data['image']
        if not isinstance(image_raw, str):
            return jsonify({'error': 'Tipe data gambar harus berupa string base64!'}), 400
        
        # decode gambar dari base64
        if ',' in image_raw:
            image_data = image_raw.split(',')[1] # jika format data:image/jpeg;base64, maka ambil bagian setelah koma
        else:
            image_data = image_raw

        image_bytes = base64.b64decode(image_data) # decode base64 ke bytes
        original_size = len(image_bytes) # hitung ukuran asli gambar dalam bytes

        # ambil kualitas foto dan nama file
        quality_percentage = int(data['quality'])
        filename = data.get('filename', '_compressed.jpg')

        # validasi file gambar
        validate_image(original_size, filename)
        
        if quality_percentage < 10 or quality_percentage > 100:
            return jsonify({'error': 'Kualitas harus antara 10-100!'}), 400
        
        # Load gambar dari bytes
        img = Image.open(io.BytesIO(image_bytes))
        
        # Convert ke RGB, jika file gambar dalam mode RGBA (terutama untuk PNG)
        if img.mode == 'RGBA':
            img = img.convert('RGB')
        
        # 1. Resize berdasarkan kualitas yang diinginkan, misal 50% quality -> 75% size dari asli atau 80% quality -> 90% size dari asli
        scale_factor = 0.5 + (quality_percentage / 100) * 0.5 # skala dari 0.5 (50%) sampai 1.0 (100%)
        compressed_img = resize_image_manual(img, scale_factor) # panggil fungsi untuk resize gambar
        
        # 2. Color Quantization: mengurangi jumlah warna berdasarkan kualitas yang diinginkan
        color_levels = int(4 + (quality_percentage / 100) * 28) # dari 4 levels (10% quality) sampai 32 levels (100% quality)
        print(f"Melakukan color quantization dengan {color_levels} levels")
        compressed_img = quantize_colors(compressed_img, color_levels) # panggil fungsi untuk kuantisasi warna
        
        # 3. Simpan dengan quality JPEG
        jpeg_quality = int(30 + (quality_percentage / 100) * 65)
        output_buffer = io.BytesIO()
        compressed_img.save(output_buffer, 'JPEG', quality=jpeg_quality, optimize=True)
        output_buffer.seek(0)

        compressed_size = len(output_buffer.getvalue())
        reduction = ((original_size - compressed_size) / original_size) * 100
        
        # konversi ke base64 untuk dikirim balik ke frontend
        compressed_base64 = base64.b64encode(output_buffer.getvalue()).decode('utf-8')
    
        return jsonify({
            'success': True,
            'compressed_image': f"data:image/jpeg;base64,{compressed_base64}",
            'original_size': original_size,
            'compressed_size': compressed_size,
            'reduction_percentage': round(reduction, 2),
            'filename': filename
        })
    
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': f"Terjadi kesalahan saat kompresi: {str(e)}"}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Endpoint untuk cek kesehatan API"""
    return jsonify({'status': 'OK', 'message': 'API PiCo sedang berjalan normal'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)