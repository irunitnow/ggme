import './Pages.css';

const Privacy = () => {
  return (
    <div className="page-container">
      <div className="page-content">
        <h1>Privacy Policy</h1>
        
        <section className="privacy-section">
          <h2>Introduction</h2>
          <p>
            At AI SEO Blog Generator, we respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
          </p>
          <p>
            Please read this Privacy Policy carefully. If you do not agree with the terms of this Privacy Policy, please do not access the application.
          </p>
        </section>
        
        <section className="privacy-section">
          <h2>Information We Collect</h2>
          <p>
            <strong>Personal Data:</strong> We may collect personally identifiable information, such as your name, email address, and website details when you register for an account or connect your WordPress site.
          </p>
          <p>
            <strong>Usage Data:</strong> We may also collect information on how the service is accessed and used. This data may include information such as your computer's IP address, browser type, pages visited, time spent on those pages, and other diagnostic data.
          </p>
          <p>
            <strong>Content Data:</strong> The blog content you generate using our service, including titles, descriptions, keywords, and images.
          </p>
        </section>
        
        <section className="privacy-section">
          <h2>How We Use Your Information</h2>
          <p>We use the collected data for various purposes:</p>
          <ul>
            <li>To provide and maintain our service</li>
            <li>To notify you about changes to our service</li>
            <li>To provide customer support</li>
            <li>To gather analysis or valuable information so that we can improve our service</li>
            <li>To monitor the usage of our service</li>
            <li>To detect, prevent and address technical issues</li>
          </ul>
        </section>
        
        <section className="privacy-section">
          <h2>Data Security</h2>
          <p>
            The security of your data is important to us, but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal data, we cannot guarantee its absolute security.
          </p>
        </section>
        
        <section className="privacy-section">
          <h2>Third-Party Services</h2>
          <p>
            Our service integrates with third-party services, including but not limited to OpenRouter, Stability AI, Leonardo AI, and WordPress. Your use of these third-party services is subject to their respective privacy policies, and we recommend reviewing those policies.
          </p>
        </section>
        
        <section className="privacy-section">
          <h2>Children's Privacy</h2>
          <p>
            Our service does not address anyone under the age of 18. We do not knowingly collect personally identifiable information from anyone under the age of 18. If you are a parent or guardian and you are aware that your child has provided us with personal data, please contact us.
          </p>
        </section>
        
        <section className="privacy-section">
          <h2>Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
          </p>
          <p>
            You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
          </p>
        </section>
        
        <section className="privacy-section">
          <h2>Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us via our contact page.
          </p>
        </section>
        
        <p className="last-updated">Last updated: June 2023</p>
      </div>
    </div>
  );
};

export default Privacy;