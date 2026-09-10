import React from 'react';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center text-center p-4">
      <Zap className="w-12 h-12 text-brand-400 mb-4 animate-bounce" />
      <h1 className="text-4xl font-extrabold text-slate-100">404 - Page Not Found</h1>
      <p className="text-xs text-slate-400 mt-2 max-w-sm">
        The requested WattWise IoT dashboard page does not exist or has been relocated.
      </p>
      <Link
        to="/"
        className="mt-6 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-brand-500/20"
      >
        Return to Overview Dashboard
      </Link>
    </div>
  );
};
