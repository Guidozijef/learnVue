const templateReg = /\<template\>(.*)\<\/template\>/
const scriptReg = /\<script\>(.*)\<\/script\>/
const firstScriptReg = /export default \{ /

module.exports = function (source) {
    source = source.replace(/\n/g, '')
    let templateStr = source.match(templateReg)[1]
    let scriptStr = source.match(scriptReg)[1]
    let optionStr = scriptStr.replace(firstScriptReg, function ($1) {
        return $1  + ' template:' +  `'${templateStr}',`
    })

    // console.log(optionStr)

    // optionStr => 最终合成字符串
    /****
     * 
     * export default {
     *      template: <div><div>{{ count + 1 }}</div></div>,
     *      data () {
     *          return { count: 0 }
     *      },
     *      methods: {
     *          addCount (num) {
     *              count += num
     *          }
     *      }
     * }
     * 
     */

    return optionStr
}