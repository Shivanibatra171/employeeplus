import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminDashboard from './pages/AdminDashboard';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Feed from './pages/Feed';
import Rewards from './pages/Rewards';
import PointsHistory from './pages/PointsHistory';

function PrivateRoute({ children, roleRequired }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#64748b' }}>
        Loading EmployeePlus...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roleRequired && user.role !== roleRequired) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/feed'} replace />;
  }

  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/signup" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/feed'} /> : <Signup />} />
      <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/feed'} /> : <Login />} />
      
      <Route
        path="/feed"
        element={
          <PrivateRoute>
            <Feed />
          </PrivateRoute>
        }
      />

      <Route
        path="/rewards"
        element={
          <PrivateRoute>
            <Rewards />
          </PrivateRoute>
        }
      />

      <Route
        path="/points-history"
        element={
          <PrivateRoute>
            <PointsHistory />
          </PrivateRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <PrivateRoute roleRequired="admin">
            <AdminDashboard />
          </PrivateRoute>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;