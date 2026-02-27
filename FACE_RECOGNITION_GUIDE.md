# Face Recognition Guide

## Overview

The AURA-VIP system now includes real-time face recognition capabilities using your webcam. This allows you to:
1. **Register VIP faces** - Capture and store face embeddings
2. **Detect VIPs** - Real-time recognition at terminal entrance

## Prerequisites

Make sure you have installed the required dependencies:
```bash
pip install opencv-python Pillow deepface tensorflow
```

## How to Use

### 1. Register a VIP Face

1. Navigate to **Register VIP** in the top menu
2. Click **Start Camera** to activate your webcam
3. Position your face clearly in the camera frame
4. Enter the VIP's name (e.g., "John Smith")
5. Enter the flight ID (e.g., "BA123")
6. Click **Capture & Register**
7. The system will:
   - Extract face embedding using DeepFace (VGG-Face model)
   - Store the embedding in the database
   - Create a VIP profile in "prepared" state

### 2. Detect VIP at Terminal

1. Navigate to **Detect VIP** in the top menu
2. Click **Start Camera** to activate your webcam
3. Click **Start Detection** to begin scanning
4. The system will:
   - Scan for faces every 2 seconds
   - Compare detected faces against registered VIPs
   - Display match results with confidence score
   - Automatically trigger the VIP workflow if matched

### 3. Detection Results

When a VIP is recognized:
- **Match confidence** is displayed (must be ≥85% to trigger workflow)
- **VIP information** is shown (name, flight, status)
- **VIP_DETECTED event** is automatically published
- **Workflow starts** - escort and buggy are assigned

## Technical Details

### Backend API Endpoints

**Register Face:**
```
POST /api/camera/register
Body: {
  "name": "VIP Name",
  "flight_id": "BA123",
  "image_data": "base64_encoded_image"
}
```

**Detect Face:**
```
POST /api/camera/detect
Body: {
  "image_data": "base64_encoded_image"
}
```

### Face Recognition Pipeline

1. **Capture**: Webcam captures video frame
2. **Encode**: Frame converted to base64 JPEG
3. **Extract**: DeepFace extracts 2622-dimensional embedding (VGG-Face)
4. **Compare**: Cosine similarity calculated against all registered VIPs
5. **Match**: If similarity ≥ 0.85 (85%), VIP is recognized
6. **Trigger**: VIP_DETECTED event published to Event Bus

### Camera Permissions

The browser will request camera access. You must:
- **Allow** camera permissions when prompted
- Ensure your webcam is connected and working
- Check browser console for any camera errors

## Troubleshooting

### Camera Not Working
- Check browser permissions (Settings → Privacy → Camera)
- Ensure no other application is using the camera
- Try refreshing the page
- Check browser console for errors

### Face Not Detected
- Ensure good lighting
- Position face clearly in frame
- Remove glasses or face coverings if possible
- Move closer to camera

### Low Confidence Match
- Re-register the VIP with better lighting
- Ensure face is clearly visible during registration
- Try multiple registration attempts

### Detection Too Slow
- Detection runs every 2 seconds to balance accuracy and performance
- DeepFace processing takes 1-2 seconds per frame
- Consider reducing detection frequency if needed

## Integration with Demo Mode

The face recognition system integrates seamlessly with the existing demo mode:

1. **Register VIP** using camera
2. **Start Demo** from dashboard (optional - for automated workflow)
3. **Detect VIP** using camera - this triggers the real workflow
4. Watch as escorts, buggies, and lounge reservations are assigned automatically

## Security Considerations

- Face embeddings are stored securely in the database
- No raw images are stored, only mathematical embeddings
- Confidence threshold prevents false positives
- All camera access is browser-controlled

## Performance

- **Registration**: ~2-3 seconds per face
- **Detection**: ~2 seconds per scan
- **Model**: VGG-Face (pre-trained on 2.6M faces)
- **Accuracy**: 85%+ confidence threshold

## Next Steps

After successful VIP detection:
1. View VIP details on the dashboard
2. Monitor escort and buggy assignments
3. Track VIP progress through workflow states
4. View real-time updates in Event Log panel
