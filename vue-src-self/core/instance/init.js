import { initEvents } from './events'
import { callHook, initLifecycle } from './lifecycle'
import { initProxy } from './proxy'
import { initState } from './state'
import { initRender } from './render'


/*initMixin就做了一件事情，在Vue的原型上增加_init方法，构造Vue实例的时候会调用这个_init方法来初始化Vue实例*/
export function initMixin (Vue) {
  Vue.prototype._init = function (options) {
    const vm = this
    /*一个防止vm实例自身被观察的标志位*/
    vm._isVue = true
    // 将配置项绑定到实例上
    vm.$options = options
    // 代理数据
    initProxy(vm)
    vm._self = vm

    // 初始化生命周期，挂载一些需要使用的属性
    initLifecycle(vm)
    
    // 初始化事件
    initEvents(vm)

    // 初始化render函数， 挂载_c(createElement)函数，挂载插槽信息到vm实例上
    initRender(vm)

    // 调用beforeCreate钩子函数并且触发beforeCreate钩子事件
    callHook(vm, 'beforeCreate')

    // 初始化inject
    initInjections(vm) // resolve injections before data/props

    /*
    初始化props、methods、data、computed与watch
    这个方法里面就是劫持data数据进行监听了
    */
    initState(vm)

    // 初始化provide
    initProvide(vm) // resolve provide after data/props

    /*调用created钩子函数并且触发created钩子事件*/
    callHook(vm, 'created')


    if (vm.$options.el) {
      // 挂载组件
      vm.$mount(vm.$options.el)
    }

  }
}