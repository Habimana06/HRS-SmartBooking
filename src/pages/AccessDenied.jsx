import { Link } from "react-router-dom";
export default () => (
  <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">You don't have permission to access this page.</p>
      <Link to="/login" className="btn-primary">Go to Login</Link>
    </div>
  </div>
);
