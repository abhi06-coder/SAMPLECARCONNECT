import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import Home from './pages/Home';
import Profile from './pages/Profile';
import OfferRide from './pages/OfferRide';
import DriverDashboard from './pages/DriverDashboard';
import DriverOnboarding from './components/DriverOnboarding'; // Added Import
import BookingMonitor from './pages/BookingMonitor';
import ManageRide from './pages/ManageRide';
import PlasmaBackground from './components/PlasmaBackground';

import SearchRides from './pages/SearchRides';
import MyBookings from './pages/MyBookings';
import Tracking from './pages/Tracking';
import Payment from './pages/Payment';
import LeaveReview from './pages/LeaveReview';
import DriverProfile from './pages/DriverProfile';
import CompleteProfile from './pages/CompleteProfile';
import ChangePassword from './pages/ChangePassword';
import CreateCommuteTemplate from './pages/CreateCommuteTemplate';

import Footer from './components/Footer';
import ContactUs from './pages/policies/ContactUs';
import PrivacyPolicy from './pages/policies/PrivacyPolicy';
import TermsAndConditions from './pages/policies/TermsAndConditions';
import RefundPolicy from './pages/policies/RefundPolicy';
import ShippingPolicy from './pages/policies/ShippingPolicy';

import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-transparent text-text transition-colors duration-300 relative">
            <PlasmaBackground />
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/login" element={<Login />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path="/complete-profile" element={<CompleteProfile />} />
              <Route path="/offer-ride" element={<OfferRide />} />
              <Route path="/dashboard" element={<DriverDashboard />} />
              <Route path="/manage-ride/:rideId" element={<ManageRide />} />
              <Route path="/search-rides" element={<SearchRides />} />
              <Route path="/my-bookings" element={<MyBookings />} />
              <Route path="/tracking/:rideId" element={<Tracking />} />
              <Route path="/payment/:bookingId" element={<Payment />} />
              <Route path="/leave-review/:rideId" element={<LeaveReview />} />
              <Route path="/driver/:userId" element={<DriverProfile />} />
              <Route path="/driver-onboarding" element={<DriverOnboarding onSuccess={() => window.location.href = '/offer-ride'} />} /> {/* Added Onboarding Route */}
              <Route path="/booking-monitor/:bookingId" element={<BookingMonitor />} />
              <Route path="/commute/create" element={<CreateCommuteTemplate />} />

              {/* Policy Pages */}
              <Route path="/contact-us" element={<ContactUs />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
              <Route path="/refund-policy" element={<RefundPolicy />} />
              <Route path="/shipping-policy" element={<ShippingPolicy />} />
            </Routes>
            <Footer />
            <BottomNav />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}



export default App;
