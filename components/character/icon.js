const { charactersJson } = require('../../simulator/characters/index');
const D = require('../../simulator/data');
const { pick } = require('../../utils/util');
const { getImage } = require('../../utils/imgset');
Component({
  properties: {
    character: {
      type: Object,
      value: null,
    },
    index: {
      type: Number,
      value: 0,
    },
    mini: {
      type: Boolean,
      value: false,
    },
  },
  data: {
    baseData: {},
    charImage: '/images/base/nobody.png',
    damageImage: '/images/38px-火.png',
    jobImage: '/images/38px-毁灭.png',
    rarity: 'SSR',
    soul: 0,
    level: 1,
  },
  methods: {
  },
  observers: {
    character: function (character) {
      if(!character) {
        this.setData({ charImage: '/images/base/nobody.png', rarity:'Invaild'});
        return;
      };
      const base = charactersJson[character.name].data;
      const baseData = pick(base, ['job','type','rarity','image','tmp']);

      this.setData({
        baseData,
        charImage: getImage('char/' + baseData.image, (file)=>this.setData({ charImage: file })),
        damageImage: D.DamageTypeInfo[base.type].img,
        jobImage: D.JobTypeInfo[base.job].img,
        rarity: baseData.rarity,
        soul: character.soul,
        level: character.level,
      })
    }
  }
})