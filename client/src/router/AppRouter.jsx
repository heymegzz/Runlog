import { Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import ProtectedRoute from './ProtectedRoute';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import NotFound from '../pages/NotFound';

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          {/* We will build these out in later phases */}
          <Route path="/jobs" element={<div className="page-content">Jobs Coming Soon</div>} />
          <Route path="/executions" element={<div className="page-content">Executions Coming Soon</div>} />
          <Route path="/settings/team" element={<div className="page-content">Settings Coming Soon</div>} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRouter;
