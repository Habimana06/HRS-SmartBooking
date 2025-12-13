import { Link } from "react-router-dom";
export default () => (
  <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Oops! Something went wrong</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">An error occurred. Please try again later.</p>
      <Link to="/customer/home" className="btn-primary">Go Home</Link>
    </div>
  </div>
);
