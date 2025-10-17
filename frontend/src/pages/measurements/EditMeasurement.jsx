// src/pages/EditMeasurement.jsx
// Page for editing an existing growth measurement

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import GrowthDataForm from "../../components/measuremencomponents/GrowthDataForm";
import PrimaryButton from "../../components/PrimaryButton";
import Spinner from "../../components/Spinner";
import { getGrowthMeasurement, updateGrowthData } from "../../services/growthDataApi";
import { getBaby } from "../../services/babyApi"; // Only if you need the name

const EditMeasurement = () => {
  const { measurementId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [measurement, setMeasurement] = useState(null);
  const [baby, setBaby] = useState(null); // Only if you need the name
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

// Obtain baby name and birth date from location state
  const babyName = location.state?.babyName || baby?.name;
  const birthDate = location.state?.birthDate || baby?.dateOfBirth;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const measurementData = await getGrowthMeasurement(measurementId);
        setMeasurement(measurementData);

        // If you need the baby's name
        if (measurementData?.babyId) {
          const babyData = await getBaby(measurementData.babyId);
          setBaby(babyData);
        }
      } catch (err) {
        console.error("Error loading measurement data:", err);
        setError("Error loading data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [measurementId]);

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      const updated = await updateGrowthData(measurementId, formData);
      navigate(`/baby/${updated.babyId}/growth/tracking`, {
        state: {
          babyName: babyName || baby?.name,
          birthDate: birthDate || baby?.dateOfBirth,
          prevMeasurements: location.state?.prevMeasurements || null,
          updatedMeasurement: updated
        }
      });
    } catch (err) {
      console.error("Error updating measurement:", err);
      setError("Error updating measurement. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Navigate back without saving
    navigate(`/baby/${measurement.babyId}/growth/tracking`, {
      state: {
        babyName: babyName || baby?.name,
        birthDate: birthDate || baby?.dateOfBirth,
        prevMeasurements: location.state?.prevMeasurements || null
      }
    });
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-2xl mx-auto text-center">
        <Spinner variant="basic" size="md" color="primary" message="Loading measurement..." />
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-2xl mx-auto text-center">
        <div className="text-lg text-red-600">{error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    </div>
  );

  if (!measurement) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-2xl mx-auto text-center">
        <div className="text-lg text-gray-600">No measurement found</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-3xl shadow-lg p-8 border border-blue-100">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-blue-900 mb-2">
                📏 Edit Measurement
              </h1>
              <p className="text-blue-700 text-lg">
                Update measurement {baby ? `for ${babyName}` : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <GrowthDataForm
          mode="edit"
          babyId={measurement.babyId}
          initialData={measurement}
          onSubmit={handleSave}
          onCancel={handleCancel}
          submitLabel={saving ? "Saving..." : "Save changes"}
          heading="Update Growth Measurement"
        />
      </div>
    </div>
  );
};

export default EditMeasurement;