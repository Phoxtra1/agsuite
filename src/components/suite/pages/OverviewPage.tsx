import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Target, Database, Link2, Shield, Eye, CheckCircle, TrendingUp } from 'lucide-react';

export function OverviewPage() {
  return (
    <div className="space-y-8">
      {/* What Amineva Global Is */}
      <section>
        <Card className="border-accent/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Globe className="h-6 w-6 text-accent" />
              What is Amineva?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Amineva is a tech-driven information provider that creates and manages digital systems enabling 
              businesses and individuals to manage operations, receive insight, predict outcomes, verify decisions, 
              and deliver services efficiently.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* The Problem We Solve */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Target className="h-6 w-6 text-accent" />
              What Problem Are We Solving?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-muted-foreground leading-relaxed">
              In today's fast-paced world, many struggle to access actionable information for growth, 
              evaluate operational risks, or protect and measure the effectiveness of projects. 
              Decision-makers need reliable, verified intelligence to navigate complex business environments 
              and protect their investments.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Source of Data */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Database className="h-6 w-6 text-accent" />
              Our Data Sources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg text-muted-foreground leading-relaxed">
              We combine firsthand, secondary, and institutional data to support decision makers. 
              Actionable information is critical for investment success—ignoring it can lead to significant losses.
            </p>
            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <div className="p-4 bg-accent/10 rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">Firsthand Data</h4>
                <p className="text-sm text-muted-foreground">Direct field observations, inspections, and assessments conducted by our team.</p>
              </div>
              <div className="p-4 bg-accent/10 rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">Secondary Data</h4>
                <p className="text-sm text-muted-foreground">Verified reports, market research, and industry analysis from trusted sources.</p>
              </div>
              <div className="p-4 bg-accent/10 rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">Institutional Data</h4>
                <p className="text-sm text-muted-foreground">Official records, regulatory filings, and institutional documentation.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* How Products Fit Together */}
      <section>
        <Card className="border-accent/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Link2 className="h-6 w-6 text-accent" />
              The Amineva Ecosystem: How Our Products Work Together
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-lg text-muted-foreground leading-relaxed">
              All products are connected as one investment-protection ecosystem, providing 
              <span className="font-semibold text-foreground"> visibility → verification → execution → protection </span>
              to reduce waste, fraud, and investment losses across projects and businesses.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div className="flex gap-4 p-4 rounded-lg border border-border hover:border-accent/50 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <Eye className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">AgroClimate</h4>
                  <p className="text-sm text-muted-foreground">
                    AgroClimate provides real-time weather forecasts, agro production alerts, environmental predictions, Farming assistance, and learning resources built for community farming production.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 p-4 rounded-lg border border-border hover:border-accent/50 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">AGIS</h4>
                  <p className="text-sm text-muted-foreground">
                    Executes field work and assessments to generate verified data. The operational arm for data collection and validation.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 p-4 rounded-lg border border-border hover:border-accent/50 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">AminevaOps</h4>
                  <p className="text-sm text-muted-foreground">
                    Manages service delivery and operational accountability for organizations and service providers.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 p-4 rounded-lg border border-border hover:border-accent/50 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">AGStock</h4>
                  <p className="text-sm text-muted-foreground">
                    Protect daily business operations by tracking inventory, sales, and losses.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Quick Context Cards */}
      <section className="grid md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-accent/10 to-transparent border-accent/20">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-accent mb-2">100%</div>
            <div className="text-sm text-muted-foreground">Verified Field Intelligence</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-accent/10 to-transparent border-accent/20">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-accent mb-2">24/7</div>
            <div className="text-sm text-muted-foreground">Operational Monitoring</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-accent/10 to-transparent border-accent/20">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-accent mb-2">360°</div>
            <div className="text-sm text-muted-foreground">Investment Protection</div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
