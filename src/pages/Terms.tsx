import './Pages.css';

const Terms = () => {
  return (
    <div className="page-container">
      <div className="page-content">
        <h1>Terms of Use</h1>
        
        <section className="terms-section">
          <h2>Agreement to Terms</h2>
          <p>
            By accessing or using AI SEO Blog Generator, you agree to be bound by these Terms of Use. If you disagree with any part of the terms, you may not access the service.
          </p>
        </section>
        
        <section className="terms-section">
          <h2>Description of Service</h2>
          <p>
            AI SEO Blog Generator provides an AI-powered platform for creating SEO-optimized blog content, including text generation, image creation, and WordPress integration. The service utilizes various AI models and third-party services to deliver these features.
          </p>
        </section>
        
        <section className="terms-section">
          <h2>User Accounts</h2>
          <p>
            When you create an account with us, you must provide accurate and complete information. You are responsible for safeguarding the password and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
          </p>
        </section>
        
        <section className="terms-section">
          <h2>API Keys and Third-Party Services</h2>
          <p>
            Our service requires the use of API keys for OpenRouter, Stability AI, Leonardo AI, and WordPress credentials. You are responsible for obtaining these API keys and ensuring your use complies with the respective third-party terms of service.
          </p>
          <p>
            We do not store your API keys on our servers. They are stored locally in your browser's storage and are transmitted securely when making API calls.
          </p>
        </section>
        
        <section className="terms-section">
          <h2>Intellectual Property</h2>
          <p>
            <strong>Content Ownership:</strong> You retain ownership of the content you generate using our service. However, you grant us a non-exclusive license to use, reproduce, and display such content solely for the purpose of providing and improving our services.
          </p>
          <p>
            <strong>Service Ownership:</strong> The AI SEO Blog Generator application, including its original content, features, and functionality, is owned by us and is protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
          </p>
        </section>
        
        <section className="terms-section">
          <h2>Acceptable Use</h2>
          <p>You agree not to use the service:</p>
          <ul>
            <li>In any way that violates any applicable national or international law or regulation</li>
            <li>To generate content that is illegal, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable</li>
            <li>To impersonate or attempt to impersonate another person or entity</li>
            <li>To engage in any activity that interferes with or disrupts the service</li>
            <li>To attempt to gain unauthorized access to any portion of the service</li>
          </ul>
        </section>
        
        <section className="terms-section">
          <h2>Limitation of Liability</h2>
          <p>
            In no event shall AI SEO Blog Generator, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the service.
          </p>
        </section>
        
        <section className="terms-section">
          <h2>Disclaimer</h2>
          <p>
            Your use of the service is at your sole risk. The service is provided on an "AS IS" and "AS AVAILABLE" basis. The service is provided without warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement, or course of performance.
          </p>
        </section>
        
        <section className="terms-section">
          <h2>Changes to Terms</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect.
          </p>
        </section>
        
        <section className="terms-section">
          <h2>Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us via our contact page.
          </p>
        </section>
        
        <p className="last-updated">Last updated: June 2023</p>
      </div>
    </div>
  );
};

export default Terms;