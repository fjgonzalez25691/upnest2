import React, { useState } from "react";
import PrimaryButton from "./PrimaryButton";
import TextBox from "./TextBox";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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

    // Normaliza decimales (coma o punto) para los campos decimales
    const handleDecimalChange = (name) => (e) => {
        const value = typeof e.target.value === "string"
            ? e.target.value.replace(",", ".").replace(/\s/g, "")
            : e.target.value;
        setForm((prev) => ({
            ...prev,
            [name]: value,
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

            <TextBox
                label="Full Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                editable={true}
                required
            />

            <div>
                <label className="textbox-label" htmlFor="dateOfBirth">Date of Birth</label>
                <DatePicker
                    id="dateOfBirth"
                    name="dateOfBirth"
                    selected={form.dateOfBirth ? new Date(form.dateOfBirth) : null}
                    onChange={date => setForm(prev => ({
                        ...prev,
                        dateOfBirth: date ? date.toISOString().slice(0, 10) : ""
                    }))}
                    dateFormat="yyyy-MM-dd"
                    className="textbox-input-edit w-full"
                    placeholderText="YYYY-MM-DD"
                    required
                />
            </div>

            <TextBox
                label="Gender"
                name="gender"
                value={form.gender}
                onChange={handleChange}
                editable={true}
                type="select"
                options={[
                    { value: "", label: "Select gender" },
                    { value: "male", label: "Male" },
                    { value: "female", label: "Female" }
                ]}
                required
            />

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
                <TextBox
                    label="Gestational Week"
                    name="gestationalWeek"
                    value={form.gestationalWeek}
                    onChange={handleChange}
                    editable={true}
                    type="number"
                    min={20}
                    max={42}
                    required
                />
            )}

            <TextBox
                label="Birth Weight (grams)"
                name="birthWeight"
                value={form.birthWeight}
                onChange={handleChange}
                editable={true}
                type="number"
                min={500}
                max={6000}
                suffix="g"
            />

            <TextBox
                label="Birth Height (cm)"
                name="birthHeight"
                value={form.birthHeight}
                onChange={e => {
                    const normalized = e.target.value.replace(",", ".").replace(/\s/g, "");
                    setForm(prev => ({
                        ...prev,
                        birthHeight: normalized
                    }));
                }}
                editable={true}
                type="number"
                min={20}
                max={60}
                step="0.1"
                suffix="cm"
            />

            <TextBox
                label="Head Circumference (cm)"
                name="headCircumference"
                value={form.headCircumference}
                onChange={e => {
                    const normalized = e.target.value.replace(",", ".").replace(/\s/g, "");
                    setForm(prev => ({
                        ...prev,
                        headCircumference: normalized
                    }));
                }}
                editable={true}
                type="number"
                min={20}
                max={60}
                step="0.1"
                suffix="cm"
            />

            <div className="flex gap-4 mt-6">
                <PrimaryButton variant="add" type="submit" className="flex-1">
                    {submitLabel}
                </PrimaryButton>
                <PrimaryButton
                    variant="cancel"
                    type="button"
                    className="flex-1"
                    onClick={() => {
                        window.location.href = "/dashboard";
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