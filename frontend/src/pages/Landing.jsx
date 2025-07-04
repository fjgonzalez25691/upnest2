import React from "react";
import { useAuth } from "react-oidc-context";

// Components
import PrimaryButton from "../components/PrimaryButton.jsx";



export default function Landing() {
    return (
        <div className="flex flex-col min-h-[calc(100vh-120px)] justify-center items-center bg-gray-50">
            <div className="bg-white rounded-lg shadow p-10 flex flex-col items-center gap-4">
                <h1 className="text-3xl font-bold text-primary mb-2">Welcome to UpNestApp</h1>
                <p className="text-lg text-gray-600">🚧 Page under construction 🚧</p>
            </div>
        </div>
    );
}