import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { isElectron } from "@/lib/electron-helper";

interface LicenseContextType {
  isLicensed: boolean;
  licenseKey: string | null;
  deviceId: string | null;
  clientInfo: any | null;
  features: string[];
  hasFeature: (featureName: string) => boolean;
  verifyLicense: (key: string) => Promise<boolean>;
  isLoading: boolean;
}

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

import { API_URL as CENTRAL_API_URL } from "@/lib/config";

// Ensure your Django backend URL is set here
const API_BASE_URL = CENTRAL_API_URL;

export const LicenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLicensed, setIsLicensed] = useState<boolean>(false);
  const [licenseKey, setLicenseKey] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [clientInfo, setClientInfo] = useState<any | null>(null);
  const [features, setFeatures] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializeLicense = async () => {
      try {
        setIsLoading(true);

        if (!isElectron()) {
          // Web Demo Mode: Auto-verify demo key
          const demoKey = 'A-091233';
          setLicenseKey(demoKey);
          setIsLicensed(true);
          setFeatures([
            'Inventory Analytics',
            'Advanced Reports',
            'AI Analyst',
            'Inventory Forecast',
            'Reorder Optimization',
            'Smart Categorization',
            'Business Analyst Chat',
            'Invoice OCR'
          ]);
          setClientInfo({ name: 'Demo User (Invenza AI)', id: 0 });
          setIsLoading(false);
          return;
        }

        // @ts-ignore
        const savedKey = await window.electronAPI.getLicenseKey();
        // @ts-ignore
        const currentDeviceId = await window.electronAPI.getDeviceId();
        
        setDeviceId(currentDeviceId);

        if (savedKey) {
          setLicenseKey(savedKey);
          await checkLicenseWithServer(savedKey, currentDeviceId);
        } else {
          setIsLicensed(false);
        }
      } catch (error) {
        console.error("Failed to initialize license:", error);
        setIsLicensed(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeLicense();
  }, []);

  const checkLicenseWithServer = async (key: string, devId: string) => {
    // [DEVELOPMENT BYPASS REMOVED] 
    // We now rely on the server to tell us which features are enabled for tmr-international


    try {
      const response = await fetch(`${API_BASE_URL}/license/verify/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ license_key: key, device_id: devId }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setClientInfo(data.client);
        setIsLicensed(true);
        // On success, also fetch enabled features
        await fetchEnabledFeatures(data.client.id);
        return true;
      } else {
        setIsLicensed(false);
        toast.error(data.message || "Invalid license key");
        return false;
      }
    } catch (error) {
      console.error("License verification failed:", error);
      // In a real-world scenario, you might want to allow offline access
      // if they verified previously, but for this strict SaaS system,
      // we'll fail closed if we can't verify (or fail open depending on needs).
      // Let's assume fail closed for security.
      toast.error("Could not connect to license server.");
      return false;
    }
  };

  const fetchEnabledFeatures = async (clientId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/license/features/?client_id=${clientId}`);
      const data = await response.json();
      
      if (response.ok && data.status === 'success') {
        setFeatures(data.features || []);
      }
    } catch (error) {
      console.error("Failed to fetch features:", error);
    }
  };

  const verifyLicense = async (key: string) => {
    setIsLoading(true);
    // @ts-ignore
    const currentDeviceId = await window.electronAPI.getDeviceId();
    const success = await checkLicenseWithServer(key, currentDeviceId);
    
    if (success) {
      // @ts-ignore
      await window.electronAPI.saveLicenseKey(key);
      setLicenseKey(key);
    }
    
    setIsLoading(false);
    return success;
  };

  const hasFeature = (featureName: string) => {
    return features.includes(featureName);
  };

  return (
    <LicenseContext.Provider
      value={{
        isLicensed,
        licenseKey,
        deviceId,
        clientInfo,
        features,
        hasFeature,
        verifyLicense,
        isLoading,
      }}
    >
      {children}
    </LicenseContext.Provider>
  );
};

export const useLicense = () => {
  const context = useContext(LicenseContext);
  if (context === undefined) {
    throw new Error("useLicense must be used within a LicenseProvider");
  }
  return context;
};
