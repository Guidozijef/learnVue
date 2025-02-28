import { pushTarget, popTarget } from "./dep";
import { parsePath, remove, isObject } from "../util";
import { queueWatcher } from "./scheduler";


let uid = 0
export default class Watcher {
  constructor(vm, expOrFn, cb, options) {
    this.vm = vm;
    vm._watchers.push(this);
    if (options) {
      this.deep = !!options.deep;
      this.user = !!options.user;
      this.lazy = !!options.lazy;
      this.sync = !!options.sync;
    } else {
      this.deep = this.user = this.lazy = this.sync = false;
    }
    this.cb = cb;
    this.id = ++uid; // uid for batching
    this.active = true;
    this.dirty = this.lazy; // for lazy watchers
    this.deps = [];
    this.newDeps = [];
    this.depIds = new Set();
    this.newDepIds = new Set();
    this.expression = expOrFn.toString();

    // parse expression for getter
    /*把表达式expOrFn解析成getter*/
    if (typeof expOrFn === "function") {
      this.getter = expOrFn;
    } else {
      this.getter = parsePath(expOrFn);
      if (!this.getter) {
        this.getter = function () {};
        console.error(`Failed watching path: "${expOrFn}" ` + "Watcher only accepts simple dot-delimited paths. " + "For full control, use a function instead.");
      }
    }

    // FIXME: 实例化 Watcher 会触发get方方法，而get方法会获取一些属性然后进行依赖收集，此时Dep.target会进行赋值
    this.value = this.lazy ? undefined : this.get();
  }

  /**
   * Evaluate the getter, and re-collect dependencies.
   */
  /*获得getter的值并且重新进行依赖收集*/
  get() {
    /*TODO:将自身watcher观察者实例设置给Dep.target，用以依赖收集。*/
    pushTarget(this);
    let value;
    const vm = this.vm;

    /*
      FIXME: 执行了getter操作，看似执行了渲染操作，其实是执行了依赖收集。
      在将Dep.target设置为自生观察者实例以后，执行getter操作。
      譬如说现在的的data中可能有a、b、c三个数据，getter渲染需要依赖a跟c，
      那么在执行getter的时候就会触发a跟c两个数据的getter函数，
      在getter函数中即可判断Dep.target是否存在然后完成依赖收集，
      将该观察者对象放入闭包中的Dep的subs中去。
    */

    if (this.user) {
      try {
        value = this.getter.call(vm, vm);
      } catch (e) {
        console.error(e, vm, `getter for watcher "${this.expression}"`);
      }
    } else {
      value = this.getter.call(vm, vm);
    }

    // "touch" every property so they are all tracked as
    // dependencies for deep watching
    /*如果存在deep，则触发每个深层对象的依赖，追踪其变化*/
    if (this.deep) {
      /*递归每一个对象或者数组，触发它们的getter，使得对象或数组的每一个成员都被依赖收集，形成一个“深（deep）”依赖关系*/
      traverse(value);
    }

    /*将观察者实例从target栈中取出并设置给Dep.target*/
    popTarget();
    // 清理依赖收集
    this.cleanupDeps();

    return value;
  }

  /**
   * Add a dependency to this directive.
   */
  /*添加一个依赖关系到Deps集合中*/
  addDeps(dep) {
    const id = dep.id;
    if (!this.newDepIds.has(id)) {
      this.newDeps.add(id);
      this.newDeps.push(dep);
      if (!this.depIds.has(id)) {
        dep.addSub(this);
      }
    }
  }

  /**
   * Clean up for dependency collection.
   */
  /*清理依赖收集*/
  cleanupDeps() {
    /*移除所有观察者对象*/
    let i = this.deps.length
    while (i--) {
      const dep = this.deps[i]
      if (!this.newDepIds.has(dep.id)) {
        dep.removeSub(this)
      }
    }
    let tmp = this.depIds
    this.depIds = this.newDepIds
    this.newDepIds = tmp
    this.newDepIds.clear()
    tmp = this.deps
    this.deps = this.newDeps
    this.newDeps = tmp
    this.newDeps.length = 0
  }

