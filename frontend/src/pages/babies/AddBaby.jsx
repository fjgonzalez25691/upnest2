import React from "react";
import { useNavigate } from "react-router-dom";
import { createBaby } from "../../services/babyApi";
import BabyForm from "../../components/babycomponents/AddBabyForm";
import PageShell from "../../components/layout/PageShell";

const AddBaby = () => {
    const navigate = useNavigate();

    const handleCreate = async (form) => {
        await createBaby(form);
        navigate("/dashboard");
    };

    const handleCancel = () => {
        navigate("/dashboard");
    };

    return (
        <PageShell>
            <div className="max-w-4xl mx-auto">
                <BabyForm
                    onSubmit={handleCreate}
                    onCancel={handleCancel}
                    heading="Add New Baby"
                    submitLabel="Create Baby"
                />
            </div>
        </PageShell>
    );
};

export default AddBaby;

