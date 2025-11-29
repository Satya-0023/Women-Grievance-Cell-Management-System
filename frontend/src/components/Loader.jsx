import React from 'react';
import './Loader.css';
import logo from '../assets/NIT_Sikkim_Logo.png'; // Corrected logo import

export default function Loader() {
  return (
    <div className="loader-overlay">
      <div className="bg-white/50 p-6 rounded-full shadow-2xl">
        <img src={logo} alt="NIT Sikkim Logo" className="loader-logo" />
      </div>
    </div>
  );
}
