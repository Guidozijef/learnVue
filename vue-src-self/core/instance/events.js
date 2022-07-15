// 初始化事件

import { updateListeners } from "../vdom/helpers"

export function initEvents (vm) {
  // 在vm上创建一个_events对象，用来存放事件
  vm._events = Object.create(null)

  // 这个表示用来表明是否存在钩子，而不是需要通过哈西表的方式来查找是否有周期钩子，这样做可以减少不必要的开销，优化性能
  vm._hasHookEvent = false

  // 初始化父组件attach的事件
  const listeners = vm.$options._parentListeners
  if (listeners) {
    updateComponentListeners(vm, listeners)
  }

}


let target


/*有once的时候注册一个只会触发一次的方法，没有once的时候注册一个事件方法*/
function add (event, fn, once) {
  if (once) {
    target.$once(event, fn)
  } else {
    target.$on(event, fn)
  }
}


/*销毁一个事件方法*/
function remove (event, fn) {
  target.$off(event, fn)
}


// 更新组件的监听事件
export function updateComponentListeners (vm, listeners, oldListeners) {
  target = vm
  updateListeners(listeners, oldListeners || {}, add, remove, vm)
}


// 为Vue原型加入操作事件的方法
export function eventsMixin (Vue) {
  const hookRE = /^hook:/

  // 在实例vm上绑定事件方法
  Vue.prototype.$on = function (event, fn) {
    const vm = this

    // 如果是数组的时候，则递归$on， 为每个成员都绑定一个方法
    if (Array.isArray(event)) {
      for (let i = 0, l = event.length; i < l; i++) {
        this.$on(event[i], fn)
      }
    } else {
      // _events存储事件
       (vm._events[event] || (vm._events[event] = []).push(fn))

       /*这里在注册事件的时候标记bool值也就是个标志位来表明存在钩子，而不需要通过哈希表的方法来查找是否有钩子，这样做可以减少不必要的开销，优化性能。*/
       if (hookRE.test(event)) {
         vm._hasHookEvent = true
       }
    }

    return vm

  }

  /*注销一个事件，如果不传参则注销所有事件，如果只传event名则注销该event下的所有方法*/
  Vue.prototype.$off = function (event, fn) {
    const vm = this

    function on () {
      vm.$off(event, on)
      fn.apply(vm, arguments)
    }
    on.fn = fn
    vm.$on(event, on)
    return vm
  }

  /*注销一个事件，如果不传参则注销所有事件，如果只传event名则注销该event下的所有方法*/
  Vue.prototype.$off = function (event, fn) {
    const vm = this
    if (!arguments.length) {
      vm._events = Object.create(null)
      return vm
    }

    /*如果event是数组则递归注销事件*/
    if (Array.isArray(event)) {
      for (let i = 0, l = event.length; i < l; i++) {
        this.$off(event[i], fn)
      }
      return vm
    }

    const cbs = vm._events[event]
    if (!cbs) {
      return vm
    }

    /*如果只传了event参数则注销该event方法下的所有方法*/
    if (arguments.length === 1) {
      vm._events[event] = null
      return vm
    }

    /*遍历寻找对应方法并删除*/
    let cb
    let i = cbs.length
    while (i--) {
      cb = cbs[i]
      if (cb === fn || cb.fn === fn) {
        cbs.splice(i, 1)
        break
      }
    }

    return vm
  }
  
}