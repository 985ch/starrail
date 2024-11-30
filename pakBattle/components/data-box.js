const { getImage } = require('../../utils/imgset');
const { charactersJson } = require('../../simulator/characters/index');
const { weaponsJson } = require('../../simulator/weapons/index');

Component({
  properties: {
    info: {
      type: Object,
      value: { members:[], key:'' },
      observer: function(info) {
        if(!info) return;
        const images = {};
        const rarities = {};
        for(let member of info.members) {
          const img = 'char/' + charactersJson[member.name].data.image;
          images[member.name] = getImage(img, file => this.setData({["images." + member.name]: file}));
          rarities[member.weapon] = weaponsJson[member.weapon]? weaponsJson[member.weapon].data.rarity : 'noWeapon';
        }
        this.setData({images, rarities})
      }
    },
    matched: {
      type: Boolean,
      value: false
    }
  },
  data: {
    images: {},
    rarities: {},
  },
  methods: {
    onDelete() {
      this.triggerEvent('delete', { key: this.data.info.key });
    },
    onLoad() {
      this.triggerEvent('load', this.data.info);
    }
  }
})