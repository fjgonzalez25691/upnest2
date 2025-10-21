// src/components/PercentilesChart.jsx

import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import { getPercentileData } from '../data/whoPercentiles';
import { calculateAgeInMonths } from '../utils/dateUtils';
import TextBox from './TextBox';
import '../styles/recharts-fix.css';

const CustomLegend = React.memo(() => {
  const legendItems = [
    { name: "Baby's measurements", color: '#3b82f6', strokeWidth: 3 },
    { name: "P3", color: '#ef4444', strokeWidth: 2 },
    { name: "P15", color: '#f97316', strokeWidth: 2 },
    { name: "P50 (median)", color: '#10b981', strokeWidth: 3 },
    { name: "P85", color: '#f97316', strokeWidth: 2 },
    { name: "P97", color: '#ef4444', strokeWidth: 2 }
  ];

  return (
    <div className="mt-2 mb-2">
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-gray-700 md:flex md:flex-wrap md:justify-center md:gap-x-6 md:gap-y-0">
        {legendItems.map((item, index) => (
          <div key={index} className="flex items-center">
            <div 
              className="w-3 h-0.5 mr-2 rounded-sm md:w-4 md:h-1"
              style={{ 
                backgroundColor: item.color,
                height: item.strokeWidth === 3 ? '2.5px' : '2px'
              }}
            />
            <span className="font-medium md:text-sm">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

// Memoized Tooltip component that accepts selectedType via prop
const MemoTooltip = React.memo(function MemoTooltip({ axisConfig, active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="card-dropdown" style={{padding: '0.75rem'}}>
        <p className="font-semibold">{`Age: ${label?.toFixed(1)} months`}</p>
        {payload.map((entry, index) => {
          if (entry.dataKey === 'actualValue') {
            return (
              <p key={index} style={{ color: entry.color }} className="font-bold">
                {`Baby's measurement: ${entry.value?.toFixed(1)} ${axisConfig.unit}`}
              </p>
            );
          }
          const percentileLabels = {
            p3: 'Percentile 3',
            p15: 'Percentile 15', 
            p50: 'Percentile 50 (median)',
            p85: 'Percentile 85',
            p97: 'Percentile 97'
          };
          return (
            <p key={index} style={{ color: entry.color }}>
              {`${percentileLabels[entry.dataKey] || entry.dataKey}: ${entry.value?.toFixed(1)} ${axisConfig.unit}`}
            </p>
          );
        })}
      </div>
    );
  }
  return null;
});

const PercentilesChart = ({ measurementsWithPercentiles = [], gender = 'male', birthDate }) => {
  const [selectedType, setSelectedType] = useState('weight');
  const [isChartReady, setIsChartReady] = useState(false);

  useEffect(() => {
    setIsChartReady(true);
  }, []);

  const getAxisConfig = (type) => {
    
    switch (type) {
      case 'weight': {
        const weightConfig = {
          yAxisLabel: 'Weight (kg)',
          yAxisDomain: [0, 20],
          yAxisTicks: [0, 5, 10, 15, 20],
          unit: 'kg',
          precision: 1
        };
        return weightConfig;
      }
      case 'height': {
        const heightConfig = {
          yAxisLabel: 'Height (cm)',
          yAxisDomain: [40, 100],
          yAxisTicks: [40, 50, 60, 70, 80, 90, 100],
          unit: 'cm',
          precision: 1
        };
        return heightConfig;
      }
      case 'headCircumference': {
        const headConfig = {
          yAxisLabel: 'Head Circumference (cm)',
          yAxisDomain: [30, 55],
          yAxisTicks: [30, 35, 40, 45, 50, 55],
          unit: 'cm',
          precision: 1
        };
        return headConfig;
      }
      default: {
        const defaultConfig = {
          yAxisLabel: 'Value',
          yAxisDomain: [0, 100],
          yAxisTicks: [0, 25, 50, 75, 100],
          unit: '',
          precision: 1
        };
        return defaultConfig;
      }
    }
  };

  const currentAxisConfig = useMemo(() => {
    const cfg = getAxisConfig(selectedType);
    return cfg;
  }, [selectedType]);

  const measurementTypeOptions = useMemo(() => ([
    { value: "weight", label: "Weight" },
    { value: "height", label: "Height" },
    { value: "headCircumference", label: "Head Circumference" }
  ]), []);
  
  const currentChartData = useMemo(() => {
    const whoData = getPercentileData(selectedType, gender);
    
    if (!whoData || whoData.length === 0) {
      return [];
    }

    const percentilePoints = whoData.map(point => ({
      ageMonths: point.ageMonths,
      p3: point.p3,
      p15: point.p15,
      p50: point.p50,
      p85: point.p85,
      p97: point.p97
    }));

    const measurementsWithSelectedType = measurementsWithPercentiles.filter(
      m => m.measurements && m.measurements[selectedType] && m.measurementDate
    );

    if (measurementsWithSelectedType.length === 0) {
      return percentilePoints;
    }

    const babyPoints = measurementsWithSelectedType.map((m) => {
      let value = parseFloat(m.measurements[selectedType]);
      
      if (selectedType === 'weight' && value > 100) {
        value = value / 1000;
      }
      
      const ageMonths = m.ageInMonths || 
        (birthDate ? calculateAgeInMonths(m.measurementDate, birthDate) : 0);
      
      const processedPoint = {
        ageMonths: Math.round(ageMonths * 10) / 10,
        actualValue: Math.round(value * 100) / 100,
        date: m.measurementDate,
        dataId: m.dataId
      };
      
      return processedPoint;
    });

    const allAges = new Set([
      ...percentilePoints.map(p => p.ageMonths),
      ...babyPoints.map(p => p.ageMonths)
    ]);

    const finalResult = Array.from(allAges)
      .sort((a, b) => a - b)
      .map(age => {
        const percentilePoint = percentilePoints.find(p => Math.abs(p.ageMonths - age) < 0.01);
        const babyPoint = babyPoints.find(p => Math.abs(p.ageMonths - age) < 0.5);
        
        return {
          ageMonths: age,
          ...(percentilePoint || {}),
          ...(babyPoint || {})
        };
      });
    
    return finalResult;
  }, [measurementsWithPercentiles, selectedType, gender, birthDate]);

  if (!isChartReady || !currentChartData || currentChartData.length === 0) {
    return (
      <div className="space-y-4">
        <div className="w-3/4 mx-auto h-[375px] md:h-[49vh] lg:h-[52vh]">
          <div className="h-full w-full animate-pulse rounded bg-slate-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="w-full sm:max-w-xs lg:max-w-sm xl:min-w-[280px] mx-auto mb-6">
        <TextBox
          label="Measurement Type:"
          name="measurementType"
          type="select"
          value={selectedType}
          onChange={(e) => {
            setSelectedType(e.target.value);
          }}
          options={measurementTypeOptions}
          editable={true}
          labelPosition="inline"
          size="compact"
          className="w-full"
        />
      </div>

      <div className="w-3/4 mx-auto h-[375px] md:h-[49vh] lg:h-[52vh]">
        <ResponsiveContainer width="100%" height="100%" className="recharts-fix-container">
          <LineChart
            key={selectedType}
            data={currentChartData}
            margin={{ top: 20, right: 20, left: 70, bottom: 120 }}
            className="recharts-chart-fixed"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            
            <XAxis
              dataKey="ageMonths"
              type="number"
              scale="linear"
              domain={[0, 24]}
              ticks={[0, 3, 6, 9, 12, 15, 18, 21, 24]}
              tick={{ fontSize: '14px', fill: '#334155', fontFamily: 'inherit', letterSpacing: 'normal' }}
              label={{ 
                value: 'Age (months)', 
                position: 'insideBottom', 
                offset: -10,
                style: { fontSize: '14px', fill: '#334155', fontFamily: 'inherit', letterSpacing: 'normal' }
              }}
            />
            
            <YAxis
              domain={currentAxisConfig.yAxisDomain}
              ticks={currentAxisConfig.yAxisTicks}
              tick={{ fontSize: '14px', fill: '#334155', fontFamily: 'inherit', letterSpacing: 'normal' }}
              label={{ 
                value: currentAxisConfig.yAxisLabel, 
                angle: -90, 
                position: 'insideLeft',
                style: { fontSize: '14px', fill: '#334155', fontFamily: 'inherit', letterSpacing: 'normal' }
              }}
            />
            
            <Tooltip content={<MemoTooltip selectedType={selectedType} axisConfig={currentAxisConfig} />} />

            <Line
              type="monotone"
              dataKey="p3"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              name="P3"
              legendType="none"
            />
            <Line
              type="monotone"
              dataKey="p15"
              stroke="#f97316"
              strokeWidth={2}
              dot={false}
              name="P15"
              legendType="none"
            />
            <Line
              type="monotone"
              dataKey="p50"
              stroke="#10b981"
              strokeWidth={3}
              dot={false}
              name="P50 (median)"
              legendType="none"
            />
            <Line
              type="monotone"
              dataKey="p85"
              stroke="#f97316"
              strokeWidth={2}
              dot={false}
              name="P85"
              legendType="none"
            />
            <Line
              type="monotone"
              dataKey="p97"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              name="P97"
              legendType="none"
            />

            <Line
              type="monotone"
              dataKey="actualValue"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              name="Baby's measurements"
              connectNulls={false}
              legendType="none"
            />
          </LineChart>
        </ResponsiveContainer>
        <CustomLegend />
      </div>

      <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
        <p><strong>WHO Data:</strong> World Health Organization child growth standards</p>
        <p><strong>Range:</strong> 0-24 months • <strong>Gender:</strong> {gender === 'male' ? 'Boy' : 'Girl'}</p>
        <p><strong>Percentiles shown:</strong> P3, P15, P50 (median), P85, P97</p>
        <p><strong>Current type:</strong> {selectedType}</p>
      </div>
    </div>
  );
};

export default React.memo(PercentilesChart);
