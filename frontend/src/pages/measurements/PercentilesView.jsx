// src/pages/measurements/PercentilesView.jsx
// Dedicated page for displaying WHO percentile charts for baby growth measurements

import React, { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { getGrowthData } from "../../services/growthDataApi";
import PercentilesChart from "../../components/PercentilesChart";
import TextBox from "../../components/TextBox";
import PrimaryButton from "../../components/PrimaryButton";
import Spinner from "../../components/Spinner";
import PageShell from "../../components/layout/PageShell";

const PercentilesView = () => {
  const { babyId } = useParams();
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedType, setSelectedType] = useState('weight');

  const location = useLocation();
  
  const babyName = location.state?.babyName || "Baby";
  const birthDate = location.state?.birthDate || null;
  const gender = location.state?.gender || 'male';

  // Load measurements for the baby
  useEffect(() => {
    const loadMeasurements = async () => {
      if (!babyId) return;
      
      try {
        setLoading(true);
        setError("");
        const data = await getGrowthData(babyId);
        const measurementsList = Array.isArray(data) ? data : [];
        setMeasurements(measurementsList);
      } catch (err) {
        console.error("Error loading measurements for charts:", err);
        setError("Failed to load measurement data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadMeasurements();
  }, [babyId]);

  if (loading) {
    return (
      <PageShell>
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <Spinner variant="basic" size="md" color="blue" message="Loading growth charts..." />
          </div>
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell>
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <Link
              to={`/baby/${babyId}`}
              className="text-blue-600 hover:text-blue-800 flex items-center mb-4 transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Profile
            </Link>
          </div>
          
          <div className="bg-white rounded-3xl shadow-lg p-8 border border-red-100">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="text-lg text-red-600 mb-4">{error}</div>
              <PrimaryButton
                onClick={() => window.location.reload()}
                variant="primary"
              >
                Retry
              </PrimaryButton>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="max-w-6xl mx-auto">
        {/* Navigation Header */}
        <div className="mb-6 md:mb-8">
          <Link
            to={`/baby/${babyId}`}
            className="text-blue-600 hover:text-blue-800 flex items-center mb-4 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Profile
          </Link>
          
          {/* Main Title - Mobile First */}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6">
            {babyName}'s Growth Charts
          </h1>
          
          {/* Mobile First Layout */}
          <div className="space-y-4 lg:space-y-0 lg:flex lg:items-end lg:justify-between lg:gap-8">
            
            {/* Subtitle - Mobile: full width, Desktop: flex-1 */}
            <div className="lg:flex-1">
              <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                WHO percentile charts showing growth patterns over time
              </p>
            </div>
            
            {/* Measurement Type Selector - Mobile: full width, Desktop: auto */}
            <div className="w-full sm:max-w-xs lg:max-w-sm xl:min-w-[280px]">
              <TextBox
                label="Measurement Type:"
                name="measurementType"
                type="select"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                options={[
                  { value: "weight", label: "Weight" },
                  { value: "height", label: "Height" },
                  { value: "headCircumference", label: "Head Circumference" }
                ]}
                editable={true}
                labelPosition="inline"
                size="compact"
                className="w-full"
              />
            </div>
            
            {/* Quick Actions - Mobile: full width, Desktop: auto */}
            <div className="w-full sm:w-auto lg:flex-shrink-0">
              <Link
                to={`/baby/${babyId}/growth/tracking`}
                state={{ babyName, birthDate, prevMeasurements: measurements }}
                className="block w-full sm:w-auto"
              >
                <PrimaryButton 
                  variant="primary" 
                  size="compact" 
                  showIcon={false}
                  className="w-full sm:w-auto whitespace-nowrap"
                >
                  View Growth Dashboard
                </PrimaryButton>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Chart Container */}
        <div className="space-y-4 md:space-y-6">
          {measurements.length === 0 ? (
            <div className="bg-white rounded-2xl md:rounded-3xl shadow-lg p-6 md:p-8 border border-blue-100">
              <div className="text-center py-8 md:py-12">
                <svg className="w-12 md:w-16 h-12 md:h-16 mx-auto mb-4 md:mb-6 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <h3 className="text-lg md:text-xl font-semibold text-gray-700 mb-2">No Growth Data Available</h3>
                <p className="text-sm md:text-base text-gray-500 mb-4 md:mb-6 px-4">
                  Add measurements to {babyName}'s profile to see percentile charts and growth tracking.
                </p>
                <Link to={`/baby/${babyId}`} className="inline-block">
                  <PrimaryButton variant="add" className="inline-flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Measurements
                  </PrimaryButton>
                </Link>
              </div>
            </div>
          ) : (
            <PercentilesChart 
              measurements={measurements} 
              babyData={{ birthDate }}
              gender={gender}
              measurementType={selectedType}
            />
          )}
          
          {/* Additional Information - Mobile First Grid */}
          {measurements.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 border border-blue-100">
              <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4">About These Charts</h3>
              
              {/* Mobile: 1 column, Tablet: 2 columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 text-xs md:text-sm text-gray-600">
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-700 text-sm md:text-base">WHO Growth Standards</h4>
                  <p className="leading-relaxed">
                    These charts are based on World Health Organization (WHO) growth standards, 
                    which represent optimal growth patterns for healthy children.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-700 text-sm md:text-base">How to Read the Charts</h4>
                  <p className="leading-relaxed">
                    The colored lines show different percentiles. Most healthy babies fall between 
                    the 3rd and 97th percentiles. Your baby's measurements are shown as blue dots.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-700 text-sm md:text-base">Data Summary</h4>
                  <p className="leading-relaxed">
                    <span className="block">Total measurements: <span className="font-medium">{measurements.length}</span></span>
                    <span className="block mt-1">
                      Date range: {measurements.length > 1 ? 
                        `${new Date(measurements[measurements.length - 1]?.measurementDate).toLocaleDateString()} - ${new Date(measurements[0]?.measurementDate).toLocaleDateString()}` 
                        : new Date(measurements[0]?.measurementDate).toLocaleDateString()
                      }
                    </span>
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-700 text-sm md:text-base">Medical Guidance</h4>
                  <p className="leading-relaxed">
                    These charts are for informational purposes. Always consult with your pediatrician 
                    for professional interpretation and medical advice.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default PercentilesView;