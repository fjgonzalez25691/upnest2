import React from "react";
import { useNavigate } from "react-router-dom";
import { createBaby } from "../../services/babyApi";
import BabyForm from "../../components/babycomponents/BabyForm";

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
        <BabyForm
            onSubmit={handleCreate}
            onCancel={handleCancel}
            heading="Add New Baby"
            submitLabel="Create Baby"
        />
    );
};

export default AddBaby;