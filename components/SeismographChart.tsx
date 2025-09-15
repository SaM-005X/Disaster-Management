import React, { useRef, useEffect } from 'react';

interface SeismographChartProps {
    data: number[];
}

const SeismographChart: React.FC<SeismographChartProps> = ({ data }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const { width, height } = rect;

        let animationFrameId: number;

        const render = () => {
            ctx.clearRect(0, 0, width, height);

            // Draw grid lines
            ctx.strokeStyle = '#374151'; // gray-700
            ctx.lineWidth = 0.5;
            for (let i = 1; i < 4; i++) {
                const y = (height / 4) * i;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
                ctx.stroke();
            }

            // Draw the waveform
            ctx.strokeStyle = '#10B981'; // emerald-500
            ctx.lineWidth = 2;
            ctx.beginPath();

            const stepX = width / (data.length - 1);
            const midY = height / 2;
            const maxAmplitude = 128; // Max amplitude from audio data (0-128 for Uint8Array deviation)

            data.forEach((value, index) => {
                const x = index * stepX;
                // Scale value to be between -midY and +midY
                const amplitude = (value / maxAmplitude) * midY;
                const y = midY - Math.min(midY, Math.max(-midY, amplitude));

                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });

            ctx.stroke();

            // Keep the animation loop running only if data is present
            if (data.length > 0) {
                 animationFrameId = window.requestAnimationFrame(render);
            }
        };
        render();

        return () => {
            window.cancelAnimationFrame(animationFrameId);
        };
    }, [data]);

    return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />;
};

export default SeismographChart;