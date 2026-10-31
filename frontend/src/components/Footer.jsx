import React from 'react';
import { Hotel, ShieldCheck } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-row justify-center gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-white font-bold text-lg">
              <Hotel className="w-6 h-6 text-blue-400" />
              <span>Grand<span className="text-blue-400">Stay</span></span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enterprise Hotel, Resort & Property Reservation Platform engineered for zero double-bookings, dynamic seasonal pricing, and real-time inventory management.
            </p>
          </div>

          <div>
            <h4 className="text-white text-xs font-semibold uppercase tracking-wider mb-3">Properties</h4>
            <ul className="space-y-1.5 text-xs">
              <li>Grand Mumbai Hotel (Mumbai, MH)</li>
              <li>Sunset Goa Resort (Goa)</li>
              <li>Standard, Deluxe & Luxury Suites</li>
            </ul>
          </div>

        </div>

        <div className="pt-6 border-t border-slate-800 text-center text-xs flex justify-center items-center text-slate-500">
          <p>© {new Date().getFullYear()} GrandStay Platform. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
