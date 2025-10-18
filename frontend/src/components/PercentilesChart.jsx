// src/components/PercentilesChart.jsx
// Purpose: Interactive percentile charts for baby growth measurements using WHO data
// Features: Gender-specific charts, static pre-calculated WHO percentile data

import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { getPercentileData } from '../data/whoPercentiles';

const PercentilesChart = ({ measurements = [], measurementType = 'weight', babyData, gender = 'male' }) => {
  /**
   * Calculate age in months from measurement date to birth date
   */
  const calculateAgeInMonths = (measurementDate, birthDate) => {
    if (!measurementDate || !birthDate) return 0;
    
    const measurement = new Date(measurementDate);
    const birth = new Date(birthDate);
    
    // Calculate difference in months
    const diffTime = measurement - birth;
    const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30.44); // 30.44 days per month average
    
    return Math.max(0, diffMonths);
  };





  /**
   * Get configuration for different measurement types
   */
  const getAxisConfig = (type) => {
    switch (type) {
      case 'weight':
        return {
          yAxisLabel: 'Weight (kg)',
          yAxisDomain: [0, 20],
          yAxisTicks: [0, 5, 10, 15, 20],
          unit: 'kg',
          precision: 1
        };
      case 'height':
        return {
          yAxisLabel: 'Height (cm)',
          yAxisDomain: [40, 100],
          yAxisTicks: [40, 50, 60, 70, 80, 90, 100],
          unit: 'cm',
          precision: 1
        };
      case 'headCircumference':
        return {
          yAxisLabel: 'Head Circumference (cm)',
          yAxisDomain: [30, 55],
          yAxisTicks: [30, 35, 40, 45, 50, 55],
          unit: 'cm',
          precision: 1
        };
      default:
        return {
          yAxisLabel: 'Valor',
          yAxisDomain: [0, 'dataMax'],
          yAxisTicks: null,
          unit: '',
          precision: 1
        };
    }
  };

  const axisConfig = getAxisConfig(measurementType);

  /**
   * Custom tooltip with Spanish labels
   */
  const CustomTooltip = ({ active, payload, label }) => {
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
  };



  const currentAxisConfig = getAxisConfig(measurementType);
  const currentChartData = useMemo(() => {
    // Recalculate when type changes
    const whoData = getPercentileData(measurementType, gender);
    
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

    // Add baby measurements if available and match the selected type
    if (measurements && babyData?.birthDate) {
      const babyPoints = measurements
        .filter(m => m.measurements && m.measurements[measurementType] && m.measurementDate)
        .map(m => {
          const ageMonths = calculateAgeInMonths(m.measurementDate, babyData.birthDate);
          let value = parseFloat(m.measurements[measurementType]);
          
          // Convert units: weight from grams to kg
          if (measurementType === 'weight') {
            value = value / 1000; // Convert grams to kg
          }
          
          return {
            ageMonths: Math.round(ageMonths * 10) / 10,
            actualValue: Math.round(value * 100) / 100, // Round to 2 decimals
            date: m.measurementDate,
            dataId: m.dataId
          };
        })
        .filter(point => point.ageMonths >= 0 && point.ageMonths <= 24);

      console.log(`📊 Debug measurements:`, {
        rawMeasurements: measurements,
        measurementType,
        babyData,
        filteredForType: measurements.filter(m => m.measurements && m.measurements[measurementType]),
        processedPoints: babyPoints
      });

      // Merge data
      const allAges = new Set([
        ...percentilePoints.map(p => p.ageMonths),
        ...babyPoints.map(p => p.ageMonths)
      ]);

      return Array.from(allAges)
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
    }

    return percentilePoints;
  }, [measurements, measurementType, babyData, gender]);

  if (!currentChartData || currentChartData.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded">
        <p className="text-gray-600">No percentile data available for {measurementType} ({gender})</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Chart */}
      <div className="w-3/4 mx-auto h-[375px] md:h-[49vh] lg:h-[52vh]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={currentChartData}
            margin={{ top: 20, right: 20, left: 70, bottom: 120 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            
            <XAxis
              dataKey="ageMonths"
              type="number"
              scale="linear"
              domain={[0, 24]}
              ticks={[0, 3, 6, 9, 12, 15, 18, 21, 24]}
              label={{ value: 'Age (months)', position: 'insideBottom', offset: -10 }}
            />
            
            <YAxis
              domain={currentAxisConfig.yAxisDomain}
              ticks={currentAxisConfig.yAxisTicks}
              label={{ value: currentAxisConfig.yAxisLabel, angle: -90, position: 'insideLeft' }}
            />
            
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
              iconSize={12}
            />

            {/* Percentile lines */}
            <Line
              type="monotone"
              dataKey="p3"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              name="Percentile 3"
            />
            <Line
              type="monotone"
              dataKey="p15"
              stroke="#f97316"
              strokeWidth={2}
              dot={false}
              name="Percentile 15"
            />
            <Line
              type="monotone"
              dataKey="p50"
              stroke="#10b981"
              strokeWidth={3}
              dot={false}
              name="Percentile 50 (median)"
            />
            <Line
              type="monotone"
              dataKey="p85"
              stroke="#f97316"
              strokeWidth={2}
              dot={false}
              name="Percentile 85"
            />
            <Line
              type="monotone"
              dataKey="p97"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              name="Percentile 97"
            />

            {/* Baby measurements */}
            <Line
              type="monotone"
              dataKey="actualValue"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              name="Baby's measurements"
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Info */}
      <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
        <p><strong>WHO Data:</strong> World Health Organization child growth standards</p>
        <p><strong>Range:</strong> 0-24 months • <strong>Gender:</strong> {gender === 'male' ? 'Boy' : 'Girl'}</p>
        <p><strong>Percentiles shown:</strong> P3, P15, P50 (median), P85, P97</p>
      </div>
    </div>
  );
};

export default PercentilesChart;