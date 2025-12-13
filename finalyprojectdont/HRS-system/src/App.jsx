import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import CustomerLayout from "./layouts/CustomerLayout.jsx";
import CustomerHome from "./pages/CustomerHome.jsx";
import CustomerRooms from "./pages/CustomerRooms.jsx";
import CustomerRoomDetails from "./pages/CustomerRoomDetails.jsx";
import CustomerBooking from "./pages/CustomerBooking.jsx";
import CustomerTravelBooking from "./pages/CustomerTravelBooking.jsx";
import CustomerMyBookings from "./pages/CustomerMyBookings.jsx";
import CustomerExplore from "./pages/CustomerExplore.jsx";
import CustomerSupport from "./pages/CustomerSupport.jsx";
import CustomerProfile from "./pages/CustomerProfile.jsx";
import CustomerChat from "./pages/CustomerChat.jsx";
import CustomerIndex from "./pages/CustomerIndex.jsx";
import PreferencesUpdate from "./pages/PreferencesUpdate.jsx";
import FeedbackSubmit from "./pages/FeedbackSubmit.jsx";
import Privacy from "./pages/Privacy.jsx";
import AccessDenied from "./pages/AccessDenied.jsx";
import AccountCreated from "./pages/AccountCreated.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import EmailVerificationPage from "./pages/EmailVerificationPage.jsx";
import ErrorPage from "./pages/ErrorPage.jsx";
import ManagerCreateTravelBooking from "./pages/ManagerCreateTravelBooking.jsx";
import ReceptionistChat from "./pages/ReceptionistChat.jsx";
import AdminUserManagement from "./pages/AdminUserManagement.jsx";
import AdminRolesPermissions from "./pages/AdminRolesPermissions.jsx";
import AdminStaffManagement from "./pages/AdminStaffManagement.jsx";
import AdminSystemConfiguration from "./pages/AdminSystemConfiguration.jsx";
import AdminAuditLogs from "./pages/AdminAuditLogs.jsx";
import AdminPayments from "./pages/AdminPayments.jsx";
import AdminReports from "./pages/AdminReports.jsx";
import AdminDatabaseControl from "./pages/AdminDatabaseControl.jsx";
import AdminBackupRestore from "./pages/AdminBackupRestore.jsx";
import AdminSecurityCenter from "./pages/AdminSecurityCenter.jsx";
import AdminProfile from "./pages/AdminProfile.jsx";
import ManagerManageRooms from "./pages/ManagerManageRooms.jsx";
import ManagerManageBookings from "./pages/ManagerManageBookings.jsx";
import ManagerManageTravelBookings from "./pages/ManagerManageTravelBookings.jsx";
import ManagerAddRoom from "./pages/ManagerAddRoom.jsx";
import ManagerManageAmenities from "./pages/ManagerManageAmenities.jsx";
import ManagerAddAmenity from "./pages/ManagerAddAmenity.jsx";
import ManagerRoomTypes from "./pages/ManagerRoomTypes.jsx";
import ManagerStaffManagement from "./pages/ManagerStaffManagement.jsx";
import ManagerFinancialReports from "./pages/ManagerFinancialReports.jsx";
import ManagerCustomerFeedback from "./pages/ManagerCustomerFeedback.jsx";
import ManagerProfile from "./pages/ManagerProfile.jsx";
import ReceptionistManageReservations from "./pages/ReceptionistManageReservations.jsx";
import ReceptionistViewTravelBookings from "./pages/ReceptionistViewTravelBookings.jsx";
import ReceptionistCheckIn from "./pages/ReceptionistCheckIn.jsx";
import ReceptionistCheckOut from "./pages/ReceptionistCheckOut.jsx";
import ReceptionistPendingApprovals from "./pages/ReceptionistPendingApprovals.jsx";
import ReceptionistRoomAvailability from "./pages/ReceptionistRoomAvailability.jsx";
import ReceptionistCustomerRequests from "./pages/ReceptionistCustomerRequests.jsx";
import ReceptionistMessages from "./pages/ReceptionistMessages.jsx";
import ReceptionistProfile from "./pages/ReceptionistProfile.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
import ManagerLayout from "./layouts/ManagerLayout.jsx";
import ReceptionistLayout from "./layouts/ReceptionistLayout.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import ManagerDashboard from "./pages/ManagerDashboard.jsx";
import ReceptionistDashboard from "./pages/ReceptionistDashboard.jsx";
import { useAuth } from "./hooks/useAuth.jsx";
import { usePermissions } from "./hooks/usePermissions.jsx";
import PermissionDenied from "./components/PermissionDenied.jsx";

