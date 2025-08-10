// src/components/BabyProfileForm.jsx
// Reusable component for displaying baby profile information in a form layout
import React, { useState } from "react";
import PrimaryButton from "../PrimaryButton.jsx";
import TextBox from "../TextBox.jsx";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { calculateAge } from "../../utils/dateUtils.js";
import { normalizeNumber } from "../../utils/numberUtils.js";

const BabyProfileForm = ({ baby, isEditable = false, onSave, onCancel, onEdit, onDelete }) => {
  const [formData, setFormData] = useState(baby ? { ...baby } : {});
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Validates the form data
  const validate = (data) => {
    const errs = {};
    if (data.premature) {
      if (!data.gestationalWeek) {
        errs.gestationalWeek = "Required";
      } else if (data.gestationalWeek < 20 || data.gestationalWeek > 37) {
        errs.gestationalWeek = "Must be between 20 and 37";
      }
    }
    // Add more validation rules as needed
    return errs;
  };

  // Formats a date as YYYY-MM-DD (ISO)
  const formatDateISO = (date) =>
    date ? new Date(date).toISOString().slice(0, 10) : "";

  if (!baby) {
    return (
      <div className="bg-white rounded-3xl shadow-lg p-8 border border-blue-100">
        <div className="text-center py-8">
          <p className="text-gray-500">No baby data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-lg p-8 border border-blue-100">
      {/* Baby Header */}
      <div className="flex items-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center mr-6 shadow-lg">
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">{baby.name}</h2>
          <p className="text-gray-600 text-lg">{baby.gender}</p>
          {/* Age is shown in header using the new utility */}
          <p className="text-gray-500 text-base">{calculateAge(baby.dateOfBirth).readable}</p>
        </div>
      </div>

      {/* Baby Details Form */}
      <div className="space-y-6">
        {/* Basic Information Section */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <h3 className="text-lg font-medium mb-3">Basic Information</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <TextBox
              label="Name"
              name="name"
              value={formData.name || ""}
              onChange={handleChange}
              editable={isEditable}
              required
            />

            {isEditable ? (
              <div>
                <label className="textbox-label textbox-label-required" htmlFor="dateOfBirth">
                  Date of Birth
                </label>
                <DatePicker
                  id="dateOfBirth"
                  name="dateOfBirth"
                  selected={formData.dateOfBirth ? new Date(formData.dateOfBirth) : null}
                  onChange={date => handleChange({
                    target: {
                      name: "dateOfBirth",
                      value: date ? date.toISOString().slice(0, 10) : ""
                    }
                  })}
                  dateFormat="yyyy-MM-dd"
                  className="textbox-input-edit w-full"
                  placeholderText="YYYY-MM-DD"
                  required
                />
              </div>
            ) : (
              <TextBox
                label="Date of Birth"
                name="dateOfBirth"
                value={formData.dateOfBirth || ""}
                editable={false}
                type="date"
                required
              />
            )}

            <TextBox
              label="Gender"
              name="gender"
              value={formData.gender || ""}
              onChange={handleChange}
              editable={isEditable}
              type="select"
              options={[
                { value: "male", label: "Male" },
                { value: "female", label: "Female" }
              ]}
              required
            />

            <TextBox
              label="Profile Created"
              name="profileCreated"
              value={formatDateISO(baby.createdAt)}
              editable={false}
              type="date"
            />
          </div>
        </div>

        {/* Birth Conditions Section */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <h3 className="text-lg font-medium mb-3">Birth Conditions</h3>
          <div className="space-y-4">
            {isEditable ? (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="checkbox"
                    id="premature"
                    name="premature"
                    checked={!!formData.premature}
                    onChange={handleChange}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="premature" className="font-medium text-gray-700">Premature Birth</label>
                </div>
                
                {formData.premature && (
                  <TextBox
                    label="Gestational Week"
                    name="gestationalWeek"
                    type="number"
                    value={formData.gestationalWeek || ""}
                    onChange={e => {
                      handleChange(e);
                      const week = Number(e.target.value);
                      if (week > 37) {
                        setFormData(prev => ({
                          ...prev,
                          premature: false,
                          gestationalWeek: ""
                        }));
                      }
                    }}
                    editable={isEditable}
                    min={20}
                    max={37}
                    required
                    suffix="weeks"
                    placeholder="e.g., 36"
                    error={errors.gestationalWeek}
                  />
                )}
              </div>
            ) : (
              <TextBox
                label="Birth Status"
                name="birthStatus"
                value={baby.premature ? `Premature (${baby.gestationalWeek} weeks)` : 'Full Term'}
                editable={false}
                type="string"
              />
            )}
          </div>
        </div>

        {/* Birth Measurements Section */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <h3 className="text-lg font-medium mb-3">Birth Measurements</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <TextBox
              label="Birth Weight"
              name="birthWeight"
              type="number"
              value={formData.birthWeight || ""}
              onChange={handleChange}
              editable={isEditable}
              suffix="g"
              placeholder="e.g., 3200"
              min={500}
              max={6000}
              renderValue={v => v ? `${v} g` : "Not recorded"}
            />

            <TextBox
              label="Birth Height"
              name="birthHeight"
              type="number"
              value={formData.birthHeight || ""}
              onChange={e => {
                const normalized = normalizeNumber(e.target.value);
                setFormData(prev => ({
                  ...prev,
                  birthHeight: normalized
                }));
              }}
              editable={isEditable}
              suffix="cm"
              placeholder="e.g., 50.5"
              step="0.1"
              min={20}
              max={60}
              renderValue={v => v ? `${v} cm` : "Not recorded"}
            />

            <TextBox
              label="Head Circumference"
              name="headCircumference"
              type="number"
              value={formData.headCircumference || ""}
              onChange={e => {
                const normalized = normalizeNumber(e.target.value);
                setFormData(prev => ({
                  ...prev,
                  headCircumference: normalized
                }));
              }}
              editable={isEditable}
              suffix="cm"
              placeholder="e.g., 35.2"
              step="0.1"
              min={20}
              max={60}
              renderValue={v => v ? `${v} cm` : "Not recorded"}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons for Edit Mode */}
      <div className="gradient-textarea-info rounded-xl shadow p-6 mt-8 border border-blue-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Profile Actions</h2>
        <div className="grid grid-cols-1  md:grid-cols-2  justify-items-center gap-4">
          {!isEditable && (
            <>
              <PrimaryButton variant="edit" className="w-60" onClick={onEdit}>
                Edit
              </PrimaryButton>
              <PrimaryButton variant="danger" className="w-60" onClick={onDelete}>
                Delete Profile
              </PrimaryButton>
            </>
           
          )}
             
          {isEditable && (
            <>
              <PrimaryButton
                type="submit"
                variant="primary"
                className="w-60"
                onClick={() => {
                  const dataToSend = {
                    ...formData,
                    birthWeight: formData.birthWeight ? Number(formData.birthWeight) : undefined,
                    birthHeight: formData.birthHeight ? Number(formData.birthHeight) : undefined,
                    headCircumference: formData.headCircumference ? Number(formData.headCircumference) : undefined,
                    gestationalWeek: formData.gestationalWeek ? Number(formData.gestationalWeek) : undefined,
                  };
                  const validationErrors = validate(dataToSend);
                  setErrors(validationErrors);
                  if (Object.keys(validationErrors).length > 0) return;
                  onSave(dataToSend);
                }}
              >
                Save
              </PrimaryButton>
              <PrimaryButton type="button" variant="cancel" className="w-60" onClick={onCancel}>
                Cancel
              </PrimaryButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BabyProfileForm;