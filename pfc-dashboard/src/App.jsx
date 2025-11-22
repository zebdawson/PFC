import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AdminDashboard from './pages/AdminDashboard';
import DepartmentDashboard from './pages/DepartmentDashboard';
import Departments from './pages/Departments';
import TicketDetail from './pages/TicketDetail';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* Default route - redirect to admin dashboard */}
          <Route path="/" element={<Navigate to="/admin" replace />} />

          {/* Admin Dashboard - shows all tickets */}
          <Route path="/admin" element={<AdminDashboard />} />

          {/* Departments Overview */}
          <Route path="/departments" element={<Departments />} />

          {/* Individual Department Dashboard */}
          <Route path="/department/:departmentId" element={<DepartmentDashboard />} />

          {/* Ticket Detail View */}
          <Route path="/ticket/:ticketId" element={<TicketDetail />} />

          {/* 404 - redirect to admin */}
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
