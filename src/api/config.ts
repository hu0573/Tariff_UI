// Mock configuration API functions
import { mockNMIList, mockSAPNConfig } from "./mockData";

export interface ServerConfig {
  host?: string;
  username?: string;
  port?: number;
  remote_dir?: string;
  connection_status?: string;
  path_accessible?: boolean;
}

export interface ServerConfigInput extends ServerConfig {
  password?: string;
}

export interface MySQLConfig {
  host?: string;
  port?: number;
  username?: string;
  database?: string;
  enabled?: boolean;
}

export interface MySQLConfigInput extends MySQLConfig {
  password?: string;
  database_name?: string; // For create database
}

export const configApi = {
  // SAPN configuration
  getSAPNConfig: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { data: mockSAPNConfig };
  },
  updateSAPNConfig: async (_data: { username: string; password: string }) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { data: { success: true, message: "Configuration saved" } };
  },
  testSAPNConnection: async (_data: { username: string; password: string }) => {
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
    return { data: { success: true, message: "Refresh successful", current_count: mockNMIList.length, added: [], removed: [] } };
  },
  
  // Server configuration
  getServerConfig: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const config: ServerConfig = { host: "example.server.com", username: "admin", port: 22, remote_dir: "/var/data", connection_status: "connected", path_accessible: true };
    return { data: config };
  },
  updateServerConfig: async (_data: ServerConfigInput) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { data: { success: true } };
  },
  testServerConnection: async (_data: ServerConfigInput) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { data: { success: true, message: "Connected to server", path_accessible: true } };
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
  updateRefreshStrategy: async (_data: any) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { data: { success: true } };
  },
  addMonitoredNMI: async (_data: any) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { data: { success: true } };
  },
  updateNMIFrequency: async (_nmi: string, _data: any) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { data: { success: true } };
  },
  removeMonitoredNMI: async (_nmi: string) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { data: { success: true } };
  },
  
  // MySQL configuration
  getMySQLConfig: async () => {
     await new Promise((resolve) => setTimeout(resolve, 300));
     const config: MySQLConfig = { host: "localhost", port: 3306, username: "dbuser", database: "tariffs", enabled: true };
     return { data: config };
  },
  updateMySQLConfig: async (_data: MySQLConfigInput) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { 
      data: { 
        success: true,
        initialization_status: {
          is_initialized: true,
          steps: {
             database: { configured: true, tested: true, required: true, completed: true },
             file_upload: { configured: true, required: false, completed: true, skipped: true },
             website: { configured: true, tested: true, required: true, completed: true },
             nmi_list: { exists: true, count: 3, required: true, completed: true }
          },
          completed_steps: ["database"],
          pending_steps: [],
          current_step: null,
          can_skip_file_upload: true
        }
      } 
    };
  },
  testMySQLConnection: async (_data: MySQLConfigInput) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { data: { success: true, message: "Connected to MySQL", version: "8.0.33" } };
  },
  getMySQLDatabases: async (_data: MySQLConfigInput) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { data: { success: true, databases: ["information_schema", "mysql", "tariffs", "test"] } };
  },
  createMySQLDatabase: async (_data: MySQLConfigInput) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { data: { success: true } };
  },
  
  // Initialization
  getInitializationStatus: async () => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return { 
      data: { 
        is_initialized: true,
        steps: {
          database: { configured: true, tested: true, required: true, completed: true },
          file_upload: { configured: true, required: false, completed: true, skipped: true },
          website: { configured: true, tested: true, required: true, completed: true },
          nmi_list: { exists: true, count: 3, required: true, completed: true }
        },
        completed_steps: ["database", "website", "nmi_list"],
        pending_steps: [],
        current_step: null,
        can_skip_file_upload: true
      } 
    };
  },
  completeInitialization: async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { data: { success: true, message: "Initialization completed successfully", completed_at: new Date().toISOString() } };
  },
  verifyNMIData: async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { data: { success: true, exists: true, count: 3, message: "Verification successful" } };
  },
};
