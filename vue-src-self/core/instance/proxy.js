const hasProxy = typeof Proxy !== 'undefined' && Proxy.toString().match(/native code/)

export function initProxy (vm) {
  if (hasProxy) {
    vm._renderProxy = new Proxy (vm, {
      get (target, key, receiver) { // 这里得target其实就是vm，key为被获取得得属性
        return target[key]
      }
    })
  } else {
    vm._rednerProxy = vm
  }
  
}