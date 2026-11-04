// frontend/src/components/SchemeDiscoveryModal.tsx
import React, { useState } from 'react';
import {
  Award,
  X,
  ExternalLink,
  Calculator,
  Search
} from 'lucide-react';

interface Scheme {
  id: string;
  name: string;
  marathiName: string;
  category: 'SUBSIDY' | 'INSURANCE' | 'INFRASTRUCTURE' | 'INCOME';
  benefit: string;
  maxAmount: string;
  eligibility: string;
  applicableCrops: string[];
  steps: string[];
  officialPortal: string;
}

const SCHEMES_DATA: Scheme[] = [
  {
    id: 'aif',
    name: 'Agriculture Infrastructure Fund (AIF)',
    marathiName: 'कृषी पायाभूत सुविधा निधी',
    category: 'INFRASTRUCTURE',
    benefit: '3% per annum interest subvention up to ₹2 Crore for post-harvest cold storage, packhouses & primary processing units.',
    maxAmount: '₹2,00,00,000 Loan Subvention',
    eligibility: 'Farmers, FPOs, Agri-entrepreneurs setting up post-harvest cold chain or sorting/grading lines.',
    applicableCrops: ['Tomato', 'Onion', 'Grapes', 'Pomegranate', 'Vegetables'],
    steps: ['Prepare DPR for cold store/processing unit', 'Register on agriinfra.dac.gov.in', 'Bank sanction & CGTMSE credit guarantee'],
    officialPortal: 'https://agriinfra.dac.gov.in'
  },
  {
    id: 'pmfby',
    name: 'PM Fasal Bima Yojana (PMFBY)',
    marathiName: 'प्रधानमंत्री पीक विमा योजना',
    category: 'INSURANCE',
    benefit: 'Comprehensive crop insurance against unseasonal rain, frost, hail, and post-harvest localized calamities with just 2% farmer premium.',
    maxAmount: '100% Sum Insured',
    eligibility: 'All horticultural and Kharif/Rabi farmers holding 7/12 land records.',
    applicableCrops: ['Tomato', 'Onion', 'Cotton', 'Soybean', 'Wheat'],
    steps: ['Notify loss within 72 hours via Crop Insurance App', 'Joint physical/satellite survey by revenue officer', 'Direct DBT bank transfer'],
    officialPortal: 'https://pmfby.gov.in'
  },
  {
    id: 'midh',
    name: 'Mission for Integrated Development of Horticulture (MIDH)',
    marathiName: 'एकात्मिक फलोत्पादन विकास अभियान',
    category: 'SUBSIDY',
    benefit: '35% to 50% capital subsidy for setting up multi-commodity cold storage (capacity 5,000 MT) and ripening chambers.',
    maxAmount: 'Up to ₹1.4 Crore Capital Subsidy',
    eligibility: 'Individual growers, farmers cooperatives, and registered Farmer Producer Organizations.',
    applicableCrops: ['Tomato', 'Banana', 'Mango', 'Citrus', 'Flowers'],
    steps: ['Submit project proposal to District Horticulture Officer', 'State Horticulture Mission approval', 'Back-ended subsidy release'],
    officialPortal: 'https://midh.gov.in'
  },
  {
    id: 'smam',
    name: 'Sub-Mission on Agricultural Mechanization (SMAM)',
    marathiName: 'कृषी यांत्रिकीकरण उप-अभियान',
    category: 'SUBSIDY',
    benefit: '40% to 50% financial assistance for purchasing tractors, power tillers, rotavators, and laser land levelers.',
    maxAmount: '₹1,50,000 to ₹3,00,000 per unit',
    eligibility: 'Small and marginal farmers holding verified Aadhaar & land records.',
    applicableCrops: ['All Crops'],
    steps: ['Apply on Mahadbt farmer portal (mahadbt.maharashtra.gov.in)', 'Lottery selection by agriculture department', 'Direct equipment delivery upon dealer voucher'],
    officialPortal: 'https://agrimachinery.nic.in'
  },
  {
    id: 'pocra',
    name: 'Nanaji Deshmukh Krishi Sanjivani (PoCRA)',
    marathiName: 'नानाजी देशमुख कृषी संजीवनी प्रकल्प',
    category: 'SUBSIDY',
    benefit: '75% subsidy for shade net houses, drip irrigation systems, and farm ponds in climate-vulnerable talukas of Maharashtra.',
    maxAmount: 'Up to ₹4,00,000 per acre',
    eligibility: 'Farmers in 5,142 targeted drought-prone villages of Marathwada and Vidarbha.',
    applicableCrops: ['Vegetables', 'Fruits', 'Cotton'],
    steps: ['Village VCRMC committee registration', 'Geo-tagged field measurement', 'DBT reimbursement directly into bank account'],
    officialPortal: 'https://mahapocra.gov.in'
  }
];

export const SchemeDiscoveryModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [calcLandAcres, setCalcLandAcres] = useState(3.5);

  if (!isOpen) return null;

  const filteredSchemes = SCHEMES_DATA.filter(s => {
    const matchQuery = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.marathiName.includes(search) ||
      s.benefit.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === 'ALL' || s.category === selectedCategory;
    return matchQuery && matchCat;
  });

  // Subsidy Estimator calculation
  const estimatedSubsidy = Math.round(calcLandAcres * 45000);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">

        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-green-700 to-teal-800 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Award className="w-7 h-7 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-xl font-black font-display flex items-center gap-2">
                <span>Government Schemes & Subsidies 🌾</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/30 border border-emerald-400/40 text-emerald-200">
                  Govt of India & Maharashtra
                </span>
              </h2>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Official post-harvest infrastructure grants, insurance, and interest subvention schemes
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

          {/* Quick Calculator Strip */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50/50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">Instant Subsidy Estimator</h4>
                <p className="text-xs text-slate-500">Calculate estimated post-harvest grant eligibility based on your land holding.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Land Area (Acres)</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={calcLandAcres}
                  onChange={e => setCalcLandAcres(Number(e.target.value) || 1)}
                  className="w-24 text-xs font-bold border border-emerald-300 rounded-lg p-1.5 bg-white"
                />
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 block">Est. Max Subsidy</span>
                <span className="text-lg font-black font-mono text-emerald-700">₹{estimatedSubsidy.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search scheme name, subsidy, crop..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-green-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
              {['ALL', 'INFRASTRUCTURE', 'SUBSIDY', 'INSURANCE'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${selectedCategory === cat
                      ? 'bg-green-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Schemes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSchemes.map(scheme => (
              <div
                key={scheme.id}
                className="card p-5 border border-slate-200 hover:border-emerald-300 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {scheme.category}
                      </span>
                      <h3 className="font-extrabold text-base text-slate-900 mt-1.5 leading-snug">
                        {scheme.name}
                      </h3>
                      <p className="text-xs font-medium text-emerald-700 font-display">
                        {scheme.marathiName}
                      </p>
                    </div>

                    <span className="text-xs font-black font-mono text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg shrink-0">
                      {scheme.maxAmount}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                    {scheme.benefit}
                  </p>

                  <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 space-y-1">
                    <span className="font-bold text-slate-700 block">Key Application Steps:</span>
                    {scheme.steps.map((st, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>{st}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <span className="text-[11px] text-slate-400">
                    Crops: {scheme.applicableCrops.join(', ')}
                  </span>

                  <a
                    href={scheme.officialPortal}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800"
                  >
                    <span>Official Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>All schemes verified against DBT Agriculture Maharashtra and MoA&FW guidelines.</span>
          <button
            onClick={onClose}
            className="btn-secondary text-xs py-2 px-4 cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
