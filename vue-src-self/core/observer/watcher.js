import { pushTarget, popTarget } from "./dep"
import { parsePath } from '../util'

export default class Watcher {

  constructor (vm, expOrFn, cb, options) {
    this.vm = vm
    vm._watchers.push(this)
    if (options) {
      this.deep = !!options.deep
      this.user = !!options.user
      this.lazy = !!options.lazy
      this.sync = !!options.sync
    } else {
      this.deep = this.user = this.lazy = this.sync = false
    }
    this.cb = cb
    this.id = ++uid // uid for batching
    this.active = true
    this.dirty = this.lazy // for lazy watchers
    this.deps = []
    this.newDeps = []
    this.depIds = new Set()
    this.newDepIds = new Set()
    this.expression = expOrFn.toString()

    // parse expression for getter
    /*把表达式expOrFn解析成getter*/
    if (typeof expOrFn === 'function') {
      this.getter = expOrFn
    } else {
      this.getter = parsePath(expOrFn)
      if (!this.getter) {
        this.getter = function () {}
        console.error(`Failed watching path: "${expOrFn}" ` +
        'Watcher only accepts simple dot-delimited paths. ' +
        'For full control, use a function instead.')
      }
    }

    this.value = this.lazy ? undefined : this.get()

  }


  get () {
    pushTarget(this)
    let value
    const vm = this.vm

    if (this.user) {
      try {
        value = this.getter.call(vm, vm)
      }
    } else {
      value = this.getter.call(vm, vm)
    }
  }






}