"use client";

import { motion } from "framer-motion";

function HandWrittenTitle({
    title = "Hand Written",
    subtitle = "",
}) {
    const draw = {
        hidden: { pathLength: 0, opacity: 0 },
        visible: {
            pathLength: 1,
            opacity: 1,
            transition: {
                pathLength: { duration: 2.5, ease: [0.43, 0.13, 0.23, 0.96] },
                opacity: { duration: 0.5 },
            },
        },
    };

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto pt-10">
            <div className="relative inline-block px-10 pb-4 mt-2">
                <div className="absolute inset-0 z-0 flex items-center justify-center scale-[2.5]">
                    <motion.svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 1200 600"
                        initial="hidden"
                        animate="visible"
                        className="w-full h-full overflow-visible"
                    >
                        <defs>
                            <filter id="whiteGlow" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="6" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                        </defs>
                        <title>NotesUI</title>
                        <motion.path
                            d="M 950 90 
                               C 1250 300, 1050 480, 600 520
                               C 250 520, 150 480, 150 300
                               C 150 120, 350 80, 600 80
                               C 850 80, 950 180, 950 180"
                            fill="none"
                            strokeWidth="10"
                            stroke="#a855f7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            variants={draw}
                            style={{ filter: "url(#whiteGlow)" }}
                            className="animate-pulse"
                        />
                    </motion.svg>
                </div>
                
                <div className="relative text-center z-10 flex flex-col items-center justify-center">
                    <motion.h1
                        className="text-2xl md:text-3xl text-white tracking-tighter flex items-center gap-2 font-bold"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                    >
                        {title}
                    </motion.h1>
                </div>
            </div>
            
            {title && subtitle && (
                <motion.p
                    className="text-sm text-neutral-400 z-10 relative"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5, duration: 0.8 }}
                >
                    {subtitle}
                </motion.p>
            )}
        </div>
    );
}

export { HandWrittenTitle };
