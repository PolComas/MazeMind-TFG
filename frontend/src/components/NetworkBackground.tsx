import { useEffect, useRef } from 'react';

type NetworkBackgroundProps = {
    primaryColor: string;
    backgroundColor?: string;
    opacity?: number; // 0 to 1, default 1
};

export default function NetworkBackground({ primaryColor, backgroundColor = '#0f172a', opacity = 1 }: NetworkBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let w = canvas.width = window.innerWidth;
        let h = canvas.height = window.innerHeight;

        const particles: { x: number; y: number; vx: number; vy: number; size: number }[] = [];
        const count = Math.min(100, (w * h) / 10000); // Responsive count

        // Initialize particles
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 2 + 1,
            });
        }

        let animationId: number;

        const draw = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, w, h);

            // Update and draw particles
            ctx.fillStyle = primaryColor;
            ctx.strokeStyle = primaryColor;

            particles.forEach((p, i) => {
                p.x += p.vx;
                p.y += p.vy;

                // Bounce
                if (p.x < 0 || p.x > w) p.vx *= -1;
                if (p.y < 0 || p.y > h) p.vy *= -1;

                // Draw Dot
                ctx.globalAlpha = 0.6 * opacity;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();

                // Connect
                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 150) {
                        ctx.globalAlpha = (1 - (dist / 150)) * opacity;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            });

            animationId = requestAnimationFrame(draw);
        };

        draw();

        // Resize handler
        const handleResize = () => {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', handleResize);
        };
    }, [primaryColor, opacity]);

    return (
        <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: -1,
            overflow: 'hidden',
            background: backgroundColor,
        }}>
            {/* Hex Grid Overlay (CSS Pattern) */}
            <div style={{
                position: 'absolute',
                inset: 0,
                opacity: 0.15,
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill='none' stroke='%23ffffff' stroke-width='1'/%3E%3C/svg%3E")`,
                backgroundSize: '60px 60px',
            }} />

            {/* Canvas Layer */}
            <canvas
                ref={canvasRef}
                style={{ position: 'absolute', inset: 0, display: 'block' }}
            />

            {/* Vignette for depth (Softer) */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle at center, transparent 50%, rgba(0,0,0,0.4) 100%)',
                pointerEvents: 'none'
            }} />
        </div>
    );
}
