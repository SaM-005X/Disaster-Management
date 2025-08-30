import React from 'react';
import { useTranslate } from '../../contexts/TranslationContext';

interface ChartData {
  label: string;
  value: number;
}

interface BarChartProps {
  data: ChartData[];
}

const BarChart: React.FC<BarChartProps> = ({ data }) => {
  const { translate } = useTranslate();

  // Define a virtual coordinate system for the SVG
  const viewBoxWidth = 500;
  const viewBoxHeight = 250;
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };

  const chartWidth = viewBoxWidth - padding.left - padding.right;
  const chartHeight = viewBoxHeight - padding.top - padding.bottom;

  if (!data || data.length === 0) {
    return (
        <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
            {translate('No data available for chart.')}
        </div>
    );
  }
  
  const barWidth = chartWidth / data.length;
  const barPadding = 0.2;

  const yScale = (value: number) => chartHeight - (value / 100) * chartHeight;

  return (
    <div className="w-full h-full text-xs text-gray-500 dark:text-gray-400">
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full"
        aria-label={translate("Bar chart showing certification progress")}
      >
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Y-Axis */}
          <line x1={0} y1={0} x2={0} y2={chartHeight} className="stroke-current text-gray-300 dark:text-gray-600" />
          {[0, 25, 50, 75, 100].map(tick => (
            <g key={tick} transform={`translate(0, ${yScale(tick)})`}>
              <line x1={-5} y1={0} x2={0} y2={0} className="stroke-current text-gray-300 dark:text-gray-600" />
              <text x={-8} y={3} textAnchor="end" className="fill-current" style={{ fontSize: '14px' }}>{tick}%</text>
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
                >
                  <title>{`${translate(d.label)}: ${d.value}%`}</title>
                </rect>
                <text 
                  x={x + barWidth / 2} 
                  y={chartHeight + 20} 
                  textAnchor="middle" 
                  className="fill-current font-semibold"
                  style={{ fontSize: '14px' }}
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