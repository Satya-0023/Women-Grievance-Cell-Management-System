import React from 'react';
import './OtpLoader.css';
import logo from '../assets/NIT_Sikkim_Logo.png';

export default function OtpLoader() {
    return (
        <div className="otp-loader-overlay">
            <img src={logo} alt="Loading..." className="otp-loader-logo" />
        </div>
    );
}