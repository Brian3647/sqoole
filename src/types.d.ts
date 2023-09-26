declare module 'forwarded-for' {
	export default (req: any, headers?: any) => any;
}

declare module 'node-schedule' {
	export function scheduleJob(time: string, fn: () => any);
}
