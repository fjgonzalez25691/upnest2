// src/components/PercentilesChart.jsx
// Purpose: Interactive percentile charts for baby growth measurements using Recharts
// Features: Dropdown selector for measurement type, WHO percentile format (0-100 scale)

import React, { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";

/**
 * WHO Percentile Reference Data - Expanded for smooth curves (0-24 months)
 * Structure: age_months -> measurement_value for each percentile line
 */
const WHO_PERCENTILES = {
  weight: {
    // Boys weight data (kg) - WHO standard
    0: { p3: 2.5, p15: 2.9, p50: 3.3, p85: 3.8, p97: 4.2 },
    1: { p3: 3.4, p15: 3.9, p50: 4.5, p85: 5.1, p97: 5.7 },
    2: { p3: 4.3, p15: 4.9, p50: 5.6, p85: 6.3, p97: 7.0 },
    3: { p3: 5.0, p15: 5.7, p50: 6.4, p85: 7.2, p97: 7.9 },
    4: { p3: 5.6, p15: 6.2, p50: 7.0, p85: 7.8, p97: 8.6 },
    5: { p3: 6.0, p15: 6.7, p50: 7.5, p85: 8.4, p97: 9.3 },
    6: { p3: 6.4, p15: 7.3, p50: 8.2, p85: 9.2, p97: 10.1 },
    7: { p3: 6.7, p15: 7.6, p50: 8.6, p85: 9.6, p97: 10.6 },
    8: { p3: 7.0, p15: 7.9, p50: 8.9, p85: 10.0, p97: 11.0 },
    9: { p3: 7.6, p15: 8.5, p50: 9.6, p85: 10.7, p97: 11.8 },
    10: { p3: 7.5, p15: 8.4, p50: 9.4, p85: 10.5, p97: 11.6 },
    11: { p3: 7.7, p15: 8.7, p50: 9.7, p85: 10.8, p97: 11.9 },
    12: { p3: 8.7, p15: 9.7, p50: 10.9, p85: 12.1, p97: 13.3 },
    15: { p3: 9.2, p15: 10.3, p50: 11.5, p85: 12.8, p97: 14.1 },
    18: { p3: 10.2, p15: 11.3, p50: 12.6, p85: 14.0, p97: 15.4 },
    21: { p3: 10.9, p15: 12.0, p50: 13.3, p85: 14.7, p97: 16.2 },
    24: { p3: 11.5, p15: 12.7, p50: 14.1, p85: 15.6, p97: 17.1 }
  },
  height: {
    // Boys height/length data (cm) - WHO standard
    0: { p3: 46.1, p15: 47.9, p50: 49.9, p85: 51.9, p97: 53.7 },
    1: { p3: 50.8, p15: 52.8, p50: 54.7, p85: 56.7, p97: 58.6 },
    2: { p3: 54.4, p15: 56.4, p50: 58.4, p85: 60.4, p97: 62.4 },
    3: { p3: 57.3, p15: 59.4, p50: 61.4, p85: 63.5, p97: 65.5 },
    4: { p3: 59.7, p15: 61.8, p50: 63.9, p85: 66.0, p97: 68.0 },
    5: { p3: 61.7, p15: 63.8, p50: 65.9, p85: 68.0, p97: 70.1 },
    6: { p3: 63.3, p15: 65.5, p50: 67.6, p85: 69.8, p97: 71.9 },
    7: { p3: 64.8, p15: 67.0, p50: 69.2, p85: 71.3, p97: 73.5 },
    8: { p3: 66.2, p15: 68.4, p50: 70.6, p85: 72.8, p97: 75.0 },
    9: { p3: 68.0, p15: 70.1, p50: 72.3, p85: 74.5, p97: 76.6 },
    10: { p3: 68.7, p15: 70.9, p50: 73.3, p85: 75.6, p97: 77.9 },
    11: { p3: 69.9, p15: 72.2, p50: 74.5, p85: 76.9, p97: 79.2 },
    12: { p3: 71.9, p15: 74.0, p50: 76.1, p85: 78.3, p97: 80.5 },
    15: { p3: 74.1, p15: 76.4, p50: 78.7, p85: 81.1, p97: 83.4 },
    18: { p3: 77.5, p15: 79.8, p50: 82.1, p85: 84.5, p97: 86.8 },
    21: { p3: 80.5, p15: 82.9, p50: 85.4, p85: 87.8, p97: 90.3 },
    24: { p3: 82.5, p15: 84.9, p50: 87.1, p85: 89.6, p97: 92.0 }
  },
  headCircumference: {
    // Boys head circumference data (cm) - WHO standard
    0: { p3: 32.6, p15: 33.9, p50: 35.0, p85: 36.1, p97: 37.2 },
    1: { p3: 35.8, p15: 37.0, p50: 38.1, p85: 39.2, p97: 40.3 },
    2: { p3: 37.7, p15: 38.8, p50: 39.9, p85: 41.0, p97: 42.0 },
    3: { p3: 39.1, p15: 40.2, p50: 41.3, p85: 42.4, p97: 43.4 },
    4: { p3: 40.2, p15: 41.3, p50: 42.4, p85: 43.5, p97: 44.5 },
    5: { p3: 41.0, p15: 42.1, p50: 43.2, p85: 44.3, p97: 45.3 },
    6: { p3: 41.5, p15: 42.6, p50: 43.7, p85: 44.8, p97: 45.8 },
    7: { p3: 42.0, p15: 43.1, p50: 44.2, p85: 45.3, p97: 46.3 },
    8: { p3: 42.4, p15: 43.5, p50: 44.6, p85: 45.7, p97: 46.7 },
    9: { p3: 43.2, p15: 44.2, p50: 45.3, p85: 46.4, p97: 47.4 },
    10: { p3: 43.5, p15: 44.6, p50: 45.7, p85: 46.8, p97: 47.8 },
    11: { p3: 43.8, p15: 44.9, p50: 46.0, p85: 47.1, p97: 48.1 },
    12: { p3: 44.6, p15: 45.6, p50: 46.6, p85: 47.7, p97: 48.7 },
    15: { p3: 45.4, p15: 46.4, p50: 47.4, p85: 48.5, p97: 49.5 },
    18: { p3: 46.4, p15: 47.4, p50: 48.4, p85: 49.5, p97: 50.5 },
    21: { p3: 47.2, p15: 48.2, p50: 49.2, p85: 50.3, p97: 51.3 },
    24: { p3: 47.7, p15: 48.7, p50: 49.7, p85: 50.8, p97: 51.8 }
  }
};

/**
 * Interpolate percentile values for smooth curves between data points
 * @param {number} ageInMonths - Target age in months
 * @param {string} measurementType - Type of measurement (weight, height, headCircumference)
 * @returns {Object} Interpolated percentile values {p3, p15, p50, p85, p97}
 */
function interpolatePercentiles(ageInMonths, measurementType) {
  const data = WHO_PERCENTILES[measurementType];
  if (!data) return null;

  const ages = Object.keys(data).map(Number).sort((a, b) => a - b);
  
  // If exact age exists, return that data
  if (data[ageInMonths]) {
    return data[ageInMonths];
  }
  
  // Find surrounding ages for interpolation
  let lowerAge = ages[0];
  let upperAge = ages[ages.length - 1];
  
  for (let i = 0; i < ages.length - 1; i++) {
    if (ageInMonths >= ages[i] && ageInMonths <= ages[i + 1]) {
      lowerAge = ages[i];
      upperAge = ages[i + 1];
      break;
    }
  }
  
  // If outside range, return closest boundary
  if (ageInMonths <= lowerAge) return data[lowerAge];
  if (ageInMonths >= upperAge) return data[upperAge];
  
  // Linear interpolation between lower and upper ages
  const ratio = (ageInMonths - lowerAge) / (upperAge - lowerAge);
  const lowerData = data[lowerAge];
  const upperData = data[upperAge];
  
  return {
    p3: lowerData.p3 + ratio * (upperData.p3 - lowerData.p3),
    p15: lowerData.p15 + ratio * (upperData.p15 - lowerData.p15),
    p50: lowerData.p50 + ratio * (upperData.p50 - lowerData.p50),
    p85: lowerData.p85 + ratio * (upperData.p85 - lowerData.p85),
    p97: lowerData.p97 + ratio * (upperData.p97 - lowerData.p97)
  };
}

/**
 * Calculate age in months between two specific dates
 * @param {string} measurementDate - ISO date string of measurement
 * @param {string} birthDate - ISO date string of birth
 * @returns {number} Age in months at measurement date
 */
function calculateAgeInMonths(measurementDate, birthDate) {
  if (!measurementDate || !birthDate) return 0;
  
  const measurement = new Date(measurementDate);
  const birth = new Date(birthDate);
  
  // Calculate months between birth and measurement date
  const yearsDiff = measurement.getFullYear() - birth.getFullYear();
  const monthsDiff = measurement.getMonth() - birth.getMonth();
  const daysDiff = measurement.getDate() - birth.getDate();
  
  let totalMonths = yearsDiff * 12 + monthsDiff;
  
  // Adjust for days - if measurement day is before birth day in the month, subtract a month
  if (daysDiff < 0) {
    totalMonths -= 1;
    // Add fractional month based on days
    const daysInPrevMonth = new Date(measurement.getFullYear(), measurement.getMonth(), 0).getDate();
    const dayFraction = (daysInPrevMonth + daysDiff) / daysInPrevMonth;
    totalMonths += dayFraction;
  } else {
    // Add fractional month for additional days
    const daysInCurrentMonth = new Date(measurement.getFullYear(), measurement.getMonth() + 1, 0).getDate();
    const dayFraction = daysDiff / daysInCurrentMonth;
    totalMonths += dayFraction;
  }
  
  return Math.max(0, totalMonths);
}

import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getPercentileData } from '../data/whoPercentiles';

