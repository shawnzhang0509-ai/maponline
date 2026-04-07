import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, AlertTriangle } from 'lucide-react';

const TermsPage: React.FC = () => {
  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-y-auto">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Terms & Conditions</h1>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full p-6 pb-20">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
          
          <div className="flex items-center gap-3 text-rose-600 bg-rose-50 p-4 rounded-xl">
            <ShieldCheck className="w-8 h-8 flex-shrink-0" />
            <div>
              <h2 className="font-bold text-lg">User Agreement</h2>
              <p className="text-sm opacity-90">Please read carefully before using our services.</p>
            </div>
          </div>

          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-2">1. Age Restriction (18+ Only)</h3>
            <p className="text-gray-600 leading-relaxed">
              By accessing this website and using our services, you confirm that you are at least <strong>18 years of age</strong> or the legal age of majority in your jurisdiction. 
              This platform contains information related to adult massage and spa services. If you are under 18, please exit immediately.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-2">2. Purpose of Service</h3>
            <p className="text-gray-600 leading-relaxed">
              Our platform is an information directory connecting users with independent massage therapists and spa businesses. 
              We do not provide services directly. All transactions and appointments are made directly between the user and the service provider.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-2">3. Prohibited Activities</h3>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>No illegal activities, including but not limited to sexual services, are permitted or endorsed by this platform.</li>
              <li>Users must treat all service providers with respect and dignity.</li>
              <li>Any form of harassment, fraud, or misrepresentation will result in an immediate ban.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-2">4. Privacy & Data</h3>
            <p className="text-gray-600 leading-relaxed">
              We respect your privacy. Location data is used solely for finding nearby services and is not stored permanently on our servers without consent. 
              Please refer to our Privacy Policy for detailed information.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-2">5. Limitation of Liability</h3>
            <p className="text-gray-600 leading-relaxed">
              We are not responsible for any disputes, injuries, or losses arising from interactions between users and service providers. 
              Users engage with providers at their own risk.
            </p>
          </section>

          <div className="pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              Last Updated: March 2026<br/>
              By using this app, you agree to these terms.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TermsPage;