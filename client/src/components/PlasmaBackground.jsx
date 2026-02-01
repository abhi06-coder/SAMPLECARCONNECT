import React from 'react';
import { useLocation } from 'react-router-dom';
import LightRays from './ui/LightRays';

const PlasmaBackground = () => {
    const location = useLocation();

    // Define routes where Background should be visible
    // Only Landing (/), Login (/login), and SignUp (/signup)
    const allowedRoutes = ['/'];

    const showEffect = allowedRoutes.includes(location.pathname);

    if (!showEffect) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: -1,
                pointerEvents: 'none'
            }}
        >
            <LightRays
                raysOrigin="top-center"
                raysColor="#6366f1"
                raysSpeed={1.5}
                lightSpread={0.8}
                rayLength={1.2}
                followMouse={true}
                mouseInfluence={0.1}
                noiseAmount={0.1}
                distortion={0.05}
                className="custom-rays"
            />
        </div>
    );
};

export default PlasmaBackground;
