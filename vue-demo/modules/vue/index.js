const reg = /\{\{(.*)\}\}/
const eventReg = /^(\w*)(?:\((.*)\))*$/

import { addEvent, addKey, updated } from '../../shared/utils'

export default {
    createApp
}

export function createApp(options) {
    let vm = {  $options: options }
    vm.mount = mount
    return vm
}


function mount (el) {
    const { $options: { data, template, methods } } = this // 此处的this就是createApp返回的vm
    let $el = document.querySelector(el)
    $el.innerHTML = template
    let $data = typeof data === 'function' ? data() : data
    this.$data = $data
    for (const key in $data) {
        if (Object.hasOwnProperty.call($data, key)) {
            Object.defineProperty(this, key, {
                get () {
                    return $data[key]
                },
                set (newVal) {
                    $data[key] = newVal
                    this.$data[key] = newVal
                    updated(this, key, newVal)
                }
            })
        }
    }

    let nodes = $el.children[0].querySelectorAll('*')  // 获取所有的真实节点DOM
    this.$node = nodes

    for(let i = 0; i < nodes.length; i++) {
        const node = nodes[i]
        let text = node.textContent.trim()
        if (text && reg.test(text)) {
            let expression = text.match(reg)[1].trim()
            let key = Object.keys($data).find(key => expression.includes(key))
            addKey(node, { key, expression })
            let strFn = new Function('vm', `with (vm) { return ${expression} }`)
            node.textContent = strFn(this)
        }

        let event = node.getAttribute(`@click`)
        if (event) {
            let arr = event.match(eventReg)
            let params = []
            if (arr[2]) {
                if (arr[2].includes("'") || arr[2].includes('"')) {
                    params = arr[2].split(',')
                } else {
                    params = arr[2].split(',').map(m => Number(m))
                }
            }
            addEvent(node, { event: arr[1], params })
            node.addEventListener('click', methods[arr[1]].bind(this, ...params))
        }
    }






    console.log(this)
    

}