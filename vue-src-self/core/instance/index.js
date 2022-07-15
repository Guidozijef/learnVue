import { stateMixin } from "./state"
import { initMixin } from "./init"
import { eventsMixin } from "../events"

function Vue (options) {
  //  初始化项目,这个  _init 函数看似乎没有定义，实际上实在initMixin函数里的得Vue原型上增加得方法
  this._init(options)
}

initMixin(Vue)
stateMixin(Vue)
eventsMixin(Vue)



export default Vue