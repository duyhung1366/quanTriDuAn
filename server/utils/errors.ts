export class ServerError extends Error {
  status: number;
  message: string;
  data?: any;
  constructor(args: { status?: number, message?: string, data?: any }) {
    super();
    this.status = args.status ?? 200;
    this.message = args.message ?? '';
    this.data = args.data;
  }
}

export class BadRequestError extends ServerError {
  constructor({ ...payload }: any = {}) {
    super({ status: 400, message: 'BadRequest', ...payload });
  }
}