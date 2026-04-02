import React from 'react';
import { Link } from 'react-router-dom';

const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">About Us</h1>
      <p className="text-gray-600 mb-4">
        Massage Shops NZ is a local discovery platform that helps users find massage shops on the map,
        view shop details, and contact shops quickly.
      </p>
      <p className="text-gray-600 mb-4">
        We are continuously improving listing quality, shop management tools, and analytics to create a
        better experience for both customers and shop owners.
      </p>
      <Link to="/" className="inline-block px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700">
        Back to Home
      </Link>
    </div>
  );
};

export default AboutPage;
