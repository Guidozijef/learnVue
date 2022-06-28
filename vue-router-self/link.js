export default {

  props: {
    to: {
      require: true,
      type: String,
      default: ''
    }
  },
  render (h) {
    return h('a', { attrs: { herf: '#' + this.to } }, [this.$slots.default]) 
  }
}