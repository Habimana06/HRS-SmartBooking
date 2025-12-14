import { Link } from "react-router-dom";
export default () => (
  <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
    <div className="text-center card max-w-md">
      <div className="w-16 h-16 bg-accent-100 dark:bg-accent-900 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-accent-600 dark:text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Account Created!</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">Your account has been successfully created.</p>
      <Link to="/login" className="btn-primary">Go to Login</Link>
    </div>
  </div>
);
