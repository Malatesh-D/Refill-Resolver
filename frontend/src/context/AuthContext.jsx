import React, { createContext, useContext, useState, useEffect } from 'react';

export const DEMO_USERS = {
  staff: {
    id: 'staff-elena',
    name: 'Elena Rostova',
    title: 'Clinical Operations Lead',
    email: 'elena.rostova@healthsystem.org',
    role: 'staff',
    roleLabel: 'Practice Staff',
    avatar: 'ER',
    department: 'Centralized Refill Triage & Care Ops',
    destination: '/dashboard'
  },
  provider: {
    id: 'dr-rao',
    name: 'Dr. Anita Rao, MD',
    title: 'Attending Physician',
    email: 'dr.rao@healthsystem.org',
    role: 'provider',
    roleLabel: 'Prescribing Clinician',
    avatar: 'AR',
    department: 'Internal Medicine & Primary Care',
    destination: '/provider'
  },
  patient: {
    id: 'sarah-miller',
    name: 'Sarah Miller',
    title: 'Verified Patient',
    email: 'sarah.miller@myhealth.net',
    role: 'patient',
    roleLabel: 'Patient Self-Service',
    avatar: 'SM',
    patientId: 'PT-1042',
    department: 'Chart #PT-1042',
    destination: '/patient/PT-1042'
  }
};

const STORAGE_KEY = 'refill_resolve_auth_user_v1';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse saved user:', e);
    }
    // Default to Elena Rostova (Practice Staff) for smooth demo intake
    return DEMO_USERS.staff;
  });

  const login = (userData) => {
    setUser(userData);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    } catch (e) {
      console.warn('Failed to persist user session:', e);
    }
  };

  const loginAsDemo = (roleKey) => {
    const target = DEMO_USERS[roleKey] || DEMO_USERS.staff;
    login(target);
    return target;
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear user session:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, loginAsDemo, logout, isAuthenticated: !!user, DEMO_USERS }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