  /**
   * Subscriber interface.
   * Will be called when a dependency changes.
   */
  /*
      调度者接口，当依赖发生改变的时候进行回调。
   */
  update() {
    if (this.lazy) {
      this.dirty = true;    // TODO: dirty为true就代表当前的依赖发生了改变，在取值的时候需要获取新的值，也就是所谓的脏值
    } else if (this.sync) {
      /*如果是同步，则执行run直接渲染视图*/
      this.run();
    } else {
      /*异步推送到观察者队列中，下一个tick时调用。*/
      queueWatcher(this);
    }
  }

  /**
   * Scheduler job interface.
   * Will be called by the scheduler.
   */
   /*
      调度者工作接口，将被调度者回调。
    */
  run () {
    if (this.active) {
       /* get操作在获取value本身也会执行getter从而调用update更新视图 */
      const value = this.get()

      // Deep watchers and watchers on Object/Arrays should fire even
        // when the value is the same, because the value may
        // have mutated.
        /*
            即便值相同，拥有Deep属性的观察者以及在对象／数组上的观察者应该被触发更新，因为它们的值可能发生改变。
        */
      if (value !== this.value || isObject(value) || this.deep) {
        const oldValue = this.value
        // set new value /*设置新的值*/
        this.value = value

        // 触发回调函数
        if (this.user) {
          try {
            this.cb.call(this.vm, value, oldValue)
          } catch (e) {
            console.error(e, this.vm, `callback for watcher "${this.expression}"`)
          }
        } else {
          this.cb.call(this.vm, value, oldValue)
        }
      }
    }
  }


  
  /**
   * Evaluate the value of the watcher.
   * This only gets called for lazy watchers.
   */
   /*获取最新的观察者的值*/
  evaluate () {
    this.value = this.get()
    this.dirty = false
  }

    /**
   * Depend on all deps collected by this watcher.
   */
   /*收集该watcher的所有deps依赖*/
  depend () {
    let i = this.deps.length
    while (i--) {
      this.deps[i].depend()
    }
  }



  // 将自身从所有依赖收集订阅列表删除
  teardown () {
    if (this.active) {
      /*从vm实例的观察者列表中将自身移除，由于该操作比较耗费资源，所以如果vm实例正在被销毁则跳过该步骤。*/
      if (!this.vm._isBeingDestroyed) {
        remove(this.vm._watchers, this)
      }

      let i = this.deps.length
      while (i--) {
        this.deps[i].removeSub(this)
      }

      this.active = false
    }
  }
}

/**
 * Recursively traverse an object to evoke all converted
 * getters, so that every nested property inside the object
 * is collected as a "deep" dependency.
 */
 /*递归每一个对象或者数组，触发它们的getter，使得对象或数组的每一个成员都被依赖收集，形成一个“深（deep）”依赖关系*/

 /*用来存放Oberser实例等id，避免重复读取*/
const seenObjects = new Set()
function traverse (val) {
  seenObjects.clear()
  _traverse(val, seenObjects)
}


function _traverse (val, seen) {
  let i, keys
  const isA = Array.isArray(val)
  // 非对象或数组或是不可扩展对象直接return，不需要收集深层依赖关心，
  if ((!isA && !isObject(val)) || !Object.isExtensible(val)) {
    return 
  }

  if (val.__ob__) {
    /*避免重复读取*/
    const depId = val.__ob__.dep.id
    if (seen.has(depId)) {
      return
    }
    seen.add(depId)
  }

  /*递归对象及数组*/
  if (isA) {
    i = val.length
    while (i--) _traverse(val[i], seen)
  } else {
    keys = Object.keys(val)
    i = keys.length
    while (i--) _traverse(val[keys[i]], seen)
  }


}
