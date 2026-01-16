import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Eye, Scale } from 'lucide-react';

export function WhyAminevaPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h2 className="text-3xl font-bold text-foreground mb-4">Why Amineva Global?</h2>
        <p className="text-lg text-muted-foreground">
          Our multidisciplinary team ensures every report, dataset, observation, analysis, and insight 
          we produce contributes to real-time progress and transparent accountability.
        </p>
      </div>

      {/* Key Differentiators */}
      <div className="grid md:grid-cols-3 gap-8">
        <Card className="text-center border-accent/20 hover:border-accent/40 transition-colors">
          <CardContent className="pt-8 pb-8">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6">
              <Users className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-4">Multidisciplinary Expertise</h3>
            <p className="text-muted-foreground leading-relaxed">
              Our team brings together experts from diverse fields—finance, engineering, operations, 
              and data science—to provide comprehensive insights that single-discipline approaches cannot match.
            </p>
          </CardContent>
        </Card>

        <Card className="text-center border-accent/20 hover:border-accent/40 transition-colors">
          <CardContent className="pt-8 pb-8">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6">
              <Eye className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-4">Verified Field Intelligence</h3>
            <p className="text-muted-foreground leading-relaxed">
              Every piece of intelligence we produce is grounded in real-world verification. 
              We don't rely on assumptions—our findings come from direct field observations and validated sources.
            </p>
          </CardContent>
        </Card>

        <Card className="text-center border-accent/20 hover:border-accent/40 transition-colors">
          <CardContent className="pt-8 pb-8">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6">
              <Scale className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-4">Transparent Accountability</h3>
            <p className="text-muted-foreground leading-relaxed">
              We maintain clear documentation and audit trails for all our work. 
              Our clients always know exactly how we arrived at our conclusions and recommendations.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mission Statement */}
      <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-accent/20">
        <CardContent className="py-12 text-center max-w-4xl mx-auto">
          <blockquote className="text-2xl font-medium text-foreground leading-relaxed italic">
            "Our mission is to bridge the gap between information and execution, 
            empowering project owners, investors, institutions, and decision makers 
            with verified field insights that drive real results."
          </blockquote>
          <div className="mt-6 text-muted-foreground">— Amineva Global</div>
        </CardContent>
      </Card>

      {/* Trust Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-6 text-center bg-card rounded-lg border border-border">
          <div className="text-3xl font-bold text-accent mb-2">100%</div>
          <div className="text-sm text-muted-foreground">Verified Data</div>
        </div>
        <div className="p-6 text-center bg-card rounded-lg border border-border">
          <div className="text-3xl font-bold text-accent mb-2">24/7</div>
          <div className="text-sm text-muted-foreground">Support</div>
        </div>
        <div className="p-6 text-center bg-card rounded-lg border border-border">
          <div className="text-3xl font-bold text-accent mb-2">50+</div>
          <div className="text-sm text-muted-foreground">Projects</div>
        </div>
        <div className="p-6 text-center bg-card rounded-lg border border-border">
          <div className="text-3xl font-bold text-accent mb-2">15+</div>
          <div className="text-sm text-muted-foreground">Industries</div>
        </div>
      </div>
    </div>
  );
}
