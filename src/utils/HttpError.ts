export default class HttpError extends Error {
	status: string;

	constructor(public msg: string, public statusCode: number = 500) {
		super(msg);
		this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
		Error.captureStackTrace(this, this.constructor);
	}
}
