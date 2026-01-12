import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TermsAndConditions = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Terms and Conditions | AIPS";
}, []);

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen p-10 mt-20 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-96 h-96 bg-neon-blue/5 rounded-full blur-3xl animate-pulse-neon"></div>
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-neon-purple/5 rounded-full blur-3xl animate-pulse-neon" style={{animationDelay: '1s'}}></div>
      </div>

      <button 
        onClick={handleGoBack} 
        className="mb-6 text-neon-blue hover:text-neon-purple p-3 rounded-lg absolute left-10 top-24 z-10 glass border border-neon-blue/30 hover:border-neon-blue/50 transition-all duration-300 hover:scale-105"
      >
        ← Go Back
      </button>

      <div className="relative z-10 max-w-4xl mx-auto w-full">
        <header className="text-center mb-8 animate-slide-up">
          <h1 className="text-5xl font-extrabold font-['Orbitron'] gradient-text">Terms and Conditions</h1>
        </header>

        <div className="glass-strong p-8 rounded-xl shadow-2xl border border-neon-blue/30 text-left animate-slide-up" style={{animationDelay: '0.1s'}}>
          <section className="mb-8">
            <h2 className="text-3xl font-semibold text-neon-blue mb-4 font-['Orbitron']">1. Introduction</h2>
            <p className="text-gray-300 leading-relaxed">
              Welcome to AIPS (AI-Powered Storytelling). These terms and conditions outline the rules and regulations for the use of AIPS's Website.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-3xl font-semibold text-neon-purple mb-4 font-['Orbitron']">2. User Rights</h2>
            <p className="text-gray-300 mb-2">
              By using AIPS, you agree to the following:
            </p>
            <ul className="list-disc ml-6 mt-2 space-y-2 text-gray-300">
              <li>Respect the intellectual property rights of others.</li>
              <li>Not to use the service for any illegal or unauthorized purpose.</li>
              <li>Not to interfere with or disrupt the service or its servers and networks.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-3xl font-semibold text-neon-pink mb-4 font-['Orbitron']">3. Data Privacy</h2>
            <p className="text-gray-300 leading-relaxed">
              AIPS is committed to protecting your privacy. We do not collect any personal data for training AI models. User inputs and preferences are temporarily stored during sessions to personalize suggestions and are deleted upon session end.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-3xl font-semibold text-neon-blue mb-4 font-['Orbitron']">4. Ethical Considerations</h2>
            <p className="text-gray-300 leading-relaxed">
              AIPS is designed to enhance the creative writing process while maintaining the unique creative identity of human storytelling. We strive to ensure that AI-generated content is coherent, engaging, and ethically sound. We do not generate content that is harmful, discriminatory, or offensive.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-3xl font-semibold text-neon-purple mb-4 font-['Orbitron']">5. Disclaimers</h2>
            <p className="text-gray-300 leading-relaxed">
              AIPS is provided "as is" without warranty of any kind, express or implied. We do not guarantee that the service will be uninterrupted or error-free. In no event shall AIPS be liable for any damages arising from the use of the service.
            </p>
          </section>

          <footer className="mt-8 text-center text-gray-400 border-t border-neon-blue/20 pt-6">
            <p>&copy; 2024 AIPS, All rights reserved.</p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
