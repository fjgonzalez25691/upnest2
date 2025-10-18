import React, { useState } from "react";
import { useAuth } from "react-oidc-context";
import PrimaryButton from "../components/PrimaryButton.jsx";

// Icono simple para copiar
const CopyIcon = () => (
    <svg width="20" height="20" fill="currentColor" className="inline ml-2 cursor-pointer">
        <rect x="4" y="4" width="12" height="12" rx="2" fill="#4ade80" />
        <rect x="7" y="7" width="9" height="9" rx="1" fill="#fff" stroke="#4ade80" strokeWidth="1" />
    </svg>
);

export default function Landing() {
    const auth = useAuth();
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (auth.user?.id_token) {
            navigator.clipboard.writeText(auth.user.id_token);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="flex flex-col min-h-[calc(100vh-120px)] justify-center items-center bg-gray-50">
            <div className="card-basic flex flex-col items-center gap-4" style={{padding: '2.5rem'}}>
                {auth.isAuthenticated ? (
                    <div className="flex flex-col items-center gap-4 w-full">
                        <h1 className="text-2xl font-bold text-green-700 mb-2">
                            Welcome, {auth.user?.profile?.name || auth.user?.profile?.given_name || "User"}!
                        </h1>
                        <div className="bg-gray-100 rounded p-6 w-full max-w-md shadow flex flex-col gap-2">
                            <div>
                                <span className="font-semibold text-gray-700">Email:</span>{" "}
                                <span className="text-gray-900">{auth.user?.profile?.email}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-700">User ID:</span>{" "}
                                <span className="text-gray-900">{auth.user?.profile?.sub || "N/A"}</span>
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
                            <div>
                                <span className="font-semibold text-gray-700">JWT Token:</span>
                                <span className="text-xs break-all select-all bg-gray-200 p-1 rounded ml-2">
                                    {auth.user?.id_token
                                        ? auth.user.id_token.slice(0, 20) + "..."
                                        : "N/A"}
                                </span>
                                <span onClick={handleCopy} title="Copy token">
                                    <CopyIcon />
                                </span>
                                {copied && (
                                    <span className="text-green-500 ml-2 text-xs">Copied!</span>
                                )}
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