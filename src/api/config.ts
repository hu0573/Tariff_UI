
// Mock configuration API functions
import { mockNMIList, mockSAPNConfig } from "./mockData";

export const configApi = {
  // SAPN configuration
  getSAPNConfig: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { data: mockSAPNConfig };
  },
  updateSAPNConfig: async (data: { username: string; password: string }) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { data: { success: true, message: "Configuration saved" } };
  },
  testSAPNConnection: async (data: { username: string; password: string }) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { data: { success: true, nmi_count: 5, message: "Connection successful" } };
  },
  getNMIList: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { data: { nmis: mockNMIList } };
  },
  getNMIStatistics: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { data: { total: mockNMIList.length } };
  },
  refreshNMIList: async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { data: { success: true, current_count: mockNMIList.length, added: [], removed: [] } };
  },
  
  // Server configuration
  getServerConfig: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { data: { host: "192.168.1.100", username: "admin", port: 22, remote_dir: "/var/data" } };
  },
  updateServerConfig: async (data: any) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { data: { success: true } };
  },
  testServerConnection: async (data: any) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { data: { success: true, message: "Connected to server" } };
  },
  
  // Refresh strategy
  getRefreshStrategy: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { 
      data: {
        monitored_nmis: mockNMIList.map(n => ({ nmi: n.nmi, refresh_frequency: "daily" })),
        automation_config: { data_type: "full", refresh_time: "02:00" }
      } 
    };
  },
  updateRefreshStrategy: async (data: any) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { data: { success: true } };
  },
  addMonitoredNMI: async (data: any) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { data: { success: true } };
  },
  updateNMIFrequency: async (nmi: string, data: any) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { data: { success: true } };
  },
  removeMonitoredNMI: async (nmi: string) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { data: { success: true } };
  },
  
  // MySQL configuration
  getMySQLConfig: async () => {
     await new Promise((resolve) => setTimeout(resolve, 300));
     return { data: { host: "localhost", port: 3306, username: "dbuser", database: "tariffs", enabled: true } };
  },
  updateMySQLConfig: async (data: any) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { data: { success: true } };
  },
  testMySQLConnection: async (data: any) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { data: { success: true, message: "Connected to MySQL" } };
  },
  getMySQLDatabases: async (data: any) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { data: { databases: ["information_schema", "mysql", "tariffs", "test"] } };
  },
  createMySQLDatabase: async (data: any) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { data: { success: true } };
  },
  
  // Initialization
  getInitializationStatus: async () => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return { data: { is_initialized: true, steps_completed: ["config", "nmi_sync"] } };
  },
  completeInitialization: async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { data: { success: true } };
  },
  verifyNMIData: async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { data: { success: true, details: "All good" } };
  },
};
