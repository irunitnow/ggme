import './Pages.css';

const About = () => {
  return (
    <div className="page-container">
      <div className="page-content">
        <h1>About AI SEO Blog Generator</h1>
        
        <section className="about-section">
          <h2>Revolutionizing Content Creation</h2>
          <p>
            AI SEO Blog Generator is a cutting-edge tool designed to transform how content creators, marketers, and businesses approach blog writing. Our platform combines the power of artificial intelligence with proven SEO strategies to help you create high-quality, search-optimized content in a fraction of the time it would take using traditional methods.
          </p>
        </section>
        
        <section className="about-section">
          <h2>Our Mission</h2>
          <p>
            Our mission is to democratize access to professional-grade content creation tools. We believe that everyone should be able to produce engaging, SEO-friendly content without needing years of experience or specialized knowledge. By leveraging the latest advancements in AI technology, we're making this vision a reality.
          </p>
        </section>
        
        <section className="about-section">
          <h2>What Sets Us Apart</h2>
          
          <div className="feature-card">
            <h3>Advanced AI Integration</h3>
            <p>We utilize state-of-the-art language models to generate human-like content that resonates with your audience while maintaining your unique voice and style.</p>
          </div>
          
          <div className="feature-card">
            <h3>SEO-First Approach</h3>
            <p>Every piece of content is crafted with search engines in mind, incorporating relevant keywords, optimized meta descriptions, and structured headings to improve your visibility online.</p>
          </div>
          
          <div className="feature-card">
            <h3>Customizable Outputs</h3>
            <p>Tailor your content to match your specific needs, whether you're creating beginner-friendly guides or in-depth technical articles.</p>
          </div>
          
          <div className="feature-card">
            <h3>Integrated Image Generation</h3>
            <p>Enhance your blog posts with AI-generated images that perfectly complement your written content, creating a more engaging user experience.</p>
          </div>
          
          <div className="feature-card">
            <h3>WordPress Integration</h3>
            <p>Seamlessly publish your generated content directly to your WordPress site, streamlining your content workflow from creation to publication.</p>
          </div>
        </section>
        
        <section className="about-section">
          <h2>How It Works</h2>
          <p>
            Our platform simplifies the content creation process into a few easy steps:
          </p>
          <ol>
            <li>Enter your topic and focus keyword</li>
            <li>Select your preferred difficulty level and AI model</li>
            <li>Generate optimized content with a single click</li>
            <li>Enhance your post with AI-generated images</li>
            <li>Edit as needed and publish directly to WordPress</li>
          </ol>
          <p>
            The result is professionally written, SEO-optimized content ready to engage your audience and improve your search rankings.
          </p>
        </section>
        
        <section className="about-section">
          <h2>Join the Content Revolution</h2>
          <p>
            Whether you're a solo blogger, a marketing team, or a business owner looking to enhance your online presence, AI SEO Blog Generator provides the tools you need to create exceptional content efficiently and effectively.
          </p>
          <p>
            Experience the future of content creation today and see how our platform can transform your content strategy.
          </p>
        </section>
      </div>
    </div>
  );
};

export default About;