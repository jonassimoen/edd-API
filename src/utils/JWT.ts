import jwt from "jsonwebtoken";

const privateKey = process.env.PRIVATE_KEY!;
const publicKey = process.env.PUBLIC_KEY!;

export const signJwt = (object: Object, options?: jwt.SignOptions | undefined) => {
	return jwt.sign(object, privateKey, {
		...(options && options),
		algorithm: "RS512",
	});
};

export function verifyJwt(token: string) {
	try {
		const decoded = jwt.verify(token, publicKey);
		return {
			valid: true,
			expired: false,
			decoded,
		};
	} catch (e: any) {
		return {
			valid: false,
			expired: e.message === "jwt expired",
			decoded: null,
		};
	}
}
