// Initialization status type definitions
export interface StepStatus {
  configured: boolean;
  tested?: boolean;
  required: boolean;
  completed: boolean;
  error?: string | null;
}

export interface FileUploadStepStatus extends StepStatus {
  skipped?: boolean;
}

export interface NMIListStepStatus {
  exists: boolean;
  count: number;
  required: boolean;
  completed: boolean;
  error?: string | null;
}

export interface InitializationSteps {
  database: StepStatus;
  file_upload: FileUploadStepStatus;
  website: StepStatus;
  nmi_list: NMIListStepStatus;
}

export interface InitializationStatus {
  is_initialized: boolean;
  steps: InitializationSteps;
  completed_steps: string[];
  pending_steps: string[];
  current_step: string | null;
  can_skip_file_upload: boolean;
}

export interface CompleteInitializationResponse {
  success: boolean;
  message: string;
  completed_at: string;
}

export interface NMIVerificationResponse {
  success: boolean;
  exists: boolean;
  count: number;
  last_update?: string;
  message?: string;
}
