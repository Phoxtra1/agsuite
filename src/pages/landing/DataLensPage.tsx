import { FC } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Globe, Code, Server, Wrench, Database, Cpu,
  ArrowRight, Users, CheckCircle2, Shield, Building2
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const DataLensPage: FC = () => {
  const serviceCategories = [
    {
      icon: Globe,
      title: "Website & Application Maintenance",
      desc: "Full lifecycle maintenance, stability monitoring, performance optimization, and active security management for mission-critical web applications.",
      items: [
        "Website and application troubleshooting, bug fixes, and performance optimization",
        "Hosting and uptime management of existing web platforms where agreed and supported",
        "Domain registration assistance, DNS record routing, and SSL certificate maintenance",
        "Regular dependency updates, vulnerability patches, and scheduled code health audits",
      ],
    },
    {
      icon: Code,
      title: "Software & App Development",
      desc: "Custom full-stack web and mobile application engineering built for performance, scale, resilience, and operational excellence.",
      items: [
        "End-to-end custom application development tailored to unique organizational workflows",
        "Modern frontend frameworks, responsive UI architecture, and robust backend engineering",
        "REST and GraphQL API development, external service integrations, and webhooks",
        "Scalable, maintainable codebases with comprehensive testing and documentation",
      ],
    },
    {
      icon: Server,
      title: "Cloud Infrastructure & Deployment",
      desc: "Scalable cloud architecture, continuous deployment pipelines, server provisioning, containerization, and high-availability operations.",
      items: [
        "Self-hosted and multi-cloud environment configuration and provisioning",
        "Containerized application deployment with Docker, modern orchestration, and automated CI/CD",
        "High availability, automated backups, fault tolerance, and disaster recovery planning",
        "Performance tuning, server resource optimization, and infrastructure cost management",
      ],
    },
    {
      icon: Wrench,
      title: "IT Support & Technical Troubleshooting",
      desc: "Dedicated technical problem diagnosis, operational IT assistance, hardware/software configuration, and enterprise email connectivity.",
      items: [
        "Rapid diagnosis and resolution of system faults, hardware glitches, and application errors",
        "Enterprise business email setup, SPF/DKIM/DMARC authentication, and domain routing",
        "Operating system configuration, workstation setup, and software license management",
        "Network connectivity diagnostics, secure remote access, and technical user support",
      ],
    },
    {
      icon: Database,
      title: "Database & Data Management",
      desc: "Enterprise data architecture, secure relational/NoSQL database management, schema migration, indexing, and backup automation.",
      items: [
        "Relational (PostgreSQL, MySQL) and NoSQL database installation, clustering, and tuning",
        "Database schema design, query optimization, indexing strategies, and performance audits",
        "Automated backup strategies, replication, point-in-time recovery, and data security",
        "Data hygiene, automated ETL pipelines, migration, and secure data access governance",
      ],
    },
    {
      icon: Cpu,
      title: "Business Process Automation & System Integration",
      desc: "Connecting disparate platforms, automating recurring business tasks, syncing data across services, and eliminating operational friction.",
      items: [
        "Cross-platform integration between CRM, ERP, finance, communication, and storage systems",
        "Workflow automation for repetitive manual tasks, ticket routing, and notification triggers",
        "Custom API bridges, webhooks, and middleware connecting legacy systems to modern tools",
        "Efficiency audits to identify operational bottlenecks and implement automated solutions",
      ],
    },
  ];

  const steps = [
    { step: "1", title: "Submit Service Enquiry", desc: "Contact DataLens or submit your service request specifying your IT service, software, cloud, or technical support requirements." },
    { step: "2", title: "Scope & Requirement Assessment", desc: "Our technical team evaluates your system needs, audits technical requirements, and determines exact deliverables and milestones." },
    { step: "3", title: "Tailored Engagement Agreement", desc: "Agreements are structured clearly according to project scope, milestone pricing, timeline, or ongoing maintenance SLAs." },
    { step: "4", title: "Service Execution", desc: "DataLens engineers execute development, server configuration, database tuning, troubleshooting, or systems automation." },
    { step: "5", title: "Delivery & Continuous Support", desc: "Receive fully configured systems, deployed applications, verification reports, and dedicated ongoing maintenance." },
  ];

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative py-24 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
        <div className="relative z-10 max-w-5xl mx-auto text-center px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/20 text-accent text-sm font-medium mb-6">
              <Wrench className="h-4 w-4" /> Professional IT Services
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-6">
              Enterprise IT Services<br />
              <span className="text-accent">Tailored to Your Operations</span>
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-3xl mx-auto mb-8 leading-relaxed">
              DataLens provides comprehensive IT services covering website and application maintenance, custom software development, cloud infrastructure and deployment, IT support and troubleshooting, database management, and business process automation.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/support"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition text-lg"
              >
                Request IT Service <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section className="max-w-7xl mx-auto py-20 px-6">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-accent uppercase tracking-wider">Official IT Services</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">IT Services Provided by DataLens</h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            All engagements are delivered on a dedicated service basis, with scope, SLA, deliverables, and terms tailored to each client's specific requirements.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {serviceCategories.map((s, i) => (
            <motion.div
              key={s.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
              className="p-8 rounded-2xl border border-border bg-card shadow-sm hover:border-accent/50 transition flex flex-col justify-between"
            >
              <div>
                <div className="p-3 rounded-xl bg-accent/10 text-accent w-fit mb-5">
                  <s.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">{s.desc}</p>
              </div>

              <div className="space-y-2.5 pt-6 border-t border-border/60">
                {s.items.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-foreground/90">
                    <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* IT Service Summary Box */}
      <section className="bg-secondary/60 py-16 px-6 border-y border-border">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span className="text-xs font-bold text-accent uppercase tracking-widest">IT & Technical Infrastructure</span>
          <h3 className="text-2xl font-bold text-foreground">Flexible Technical Support for Your Organization</h3>
          <p className="text-muted-foreground leading-relaxed">
            Our IT services cover website and application maintenance, custom software development, cloud and server deployment, database and data architecture, business email configuration, and technical troubleshooting. Engagements are tailored directly to client requirements and agreed operational scope.
          </p>
        </div>
      </section>

      {/* Step-by-Step Engagement */}
      <section className="max-w-5xl mx-auto py-20 px-6">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-accent uppercase tracking-wider">How We Work</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">Service Delivery Workflow</h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">Engagements are structured around client needs, agreed milestones, clear technical scope, and verified execution.</p>
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
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Who Benefits from DataLens IT Services?</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Building2, title: "Growing Enterprises & Businesses", desc: "Reliable application maintenance, business email setup, database management, and process automation to drive productivity." },
            { icon: Users, title: "Institutions & Organizations", desc: "Secure cloud deployment, custom software development, system integrations, and dedicated technical troubleshooting." },
            { icon: Shield, title: "Platform & Product Operators", desc: "High-uptime server infrastructure, containerized deployments, automated backups, and proactive technical maintenance." },
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
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">Discuss Your IT Requirements with DataLens</h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
            Reach out to our engineering team to define your project scope, request software development, cloud infrastructure, or dedicated technical support.
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
