import { FC } from "react";
import { motion } from "framer-motion";

const TermsPage: FC = () => {
  const effectiveDate = "March 1, 2025";

  return (
    <div className="w-full">
      <section className="relative py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">Terms of Service</h1>
            <p className="text-primary-foreground/80">Effective Date: {effectiveDate}</p>
          </motion.div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto py-16 px-6">
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">By accessing or using any services provided by Amineva Global ("Amineva," "we," "us," or "our"), including but not limited to Nyansa, Nkɔsoɔ, ABI, Sikasɛm, Agyenkwa, and Adesua (collectively, the "Services"), you agree to be bound by these Terms of Service. If you do not agree to these Terms, you must not use the Services.</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-3">2. Description of Services</h2>
            <p className="text-muted-foreground leading-relaxed">Amineva provides technology-driven digital platforms for operations management, data intelligence, market forecasting, agricultural technology, and related services. Each product within the Amineva ecosystem may have additional terms specific to that service.</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-3">3. User Accounts</h2>
            <p className="text-muted-foreground leading-relaxed">You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-3">4. Acceptable Use</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">You agree not to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Use the Services for any unlawful purpose or in violation of any applicable laws</li>
              <li>Attempt to gain unauthorized access to any part of the Services or systems</li>
              <li>Transmit any malicious code, viruses, or harmful content</li>
              <li>Interfere with or disrupt the integrity or performance of the Services</li>
              <li>Collect or harvest any personally identifiable information from other users</li>
              <li>Use the Services to send unsolicited communications or spam</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-3">5. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">All content, features, and functionality of the Services, including but not limited to text, graphics, logos, icons, software, and documentation, are the exclusive property of Amineva Global and are protected by international copyright, trademark, and other intellectual property laws.</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-3">6. Data Ownership</h2>
            <p className="text-muted-foreground leading-relaxed">You retain ownership of all data you submit to the Services. By using the Services, you grant Amineva a limited, non-exclusive license to process your data solely for the purpose of providing and improving the Services. We will not sell, rent, or share your data with third parties for marketing purposes.</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-3">7. Payment and Billing</h2>
            <p className="text-muted-foreground leading-relaxed">Certain Services may require payment. You agree to pay all fees associated with your selected plan. Fees are non-refundable except as required by applicable law or as explicitly stated in these Terms. We reserve the right to modify pricing with 30 days' written notice.</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-3">8. Service Availability</h2>
            <p className="text-muted-foreground leading-relaxed">We strive to maintain 99.9% uptime for all Services. However, we do not guarantee uninterrupted access and may perform scheduled maintenance with reasonable notice. We shall not be liable for any downtime caused by circumstances beyond our reasonable control.</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-3">9. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">To the maximum extent permitted by law, Amineva shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities, arising from your use of the Services.</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-3">10. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">We may suspend or terminate your access to the Services at any time for violation of these Terms. You may terminate your account at any time by contacting support. Upon termination, your right to use the Services ceases immediately, and we may delete your data after a 30-day grace period.</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-3">11. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">We reserve the right to modify these Terms at any time. Changes will be effective upon posting to our website. Your continued use of the Services after changes constitutes acceptance of the updated Terms.</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-3">12. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">These Terms shall be governed by and construed in accordance with applicable international commercial law. Any disputes arising from these Terms shall be resolved through binding arbitration.</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-3">13. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">For questions about these Terms, contact us at: <strong className="text-foreground">legal@amineva.com</strong></p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TermsPage;
