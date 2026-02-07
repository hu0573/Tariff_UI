
// Mock export API
export interface ExportTaskResponse {
  task_id: string;
  status: "processing" | "completed" | "error";
  progress: number;
  error?: string;
  file_name?: string;
}

export const exportApi = {
  // Create CSV task
  createCsvTask: async (_params: {
    type: string;
    year: number;
    month: number;
    state?: string;
    nmi?: string;
  }) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { data: { task_id: "mock-csv-" + Date.now() } };
  },

  // Create PDF task
  createPdfTask: async (_data: {
    export_type: "pdf";
    config: any;
    filename_prefix?: string;
  }) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { data: { task_id: "mock-pdf-" + Date.now() } };
  },

  // Get task status
  getTaskStatus: async (taskId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    // Simulate instant completion or random progress
    return { 
      data: { 
        task_id: taskId, 
        status: "completed", 
        progress: 100 
      } as ExportTaskResponse 
    };
  },

  // Get download URL
  getDownloadUrl: (taskId: string) => {
    // Return a dummy data URL
    const mockContent = `Mock export for task ${taskId}\nGenerated at ${new Date().toISOString()}`;
    const blob = new Blob([mockContent], { type: 'text/plain' });
    return URL.createObjectURL(blob);
  }
};

/**
 * Common polling utility for export tasks (Mocked)
 */
export const pollExportTask = async (
  taskId: string, 
  onProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const response = await exportApi.getTaskStatus(taskId);
        const { status, error, progress } = response.data;

        if (onProgress && progress !== undefined) {
          onProgress(progress);
        }

        if (status === "completed") {
          resolve(exportApi.getDownloadUrl(taskId));
        } else if (status === "error") {
          reject(new Error(error || "Export task failed"));
        } else {
          // Poll again after 1 second
          setTimeout(poll, 1000);
        }
      } catch (err) {
        reject(err);
      }
    };
    poll();
  });
};
