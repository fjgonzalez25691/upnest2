// src/pages/measurements/GrowthTracking.jsx
// Main growth tracking page showing charts and recent measurements for a specific baby

import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { getGrowthData, deleteGrowthData } from "../../services/growthDataApi";
import PrimaryButton from "../../components/PrimaryButton";
import GrowthDataList from "../../components/measuremencomponents/GrowthDataList";
import BackLink from "../../components/navigation/BackLink";
import Spinner from "../../components/Spinner";
import PageShell from "../../components/layout/PageShell";

const GrowthTracking = () => {
  const { babyId } = useParams();
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const location = useLocation();
  const navigate = useNavigate();

  const babyName = location.state?.babyName || "Baby";
  const birthDate = location.state?.birthDate || "Unknown";

  // Initial load / refresh: use prevMeasurements (passed through navigation state) for immediate paint; then background refresh
  useEffect(() => {
    const prev = location.state?.prevMeasurements;
    const updated = location.state?.updatedMeasurement;

  // If we came from an edit and have a previous list, show it immediately
    if (prev && Array.isArray(prev)) {
      // Apply optimistic replacement
      const firstPaint = updated
        ? prev.map((m) => (m.dataId === updated.dataId ? updated : m))
        : prev;
      setMeasurements(firstPaint);
      setLoading(false); // don't show loader
    } else {
      // Normal path (not returning from edit)
      setLoading(true);
    }

  // Non-blocking background refresh
    const doFetch = async () => {
      try {
        const data = await getGrowthData(babyId);
        let list = Array.isArray(data) ? data : [];
        if (updated) {
          list = list.map((m) => (m.dataId === updated.dataId ? updated : m));
        }
        setMeasurements(list);
      } catch (err) {
        console.error("Error loading measurements:", err);
        setError("Failed to load measurements. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (babyId) doFetch();
    // Note: we only depend on babyId; location.state is not stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [babyId]);

  // Effect 2: if updatedMeasurement changes, patch in memory without refetch
  useEffect(() => {
    const updated = location.state?.updatedMeasurement;
    if (!updated) return;
    setMeasurements((prev) =>
      prev.map((m) => (m.dataId === updated.dataId ? updated : m))
    );
  }, [location.state?.updatedMeasurement]);

  const handleEdit = (measurement) => {
    navigate(`/edit-measurement/${measurement.dataId}`, {
      state: {
        babyName,
        birthDate,
        prevMeasurements: measurements,
      },
    });
  };

  const handleDelete = async (measurement) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this measurement? This action cannot be undone."
      )
    ) {
      return;
    }
    try {
      await deleteGrowthData(measurement.dataId);
      setMeasurements((prev) =>
        prev.filter((m) => m.dataId !== measurement.dataId)
      );
    } catch (err) {
      console.error("Error deleting measurement:", err);
      alert("Failed to delete measurement. Please try again.");
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="max-w-4xl mx-auto text-center">
          <Spinner variant="basic" size="md" color="primary" message="Loading measurements..." />
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell>
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-lg text-red-600 mb-4">{error}</div>
          <PrimaryButton onClick={() => window.location.reload()}>
            Retry
          </PrimaryButton>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <BackLink to={`/baby/${babyId}`}>
            Back to Profile
          </BackLink>
        </div>
        <div className="bg-white rounded-3xl shadow-lg p-8 border border-blue-100">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">
              {babyName}'s Growth Measurements
            </h1>
          </div>
          {measurements.length === 0 ? (
            <div className="text-center text-gray-500">
              No measurements found for this baby.
            </div>
          ) : (
            <GrowthDataList
              measurements={measurements}
              birthDate={birthDate}
              loading={loading}
              error={error}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default GrowthTracking;
