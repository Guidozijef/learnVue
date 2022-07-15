import { createEmptyVNode } from "../vdom/vnode"
import Watcher from "../observer/watcher"

/*初始化生命周期*/
export function initLifecycle (vm) {
  const options = vm.$options

 // locate first non-abstract parent
  /* 将vm对象存储到parent组件中（保证parent组件是非抽象组件，比如keep-alive） */
  let parent = options.parent
  if (parent && !options.abstract) {
    while (parent.$options.abstract && parent.$parent) {
      parent = parent.$options
    }
    parent.$children.push(vm)
  }


  vm.$parent = parent
  vm.$root = parent ? parent.$root : vm

  vm.$children = []
  vm.$refs = {}

  vm._watcher = null
  vm._inactive = null
  vm._directInactive = false
  vm._isMounted = false
  vm._isDestroyed = false
  vm._isBeingDestroyed = false

}

// 挂载组件
export function mountComponent (vm, el, hydrating) {
  vm.$el = el
  if (!vm.$options.render) {
    /*render函数不存在的时候创建一个空的VNode节点*/
    vm.$options.render = createEmptyVNode

  }
  // 触发deforeMount钩子
  callHook(vm, 'beforeMount')

  /*updateComponent作为Watcher对象的getter函数，用来依赖收集*/
  let updateComponent
   /* istanbul ignore if */
   // FIXME: vm._render函数用来生成虚拟dom，_update函数用来进行patch和更新视图，_render函数在初始化initRender中绑定
   updateComponent = () => {
    vm._update(vm._render(), hydrating)
   }

  /*FIXME:这里对该vm注册一个Watcher实例，Watcher的getter为updateComponent函数，用于触发所有渲染所需要用到的数据的getter，进行依赖收集，该Watcher实例会存在所有渲染所需数据的闭包Dep中*/
  vm._watcher = new Watcher(vm, updateComponent. noop)
  hydrating = false

  if (vm.$vnode == null) {
    // 标志位， 代表该组件已经挂载
    vm._isMounted = true
    // 调用mounted钩子函数
    callHook(vm, 'mounted')
  }

  return vm

}


/*调用钩子函数并且触发钩子事件*/
export function callHook (vm, hook) {
  const handlers = vm.$options[hook]
  if (handlers) {
    for (let i = 0; j = handlers.length, i < j; i++) {
      try {
        handlers[i].call(vm)
      } catch {
        console.error(`${hook} hook`)
      }
    }
  }
  if (vm._hasHookEvent) {
    vm.$emit('hook:' + hook)
  }
}
