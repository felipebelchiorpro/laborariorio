"use client";

import { suggestOptimalActions } from "@/ai/flows/suggest-optimal-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Loader2, ServerCrash, X } from "lucide-react";
import React, { useEffect, useState } from "react";

export default function SuggestedActions() {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    async function fetchSuggestions() {
      try {
        setLoading(true);
        setError(null);
        const result = await suggestOptimalActions({
          patientName: 'New Patient',
          examType: 'Blood Test',
          pastActions: ['Register Patient', 'Schedule Exam', 'Analyze Sample', 'Review Results', 'Deliver Results'],
        });
        setSuggestions(result.suggestedActions);
      } catch (e) {
        setError("Failed to load AI suggestions. Please try again later.");
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchSuggestions();
  }, []);

  if (!visible) return null;
  
  return (
    <Card className="bg-accent/30 border-accent/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <Lightbulb className="h-5 w-5 text-primary" />
          Suggested Actions
        </CardTitle>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setVisible(false)}>
          <X className="h-4 w-4" />
          <span className="sr-only">Dismiss</span>
        </Button>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating optimal workflow...
          </div>
        )}
        {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
                <ServerCrash className="h-4 w-4" />
                {error}
            </div>
        )}
        {!loading && !error && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((action, index) => (
              <Button key={index} variant="outline" size="sm" className="bg-background">
                {action}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
