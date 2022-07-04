import { updateListeners } from "../vdom/helpers"

/*初始化事件*/
export function initEvents (vm) {
  // 在vm上穿件一个_events对象，用来存放事件
  vm._events = Object.create(null)
  // 这个bool标志位来表明是否存在钩子，而不是需要通过哈希表的方式来查找是否有钩子，这样做可以减少不必要的开销，优化性能。*/
  vm._hasHookEvent = false

  // 初始化父组件attact的事件
  const listener = vm.$options._parentListeners
  if (listener) {
    updateComponentListeners(vm, listener)
  }
 
}


let target

/*有once的时候注册一个只会触发一次的方法，没有once的时候注册一个事件方法*/
function add(event, fn, once) {
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


export function updateComponentListeners (vm, listeners, oldListeners) {
  target = vm
  updateListeners(listeners, oldListeners || {}, add, remove, vm)
}