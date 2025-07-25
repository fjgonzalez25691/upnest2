import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createBaby } from "../services/babyApi";
import PrimaryButton from "../components/PrimaryButton";

const AddBaby = () => {
    const [form, setForm] = useState({
        name: "",
        dateOfBirth: "",
        gender: "",
        premature: false,
        gestationalWeek: "",
        birthWeight: "",
        birthHeight: ""
    });
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleChange = e => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const handleSubmit = async e => {
        e.preventDefault();
        try {
            await createBaby(form);
            navigate("/dashboard");
        } catch (err) {
            setError("Failed to create baby. Please check the data and try again.");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-xl mx-auto p-8 bg-white rounded-3xl shadow-lg space-y-6">
            <h2 className="text-2xl font-bold mb-6 text-blue-700">Add New Baby</h2>

            <div>
                <label className="block font-semibold mb-2">Full Name</label>
                <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="w-full p-4 rounded-xl border border-blue-100"
                />
            </div>

            <div>
                <label className="block font-semibold mb-2">Date of Birth</label>
                <input
                    type="date"
                    name="dateOfBirth"
                    value={form.dateOfBirth}
                    onChange={handleChange}
                    required
                    className="w-full p-4 rounded-xl border border-blue-100"
                />
            </div>

            <div>
                <label className="block font-semibold mb-2">Gender</label>
                <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    required
                    className="w-full p-4 rounded-xl border border-blue-100"
                >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                </select>
            </div>

            <div className="flex items-center gap-3">
                <input
                    type="checkbox"
                    name="premature"
                    checked={form.premature}
                    onChange={handleChange}
                    className="h-5 w-5"
                />
                <label className="font-semibold">Premature</label>
            </div>

            {form.premature && (
                <div>
                    <label className="block font-semibold mb-2">Gestational Week</label>
                    <input
                        type="number"
                        name="gestationalWeek"
                        value={form.gestationalWeek}
                        onChange={handleChange}
                        min={20}
                        max={42}
                        className="w-full p-4 rounded-xl border border-blue-100"
                    />
                </div>
            )}

            <div>
                <label className="block font-semibold mb-2">Birth Weight (grams)</label>
                <input
                    type="number"
                    name="birthWeight"
                    value={form.birthWeight}
                    onChange={handleChange}
                    min={500}
                    max={6000}
                    className="w-full p-4 rounded-xl border border-green-100"
                />
            </div>

            <div>
                <label className="block font-semibold mb-2">Birth Height (cm)</label>
                <input
                    type="number"
                    name="birthHeight"
                    value={form.birthHeight}
                    onChange={handleChange}
                    min={20}
                    max={60}
                    className="w-full p-4 rounded-xl border border-green-100"
                />
            </div>

            <PrimaryButton type="submit" className="w-full mt-6">Create Baby</PrimaryButton>
            {error && <p className="text-red-600 mt-4">{error}</p>}
        </form>
    );
};

export default AddBaby;