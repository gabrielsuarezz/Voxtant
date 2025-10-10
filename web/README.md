# Voxtant Web

Next.js frontend for the Voxtant AI mock interview platform.

## Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

Visit http://localhost:3000

## Environment Variables

Copy `.env.example` to `.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

For production deployment, set this to your deployed API URL.

## Build

```bash
npm run build
npm start
```

## Deploy to Vercel

1. Connect your GitHub repo to Vercel
2. Set root directory to `web`
3. Add environment variable:
   - `NEXT_PUBLIC_API_BASE_URL`: Your deployed API URL (e.g., https://voxtant-api.onrender.com)
4. Deploy

## Project Structure

```
web/
├── app/              Next.js App Router pages
│   ├── page.tsx           Home page (job import)
│   ├── preview/           Preview extracted job data
│   └── eq-sandbox/        EQ metrics testing sandbox
├── components/       React components
│   ├── ui/          shadcn/ui components
│   ├── job/         Job ingestion forms
│   └── eq/          EQ overlay components
├── hooks/           Custom React hooks
│   ├── useWebcam.ts      Webcam access management
│   └── useEQ.ts          EQ metrics analysis
├── lib/             Utilities and API client
│   ├── cv/          Computer vision utilities
│   └── eq/          EQ analysis (MediaPipe)
└── public/          Static assets
```

## EQ Sandbox

The EQ Sandbox provides real-time emotional intelligence metrics analysis using on-device computer vision.

### Running the EQ Sandbox

```bash
# Start the development server
npm run dev

# Open the EQ sandbox page
# Navigate to http://localhost:3000/eq-sandbox

# Click "Allow" when prompted for camera access
# Click "Start" to begin analysis
```

### Privacy & Security

- **All metrics are computed in-browser** - No video or images leave your device
- Uses MediaPipe FaceLandmarker (Web) for facial analysis
- OpenCV.js loaded from CDN for optional advanced filtering
- Camera stream is never recorded or transmitted

### EQ Metrics Explained

1. **Gaze Stability (0-100%)**
   - Measures eye position steadiness
   - Higher values indicate focused attention and confidence
   - Low values may suggest nervousness or distraction

2. **Blink Rate (blinks/min)**
   - Tracks blinking frequency
   - Normal range: 15-20 blinks/min
   - Higher rates may indicate stress or fatigue
   - Lower rates suggest intense concentration

3. **Expression Variance (0-100%)**
   - Measures facial expression diversity
   - Higher variance shows emotional expressiveness
   - Improves communication and engagement

### Performance Tips

- Target frame rate: ~15 FPS for analysis
- Processing pauses automatically when tab is not visible
- All resources cleaned up on component unmount
- For best results, ensure good lighting and face the camera directly

### Technical Details

- **MediaPipe Models**: Loaded from Google's CDN (face_landmarker.task)
- **OpenCV.js**: Optional enhancement for time-series filtering
- **Smoothing**: Simple moving average over 10-frame rolling buffer
- **Face Detection**: Supports 1 face in VIDEO mode
