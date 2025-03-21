export interface BaseState {
  isLoading: boolean;
  error: string | null;
  lastUpdated: number;
}

export interface BaseActions {
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetState: () => void;
}

export interface BaseStore extends BaseState, BaseActions {}

export type Status = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState {
  status: Status;
  error: string | null;
}

export interface WithAsync {
  async: AsyncState;
} 