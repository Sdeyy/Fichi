/**
 * Polyfills required by Node < 22 runtimes.
 *
 * `sonaria` (the voice/music engine) uses `Promise.withResolvers`, which is only
 * available from Node 22 onwards. This module is imported before anything else
 * so the polyfill is installed globally.
 */
if (typeof (Promise as unknown as { withResolvers?: unknown }).withResolvers !== 'function') {
	Object.defineProperty(Promise, 'withResolvers', {
		configurable: true,
		writable: true,
		value: function withResolvers<T>() {
			let resolve!: (value: T | PromiseLike<T>) => void;
			let reject!: (reason?: unknown) => void;

			const promise = new Promise<T>((res, rej) => {
				resolve = res;
				reject = rej;
			});

			return { promise, resolve, reject };
		},
	});
}

export {};