function ProtectedRoute({ children, allowedRoles, allowedPermissions }) {
  const { user, loading } = useAuth();
  const { hasPermission, loading: permissionsLoading } = usePermissions();

  if (loading || permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check login permission first
  if (!hasPermission("auth:login")) {
    return <PermissionDenied permissionName="Login Access" />;
  }

  const hasRequiredPermission = () => {
    if (!allowedPermissions || allowedPermissions.length === 0) return true;
    // Check if user has at least one of the required permissions
    return allowedPermissions.some(perm => hasPermission(perm));
  };

  const hasAllowedRole = () => {
    if (!allowedRoles || allowedRoles.length === 0) return true;
    return allowedRoles.includes(user.role);
  };

  if (!hasAllowedRole()) {
    // Redirect based on role
    switch (user.role) {
      case "Customer":
        return <Navigate to="/customer/home" replace />;
      case "Admin":
        return <Navigate to="/admin/dashboard" replace />;
      case "Manager":
        return <Navigate to="/manager/dashboard" replace />;
      case "Receptionist":
        return <Navigate to="/receptionist/dashboard" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  // Check permissions after role check
  if (!hasRequiredPermission()) {
    const permissionName = allowedPermissions?.[0] || "this feature";
    return <PermissionDenied permissionName={permissionName} />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<EmailVerificationPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/account-created" element={<AccountCreated />} />
        <Route path="/access-denied" element={<AccessDenied />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/error" element={<ErrorPage />} />
        <Route path="/customer/index" element={<CustomerIndex />} />

        <Route
          element={
            <ProtectedRoute allowedRoles={["Customer"]} allowedPermissions={["customer:dashboard:view"]}>
              <CustomerLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<CustomerHome />} />
          <Route path="/customer/home" element={<CustomerHome />} />
          <Route path="/customer/rooms" element={<CustomerRooms />} />
          <Route path="/customer/rooms/:id" element={<CustomerRoomDetails />} />
          <Route path="/customer/booking" element={<CustomerBooking />} />
          <Route path="/customer/travel-booking" element={<CustomerTravelBooking />} />
          <Route path="/customer/my-bookings" element={<CustomerMyBookings />} />
          <Route path="/customer/explore" element={<CustomerExplore />} />
          <Route path="/customer/support" element={<CustomerSupport />} />
          <Route path="/customer/profile" element={<CustomerProfile />} />
          <Route path="/customer/chat" element={<CustomerChat />} />
          <Route path="/preferences/update" element={<PreferencesUpdate />} />
          <Route path="/feedback/submit" element={<FeedbackSubmit />} />
        </Route>

        <Route
          element={
            <ProtectedRoute allowedRoles={["Admin"]} allowedPermissions={["admin:dashboard:view"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUserManagement />} />
          <Route path="/admin/roles" element={<AdminRolesPermissions />} />
          <Route path="/admin/staff" element={<AdminStaffManagement />} />
          <Route path="/admin/config" element={<AdminSystemConfiguration />} />
          <Route path="/admin/audit" element={<AdminAuditLogs />} />
          <Route path="/admin/payments" element={<AdminPayments />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/database" element={<AdminDatabaseControl />} />
          <Route path="/admin/backup" element={<AdminBackupRestore />} />
          <Route path="/admin/security" element={<AdminSecurityCenter />} />
          <Route path="/admin/profile" element={<AdminProfile />} />
        </Route>

        <Route
          element={
            <ProtectedRoute allowedRoles={["Manager"]} allowedPermissions={["manager:dashboard:view"]}>
              <ManagerLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/manager/dashboard" element={<ManagerDashboard />} />
          <Route path="/manager/manage-rooms" element={<ManagerManageRooms />} />
          <Route path="/manager/manage-bookings" element={<ManagerManageBookings />} />
          <Route path="/manager/manage-travel-bookings" element={<ManagerManageTravelBookings />} />
          <Route path="/manager/add-room" element={<ManagerAddRoom />} />
          <Route path="/manager/manage-amenities" element={<ManagerManageAmenities />} />
          <Route path="/manager/add-amenity" element={<ManagerAddAmenity />} />
          <Route path="/manager/room-types" element={<ManagerRoomTypes />} />
          <Route path="/manager/staff-management" element={<ManagerStaffManagement />} />
          <Route path="/manager/financial-reports" element={<ManagerFinancialReports />} />
          <Route path="/manager/customer-feedback" element={<ManagerCustomerFeedback />} />
          <Route path="/manager/profile" element={<ManagerProfile />} />
          <Route path="/manager/create-travel-booking" element={<ManagerCreateTravelBooking />} />
        </Route>

        <Route
          element={
            <ProtectedRoute allowedRoles={["Receptionist"]} allowedPermissions={["receptionist:dashboard:view"]}>
              <ReceptionistLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/receptionist/dashboard" element={<ReceptionistDashboard />} />
          <Route path="/receptionist/manage-reservations" element={<ReceptionistManageReservations />} />
          <Route path="/receptionist/view-travel-bookings" element={<ReceptionistViewTravelBookings />} />
          <Route path="/receptionist/check-in" element={<ReceptionistCheckIn />} />
          <Route path="/receptionist/check-out" element={<ReceptionistCheckOut />} />
          <Route path="/receptionist/pending-approvals" element={<ReceptionistPendingApprovals />} />
          <Route path="/receptionist/room-availability" element={<ReceptionistRoomAvailability />} />
          <Route path="/receptionist/customer-requests" element={<ReceptionistCustomerRequests />} />
          <Route path="/receptionist/messages" element={<ReceptionistMessages />} />
          <Route path="/receptionist/profile" element={<ReceptionistProfile />} />
          <Route path="/receptionist/chat" element={<ReceptionistChat />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
