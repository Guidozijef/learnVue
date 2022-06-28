/*initMixin就做了一件事情，在Vue的原型上增加_init方法，构造Vue实例的时候会调用这个_init方法来初始化Vue实例*/
import { initProxy } from './proxy'
import { initState } from './state'

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
    
    /*
    初始化props、methods、data、computed与watch
    这个方法里面就是劫持data数据进行监听了
    */
    initState(vm)

  }
}