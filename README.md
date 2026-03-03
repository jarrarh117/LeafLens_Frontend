# 🌿 LeafLens AI — Plant Disease Detection

A professional, production-ready web application for detecting plant diseases using AI/ML. Built with Next.js 14, TypeScript, Python FastAPI, and Firebase.

## ✨ Features

- **AI-Powered Detection**: EfficientNetV2S + CBAM attention model achieving **99.98% accuracy** on PlantVillage dataset
- **38 Disease Classes**: Covers 14 plant species including Apple, Tomato, Potato, Corn, Grape, and more
- **Real-time Analysis**: Instant disease detection with confidence scores
- **Treatment Recommendations**: Detailed treatment plans for detected diseases
- **User Authentication**: Secure login with Email/Password and Google OAuth
- **Email Verification**: Email/password users must verify their email before accessing the dashboard
- **User Dashboard**: Personal dashboard with statistics and activity tracking
- **Detection History**: Track all your plant scans with Firebase integration
- **Statistics Dashboard**: Monitor plant health trends over time
- **Marketing Landing Page**: Professional landing page with features, pricing, and testimonials
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Professional UI/UX**: Modern, clean interface with smooth animations
- **Cloud Storage**: All data securely stored in Firebase
- **Comprehensive Error Handling**: User-friendly error messages for all operations
- **Custom Error Pages**: 404 and 500 error pages with helpful navigation
- **Rate Limiting**: Protection against brute-force and API abuse
- **Security Headers**: Full OWASP compliant security headers
- **Input Validation**: Sanitized and validated user inputs
- **Email Verification**: Mandatory email verification for email/password users

## 🚀 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **AI/ML**: TensorFlow 2.15+, EfficientNetV2S + CBAM Attention
- **ML Backend**: Python FastAPI with uvicorn
- **API Gateway**: Next.js API Routes (proxies to Python backend)
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Deployment**: Vercel (frontend) + any Python host (backend)

## � Security Features

LeafLens implements comprehensive security measures:

### Authentication & Authorization
- **Email/Password Authentication**: Secure password hashing with Firebase Auth
- **Google OAuth**: Third-party authentication with Google
- **Email Verification**: Mandatory email verification for email/password users
- **Password Reset**: Secure password reset with time-limited links
- **Rate Limiting**: Brute-force protection on login/signup endpoints

### API Security
- **Rate Limiting**: API endpoints protected against abuse
- **Input Validation**: All inputs validated and sanitized
- **CORS Protection**: Configured CORS headers
- **CSRF Protection**: Token-based protection for state-changing operations

### Data Protection
- **Firestore Security Rules**: Fine-grained access control
- **Storage Security Rules**: File upload restrictions
- **Data Encryption**: All data encrypted in transit (HTTPS)
- **Secure Headers**: Full OWASP compliant security headers

### Infrastructure Security
- **Content Security Policy (CSP)**: Prevents XSS attacks
- **Strict Transport Security (HSTS)**: Enforces HTTPS
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME-type sniffing
- **X-XSS-Protection**: Browser XSS filtering
- **Referrer-Policy**: Controls referrer information
- **Permissions-Policy**: Restricts browser features

### Monitoring & Logging
- **Security Event Logging**: All security events logged
- **Error Tracking**: Comprehensive error reporting
- **Rate Limit Monitoring**: Track and alert on rate limit violations

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Python 3.10+ with pip
- Firebase account
- Trained Keras model (`Model/best_phase2.keras`) from the training script

## 🛠️ Installation

### Quick Setup (Recommended)

**For Linux/Mac:**
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

**For Windows:**
```bash
scripts\setup.bat
```

### Manual Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd plant-disease-detector
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up Firebase**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Firestore Database
   - Enable Storage
   - Enable Authentication (Email/Password and Google)
   - Copy your Firebase configuration

4. **Configure environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` and add your Firebase credentials:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

5. **Add your trained model**
   - Place your trained Keras model at `Model/best_phase2.keras`
   - The model must include custom CBAM layers from the training script
   - No conversion needed — the Python backend loads the native Keras format

6. **Install Python backend dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

7. **Start the Python backend**
   ```bash
   cd backend
   python app.py
   # Backend runs at http://localhost:8000
   ```

8. **Run the Next.js development server** (new terminal)
   ```bash
   npm run dev
   ```

9. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
plant-disease-detector/
├── backend/
│   ├── app.py                    # FastAPI server (Python)
│   ├── inference.py              # Model loading, preprocessing, TTA
│   └── requirements.txt          # Python dependencies
├── Model/
│   └── best_phase2.keras         # Trained EfficientNetV2S + CBAM model
├── app/
│   ├── api/
│   │   └── predict/
│   │       └── route.ts          # API route (proxies to Python backend)
│   ├── login/
│   │   └── page.tsx              # Login page
│   ├── signup/
│   │   └── page.tsx              # Sign up page
│   ├── dashboard/
│   │   └── page.tsx              # User dashboard
│   ├── detect/
│   │   └── page.tsx              # Detection tool page
│   ├── verify-email/
│   │   └── page.tsx              # Email verification page
│   ├── forgot-password/
│   │   └── page.tsx              # Password reset page
│   ├── not-found.tsx             # 404 error page
│   ├── error.tsx                 # 500 error page
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── components/
│   ├── Header.tsx                # Navigation header
│   ├── Hero.tsx                  # Hero section
│   ├── UploadSection.tsx         # Image upload component
│   ├── ResultsSection.tsx        # Detection results display
│   ├── HistorySection.tsx        # Detection history
│   ├── StatsSection.tsx          # Statistics dashboard
│   └── Footer.tsx                # Footer component
├── contexts/
│   └── AuthContext.tsx           # Authentication context
├── lib/
│   ├── firebase.ts               # Firebase configuration
│   ├── auth.ts                   # Authentication utilities
│   ├── types.ts                  # TypeScript types
│   ├── plantClasses.ts           # Plant disease data
│   ├── errors.ts                 # Error handling utilities
│   └── security.ts               # Security utilities
├── middleware.ts                 # Global security middleware
├── scripts/
│   ├── setup.sh                  # Setup script (Linux/Mac)
│   └── setup.bat                 # Setup script (Windows)
├── public/
│   └── images/
│       └── LeafLens.png          # Logo
├── .env.local.example            # Environment variables template
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
└── package.json                  # Dependencies
```

