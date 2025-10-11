import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertCircle } from 'lucide-react'

interface FeedbackDisplayProps {
  feedback: string
  strengths: string[]
  areasForImprovement: string[]
}

export function FeedbackDisplay({ feedback, strengths, areasForImprovement }: FeedbackDisplayProps) {
  return (
    <Card className="mt-8 animate-slide-up border-2">
      <CardHeader>
        <CardTitle className="text-2xl">Interview Feedback</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Feedback */}
        <div>
          <h3 className="font-semibold text-lg mb-3">Overall Analysis</h3>
          <div className="prose prose-sm max-w-none">
            <p className="text-muted-foreground whitespace-pre-wrap">{feedback}</p>
          </div>
        </div>

        {/* Strengths */}
        {strengths.length > 0 && (
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              What You Did Well
            </h3>
            <ul className="space-y-2">
              {strengths.map((strength, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5 bg-green-500/10 text-green-700 border-green-500/20">
                    ✓
                  </Badge>
                  <span className="text-sm text-foreground/90">{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Areas for Improvement */}
        {areasForImprovement.length > 0 && (
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              Areas for Improvement
            </h3>
            <ul className="space-y-3">
              {areasForImprovement.map((area, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5 bg-orange-500/10 text-orange-700 border-orange-500/20">
                    !
                  </Badge>
                  <span className="text-sm text-foreground/90">{area}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
