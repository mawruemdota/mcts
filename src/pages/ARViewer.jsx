import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Camera, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export default function ARViewerPage() {
  const [arContent, setArContent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [arStatus, setArStatus] = useState('initializing'); // initializing, ready, tracking, error
  const [cameraPermission, setCameraPermission] = useState(null);
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const modelRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const stickerId = urlParams.get('id');

    if (!stickerId) {
      setError('No AR sticker ID provided in URL.');
      setIsLoading(false);
      return;
    }

    loadARContent(stickerId);

    return () => {
      cleanup();
    };
  }, []);

  const loadARContent = async (stickerId) => {
    try {
      const content = await base44.entities.ARStickerContent.get(stickerId);
      
      if (!content.is_active) {
        setError('This AR experience is currently inactive.');
        setIsLoading(false);
        return;
      }

      setArContent(content);
      
      // Increment view count
      await base44.entities.ARStickerContent.update(stickerId, {
        view_count: (content.view_count || 0) + 1
      });
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading AR content:', error);
      setError('Failed to load AR experience. Please check the link and try again.');
      setIsLoading(false);
    }
  };

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setCameraPermission('granted');
      initializeAR(stream);
    } catch (error) {
      console.error('Camera permission error:', error);
      setCameraPermission('denied');
      setError('Camera access is required for AR. Please enable camera permissions and try again.');
      setArStatus('error');
    }
  };

  const initializeAR = async (stream) => {
    try {
      setArStatus('initializing');

      // Setup video element
      if (!videoRef.current) {
        videoRef.current = document.createElement('video');
        videoRef.current.setAttribute('autoplay', '');
        videoRef.current.setAttribute('muted', '');
        videoRef.current.setAttribute('playsinline', '');
      }
      
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      // Setup Three.js scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // Camera
      const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      camera.position.set(0, 0, 5);
      cameraRef.current = camera;

      // Renderer
      const renderer = new THREE.WebGLRenderer({ 
        alpha: true,
        antialias: true,
        canvas: canvasRef.current
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      rendererRef.current = renderer;

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
      directionalLight.position.set(5, 5, 5);
      scene.add(directionalLight);

      // Load 3D Model
      await load3DModel();

      setArStatus('ready');
      animate();

    } catch (error) {
      console.error('AR initialization error:', error);
      setError('Failed to initialize AR. Please try again.');
      setArStatus('error');
    }
  };

  const load3DModel = async () => {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      
      loader.load(
        arContent.ar_model_url,
        (gltf) => {
          const model = gltf.scene;
          
          // Apply transformations
          model.scale.set(
            arContent.model_scale || 1,
            arContent.model_scale || 1,
            arContent.model_scale || 1
          );
          
          model.position.set(
            arContent.model_position_x || 0,
            arContent.model_position_y || 0,
            arContent.model_position_z || 0
          );
          
          model.rotation.set(
            THREE.MathUtils.degToRad(arContent.model_rotation_x || 0),
            THREE.MathUtils.degToRad(arContent.model_rotation_y || 0),
            THREE.MathUtils.degToRad(arContent.model_rotation_z || 0)
          );

          sceneRef.current.add(model);
          modelRef.current = model;

          // Handle animations
          if (gltf.animations && gltf.animations.length > 0) {
            const mixer = new THREE.AnimationMixer(model);
            
            if (arContent.animation_name) {
              const clip = THREE.AnimationClip.findByName(gltf.animations, arContent.animation_name);
              if (clip) {
                const action = mixer.clipAction(clip);
                action.loop = arContent.loop_animation ? THREE.LoopRepeat : THREE.LoopOnce;
                action.play();
              }
            } else {
              // Play first animation by default
              const action = mixer.clipAction(gltf.animations[0]);
              action.loop = arContent.loop_animation ? THREE.LoopRepeat : THREE.LoopOnce;
              action.play();
            }
            
            modelRef.current.mixer = mixer;
          }

          resolve();
        },
        (progress) => {
          console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
        },
        (error) => {
          console.error('Model loading error:', error);
          reject(error);
        }
      );
    });
  };

  const animate = () => {
    animationFrameRef.current = requestAnimationFrame(animate);

    const delta = 0.016; // ~60fps

    // Update model mixer for animations
    if (modelRef.current && modelRef.current.mixer) {
      modelRef.current.mixer.update(delta);
    }

    // Auto-rotate if enabled
    if (modelRef.current && arContent?.auto_rotate) {
      modelRef.current.rotation.y += 0.01;
    }

    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  };

  const cleanup = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }

    if (rendererRef.current) {
      rendererRef.current.dispose();
    }

    if (sceneRef.current) {
      sceneRef.current.clear();
    }
  };

  const handleResize = () => {
    if (cameraRef.current && rendererRef.current) {
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    }
  };

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-white mx-auto mb-4" />
          <p className="text-white">Loading AR experience...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 to-red-700 flex items-center justify-center p-4">
        <div className="max-w-md bg-white rounded-xl shadow-2xl p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (cameraPermission === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="max-w-md bg-white rounded-xl shadow-2xl p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{arContent?.name}</h1>
            {arContent?.description && (
              <p className="text-gray-600 mb-6">{arContent.description}</p>
            )}
            <div className="mb-6">
              <img 
                src={arContent?.marker_image_url} 
                alt="AR Marker" 
                className="w-full max-w-xs mx-auto rounded-lg border-4 border-blue-200 shadow-lg"
              />
              <p className="text-sm text-gray-500 mt-3">
                Point your camera at this marker to see the AR experience
              </p>
            </div>
            <Button 
              onClick={requestCameraPermission}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Camera className="w-5 h-5 mr-2" />
              Start AR Experience
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden" ref={containerRef}>
      {/* Video Background */}
      {videoRef.current && (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
        />
      )}

      {/* Three.js Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ mixBlendMode: 'screen' }}
      />

      {/* Status Overlay */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
        {arStatus === 'initializing' && (
          <Alert className="bg-yellow-500/90 border-yellow-600 text-white">
            <Loader2 className="w-4 h-4 animate-spin" />
            <AlertDescription className="ml-2">Initializing AR...</AlertDescription>
          </Alert>
        )}
        {arStatus === 'ready' && (
          <Alert className="bg-green-500/90 border-green-600 text-white">
            <CheckCircle2 className="w-4 h-4" />
            <AlertDescription className="ml-2">Point camera at the marker</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Close Button */}
      <button
        onClick={() => window.close()}
        className="absolute top-4 right-4 z-50 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all"
      >
        <X className="w-6 h-6 text-gray-900" />
      </button>

      {/* Instructions */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50 max-w-md px-4">
        <div className="bg-black/70 backdrop-blur-sm rounded-2xl p-6 text-white text-center">
          <h2 className="font-bold text-lg mb-2">{arContent?.name}</h2>
          <p className="text-sm text-white/80">
            Move your device slowly to find the marker. The 3D content will appear when the marker is detected.
          </p>
        </div>
      </div>
    </div>
  );
}