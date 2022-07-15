import { resolveSlots } from "../../../vue-src/core/instance/render-helpers/resolve-slots";
import { createElement } from "../../../vue-src/core/vdom/create-element";
import { emptyObject } from "../util";

// 初始化render函数

export function initRender (vm) {
  vm._vnode = null
  vm._staticTrees = null
  const parentVnode = vm.$vnode = vm.$options._parentVnode //  父树中的占位符节点
  const renderContext = parentVnode && parentVnode.renderContext
  vm.$slots = resolveSlots(vm.$options._renderChildren, renderContext)
  vm.$scopedSlots = emptyObject // 创建一个冻结的空对象


  /*将createElement函数绑定到该实例上，该vm存在闭包中，不可修改，vm实例则固定。这样我们就可以得到正确的上下文渲染*/
  vm._c = (a, b, c, d) => createElement(vm, a, b, c, d, false)

  /*常规方法被用于公共版本，被用来作为用户界面的渲染方法*/
  vm.$createElement = (a, b, c, d) => createElement(vm, a, b, c, d, true)
  
}