import {
  bind,
  noop,
  hasOwn,
  isReserved,
  validateProp,
  isPlainObject,
  defineReactive
} from '../util/index'

import { observerState, observe } from '../observer'
import { defineComputed, proxy } from '../../../vue-src/core/instance/state'
import Watcher from '../observer/watcher'
import Dep from '../observer/dep'
import { set, del } from '../observer'

export function initState (vm) {
  vm._watchers = [] // _watchers存放订阅者实例
  const opts = vm.$options

  // 初始化props
  if (opts.props) initProps(vm, opts.props)

  // 初始化方法
  if (opts.methods) initMethods(vm, opts.methods)

  // 初始化data数据
  if (opts.data) {
    initData(vm)
  } else {
    // 该组件没有data的时候绑定一个空对象
    observe(vm._data = {}, true /* asRootData */)
  }

  // 初始化computed
  if (opts.computed) initComputed(vm, opts.computed)
  // 初始化watchers
  if (opts.watch) initWatch(vm, opts.watch)


}

// 初始化 data 数据
function initData (vm) {
  let data = vm.$options.data
  data = vm._data = typeof data === 'function' ? getData(data, vm) : data || {}


  /*对对象类型进行严格检查，只有当对象是纯javascript对象的时候返回true*/
  if (!isPlainObject(data)) {
    data = {}
    console.log('data functions should return an object')
  }

  // proxy data on instance
  /*遍历data对象*/
  const keys = Object.keys(data)
  const props = vm.$options.props
  let i = keys.length

  //遍历data中的数据
  while (i--) {
    /*保证data中的key不与props中的key重复，props优先，如果有冲突会产生warning*/
    if (props && hasOwn(props, keys[i])) {
      console.log(`The data property "${keys[i]}" is already declared as a prop. ` +
      `Use prop default value instead.`)
    } else if (!isReserved(keys[i])) { // isReserved 检查data中的属性是否以 $ 或者 _ 开头，防止跟vue自己的属性重复

      /*这里是我们前面讲过的代理，将data上面的属性代理到了vm实例上*/
      proxy(vm, `_data`, keys[i])

    }
  }

  // FIXME: 从这里开始我们要进行observer了，开始对数据进行绑定，这里有尤大大的注释asRootData，这步作为根数据，下面会进行递归observe进行对深层对象的绑定。*/
  observe(data, true /* asRootData */)

}


const sharedPropertyDefinition = {
  enumerable: true,
  configurable: true,
  get: noop,
  set: noop
}

// 这个c属性被代理到a对象上面了，我们直接a.c会返回34
// let a = { b: { c: 34 } }
// Object.defineProperty(a, 'c', {
//   get () {
//       return a.b.c
//   }
// })

/*通过proxy函数将_data（或者_props等）上面的数据代理到vm上，这样就可以用app.text代替app._data.text了。*/
export function proxy (tagrget, sourceKey, key) {
  sharedPropertyDefinition.get = function proxyGetter () {
    return tagrget[sourceKey][key]
  }
  sharedPropertyDefinition.set = function proxySetter (val) {
    this[sourceKey][key] = val
  }
  // TODO: 这里的target就是vm实例，key就是需要获取的数据，这个代理就是当获取我们直接 vm.title 属性的时候，实际上返回的是 vm._data.title，这样一代理我们就可以直接获取title
  Object.defineProperty(tagrget, key, sharedPropertyDefinition)
}


// 获取data数据
function getData (data, vm) {
  try {
    return data.call(vm)
  } catch (e) {
    console.error(e)
    return {}
  }
}

// 初始化props，
// TODO: 这里的 propsOptions 指的是props在vue文件中定义的props接受的类型，而 vm.$options.propsData 指的是父组件传进来的参数数据
function initProps (vm, propsOptions) {
  const propsData = vm.$options.propsData || {}
  const props = vm._props = {}

  //  _propKeys 用来缓存属性的key，使得将来能直接使用数组的索引值来更新props来替代动态的枚举对象
  const keys = vm.$options._propKeys = []
  // 根据$parent是否存在来判断当前是否是根节点
  const isRoot = !vm.$parent
  // root instance props should be converted
  /*根结点会给shouldConvert赋true，根结点的props应该被转换*/
  observerState.shouldConvert = isRoot
  for (const key in propsOptions) {
    /*props的key值存入keys（_propKeys）中*/
    keys.push(key)
    // 校验props，不存在用默认值进行替换，类型为Boolean则声明true或者false，当使用default中的默认值的时候会将默认值的副本进行 oberserve
    const value = validateProp(key, propsOptions, propsData, vm)

    defineReactive(props, key, value)

    // 如果属性不在实例上就进行代理，props也需要代理到vm上面，因为我们取props也是直接vm.属性
    if (!(key in vm)) {
      proxy(vm, `_props`, key)
    }
  }
  observerState.shouldConvert = true
}




// 初始化方法
function initMethods (vm, methods) {
  const props = vm.$options.props
  for (const key in methods) {
    // 定义方法定义得不对
    if (typeof methods[key] !== 'function') {
      console.error(`Method "${key}" has type "${typeof methods[
        key
      ]}" in the component definition. ` +
        `Did you reference the function correctly?`)
    }
    /* 方法名与props名称冲突报出warning*/
    if (props && hasOwn(props, key)) {
      console.error(`method "${key}" has already been defined as a prop.`)
    }

     /* noop = () => {} 空函数
      * TODO:如果在为null的时候写上空方法，有值时候将上下文替换成vm, 将当前的这些方法添加到实例vm上面 */
    vm[key] = typeof methods[key] !== 'function' ? noop : bind(methods[key], vm)

  }
}

const computedWatcherOptions = { lazy: true }

