import React, { useEffect, useRef, useState, useCallback, useMemo } from "react"; 
import Globe from "./globe";
import { cn } from "../../lib/utils";

// Reusable ScrollGlobe component following shadcn/ui patterns
const defaultGlobeConfig = {
  positions: [
    { top: "50%", left: "75%", scale: 1.4 },  // Hero: Right side, balanced
    { top: "35%", left: "50%", scale: 1.5 },  // Innovation: Top side, subtle (Scale bumped per request)
    { top: "15%", left: "90%", scale: 2 },  // Discovery: Left side, medium
    { top: "50%", left: "50%", scale: 1.8 },  // Future: Center, large backdrop
  ]
};

const parsePercent = (str) => parseFloat(str.replace('%', ''));

export default function ScrollGlobe({ sections, globeConfig = defaultGlobeConfig, className }) {
  const [activeSection, setActiveSection] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [globeTransform, setGlobeTransform] = useState("");
  const containerRef = useRef(null);
  const sectionRefs = useRef([]);
  const animationFrameId = useRef();
  
  // Pre-calculate positions for performance
  const calculatedPositions = useMemo(() => {
    return globeConfig.positions.map(pos => ({
      top: parsePercent(pos.top),
      left: parsePercent(pos.left),
      scale: pos.scale
    }));
  }, [globeConfig.positions]);

  // Simple, direct scroll tracking
  const updateScrollPosition = useCallback(() => {
    const scrollTop = window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = Math.min(Math.max(scrollTop / docHeight, 0), 1);
    
    setScrollProgress(progress);

    // Simple section detection
    const viewportCenter = window.innerHeight / 2;
    let newActiveSection = 0;
    let minDistance = Infinity;

    sectionRefs.current.forEach((ref, index) => {
      if (ref) {
        const rect = ref.getBoundingClientRect();
        const sectionCenter = rect.top + rect.height / 2;
        const distance = Math.abs(sectionCenter - viewportCenter);
        
        if (distance < minDistance) {
          minDistance = distance;
          newActiveSection = index;
        }
      }
    });

    // Direct position update - no interpolation
    const currentPos = calculatedPositions[newActiveSection] || calculatedPositions[calculatedPositions.length - 1];
    const transform = `translate3d(${currentPos.left}vw, ${currentPos.top}vh, 0) translate3d(-50%, -50%, 0) scale3d(${currentPos.scale}, ${currentPos.scale}, 1)`;
    
    setGlobeTransform(transform);

    setActiveSection(newActiveSection);
  }, [calculatedPositions, activeSection]);

  // Throttled scroll handler with RAF
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        animationFrameId.current = requestAnimationFrame(() => {
          updateScrollPosition();
          ticking = false;
        });
        ticking = true;
      }
    };

    // Use passive listeners and immediate execution
    window.addEventListener("scroll", handleScroll, { passive: true });
    updateScrollPosition(); // Initial call
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [updateScrollPosition]);

  // Initial globe position
  useEffect(() => {
    const initialPos = calculatedPositions[0];
    const initialTransform = `translate3d(${initialPos.left}vw, ${initialPos.top}vh, 0) translate3d(-50%, -50%, 0) scale3d(${initialPos.scale}, ${initialPos.scale}, 1)`;
    setGlobeTransform(initialTransform);
  }, [calculatedPositions]);

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative w-full max-w-screen overflow-x-hidden min-h-screen bg-transparent text-white",
        className
      )}
    >
      {/* Background ambient splashes to inject deep purple theme globally */}
      <div className="fixed top-[15%] left-[-10%] w-[50vw] h-[50vw] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-purple-900/15 blur-[180px] rounded-full pointer-events-none z-0" />
      <div className="fixed top-[45%] left-[30%] w-[40vw] h-[40vw] bg-fuchsia-600/5 blur-[120px] rounded-full pointer-events-none z-0" />

      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-0.5 bg-gradient-to-r from-border/20 via-border/40 to-border/20 z-50">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-purple-800 will-change-transform shadow-sm"
          style={{ 
            transform: `scaleX(${scrollProgress})`,
            transformOrigin: 'left center',
            transition: 'transform 0.15s ease-out',
            filter: 'drop-shadow(0 0 2px rgba(168, 85, 247, 0.4))'
          }}
        />
      </div>

      {/* Enhanced Navigation with auto-hiding labels - Fully Responsive */}
      <div className="hidden sm:flex fixed right-2 sm:right-4 lg:right-8 top-1/2 -translate-y-1/2 z-40">
        <div className="space-y-3 sm:space-y-4 lg:space-y-6">
          {sections.map((section, index) => (
            <div key={index} className="relative group">
              <button
                onClick={() => {
                  sectionRefs.current[index]?.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'center'
                  });
                }}
                className={cn(
                  "relative w-2 h-2 sm:w-2.5 sm:h-2.5 lg:w-3 lg:h-3 rounded-full border-2 transition-all duration-300 hover:scale-125",
                  "before:absolute before:inset-0 before:rounded-full before:transition-all before:duration-300",
                  activeSection === index 
                    ? "bg-purple-500 border-purple-500 shadow-lg before:animate-ping before:bg-purple-500/20" 
                    : "bg-transparent border-neutral-600 hover:border-purple-400/60 hover:bg-purple-400/10"
                )}
                aria-label={`Go to ${section.badge || `section ${index + 1}`}`}
              />
            </div>
          ))}
        </div>
        
        {/* Enhanced navigation line - Responsive */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 lg:w-px bg-gradient-to-b from-transparent via-purple-500/20 to-transparent -translate-x-1/2 -z-10" />
      </div>

      {/* Ultra-smooth Globe with responsive scaling */}
      <div
        className="fixed z-10 pointer-events-none will-change-transform transition-all duration-[1400ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
        style={{
          transform: globeTransform,
          opacity: scrollProgress > 0.90 ? 0 : 1,
          filter: `opacity(${activeSection === 3 ? 0.4 : 0.85})`, // Subtle opacity for backdrop effect
        }}
      >
        <div className="scale-75 sm:scale-90 lg:scale-100">
          <Globe />
        </div>
      </div>

      {/* Dynamic sections - fully responsive */}
      {sections.map((section, index) => (
        <section
          key={section.id}
          ref={(el) => (sectionRefs.current[index] = el)}
          className={cn(
            "relative min-h-screen flex flex-col justify-center px-4 sm:px-6 md:px-8 lg:px-12 z-20 py-24 sm:py-32 lg:py-40",
            "w-full max-w-full",
            section.align === 'center' && "items-center text-center",
            section.align === 'right' && "items-end text-right",
            section.align !== 'center' && section.align !== 'right' && "items-start text-left"
          )}
        >
          <div className={cn(
            "w-full max-w-sm sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl will-change-transform transition-all duration-700",
            "opacity-100 translate-y-0"
          )}>
            {!section.hideTitle && (
              <>
                <h1 className={cn(
                  "font-bold mb-4 sm:mb-6 leading-[1.1] tracking-tight",
                  index === 0 
                    ? "text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl" 
                    : "text-3xl sm:text-4xl md:text-5xl lg:text-6xl"
                )}>
                  {section.subtitle ? (
                    <div className="space-y-1 sm:space-y-2">
                      <div className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                        {section.title}
                      </div>
                      <div className="text-neutral-400 font-medium tracking-wider text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
                        {section.subtitle}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
                      {section.title}
                    </div>
                  )}
                </h1>
                
                <div className={cn(
                  "text-neutral-300 leading-relaxed mb-6 sm:mb-8 text-base sm:text-lg lg:text-xl font-light",
                  section.align === 'center' ? "max-w-full mx-auto text-center" : "max-w-full"
                )}>
                  <p className="mb-3 sm:mb-4">{section.description}</p>
                </div>
              </>
            )}

            {/* Custom Node injection point (for BotChat) */}
            {section.customNode && (
              <div className="w-full relative z-[100] mt-6 pointer-events-auto">
                {section.customNode}
              </div>
            )}

            {/* Enhanced Features - Responsive grid */}
            {!section.customNode && section.features && (
              <div className="grid gap-3 sm:gap-4 mb-4 mt-6">
                {section.features.map((feature, featureIndex) => (
                  <div 
                    key={feature.title}
                    className={cn(
                      "group p-4 sm:p-5 lg:p-6 rounded-lg sm:rounded-xl border border-neutral-800 bg-neutral-900/50 backdrop-blur-sm hover:bg-neutral-800 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10",
                      "hover:border-purple-500/30 hover:-translate-y-1 pointer-events-auto"
                    )}
                    style={{ animationDelay: `${featureIndex * 0.1}s` }}
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-purple-500/60 mt-1.5 sm:mt-2 group-hover:bg-purple-500 transition-colors flex-shrink-0" />
                      <div className="flex-1 space-y-1.5 sm:space-y-2 min-w-0">
                        <h3 className="font-semibold text-white text-base sm:text-lg">{feature.title}</h3>
                        <p className="text-neutral-400 leading-relaxed text-sm sm:text-base">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
