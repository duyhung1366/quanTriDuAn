import axios, { AxiosError } from "axios";
import { Request, Response } from "express";

export const successResponse = (res: Response, data?: any) => {
  res.json({ success: true, data });
}

export const failureResponse = (res: Response, status: number, { ...payload }: any = {}) => {
  res.status(status).json({ success: false, ...payload });
}

export type ExternalRequestData = {
  endpoint: string;
  method?: "GET" | "POST" | "PATCH" | "DELETE",
  body?: any;
  customHeaders?: any;
  bodyType?: "json" | "multipart"
}
export const externalRequest = async (args: ExternalRequestData) => {
  const {
    endpoint,
    method = "GET",
    body,
    customHeaders = {},
    bodyType = "json",
  } = args;

  const defaultHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json"
  }

  const headers = {
    ...defaultHeaders,
    ...customHeaders,
  }
  if (method === "POST" && bodyType === "multipart") headers["Content-Type"] = "multipart/form-data";

  try {
    // migrate to axios because fetch don't catch error 404: https://stackoverflow.com/questions/39297345/fetch-resolves-even-if-404
    const response = await axios.request({
      url: endpoint,
      method,
      headers,
      data: body ? (bodyType === "multipart" ? body : JSON.stringify(body)) : undefined,
    });
    return {
      error: response.status !== 200,
      data: response.data,
      headers: response.headers
    }
  } catch (error: any) {
    throw { ...error, message: ((error as AxiosError)?.response?.data as any)?.message ?? "Unexpected error" } as AxiosError;
  }
}

type ReqQueryProp = Request["query"][any];
export const ParseQuery = {
    str: (args: ReqQueryProp) => typeof args === "string" ? args : undefined,
    arrStr: (args: ReqQueryProp) => typeof args === "string" ? args.split(",") : undefined,
    num: (args: ReqQueryProp) => typeof args === "string" && !isNaN(+args) ? +args : undefined,
    bool: (args: ReqQueryProp) => typeof args === "string" && ["true", "false"].includes(args) ? !!JSON.parse(args) : undefined,
    arrNum(args: ReqQueryProp) {
        const parsedStr = this.arrStr(args);
        return !!parsedStr && parsedStr.every((e) => !isNaN(+e)) ? parsedStr.map((e) => +e) : undefined;
    }
};
