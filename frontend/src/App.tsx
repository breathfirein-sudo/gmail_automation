import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import TransactionsPage from './pages/Transactions';
import VerificationPage from './pages/Verification';
import ManualReviewPage from './pages/ManualReview';
import { useAuth } from './hooks/useAuth';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/verification" replace />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="verification" element={<VerificationPage />} />
        <Route path="manual-review" element={<ManualReviewPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/verification" replace />} />
    </Routes>
  );
}
