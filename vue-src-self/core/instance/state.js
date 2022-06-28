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
import { proxy } from '../../../vue-src/core/instance/state'

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


  }


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