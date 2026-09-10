import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { WastageAlert } from '../types';

interface TelemetrySummary {
  total_power_kw: number;
  total_power_w: number;
  total_current_a: number;
  total_energy_kwh: number;
  total_rooms: number;
  occupied_rooms: number;
  unoccupied_rooms: number;
  online_devices: number;
  telemetry_connected: boolean;
}

interface TelemetryContextType {
  summary: TelemetrySummary | null;
  buildings: any[];
  activeAlerts: WastageAlert[];
  refreshTelemetry: () => Promise<void>;
  loading: boolean;
}

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

export const TelemetryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [summary, setSummary] = useState<TelemetrySummary | null>(null);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<WastageAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshTelemetry = async () => {
    try {
      const liveData = await apiRequest('/telemetry/live');
      if (liveData.summary) {
        setSummary(liveData.summary);
        setBuildings(liveData.buildings || []);
      }

      const alertData = await apiRequest('/wastage/alerts?status=ACTIVE');
      if (alertData.data) {
        setActiveAlerts(alertData.data);
      }
    } catch (err) {
      console.error('Failed to fetch live telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshTelemetry();
    const interval = setInterval(refreshTelemetry, 5000); // 5s poll interval
    return () => clearInterval(interval);
  }, []);

  return (
    <TelemetryContext.Provider value={{ summary, buildings, activeAlerts, refreshTelemetry, loading }}>
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
};
