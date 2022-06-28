import { remove } from '../util'

let uid = 0

export default class Dep {
    constructor () {
      this.id = uid++
      this.subs = [] // 用来存储观察者
    }

    // 添加一个观察者对象
    addSub (sub) {
      this.subs.push(sub)
    }

    /*移除一个观察者对象*/
    removeSub (sub) {
      remove(this.subs, sub)
    }

    /*依赖收集，当存在Dep.target的时候添加观察者对象*/
    depend () {
      if (Dep.target) {
        Dep.target.addDep(this)
      }
    }

    /*通知所有订阅者*/
    notify () {
      const subs = this.subs.sclie()
      for (let i = 0, l = subs.length; i < l; i++) {
        subs[i].update()  // 执行观察者的update方法进行更新
      }
    }



}

// the current target watcher being evaluated.
// this is globally unique because there could be only one
// watcher being evaluated at any time.

/*依赖收集完需要将Dep.target设为null，防止后面重复添加依赖。*/
Dep.target = null
const targetStack = []

/*将watcher观察者实例设置给Dep.target，用以依赖收集。同时将该实例存入target栈中*/
export function pushTarget (_target) {
  if (Dep.target) targetStack.push(Dep.target)
  Dep.target = _target
}

/*将观察者实例从target栈中取出并设置给Dep.target*/
export function popTarget () {
  Dep.target = targetStack.pop()
}