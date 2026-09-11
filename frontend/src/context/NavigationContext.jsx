import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  computeRoutes,
  getActiveIcebergs,
  checkHealth
} from '../services/api';
import { ANTARCTIC_PRESETS } from '../utils/geoUtils';

const NavigationContext = createContext(null);

export function NavigationProvider({ children }) {
  const [currentTab, setCurrentTab] = useState('landing');
  const [forecastDay, setForecastDay] = useState(1);
  const [vesselIceClass, setVesselIceClass] = useState('PC5');
  const [startPoint, setStartPoint] = useState(ANTARCTIC_PRESETS[0]); // Maitri Station
  const [goalPoint, setGoalPoint] = useState(ANTARCTIC_PRESETS[1]);  // Bharati Station
  const [routeData, setRouteData] = useState(null);
  const [selectedRouteId, setSelectedRouteId] = useState('safest');
  const [icebergs, setIcebergs] = useState([]);
  const [isComputing, setIsComputing] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState({ connected: false, checking: true });

  // Admin authentication state for restricted operational settings
  const [isAdminAuth, setIsAdminAuth] = useState(() => {
    return localStorage.getItem('himyatra_admin_auth') === 'true';
  });

  const adminLogin = (email, password) => {
    if (email?.trim()?.toLowerCase() === 'devx2026@gmail.com' && password === 'rss') {
      setIsAdminAuth(true);
      localStorage.setItem('himyatra_admin_auth', 'true');
      return { success: true };
    }
    return { success: false, error: 'Invalid admin credentials' };
  };

  const adminLogout = () => {
    setIsAdminAuth(false);
    localStorage.removeItem('himyatra_admin_auth');
  };

  // Operational anomaly settings
  const [iceConcentrationAlert, setIceConcentrationAlert] = useState(70);
  const [safetyRadiusNM, setSafetyRadiusNM] = useState(15);
  const [maxHullStress, setMaxHullStress] = useState(65);

  // Health check loop
  const verifyApi = useCallback(async () => {
    const res = await checkHealth();
    setApiStatus({
      connected: res.status === 'online',
      simulated: res.simulated || false,
      checking: false
    });
  }, []);

  useEffect(() => {
    verifyApi();
    const interval = setInterval(verifyApi, 25000);
    return () => clearInterval(interval);
  }, [verifyApi]);

  // Load initial icebergs
  useEffect(() => {
    let mounted = true;
    getActiveIcebergs().then(data => {
      if (mounted && data) setIcebergs(data);
    });
    return () => { mounted = false; };
  }, []);

  // Compute routes
  const refreshRoutes = useCallback(async () => {
    setIsComputing(true);
    try {
      const data = await computeRoutes({
        startCoords: [startPoint.lat, startPoint.lon],
        goalCoords: [goalPoint.lat, goalPoint.lon],
        forecastDay,
        vesselIceClass
      });
      setRouteData(data);
    } catch (err) {
      console.error('Failed to compute routes:', err);
    } finally {
      setIsComputing(false);
    }
  }, [startPoint, goalPoint, forecastDay, vesselIceClass]);

  // Auto compute routes on initial load or landmark change
  useEffect(() => {
    refreshRoutes();
  }, [startPoint, goalPoint, vesselIceClass, forecastDay]);

  const activeRoute = routeData?.routes?.find(r => r.id === selectedRouteId) || routeData?.routes?.[0];

  return (
    <NavigationContext.Provider
      value={{
        currentTab,
        setCurrentTab,
        forecastDay,
        setForecastDay,
        vesselIceClass,
        setVesselIceClass,
        startPoint,
        setStartPoint,
        goalPoint,
        setGoalPoint,
        routeData,
        selectedRouteId,
        setSelectedRouteId,
        activeRoute,
        icebergs,
        isComputing,
        refreshRoutes,
        copilotOpen,
        setCopilotOpen,
        apiStatus,
        verifyApi,
        iceConcentrationAlert,
        setIceConcentrationAlert,
        safetyRadiusNM,
        setSafetyRadiusNM,
        maxHullStress,
        setMaxHullStress,
        isAdminAuth,
        adminLogin,
        adminLogout,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
