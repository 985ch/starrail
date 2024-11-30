Component({
  properties: {
  },
  data: {
    round: 0,
    turn: 2,
    firstBonus: 0,
    turnBonus: 0,

    minSpeed: 134,
    actions: [2,3,4,6,7,8],
  },
  methods: {
    changeValue(e) {
      this.setData({[e.currentTarget.dataset.key]:e.detail.value},this.updateData);
    },
    updateData() {
      let { round, turn, firstBonus, turnBonus, actions } = this.data;
      const t = (round + 1) * 100 + 50;
      const base = t/(turn - firstBonus*0.01 - (turn-1)*turnBonus*0.01);
      const speed = Math.ceil(10000/base);
      const baseS = 10000/speed;
      const a = baseS*firstBonus*0.01 - baseS*turnBonus*0.01;
      const b = baseS - baseS*turnBonus*0.01;
      for(let i=0; i<6; i++) {
        actions[i] = Math.floor(((i+1)*100+50 + a)/b);
      }
      this.setData({ minSpeed: speed, actions });
    }
  }
})