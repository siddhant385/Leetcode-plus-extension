import { useState, useEffect } from "react";
import { ZodStorageManager, DeepPartial } from "../utils/optionsStorage";
import { configSchema, Config } from "../schema/options.schema"; // Import Zod schemas here

// Create a singleton instance for the entire app
export const configManager = new ZodStorageManager("app_config", configSchema);

// 🚀 Custom Hook for React UI
export function useConfig() {
  // Initial state will be set using Zod defaults
  const [config, setConfig] = useState<Config>(configManager.data);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data from storage when the component mounts
  useEffect(() => {
    const fetchConfig = async () => {
      const loadedData = await configManager.load();
      setConfig(loadedData);
      setIsLoading(false);
    };

    fetchConfig();

    // 🚀 Listen live for changes occurring in the background or other tabs
    const handleStorageChange = (changes: {
      [key: string]: chrome.storage.StorageChange;
    }) => {
      if (changes[configManager.key]) {
        // Validate new values against the schema before updating state
        const newData = configManager.schema.parse(
          changes[configManager.key].newValue || {},
        );
        setConfig(newData);
        configManager.data = newData; // Class property ko bhi sync rakho
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);
  // Update function jo State aur Storage dono me save karega
  const updateConfig = async (newConfig: DeepPartial<Config>) => {
    // 1. Merge and save using Storage Manager
    const updatedData = await configManager.save(newConfig);
    // 2. Update React component state (triggers UI re-render)
    setConfig(updatedData);
  };

  return {
    config,
    updateConfig,
    isLoading,
  };
}
