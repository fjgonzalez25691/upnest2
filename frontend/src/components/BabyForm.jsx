import React, { useState } from "react";
import PrimaryButton from "./PrimaryButton";

const BabyForm = ({
    initialData = {},
    onSubmit,
    heading = "Baby Form",
    submitLabel = "Save Baby",
}) => {
    const [form, setForm] = useState({
        name: initialData.name || "",
        dateOfBirth: initialData.dateOfBirth || "",
        gender: initialData.gender || "",
        premature: initialData.premature || false,
        gestationalWeek: initialData.gestationalWeek || "",
        birthWeight: initialData.birthWeight || "",
        birthHeight: initialData.birthHeight || "",
        headCircumference: initialData.headCircumference || "",
    });
    const [error, setError] = useState("");

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!onSubmit) return;
        try {
            // Convert numeric fields to Number before sending
            const dataToSend = {
                ...form,
                birthWeight: form.birthWeight ? Number(form.birthWeight) : undefined,
                birthHeight: form.birthHeight ? Number(form.birthHeight) : undefined,
                headCircumference: form.headCircumference ? Number(form.headCircumference) : undefined,
                gestationalWeek: form.gestationalWeek ? Number(form.gestationalWeek) : undefined,
            };
            await onSubmit(dataToSend);
        } catch (err) {
            setError(
                "Failed to submit. Please check the data and try again."
            );
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="max-w-xl mx-auto p-8 bg-white rounded-3xl shadow-lg space-y-6"
        >
            <h2 className="text-2xl font-bold mb-6 text-blue-700">{heading}</h2>

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

            <div>
                <label className="block font-semibold mb-2">Head Circumference (cm)</label>
                <input
                    type="number"
                    name="headCircumference"
                    value={form.headCircumference}
                    onChange={e => {
                        // Allows comma or dot as decimal separator
                        const value = typeof e.target.value === "string"
                            ? e.target.value.replace(",", ".").replace(/\s/g, "")
                            : e.target.value;
                        handleChange({ ...e, target: { ...e.target, value } });
                    }}
                    min={20}
                    max={60}
                    step="0.1"
                    className="w-full p-4 rounded-xl border border-green-100"
                />
            </div>

            <div className="flex gap-4 mt-6">
                <PrimaryButton variant="add" type="submit" className="flex-1">
                    {submitLabel}
                </PrimaryButton>
                <PrimaryButton
                    variant="cancel"
                    type="button"
                    className="flex-1"
                    onClick={() => {
                        // Recommended action: navigate to dashboard or clear the form
                        // If you use react-router-dom:
                        window.location.href = "/dashboard";
                        // Or if you have an onCancel callback:
                        // onCancel && onCancel();
                    }}
                >
                    Cancel
                </PrimaryButton>
            </div>
            {error && <p className="text-red-600 mt-4">{error}</p>}
        </form >
    );
};

export default BabyForm;