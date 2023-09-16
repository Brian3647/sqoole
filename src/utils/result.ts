// Similar to Rust's result class. I'm just too used to it.

type unwrapOrFunction<T, E> = (error: E | undefined) => T;

export class Result<T, E> {
	value: T | E | undefined;
	error!: boolean;

	constructor(error: boolean, value?: T | E) {
		this.error = error;
		if (value) this.value = value;
	}

	public isOk(): boolean {
		return !this.error && this.value != undefined;
	}

	public isError(): boolean {
		return this.error || this.value === undefined;
	}

	public unwrap(): T {
		if (this.isError()) {
			throw '[UNWRAPPED ERROR] ' + this.value;
		}

		return this.value as T;
	}

	public unwrapOr(run: unwrapOrFunction<T, E>): T {
		if (this.isOk()) return this.value as T;

		return run(this.value as E | undefined);
	}

	public unwrapError(): E {
		if (this.isOk()) {
			throw '[EXPECTED ERROR, GOT OK] ' + this.value;
		}

		return this.value as E;
	}
}

export function Ok<T>(value?: T): Result<T, any> {
	return new Result<T, unknown>(false, value);
}

export function Error<E>(value: E): Result<any, E> {
	return new Result<unknown, E>(true, value);
}
