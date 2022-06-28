export default {
  name: 'RouterView',
  render (h) {
    // 标记当前组件为routerView组件 只有这个组件需要根据路径渲染不同的组件
    this.$vnode.data.routerView  = true
    // 为了获取当前字段的层级
    let depth = 0
    let parent = this.$parent
    while(parent) {
      const vnodeData = parent.$vnode ? parent.$vnode.data : {}
      if (vnodeData.routerView) {
        depth++
      }
      parent = parent.$parent
    }


    let matched = this.$router.matched
    let component = null
    const route = matched[depth]
    if (route) {
      component = route.component
    }
    return h(component)
  }
}