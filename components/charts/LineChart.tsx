import React, { useRef, useLayoutEffect, useState } from 'react';

interface Point {
  x: number;
  y: number;
}

interface LineChartProps {
  data: Point[];
  xAxisLabel: string;
  yAxisLabel: string;
}

const LineChart: React.FC<LineChartProps> = ({ data, xAxisLabel, yAxisLabel }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

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
  if (width === 0 || height === 0 || data.length < 2) {
    return (
        <div ref={containerRef} className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
            {data.length < 2 ? 'Not enough data to display chart.' : ''}
        </div>
    );
  }

  const padding = { top: 20, right: 20, bottom: 50, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxX = Math.max(...data.map(d => d.x), 1);
  const maxY = Math.max(...data.map(d => d.y), 1);

  const xScale = (x: number) => (x / maxX) * chartWidth;
  const yScale = (y: number) => chartHeight - (y / maxY) * chartHeight;

  const linePath = data
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.x)} ${yScale(p.y)}`)
    .join(' ');

  const numXTicks = Math.min(Math.floor(chartWidth / 60), 10);
  const numYTicks = Math.min(Math.floor(chartHeight / 40), 5);

  const xTicks = Array.from({ length: numXTicks + 1 }, (_, i) => (maxX / numXTicks) * i);
  const yTicks = Array.from({ length: numYTicks + 1 }, (_, i) => (maxY / numYTicks) * i);

  return (
    <div ref={containerRef} className="w-full h-full text-xs text-gray-500 dark:text-gray-400">
      <svg width={width} height={height}>
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Axes and Grid Lines */}
          {yTicks.map(tick => (
            <g key={`y-tick-${tick}`} transform={`translate(0, ${yScale(tick)})`}>
              <line x1={0} y1={0} x2={chartWidth} y2={0} className="stroke-current text-gray-200 dark:text-gray-700" />
              <text x={-8} y={3} textAnchor="end" className="fill-current">{Math.round(tick)}</text>
            </g>
          ))}
          {xTicks.map(tick => (
            <g key={`x-tick-${tick}`} transform={`translate(${xScale(tick)}, ${chartHeight})`}>
               <line x1={0} y1={0} x2={0} y2={5} className="stroke-current text-gray-300 dark:text-gray-600" />
              <text x={0} y={15} textAnchor="middle" className="fill-current">{tick.toFixed(1)}</text>
            </g>
          ))}

          {/* Line */}
          <path d={linePath} fill="none" className="stroke-current text-teal-500" strokeWidth="2" />
          
          {/* Points */}
          {data.map((p, i) => (
            <circle key={i} cx={xScale(p.x)} cy={yScale(p.y)} r="4" className="fill-current text-teal-500" />
          ))}

          {/* Axis Labels */}
          <text x={chartWidth / 2} y={chartHeight + 40} textAnchor="middle" className="fill-current font-semibold">{xAxisLabel}</text>
          <text transform={`translate(-35, ${chartHeight / 2}) rotate(-90)`} textAnchor="middle" className="fill-current font-semibold">{yAxisLabel}</text>
        </g>
      </svg>
    </div>
  );
};

export default LineChart;
