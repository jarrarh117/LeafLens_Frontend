# LeafLens AI - Plant Disease Detection

AI-powered plant disease detection system using EfficientNetV2S + CBAM model with 99.98% accuracy.

## 🌟 Features

- **99.98% Accuracy**: Trained on 87,000+ PlantVillage images
- **38 Disease Classes**: Covers 14 plant species
- **Smart Validation**: Uses Gemini AI to verify images contain plant leaves before analysis
- **Real-time Detection**: Results in under 2 seconds
- **Test-Time Augmentation**: Enhanced accuracy through multiple image views
- **API Access**: RESTful API with authentication

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- Firebase account
- Google Gemini API key (optional but recommended)

### Frontend Setup

```bash
# Install dependencies
npm install

# Create .env.local file
cp .env.local.example .env.local

# Edit .env.local with your credentials:
# - Firebase configuration
# - Backend URL
# - Gemini API key (for plant validation)

# Run development server
npm run dev
```

Visit `http://localhost:3000`

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run server
python app.py
```

Backend runs at `http://localhost:8000`

## 🔑 Environment Variables

### Frontend (.env.local)

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Backend API URL
BACKEND_URL=http://localhost:8000

# Gemini API Key (for plant image validation)
# Get your key from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here
```

### Backend

```env
MODEL_PATH=./Model/best_phase2.keras
PORT=8000
HOST=0.0.0.0
```

## 🧠 Smart Image Validation

LeafLens uses Google's Gemini AI to validate that uploaded images actually contain plant leaves before running disease detection. This prevents false classifications on non-plant images.

**How it works:**
1. User uploads an image
2. Gemini AI analyzes if the image contains plant leaves
3. If yes → proceeds to disease detection model
4. If no → returns helpful error message

**To enable:**
1. Get a free Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add to `.env.local`: `GEMINI_API_KEY=your_key_here`

**Note:** If Gemini API key is not configured, the system will skip validation and proceed directly to disease detection.

## 📊 Model Information

- **Architecture**: EfficientNetV2S + CBAM Attention
- **Accuracy**: 99.98% on validation set
- **Classes**: 38 plant disease categories
- **Input Size**: 300×300 RGB images
- **Training Dataset**: 87,000+ images from PlantVillage
- **Preprocessing**: Normalized to [-1, 1] range
- **TTA**: 3-step augmentation for enhanced accuracy

## 🔗 API Documentation

See `/api-docs` page in the application for complete API documentation.

### Quick Example

```bash
curl -X POST http://localhost:3000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"image": "data:image/jpeg;base64,..."}'
```

## 🚀 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions for:
- Vercel (Frontend)
- Render (Backend)
- Firebase (Database & Auth)

## 📝 License

MIT License

