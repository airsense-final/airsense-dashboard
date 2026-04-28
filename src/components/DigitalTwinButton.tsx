import React from 'react';
import { getToken } from '../services/apiService';

interface DigitalTwinButtonProps {
  role?: string;
  company?: string;
  tier?: string;
}

const DigitalTwinButton: React.FC<DigitalTwinButtonProps> = ({ role, company, tier }) => {
  // SUBSCRIPTION CHECK: Only 'enterprise' tier can access 3D monitoring
  if (tier !== 'enterprise') return null;

  const handleOpenTwin = () => {
    const token = getToken();
    if (!token) {
      alert("Oturum hatası: Token bulunamadı.");
      return;
    }

    const safeCompany = company ? encodeURIComponent(company) : "";
    const safeRole = role ? role.toLowerCase() : "viewer";
    const TWIN_BASE_URL = "https://airsensedigitaltwin.netlify.app"; 
    const twinUrl = `${TWIN_BASE_URL}/?token=${token}&role=${safeRole}&company=${safeCompany}`;
    window.open(twinUrl, '_blank');
  };

  return (
    <button 
      onClick={handleOpenTwin}
      className="flex items-center gap-2.5 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-xl transition-all duration-300 active:scale-95 group shadow-lg shadow-indigo-900/10"
      title="Launch 3D Environment"
    >
      <span className="text-base group-hover:rotate-12 transition-transform duration-500">🛰️</span>
      <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">Start 3D Monitoring</span>
    </button>
  );
};

export default DigitalTwinButton;
