const { getImage } = require('../../utils/imgset');
const { charactersJson } = require('../../simulator/characters/index');
const { weaponsJson } = require('../../simulator/weapons/index');

Component({
  properties: {
    info: {
      type: Object,
      value: { info:[], group: null },
      observer: function(info) {
        const images = {};
        const rarities = {};
        let damage = 0;
        for(let member of info.info) {
          const img = 'char/' + charactersJson[member.name].data.image;
          images[member.name] = getImage(img, file => this.setData({["images." + member.name]: file}));
          rarities[member.weapon] = weaponsJson[member.weapon]? weaponsJson[member.weapon].data.rarity : 'noWeapon';
          damage += member.rDmg;
        }
        this.setData({images, rarities, damage: Math.floor(damage)})
      }
    },
    removable: {
      type: Boolean,
      value: false
    }
  },
  data: {
    images: {},
    rarities: {},
    damage: 0,
  },
  methods: {
    onDelete() {
      this.triggerEvent('delete', { id: this.data.info._id });
    },
    onShare() {
      wx.setClipboardData({
        data: this.data.info._id,
        success: () => {
          wx.showToast({
            title: '已复制队伍ID',
          });
        },
      });
    },
    onDownload() {
      this.triggerEvent('download', { id: this.data.info._id });
    },
    onUpload() {
      this.triggerEvent('upload');
    }
  }
})