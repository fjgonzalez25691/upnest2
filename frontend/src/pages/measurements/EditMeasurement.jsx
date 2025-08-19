// src/pages/EditMeasurement.jsx
// Page for editing an existing growth measurement

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import GrowthDataForm from "../../components/measuremencomponents/GrowthDataForm";
import PrimaryButton from "../../components/PrimaryButton";
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
        setError("Error loading data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [measurementId]);

  const handleSave = async (formData) => {
    setSaving(true);
    try {
        // Save current percentiles BEFORE editing
        const prevPercentiles = measurement.percentiles || {};
        await updateGrowthData(measurementId, formData);

        // Poll until percentiles change
        const startTime = Date.now();
        let updated = false;
        let retries = 0;
        while (!updated && retries < 40) {
            const fresh = await getGrowthMeasurement(measurementId);
            
            // Have the percentiles changed?
            if (fresh.percentiles && (
                fresh.percentiles.weight !== prevPercentiles.weight ||
                fresh.percentiles.height !== prevPercentiles.height ||
                fresh.percentiles.headCircumference !== prevPercentiles.headCircumference
            )) {
                updated = true;
            } else {
                await new Promise(res => setTimeout(res, 200)); // Wait 0.2s
                retries++;
            }
        }
        const elapsed = Date.now() - startTime;
        console.log(`Polling took ${elapsed}ms`);

        // Navigate only when they are updated
        navigate(`/baby/${measurement.babyId}/growth/tracking`, {
            state: {
                babyName: babyName || baby?.name,
                birthDate: birthDate || baby?.dateOfBirth,
                refresh: Date.now()
            }
        });
    } catch (err) {
        setError("Error updating measurement");
    } finally {
        setSaving(false);
    }
  };

  const handleCancel = () => {
    // Navigate back without saving
    navigate(`/baby/${measurement.babyId}/growth/tracking`, {
      state: {
        babyName: babyName || baby?.name,
        birthDate: birthDate || baby?.dateOfBirth
      }
    });
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!measurement) return <div>No measurement found</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Edit measurement {baby ? `of ${babyName}` : ""}
      </h1>
      <GrowthDataForm
        mode="edit"
        babyId={measurement.babyId}
        initialData={measurement}
        onSubmit={handleSave}
        onCancel={handleCancel}
        submitLabel={saving ? "Saving..." : "Save changes"}
      />
    </div>
  );
};

export default EditMeasurement;