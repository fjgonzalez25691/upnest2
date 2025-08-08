// src/pages/measurements/GrowthTracking.jsx
// Main growth tracking page showing charts and recent measurements for a specific baby

import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getGrowthData } from "../../services/growthDataApi";
import PrimaryButton from "../../components/PrimaryButton";

const GrowthTracking = () => {
    const { babyId } = useParams();
    const [measurements, setMeasurements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchMeasurements = async () => {
            setLoading(true);
            setError("");
            try {
                const data = await getGrowthData(babyId);
                setMeasurements(Array.isArray(data) ? data : []);
            } catch (err) {
                setError("Failed to load measurements.");
            } finally {
                setLoading(false);
            }
        };
        if (babyId) fetchMeasurements();
    }, [babyId]);

    if (loading) {
        return <div className="p-8 text-center">Loading measurements...</div>;
    }

    if (error) {
        return (
            <div className="p-8 text-center text-red-600">
                {error}
                <br />
                <PrimaryButton onClick={() => window.location.reload()}>Retry</PrimaryButton>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Growth Measurements</h1>
                <Link to={`/baby/${babyId}`}>
                    <PrimaryButton variant="primary">Back to Profile</PrimaryButton>
                </Link>
            </div>
            {measurements.length === 0 ? (
                <div className="text-center text-gray-500">No measurements found for this baby.</div>
            ) : (
                <table className="min-w-full bg-white rounded shadow">
                    <thead>
                        <tr>
                            <th className="py-2 px-4 border-b">Date</th>
                            <th className="py-2 px-4 border-b">Weight (g)</th>
                            <th className="py-2 px-4 border-b">Height (cm)</th>
                            <th className="py-2 px-4 border-b">Head Circumference (cm)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {measurements.map((m) => (
                            <tr key={m.dataId}>
                                <td className="py-2 px-4 border-b">{new Date(m.measurementDate).toLocaleDateString()}</td>
                                <td className="py-2 px-4 border-b">{m.measurements?.weight ?? "-"}</td>
                                <td className="py-2 px-4 border-b">{m.measurements?.height ?? "-"}</td>
                                <td className="py-2 px-4 border-b">{m.measurements?.headCircumference ?? "-"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default GrowthTracking;
