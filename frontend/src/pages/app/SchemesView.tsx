// frontend/src/pages/app/SchemesView.tsx
import React, { useState, useMemo } from 'react';
import {
  Award,
  Search,
  ExternalLink,
  Calculator,
  CheckCircle2,
  FileText,
  Bookmark,
  BookmarkCheck,
  Building2,
  Calendar,
  Layers,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';

interface GovtScheme {
  id: string;
  title: string;
  marathiTitle: string;
  summary: string;
  benefits: string;
  eligibility: string;
  category: 'Income Support' | 'Insurance' | 'Subsidy' | 'Credit / Loan' | 'Technical Support';
  deadline: string;
  source: 'Central Govt' | 'State Govt (Maharashtra)' | 'Central & State Joint';
  documents: string[];
  link: string;
  subsidyRateFormula?: string;
  defaultBenefitCalc: (acres: number) => number;
}

const SCHEMES_REGISTRY: GovtScheme[] = [
  {
    id: 'pm-kisan',
    title: 'PM-Kisan Samman Nidhi',
    marathiTitle: 'प्रधानमंत्री किसान सन्मान निधी',
    summary: 'Direct income support of ₹6,000 per year transferred directly to landholding farmer bank accounts in three equal tranches.',
    benefits: '₹2,000 every 4 months directly into Aadhaar-linked bank account via DBT.',
    eligibility: 'All small and marginal landholding farmer families with cultivable land.',
    category: 'Income Support',
    deadline: '2026-12-31',
    source: 'Central Govt',
    documents: ['Aadhaar Card', '7/12 & 8A Land Extract', 'Aadhaar-seeded Bank Passbook', 'Active Mobile Number'],
    link: 'https://pmkisan.gov.in/',
    defaultBenefitCalc: () => 6000,
  },
  {
    id: 'pmfby',
    title: 'PM Fasal Bima Yojana (Crop Insurance)',
    marathiTitle: 'प्रधानमंत्री पीक विमा योजना (१ रुपयात पीक विमा)',
    summary: 'Comprehensive crop insurance coverage against unseasonal rainfall, localized calamities, post-harvest losses, and hailstorms with nominal premium.',
    benefits: 'Full sum insured up to ₹45,000 - ₹75,000/acre. Farmers pay just ₹1 or nominal 1.5%-2% premium.',
    eligibility: 'All horticultural and food crop cultivators including tenant farmers holding sowing records.',
    category: 'Insurance',
    deadline: '2026-07-31',
    source: 'Central & State Joint',
    documents: ['Aadhaar Card', '7/12 Land Record (Record of Rights)', 'Sowing Certificate / Talathi Panchanama', 'Bank Passbook Copy'],
    link: 'https://pmfby.gov.in/',
    defaultBenefitCalc: (acres) => Math.round(acres * 52000),
  },
  {
    id: 'magel-tyala-shet-tale',
    title: 'Maharashtra Magel Tyala Shet Tale (Farm Ponds)',
    marathiTitle: 'मागेल त्याला शेततळे योजना',
    summary: 'Direct government subsidy for constructing farm ponds to ensure assured water harvesting and micro-irrigation buffer.',
    benefits: 'Direct financial subsidy of up to ₹50,000 to ₹75,000 directly into beneficiary account upon geo-tagged measurement.',
    eligibility: 'Farmers in Maharashtra holding at least 0.60 hectare (1.5 acres) cultivable land.',
    category: 'Subsidy',
    deadline: '2026-06-30',
    source: 'State Govt (Maharashtra)',
    documents: ['Aadhaar Card', '7/12 Extract', '8A Extract', 'Consent letter of joint landholders', 'Bank Passbook'],
    link: 'https://mahadbt.maharashtra.gov.in/',
    defaultBenefitCalc: () => 50000,
  },
  {
    id: 'smam-mechanization',
    title: 'Sub-Mission on Agricultural Mechanization (SMAM)',
    marathiTitle: 'कृषी यांत्रिकीकरण उप-अभियान (ट्रॅक्टर व अवजारे अनुदान)',
    summary: 'Financial assistance for purchasing new farm machinery including 4WD tractors, rotavators, power tillers, and laser levelers.',
    benefits: '40% to 50% capital subsidy on tractor and implement invoice value, up to ₹1,50,000 to ₹2,50,000.',
    eligibility: 'Individual landholders, SC/ST, small/marginal farmers, and registered FPOs.',
    category: 'Subsidy',
    deadline: '2026-11-30',
    source: 'Central & State Joint',
    documents: ['Aadhaar Card', '7/12 & 8A Record of Rights', 'Authorized Dealer Quotation', 'Caste Certificate (if claiming affirmative category)'],
    link: 'https://agrimachinery.nic.in/',
    defaultBenefitCalc: () => 175000,
  },
  {
    id: 'kcc-loan',
    title: 'Kisan Credit Card (KCC) Subvention',
    marathiTitle: 'किसान क्रेडिट कार्ड (४% व्याज सवलत योजना)',
    summary: 'Low-interest institutional credit up to ₹3,00,000 for crop cultivation inputs, fertilizer procurement, and post-harvest holding.',
    benefits: 'Effective interest rate of only 4% per annum upon prompt repayment (3% interest subvention granted).',
    eligibility: 'All farmers, joint borrowers, tenant farmers, and oral lessees.',
    category: 'Credit / Loan',
    deadline: '2026-03-31',
    source: 'Central Govt',
    documents: ['KCC Application Form', 'Aadhaar / Voter ID', '7/12 Land Extract', 'Cropping Pattern Declaration'],
    link: 'https://www.myscheme.gov.in/schemes/kcc',
    defaultBenefitCalc: (acres) => Math.min(300000, Math.round(acres * 40000)),
  },
  {
    id: 'midh-cold-chain',
    title: 'MIDH Post-Harvest & Cold Storage Subsidy',
    marathiTitle: 'एकात्मिक फलोत्पादन अभियान (शीतगृह व पॅकहाऊस अनुदान)',
    summary: 'Credit-linked back-ended capital subsidy for developing on-farm packhouses, pre-cooling units, and cold storages.',
    benefits: '35% subsidy for general talukas and up to 50% subsidy for hilly/notified areas, up to ₹1.4 Crore per unit.',
    eligibility: 'Individual growers, farmers groups, cooperatives, and FPOs producing perishable fruits and vegetables.',
    category: 'Subsidy',
    deadline: '2026-09-30',
    source: 'Central & State Joint',
    documents: ['Detailed Project Report (DPR)', '7/12 Extract', 'Bank In-Principle Sanction Letter', 'Non-Encumbrance Certificate'],
    link: 'https://midh.gov.in/',
    defaultBenefitCalc: (acres) => Math.round(acres * 75000),
  },
  {
    id: 'pocra-climate',
    title: 'Nanaji Deshmukh Krishi Sanjivani (PoCRA)',
    marathiTitle: 'नानाजी देशमुख कृषी संजीवनी प्रकल्प (पोकरा)',
    summary: 'Special climate-resilience funding for drought-prone talukas of Maharashtra covering drip irrigation, shade nets, and water buffers.',
    benefits: 'Direct DBT subsidy covering 65% to 75% of total project costs for micro-irrigation and shade net nurseries.',
    eligibility: 'Farmers in 5,142 targeted drought-vulnerable villages across Marathwada and Vidarbha.',
    category: 'Subsidy',
    deadline: '2026-10-31',
    source: 'State Govt (Maharashtra)',
    documents: ['Aadhaar Card', '7/12 Extract', 'VCRMC Village Verification Certificate', 'Geo-tagged Photos of Work'],
    link: 'https://mahapocra.gov.in/',
    defaultBenefitCalc: (acres) => Math.round(acres * 60000),
  },
  {
    id: 'pm-kusum',
    title: 'PM-KUSUM (Solar Agricultural Pumps)',
    marathiTitle: 'पीएम-कुसुम सौर कृषी पंप योजना',
    summary: 'Installation of standalone solar-powered irrigation pumps to replace expensive diesel generator pumps and ensure daytime irrigation.',
    benefits: 'Up to 90% combined subsidy (30% Central + 60% State Govt). Farmers pay only 10% contribution.',
    eligibility: 'Farmers having cultivable land with an existing water source (well, borewell, or farm pond) without grid connection.',
    category: 'Subsidy',
    deadline: '2026-12-15',
    source: 'Central & State Joint',
    documents: ['Aadhaar Card', '7/12 Land Record', 'Water Source Proof / NOC', 'Electricity Bill / No Connection Certificate'],
    link: 'https://pmkusum.mnre.gov.in/',
    defaultBenefitCalc: () => 180000,
  },
  {
    id: 'soil-health-card',
    title: 'Soil Health Card Scheme',
    marathiTitle: 'मृदा आरोग्य पत्रिका योजना',
    summary: 'Free scientific testing of soil core samples for 12 macro and micro nutrients with customized crop fertilizer recommendations.',
    benefits: '100% free government soil test report saving up to ₹4,000/acre in excessive urea/DAP expenses.',
    eligibility: 'All agricultural landowners in India.',
    category: 'Technical Support',
    deadline: 'Ongoing',
    source: 'Central Govt',
    documents: ['Aadhaar Card', 'Farm Parcel Identification Number / Survey No.'],
    link: 'https://www.soilhealth.dac.gov.in/',
    defaultBenefitCalc: (acres) => Math.round(acres * 3500),
  },
  {
    id: 'pkvy-organic',
    title: 'Paramparagat Krishi Vikas Yojana (PKVY)',
    marathiTitle: 'परंपरागत कृषी विकास योजना (सेंद्रिय शेती गट)',
    summary: 'Promotion of certified chemical-free organic farming clusters with financial assistance for bio-inputs, neem spraying, and PGS certification.',
    benefits: '₹50,000 per hectare over 3 years, of which ₹31,000 is directly provided for organic bio-fertilizers and botanical pesticides.',
    eligibility: 'Farmers forming a cluster group of 20 or more members having 50 or more contiguous acres.',
    category: 'Subsidy',
    deadline: '2026-08-31',
    source: 'Central Govt',
    documents: ['Group Member Aadhaar Copies', '7/12 Land Extracts', 'PGS Certification Group Resolution'],
    link: 'https://pgsindia-ncof.gov.in/',
    defaultBenefitCalc: (acres) => Math.round(acres * 20000),
  }
];

export const SchemesView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSource, setSelectedSource] = useState<string>('All');
  const [calcAcres, setCalcAcres] = useState<number>(3.5);
  const [savedSchemeIds, setSavedSchemeIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('agri2value_saved_schemes');
      return stored ? JSON.parse(stored) : ['pmfby', 'smam-mechanization'];
    } catch {
      return ['pmfby', 'smam-mechanization'];
    }
  });

  // Track checked documents per scheme
  const [checkedDocs, setCheckedDocs] = useState<Record<string, Record<string, boolean>>>({});

  const toggleDoc = (schemeId: string, doc: string) => {
    setCheckedDocs(prev => {
      const schemeDocs = prev[schemeId] || {};
      return {
        ...prev,
        [schemeId]: {
          ...schemeDocs,
          [doc]: !schemeDocs[doc]
        }
      };
    });
  };

  const toggleBookmark = (id: string) => {
    const updated = savedSchemeIds.includes(id)
      ? savedSchemeIds.filter(s => s !== id)
      : [...savedSchemeIds, id];
    setSavedSchemeIds(updated);
    try {
      localStorage.setItem('agri2value_saved_schemes', JSON.stringify(updated));
    } catch {}
  };

  const categories = ['All', 'Income Support', 'Insurance', 'Subsidy', 'Credit / Loan', 'Technical Support'];

  const filteredSchemes = useMemo(() => {
    return SCHEMES_REGISTRY.filter(s => {
      const matchesSearch =
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.marathiTitle.includes(search) ||
        s.summary.toLowerCase().includes(search.toLowerCase()) ||
        s.benefits.toLowerCase().includes(search.toLowerCase());

      const matchesCat = selectedCategory === 'All' || s.category === selectedCategory;
      const matchesSource = selectedSource === 'All' || s.source === selectedSource;

      return matchesSearch && matchesCat && matchesSource;
    });
  }, [search, selectedCategory, selectedSource]);

  // Total estimated subsidy entitlement across top 3 eligible schemes
  const estimatedTotalEntitlement = useMemo(() => {
    return (
      SCHEMES_REGISTRY.find(s => s.id === 'smam-mechanization')!.defaultBenefitCalc(calcAcres) +
      SCHEMES_REGISTRY.find(s => s.id === 'pmfby')!.defaultBenefitCalc(calcAcres) +
      SCHEMES_REGISTRY.find(s => s.id === 'pm-kusum')!.defaultBenefitCalc(calcAcres)
    );
  }, [calcAcres]);

  return (
    <div className="space-y-8 pb-12 font-sans animate-fade-up">
      {/* ─── Page Executive Header ─── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold font-display">
            <Award className="w-4 h-4 text-emerald-600" />
            <span>Direct Government DBT Subsidies & Grants (सरकारी कृषी योजना)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight font-display">
            Government Subsidies & Schemes Explorer
          </h1>
          <p className="text-sm text-gray-600 max-w-2xl leading-relaxed">
            Discover verified Central and Maharashtra State agricultural schemes, calculate your land subsidy entitlement, check required documents, and apply directly through official portals.
          </p>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4 self-stretch md:self-auto">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
            ₹
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Max Subsidies Listed</div>
            <div className="text-xl font-black text-emerald-900 font-display">10 Active Schemes</div>
            <div className="text-[11px] text-emerald-700 font-medium">DBT Verified • 100% Middleman-Free</div>
          </div>
        </div>
      </div>

      {/* ─── Interactive Land Area Subsidy Calculator ─── */}
      <div className="bg-gradient-to-r from-emerald-900 via-green-900 to-teal-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent pointer-events-none" />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-bold border border-white/15">
              <Calculator className="w-3.5 h-3.5" />
              <span>Interactive Subsidy Entitlement Calculator</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-white">
              Estimate Your Total Government Benefits for {calcAcres} Acres
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed max-w-xl">
              Adjust your land holding to calculate combined benefits across PMFBY crop insurance cover, tractor mechanization grants, and solar pump subsidies.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <label className="text-xs font-bold text-emerald-200">Your Cultivable Land Holding:</label>
              <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/20">
                <input
                  type="number"
                  min="0.5"
                  max="50"
                  step="0.5"
                  value={calcAcres}
                  onChange={(e) => setCalcAcres(parseFloat(e.target.value) || 1)}
                  className="w-16 bg-transparent text-white font-black text-center text-lg focus:outline-none"
                />
                <span className="text-xs font-bold text-emerald-200">Acres</span>
              </div>

              {/* Quick Acreage Chips */}
              <div className="flex items-center gap-1.5">
                {[1.5, 2.5, 3.5, 5.0, 10.0].map((acres) => (
                  <button
                    key={acres}
                    onClick={() => setCalcAcres(acres)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      calcAcres === acres
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-white/10 text-emerald-100 hover:bg-white/20'
                    }`}
                  >
                    {acres} Ac
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Calculator Output Display */}
          <div className="lg:col-span-5 bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 space-y-3">
            <div className="text-xs font-bold text-emerald-200 uppercase tracking-wider">
              Combined Estimated Subsidy Potential
            </div>
            <div className="text-3xl sm:text-4xl font-black text-white font-display tracking-tight">
              ₹{estimatedTotalEntitlement.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-emerald-200 space-y-1 pt-1 border-t border-white/10">
              <div className="flex justify-between">
                <span>SMAM Tractor Capital Grant:</span>
                <span className="font-bold text-white">₹1,75,000</span>
              </div>
              <div className="flex justify-between">
                <span>PM-KUSUM 90% Solar Grant:</span>
                <span className="font-bold text-white">₹1,80,000</span>
              </div>
              <div className="flex justify-between">
                <span>PMFBY Sum Insured Buffer:</span>
                <span className="font-bold text-white">₹{(calcAcres * 52000).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Search and Filters Bar ─── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search scheme name, benefit, crop, or keywords (e.g. tractor, solar, pond, insurance)..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 transition shadow-2xs"
            />
          </div>

          {/* Source Filter */}
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-semibold text-gray-700 focus:outline-none focus:border-green-500 transition shadow-2xs"
          >
            <option value="All">All Jurisdictions</option>
            <option value="Central Govt">Central Govt Only</option>
            <option value="State Govt (Maharashtra)">Maharashtra State Only</option>
            <option value="Central & State Joint">Central & State Joint</option>
          </select>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-green-600 text-white shadow-md shadow-green-100'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-green-300 hover:bg-green-50'
              }`}
            >
              {cat}
            </button>
          ))}
          {savedSchemeIds.length > 0 && (
            <button
              onClick={() => setSelectedCategory('Saved')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === 'Saved'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 text-emerald-600" />
              <span>Bookmarked ({savedSchemeIds.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Scheme Cards Grid ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredSchemes
          .filter(s => selectedCategory !== 'Saved' || savedSchemeIds.includes(s.id))
          .map((scheme) => {
            const isSaved = savedSchemeIds.includes(scheme.id);
            const docsChecked = checkedDocs[scheme.id] || {};
            const totalDocs = scheme.documents.length;
            const checkedCount = Object.values(docsChecked).filter(Boolean).length;
            const readyProgress = Math.round((checkedCount / totalDocs) * 100);

            return (
              <div
                key={scheme.id}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 p-6 flex flex-col justify-between space-y-5"
              >
                {/* Header Row */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-green-100 text-green-800">
                        {scheme.category}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600">
                        {scheme.source}
                      </span>
                    </div>

                    <button
                      onClick={() => toggleBookmark(scheme.id)}
                      className={`p-2 rounded-xl transition ${
                        isSaved
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-50 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                      }`}
                      title={isSaved ? 'Remove Bookmark' : 'Bookmark Scheme'}
                    >
                      {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    </button>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 font-display leading-snug">
                      {scheme.title}
                    </h3>
                    <p className="text-xs font-semibold text-emerald-700 font-display">
                      {scheme.marathiTitle}
                    </p>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed">
                    {scheme.summary}
                  </p>
                </div>

                {/* Benefits Callout */}
                <div className="bg-emerald-50/80 rounded-2xl p-3.5 border border-emerald-100 space-y-1">
                  <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Direct Farmer Entitlement</span>
                  </div>
                  <p className="text-xs font-bold text-emerald-950">
                    {scheme.benefits}
                  </p>
                </div>

                {/* Eligibility Criteria */}
                <div className="text-xs text-gray-600 space-y-1">
                  <span className="font-bold text-gray-800">Eligibility: </span>
                  <span>{scheme.eligibility}</span>
                </div>

                {/* Required Documents Checklist */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-800 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-gray-500" />
                      <span>Document Readiness Checklist ({checkedCount}/{totalDocs})</span>
                    </span>
                    <span className={`font-bold text-[11px] ${readyProgress === 100 ? 'text-emerald-700' : 'text-gray-500'}`}>
                      {readyProgress}% Ready
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {scheme.documents.map((doc) => {
                      const isChecked = !!docsChecked[doc];
                      return (
                        <button
                          key={doc}
                          onClick={() => toggleDoc(scheme.id, doc)}
                          className={`flex items-center gap-2 p-2 rounded-xl text-left text-[11px] font-medium transition cursor-pointer ${
                            isChecked
                              ? 'bg-emerald-100/70 text-emerald-900 border border-emerald-300'
                              : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 border ${
                            isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-400 bg-white'
                          }`}>
                            {isChecked && <Check className="w-2.5 h-2.5" />}
                          </div>
                          <span className="truncate">{doc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
                  <div className="text-[11px] text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>Deadline: <strong className="text-gray-700">{scheme.deadline}</strong></span>
                  </div>

                  <a
                    href={scheme.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary text-xs py-2 px-4 shadow-sm"
                  >
                    <span>Apply on Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
      </div>

      {filteredSchemes.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 space-y-3">
          <Award className="w-10 h-10 text-gray-300 mx-auto" />
          <h3 className="text-base font-bold text-gray-800">No schemes found matching criteria</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Try resetting your search query or switching to 'All Jurisdictions'.
          </p>
          <button
            onClick={() => { setSearch(''); setSelectedCategory('All'); setSelectedSource('All'); }}
            className="btn-secondary text-xs mt-2"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
