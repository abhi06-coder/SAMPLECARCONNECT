import React from 'react';
import { motion } from 'framer-motion';

const GeometricBackground = () => {
    return (
        <div className="fixed inset-0 w-full h-full bg-[#0f172a] -z-10 overflow-hidden pointer-events-none">
            {/* Grid Pattern */}
            <div
                className="absolute inset-0 opacity-[0.4]"
                style={{
                    backgroundImage: `linear-gradient(to right, #1e293b 1px, transparent 1px), 
                            linear-gradient(to bottom, #1e293b 1px, transparent 1px)`,
                    backgroundSize: '4rem 4rem',
                    maskImage: 'radial-gradient(ellipse 60% 50% at 50% 0%, #000 70%, transparent 100%)'
                }}
            />

            {/* Glowing Orbs */}
            <motion.div
                animate={{
                    x: [0, 100, 0],
                    y: [0, -50, 0],
                    scale: [1, 1.2, 1],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                }}
                className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px]"
            />
            <motion.div
                animate={{
                    x: [0, -100, 0],
                    y: [0, 50, 0],
                    scale: [1, 1.3, 1],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "linear",
                    delay: 2
                }}
                className="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] bg-secondary/10 rounded-full blur-[120px]"
            />

            {/* Floating Shapes */}
            <div className="absolute inset-0">
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{
                            opacity: 0.1,
                            x: Math.random() * 1000 - 500, // Random start X
                            y: Math.random() * 1000 - 500  // Random start Y
                        }}
                        animate={{
                            y: [0, -100 - Math.random() * 100], // Float up
                            opacity: [0.1, 0.3, 0.1],
                            rotate: 360
                        }}
                        transition={{
                            duration: 10 + Math.random() * 10,
                            repeat: Infinity,
                            ease: "linear",
                            delay: Math.random() * 5
                        }}
                        className="absolute left-1/2 top-1/2 border border-primary/20 rounded-xl"
                        style={{
                            width: 20 + Math.random() * 40,
                            height: 20 + Math.random() * 40,
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

export default GeometricBackground;
