import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LocaleProvider } from "./context/LocaleContext";
import Layout from "./components/Layout";
import CursorGlow from "./components/CursorGlow";
import ScrollProgress from "./components/ScrollProgress";
import "./i18n";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import HistoryPage from "./pages/HistoryPage";
import PointsPage from "./pages/PointsPage";

function PrivateRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-600">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-accent-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-text-tertiary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

function AppContent() {
  return (
    <BrowserRouter>
      <CursorGlow />
      <ScrollProgress />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes with Layout */}
        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="points" element={<PointsPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <LocaleProvider>
        <AppContent />
      </LocaleProvider>
    </AuthProvider>
  );
}

export default App;
