import { Badge } from "@audex/ui/components/badge";
import { Button } from "@audex/ui/components/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Audex</h1>
        <p className="mt-3 text-lg text-muted-foreground">Code Quality & Web Analysis Platform</p>
      </div>
      <div className="flex items-center gap-3">
        <Button>Get Started</Button>
        <Button variant="outline">Learn More</Button>
      </div>
      <div className="flex gap-2">
        <Badge>11 Dimensions</Badge>
        <Badge variant="secondary">AI Powered</Badge>
        <Badge variant="outline">Enterprise Ready</Badge>
      </div>
    </main>
  );
}
