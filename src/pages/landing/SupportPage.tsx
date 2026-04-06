import { FC, useState } from "react";
import { motion } from "framer-motion";
import { SupportComs } from "@/core/coms/hooks";
import { toast } from "sonner";
import {
  MessageSquare, Mail, Clock, Send, CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const SupportPage: FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("general");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (message.trim().length > 2000) {
      toast.error("Message must be under 2000 characters.");
      return;
    }

    setSending(true);
    try {
      // Route through ComsSystem — creates ticket + inbox entry + log
      await SupportComs.submitTicket({
        subject: subjects.find(s => s.value === subject)?.label || subject,
        message: message.trim(),
        priority: "normal",
        sourceApp: subject === "general" || subject === "partnership" || subject === "services" ? "ComsSystem" : subject.toUpperCase(),
        userEmail: email,
        userName: name,
      });
      setSubmitted(true);
      toast.success("Your inquiry has been submitted. We'll respond within 48 hours.");
    } catch {
      toast.error("Failed to submit. Please try again or email support@amineva.com.");
    } finally {
      setSending(false);
    }
  };

  const subjects = [
    { value: "general", label: "General Inquiry" },
    { value: "agstock", label: "AGStock" },
    { value: "agis", label: "AGIS" },
    { value: "amniva", label: "Amniva" },
    { value: "agroclimate", label: "AgroClimate" },
    { value: "partnership", label: "Partnership" },
    { value: "services", label: "Services" },
  ];

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <MessageSquare className="h-12 w-12 text-accent mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">How Can We Help?</h1>
            <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
              Have a question about any of our applications, partnership opportunities, or services? Send us a message and we'll get back to you within 48 hours.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Info Cards */}
      <section className="max-w-5xl mx-auto -mt-12 px-6 relative z-20">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Mail, title: "Email Us", desc: "support@amineva.com" },
            { icon: Clock, title: "Response Time", desc: "Within 48 hours" },
            { icon: CheckCircle, title: "We Cover", desc: "All Amineva apps & services" },
          ].map((card, i) => (
            <motion.div key={card.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="p-6 rounded-xl border border-border bg-card shadow-lg text-center">
              <card.icon className="h-8 w-8 text-accent mx-auto mb-3" />
              <h3 className="font-semibold text-foreground">{card.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{card.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Form */}
      <section className="max-w-3xl mx-auto py-20 px-6">
        {submitted ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16">
            <div className="h-20 w-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-success" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">Message Sent Successfully!</h2>
            <p className="text-muted-foreground mb-6">We've received your inquiry and will respond within 48 hours. Check your email for updates.</p>
            <Button variant="outline" onClick={() => { setSubmitted(false); setName(""); setEmail(""); setMessage(""); setSubject("general"); }}>
              Send Another Message
            </Button>
          </motion.div>
        ) : (
          <motion.form initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground">Send Us a Message</h2>
              <p className="text-muted-foreground mt-2">Fill in the form below and our team will get back to you.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Full Name *</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={100} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Email Address *</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" maxLength={255} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Subject</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {subjects.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Message *</label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe your inquiry..." rows={6} maxLength={2000} />
              <p className="text-xs text-muted-foreground mt-1">{message.length}/2000 characters</p>
            </div>

            <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-12 text-base">
              <Send className="h-4 w-4 mr-2" /> Send Message
            </Button>
          </motion.form>
        )}
      </section>
    </div>
  );
};

export default SupportPage;
