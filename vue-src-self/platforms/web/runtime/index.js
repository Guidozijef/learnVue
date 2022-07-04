import Vue from '../../../core/index'
import { mountComponent } from '../../../core/instance/lifecycle'
import { devtools, inBrowser, isChrome } from '../../../core/util/index'

import { query } from '../../web/util/index'
Vue.prototype.$mount = function (el, hydrating) {
  // inBrowser 表示浏览器环境， 获取DOM实例对象
  el = el && inBrowser ? query(el) : undefined
  // 挂载组件
  return mountComponent(this, el, hydrating)
}


export default Vue