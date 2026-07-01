import { FC } from "react";
import { motion } from "framer-motion";

const PrivacyPage: FC = () => {
  const effectiveDate = "March 1, 2025";

  return (
    <div className="w-full">
      <section className="relative py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">Privacy Policy</h1>
            <p className="text-primary-foreground/80">Effective Date: {effectiveDate}</p>
          </motion.div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto py-16 px-6">
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-3">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">Amineva Global ("Amineva," "we," "us," or "our") is committed to protecting the privacy and security of your personal information. This Privacy Policy describes how we collect, use, disclose, and safeguard your information when you use our platforms and services, including Nyansa, Nkɔsoɔ, ABI, Sikasɛm, Agyenkwa, and Adesua.</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-3">2. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">We may collect the following types of information:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li><strong className="text-foreground">Personal Information:</strong> Name, email address, phone number, business name, and billing information provided during registration</li>
              <li><strong className="text-foreground">Usage Data:</strong> Information about how you interact with our Services, including pages visited, features used, and time spent</li>
              <li><strong className="text-foreground">Device Information:</strong> Browser type, operating system, IP address, and device identifiers</li>
              <li><strong className="text-foreground">Business Data:</strong> Inventory records, sales data, and operational information you input into our platforms</li>
              <li><strong className="text-foreground">Location Data:</strong> Geographic location when you use location-dependent features such as Agyenkwa</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>To provide, maintain, and improve our Services</li>
              <li>To process transactions and send related information</li>
              <li>To send administrative notifications, updates, and security alerts</li>
              <li>To respond to your inquiries and provide customer support</li>
              <li>To personalize your experience and deliver relevant content</li>
              <li>To monitor and analyze usage trends to improve our platforms</li>
              <li>To detect, prevent, and address fraud and security issues</li>
              <li>To comply with legal obligations</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-3">4. Data Sharing and Disclosure</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">We do not sell your personal information. We may share your information with:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li><strong className="text-foreground">Service Providers:</strong> Trusted third parties who assist us in operating our platforms (hosting, analytics, payment processing)</li>
              <li><strong className="text-foreground">Legal Compliance:</strong> When required by law, regulation, or legal process</li>
              <li><strong className="text-foreground">Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              <li><strong className="text-foreground">With Your Consent:</strong> When you explicitly authorize sharing</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-3">5. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">We implement industry-standard security measures including 256-bit encryption, secure authentication protocols, and regular security audits. While we strive to protect your data, no method of electronic transmission or storage is 100% secure, and we cannot guarantee absolute security.</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-3">6. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">We retain your personal information for as long as your account is active or as needed to provide Services. Upon account deletion, we will remove your personal data within 30 days, except where retention is required by law or for legitimate business purposes.</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-3">7. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Access, correct, or delete your personal information</li>
              <li>Object to or restrict the processing of your data</li>
              <li>Data portability — receive your data in a structured format</li>
              <li>Withdraw consent at any time where processing is based on consent</li>
              <li>Lodge a complaint with a data protection authority</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-3">8. Cookies and Tracking</h2>
            <p className="text-muted-foreground leading-relaxed">We use cookies and similar technologies to enhance your experience, analyze usage patterns, and deliver relevant content. You can manage cookie preferences through your browser settings. Essential cookies required for platform functionality cannot be disabled.</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-3">9. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">Our Services are not intended for individuals under 16 years of age. We do not knowingly collect personal information from children. If we become aware that we have collected data from a child, we will take steps to delete it promptly.</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-3">10. International Data Transfers</h2>
            <p className="text-muted-foreground leading-relaxed">Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place for international data transfers in compliance with applicable data protection laws.</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-3">11. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">We may update this Privacy Policy periodically. Changes will be posted on this page with an updated effective date. Continued use of the Services after changes constitutes acceptance of the updated Policy.</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-3">12. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">For privacy-related inquiries, contact our Data Protection team at: <strong className="text-foreground">privacy@amineva.com</strong></p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPage;
