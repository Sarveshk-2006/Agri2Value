// frontend/src/pages/public/ContactView.tsx
import React, { useState } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock
} from 'lucide-react';

export const ContactView: React.FC = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [topic, setTopic] = useState('PILOT_FEEDBACK');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate submission with honest demonstration notice
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 600);
  };

  return (
    <div className="pt-24 pb-20 space-y-16">
      
      {/* Hero Banner */}
      <section className="bg-gradient-to-b from-slate-900 via-emerald-950 to-slate-950 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold font-mono">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>KISAN HELPDESK & PILOT SUPPORT</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-white">
            Connect with Agri2Value
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans max-w-2xl mx-auto">
            Have questions about route optimization, buyer onboarding, or our Indradhanu PCCOE 2026 pilot?
          </p>
        </div>
      </section>

      {/* Main Grid: Form + Info */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Info Side (1 Col) */}
          <div className="space-y-6">
            <div className="card p-6 space-y-5">
              <h3 className="font-extrabold text-base text-slate-900">
                Pilot Helpdesk Information
              </h3>

              <div className="space-y-4 text-xs text-slate-600">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Field Pilot Area</div>
                    <p className="text-slate-500 mt-0.5 leading-relaxed">
                      Pimpalgaon Baswant & Niphad Taluka, Nashik District, Maharashtra 422303
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Kisan Helpdesk Hotline</div>
                    <p className="text-slate-500 mt-0.5 font-mono">
                      +91 98765 43210 (Toll-Free Simulation)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Project Secretariat</div>
                    <p className="text-slate-500 mt-0.5 font-mono">
                      contact@agri2value.org
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Auction Yard Hours</div>
                    <p className="text-slate-500 mt-0.5">
                      Mon–Sat: 06:00 AM – 06:00 PM IST
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Challenge Note */}
            <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-600 space-y-1.5 leading-relaxed">
              <div className="font-bold text-slate-900">Indradhanu PCCOE Grand Challenge 2026</div>
              <p>
                This platform is developed as a competition-ready agricultural technology prototype submitted to the International Grand Challenge at Pimpri Chinchwad College of Engineering, Pune.
              </p>
            </div>
          </div>

          {/* Contact Form (2 Cols) */}
          <div className="md:col-span-2">
            <div className="card p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 font-display">
                  Send an Inquiry or Pilot Feedback
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  We welcome feedback from farmers, FPO managers, and competition evaluators.
                </p>
              </div>

              {isSubmitted ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Inquiry Logged Successfully!</span>
                  </div>
                  <p className="text-xs text-emerald-900 leading-relaxed">
                    Thank you, <strong className="text-emerald-950">{name || 'Farmer'}</strong>. Your inquiry has been registered in the demonstration session logs. In a commercial deployment, our field agronomist would contact you at <strong className="font-mono text-emerald-950">{phone}</strong> within 4 hours.
                  </p>
                  <button
                    onClick={() => {
                      setIsSubmitted(false);
                      setName('');
                      setPhone('');
                      setMessage('');
                    }}
                    className="btn-secondary text-xs py-1.5 px-3 mt-2"
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Farmer / Evaluator Name *</label>
                      <input
                        required
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Ramesh Patil"
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="label">Mobile Phone Number *</label>
                      <input
                        required
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 98765 43210"
                        className="input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">Topic of Inquiry *</label>
                    <select
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="input"
                    >
                      <option value="PILOT_FEEDBACK">Field Pilot Testing & Feedback</option>
                      <option value="BUYER_ONBOARDING">Corporate Buyer Desk Onboarding</option>
                      <option value="COLD_STORAGE">Cold Chain / Logistics Fleet Registration</option>
                      <option value="ENGINE_QUESTIONS">Profit Decision Engine Methodology</option>
                      <option value="OTHER">General Inquiries</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">Message or Details *</label>
                    <textarea
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Please describe your crop lot, question, or inquiry..."
                      className="input py-2.5 resize-none"
                    />
                  </div>

                  {/* Demonstration Notice */}
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Demonstration Notice:</strong> Submitted inquiries are captured in local state for prototype demonstration. No external SMS or telemarketing services will be triggered.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary w-full justify-center text-sm py-3 shadow-md"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Logging Inquiry...</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        <span>Submit Inquiry to Helpdesk</span>
                      </span>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};
