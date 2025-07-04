import React from "react";
import { useAuth } from "react-oidc-context";

// Components
import PrimaryButton from "../components/PrimaryButton.jsx";



export default function Landing() {
    const auth = useAuth();
    return (
        <div className="flex flex-col min-h-[calc(100vh-120px)] justify-center items-center bg-gray-50">
            <div className="bg-white rounded-lg shadow p-10 flex flex-col items-center gap-4">
                {auth.isAuthenticated ? (
                    <div className="flex flex-col items-center gap-4 w-full">
                        <h1 className="text-2xl font-bold text-green-700 mb-2">
                            Welcome, {auth.user?.profile?.name || auth.user?.profile?.email || "User"}!
                        </h1>
                        <div className="bg-gray-100 rounded p-6 w-full max-w-md shadow flex flex-col gap-2">
                            <div>
                                <span className="font-semibold text-gray-700">Email:</span>{" "}
                                <span className="text-gray-900">{auth.user?.profile?.email}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-700">Username:</span>{" "}
                                <span className="text-gray-900">{auth.user?.profile?.username}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-700">Email verified:</span>{" "}
                                <span className="text-gray-900">{String(auth.user?.profile?.email_verified)}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-700">Token expires at:</span>{" "}
                                <span className="text-gray-900">
                                    {auth.user?.expires_at
                                        ? new Date(auth.user.expires_at * 1000).toLocaleString()
                                        : "N/A"}
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <h1 className="text-3xl font-bold text-primary mb-2">Welcome to UpNestApp</h1>
                        <p className="text-lg text-gray-600">🚧 Page under construction 🚧</p>
                    </>
                )}
            </div>
        </div>
    );
}