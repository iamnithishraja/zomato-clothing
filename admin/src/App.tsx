import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import AdminLayout from '@/layouts/AdminLayout';
import Login from '@/pages/login';
import Signup from '@/pages/signup';
import Dashboard from '@/pages/dashboard';

function App() {
  const { isAuthenticated, loadFromStorage } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
      />
      <Route 
        path="/signup" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Signup />} 
      />
      <Route
        path="/dashboard"
        element={isAuthenticated ? <AdminLayout /> : <Navigate to="/login" replace />}
      >
        <Route index element={<Dashboard />} />
        <Route path="analytics" element={<Dashboard section="analytics" />} />
        <Route path="revenue" element={<Dashboard section="revenue" />} />
        <Route path="orders" element={<Dashboard section="orders" />} />
        <Route path="users" element={<Dashboard section="users" />} />
        <Route path="delivery" element={<Dashboard section="delivery" />} />
        <Route path="stores" element={<Dashboard section="stores" />} />
      </Route>
      <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}

export default App;
