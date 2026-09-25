export type DataRefreshMode = "initial" | "background";

export interface DataLoadState {
  initialLoading: boolean;
  refreshing: boolean;
  error: string;
}

export function createDataLoadState(): DataLoadState {
  return {
    initialLoading: false,
    refreshing: false,
    error: "",
  };
}

export function startDataRefresh(state: DataLoadState, mode: DataRefreshMode): void {
  state.error = "";
  if (mode === "initial") {
    state.initialLoading = true;
  } else {
    state.refreshing = true;
  }
}

export function finishDataRefresh(state: DataLoadState, mode: DataRefreshMode): void {
  if (mode === "initial") {
    state.initialLoading = false;
  } else {
    state.refreshing = false;
  }
}

export function failDataRefresh(state: DataLoadState, mode: DataRefreshMode, error: unknown): void {
  state.error = error instanceof Error ? error.message : String(error ?? "加载失败");
  finishDataRefresh(state, mode);
}
