import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Face Registration Page
 * 
 * Allows registration of new VIP faces using webcam.
 * Captures face image and sends to backend for embedding extraction.
 */

export const FaceRegistration: React.FC = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [cameraActive, setCameraActive] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [name, setName] = useState('');
  const [flightId, setFlightId] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Start camera
  const startCamera = async () => {
    try {
      setMessage({ type: 'info', text: 'Starting camera...' });
      
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
            setMessage({ type: 'info', text: 'Camera started. Position your face in the frame.' });
          } catch (playError) {
            console.error('Error playing video:', playError);
            setMessage({ type: 'error', text: 'Failed to start video playback.' });
          }
        };
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setMessage({ type: 'error', text: 'Failed to access camera. Please check permissions.' });
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setCameraActive(false);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  // Capture and register face
  const captureAndRegister = async () => {
    if (!name || !flightId) {
      setMessage({ type: 'error', text: 'Please enter name and flight ID' });
      return;
    }

    if (!videoRef.current || !canvasRef.current) return;

    setCapturing(true);
    setMessage({ type: 'info', text: 'Capturing face...' });

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
      const response = await fetch(`${apiUrl}/api/camera/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          flight_id: flightId,
          image_data: imageData
        })
      });

      const result = await response.json();

      if (result.status === 'success') {
        setMessage({ type: 'success', text: `VIP ${name} registered successfully!` });
        stopCamera();
        
        // Navigate to dashboard after 2 seconds
        setTimeout(() => navigate('/'), 2000);
      } else {
        setMessage({ type: 'error', text: result.message || 'Registration failed' });
      }
    } catch (error) {
      console.error('Registration error:', error);
      setMessage({ type: 'error', text: 'Failed to register face' });
    } finally {
      setCapturing(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="min-h-screen bg-control-bg p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="text-status-active hover:text-status-active/80 mb-4"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-control-text">VIP Face Registration</h1>
          <p className="text-control-text-dim mt-2">
            Register a new VIP using facial recognition
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.type === 'success' ? 'bg-status-active/10 border-status-active text-status-active' :
            message.type === 'error' ? 'bg-status-alert/10 border-status-alert text-status-alert' :
            'bg-status-progress/10 border-status-progress text-status-progress'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Camera Feed */}
          <div className="bg-control-panel border border-control-border rounded-lg p-6">
            <h2 className="text-xl font-bold text-control-text mb-4">Camera Feed</h2>
            
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
                <button
                  onClick={stopCamera}
                  className="flex-1 bg-status-alert text-white px-4 py-3 rounded-lg font-semibold hover:bg-status-alert/90 transition-colors"
                >
                  Stop Camera
                </button>
              )}
            </div>
          </div>

          {/* Registration Form */}
          <div className="bg-control-panel border border-control-border rounded-lg p-6">
            <h2 className="text-xl font-bold text-control-text mb-4">VIP Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-control-text mb-2">
                  VIP Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter VIP name"
                  className="w-full bg-control-bg border border-control-border rounded-lg px-4 py-3 text-control-text placeholder-control-text-dim focus:outline-none focus:border-status-active"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-control-text mb-2">
                  Flight ID
                </label>
                <input
                  type="text"
                  value={flightId}
                  onChange={(e) => setFlightId(e.target.value)}
                  placeholder="e.g., BA123"
                  className="w-full bg-control-bg border border-control-border rounded-lg px-4 py-3 text-control-text placeholder-control-text-dim focus:outline-none focus:border-status-active"
                />
              </div>

              <div className="pt-4">
                <button
                  onClick={captureAndRegister}
                  disabled={!cameraActive || capturing || !name || !flightId}
                  className="w-full bg-status-active text-control-bg px-4 py-3 rounded-lg font-semibold hover:bg-status-active/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {capturing ? 'Registering...' : 'Capture & Register'}
                </button>
              </div>

              <div className="pt-4 border-t border-control-border">
                <h3 className="text-sm font-semibold text-control-text mb-2">Instructions:</h3>
                <ul className="text-sm text-control-text-dim space-y-1">
                  <li>• Start the camera</li>
                  <li>• Position your face clearly in the frame</li>
                  <li>• Enter VIP name and flight ID</li>
                  <li>• Click "Capture & Register"</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
