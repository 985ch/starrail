const { charactersJson } = require('../../simulator/characters/index');
Component({
  properties: {
    character: {
      type: Object,
      value: null,
    },
    staticData: {
      type: Boolean,
      value: false,
    },
    tid: { type: Number, value: 0 },
    cid: { type: Number, value: 1 },
  },
  data: {
    attrList:[
      [
        ['hp', 'baseHp'],
        ['atk', 'baseAtk'],
        ['def', 'baseDef'],
        ['speed', 'baseSpeed'],
        ['criRate'],
        ['criDamage'],
      ],
      [
        ['bonusPhysical', 'bonusAll'],
        ['bonusNA'],
        ['bonusNS'],
        ['breakRate'],
        ['enRate'],
        ['hit'],
        ['dodge'],
        ['healRate'],
        ['shieldRate'],
      ],
    ],
    charName: '',
  },
  lifetimes: {
  },
  methods: {
  },
  observers: {
    character(v){
      if(!v)return;
      const base = charactersJson[v.name].data;
      const damages = base.damages || ['NS','US']; 
      this.setData({
        charName: v.name,
        ['attrList[1][0]']: ['bonus'+base.type, 'bonusAll'],
        ['attrList[1][1]']: ['bonus'+damages[0]],
        ['attrList[1][2]']: ['bonus'+damages[1]],
      });
    }
  }
})
