const PENDING = 'pending'
const FULFILLED = 'fulfilled'
const REJECTED = 'rejected'

class MyPromise {

    onFulfilledCallbackList = []
    onRejectedCallbackList = []

    constructor (exception) {
        this.status = PENDING
        this.value = null
        this.reason = null

        let  resolve = (value) => {
            this.status = FULFILLED
            this.value = value
            this.onFulfilledCallbackList.forEach(fn => fn())
        }
        let reject = (reason) => {
            this.status = REJECTED
            this.reason = reason
            this.onRejectedCallbackList.forEach(fn => fn())
        }
        try {
            exception( resolve, reject)
        } catch (e) {
            reject(e)
        }
    }

    then (onFulfilled, onRejected) {

        let promise2 = new MyPromise(( resolve, reject) => {
                
            if (this.status === PENDING) {
                this.onFulfilledCallbackList.push(() => onFulfilled(this.value))
                this.onRejectedCallbackList.push(() => onRejected(this.reason))
            }

            setTimeout(() => {
                if (this.status === FULFILLED) {
                    let x = onFulfilled(this.value)
                    resolvePromise(promise2, x,  resolve, reject)
                }
                
                if (this.status === REJECTED) {
                    let x = onRejected(this.reason)
                    resolvePromise(promise2, x,  resolve, reject)
                }
            }, 0)
        })

        function resolvePromise(promise, x,  resolve, reject) {
            if (promise === x) {
                return reject(new TypeError('max call stack exceeded'))
            }
            if (x instanceof MyPromise) {
                x.then(
                    (y) => {
                        this.resolvePromise(promise, y, resolve, reject)
                    },
                    reject
                )
            } else if (
                // Object.prototype.toString.call(x) === '[object, Object]'
                typeof x === 'object' && x !== null || typeof x === 'function' 
            ) {
                let then = null
                try {
                    then = x.then
                } catch (error) {
                    return reject(error)
                }
    
                if (typeof then === 'function') {
                    // onFulflled, onRejected只能调用一次
                    let called = false
                    try {
                        x.then.call(
                            x,
                            (y) => {
                                if (called) return
                                called = true
                                this.resolvePromise(promise, y, resolve, reject)
                            },
                            (r) => {
                                if (called) return
                                called = true
                                reject(r)
                            }
                        )
                    } catch (error) {
                        if (called) {
                            return
                        }
                        reject(error)
                    }
                } else {
                    resolve(x)
                }
            } else {
                resolve(x)
            }
        }
        return promise2 
    }

    catch (onRejected) {
        return this.then(null, onRejected)
    }
}


window.MyPromise = MyPromise
