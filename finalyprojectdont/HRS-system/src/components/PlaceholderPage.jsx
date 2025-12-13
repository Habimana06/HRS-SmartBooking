export default function PlaceholderPage({ title, description = "This page is under development." }) {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          {title}
        </h1>
        <div className="card">
          <p className="text-gray-600 dark:text-gray-400">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
