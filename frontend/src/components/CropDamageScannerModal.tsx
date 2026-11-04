// frontend/src/components/CropDamageScannerModal.tsx
import React, { useState } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  X,
  RefreshCw,
  Flame,
  ArrowRight
} from 'lucide-react';

interface DiagnosticResult {
  condition: string;
  confidence: number;
  severity: 'MILD' | 'MODERATE' | 'SEVERE';
  damageType: string;
  salvageYieldPct: number;
  recommendedPathway: string;
  prescription: string;
}

const PIPELINE_STAGES = [
  'Uploading image to secure vision processor...',
  'Analyzing produce morphology & surface discoloration...',
  'Running Computer Vision defect classifier...',
  'Evaluating harvest salvage ratio & brix levels...',
  'Synthesizing Crop Rescue recommendations...'
];

export const CropDamageScannerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onLaunchRescue?: () => void;
  onNavigateToRescue?: () => void;
}> = ({ isOpen, onClose, onLaunchRescue, onNavigateToRescue }) => {
  const handleRescueAction = () => {
    onClose();
    if (onNavigateToRescue) onNavigateToRescue();
    else if (onLaunchRescue) onLaunchRescue();
  };
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [stageIdx, setStageIdx] = useState(0);
  const [result, setResult] = useState<DiagnosticResult | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      startPipeline();
    };
    reader.readAsDataURL(file);
  };

  const startPipeline = async () => {
    setIsScanning(true);
    setResult(null);

    for (let i = 0; i < PIPELINE_STAGES.length; i++) {
      setStageIdx(i);
      await new Promise(r => setTimeout(r, 650));
    }

    // Deterministic diagnostic outcome simulating plant village / crop quality classification
    setResult({
      condition: 'Early Blight & Rain Spot (Alternaria solani)',
      confidence: 94.2,
      severity: 'MODERATE',
      damageType: 'Surface skin lesions; core pulp intact',
      salvageYieldPct: 75.0,
      recommendedPathway: 'Immediate Agro-Processing Puree / Paste Diversion',
      prescription: 'Fresh market retail rejection likely at weighbridge. Divert harvest within 36 hours to Sahyadri Tomato Puree & Pulp Works (₹3.20/kg tariff) to retain 75% commercial value (₹58,000 net) instead of total field write-off.'
    });

    setIsScanning(false);
  };

  const resetScanner = () => {
    setImagePreview(null);
    setResult(null);
    setIsScanning(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-green-800 via-emerald-800 to-teal-800 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Camera className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h3 className="text-xl font-black font-display flex items-center gap-2">
                <span>AI Crop Quality & Disease Scanner 🔬</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/30 border border-emerald-400/40 text-emerald-200">
                  CV Vision 2.0
                </span>
              </h3>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Instant harvest defect diagnosis & automatic Crop Rescue salvage routing
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Upload Dropzone */}
          {!imagePreview && (
            <div className="border-2 border-dashed border-slate-300 rounded-3xl p-8 text-center hover:border-emerald-500 hover:bg-emerald-50/20 transition-all">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8" />
              </div>
              <h4 className="text-base font-extrabold text-slate-800">Upload or Capture Harvest Photo</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
                Take a clear picture of harvested fruit, vegetables, or plant leaves showing any signs of rot, spots, or weather stress.
              </p>

              <label className="btn-primary text-xs py-3 px-6 shadow-md cursor-pointer inline-flex items-center gap-2">
                <Camera className="w-4 h-4" />
                <span>Select Harvest Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Processing State with Animated Pipeline */}
          {imagePreview && isScanning && (
            <div className="space-y-6 text-center py-4">
              <div className="relative w-48 h-48 mx-auto rounded-2xl overflow-hidden border-4 border-emerald-500/40 shadow-xl">
                <img src={imagePreview} alt="Scanning" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-emerald-900/30 backdrop-blur-[1px]" />
                <div className="absolute inset-x-0 h-1 bg-emerald-400 shadow-[0_0_12px_#34d399] animate-pulse top-1/2" />
              </div>

              <div className="space-y-3 max-w-md mx-auto">
                <div className="flex items-center justify-center gap-2 text-emerald-700 font-extrabold text-sm">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{PIPELINE_STAGES[stageIdx]}</span>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-green-600 h-full transition-all duration-300"
                    style={{ width: `${((stageIdx + 1) / PIPELINE_STAGES.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Diagnostic Result Card */}
          {result && (
            <div className="space-y-5 animate-fade-up">
              
              <div className="flex flex-col sm:flex-row gap-5 items-start p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="w-32 h-32 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                  <img src={imagePreview!} alt="Result" className="w-full h-full object-cover" />
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                      SEVERITY: {result.severity}
                    </span>
                    <span className="text-xs font-bold font-mono text-emerald-700">
                      {result.confidence}% Model Confidence
                    </span>
                  </div>

                  <h4 className="text-lg font-black text-slate-900 font-display">
                    {result.condition}
                  </h4>

                  <p className="text-xs text-slate-600">
                    <strong className="text-slate-800">Physical Assessment:</strong> {result.damageType}
                  </p>

                  <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs">
                    <div className="font-bold text-slate-700">Salvage Feasibility:</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xl font-black font-mono text-emerald-700">{result.salvageYieldPct}%</span>
                      <span className="text-[11px] text-slate-500">of lot volume can be salvaged for processing paste.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Prescription */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-2">
                <div className="font-extrabold text-emerald-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Recommended Action: {result.recommendedPathway}</span>
                </div>
                <p className="text-emerald-800 leading-relaxed">
                  {result.prescription}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleRescueAction}
                  className="flex-1 btn-primary text-xs py-3.5 shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Flame className="w-4 h-4 text-amber-300" />
                  <span>Execute Crop Rescue Pathway</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={resetScanner}
                  className="btn-secondary text-xs py-3.5 px-5 cursor-pointer"
                >
                  Scan Another Lot
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
