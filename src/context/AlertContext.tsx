import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AlertConfig } from '../components/common/GlobalAlert';

interface AlertContextType {
  showAlert: (config: Omit<AlertConfig, 'id'>) => void;
  hideAlert: (id: string) => void;
  currentAlert: AlertConfig | null;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

interface AlertProviderProps {
  children: ReactNode;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
  const [currentAlert, setCurrentAlert] = useState<AlertConfig | null>(null);

  const showAlert = useCallback((config: Omit<AlertConfig, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newAlert: AlertConfig = {
      ...config,
      id,
    };

    setCurrentAlert(newAlert);
  }, []);

  const hideAlert = useCallback((id: string) => {
    setCurrentAlert(null);
  }, []);

  const value: AlertContextType = {
    showAlert,
    hideAlert,
    currentAlert,
  };

  return (
    <AlertContext.Provider value={value}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlert = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};
