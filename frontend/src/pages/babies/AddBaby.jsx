import React from "react";
import { useNavigate } from "react-router-dom";
import { createBaby } from "../../services/babyApi";
import BabyForm from "../../components/babycomponents/AddBabyForm";

const AddBaby = () => {
    const navigate = useNavigate();

    const handleCreate = async (form) => {
        try {
            await createBaby(form);
            navigate("/dashboard");
        } catch (err) {
            // El manejo de error ya está en BabyForm
            throw err;
        }
    };

    const handleCancel = () => {
        navigate("/dashboard");
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
            <div className="max-w-4xl mx-auto">
                <BabyForm
                    onSubmit={handleCreate}
                    onCancel={handleCancel}
                    heading="Add New Baby"
                    submitLabel="Create Baby"
                />
            </div>
        </div>
    );
};

export default AddBaby;

