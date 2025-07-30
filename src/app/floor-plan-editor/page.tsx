"use client";

import { Header } from '@/components/layout/header';
import { FloorPlanEditor } from '@/components/floor-plan/editor';
import { Building, Ruler } from 'lucide-react';
import { useRef } from 'react';

export default function FloorPlanEditorPage() {
  const editorRef = useRef<{ exportBlueprintData: () => void }>(null);

  const handleSave = () => {
    editorRef.current?.exportBlueprintData();
  };

  return (
    <div className="flex flex-col h-screen premium-gradient-bg">
      <Header onSave={handleSave} />
      <main className="flex-1 flex flex-col container mx-auto p-4 md:p-8 overflow-hidden">
        <div className="text-center mb-6">
          <h1 className="font-headline text-2xl md:text-3xl font-semibold tracking-tight warm-text mb-2">
            Design Your Space
          </h1>
          <p className="premium-text max-w-2xl mx-auto">
            Upload your floor plan, draw walls, and create precise blueprints with <span className="text-primary font-medium">advanced calibration</span>.
          </p>
        </div>
        
        <div className="flex-1 flex flex-col min-h-0">
          <FloorPlanEditor ref={editorRef} />
        </div>
      </main>
      <footer className="py-3 text-center premium-text border-t border-border warm-border">
        © 2024 <span className="text-primary font-medium">Belecure</span> - A Product of <span className="text-primary font-medium">Lightscape</span>. All rights reserved.
      </footer>
    </div>
  );
} 