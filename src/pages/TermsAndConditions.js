import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TermsAndConditions = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Terms and Conditions | AIPS";
}, []);

  const handleGoBack = () => {
    navigate(-1); // Navigate back to the previous page
  };

  return (
    <div className="min-h-screen bg-gray-50 p-10 mt-10 flex flex-col items-center justify-center">
      <button onClick={handleGoBack} className="mb-6 text-blue-800 p-2 rounded absolute left-4 top-16 z-10 bg-transparent">Go Back</button>
      <header className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-gray-800">Terms and Conditions</h1>
      </header>

      <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-lg text-left">
        <section>
          <h2 className="text-2xl font-semibold text-gray-700">1. Introduction</h2>
          <p className="text-gray-600 mt-2">
            Welcome to AIPS (AI-Powered Storytelling). These terms and conditions outline the rules and regulations for the use of AIPS's Website.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-700 mt-6">2. User Rights</h2>
          <p className="text-gray-600 mt-2">
            By using AIPS, you agree to the following:
            <ul className="list-disc ml-6 mt-2">
              <li>Respect the intellectual property rights of others.</li>
              <li>Not to use the service for any illegal or unauthorized purpose.</li>
              <li>Not to interfere with or disrupt the service or its servers and networks.</li>
            </ul>
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-700 mt-6">3. Data Privacy</h2>
          <p className="text-gray-600 mt-2">
            AIPS is committed to protecting your privacy. We do not collect any personal data for training AI models. User inputs and preferences are temporarily stored during sessions to personalize suggestions and are deleted upon session end.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-700 mt-6">4. Ethical Considerations</h2>
          <p className="text-gray-600 mt-2">
            AIPS is designed to enhance the creative writing process while maintaining the unique creative identity of human storytelling. We strive to ensure that AI-generated content is coherent, engaging, and ethically sound. We do not generate content that is harmful, discriminatory, or offensive.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-700 mt-6">5. Disclaimers</h2>
          <p className="text-gray-600 mt-2">
            AIPS is provided "as is" without warranty of any kind, express or implied. We do not guarantee that the service will be uninterrupted or error-free. In no event shall AIPS be liable for any damages arising from the use of the service.
          </p>
        </section>

        <footer className="mt-8 text-center text-gray-600">
          <p>&copy; 2024 AIPS, All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default TermsAndConditions;
