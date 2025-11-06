import React, { useState, useEffect, useRef } from 'react';
import { ARExperience } from '@/entities/all';
import { Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function ARView() {
    const [experience, setExperience] = useState(null);
    const [error, setError] = useState(null);
    const [debugMode, setDebugMode] = useState(true);
    const [arStatus, setArStatus] = useState({
        cameraReady: false,
        markerDetected: false,
        patternLoaded: false,
        modelLoaded: false,
        lastDetection: null
    });
    const sceneLoaded = useRef(false);
    const [componentStatus, setComponentStatus] = useState('loading');

    useEffect(() => {
        window.setupAREventListeners = () => {
            try {
                const scene = document.querySelector('a-scene');
                if (scene) {
                    scene.addEventListener('camera-init', () => {
                        setArStatus(prev => ({ ...prev, cameraReady: true }));
                    });
                    
                    scene.addEventListener('arjs-camera-failed', () => {
                        setError('Camera access failed. Please grant permissions.');
                        setComponentStatus('error');
                    });
                }

                const marker = document.querySelector('a-marker');
                if (marker) {
                    fetch(marker.getAttribute('url'))
                        .then(res => {
                            if (res.ok) setArStatus(prev => ({...prev, patternLoaded: true}));
                        })
                        .catch(() => {
                            console.log('Pattern fetch failed');
                        });

                    marker.addEventListener('markerFound', () => {
                        setArStatus(prev => ({ 
                            ...prev, 
                            markerDetected: true, 
                            lastDetection: new Date().toLocaleTimeString() 
                        }));
                    });

                    marker.addEventListener('markerLost', () => {
                        setArStatus(prev => ({ ...prev, markerDetected: false }));
                    });
                }

                const model = document.querySelector('[gltf-model]');
                if (model) {
                    model.addEventListener('model-loaded', () => {
                        setArStatus(prev => ({ ...prev, modelLoaded: true }));
                    });
                }
            } catch (err) {
                console.error('Error setting up AR listeners:', err);
            }
        };

        return () => {
            delete window.setupAREventListeners;
        };
    }, []);

    useEffect(() => {
        const loadExperience = async () => {
            try {
                const params = new URLSearchParams(window.location.search);
                const id = params.get('id');
                if (!id) {
                    setError('No experience ID provided.');
                    setComponentStatus('error');
                    return;
                }
                const data = await ARExperience.get(id);
                if (!data || !data.marker_pattern_url || !data.model_3d_url) {
                    setError('AR Experience not found or missing files.');
                    setComponentStatus('error');
                    return;
                }
                setExperience(data);
            } catch (err) {
                setError('Failed to load AR experience.');
                setComponentStatus('error');
            }
        };
        loadExperience();
    }, []);

    useEffect(() => {
        if (!experience || sceneLoaded.current) return;

        const loadScript = (src) => {
            return new Promise((resolve, reject) => {
                if (document.querySelector(`script[src="${src}"]`)) {
                    resolve();
                    return;
                }
                const script = document.createElement('script');
                script.src = src;
                script.onload = resolve;
                script.onerror = () => reject('Failed to load script: ' + src);
                document.head.appendChild(script);
            });
        };

        const initScene = async () => {
            try {
                await loadScript('https://aframe.io/releases/1.3.0/aframe.min.js');
                await loadScript('https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar.js');
                sceneLoaded.current = true;
                setComponentStatus('ready');
            } catch (scriptError) {
                setError('Failed to load AR libraries.');
                setComponentStatus('error');
            }
        };

        initScene();
    }, [experience]);

    const getStatusIcon = (status) => {
        return status ? 
            <CheckCircle2 className="w-4 h-4 text-green-500" /> : 
            <AlertCircle className="w-4 h-4 text-orange-400" />;
    };

    if (componentStatus === 'loading') {
        return (
            <div style={{ 
                position: 'fixed', 
                top: 0, 
                left: 0, 
                width: '100vw', 
                height: '100vh', 
                background: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <Loader2 className="w-8 h-8 animate-spin mb-4 text-white mx-auto" />
                    <p className="text-white">Loading AR Experience...</p>
                </div>
            </div>
        );
    }

    if (componentStatus === 'error') {
        return (
            <div style={{ 
                position: 'fixed', 
                top: 0, 
                left: 0, 
                width: '100vw', 
                height: '100vh', 
                background: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px'
            }}>
                <Card className="bg-red-900 border-red-700 text-white">
                    <CardContent className="p-6 text-center">
                        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <h2 className="text-xl font-bold mb-2">Error Initializing AR</h2>
                        <p>{error}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            width: '100vw', 
            height: '100vh', 
            background: '#000000'
        }}>
            {/* Debug Panel */}
            {debugMode && (
                <div style={{
                    position: 'absolute',
                    top: '16px',
                    left: '16px',
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    color: 'white',
                    padding: '16px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    maxWidth: '280px',
                    border: '1px solid #374151',
                    zIndex: 100
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <h3 style={{ fontWeight: 'bold', margin: 0 }}>AR Debug Panel</h3>
                        <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setDebugMode(false)}
                            style={{ color: 'white' }}
                        >
                            <EyeOff className="w-4 h-4" />
                        </Button>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {getStatusIcon(arStatus.cameraReady)}
                            <span>Camera Ready</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {getStatusIcon(arStatus.patternLoaded)}
                            <span>Pattern Loaded</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {getStatusIcon(arStatus.modelLoaded)}
                            <span>3D Model Loaded</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {getStatusIcon(arStatus.markerDetected)}
                            <span>Marker Detected</span>
                        </div>
                        {arStatus.lastDetection && (
                            <div style={{ fontSize: '10px', color: '#10b981' }}>
                                Last seen: {arStatus.lastDetection}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Toggle Debug Button */}
            {!debugMode && (
                <div style={{
                    position: 'absolute',
                    top: '16px',
                    left: '16px',
                    zIndex: 100
                }}>
                    <Button 
                        variant="secondary"
                        size="sm"
                        onClick={() => setDebugMode(true)}
                    >
                        <Eye className="w-4 h-4 mr-2" />
                        Show Debug
                    </Button>
                </div>
            )}
            
            {/* Status Message */}
            <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                right: '20px',
                zIndex: 100
            }}>
                <div style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    color: 'white',
                    padding: '12px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    fontSize: '14px'
                }}>
                    {arStatus.markerDetected ? 
                        '🎉 Marker detected! Looking good.' : 
                        arStatus.cameraReady ? 
                            '📱 Point your camera at the printed marker image to see the 3D model.' :
                            '⏳ Initializing camera...'
                    }
                </div>
            </div>

            {/* AR Scene */}
            {experience && (
                <a-scene
                    vr-mode-ui="enabled: false"
                    renderer="logarithmicDepthBuffer: true;"
                    embedded
                    arjs="sourceType: webcam; debugUIEnabled: false;"
                    event-set__loaded="_event: loaded; _target: window; _value: setupAREventListeners()"
                    style={{ width: '100%', height: '100%' }}
                >
                    <a-marker 
                        type="pattern" 
                        url={experience.marker_pattern_url}
                    >
                        <a-entity
                            gltf-model={`url(${experience.model_3d_url})`}
                            scale="0.1 0.1 0.1"
                            position="0 0 0"
                            rotation="-90 0 0"
                        ></a-entity>
                    </a-marker>
                    <a-entity camera></a-entity>
                </a-scene>
            )}
        </div>
    );
}