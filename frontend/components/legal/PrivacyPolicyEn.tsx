export function PrivacyPolicyEn() {
  return (
    <div className="space-y-4">
      <p><strong>Last Updated:</strong> May 6, 2026</p>
      <p>Welcome to <strong>webdoc.life</strong>. We take your medical privacy with the utmost seriousness. This Policy describes how we process and protect your data.</p>
      
      <h3 className="text-lg font-bold mt-6 text-slate-800">1. Data Collection and Processing</h3>
      <p>When you upload medical documents (PDFs or images) for analysis, we extract the text from them. We also store basic profile information (age, gender, biometric data) that you provide voluntarily to improve the accuracy of the AI analysis.</p>
      
      <h3 className="text-lg font-bold mt-6 text-slate-800">2. Data Anonymization (Core Feature)</h3>
      <p>Personal data security is the foundation of our architecture. Before the document text is sent to artificial intelligence algorithms (LLM), it passes through a <strong>strict local de-identification system (NLP anonymizer)</strong> on our secure servers.</p>
      <ul className="list-disc pl-6 space-y-1">
        <li>Your name, contact details, and other Personally Identifiable Information (PII) are <strong>stripped from the text</strong> and replaced with secure tokens.</li>
        <li>The Artificial Intelligence receives only "sanitized" medical indicators.</li>
      </ul>

      <h3 className="text-lg font-bold mt-6 text-slate-800">3. Use of Artificial Intelligence</h3>
      <p>We use advanced LLM models to structure and interpret sanitized medical data. The AI provides reference information, which does not constitute a medical diagnosis. Third-party AI providers do not train their models on your documents.</p>

      <h3 className="text-lg font-bold mt-6 text-slate-800">4. Your Rights</h3>
      <p>You have complete control over your data. In your Dashboard, you can permanently delete uploaded analyses, indicator history, or your entire profile at any time with a single click.</p>
    </div>
  );
}