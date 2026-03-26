'use client';

import React, { useState } from 'react';

export default function StepTwoConfig() {
  // 1. State untuk navigasi Tab
  const [activeTab, setActiveTab] = useState('main');

  // 2. State untuk Data Form
  const [formData, setFormData] = useState({
    environment: 'Production',
    apiKey: '••••••••••••••••',
    autoSync: true, // Untuk Single Checkbox
    features: ['Analytics', 'User Tracking', 'Error Logging'] // Untuk Multiple Checkboxes (Array)
  });

  // Fungsi untuk menangani perubahan pada Multiple Checkboxes (Features)
  const handleFeatureToggle = (featureName: string) => {
    setFormData((prev) => {
      const isSelected = prev.features.includes(featureName);
      
      if (isSelected) {
        // Jika sudah ada, hapus dari array (Uncheck)
        return { ...prev, features: prev.features.filter(f => f !== featureName) };
      } else {
        // Jika belum ada, tambahkan ke array (Check)
        return { ...prev, features: [...prev.features, featureName] };
      }
    });
  };

  const handleNextStep = () => {
    console.log('Data yang siap dikirim ke Step 3:', formData);
    alert('Cek console browser untuk melihat format data Checkbox-nya!');
    // Logika lanjut ke step 3 ditaruh di sini
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', fontFamily: "'Poppins', sans-serif", padding: '20px' }}>
      
      {/* Kotak Utama / Card */}
      <div style={{ width: '100%', maxWidth: '600px', background: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '24px 32px', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: 0 }}>Step 2: Configuration</h2>
        </div>

        {/* Tab Navigasi */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', padding: '0 32px', gap: '24px' }}>
          {['Main Config', 'Advanced Config', 'Review'].map((tab, idx) => {
            const tabId = tab.split(' ')[0].toLowerCase();
            const isActive = activeTab === tabId;
            return (
              <button
                key={idx}
                onClick={() => setActiveTab(tabId)}
                style={{
                  background: 'none', border: 'none', padding: '16px 0', fontSize: '14px', fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#4f46e5' : '#6B7280', cursor: 'pointer', position: 'relative'
                }}
              >
                {tab}
                {isActive && <div style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: '2px', background: '#4f46e5' }} />}
              </button>
            );
          })}
        </div>

        {/* Isi Form */}
        <div style={{ padding: '32px' }}>
          {activeTab === 'main' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Environment (Select) */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Environment</label>
                <select 
                  value={formData.environment}
                  onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', color: '#111827', outline: 'none', fontFamily: "'Poppins', sans-serif" }}
                >
                  <option value="Production">Production</option>
                  <option value="Staging">Staging</option>
                  <option value="Development">Development</option>
                </select>
              </div>

              {/* API Key (Password) */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>API Key</label>
                <input 
                  type="password" 
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', color: '#111827', outline: 'none', fontFamily: "'Poppins', sans-serif", letterSpacing: '2px' }}
                />
              </div>

              {/* Single Checkbox: Auto-Sync */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginTop: '8px' }}>
                <input 
                  type="checkbox" 
                  checked={formData.autoSync}
                  onChange={(e) => setFormData({ ...formData, autoSync: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#4f46e5' }}
                />
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>Enable Auto-Sync</span>
              </label>

              {/* Multiple Checkboxes: Features */}
              <div style={{ marginTop: '8px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>Features</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  
                  {['Analytics', 'Reporting', 'User Tracking', 'Error Logging'].map((feature) => (
                    <label key={feature} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={formData.features.includes(feature)}
                        onChange={() => handleFeatureToggle(feature)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#4f46e5' }}
                      />
                      <span style={{ fontSize: '14px', color: '#4B5563' }}>{feature}</span>
                    </label>
                  ))}

                </div>
              </div>

            </div>
          )}

          {activeTab !== 'main' && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#6B7280' }}>
              Konten {activeTab} akan tampil di sini.
            </div>
          )}
        </div>

        {/* Footer / Navigasi Step */}
        <div style={{ padding: '24px 32px', borderTop: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button style={{ padding: '10px 20px', background: 'white', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
            Back
          </button>
          <button onClick={handleNextStep} style={{ padding: '10px 24px', background: '#4f46e5', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, color: 'white', cursor: 'pointer', boxShadow: '0 4px 6px rgba(79, 70, 229, 0.2)' }}>
            Next Step
          </button>
        </div>

      </div>
    </div>
  );
}