import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getBabyById, updateBaby, deleteBaby } from "../../services/babyApi";
import { getGrowthData } from "../../services/growthDataApi";
import PrimaryButton from "../../components/PrimaryButton";
import BabyProfileForm from "../../components/babycomponents/BabyProfileForm";

const BabyProfile = () => {
  const { babyId } = useParams();
  const [baby, setBaby] = useState(null);
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [b, g] = await Promise.all([
          getBabyById(babyId),
          getGrowthData(babyId)
        ]);
        setBaby(b);
        setMeasurements(g);
      } catch (e) {
        setError("Failed to load baby profile. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [babyId]);

  const handleSave = async (updatedData) => {
    setSaving(true);
    setError("");
    try {
      const res = await updateBaby(babyId, updatedData, { syncRecalc: true });
      setBaby(res.baby);
      const fresh = await getGrowthData(babyId);
      setMeasurements(fresh);
      setEditMode(false);
    } catch (e) {
      setError("Failed to update baby profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => setEditMode(false);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this baby profile? This action cannot be undone.")) {
      try {
        setLoading(true);
        await deleteBaby(babyId);
        navigate("/dashboard");
      } catch (e) {
        setError("Failed to delete baby profile. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!baby) return <div>Baby not found</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">{baby.name}</h1>
      {editMode ? (
        <BabyProfileForm
          initialData={baby}
          onSubmit={handleSave}
          onCancel={handleCancel}
          submitLabel={saving ? "Saving..." : "Save"}
        />
      ) : (
        <div>
          <p>Date of birth: {baby.dateOfBirth}</p>
          <p>Sex: {baby.gender}</p>
          <p>Measurements: {measurements.length}</p>
          <div className="mt-4 flex gap-4">
            <PrimaryButton onClick={() => setEditMode(true)}>Edit</PrimaryButton>
            <Link to={`/baby/${babyId}/growth/tracking`}>View growth</Link>
            <button className="text-red-500" onClick={handleDelete}>Delete</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BabyProfile;
