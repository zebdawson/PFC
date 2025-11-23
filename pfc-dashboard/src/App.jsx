import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AdminDashboard from './pages/AdminDashboard';
import DepartmentDashboard from './pages/DepartmentDashboard';
import Departments from './pages/Departments';
import TicketDetail from './pages/TicketDetail';
import IntakeForm from './pages/IntakeForm';
import SolarLandingPage from './pages/SolarLandingPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Solar Landing Page - no layout (full screen) */}
        <Route path="/" element={<SolarLandingPage />} />

        {/* Intake Form - no layout (full screen) */}
        <Route path="/intake" element={<IntakeForm />} />

        {/* All other routes with layout */}
        <Route path="/admin" element={<Layout><AdminDashboard /></Layout>} />
        <Route path="/departments" element={<Layout><Departments /></Layout>} />
        <Route path="/department/:departmentId" element={<Layout><DepartmentDashboard /></Layout>} />
        <Route path="/ticket/:ticketId" element={<Layout><TicketDetail /></Layout>} />
        <Route path="*" element={<Layout><Navigate to="/admin" replace /></Layout>} />
      </Routes>
    </Router>
  );
}

export default App;
