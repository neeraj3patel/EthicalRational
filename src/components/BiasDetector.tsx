import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Shield, AlertTriangle, CheckCircle, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// FIX 1: The interface now exactly matches the JSON object from your backend API.
interface BiasAnalysis {
  severity: 'low' | 'medium' | 'high';
  overallAssessment: string;
  issues?: {
    sentence: string;
    bias: string;
    issue: string;
    solution: string;
  }[];
}

const BiasDetector = () => {
  const [inputText, setInputText] = useState('');
  const [analysis, setAnalysis] = useState<BiasAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const analyzeText = async () => {
    if (!inputText.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text to analyze.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysis(null); // Clear previous results

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
      const response = await fetch(`${apiBase}/analyze-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze text');
      }

      // FIX 2: Correctly handle the API response.
      // The backend sends the JSON object directly. We assign it directly to `data`.
      const data: BiasAnalysis = await response.json();
      
      setAnalysis(data);
      
      toast({
        title: "Analysis Complete",
        description: "Text has been analyzed for potential bias.",
      });

    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: (error as Error).message || "An unknown error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string): 'success' | 'warning' | 'destructive' | 'secondary' => {
    switch (severity) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'destructive';
      default: return 'secondary';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low': return <CheckCircle className="h-4 w-4" />;
      case 'medium': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-primary mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Ethical AI Detector
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Analyze your text content for potential bias and get actionable recommendations
            to make your communication more inclusive and fair.
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-8">
          {/* Text Input */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Text Analysis</CardTitle>
              <CardDescription>
                Paste the text you want to analyze for potential bias below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Enter or paste your text here..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="min-h-[200px] transition-smooth"
              />
              <Button
                onClick={analyzeText}
                disabled={isAnalyzing}
                className="w-full bg-gradient-primary hover:shadow-glow transition-smooth"
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Analyze for Bias
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
          {/* Results */}
          {analysis && (
            <section className="animate-fade-in">
              <div className="bg-white/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-lg p-8 max-w-2xl mx-auto mb-8 text-left">
                <header className="flex items-center mb-4">
                  <h2 className="text-2xl font-bold mr-4">Analysis Results</h2>
                  {/* FIX 3: Removed hardcoded background/text color to allow the variant to work correctly. */}
                  <Badge variant={getSeverityColor(analysis.severity)} className="flex items-center text-base px-3 py-1">
                    {getSeverityIcon(analysis.severity)}
                    <span className="ml-1 capitalize">{analysis.severity} Risk</span>
                  </Badge>
                </header>
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold">Severity:</span>
                    {/* FIX 3 (cont.): Removed hardcoded styling here too. */}
                    <Badge variant={getSeverityColor(analysis.severity)} className="capitalize">{analysis.severity}</Badge>
                  </div>
                  <div>
                    <span className="font-semibold">Assessment:</span>
                    <p className="mt-1 mb-0">
                      {analysis.overallAssessment && analysis.overallAssessment.trim() !== ''
                        ? analysis.overallAssessment
                        : <span className="text-muted-foreground">No assessment available.</span>
                      }
                    </p>
                  </div>
                </div>
                {Array.isArray(analysis.issues) && analysis.issues.length > 0 ? (
                  <div className="space-y-8 mt-6">
                    {analysis.issues.map((issue, idx) => (
                      <article key={idx} className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 border border-zinc-100 dark:border-zinc-700">
                        <h3 className="font-semibold text-base mb-2 text-primary">Issue #{idx + 1}</h3>
                        <div className="font-semibold mb-1">Sentence:</div>
                        <div className="mb-2 font-medium">"{issue.sentence}"</div>
                        <div className="mb-2 flex items-start gap-2">
                          <span className="text-xl">➤</span>
                          <blockquote className="border-l-4 border-primary pl-3 italic text-foreground/90">{issue.issue}</blockquote>
                        </div>
                        <div className="mb-1"><span className="font-semibold">Bias Type:</span> {issue.bias}</div>
                        <div className="mb-1"><span className="font-semibold">Proposed Solution:</span> {issue.solution}</div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground mt-6">No specific issues were found in the analysis.</div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default BiasDetector;
