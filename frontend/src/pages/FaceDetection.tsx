import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Face Detection Page
 * 
 * Real-time VIP face detection and recognition using webcam.
 * Continuously scans for registered VIP faces.
 */

export const FaceDetection: React.FC = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [cameraActive, setCameraActive] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState<any>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [message, setMessage] = useState<string>('');
  const detectionIntervalRef = useRef<number | null>(null);

  // Start camera
  const startCamera = async () => {
    try {
      setMessage('Starting camera...');
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Wait for video metadata to load
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current?.play();
            setStream(mediaStream);
            setCameraActive(true);
            setMessage('Camera started. Click "Start Detection" to begin scanning.');
          } catch (playError) {
            console.error('Error playing video:', playError);
            setMessage('Failed to start video playback.');
          }
        };
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setMessage('Failed to access camera. Please check permissions.');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setCameraActive(false);
      setDetecting(false);
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
    }
  };

  // Detect face
  const detectFace = async () => {
    if (!videoRef.current || !canvasRef.current || detecting) return;

    setDetecting(true);

    try {
      // Draw video frame to canvas
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);

      // Convert to base64
      const imageData = canvas.toDataURL('image/jpeg', 0.95);

      // Send to backend
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/camera/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_data: imageData })
      });

      const result = await response.json();

      if (result.status === 'match') {
        setDetectionResult(result);
        setMessage(`VIP Detected: ${result.vip.name} (${result.confidence}% confidence)`);
        
        // Stop continuous detection after match
        if (detectionIntervalRef.current) {
          clearInterval(detectionIntervalRef.current);
          detectionIntervalRef.current = null;
        }
      } else if (result.status === 'no_face') {
        setDetectionResult(null);
        setMessage('No face detected. Please position face in frame.');
      } else if (result.status === 'no_match') {
        setDetectionResult(null);
        setMessage(`Face detected but no match found (${result.confidence}% confidence)`);
      }
    } catch (error) {
      console.error('Detection error:', error);
      setMessage('Detection failed');
    } finally {
      setDetecting(false);
    }
  };

  // Start continuous detection
  const startDetection = () => {
    if (detectionIntervalRef.current) return;
    
    setMessage('Scanning for VIP faces...');
    
    // Detect every 2 seconds
    detectionIntervalRef.current = window.setInterval(() => {
      detectFace();
    }, 2000);
    
    // Initial detection
    detectFace();
  };

  // Stop continuous detection
  const stopDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    setDetectionResult(null);
    setMessage('Detection stopped');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="min-h-screen bg-control-bg p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="text-status-active hover:text-status-active/80 mb-4"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-control-text">VIP Face Detection</h1>
          <p className="text-control-text-dim mt-2">
            Real-time VIP recognition at terminal entrance
          </p>
        </div>

        {/* Status Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            detectionResult 
              ? 'bg-status-active/10 border-status-active text-status-active'
              : 'bg-status-progress/10 border-status-progress text-status-progress'
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Camera Feed */}
          <div className="lg:col-span-2 bg-control-panel border border-control-border rounded-lg p-6">
            <h2 className="text-xl font-bold text-control-text mb-4">Live Camera Feed</h2>
            
            <div className="relative bg-black rounded-lg overflow-hidden mb-4" style={{ aspectRatio: '4/3' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
              />
              {!cameraActive && (
                <div className="absolute inset-0 flex items-center justify-center text-control-text-dim">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📷</div>
                    <p>Camera not active</p>
                  </div>
                </div>
              )}
              {detecting && cameraActive && (
                <div className="absolute top-4 right-4 bg-status-progress text-white px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
                  Scanning...
                </div>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="flex gap-3">
              {!cameraActive ? (
                <button
                  onClick={startCamera}
                  className="flex-1 bg-status-active text-control-bg px-4 py-3 rounded-lg font-semibold hover:bg-status-active/90 transition-colors"
                >
                  Start Camera
                </button>
              ) : (
                <>
                  {!detectionIntervalRef.current ? (
                    <button
                      onClick={startDetection}
                      className="flex-1 bg-status-active text-control-bg px-4 py-3 rounded-lg font-semibold hover:bg-status-active/90 transition-colors"
                    >
                      Start Detection
                    </button>
                  ) : (
                    <button
                      onClick={stopDetection}
                      className="flex-1 bg-status-progress text-white px-4 py-3 rounded-lg font-semibold hover:bg-status-progress/90 transition-colors"
                    >
                      Stop Detection
                    </button>
                  )}
                  <button
                    onClick={stopCamera}
                    className="bg-status-alert text-white px-4 py-3 rounded-lg font-semibold hover:bg-status-alert/90 transition-colors"
                  >
                    Stop Camera
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Detection Result */}
          <div className="bg-control-panel border border-control-border rounded-lg p-6">
            <h2 className="text-xl font-bold text-control-text mb-4">Detection Result</h2>
            
            {detectionResult ? (
              <div className="space-y-4">
                <div className="text-center py-6">
                  <div className="text-6xl mb-4">✅</div>
                  <h3 className="text-2xl font-bold text-status-active mb-2">
                    VIP Recognized!
                  </h3>
                </div>

                <div className="space-y-3">
                  <div className="bg-control-bg rounded-lg p-4">
                    <p className="text-xs text-control-text-dim uppercase tracking-wide mb-1">Name</p>
                    <p className="text-lg font-bold text-control-text">{detectionResult.vip.name}</p>
                  </div>

                  <div className="bg-control-bg rounded-lg p-4">
                    <p className="text-xs text-control-text-dim uppercase tracking-wide mb-1">Flight</p>
                    <p className="text-lg font-mono text-control-text">{detectionResult.vip.flight_id}</p>
                  </div>

                  <div className="bg-control-bg rounded-lg p-4">
                    <p className="text-xs text-control-text-dim uppercase tracking-wide mb-1">Confidence</p>
                    <p className="text-lg font-bold text-status-active">{detectionResult.confidence}%</p>
                  </div>

                  <div className="bg-control-bg rounded-lg p-4">
                    <p className="text-xs text-control-text-dim uppercase tracking-wide mb-1">Status</p>
                    <p className="text-sm font-mono text-control-text capitalize">
                      {detectionResult.vip.current_state.replace('_', ' ')}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/vip/${detectionResult.vip.id}`)}
                  className="w-full bg-status-active text-control-bg px-4 py-3 rounded-lg font-semibold hover:bg-status-active/90 transition-colors mt-4"
                >
                  View VIP Details
                </button>
              </div>
            ) : (
              <div className="text-center py-12 text-control-text-dim">
                <div className="text-6xl mb-4">👤</div>
                <p>No VIP detected</p>
                <p className="text-sm mt-2">Start detection to scan for VIP faces</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