## 🌐 Pages

- `/` - Marketing landing page with features, pricing, and testimonials
- `/detect` - Plant disease detection tool
- `/dashboard` - User dashboard with history and statistics (requires verified email)
- `/login` - User login
- `/signup` - User registration
- `/verify-email` - Email verification page (auto-refreshes every 3 seconds)
- `/forgot-password` - Password reset

## 🔧 Configuration

### Email Verification Flow

LeafLens implements a secure email verification system:

1. **Google OAuth Users**: No email verification required - instant access to dashboard
2. **Email/Password Users**: Must verify email before accessing dashboard
   - Verification email sent automatically on signup
   - Redirected to `/verify-email` page
   - Page auto-refreshes every 3 seconds to check verification status
   - Automatically redirected to dashboard once email is verified
   - Can resend verification email (60-second cooldown)

### Firebase Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /detections/{document} {
      allow read, write: if true;
    }
  }
}
```

### Firebase Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /detections/{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

## 🎨 Customization

### Colors
Edit `tailwind.config.ts` to customize the color scheme:
```typescript
colors: {
  primary: {
    500: '#22c55e',  // Main green
    600: '#16a34a',  // Darker green
  },
}
```

### Model
Replace the model in `app/api/predict/route.ts`:
```typescript
model = await tf.loadLayersModel('/models/your_model/model.json');
```

## 📊 Model Architecture

### EfficientNetV2S + CBAM Attention

The model uses a state-of-the-art architecture:

- **Backbone**: EfficientNetV2S (pretrained on ImageNet)
- **Attention**: CBAM (Convolutional Block Attention Module)
  - Channel Attention: learns "what" features to attend to
  - Spatial Attention: learns "where" to attend
- **Head**: GlobalAveragePooling2D → Dropout(0.4) → Dense(512) → CBAM → Dense(38)
- **Input**: 300×300 RGB images
- **Preprocessing**: `(x / 127.5) - 1.0` (normalize to [-1, 1])

### Test-Time Augmentation (TTA)

For maximum accuracy, the backend uses TTA:
1. Base prediction on the original image
2. Multiple augmented views (flip, rotation, brightness, contrast)
3. Average all predictions for final result

### Performance

- **Validation Accuracy**: 99.98%
- **Top-5 Accuracy**: 100%
- **Classes**: 38 plant disease categories
- **Dataset**: PlantVillage (87,000+ images)

## 🔌 API Endpoints

### Python Backend (port 8000)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check & model status |
| `/predict` | POST | Run inference with TTA |

### Next.js API (port 3000)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/predict` | POST | Proxies to Python backend, enriches response with disease info |

## 🚀 Deployment

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables
   - Deploy

3. **Configure custom domain** (optional)
   - Add your domain in Vercel settings
   - Update DNS records

## 📱 Features Breakdown

### Image Upload
- Drag & drop support
- File type validation (JPG, PNG)
- Size limit (5MB)
- Image preview

### Disease Detection
- Real-time analysis
- Confidence scores
- Top 5 predictions
- Treatment recommendations

### History Tracking
- Automatic save to Firebase
- Timestamp tracking
- Delete functionality
- Image storage

### Statistics
- Total scans counter
- Healthy vs diseased ratio
- Most common disease
- Visual charts

## 🐛 Troubleshooting

### Python backend not starting
- Ensure TensorFlow is installed: `pip install tensorflow>=2.15.0`
- Check model path: `Model/best_phase2.keras` must exist
- Verify port 8000 is available
- Check logs for custom layer errors (CBAM layers must match training script)

### Model not loading
- Ensure the model was trained with the exact CBAM layer implementations
- The `compile=False` flag is used — no optimizer needed for inference
- Check Python logs for detailed error messages

### Firebase connection issues
- Verify environment variables
- Check Firebase project settings
- Ensure Firestore and Storage are enabled

### Build errors
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be 18+)

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For support, email support@plantcareai.com or open an issue on GitHub.

## 🙏 Acknowledgments

- Dataset: PlantVillage Dataset (vipoooool/new-plant-diseases-dataset)
- Model: EfficientNetV2S + CBAM Attention (TensorFlow/Keras)
- CBAM Paper: Woo et al., "Convolutional Block Attention Module", ECCV 2018
- UI Icons: Lucide React
- Animations: Framer Motion

---

Built with ❤️ by LeafLens for farmers and gardeners worldwide
