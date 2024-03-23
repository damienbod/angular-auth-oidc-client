export interface SilentRenewRunning {
  state: SilentRenewRunningState;
  dateOfLaunchedProcessUtc: string;
}

export type SilentRenewRunningState = 'running' | 'not-running';
