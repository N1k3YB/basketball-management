import React from 'react';

interface BasketballSpinnerProps {
  label?: string;
}

export const BasketballSpinner: React.FC<BasketballSpinnerProps> = ({ label = 'Загрузка...' }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
    <svg
      className="animate-spin"
      width="64"
      height="64"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ color: '#3b82f6' }}
    >
    <path id="secondary" fill="#3b82f6" d="M16,12a10.63,10.63,0,0,0,2.19,6.53,9,9,0,0,1-12.38,0A10.63,10.63,0,0,0,8,12,10.63,10.63,0,0,0,5.81,5.47a9,9,0,0,1,12.38,0A10.63,10.63,0,0,0,16,12Z"/>
    <path id="primary" d="M18.19,18.53A10.63,10.63,0,0,1,16,12a10.63,10.63,0,0,1,2.19-6.53" fill="none" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
    <path id="primary-2" data-name="primary" d="M5.81,5.47A10.63,10.63,0,0,1,8,12a10.63,10.63,0,0,1-2.19,6.53" fill="none" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
    <path id="primary-3" data-name="primary" d="M3,12H21M12,3V21M12,3a9,9,0,1,0,9,9A9,9,0,0,0,12,3Z" fill="none" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
  
    </svg>
    <span style={{ color: '#3b82f6', fontWeight: 500, fontSize: 16 }}>{label}</span>
  </div>
);

export default BasketballSpinner; 