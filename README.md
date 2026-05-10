# 🛡️ Hail Mary – Smart Financial Security Assistant

A full-stack MVP that **secures financial transaction data** using cryptography and steganography, detects suspicious activity, and analyzes scam messages using AI.

---

## ✨ Features

| Feature | Technology |
|---|---|
| AES-256 Transaction Encryption | Node.js `crypto` |
| LSB Image Steganography | Python (Pillow) |
| Passkey-Protected Decryption | SHA-256 Key Derivation |
| Secure Cloud Storage | Cloudinary |
| AI Scam/Phishing Analyzer | Google Gemini API |
| Database | MongoDB Atlas |
| Anomaly Detection | Rule-based engine |

---

## 🏗️ Architecture

```
hail-mary/
├── frontend/         # Vite + React + Tailwind CSS
└── backend/          # Node.js + Express + Python
    ├── controllers/  # Request handlers
    ├── models/       # Mongoose schemas
    ├── routes/       # API routes
    ├── services/     # Gemini AI, anomaly detection
    ├── utils/        # AES-256 crypto
    ├── python/       # LSB steganography engine (Pillow)
    └── assets/       # Base image & temp files
```

---

## 🚀 Deployment

### Frontend → [Vercel](https://vercel.com)
1. Connect the GitHub repo to Vercel.
2. Set **Root Directory** to `frontend`.
3. Add environment variable: `VITE_API_URL=https://your-backend.railway.app/api`
4. Deploy!

### Backend → [Railway](https://railway.app) *(Required: runs Python + Node.js)*
1. Create a new project on Railway from this GitHub repo.
2. Set **Root Directory** to `backend`.
3. Railway auto-installs Python (from `requirements.txt`) and Node.js.
4. Add all environment variables from `backend/.env.example`.
5. Deploy!

> ⚠️ **Important:** The backend **cannot** be deployed to Vercel because it spawns Python child processes for steganography. Use Railway or Render instead.

---

## ⚙️ Local Development

### Prerequisites
- Node.js v18+
- Python 3.x with `pip`
- MongoDB Atlas account
- Cloudinary account
- Google Gemini API Key

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/moizalisiddiqui/Hail-Mary.git
cd Hail-Mary

# 2. Install backend dependencies
cd backend
npm install
pip install -r requirements.txt

# 3. Configure backend environment
cp .env.example .env
# Edit .env with your real credentials

# 4. Generate the base steganography image
cd ..
python generate_base.py

# 5. Start the backend
cd backend
npm start

# 6. Install & start frontend (in a new terminal)
cd frontend
npm install
npm run dev
```

---

## 🔐 Security Flow

```
User Input → AES-256 Encrypt (custom passkey) → LSB Steganography → Cloudinary → MongoDB (URL only)
```

- The **passkey is never stored** — it is only shown once at encode time.
- Without the passkey, the steganographic image **cannot be decrypted**.
- The database only stores the image URL and basic metadata (amount, type).

---

## 📦 Environment Variables

See `backend/.env.example` and `frontend/.env.example` for all required variables.
