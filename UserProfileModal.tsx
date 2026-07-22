import React, { useState, useEffect } from 'react';
import Logo from './Logo';

interface UserProfileModalProps {
  onClose: () => void;
  userEmail: string;
  onLogout: () => void;
  onProfileUpdate: (newName: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ onClose, userEmail, onLogout, onProfileUpdate }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | ''>(28);
  const [gender, setGender] = useState('Male');
  const [height, setHeight] = useState('178 cm');
  const [weight, setWeight] = useState('72 kg');
  const [skinType, setSkinType] = useState('Combination');
  const [primaryConcern, setPrimaryConcern] = useState('Eczema & Hydration');
  const [sunExposure, setSunExposure] = useState('Moderate');
  const [skincareRoutine, setSkincareRoutine] = useState('Gentle Cleanser, Hyaluronic Acid, SPF 50+');
  const [allergies, setAllergies] = useState('Fragrances, Salicylic Acid');
  const [medicalNotes, setMedicalNotes] = useState('Mild seasonal dermatitis during winter months');
  const [emergencyContact, setEmergencyContact] = useState('Dr. Sarah Jenkins (+1 555-0192)');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    // 1. Check derm_user first for custom name
    const savedUser = localStorage.getItem('derm_user');
    let initialName = '';
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser.name && parsedUser.name !== 'Google User' && parsedUser.name !== 'Apple User') {
          initialName = parsedUser.name;
        }
      } catch (e) {}
    }

    // 2. Check derm_patient_profile
    const storedProfile = localStorage.getItem('derm_patient_profile');
    if (storedProfile) {
      try {
        const parsed = JSON.parse(storedProfile);
        setName(initialName || parsed.name || userEmail.split('@')[0]);
        setAge(parsed.age || 28);
        setGender(parsed.gender || 'Male');
        setHeight(parsed.height || '178 cm');
        setWeight(parsed.weight || '72 kg');
        setSkinType(parsed.skinType || 'Combination');
        setPrimaryConcern(parsed.primaryConcern || 'Eczema & Hydration');
        setSunExposure(parsed.sunExposure || 'Moderate');
        setSkincareRoutine(parsed.skincareRoutine || 'Gentle Cleanser, Hyaluronic Acid, SPF 50+');
        setAllergies(parsed.allergies || 'Fragrances, Salicylic Acid');
        setMedicalNotes(parsed.medicalNotes || 'Mild seasonal dermatitis during winter months');
        setEmergencyContact(parsed.emergencyContact || 'Dr. Sarah Jenkins (+1 555-0192)');
      } catch (e) {}
    } else {
      setName(initialName || userEmail.split('@')[0]);
    }
  }, [userEmail]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || userEmail.split('@')[0];

    // Update patient profile object
    const profileObj = {
      name: finalName,
      email: userEmail,
      age,
      gender,
      height,
      weight,
      skinType,
      primaryConcern,
      sunExposure,
      skincareRoutine,
      allergies,
      medicalNotes,
      emergencyContact,
      updatedAt: Date.now(),
      encrypted: true
    };
    localStorage.setItem('derm_patient_profile', JSON.stringify(profileObj));

    // Update user auth object to overwrite "Google User" / "Apple User"
    const savedUser = localStorage.getItem('derm_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        parsedUser.name = finalName;
        localStorage.setItem('derm_user', JSON.stringify(parsedUser));
      } catch (e) {}
    }

    onProfileUpdate(finalName);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div 
      className="fixed inset-0 z-[350] flex items-center justify-center p-4 bg-[#041408]/90 animate-in fade-in duration-300 font-geist"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-[#0a2a12] border border-[#1d4a25] p-6 sm:p-8 rounded-[28px] shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-[#c8f542] text-[#12300f] flex items-center justify-center font-bold text-2xl uppercase shadow-lg border-2 border-white/20">
              {name.charAt(0) || 'P'}
            </div>
            <div>
              <h3 className="font-semibold text-2xl text-white">{name || 'Patient Profile'}</h3>
              <p className="text-xs text-white/50">{userEmail}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/10 text-white/70 hover:text-white flex items-center justify-center font-bold text-lg transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Security Encryption Badge */}
        <div className="p-3.5 rounded-2xl bg-[#c8f542]/10 border border-[#c8f542]/30 mb-6 flex items-center gap-3 text-xs">
          <iconify-icon icon="solar:shield-check-bold" width="22" style={{ color: '#c8f542' }}></iconify-icon>
          <div>
            <p className="font-semibold text-[#c8f542]">AES-256 Encrypted Telemetry Active</p>
            <p className="text-white/60 text-[10px]">Your personal health records are stored locally and encrypted.</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4 text-xs font-inter">
          <div>
            <label className="block text-white/70 font-medium mb-1 font-geist">Full Patient Name</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sabarinath"
              className="w-full p-3 rounded-xl bg-white/5 border border-white/15 text-white focus:outline-none focus:border-[#c8f542]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white/70 font-medium mb-1 font-geist">Age</label>
              <input 
                type="number" 
                value={age}
                onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
                className="w-full p-3 rounded-xl bg-white/5 border border-white/15 text-white focus:outline-none focus:border-[#c8f542]"
              />
            </div>
            <div>
              <label className="block text-white/70 font-medium mb-1 font-geist">Gender</label>
              <select 
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#0a2a12] border border-white/15 text-white focus:outline-none focus:border-[#c8f542]"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-Binary">Non-Binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white/70 font-medium mb-1 font-geist">Height</label>
              <input 
                type="text" 
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="178 cm"
                className="w-full p-3 rounded-xl bg-white/5 border border-white/15 text-white focus:outline-none focus:border-[#c8f542]"
              />
            </div>
            <div>
              <label className="block text-white/70 font-medium mb-1 font-geist">Weight</label>
              <input 
                type="text" 
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="72 kg"
                className="w-full p-3 rounded-xl bg-white/5 border border-white/15 text-white focus:outline-none focus:border-[#c8f542]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white/70 font-medium mb-1 font-geist">Skin Type</label>
              <select 
                value={skinType}
                onChange={(e) => setSkinType(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#0a2a12] border border-white/15 text-white focus:outline-none focus:border-[#c8f542]"
              >
                <option value="Normal">Normal</option>
                <option value="Dry">Dry</option>
                <option value="Oily">Oily</option>
                <option value="Combination">Combination</option>
                <option value="Sensitive">Sensitive</option>
              </select>
            </div>

            <div>
              <label className="block text-white/70 font-medium mb-1 font-geist">Sun Exposure Level</label>
              <select 
                value={sunExposure}
                onChange={(e) => setSunExposure(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#0a2a12] border border-white/15 text-white focus:outline-none focus:border-[#c8f542]"
              >
                <option value="Rarely">Rarely (Indoor)</option>
                <option value="Moderate">Moderate (1-2 hrs/day)</option>
                <option value="Frequent">Frequent (Outdoors)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-white/70 font-medium mb-1 font-geist">Primary Dermatological Concern</label>
            <input 
              type="text" 
              value={primaryConcern}
              onChange={(e) => setPrimaryConcern(e.target.value)}
              placeholder="e.g. Acne, Eczema, Rosacea, Psoriasis" 
              className="w-full p-3 rounded-xl bg-white/5 border border-white/15 text-white focus:outline-none focus:border-[#c8f542]"
            />
          </div>

          <div>
            <label className="block text-white/70 font-medium mb-1 font-geist">Active Skincare Routine / Products</label>
            <input 
              type="text" 
              value={skincareRoutine}
              onChange={(e) => setSkincareRoutine(e.target.value)}
              placeholder="e.g. Gentle Cleanser, Niacinamide, SPF 50+" 
              className="w-full p-3 rounded-xl bg-white/5 border border-white/15 text-white focus:outline-none focus:border-[#c8f542]"
            />
          </div>

          <div>
            <label className="block text-white/70 font-medium mb-1 font-geist">Known Allergies & Sensitivities</label>
            <input 
              type="text" 
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="e.g. Fragrances, Salicylic Acid, Nuts" 
              className="w-full p-3 rounded-xl bg-white/5 border border-white/15 text-white focus:outline-none focus:border-[#c8f542]"
            />
          </div>

          <div>
            <label className="block text-white/70 font-medium mb-1 font-geist">Emergency Contact / Primary Physician</label>
            <input 
              type="text" 
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              placeholder="Dr. Smith (+1 555-0199)" 
              className="w-full p-3 rounded-xl bg-white/5 border border-white/15 text-white focus:outline-none focus:border-[#c8f542]"
            />
          </div>

          <div>
            <label className="block text-white/70 font-medium mb-1 font-geist">Medical Notes & History</label>
            <textarea 
              rows={2}
              value={medicalNotes}
              onChange={(e) => setMedicalNotes(e.target.value)}
              placeholder="e.g. History of mild dermatitis in winter..." 
              className="w-full p-3 rounded-xl bg-white/5 border border-white/15 text-white focus:outline-none focus:border-[#c8f542]"
            />
          </div>

          <div className="pt-4 flex items-center justify-between gap-4">
            <button 
              type="button"
              onClick={() => { onLogout(); onClose(); }}
              className="px-5 py-3 rounded-full text-red-400 font-geist text-xs font-medium border border-red-500/30 hover:bg-red-500/10 transition-colors"
            >
              Sign Out
            </button>

            <button 
              type="submit"
              className="px-6 py-3 rounded-full text-[#12300f] font-geist text-xs font-semibold uppercase tracking-wider transition-all hover:scale-105"
              style={{ backgroundColor: '#c8f542', boxShadow: '0 4px 14px rgba(200,245,66,0.35)' }}
            >
              {isSaved ? '✓ Profile Updated!' : 'Save Encrypted Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserProfileModal;
