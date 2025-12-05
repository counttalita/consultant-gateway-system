import React from 'react';

export default function ConsultantDashboard() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Status Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-medium text-gray-500">Profile Status</h3>
                    <p className="mt-2 text-3xl font-bold text-green-600">Active</p>
                </div>

                {/* Projects Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-medium text-gray-500">Active Projects</h3>
                    <p className="mt-2 text-3xl font-bold text-indigo-600">2</p>
                </div>

                {/* Tasks Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-medium text-gray-500">Pending Tasks</h3>
                    <p className="mt-2 text-3xl font-bold text-orange-600">1</p>
                </div>
            </div>

            {/* Recent Activity or Notifications could go here */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Welcome back!</h2>
                <p className="text-gray-600">
                    Please ensure your profile information is up to date. You can manage your details in the Profile section.
                </p>
            </div>
        </div>
    );
}
