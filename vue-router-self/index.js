let Vue
import RouterLink from './link'
import RouterView from './view'
class VueRouter {
  constructor (options = {}) {
    this.$options = options
    this.current = window.location.hash.slice(1) || '/'
    Vue.util.defineReactive(this, 'matched', [])
    
    window.addEventListener('hashchange', this.onHashChange.bind(this))
    window.addEventListener('load', this.onHashChange.bind(this))

    this.match()

  }
  match (routes) {
    if (!routes) {
      routes = this.$options.routes
    }
    for (const route of routes) {
      // 匹配首页
      if(route.path === '/' || this.current === '/') {
        this.matched.push(route)
        return 
      }
      let pathArr = this.current.split('/')
       // 匹配其他。 /about/foo -> 需要匹配两个 /about 以及 /about/foo
      if (route.path !== '/' && pathArr.includes(route.path.slice(1))) {
        this.matched.push(route)
        if (route.children && route.children.length) {
          this.match(route.children)
        }
      }
    }

  }
  onHashChange () {
    this.current = window.location.hash.slice(1) || '/'
    this.matched = []
    this.match()
  }
}


VueRouter.install = function (_Vue) {
  Vue = _Vue
  Vue.mixin({
    beforeCreate() {
      if (!this.$options.router) {
        Vue.prototype.$router = this.$options.router
      }
    },
  })

  Vue.component('router-link', RouterLink)
  Vue.component('router-view', RouterView)
}