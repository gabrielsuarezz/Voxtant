import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { JobTextForm } from '@/components/job/JobTextForm'
import { Logo } from '@/components/ui/logo'
import { Sparkles, Mic, Brain } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen py-16 px-4 relative overflow-hidden">
      {/* Hero Section */}
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-16 animate-fade-in">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Logo size="xl" showText={true} clickable={false} />
          </div>

          {/* Tagline */}
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground/80 mb-4 animate-slide-up">
            Master Your Next Interview with AI
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Practice with real-time EQ feedback, personalized questions, and intelligent coaching
          </p>

          {/* Feature badges */}
          <div className="flex flex-wrap justify-center gap-3 mt-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full glass-card border-2 border-primary/20">
              <Brain className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">AI-Powered</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full glass-card border-2" style={{ borderColor: 'hsl(175, 85%, 45%, 0.2)' }}>
              <Mic className="w-4 h-4" style={{ color: 'hsl(175, 85%, 45%)' }} />
              <span className="text-sm font-medium text-foreground">Voice Analysis</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full glass-card border-2" style={{ borderColor: 'hsl(270, 80%, 60%, 0.2)' }}>
              <Sparkles className="w-4 h-4" style={{ color: 'hsl(270, 80%, 60%)' }} />
              <span className="text-sm font-medium text-foreground">Real-Time Feedback</span>
            </div>
          </div>
        </div>

        {/* Main Input Card with Glassmorphism */}
        <div className="animate-scale-in" style={{ animationDelay: '0.3s' }}>
          <Card className="glass-card border-2 hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-2xl">Get Started</CardTitle>
              <CardDescription className="text-base">
                Paste a job description to generate personalized interview questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <JobTextForm />
            </CardContent>
          </Card>
        </div>

        {/* How it works section */}
        <div className="mt-16 grid md:grid-cols-3 gap-6 stagger-fade-in">
          <div className="text-center p-6 rounded-xl glass-card border-2 border-primary/20 hover:border-primary/40 transition-all duration-300">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary">1</span>
            </div>
            <h3 className="font-semibold mb-2 text-foreground">Paste Job Description</h3>
            <p className="text-sm text-muted-foreground">
              Our AI extracts key requirements and skills
            </p>
          </div>

          <div className="text-center p-6 rounded-xl glass-card border-2 hover:border-opacity-60 transition-all duration-300" style={{ borderColor: 'hsl(175, 85%, 45%, 0.2)' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'hsl(175, 85%, 45%, 0.2)' }}>
              <span className="text-2xl font-bold" style={{ color: 'hsl(175, 85%, 45%)' }}>2</span>
            </div>
            <h3 className="font-semibold mb-2 text-foreground">Review & Generate</h3>
            <p className="text-sm text-muted-foreground">
              Customize questions tailored to the role
            </p>
          </div>

          <div className="text-center p-6 rounded-xl glass-card border-2 hover:border-opacity-60 transition-all duration-300" style={{ borderColor: 'hsl(270, 80%, 60%, 0.2)' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'hsl(270, 80%, 60%, 0.2)' }}>
              <span className="text-2xl font-bold" style={{ color: 'hsl(270, 80%, 60%)' }}>3</span>
            </div>
            <h3 className="font-semibold mb-2 text-foreground">Practice & Improve</h3>
            <p className="text-sm text-muted-foreground">
              Get real-time feedback on your responses
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