const PercentilesChart = ({ measurements, measurementType = 'weight', babyData, gender = 'male' }) => {
  const [selectedMeasurement, setSelectedMeasurement] = useState("weight");

  // Generate WHO percentile curves data (0-24 months)
  const percentileCurves = useMemo(() => {
    const agePoints = [];
    
    // Generate monthly points from 0 to 24 months for smooth curves
    for (let age = 0; age <= 24; age += 1) {
      const percentiles = interpolatePercentiles(age, selectedMeasurement);
      if (percentiles) {
        agePoints.push({
          ageMonths: age,
          ...percentiles
        });
      }
    }
    
    return agePoints;
  }, [selectedMeasurement]);

  // Process baby's actual measurements
  const babyMeasurements = useMemo(() => {
    if (!measurements.length || !birthDate) return [];

    return measurements
      .filter(m => m.measurements && m.measurements[selectedMeasurement] && m.measurementDate)
      .map(m => {
        const ageMonths = calculateAgeInMonths(m.measurementDate, birthDate);
        let value = parseFloat(m.measurements[selectedMeasurement]);
        
        // Convert units if needed:
        // - Weight: grams to kg (divide by 1000)
        // - Height and head circumference are already in cm (no conversion needed)
        if (selectedMeasurement === 'weight') {
          value = value / 1000; // Convert grams to kg
        }
        
        return {
          ageMonths: Math.round(ageMonths * 10) / 10,
          actualValue: Math.round(value * 100) / 100, // Round to 2 decimals
          date: m.measurementDate,
          dataId: m.dataId
        };
      })
      .sort((a, b) => a.ageMonths - b.ageMonths); // Sort by age to ensure correct line progression
  }, [measurements, selectedMeasurement, birthDate]);

  // Combine WHO curves with baby measurements for chart
  const chartData = useMemo(() => {
    const combinedData = [...percentileCurves];
    
    // Add baby measurements to corresponding age points
    babyMeasurements.forEach(measurement => {
      const existingPoint = combinedData.find(p => 
        Math.abs(p.ageMonths - measurement.ageMonths) < 0.5
      );
      
      if (existingPoint) {
        Object.assign(existingPoint, measurement);
      } else {
        // Add new point with interpolated percentiles
        const percentiles = interpolatePercentiles(measurement.ageMonths, selectedMeasurement);
        combinedData.push({
          ageMonths: measurement.ageMonths,
          ...percentiles,
          ...measurement
        });
      }
    });

    return combinedData.sort((a, b) => a.ageMonths - b.ageMonths);
  }, [percentileCurves, babyMeasurements, selectedMeasurement]);

  const getUnit = (type) => {
    switch (type) {
      case "weight": return "kg";
      case "height": return "cm";
      case "headCircumference": return "cm";
      case "head": return "cm"; // Support legacy field name
      default: return "";
    }
  };

  const getTitle = (type) => {
    switch (type) {
      case "weight": return "Weight";
      case "height": return "Height/Length";
      case "headCircumference": return "Head Circumference";
      case "head": return "Head Circumference"; // Support legacy field name
      default: return "Growth";
    }
  };

  const getYAxisDomain = (type) => {
    // Set appropriate Y-axis ranges for each measurement type
    switch (type) {
      case "weight": return [0, 25]; // 0-25 kg covers 0-24 months
      case "height": return [40, 100]; // 40-100 cm covers 0-24 months  
      case "headCircumference":
      case "head": return [30, 55]; // 30-55 cm covers 0-24 months
      default: return ['dataMin', 'dataMax'];
    }
  };

  // Custom tooltip for percentile chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-800">{`Age: ${label} months`}</p>
        
        {/* WHO Percentile values at this age */}
        <div className="mt-2 text-sm">
          <p className="font-medium text-gray-700">WHO Percentiles:</p>
          <p className="text-red-600">97th: {data.p97?.toFixed(1)} {getUnit(selectedMeasurement)}</p>
          <p className="text-blue-600">85th: {data.p85?.toFixed(1)} {getUnit(selectedMeasurement)}</p>
          <p className="text-black font-medium">50th: {data.p50?.toFixed(1)} {getUnit(selectedMeasurement)}</p>
          <p className="text-blue-600">15th: {data.p15?.toFixed(1)} {getUnit(selectedMeasurement)}</p>
          <p className="text-red-600">3rd: {data.p3?.toFixed(1)} {getUnit(selectedMeasurement)}</p>
        </div>

        {/* Baby's actual measurement if available */}
        {data.actualValue && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-green-600 font-medium">{`Baby's ${getTitle(selectedMeasurement).toLowerCase()}: ${data.actualValue} ${getUnit(selectedMeasurement)}`}</p>
            {data.date && (
              <p className="text-gray-600 text-sm">{`Measured: ${new Date(data.date).toLocaleDateString()}`}</p>
            )}
            <p className="text-gray-500 text-xs">{`Age at measurement: ${data.ageMonths.toFixed(1)} months`}</p>
          </div>
        )}
      </div>
    );
  };

  if (!chartData.length) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg border border-blue-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">WHO Percentile Charts</h2>
          <select
            value={selectedMeasurement}
            onChange={(e) => setSelectedMeasurement(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="weight">Weight</option>
            <option value="height">Height/Length</option>
            <option value="headCircumference">Head Circumference</option>
          </select>
        </div>
        
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="font-semibold text-gray-700">No {getTitle(selectedMeasurement).toLowerCase()} measurements available</p>
            <p className="text-sm text-gray-500 mt-1">Add measurements to see the percentile chart</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-blue-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">WHO Percentile Charts</h2>
          <p className="text-gray-600 text-sm mt-1">
            {getTitle(selectedMeasurement)} growth tracking with WHO percentiles
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Measurement Type:</label>
          <select
            value={selectedMeasurement}
            onChange={(e) => setSelectedMeasurement(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="weight">Weight</option>
            <option value="height">Height/Length</option>
            <option value="headCircumference">Head Circumference</option>
          </select>
        </div>
      </div>

      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="ageMonths" 
              type="number"
              scale="linear"
              domain={[0, 24]}
              ticks={[0, 3, 6, 9, 12, 15, 18, 21, 24]}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              label={{ value: 'Age (months)', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fill: '#6b7280' } }}
            />
            <YAxis 
              domain={getYAxisDomain(selectedMeasurement)}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              label={{ value: `${getTitle(selectedMeasurement)} (${getUnit(selectedMeasurement)})`, angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
            />
            
            {/* WHO Percentile Curves */}
            <Line
              type="monotone"
              dataKey="p97"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              name="97th percentile"
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="p85"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              name="85th percentile"
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="p50"
              stroke="#000000"
              strokeWidth={2.5}
              dot={false}
              name="50th percentile (median)"
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="p15"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              name="15th percentile"
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="p3"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              name="3rd percentile"
              connectNulls={false}
            />
            
            {/* Baby's Actual Measurements */}
            <Line
              type="monotone"
              dataKey="actualValue"
              stroke="#22c55e"
              strokeWidth={3}
              dot={{ r: 6, fill: '#22c55e', stroke: '#ffffff', strokeWidth: 2 }}
              name="Baby's measurements"
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Legend/Info */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">WHO Growth Chart Information:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <p><span className="font-medium">Green line with dots:</span> Your baby's actual measurements</p>
            <p><span className="font-medium">Black line:</span> 50th percentile (median/average)</p>
          </div>
          <div>
            <p><span className="font-medium">Blue lines:</span> 15th and 85th percentiles</p>
            <p><span className="font-medium">Red lines:</span> 3rd and 97th percentiles</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          <strong>How to read:</strong> Compare your baby's green dots with the WHO percentile curves. 
          The curves show normal ranges for babies of the same age. 
          Most healthy babies follow a curve between the 3rd and 97th percentiles.
        </p>
      </div>
    </div>
  );
};

export default PercentilesChart;