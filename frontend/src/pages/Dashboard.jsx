// src/pages/Dashboard.jsx
// Dashboard component displaying user information and babies list
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { getBabies } from "../services/babyApi";
import PrimaryButton from "../components/PrimaryButton";

const Dashboard = () => {
  const { user, userId, email, name } = useCurrentUser();
  const [babies, setBabies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Debug useEffect - añadido para troubleshooting
  useEffect(() => {
    console.log('🔍 Dashboard Debug:');
    console.log('🔍 User:', user);
    console.log('🔍 UserId:', userId);
    console.log('🔍 IsAuthenticated:', user ? 'Yes' : 'No');
    console.log('🔍 User token:', user?.id_token ? 'Present' : 'Missing');
    console.log('🔍 localStorage keys:', Object.keys(localStorage));
  }, [user, userId]);

  // Fetch user's babies on component mount
  useEffect(() => {
    const fetchBabies = async () => {
      try {
        setLoading(true);
        const babiesData = await getBabies();
        console.log("Babies data received:", babiesData);
        
        // Ensure babiesData is always an array
        const babiesArray = Array.isArray(babiesData) ? babiesData : 
                           (babiesData?.data && Array.isArray(babiesData.data)) ? babiesData.data : [];
        
        setBabies(babiesArray);
      } catch (err) {
        console.error("Error fetching babies:", err);
        setError("Failed to load babies. Please try again.");
        setBabies([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchBabies();
    }
  }, [userId]);

  // The ProtectedRoute component handles authentication redirect
  // So we can assume user is authenticated here
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-5xl mx-auto">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            My Dashboard
          </h1>
        </div>
        
        {/* Welcome message */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-3xl p-8 mb-8 shadow-lg">
          <h2 className="text-2xl font-semibold mb-3">
            Welcome back, {name || 'Parent'}!
          </h2>
          <p className="text-blue-100 text-lg">
            Track your baby's growth with confidence using WHO percentile standards. 
            Every measurement tells a story of healthy development.
          </p>
        </div>

        {/* My Babies Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              My Babies
            </h2>
            <Link to="/add-baby">
              <PrimaryButton>
                <span className="flex items-center">
                  Add New Baby
                </span>
              </PrimaryButton>
            </Link>
          </div>

          {loading ? (
            <div className="bg-surface p-6 rounded-2xl shadow-md text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading babies...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <p className="text-red-600">{error}</p>
            </div>
          ) : babies.length === 0 ? (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-3xl shadow-md text-center border border-purple-100">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Start Your Journey</h3>
              <p className="text-gray-600 mb-6">
                Add your first baby to begin tracking their growth and development with WHO-standard percentiles.
              </p>
              <Link to="/add-baby">
                <PrimaryButton>Add Your First Baby</PrimaryButton>
              </Link>
            </div>
          ) : (
            <div className="flex flex-wrap gap-6 justify-start">
              {babies.map((baby) => (
                <div key={baby.babyId} className="bg-white p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-100 hover:border-purple-200 min-w-[320px] max-w-[380px] flex-grow">
                  <div className="flex items-center mb-5">
                    <div className="w-14 h-14 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center mr-4 shadow-md">
                      <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 mb-1">{baby.name}</h3>
                      <p className="text-sm text-gray-500 font-medium">
                        {Math.floor((new Date() - new Date(baby.dateOfBirth)) / (1000 * 60 * 60 * 24 * 30.44))} months old
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 mb-5">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600 block">Birthday</span>
                        <span className="font-semibold text-gray-800">{new Date(baby.dateOfBirth).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 block">Gender</span>
                        <span className="font-semibold text-gray-800">{baby.gender}</span>
                      </div>
                      {baby.premature && (
                        <div className="col-span-2">
                          <span className="text-gray-600 block">Gestational Age</span>
                          <span className="font-semibold text-orange-600">{baby.gestationalWeek} weeks</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Link to={`/baby/${baby.babyId}`} className="flex-1">
                      <PrimaryButton variant="blue" className="w-full text-sm">
                        View Profile
                      </PrimaryButton>
                    </Link>
                    <Link to={`/add-growth-data/${baby.babyId}`} className="flex-1">
                      <PrimaryButton variant="green" className="w-full text-sm">
                        Add Data
                      </PrimaryButton>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-green-100">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              Quick Actions
            </h2>
            <div className="space-y-4">
              <Link to="/add-baby">
                <PrimaryButton variant="blue" className="w-full">
                  Add New Baby
                </PrimaryButton>
              </Link>
              <Link to="/percentiles">
                <PrimaryButton variant="purple" className="w-full">
                  View Percentiles
                </PrimaryButton>
              </Link>
              <Link to="/ai-chat">
                <PrimaryButton variant="emerald" className="w-full">
                  AI Assistant
                </PrimaryButton>
              </Link>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-blue-100">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              Account Info
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium text-gray-800">{name || 'Not set'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium text-gray-800 text-sm">{email || 'Not provided'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Verified:</span>
                <span className={`font-medium ${user?.profile?.email_verified ? 'text-green-600' : 'text-orange-600'}`}>
                  {user?.profile?.email_verified ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Babies:</span>
                <span className="font-bold text-blue-600">{babies.length}</span>
              </div>
            </div>
          </div>

          {/* Growth Insights */}
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-purple-100">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              Growth Insights
            </h2>
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl">
                <h3 className="font-semibold text-gray-800 mb-2">WHO Standards</h3>
                <p className="text-sm text-gray-600">
                  All percentile calculations use official WHO growth standards for accurate tracking.
                </p>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl">
                <h3 className="font-semibold text-gray-800 mb-2">AI Powered</h3>
                <p className="text-sm text-gray-600">
                  Get personalized insights and recommendations based on your baby's growth patterns.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl p-8 border border-amber-200">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Need Help Getting Started?
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              UpNest is designed to be intuitive for parents of all technical backgrounds. 
              Add your baby's information and start tracking their growth with confidence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/add-baby">
                <PrimaryButton variant="blue">
                  Add Your First Baby
                </PrimaryButton>
              </Link>
              <Link to="/percentiles">
                <PrimaryButton variant="purple">
                  Learn About Percentiles
                </PrimaryButton>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
