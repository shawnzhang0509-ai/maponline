import React from 'react';
import { Link } from 'react-router-dom';
import { EditableStaticPage } from '../components/EditableStaticPage';

const AboutPage: React.FC = () => {
  const fallback = (
    <>
      <p className="text-gray-600 mb-4">
        Massage Shops NZ is a local discovery platform that helps users find massage shops on the map,
        view shop details, and contact shops quickly.
      </p>
      <p className="text-gray-600 mb-4">
        We are continuously improving listing quality, shop management tools, and analytics to create a
        better experience for both customers and shop owners.
      </p>
    </>
  );

  return (
    <EditableStaticPage
      page="about"
      title="About Us"
      fallback={fallback}
      backLink={
        <Link
          to="/"
          className="inline-block px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700"
        >
          Back to Home
        </Link>
      }
    />
  );
};

export default AboutPage;
