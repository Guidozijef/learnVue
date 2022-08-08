

export let keyMap = new Map()

export let eventMap = new Map()

export function addKey(node, keyInfo) {
    keyMap.set(node, keyInfo)
}


export function getKey(node) {
    return keyMap.get(node)
}

export function addEvent(node, eventInfo) {
    eventMap.set(node, eventInfo)
}

export function getEvent(node) {
    return eventMap.get(node)
}


export function updated (vm, key, value) {
    for (const [node, keyInfo] of keyMap) {
        let { key: zKey, expression } = keyInfo
        if (zKey === key) {
            let strFn = new Function('vm', `with (vm) { return ${expression} }`)
            node.textContent = strFn(vm)
        }
    }
}