// 初始化computed
function initComputed (vm, computed) {
  const watchers = vm._computedWatchers = Object.create(null)

  // 循环computed属性，为每一个computed创建一个watcher实例进行依赖收集
  for (const key in computed) {
    const userDef = computed[key]

     /*
      计算属性可能是一个function，也有可能设置了get以及set的对象。
      可以参考 https://cn.vuejs.org/v2/guide/computed.html#计算-setter
    */
    
    let getter = typeof userDef === 'function' ? userDef : userDef.get
    // 如果没有get函数赋值一个空函数
    if (getter === undefined) {
      console.log(`No getter function has been defined for computed property "${key}".`)
      getter = noop
    }
    // create internal watcher for the computed property.
    /*
      为计算属性创建一个内部的监视器Watcher，保存在vm实例的_computedWatchers中
      这里的computedWatcherOptions参数传递了一个lazy为true，会使得watch实例的dirty为true
    */
   
    watchers[key] = new Watcher(vm, getter, noop, computedWatcherOptions)

    // component-defined computed properties are already defined on the
    // component prototype. We only need to define computed properties defined
    // at instantiation here.
    /*组件正在定义的计算属性已经定义在现有组件的原型上则不会进行重复定义*/

    if (!(key in vm)) {
      // 定义计算属性
      defineComputed(vm, key, userDef)
    } else if (process.env.NODE_ENV !== 'production') {
      /*如果计算属性与已定义的data或者props中的名称冲突则发出warning*/
      if (key in vm.$data) {
        console.log(`The computed property "${key}" is already defined in data.`, vm)
      } else if (vm.$options.props && key in vm.$options.props) {
        console.log(`The computed property "${key}" is already defined as a prop.`, vm)
      }
    }

  }
}



// 定义计算属性
export function defineComputed (target, key, userDef) {
  if (typeof userDef === 'function') {
    // 创建计算属性的getter
    sharedPropertyDefinition.get = createComputedGetter(key)

    /*
      当userDef是一个function的时候是不需要setter的，所以这边给它设置成了空函数。
      因为计算属性默认是一个function，只设置getter。
      当需要设置setter的时候，会将计算属性设置成一个对象。参考：https://cn.vuejs.org/v2/guide/computed.html#计算-setter
    */
    sharedPropertyDefinition.set = noop

  } else {

    /*get不存在则直接给空函数，如果存在则查看是否有缓存cache，没有依旧赋值get，有的话使用createComputedGetter创建*/
    sharedPropertyDefinition.get = userDef.get ? (userDef.catch !== false ? createComputedGetter(key) : userDef.get) : noop

    /*如果有设置set方法则直接使用，否则赋值空函数*/
    sharedPropertyDefinition.set = userDef.set ? userDef.set : noop

  }

  /*defineProperty上getter与setter，因为计算属性不在data里，也就没有在实例上， 所以需要把当前自定义的计算属性代理到vm实例上 */
  Object.defineProperty(target, key, sharedPropertyDefinition)
}


// 创建一个计算属性的getter
function createComputedGetter (key) {
  return function computedGetter () {
    // 取出当前属性的监听者watcher
    const watcher = this._computedWatchers && this._computedWatchers[key]

    if (watcher) {
       /*实际是脏检查，在计算属性中的依赖发生改变的时候dirty会变成true，在get的时候重新计算计算属性的输出最新的值*/
      if (watcher.dirty) {
        watcher.evaluate()
      }
      // 依赖收集
      if (Dep.target) {
        watcher.depend()
      }

      return watcher.value

    }
  }
}


/*初始化watchers*/
function initWatch (vm, watch) {
  for (const key in watch) {
    const handler = watch[key]
    // 数组则遍历进行createWatcher
    if (Array.isArray(handler)) {
      for (let i = 0; i < handler.length; i++) {
        createWatcher(vm, key, handler[i])
      }
    } else {
      createWatcher(vm, key, handler)
    }
  }
}

/*创建一个观察者Watcher*/
function createWatcher (vm, key, handler) {
  let options
  /*对对象类型进行严格检查，只有当对象是纯javascript对象的时候返回true*/
  if (isPlainObject(handler)) {
    /*
      这里是当watch的写法是这样的时候
      watch: {
          test: {
              handler: function () {},
              deep: true
          }
      }
    */
    options = handler
    handler = handler.handler

  }
  if (typeof handler === 'string') {
    /*
        当然，也可以直接使用vm中methods的方法
    */
   handler = vm[handler]
  }
  /*用$watch方法创建一个watch来观察该对象的变化*/
  vm.$watch(key, handler, options)

}



export function stateMixin (Vue) {
  const dataDef = {}
  dataDef.get = function () { return this._data }
  const propsDef = {}
  propsDef.get = function () { return this._props }

  Object.defineProperty(Vue.prototype, '$data', dataDef)
  Object.defineProperty(Vue.prototype, '$props', propsDef)


  /*
    TODO:https://cn.vuejs.org/v2/api/#vm-set
    用以将data之外的对象绑定成响应式的
  */
  Vue.prototype.$set = set

    /*
    TODO:https://cn.vuejs.org/v2/api/#vm-delete
    与set对立，解除绑定
  */
  Vue.prototype.$delete = del


  Vue.prototype.$watch = function (expOrFn, cb, options) {
    const vm = this
    options = options || {}
    options.user = true
    const watcher = new Watcher(vm, expOrFn, cb, options)
    // 如果有immediate参数的时候会立即执行
    if (options.immediate) {
      cb.call(vm, watcher.value)
    }

    // 返回一个取消观察函数，用来停止触发回调
    return function unwatchFn () {
      // 将自身从所有依赖收集订阅列表删除
      watcher.teardown()
    }
  }








  
}
