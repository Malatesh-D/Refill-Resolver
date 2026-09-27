import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import RefillDetailPage from './pages/RefillDetailPage';
import ProviderQueuePage from './pages/ProviderQueuePage';
import ProviderReviewPage from './pages/ProviderReviewPage';
import PatientStatusPage from './pages/PatientStatusPage';

import LoginPage from './pages/LoginPage';
import { AuthProvider, useAuth } from './context/AuthContext';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('RefillResolve ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-slate-800 border-2 border-rose-500/60 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-4 h-4 rounded-full bg-rose-500 animate-pulse"></span>
              <h2 className="text-lg font-bold text-rose-400">Application Error Detected</h2>
            </div>
            <p className="text-xs text-slate-400 mb-2">
              An unexpected client-side error occurred while rendering this view:
            </p>
            <pre className="text-xs font-mono text-rose-300 bg-slate-950 p-4 rounded-lg border border-slate-700 overflow-x-auto mb-6">
              {this.state.error?.stack || this.state.error?.toString()}
            </pre>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-bold text-xs"
              >
                Reload Page
              </button>
              <button
                onClick={() => {
                  window.location.href = '/login';
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-bold text-xs"
              >
                Return to Login
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Strict Role-Based Route Guard:
 * Ensures a patient only sees the patient portal,
 * a provider only sees provider reviews,
 * and practice staff only sees staff operations.
 */
function RoleRoute({ allowedRoles, children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    if (user.role === 'provider') {
      return <Navigate to="/provider" replace />;
    }
    if (user.role === 'patient') {
      return <Navigate to={`/patient/${user.patientId || 'PT-1042'}`} replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
            <Navbar />
            <main className="flex-1">
              <ErrorBoundary>
                <Routes>
                  {/* Public Pages */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />

                  {/* Practice Staff Only Routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <RoleRoute allowedRoles={['staff']}>
                        <DashboardPage />
                      </RoleRoute>
                    }
                  />
                  <Route
                    path="/refills/:id"
                    element={
                      <RoleRoute allowedRoles={['staff']}>
                        <RefillDetailPage />
                      </RoleRoute>
                    }
                  />

                  {/* Clinician / Provider Only Routes */}
                  <Route
                    path="/provider"
                    element={
                      <RoleRoute allowedRoles={['provider']}>
                        <ProviderQueuePage />
                      </RoleRoute>
                    }
                  />
                  <Route
                    path="/provider/refills/:id"
                    element={
                      <RoleRoute allowedRoles={['provider']}>
                        <ProviderReviewPage />
                      </RoleRoute>
                    }
                  />

                  {/* Patient Only Routes */}
                  <Route
                    path="/patient"
                    element={
                      <RoleRoute allowedRoles={['patient']}>
                        <PatientStatusPage />
                      </RoleRoute>
                    }
                  />
                  <Route
                    path="/patient/:patientId"
                    element={
                      <RoleRoute allowedRoles={['patient']}>
                        <PatientStatusPage />
                      </RoleRoute>
                    }
                  />

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </ErrorBoundary>
            </main>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
