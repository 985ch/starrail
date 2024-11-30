Component({
  properties: {
    json: {
      type: Object,
      value: [],
    },
    title: {
      type: String,
      value: '人工选择方案',
    },
    simple: {
      type: Boolean,
      value: false,
    },
    score: {
      type: Number,
      value: 0,
    }
  },
  data: {
    partList: [ ['head', 'hand', 'body', 'foot'], ['link', 'ball']],
  },
  methods: {
    onDelete() { this.triggerEvent('delete')},
    onSelect() { this.triggerEvent('select')},
  },
})