import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Target, Database, Link2, Shield, Eye, CheckCircle, TrendingUp, Sparkles, CloudSun } from 'lucide-react';

export function OverviewPage() {
  return (
    <div className="space-y-8">
      {/* What Amineva Global Is */}
      <section>
        <Card className="border-accent/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Globe className="h-6 w-6 text-accent" />
              What is Amineva Global?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Amineva Global is a technology and innovation company developing intelligent digital systems that support
              operational intelligence, predictive analytics, environmental monitoring, research, verification, and service
              efficiency across critical African sectors — agriculture, climate resilience, transport, commerce, and digital trade.
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
              What Problem We Solve
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Decision-makers across Africa lack connected intelligence systems for operations, climate, finance, and verification.
              Amineva Global builds the ecosystem-grade infrastructure that unifies these capabilities — so insight, oversight,
              and action flow as one connected layer.
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
              Intelligence Sources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg text-muted-foreground leading-relaxed">
              Firsthand field intelligence, secondary institutional sources, and AI-driven analysis combine into a
              continuous intelligence pipeline that powers every platform in the ecosystem.
            </p>
            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <div className="p-4 bg-accent/10 rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">Firsthand Field Data</h4>
                <p className="text-sm text-muted-foreground">Direct observations, inspections, and verified assessments from the ground.</p>
              </div>
              <div className="p-4 bg-accent/10 rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">Institutional Sources</h4>
                <p className="text-sm text-muted-foreground">Verified reports, regulatory data, and trusted institutional records.</p>
              </div>
              <div className="p-4 bg-accent/10 rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">AI-Driven Analysis</h4>
                <p className="text-sm text-muted-foreground">Predictive models, pattern detection, and intelligence synthesis.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Platform Ecosystem */}
      <section>
        <Card className="border-accent/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Link2 className="h-6 w-6 text-accent" />
              The Platform Ecosystem
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-lg text-muted-foreground leading-relaxed">
              Each platform is a connected division of one ecosystem — sharing identity, intelligence, and infrastructure
              to deliver <span className="font-semibold text-foreground">visibility → verification → execution → protection</span>
              {" "}across sectors.
            </p>

            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <EcoCard icon={Sparkles} title="Odeneho AI"
                desc="Intelligent companion for research, writing, planning, documentation, storytelling, knowledge systems, and data analysis." />
              <EcoCard icon={CloudSun} title="Agyenkwa"
                desc="Climate-tech and environmental intelligence infrastructure for agriculture, forecasting, transport resilience, and operational risk." />
              <EcoCard icon={Shield} title="Nyansa"
                desc="AI-backed inventory, commerce, sales, and operational management infrastructure for smart business systems." />
              <EcoCard icon={CheckCircle} title="Nkɔsoɔ"
                desc="Strategic assessment, field inspection, verification, operational intelligence, and documentation infrastructure." />
              <EcoCard icon={TrendingUp} title="Sikasɛm"
                desc="AI-backed financial operations, monitoring systems, workflow intelligence, and operational oversight infrastructure." />
              <EcoCard icon={Eye} title="ABI"
                desc="Amineva Business Intelligence — unified BI infrastructure for dashboards, KPIs, market analytics, and data-driven decision support across the ecosystem." />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Quick Context Cards */}
      <section className="grid md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-accent/10 to-transparent border-accent/20">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-accent mb-2">Ecosystem</div>
            <div className="text-sm text-muted-foreground">Connected Infrastructure</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-accent/10 to-transparent border-accent/20">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-accent mb-2">AI-Backed</div>
            <div className="text-sm text-muted-foreground">Intelligence Layer</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-accent/10 to-transparent border-accent/20">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-accent mb-2">Africa-Focused</div>
            <div className="text-sm text-muted-foreground">Continental Scale</div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function EcoCard({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="flex gap-4 p-4 rounded-lg border border-border hover:border-accent/50 transition-colors">
      <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
        <Icon className="h-6 w-6 text-accent" />
      </div>
      <div>
        <h4 className="font-semibold text-foreground mb-1">{title}</h4>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

