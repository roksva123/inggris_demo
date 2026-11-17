# Ruang Tumbuh — Demo Bimbel

Demo website premium untuk bimbel dengan backend Go dan frontend Vite.

## Struktur

```text
.
├── Dockerfile
├── .dockerignore
├── backend
│   ├── data.go
│   ├── go.mod
│   ├── go.sum
│   ├── handlers.go
│   └── main.go
└── frontend
    ├── index.html
    ├── package.json
    ├── package-lock.json
    ├── vite.config.js
    └── src
        ├── api.js
        ├── main.js
        ├── scene.js
        └── styles.css
```

## Run locally

Build frontend terlebih dahulu:

```powershell
cd frontend
npm install
npm run build
```

Jalankan backend:

```powershell
cd ../backend
go run .
```

Buka `http://localhost:8080`. Backend akan mencari `frontend/dist` dari parent directory dan melayani frontend sekaligus API.

Jika port 8080 sedang digunakan, jalankan dengan port lain:

```powershell
$env:PORT="8081"
go run .
```

Untuk development frontend dengan Vite, jalankan `npm run dev` dari folder `frontend`; proxy `/api` mengarah ke backend di port 8080.

## API

- `GET /api/programs`
- `GET /api/testimonials`
- `GET /api/tutors`
- `GET /api/stats`
- `POST /api/trial` dengan body `{ "name": "...", "phone": "...", "grade": "...", "program": "..." }`
- `GET /healthz` untuk health check

## Deploy frontend + backend ke Vercel

Backend Go sudah disiapkan sebagai satu Vercel Serverless Function di `api/index.go`. Frontend dan API dapat dideploy dari repository yang sama tanpa Render.

1. Push repository ke GitHub.
2. Di Vercel pilih **Add New → Project**, lalu import repository ini.
3. **Root Directory:** pilih root repository (`.`), jangan `frontend`.
4. **Framework Preset:** Vite.
5. **Build Command:** `cd frontend && npm run build`.
6. **Output Directory:** `frontend/dist`.
7. **Install Command:** `cd frontend && npm install`.
8. Tidak perlu mengisi `VITE_API_URL`; frontend akan memakai API relatif `/api`.
9. Klik **Deploy**.

Endpoint yang tersedia:

- `GET /api/programs`
- `GET /api/testimonials`
- `GET /api/tutors`
- `GET /api/stats`
- `POST /api/trial`
- `GET /healthz`

`POST /api/trial` saat ini hanya mencatat data ke log Vercel dan tidak menyimpan data secara permanen. Untuk penyimpanan formulir, tambahkan database atau layanan email.
