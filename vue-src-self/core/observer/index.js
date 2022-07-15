/**
 * By default, when a reactive property is set, the new value is
 * also converted to become reactive. However when passing down props,
 * we don't want to force conversion because the value may be a nested value
 * under a frozen data structure. Converting it would defeat the optimization.
 */

import Dep from "./dep";
import { def, hasProto, hasChanged } from "../util";

/*默认情况下，当一个无效的属性被设置时，新的值也会被转换成无效的。不管怎样当传递props时，我们不需要进行强制转换*/
export const observerState = {
  shouldConvert: true,
  isSettingProps: false,
};

/**
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
 */
/*
 尝试创建一个Observer实例（__ob__），如果成功创建Observer实例则返回新的Observer实例，如果已有Observer实例则返回现有的Observer实例。
 */

export function observe(value, asRootData) {
  if (!isObject(value)) return;
  let ob;
  /*这里用__ob__这个属性来判断是否已经有Observer实例，如果没有Observer实例则会新建一个Observer实例并赋值给__ob__这个属性，如果已有Observer实例则直接返回该Observer实例*/
  if (hasOwn(value, "__ob__") && value.__ob__ instanceof Observer) {
    ob = value.__ob__;
  } else if (
    /*
      这里的判断是为了确保value是单纯的对象，而不是函数或者是Regexp等情况。
      而且该对象在shouldConvert的时候才会进行Observer。这是一个标识位，避免重复对value进行Observer
      Object.isExtensible() 方法判断一个对象是否是可扩展的（是否可以在它上面添加新的属性）
    */
    observerState.shouldConvert &&
    (Array.isArray(value) || (isPlainObject(value) && Object.isExtensible(value) && !value.isVue))
  ) {
    ob = new Observer(value);
  }

  if (asRootData && ob) {
    /*如果是跟节点数据则计数，后面Observer中的observe的asRootData非true*/
    ob.vmCount++;
  }
  return ob;
}

/*Github:https://github.com/answershuto*/
/**
 * Observer class that are attached to each observed
 * object. Once attached, the observer converts target
 * object's property keys into getter/setters that
 * collect dependencies and dispatches updates.
 */
/*
    每个被观察的对象被附加上观察者实例，一旦被添加，观察者将为目标对象加上getter\setter属性，进行依赖收集以及调度更新。
*/

export class Observer {
  constructor(value) {
    this.value = value;
    this.dep = new Dep(); // 在Observer实例上添加依赖收集器Dep，方便实例进行依赖收集
    this.vmCount = 0;

    def(value, "__ob__", this); // 这里就是为 value 添加属性 __ob__ 值为 当前 this 就是Observer实例，证明已经被实例化了，后面会根据__ob__属性先判断是否被实例化了

    // 判断是对象还是数组分别进行代理
    if (Array.isArray(value)) {
      const augment = hasProto ? ProtoAugment : copyAugment;

      
    } else {
      // 如果是对象则直接walk进行绑定
      this.walk(value);
    }
  }

  /**
   * Walk through each property and convert them into
   * getter/setters. This method should only be called when
   * value type is Object.
   */
  /*
      遍历每一个对象并且在它们上面绑定getter与setter。这个方法只有在value的类型是对象的时候才能被调用
   */
  walk(obj) {
    const keys = Object.keys(obj)
    /*walk方法会遍历对象的每一个属性进行defineReactive绑定*/
    for (let i = 0; i < keys[i].length; i++) {
      defineReactive(obj, keys[i], obj[keys[i]])
    }
  }
}

// TODO: 封装这个方法主要就是用来数据劫持、在get里面进行收集依赖
export function defineReactive (obj, key, val, customSetter) {
  /*在闭包中定义一个dep对象,用于收集监听者*/
  const dep = new Dep()

  // Object.getOwnPropertyDescriptor 方法返回指定对象上一个自有属性对应的属性描述符。（自有属性指的是直接赋予该对象的属性，不需要从原型链上进行查找的属性
  const property = Object.getOwnPropertyDescriptor(obj, key)
  if (property && property.configurable === false) {
     return 
  }

  // /*如果之前该对象已经预设了getter以及setter函数则将其取出来，新定义的getter/setter中会将其执行，保证不会覆盖之前已经定义的getter/setter。*/
  const getter = property && property.get
  const setter = property && property.set

  /*这个设置的val也得进行递归劫持，对象的子对象递归进行observe并返回子节点的Observer对象*/
  let childOb = observe(val) // childOb 为实例
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      const value = getter ? getter.call(obj) : val
      if (Dep.target) {
        // 进行依赖收集调用 dep.depend 方法收集的是 Dep.target ，Dep.target 指向的是观察者 watcher ，其实收集的依赖就是当前属性的观察者
        dep.depend()

        if (childOb) {
          /*子对象进行依赖收集，其实就是将同一个watcher观察者实例放进了两个depend中，一个是正在本身闭包中的depend，另一个是子元素的depend， 因为这个Dep.target只有一个属性，这个时候的依赖都是收集的同一个值*/
          childOb.dep.depend()
        }
        if (Array.isArray(value)) {

        }
      }

      return value
    },
    set: function reactiveSetter (newVal) {
      /*通过getter方法获取当前值，与新值进行比较，一致则不需要执行下面的操作*/
      const value = getter ? getter.call(obj) : val
      if (!hasChanged(value, newVal)) { // 比较新、旧这两个值是否相等，如果相等不做任何处理
        return 
      }
      // 如果有自定义的setter，则执行
      /* eslint-enable no-self-compare */
      if (process.env.NODE_ENV !== 'production' && customSetter) {
        customSetter()
      }

      if (setter) {
        /*如果原本对象拥有setter方法则执行setter*/
        setter.call(obj, newVal)
      } else {
        val = newVal
      }

      /*新设置的值还是需要重新进行observe，保证数据响应式*/
      childOb = observe(newVal)
      /*dep对象通知所有的观察者*/
      dep.notify()
    }
  })

}


// TODO: 这个方法就是$set方法
export function set(target, key, val) {
  // 如果传入数组则在指定位置插入val
  if (Array.isArray(target) && typeof key === 'number') {
    target.length = Math.max(target.length, key)
    /*因为数组不需要进行响应式处理，数组会修改七个Array原型上的方法来进行响应式处理*/
    target.splice(key, 1, val) // 这个splice方法就是重写的方法，所以不需要进行相应式处理了
    return val
  }

  // 如果是一个对象， 并且已经存在了这个key则直接返回
  if (hasOwn(target, key)) {
    target[key] = val
    return val
  }

  // 获得target的Oberver实例
  const ob = target.__ob__

  if (target._isVue || (ob && ob.vmCount)) {
    console.error('Avoid adding reactive properties to a Vue instance or its root $data ' +
    'at runtime - declare it upfront in the data option.')
    return val
  }

  if (!ob) {
    target[key] = val
    return val
  }

  // 为对象defineProperty上在变化时通知的属性，这里的ob.value 就是指的target
  defineReactive(ob.value, key, val)
  ob.dep.notify()
  return val
}


// 这个是$del方法
export function del (target, key) {
  if (Array.isArray(target) && typeof key === 'number') {
    target.splice(key, 1)
    return 
  }

  const ob = target.__ob__
  if (target._isVue || (ob && ob.vmCount)) {
    console.error('Avoid deleting properties on a Vue instance or its root $data ' +
    '- just set it to null.')
    return 
  }

  if (!hasOwn(target, key)) {
    return 
  }

  delete target[key]

  if (!ob) return 
  ob.dep.notify()
}



