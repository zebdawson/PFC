import { useState, useEffect } from 'react';
import { CheckCircle2, Shield, Zap, DollarSign, Calendar, Award, AlertCircle, Lock } from 'lucide-react';
import axios from 'axios';

const SolarLandingPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    monthlyBill: '',
    website_url: '', // HONEYPOT FIELD
    captchaAnswer: '',
    agreeToTerms: false
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [slotsRemaining, setSlotsRemaining] = useState(4);

  // Get current month for scarcity messaging
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });

  // Countdown for urgency (simulated)
  useEffect(() => {
    const timer = setInterval(() => {
      setSlotsRemaining(prev => prev > 0 ? prev : 4);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateEmail = (email) => {
    const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
  };

  const validatePhone = (phone) => {
    const regex = /^[\d\s\-\(\)]+$/;
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10;
  };

  const verifyCaptcha = () => {
    if (formData.captchaAnswer.trim() === '7') {
      setCaptchaVerified(true);
      setErrors(prev => ({ ...prev, captcha: '' }));
    } else {
      setErrors(prev => ({ ...prev, captcha: 'Incorrect answer. Please try again.' }));
      setCaptchaVerified(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // HONEYPOT CHECK - if filled, it's a bot
    if (formData.website_url) {
      return { bot: 'Spam detected' };
    }

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }
    if (!formData.address.trim()) newErrors.address = 'Address is required for solar assessment';
    if (!formData.monthlyBill.trim()) {
      newErrors.monthlyBill = 'Monthly bill amount is required';
    } else if (parseFloat(formData.monthlyBill) < 150) {
      newErrors.monthlyBill = 'Monthly bill must be at least $150 to qualify';
    }
    if (!captchaVerified) newErrors.captcha = 'Please verify you are human';
    if (!formData.agreeToTerms) newErrors.terms = 'You must agree to the terms';

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      if (validationErrors.bot) {
        // Silent rejection for bots
        console.log('Bot submission rejected');
        return;
      }
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

      // Submit to webhook
      const response = await axios.post(`${backendUrl}/webhook/solar-lead`, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        monthlyBill: formData.monthlyBill,
        source: 'Grand Slam Solar Landing Page',
        timestamp: new Date().toISOString()
      });

      if (response.status === 200) {
        setSubmitSuccess(true);
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          address: '',
          monthlyBill: '',
          website_url: '',
          captchaAnswer: '',
          agreeToTerms: false
        });
        setCaptchaVerified(false);
      }
    } catch (error) {
      console.error('Submission error:', error);
      setErrors({ submit: 'Something went wrong. Please try again or call us at (555) 123-4567' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full text-center">
          <div className="bg-green-500 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6">
            🎉 YOU'RE IN!
          </h1>
          <p className="text-2xl text-gray-300 mb-8">
            Your Free Energy Assessment Is Confirmed
          </p>
          <div className="bg-slate-800 rounded-lg p-8 mb-8">
            <p className="text-xl text-white mb-4">
              One of our Solar Freedom Specialists will call you within the next 2 hours to schedule your assessment.
            </p>
            <p className="text-gray-400">
              Check your email for immediate next steps and your $10,000 savings calculator.
            </p>
          </div>
          <button
            onClick={() => setSubmitSuccess(false)}
            className="text-yellow-500 hover:text-yellow-400 underline text-lg"
          >
            ← Back to homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* SCARCITY BAR */}
      <div className="bg-red-600 text-white py-3 px-4 text-center sticky top-0 z-50 shadow-lg">
        <p className="text-sm md:text-base font-bold">
          ⚡ ONLY {slotsRemaining} INSTALLATION SLOTS LEFT FOR {currentMonth.toUpperCase()} ⚡
        </p>
      </div>

      {/* HERO SECTION */}
      <section className="px-4 py-12 md:py-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          {/* MASSIVE HEADLINE */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-tight mb-6">
            We Will Pay Your Electric Bill For A Year If You Don't Save{' '}
            <span className="text-yellow-500">$10,000+</span> With Our Zero-Down Solar System
          </h1>

          <p className="text-xl md:text-3xl text-gray-300 font-bold mb-8">
            Stop Renting Power From The Utility Monopoly.<br />
            Own Your Energy. Own Your Freedom.
          </p>

          <div className="flex flex-col md:flex-row gap-4 justify-center items-center mb-8">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle2 className="w-6 h-6" />
              <span className="text-lg font-semibold">$0 Down</span>
            </div>
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle2 className="w-6 h-6" />
              <span className="text-lg font-semibold">$0 Out of Pocket</span>
            </div>
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle2 className="w-6 h-6" />
              <span className="text-lg font-semibold">Start Saving Day 1</span>
            </div>
          </div>

          {/* RISK REVERSAL BOX */}
          <div className="bg-yellow-500 text-slate-900 p-6 rounded-lg max-w-3xl mx-auto border-4 border-yellow-400 shadow-2xl">
            <div className="flex items-start gap-4">
              <Shield className="w-12 h-12 flex-shrink-0" />
              <div className="text-left">
                <h3 className="text-2xl font-black mb-2">IRON-CLAD GUARANTEE:</h3>
                <p className="text-lg font-bold">
                  If we can't save you money from Day 1, we won't install it. Period.
                  No pressure. No BS. Just freedom from your utility company.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHO THIS IS FOR SECTION */}
      <section className="bg-slate-800 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-center mb-12">
            Is This For You?
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-green-900 border-2 border-green-500 rounded-lg p-6">
              <h3 className="text-2xl font-black mb-4 text-green-400">✅ This IS For You If:</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                  <span>You're a homeowner with an electric bill over $150/month</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                  <span>You're tired of utility rates going up every single year</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                  <span>You want to lock in your energy cost forever</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                  <span>You qualify for 30% Federal Tax Credit + State incentives</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                  <span>You want to add $30k+ in home value instantly</span>
                </li>
              </ul>
            </div>

            <div className="bg-red-900 border-2 border-red-500 rounded-lg p-6">
              <h3 className="text-2xl font-black mb-4 text-red-400">❌ This IS NOT For You If:</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                  <span>You're renting or planning to move in the next 2 years</span>
                </li>
                <li className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                  <span>Your electric bill is under $150/month</span>
                </li>
                <li className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                  <span>You're happy giving money to the utility monopoly forever</span>
                </li>
                <li className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                  <span>You enjoy unpredictable, rising energy costs</span>
                </li>
                <li className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                  <span>You're not ready to increase your home's value</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* VALUE STACK SECTION */}
      <section className="py-16 px-4 bg-slate-900">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-center mb-4">
            Here's Everything You Get
          </h2>
          <p className="text-xl text-center text-gray-400 mb-12">
            (Total Value: <span className="text-yellow-500 font-bold">$50,000+</span>)
          </p>

          <div className="space-y-4">
            {/* Stack Item */}
            <div className="bg-slate-800 border-l-4 border-yellow-500 p-6 flex items-start gap-4">
              <Zap className="w-12 h-12 text-yellow-500 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-2xl font-black mb-2">Premium Solar Panel System</h3>
                <p className="text-gray-300 mb-2">
                  Tier-1 panels with 25-year production guarantee. Custom-designed for your roof.
                </p>
                <p className="text-yellow-500 font-bold text-xl">Value: $25,000</p>
              </div>
            </div>

            <div className="bg-slate-800 border-l-4 border-yellow-500 p-6 flex items-start gap-4">
              <Award className="w-12 h-12 text-yellow-500 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-2xl font-black mb-2">25-Year Warranty Package</h3>
                <p className="text-gray-300 mb-2">
                  Equipment warranty, production guarantee, and workmanship coverage.
                </p>
                <p className="text-yellow-500 font-bold text-xl">Value: $8,000</p>
              </div>
            </div>

            <div className="bg-slate-800 border-l-4 border-yellow-500 p-6 flex items-start gap-4">
              <DollarSign className="w-12 h-12 text-yellow-500 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-2xl font-black mb-2">Full Tax Credit Handling</h3>
                <p className="text-gray-300 mb-2">
                  We handle all paperwork for 30% Federal Tax Credit + state/local incentives.
                </p>
                <p className="text-yellow-500 font-bold text-xl">Value: $2,500</p>
              </div>
            </div>

            <div className="bg-slate-800 border-l-4 border-yellow-500 p-6 flex items-start gap-4">
              <Lock className="w-12 h-12 text-yellow-500 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-2xl font-black mb-2">Lifetime Monitoring & Support</h3>
                <p className="text-gray-300 mb-2">
                  24/7 system monitoring app, instant alerts, and dedicated support team.
                </p>
                <p className="text-yellow-500 font-bold text-xl">Value: $5,000</p>
              </div>
            </div>

            <div className="bg-slate-800 border-l-4 border-yellow-500 p-6 flex items-start gap-4">
              <Calendar className="w-12 h-12 text-yellow-500 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-2xl font-black mb-2">White-Glove Installation</h3>
                <p className="text-gray-300 mb-2">
                  Professional installation, city permits, HOA approval, utility interconnection.
                </p>
                <p className="text-yellow-500 font-bold text-xl">Value: $4,500</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-600 to-green-500 border-4 border-green-400 p-8 flex items-start gap-4 shadow-2xl">
              <Shield className="w-16 h-16 text-white flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-3xl font-black mb-2 text-white">BONUS: 1-Year Electric Bill Guarantee</h3>
                <p className="text-white text-lg mb-2">
                  If you don't save $10,000+ in your first 25 years, we'll pay your electric bill for an entire year.
                </p>
                <p className="text-yellow-300 font-bold text-2xl">Value: PRICELESS</p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <div className="inline-block bg-slate-800 p-8 rounded-lg border-2 border-yellow-500">
              <p className="text-2xl text-gray-400 mb-2">Total Sticker Price:</p>
              <p className="text-5xl font-black text-white mb-4 line-through">$50,000+</p>
              <p className="text-3xl text-yellow-500 font-black mb-2">YOUR INVESTMENT TODAY:</p>
              <p className="text-7xl font-black text-green-400">$0</p>
              <p className="text-xl text-gray-300 mt-4">Zero down. Zero out of pocket. Start saving Day 1.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FORM SECTION */}
      <section className="py-16 px-4 bg-gradient-to-b from-slate-800 to-slate-900" id="form">
        <div className="max-w-2xl mx-auto">
          <div className="bg-slate-800 border-4 border-yellow-500 rounded-lg p-8 shadow-2xl">
            <h2 className="text-3xl md:text-4xl font-black mb-4 text-center">
              Get Your Free Energy Freedom Assessment
            </h2>
            <p className="text-center text-gray-300 mb-8 text-lg">
              See exactly how much you'll save in the next 25 years. Takes 60 seconds.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-bold mb-2">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                  placeholder="John Smith"
                />
                {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-bold mb-2">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                  placeholder="john@example.com"
                />
                {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-bold mb-2">Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                  placeholder="(555) 123-4567"
                />
                {errors.phone && <p className="text-red-400 text-sm mt-1">{errors.phone}</p>}
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-bold mb-2">Home Address *</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                  placeholder="123 Main St, City, State, ZIP"
                />
                <p className="text-xs text-gray-400 mt-1">We need this for your custom solar assessment</p>
                {errors.address && <p className="text-red-400 text-sm mt-1">{errors.address}</p>}
              </div>

              {/* Monthly Bill */}
              <div>
                <label className="block text-sm font-bold mb-2">Average Monthly Electric Bill *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">$</span>
                  <input
                    type="number"
                    name="monthlyBill"
                    value={formData.monthlyBill}
                    onChange={handleInputChange}
                    className="w-full pl-8 pr-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                    placeholder="200"
                    min="0"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Must be $150+ to qualify for our program</p>
                {errors.monthlyBill && <p className="text-red-400 text-sm mt-1">{errors.monthlyBill}</p>}
              </div>

              {/* HONEYPOT FIELD - Hidden from users */}
              <div className="hidden" aria-hidden="true">
                <label>Website URL (leave blank)</label>
                <input
                  type="text"
                  name="website_url"
                  value={formData.website_url}
                  onChange={handleInputChange}
                  tabIndex="-1"
                  autoComplete="off"
                />
              </div>

              {/* LOGIC CAPTCHA */}
              <div className="bg-slate-900 p-4 rounded-lg border-2 border-slate-700">
                <label className="block text-sm font-bold mb-2">Security Check: What is 5 + 2? *</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    name="captchaAnswer"
                    value={formData.captchaAnswer}
                    onChange={handleInputChange}
                    className="flex-1 px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                    placeholder="Your answer"
                  />
                  <button
                    type="button"
                    onClick={verifyCaptcha}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition"
                  >
                    Verify
                  </button>
                </div>
                {captchaVerified && (
                  <p className="text-green-400 text-sm mt-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Verified ✓
                  </p>
                )}
                {errors.captcha && <p className="text-red-400 text-sm mt-1">{errors.captcha}</p>}
              </div>

              {/* Terms */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleInputChange}
                  className="mt-1 w-5 h-5"
                />
                <label className="text-sm text-gray-300">
                  I agree to receive my free solar assessment and understand there's no obligation.
                  I can opt out anytime. *
                </label>
              </div>
              {errors.terms && <p className="text-red-400 text-sm">{errors.terms}</p>}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !captchaVerified}
                className={`w-full py-5 rounded-lg font-black text-2xl transition transform hover:scale-105 shadow-xl ${
                  isSubmitting || !captchaVerified
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-slate-900'
                }`}
              >
                {isSubmitting ? 'SUBMITTING...' : '🔥 GET MY FREE ASSESSMENT NOW 🔥'}
              </button>

              {errors.submit && (
                <div className="bg-red-900 border-2 border-red-600 rounded-lg p-4">
                  <p className="text-red-200">{errors.submit}</p>
                </div>
              )}

              <p className="text-center text-xs text-gray-500">
                🔒 Your information is 100% secure and will never be sold or shared.
              </p>
            </form>
          </div>

          {/* Social Proof */}
          <div className="mt-8 text-center">
            <p className="text-gray-400 mb-4">Trusted by 2,847+ homeowners</p>
            <div className="flex justify-center gap-2">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-yellow-500 text-2xl">★</span>
              ))}
            </div>
            <p className="text-white font-bold mt-2">4.9/5.0 Average Rating</p>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-red-600 py-12 px-4 text-center">
        <h2 className="text-3xl md:text-5xl font-black mb-4">
          DON'T WAIT. SLOTS ARE FILLING FAST.
        </h2>
        <p className="text-xl md:text-2xl mb-6">
          Only {slotsRemaining} installation slots left for {currentMonth}.
        </p>
        <a
          href="#form"
          className="inline-block bg-yellow-500 text-slate-900 px-12 py-5 rounded-lg text-2xl font-black hover:bg-yellow-400 transition transform hover:scale-105 shadow-2xl"
        >
          CLAIM YOUR SPOT NOW →
        </a>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 py-8 px-4 text-center text-gray-500 text-sm">
        <p>&copy; 2025 Solar Freedom Systems. All rights reserved.</p>
        <p className="mt-2">
          Questions? Call us: <a href="tel:5551234567" className="text-yellow-500 hover:underline">(555) 123-4567</a>
        </p>
      </footer>
    </div>
  );
};

export default SolarLandingPage;
