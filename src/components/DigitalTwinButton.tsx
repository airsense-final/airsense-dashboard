import React from 'react';
import { getToken } from '../services/apiService'; // Senin apiService yoluna göre ayarla

interface DigitalTwinButtonProps {
  role?: string;
  company?: string;
}

const DigitalTwinButton: React.FC<DigitalTwinButtonProps> = ({ role, company }) => {

  const handleOpenTwin = () => {
    // 1. Token'ı al (Senin servisinden)
    const token = getToken();
    
    if (!token) {
      alert("Oturum hatası: Token bulunamadı.");
      return;
    }

    // 2. Parametreleri hazırla
    // Eğer company yoksa boş string gönder
    const safeCompany = company ? encodeURIComponent(company) : "";
    const safeRole = role ? role.toLowerCase() : "viewer";

    // 3. URL'yi oluştur (Port 5173 - Digital Twin Projesi)
    const twinUrl = `http://localhost:5174/?token=${token}&role=${safeRole}&company=${safeCompany}`;

    // 4. Yeni sekmede aç
    window.open(twinUrl, '_blank');
  };

  return (
    <button 
      onClick={handleOpenTwin}
      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2 transition-colors shadow-lg"
      title="3D Fabrika Simülasyonunu Başlat"
    >
      <span>🏭</span>
      <span>Start 3D Monitoring</span>
    </button>
  );
};

export default DigitalTwinButton;
