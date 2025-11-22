import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Shield, Users, Calendar, MapPin, FileText } from 'lucide-react';
import axios from 'axios';

const IntakeForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    // Client Information
    clientName: '',
    email: '',
    phone: '',
    companyName: '',

    // Request Details
    requestType: '',
    urgencyLevel: 'Normal',
    description: '',

    // Job Details
    jobStartDate: '',
    jobEndDate: '',
    personnelCount: '',
    location: '',

    // Departments
    departments: [],

    // Additional
    specialRequirements: '',
    budgetRange: ''
  });

  const requestTypes = [
    { value: 'operational', label: 'Operational Support', icon: Shield },
    { value: 'esoc', label: 'ESOC Service', icon: Shield },
    { value: 'driver', label: 'Driver Request', icon: Users },
    { value: 'emergency', label: 'Emergency Response', icon: AlertCircle },
    { value: 'event', label: 'Event Staffing', icon: Calendar },
    { value: 'executive', label: 'Executive Protection', icon: Shield },
    { value: 'other', label: 'Other', icon: FileText }
  ];

  const urgencyLevels = [
    { value: 'Critical', label: 'Critical', sublabel: '2 hour response', color: 'red' },
    { value: 'High', label: 'High', sublabel: '4 hour response', color: 'orange' },
    { value: 'Normal', label: 'Normal', sublabel: '24 hour response', color: 'blue' },
    { value: 'Low', label: 'Low', sublabel: '48 hour response', color: 'gray' }
  ];

  const departments = [
    { value: 'staffing', label: 'Staffing', description: 'Personnel assignment & scheduling' },
    { value: 'logistics', label: 'Logistics', description: 'Transportation & equipment' },
    { value: 'finance', label: 'Finance', description: 'Billing & quotes' },
    { value: 'scheduling', label: 'Scheduling', description: 'Calendar coordination' },
    { value: 'esoc', label: 'ESOC', description: 'Security assessments' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDepartmentToggle = (dept) => {
    setFormData(prev => ({
      ...prev,
      departments: prev.departments.includes(dept)
        ? prev.departments.filter(d => d !== dept)
        : [...prev.departments, dept]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Get backend URL from environment or use default
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

      const response = await axios.post(`${backendUrl}/webhook/manual`, {
        ticketData: {
          clientName: formData.clientName,
          email: formData.email,
          phone: formData.phone,
          companyName: formData.companyName,
          jobType: formData.requestType,
          description: formData.description,
          urgency: formData.urgencyLevel,
          startDate: formData.jobStartDate,
          endDate: formData.jobEndDate,
          personnelCount: formData.personnelCount,
          location: formData.location,
          departments: formData.departments,
          specialRequirements: formData.specialRequirements,
          budgetRange: formData.budgetRange
        }
      });

      if (response.data.success) {
        setTicketNumber(response.data.ticketNumber);
        setSubmitted(true);
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.response?.data?.error || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Success screen
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Your job request has been received and assigned to our team.
          </p>

          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Your Ticket Number</p>
            <p className="text-2xl font-bold text-gray-900 font-mono">{ticketNumber}</p>
          </div>

          <div className="text-left mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✓ Your request has been assigned to our departments</li>
              <li>✓ You'll receive a confirmation email shortly</li>
              <li>✓ Our team will contact you within {
                formData.urgencyLevel === 'Critical' ? '2 hours' :
                formData.urgencyLevel === 'High' ? '4 hours' :
                formData.urgencyLevel === 'Normal' ? '24 hours' : '48 hours'
              }</li>
            </ul>
          </div>

          <button
            onClick={() => {
              setSubmitted(false);
              setFormData({
                clientName: '',
                email: '',
                phone: '',
                companyName: '',
                requestType: '',
                urgencyLevel: 'Normal',
                description: '',
                jobStartDate: '',
                jobEndDate: '',
                personnelCount: '',
                location: '',
                departments: [],
                specialRequirements: '',
                budgetRange: ''
              });
            }}
            className="w-full bg-black text-white py-3 px-6 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  // Form screen
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-black text-white rounded-t-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8" />
            <h1 className="text-2xl font-bold">PFC Job Request</h1>
          </div>
          <p className="text-gray-300">Submit a new security services request</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-b-lg shadow-lg p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {/* Client Information */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Client Information
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="john@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Company Inc."
                />
              </div>
            </div>
          </section>

          {/* Request Type */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Request Type
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {requestTypes.map(({ value, label, icon: Icon }) => (
                <label
                  key={value}
                  className={`cursor-pointer border-2 rounded-lg p-3 flex flex-col items-center gap-2 transition-all ${
                    formData.requestType === value
                      ? 'border-black bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="requestType"
                    value={value}
                    checked={formData.requestType === value}
                    onChange={handleChange}
                    className="sr-only"
                    required
                  />
                  <Icon className="w-6 h-6" />
                  <span className="text-xs font-medium text-center">{label}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Urgency Level */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Urgency Level
            </h2>
            <div className="grid md:grid-cols-4 gap-3">
              {urgencyLevels.map(({ value, label, sublabel, color }) => (
                <label
                  key={value}
                  className={`cursor-pointer border-2 rounded-lg p-3 transition-all ${
                    formData.urgencyLevel === value
                      ? 'border-black bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="urgencyLevel"
                    value={value}
                    checked={formData.urgencyLevel === value}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-3 h-3 rounded-full bg-${color}-500`}></div>
                    <span className="font-medium">{label}</span>
                  </div>
                  <p className="text-xs text-gray-600">{sublabel}</p>
                </label>
              ))}
            </div>
          </section>

          {/* Job Description */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Job Description
            </h2>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="Describe your security service needs in detail..."
            />
          </section>

          {/* Job Details */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Job Details
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="jobStartDate"
                  value={formData.jobStartDate}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  name="jobEndDate"
                  value={formData.jobEndDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Personnel
                </label>
                <input
                  type="number"
                  name="personnelCount"
                  value={formData.personnelCount}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budget Range
                </label>
                <input
                  type="text"
                  name="budgetRange"
                  value={formData.budgetRange}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="$5,000 - $10,000"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin className="w-4 h-4 inline mr-1" />
                Location/Venue
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Miami Beach Convention Center"
              />
            </div>
          </section>

          {/* Departments */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Departments Needed
            </h2>
            <p className="text-sm text-gray-600 mb-4">Select all departments that should be involved</p>
            <div className="grid md:grid-cols-2 gap-3">
              {departments.map(({ value, label, description }) => (
                <label
                  key={value}
                  className={`cursor-pointer border-2 rounded-lg p-4 transition-all ${
                    formData.departments.includes(value)
                      ? 'border-black bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.departments.includes(value)}
                    onChange={() => handleDepartmentToggle(value)}
                    className="sr-only"
                  />
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 border-2 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      formData.departments.includes(value)
                        ? 'bg-black border-black'
                        : 'border-gray-300'
                    }`}>
                      {formData.departments.includes(value) && (
                        <CheckCircle className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{label}</p>
                      <p className="text-xs text-gray-600">{description}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* Special Requirements */}
          <section>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Special Requirements
            </label>
            <textarea
              name="specialRequirements"
              value={formData.specialRequirements}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="Armed guards, specific uniforms, language requirements, equipment needs, etc."
            />
          </section>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-4 px-6 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  Submit Request
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Questions? Contact us at <a href="mailto:requests@pfcgoc.com" className="text-black font-medium hover:underline">requests@pfcgoc.com</a></p>
        </div>
      </div>
    </div>
  );
};

export default IntakeForm;
