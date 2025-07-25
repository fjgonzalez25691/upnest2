import React from "react";
import { useNavigate } from "react-router-dom";
import { createBaby } from "../services/babyApi";
import BabyForm from "../components/BabyForm";

const AddBaby = () => {
    const navigate = useNavigate();

    const handleCreate = async (formData) => {
        await createBaby(formData);
        navigate("/dashboard");
    };

    return (
        <BabyForm
            onSubmit={handleCreate}
            heading="Add New Baby"
            submitLabel="Create Baby"
        />
    );
};

export default AddBaby;
