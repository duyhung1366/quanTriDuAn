import axios, { AxiosError, AxiosResponseHeaders } from "axios";
import qs from "query-string";
import { setAcccessToken } from "../redux/slices/auth.slice";
import authHeader from "./authHeader";

const apiHost = process.env.REACT_APP_ENDPOINT || 'http://localhost:3001'
const prefixApi = process.env.REACT_APP_PREFIX_API || 'api'

export const apiEndpoint = `${apiHost}/${prefixApi}`;

export enum ResponseStatusCode {
  success = 200,
  notFound = 404,
  internal = 500
}

export interface IFetchError {
  code?: string;
  name?: string;
  response?: any;
  status?: string | number;
}


const defaultHeaders = {
  "Content-Type": "application/json",
  Accept: "application/json"
}

export type RequestData = {
  endpoint?: string;
  method?: "GET" | "POST" | "PATCH" | "DELETE",
  body?: any;
  customHeaders?: any;
  bodyType?: "json" | "multipart",
  responseType?: "json" | "buffer" | "text"
  withCredentials?: boolean;
};

// Response data
export type ResponseData<T> = {
  error: boolean,
  data: T,
  headers: AxiosResponseHeaders | Partial<Record<string, string> & {
    "set-cookie"?: string[];
  }>
}

var requestTokenRequest = null;

async function refreshToken() {
  try {
    const response = await get({ endpoint: "/auth/refresh-token", withCredentials: true });
    return response.data;
  } catch (error) {
    return null;
  }
}

const request = async (args: RequestData) => {
  const {
    endpoint,
    method = "GET",
    body,
    customHeaders = {},
    withCredentials = false,
    bodyType = "json",
    responseType = "json"
  } = args;
  let _endpoint = endpoint;
  if (!endpoint.startsWith("http")) {
    _endpoint = `${apiHost}/${prefixApi}${endpoint}`;
  }
  const headers = {
    ...defaultHeaders,
    ...customHeaders,
    // with access token
    ...(await authHeader())
  }
  if (method === "POST" && bodyType === "multipart") headers["Content-Type"] = "multipart/form-data";
  try {
    // migrate to axios because fetch don't catch error 404: https://stackoverflow.com/questions/39297345/fetch-resolves-even-if-404
    const response = await axios.request({
      url: _endpoint,
      method,
      headers,
      data: body ? (bodyType === "multipart" ? body : JSON.stringify(body)) : undefined,
      withCredentials
    });
    return {
      error: response.status !== ResponseStatusCode.success,
      data: response.data,
      headers: response.headers
    }
  } catch (error) {
    if (error instanceof AxiosError) {
      const { status, data } = error.response;
      if ((status === 401 && data?.data === 0) || (status === 403 && data?.data === 1)) {
        // TOKEN EXPIRED
        const originalRequest = error.config;
        requestTokenRequest = requestTokenRequest || refreshToken();
        const dataRefreshToken = await requestTokenRequest;
        requestTokenRequest = null;
        if (!!dataRefreshToken) {
          const store = (await import("../redux/store")).default;
          store.dispatch(setAcccessToken(dataRefreshToken.accessToken));
          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: `Bearer ${dataRefreshToken.accessToken}`
          }
          const response = await axios.request(originalRequest);
          return {
            error: response.status !== ResponseStatusCode.success,
            data: response.data,
            headers: response.headers
          }
        }
      }
    }
    throw { ...error, message: ((error as AxiosError)?.response?.data as any)?.message ?? "Unexpected error" } as AxiosError;
  }
}

export const get = (args: Omit<RequestData, "method" | "body"> & { params?: any }) => {
  const { endpoint, params, ...rest } = args;
  let _endpoint = endpoint;
  if (params && !(params.constructor === Object && !Object.keys(params).length)) {
    _endpoint += `?${qs.stringify(params, { encode: true })}`;
  }
  return request({ endpoint: _endpoint, ...rest });
}

export const post = (args: Omit<RequestData, "method"> & { params?: any }) => {
  const { endpoint, params, ...rest } = args;
  let _endpoint = endpoint;
  if (params && !(params.constructor === Object && !Object.keys(params).length)) {
    _endpoint += `?${qs.stringify(params, { encode: true })}`;
  }
  return request({ method: "POST", endpoint: _endpoint, ...rest });
}

export const patch = (args: Omit<RequestData, "method"> & { params?: any }) => {
  const { endpoint, params, ...rest } = args;
  let _endpoint = endpoint;
  if (params && !(params.constructor === Object && !Object.keys(params).length)) {
    _endpoint += `?${qs.stringify(params, { encode: true })}`;
  }
  return request({ method: "PATCH", endpoint: _endpoint, ...rest });
}

export const del = (args: Omit<RequestData, "method"> & { params?: any }) => {
  const { endpoint, params, ...rest } = args;
  let _endpoint = endpoint;
  if (params && !(params.constructor === Object && !Object.keys(params).length)) {
    _endpoint += `?${qs.stringify(params, { encode: true })}`;
  }
  return request({ method: "DELETE", endpoint: _endpoint, ...rest });
}
