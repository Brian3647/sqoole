import forwarded from 'forwarded-for';

let localReqCount: number = 1;

export class RateLimiter {
	windowMs: number;
	maxRequests: number;
	requestCounts: Map<string, number>;

	constructor(windowMs: number, maxRequests: number) {
		this.windowMs = windowMs;
		this.maxRequests = maxRequests;
		this.requestCounts = new Map<string, number>();
	}

	check(req: Request): [undefined | Response, string] {
		const ip = forwarded(req, req.headers).ip || '';
		// TODO: FIXME: USE REQ.IP WHEN IT GETS ADDED ASAP.
		if (!ip) {
			return [
				new Response('Forbidden', {
					status: 403
				}),
				ip
			];
		}

		const requestCount = this.requestCounts.get(ip) || 0;
		if (requestCount >= this.maxRequests) {
			const retryAfter = (this.windowMs / 1000).toString();
			const headers = new Headers();
			headers.set('Retry-After', retryAfter);
			return [
				new Response('Too Many Requests. Retry after ' + retryAfter + 's.', {
					status: 429,
					headers: headers
				}),
				ip
			];
		}

		this.requestCounts.set(ip, requestCount + 1);

		setTimeout(() => {
			this.requestCounts.set(ip, 0);
		}, this.windowMs);

		return [undefined, ip];
	}
}
