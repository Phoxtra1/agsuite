import { FC } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Search, FileText, MapPin, Shield, Wrench, Globe, Server,
  ArrowRight, ClipboardList, Users, Eye, CheckCircle2, Mail,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const DataLensPage: FC = () => {
  const serviceCategories = [
    {
      icon: Search,
      title: "Data and Insight",
      desc: "Data-related services that help clients understand information, identify meaningful patterns, assess findings, and support informed decisions.",
      items: [
        "Data analysis, interpretation, and trend identification",
        "Preparation of analytical reports and actionable insights",
        "Supporting evidence-based planning and strategic decisions",
        "Supporting data preparation, organization, cleaning, and validation",
      ],
    },
    {
      icon: MapPin,
      title: "Field Project Inspection",
      desc: "Field-based project inspection and verification services to deliver independent on-ground monitoring and progress verification.",
      items: [
        "Conducting field observations and independent site inspections",
        "Gathering and verifying on-ground project information with visual evidence",
        "Documenting findings and structured field observations",
        "Preparing inspection reports to support project monitoring",
      ],
    },
    {
      icon: Shield,
      title: "Strategic Assessment",
      desc: "Evaluating business situations, projects, operational challenges, and opportunities to support better planning and execution.",
      items: [
        "Evaluating current situations and operational challenges",
        "Assessing project or business performance against agreed criteria",
        "Identifying gaps, operational risks, and improvement opportunities",
        "Preparing clear findings and practical strategic recommendations",
      ],
    },
    {
      icon: FileText,
      title: "Business and Project Documentation",
      desc: "Tailored documentation services to produce high-impact, professional business and technical deliverables.",
      items: [
        "Business and project reports tailored to client requirements",
        "Project proposals, company profiles, and pitch documentation",
        "Structured professional reports and technical briefs",
        "Documentation of findings, assessments, and recommendations",
      ],
    },
    {
      icon: Wrench,
      title: "IT Services",
      desc: "Comprehensive IT services covering website maintenance, cloud deployment, hosting where agreed, and technical troubleshooting.",
      subAreas: [
        {
          subTitle: "Website and Application Maintenance",
          icon: Globe,
          points: [
            "Website and application troubleshooting, bug fixes, and performance improvements",
            "Hosting of existing websites and web applications where agreed and supported",
            "Domain registration assistance, renewal coordination, and DNS configuration",
            "HTTPS and SSL certificate configuration included in hosting setup",
            "Software updates and ongoing technical maintenance tailored to client scope",
          ],
        },
        {
          subTitle: "Cloud, Server and Deployment",
          icon: Server,
          points: [
            "Cloud and server environment configuration and setup",
            "Application deployment and deployment troubleshooting",
            "Environment configuration and operational reliability improvements",
            "Technical assistance with supported cloud and server infrastructure",
          ],
        },
        {
          subTitle: "IT System Support and Technical Troubleshooting",
          icon: Mail,
          points: [
            "IT system troubleshooting and technical problem diagnosis",
            "Software installation, configuration, and application support",
            "Business email setup, domain connection, and DNS record configuration",
            "Basic network configuration and connectivity troubleshooting",
          ],
        },
      ],
    },
  ];

  const steps = [
    { step: "1", title: "Submit Service Enquiry", desc: "Contact DataLens or submit your service request specifying your data, inspection, documentation, or IT service requirements." },
    { step: "2", title: "Scope & Requirement Assessment", desc: "Our team evaluates your project needs, assesses technical or analytical scope, and determines clear deliverables." },
    { step: "3", title: "Tailored Engagement Agreement", desc: "Agreements are structured according to project scope, price, duration, or ongoing maintenance arrangements." },
    { step: "4", title: "Service Execution", desc: "DataLens carries out the agreed data analysis, site inspection, strategic review, documentation, or technical setup." },
    { step: "5", title: "Delivery & Support", desc: "Receive detailed reports, verified insights, configured applications, or agreed ongoing IT maintenance." },
  ];

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative py-24 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
        <div className="relative z-10 max-w-5xl mx-auto text-center px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/20 text-accent text-sm font-medium mb-6">
              <Eye className="h-4 w-4" /> Professional IT & Data Services
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-6">
              Data, Inspection & IT Services<br />
              <span className="text-accent">Tailored to Your Scope</span>
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-3xl mx-auto mb-8 leading-relaxed">
              DataLens provides data and insight, field project inspection, strategic assessment, business and project documentation, and IT services to help organizations understand information, assess projects, document findings, and address technical challenges.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/support"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition text-lg"
              >
                Request Service <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section className="max-w-7xl mx-auto py-20 px-6">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-accent uppercase tracking-wider">Official Service Categories</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">Services Provided by DataLens</h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            All engagements are delivered on a service basis, with scope, duration, deliverables, and terms tailored to each client's specific agreement.
          </p>
        </div>

        <div className="space-y-12">
          {serviceCategories.map((s, i) => (
            <motion.div
              key={s.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
              className="p-8 rounded-2xl border border-border bg-card shadow-sm hover:border-accent/50 transition"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-accent/10 text-accent">
                  <s.icon className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground">{s.title}</h3>
                  <p className="text-muted-foreground text-sm mt-1">{s.desc}</p>
                </div>
              </div>

              {s.items && (
                <div className="grid md:grid-cols-2 gap-3 mt-6 pt-6 border-t border-border/60">
                  {s.items.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-foreground/90">
                      <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              )}

              {s.subAreas && (
                <div className="grid lg:grid-cols-3 gap-6 mt-6 pt-6 border-t border-border/60">
                  {s.subAreas.map((sub, sIdx) => (
                    <div key={sIdx} className="p-5 rounded-xl bg-secondary/50 border border-border/80">
                      <div className="flex items-center gap-2 mb-3">
                        <sub.icon className="h-5 w-5 text-accent" />
                        <h4 className="font-semibold text-foreground text-sm">{sub.subTitle}</h4>
                      </div>
                      <ul className="space-y-2">
                        {sub.points.map((pt, ptIdx) => (
                          <li key={ptIdx} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <span className="h-1.5 w-1.5 rounded-full bg-accent mt-1 flex-shrink-0" />
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* IT Service Summary Box */}
      <section className="bg-secondary/60 py-16 px-6 border-y border-border">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span className="text-xs font-bold text-accent uppercase tracking-widest">IT & Technical Services</span>
          <h3 className="text-2xl font-bold text-foreground">Flexible Technical Support for Your Infrastructure</h3>
          <p className="text-muted-foreground leading-relaxed">
            Our IT services cover website and application maintenance, hosting where required, domain and DNS configuration, deployment support, cloud and server management, email configuration, and technical troubleshooting. Services are tailored to each client's requirements and agreed scope.
          </p>
        </div>
      </section>

      {/* Step-by-Step Engagement */}
      <section className="max-w-5xl mx-auto py-20 px-6">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-accent uppercase tracking-wider">How We Work</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">Service Delivery Workflow</h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">Engagements are structured around client needs, agreed pricing, clear scope, and verified execution.</p>
        </div>
        <div className="space-y-4">
          {steps.map((s, i) => (
            <motion.div key={s.step} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="flex items-start gap-5 p-5 rounded-xl border border-border bg-card">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-accent text-accent-foreground font-bold flex items-center justify-center text-lg">
                {s.step}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{s.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Who Benefits */}
      <section className="max-w-7xl mx-auto py-20 px-6 border-t border-border">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Who Benefits from DataLens Services?</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Users, title: "Investors & Decision Makers", desc: "Strategic assessment, feasibility reviews, risk evaluation, and due diligence reporting before making capital commitments." },
            { icon: ClipboardList, title: "Institutions & Businesses", desc: "Data analysis, analytical report preparation, structured documentation, and tailored IT technical support." },
            { icon: MapPin, title: "Project Owners & Developers", desc: "Independent field inspections, verified visual observations, progress monitoring, and cloud application maintenance." },
          ].map((b, i) => (
            <motion.div key={b.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="p-6 rounded-xl border border-border bg-card text-center">
              <b.icon className="h-10 w-10 text-accent mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">{b.title}</h3>
              <p className="text-sm text-muted-foreground">{b.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-r from-primary to-primary/90 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">Discuss Your Engagement with DataLens</h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
            Reach out to our team to define your project scope, request data services, field inspections, documentation, or technical support.
          </p>
          <Link
            to="/support"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition text-lg"
          >
            Contact DataLens <ArrowRight className="h-5 w-5" />
          </Link>
        </motion.div>
      </section>
    </div>
  );
};

export default DataLensPage;
