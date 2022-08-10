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

        let resole = (value) => {
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
            exception(resole, reject)
        } catch (e) {
            reject(e)
        }
    }

    then (onFulfilled, onRejected) {

        let promise2 = new MyPromise((resole, reject) => {
                
            if (this.status === PENDING) {
                this.onFulfilledCallbackList.push(() => onFulfilled(this.value))
                this.onRejectedCallbackList.push(() => onRejected(this.reason))
            }

            setTimeout(() => {
                if (this.status === FULFILLED) {
                    let x = onFulfilled(this.value)
                    resolvePromise(promise2, x, resole, reject)
                }
                
                if (this.status === REJECTED) {
                    let x = onRejected(this.reason)
                    resolvePromise(promise2, x, resole, reject)
                }
            }, 0)
        })

        function resolvePromise(promise, x, resole, reject) {
            console.log(promise, x, resole, reject)
        }
        return promise2 
    }

    catch (onRejected) {
        return this.then(null, onRejected)
    }
}


window.MyPromise = MyPromise
