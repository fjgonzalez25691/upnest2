// src/components/GrowthChart.jsx
// Purpose: Chart component to visualize baby growth data over time

import React, { useMemo } from "react";

const GrowthChart = ({ 
    measurements = [], 
    chartType = "weight", 
    title,
    showTrendLine = true,
    height = 400 
}) => {
    const chartData = useMemo(() => {
        if (!measurements.length) return { points: [], maxValue: 0, minValue: 0 };

        // Sort measurements by date
        const sortedMeasurements = [...measurements].sort(
            (a, b) => new Date(a.measurementDate) - new Date(b.measurementDate)
        );

        // Extract values for the selected chart type
        const points = sortedMeasurements
            .map((measurement, index) => {
                const value = measurement.measurements?.[chartType];
                if (!value) return null;

                return {
                    x: index,
                    y: parseFloat(value),
                    date: measurement.measurementDate,
                    measurement
                };
            })
            .filter(Boolean);

        if (!points.length) return { points: [], maxValue: 0, minValue: 0 };

        const values = points.map(p => p.y);
        const maxValue = Math.max(...values);
        const minValue = Math.min(...values);
        const padding = (maxValue - minValue) * 0.1; // 10% padding

        return {
            points,
            maxValue: maxValue + padding,
            minValue: Math.max(0, minValue - padding)
        };
    }, [measurements, chartType]);

    const getUnit = (type) => {
        switch (type) {
            case "weight": return "kg";
            case "height": return "cm";
            case "headCircumference": return "cm";
            default: return "";
        }
    };

    const getChartTitle = () => {
        if (title) return title;
        switch (chartType) {
            case "weight": return "Weight Over Time";
            case "height": return "Height Over Time";
            case "headCircumference": return "Head Circumference Over Time";
            default: return "Growth Chart";
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    // SVG dimensions
    const svgWidth = 800;
    const svgHeight = height;
    const margin = { top: 40, right: 40, bottom: 60, left: 60 };
    const chartWidth = svgWidth - margin.left - margin.right;
    const chartHeight = svgHeight - margin.top - margin.bottom;

    if (!chartData.points.length) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">{getChartTitle()}</h3>
                <div className="flex items-center justify-center h-64 text-gray-500">
                    <div className="text-center">
                        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <p>No data available for {chartType} measurements</p>
                        <p className="text-sm">Add some measurements to see the growth chart</p>
                    </div>
                </div>
            </div>
        );
    }

    // Calculate positions
    const xScale = (index) => (index / (chartData.points.length - 1)) * chartWidth;
    const yScale = (value) => chartHeight - ((value - chartData.minValue) / (chartData.maxValue - chartData.minValue)) * chartHeight;

    // Generate path for line chart
    const linePath = chartData.points
        .map((point, index) => {
            const x = xScale(point.x);
            const y = yScale(point.y);
            return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
        })
        .join(' ');

    // Generate trend line if enabled
    let trendPath = '';
    if (showTrendLine && chartData.points.length > 1) {
        // Simple linear regression
        const n = chartData.points.length;
        const sumX = chartData.points.reduce((sum, p) => sum + p.x, 0);
        const sumY = chartData.points.reduce((sum, p) => sum + p.y, 0);
        const sumXY = chartData.points.reduce((sum, p) => sum + p.x * p.y, 0);
        const sumXX = chartData.points.reduce((sum, p) => sum + p.x * p.x, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        const startX = 0;
        const endX = chartData.points.length - 1;
        const startY = slope * startX + intercept;
        const endY = slope * endX + intercept;

        trendPath = `M ${xScale(startX)} ${yScale(startY)} L ${xScale(endX)} ${yScale(endY)}`;
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">{getChartTitle()}</h3>
            
            <div className="overflow-x-auto">
                <svg width={svgWidth} height={svgHeight} className="border border-gray-200 rounded">
                    <g transform={`translate(${margin.left}, ${margin.top})`}>
                        {/* Grid lines */}
                        <defs>
                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
                            </pattern>
                        </defs>
                        <rect width={chartWidth} height={chartHeight} fill="url(#grid)" />

                        {/* Y-axis labels */}
                        {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
                            const value = chartData.minValue + (chartData.maxValue - chartData.minValue) * ratio;
                            const y = chartHeight - ratio * chartHeight;
                            return (
                                <g key={ratio}>
                                    <line x1="0" y1={y} x2={chartWidth} y2={y} stroke="#e5e7eb" strokeWidth="1" />
                                    <text x="-10" y={y + 4} textAnchor="end" className="text-xs fill-gray-600">
                                        {value.toFixed(1)}
                                    </text>
                                </g>
                            );
                        })}

                        {/* X-axis labels */}
                        {chartData.points.map((point, index) => {
                            const x = xScale(point.x);
                            return (
                                <text
                                    key={index}
                                    x={x}
                                    y={chartHeight + 20}
                                    textAnchor="middle"
                                    className="text-xs fill-gray-600"
                                >
                                    {formatDate(point.date)}
                                </text>
                            );
                        })}

                        {/* Trend line */}
                        {showTrendLine && trendPath && (
                            <path
                                d={trendPath}
                                stroke="#94a3b8"
                                strokeWidth="2"
                                strokeDasharray="5,5"
                                fill="none"
                            />
                        )}

                        {/* Main line */}
                        <path
                            d={linePath}
                            stroke="var(--color-primary)"
                            strokeWidth="3"
                            fill="none"
                        />

                        {/* Data points */}
                        {chartData.points.map((point, index) => {
                            const x = xScale(point.x);
                            const y = yScale(point.y);
                            return (
                                <g key={index}>
                                    <circle
                                        cx={x}
                                        cy={y}
                                        r="5"
                                        fill="var(--color-primary)"
                                        stroke="white"
                                        strokeWidth="2"
                                    />
                                    <title>
                                        {formatDate(point.date)}: {point.y.toFixed(1)} {getUnit(chartType)}
                                    </title>
                                </g>
                            );
                        })}

                        {/* Axes */}
                        <line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#374151" strokeWidth="2" />
                        <line x1="0" y1="0" x2="0" y2={chartHeight} stroke="#374151" strokeWidth="2" />
                    </g>

                    {/* Axis labels */}
                    <text x={svgWidth / 2} y={svgHeight - 10} textAnchor="middle" className="text-sm fill-gray-700 font-medium">
                        Measurement Date
                    </text>
                    <text 
                        x="20" 
                        y={svgHeight / 2} 
                        textAnchor="middle" 
                        className="text-sm fill-gray-700 font-medium"
                        transform={`rotate(-90 20 ${svgHeight / 2})`}
                    >
                        {chartType.charAt(0).toUpperCase() + chartType.slice(1)} ({getUnit(chartType)})
                    </text>
                </svg>
            </div>

            {/* Chart statistics */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded">
                    <div className="font-medium text-gray-900">Latest</div>
                    <div className="text-primary-600">
                        {chartData.points[chartData.points.length - 1]?.y.toFixed(1)} {getUnit(chartType)}
                    </div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                    <div className="font-medium text-gray-900">Highest</div>
                    <div className="text-green-600">
                        {Math.max(...chartData.points.map(p => p.y)).toFixed(1)} {getUnit(chartType)}
                    </div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                    <div className="font-medium text-gray-900">Lowest</div>
                    <div className="text-blue-600">
                        {Math.min(...chartData.points.map(p => p.y)).toFixed(1)} {getUnit(chartType)}
                    </div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                    <div className="font-medium text-gray-900">Measurements</div>
                    <div className="text-gray-600">
                        {chartData.points.length} total
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GrowthChart;
