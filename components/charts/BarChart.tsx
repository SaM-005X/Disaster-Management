import React, { useRef, useLayoutEffect, useState } from 'react';
import { useTranslate } from '../../contexts/TranslationContext';

interface ChartData {
  label: string;
  value: number;
}

interface BarChartProps {
  data: ChartData[];
}

const BarChart: React.FC<BarChartProps> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const { translate } = useTranslate();

  useLayoutEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  
  const { width, height } = size;
  if (width === 0 || height === 0) return <div ref={containerRef} className="w-full h-full" />;

  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  const barWidth = data.length > 0 ? chartWidth / data.length : 0;
  const barPadding = 0.2;

  const yScale = (value: number) => chartHeight - (value / 100) * chartHeight;

  return (
    <div ref={containerRef} className="w-full h-full text-xs text-gray-500 dark:text-gray-400">
      <svg width={width} height={height}>
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Y-Axis */}
          <line x1={0} y1={0} x2={0} y2={chartHeight} className="stroke-current text-gray-300 dark:text-gray-600" />
          {[0, 25, 50, 75, 100].map(tick => (
            <g key={tick} transform={`translate(0, ${yScale(tick)})`}>
              <line x1={-5} y1={0} x2={0} y2={0} className="stroke-current text-gray-300 dark:text-gray-600" />
              <text x={-8} y={3} textAnchor="end" className="fill-current">{tick}%</text>
            </g>
          ))}

          {/* X-Axis */}
          <line x1={0} y1={chartHeight} x2={chartWidth} y2={chartHeight} className="stroke-current text-gray-300 dark:text-gray-600" />
          
          {/* Bars and Labels */}
          {data.map((d, i) => {
            const x = i * barWidth;
            const y = yScale(d.value);
            const barH = chartHeight - y;

            return (
              <g key={d.label}>
                <rect
                  x={x + (barWidth * barPadding) / 2}
                  y={y}
                  width={barWidth * (1 - barPadding)}
                  height={barH}
                  className="fill-current text-teal-500 hover:text-teal-400 transition-colors"
                />
                <text 
                  x={x + barWidth / 2} 
                  y={chartHeight + 15} 
                  textAnchor="middle" 
                  className="fill-current font-semibold"
                >
                  {translate(d.label)}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};

export default BarChart;
