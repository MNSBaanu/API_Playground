export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export type HeaderRow = { id: string; key: string; value: string };

export type RequestState = {
  method: HttpMethod;
  url: string;
  headers: HeaderRow[];
  body: string;
};

export type SavedRequest = {
  id: string;
  name: string;
  request: RequestState;
  createdAt: number;
};

export type Collection = {
  id: string;
  name: string;
  requests: SavedRequest[];
};

export type EnvVariable = { id: string; key: string; value: string };

export type Environment = {
  id: string;
  name: string;
  variables: EnvVariable[];
};

export type ResponseResult = {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  isJson: boolean;
  timeMs: number;
  sizeBytes: number;
};

export const METHODS_WITH_BODY: HttpMethod[] = ["POST", "PUT", "PATCH", "DELETE"];
