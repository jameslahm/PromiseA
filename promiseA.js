const PENDING = 'pending'
const RESOLVE = 'resolved'
const REJECT = 'rejected'

const PromiseA = function (executor) {
	const self = this

	// store self
	self._value = undefined
	self._reason = undefined
	self.status = PENDING
	self.onResolvedHooks = []
	self.onRejectHooks = []

	function resolve(value) {
		if (self.status === PENDING) {
			self._value = value
			self.status = RESOLVE
			self.onResolvedHooks.forEach((fn) => {
				fn()
			})
		}
	}

	function reject(reason) {
		if (self.status === PENDING) {
			self._reason = reason
			self.status = REJECT
			self.onRejectHooks.forEach((fn) => {
				fn()
			})
		}
	}

	try {
		executor(resolve, reject)
	} catch (e) {
		reject(e)
	}
}

function resolvePromise(promise2, x, resolve, reject) {
	if (x === promise2) {
		throw TypeError('Not Circle Chain')
	}
	let called
	if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
		try {
			let then = x.then
			if (typeof then === 'function') {
				then.call(
					x,
					function (y) {
						if (called) return
						called = true
						resolvePromise(promise2, y, resolve, reject)
					},
					function (y) {
						if (called) return
						called = true
						reject(y)
					}
				)
			} else {
				resolve(x)
			}
		} catch (err) {
			if (called) return
			called = true
			reject(err)
		}
	} else {
		resolve(x)
	}
}

PromiseA.prototype.then = function (onResolvedHook, onRejectHook) {
	onResolvedHook =
		typeof onResolvedHook === 'function' ? onResolvedHook : (value) => value
	onRejectHook =
		typeof onRejectHook === 'function'
			? onRejectHook
			: (err) => {
					throw err
			  }

	let self = this
	let promise2

	if (self.status === RESOLVE) {
		return (promise2 = new PromiseA(function (resolve, reject) {
			setTimeout(function () {
				try {
					let x = onResolvedHook(self._value)
					resolvePromise(promise2, x, resolve, reject)
				} catch (err) {
					reject(err)
				}
			})
		}))
	}

	if (self.status === REJECT) {
		return (promise2 = new PromiseA(function (resolve, reject) {
			setTimeout(function () {
				try {
					let x = onRejectHook(self._reason)
					resolvePromise(promise2, x, resolve, reject)
				} catch (err) {
					reject(err)
				}
			})
		}))
	}

	if (self.status === PENDING) {
		return (promise2 = new PromiseA(function (resolve, reject) {
			self.onResolvedHooks.push(function () {
				setTimeout(function () {
					try {
						let x = onResolvedHook(self._value)
						resolvePromise(promise2, x, resolve, reject)
					} catch (err) {
						reject(err)
					}
				})
			})
			self.onRejectHooks.push(function () {
				setTimeout(function () {
					try {
						let x = onRejectHook(self._reason)
						resolvePromise(promise2, x, resolve, reject)
					} catch (err) {
						reject(err)
					}
				})
			})
		}))
	}
}

module.exports = {
	resolved: function (value) {
		return new PromiseA(function (resolve, reject) {
			resolve(value)
		})
	},
	rejected: function (reason) {
		return new PromiseA(function (resolve, reject) {
			reject(reason)
		})
	},
	deferred: function () {
		let resolve
		let reject
		return {
			promise: new PromiseA(function (res, rej) {
				resolve = res
				reject = rej
			}),
			resolve: resolve,
			reject: reject,
		}
	},
}
