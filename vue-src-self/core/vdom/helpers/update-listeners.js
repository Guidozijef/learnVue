

import { cached, isUndef } from 'shared/util'


const normalizeEvent = cached(name => {
  const passive = name.charAt(0) === '&'
  name = passive ? name.slice(1) : name
  const once = name.charAt(0) === '~' // Prefixed last, checked first
  name = once ? name.slice(1) : name
  const capture = name.charAt(0) === '!'
  name = capture ? name.slice(1) : name
  return {
    name,
    once,
    capture,
    passive
  }
})




// 更新监听事件
export function updateListeners (on, oldOn, add, remove, vm) {
  let name, cur, old, event

  // 遍历新事件的所有方法
  for (name in on) {
    cur = on[name]
    old = oldOn[name]

    /*取得并去除事件的~、!、&等前缀*/
    event = normalizeEvent(name)

    /*isUndef用于判断传入对象不等于undefined或者null*/
    if (isUndef(cur)) {
      // 新方法不存在抛出异常
      console.log(`Invalid handler for event "${event.name}": got ` + String(cur),)
    } else if (isUndef(old)) {
      if (isUndef(cur.fns)) {
        // createFnInvoker 返回一个函数，该函数的作用是将生成时的fns执行，如果fns是数组，则便利执行他的每一项
        cur = on[name] = createFnInvoker(cur)
      }

      add(event.name, cur, event.once, event.capture, event.passive)

    } else if (cur !== old) {
      old.fns = cur
      on[name] = old
    }

  }

  // 移除所有的旧事件
  for (name in oldOn) {
    if (isUndef(on[name])) {
      event = normalizeEvent(name)
      remove(event.name, oldOn[name], event.capture)
    }
  }
}