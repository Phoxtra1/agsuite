import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Filter, Lightbulb, Target, ArrowRight } from 'lucide-react';

interface StepCardProps {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  examples: string[];
}

function StepCard({ number, icon, title, description, examples }: StepCardProps) {
  return (
    <Card className="relative overflow-hidden border-accent/20 hover:border-accent/40 transition-colors">
      <div className="absolute top-0 left-0 w-16 h-16 bg-accent/10 flex items-center justify-center">
        <span className="text-2xl font-bold text-accent">{number}</span>
      </div>
      <CardHeader className="pt-8 pl-20">
        <CardTitle className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
            {icon}
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pl-20">
        <p className="text-muted-foreground mb-4">{description}</p>
        <div className="space-y-2">
          {examples.map((example, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span className="text-muted-foreground">{example}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function HowItWorksPage() {
  const steps: StepCardProps[] = [
    {
      number: 1,
      icon: <Database className="h-5 w-5 text-accent" />,
      title: 'Data Collection',
      description: 'We gather information from multiple verified sources including field observations, secondary research, and institutional records.',
      examples: [
        'On-site project inspections',
        'Market research and analysis',
        'Official records and filings',
        'Stakeholder interviews',
      ],
    },
    {
      number: 2,
      icon: <Filter className="h-5 w-5 text-accent" />,
      title: 'Analysis & Validation',
      description: 'Raw data undergoes rigorous cleaning, validation, and interpretation to ensure accuracy and reliability.',
      examples: [
        'Cross-referencing multiple sources',
        'Expert review and verification',
        'Data quality scoring',
        'Anomaly detection',
      ],
    },
    {
      number: 3,
      icon: <Lightbulb className="h-5 w-5 text-accent" />,
      title: 'Intelligence Generation',
      description: 'Validated data is transformed into actionable intelligence through reports, insights, and operational signals.',
      examples: [
        'Risk assessment reports',
        'Progress tracking dashboards',
        'Alert notifications',
        'Strategic recommendations',
      ],
    },
    {
      number: 4,
      icon: <Target className="h-5 w-5 text-accent" />,
      title: 'Decision Support',
      description: 'Intelligence powers better business decisions, reducing risk and improving execution outcomes.',
      examples: [
        'Investment protection',
        'Project accountability',
        'Fraud prevention',
        'Operational optimization',
      ],
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h2 className="text-3xl font-bold text-foreground mb-4">How Amineva Global Works</h2>
        <p className="text-lg text-muted-foreground">
          Our proven methodology transforms raw data into actionable intelligence that protects investments 
          and drives informed decision-making.
        </p>
      </div>

      {/* Flow Visual */}
      <div className="hidden lg:flex items-center justify-center gap-4 mb-12">
        {['Collect', 'Analyze', 'Generate', 'Execute'].map((step, idx) => (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
                <span className="text-lg font-bold text-accent">{idx + 1}</span>
              </div>
              <span className="text-sm font-medium text-foreground">{step}</span>
            </div>
            {idx < 3 && <ArrowRight className="h-6 w-6 text-accent/50" />}
          </React.Fragment>
        ))}
      </div>

      {/* Step Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {steps.map((step) => (
          <StepCard key={step.number} {...step} />
        ))}
      </div>

      {/* Bottom CTA */}
      <Card className="bg-gradient-to-r from-accent/10 to-accent/5 border-accent/20">
        <CardContent className="py-8 text-center">
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Ready to protect your investments?
          </h3>
          <p className="text-muted-foreground">
            Access our products and start making data-driven decisions today.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
