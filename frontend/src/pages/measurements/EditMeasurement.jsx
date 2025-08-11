// src/pages/EditMeasurement.jsx
// Page for editing an existing growth measurement

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import GrowthDataForm from "../../components/measuremencomponents/GrowthDataForm";
import PrimaryButton from "../../components/PrimaryButton";
import { getGrowthMeasurement, updateGrowthData } from "../../services/growthDataApi";
import { getBaby } from "../../services/babyApi"; // Solo si necesitas el nombre

const EditMeasurement = () => {
  const { measurementId } = useParams();
  const navigate = useNavigate();

  const [measurement, setMeasurement] = useState(null);
  const [baby, setBaby] = useState(null); // Solo si necesitas el nombre
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const measurementData = await getGrowthMeasurement(measurementId);
        setMeasurement(measurementData);

        // Si necesitas el nombre del bebé
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
      await updateGrowthData(measurementId, formData);
      navigate(`/baby/${measurement.babyId}/growth/tracking`);
    } catch (err) {
      setError("Error updating measurement");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!measurement) return <div>No measurement found</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Edit measurement {baby ? `of ${baby.name}` : ""}
      </h1>
      <GrowthDataForm
        mode="edit"
        babyId={measurement.babyId}
        initialData={measurement}
        onSubmit={handleSave}
        onCancel={() => navigate(`/baby/${measurement.babyId}/growth/tracking`)}
        submitLabel={saving ? "Saving..." : "Save changes"}
      />
    </div>
  );
};

export default EditMeasurement;