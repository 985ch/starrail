// 部位数组
const partList = ['head', 'hand', 'body', 'foot', 'link', 'ball'];
// 遗器主属性
const EquipMainData = {
  SSR: {
    atk: [ 56.448, 19.7568 ],
    hp: [ 112.896, 39.5136 ],
    atkRate: [ 6.9120, 2.41920005 ],
    hpRate: [ 6.9120, 2.41920005 ],
    defRate: [ 8.64, 3.024 ],
    criRate: [ 5.184, 1.8144 ],
    criDamage: [ 10.3680, 3.6288 ],
    healRate: [ 5.5296, 1.9354 ],
    hit: [ 6.9120, 2.41920005 ],
    speed: [ 4.032, 1.4 ],
    bonusFire: [ 6.2208, 2.1773 ],
    bonusIce: [ 6.2208, 2.1773 ],
    bonusWind: [ 6.2208, 2.1773 ],
    bonusThunder: [ 6.2208, 2.1773 ],
    bonusVoid: [ 6.2208, 2.1773 ],
    bonusQuantum: [ 6.2208, 2.1773 ],
    bonusPhysical: [ 6.2208, 2.1773 ],
    breakRate: [ 10.3680, 3.6288 ],
    enRate: [ 3.1104, 1.0886 ],
  },
  SR: {
    atk: [ 45.1584, 15.80544 ],
    hp: [ 90.3168, 31.61088 ],
    atkRate: [ 5.5296, 1.9354 ],
    hpRate: [ 5.5296, 1.9354 ],
    defRate: [ 6.9120, 2.4192 ],
    criRate: [ 4.1472, 1.4515 ],
    criDamage: [ 8.2944, 2.903 ],
    healRate: [ 4.4237, 1.5483 ],
    hit: [ 5.5296, 1.9354 ],
    speed: [ 3.2256, 1.1 ],
    bonusFire: [ 4.9766, 1.7418 ],
    bonusIce: [ 4.9766, 1.7418 ],
    bonusWind: [ 4.9766, 1.7418 ],
    bonusThunder: [ 4.9766, 1.7418 ],
    bonusVoid: [ 4.9766, 1.7418 ],
    bonusQuantum: [ 4.9766, 1.7418 ],
    bonusPhysical: [ 4.9766, 1.7418 ],
    breakRate: [ 8.2944, 2.903 ],
    enRate: [ 2.4883, 0.8709 ],
  },
};

// 遗器副属性
const EquipSubData = {
  SSR: {
    atk: [ 16.935019, 19.051896, 21.168773 ],
    hp: [ 33.870039, 38.103794, 42.337549],
    def: [ 16.935019, 19.051896, 21.168773 ],
    atkRate: [ 3.456, 3.8880, 4.3200],
    hpRate: [ 3.456, 3.8880, 4.3200],
    defRate: [ 4.32, 4.86, 5.4 ],
    criRate: [ 2.592, 2.9160, 3.2400],
    criDamage: [ 5.184, 5.8320, 6.4800],
    hit: [ 3.456, 3.8880, 4.3200],
    dodge: [ 3.456, 3.8880, 4.3200],
    speed: [ 2.0, 2.3, 2.6 ],
    breakRate: [ 5.184, 5.8320, 6.4800],
  },
  SR: {
    atk: [ 13.548, 15.2415, 16.9350],
    hp: [ 27.096, 30.4830, 33.8700],
    def: [ 13.548, 15.2415, 16.9350],
    atkRate: [ 2.7648, 3.1104, 3.4560],
    hpRate: [ 2.7648, 3.1104, 3.4560],
    defRate: [ 3.456, 3.8880, 4.3200],
    criRate: [ 2.0736, 2.3328, 2.5920],
    criDamage: [ 4.1472, 4.6656, 5.184],
    hit: [ 2.7648, 3.1104, 3.4560],
    dodge: [ 2.7648, 3.1104, 3.4560],
    speed: [ 1.6, 1.8, 2.0 ],
    breakRate: [ 4.1472, 4.6656, 5.184],
  },
};
// 遗器部位主属性词条
const EquipPartWords = {
  head: [{ k: 'hp', w: 100 }],
  hand: [{ k: 'atk', w: 100 }],
  body: [
    { k: 'hpRate', w: 20 }, { k: 'atkRate', w: 20 },  { k: 'defRate', w: 20 },
    { k: 'criRate', w: 10 }, { k: 'criDamage', w: 10 }, { k: 'healRate', w: 10 }, { k: 'hit', w: 100 /* 10 */ },
  ],
  foot: [{ k: 'hpRate', w: 30 }, { k: 'atkRate', w: 30 }, { k: 'defRate', w: 30 }, { k: 'speed', w: 100 /* 10 */ }],
  link: [{ k: 'breakRate', w: 15 }, { k: 'enRate', w: 5 }, { k: 'hpRate', w: 26.67 }, { k: 'atkRate', w: 26.67 }, { k: 'defRate', w: 100 /*26.67*/ }],
  ball: [
    { k: 'hpRate', w: 12.33 }, { k: 'atkRate', w: 12.33 }, { k: 'defRate', w: 12.33 },
    { k: 'bonusPhysical', w: 9 }, { k: 'bonusFire', w: 9 }, { k: 'bonusIce', w: 9 }, { k: 'bonusThunder', w: 9 },
    { k: 'bonusWind', w: 9 }, { k: 'bonusQuantum', w: 9 }, { k: 'bonusVoid', w: 100 /*9*/ }, 
  ],
};
// 遗器副属性词条
const EquipSubWeights = [
  { k: 'atk', w: 125, p: 0.005},
  { k: 'hp', w: 125, p: 0.005},
  { k: 'def', w: 125, p: 0.003},
  { k: 'atkRate', w: 125, p: 1},
  { k: 'hpRate', w: 125, p: 1},
  { k: 'defRate', w: 125, p: 0.5},
  { k: 'criRate', w: 75, p: 2},
  { k: 'criDamage', w: 75, p: 1},
  { k: 'hit', w: 100, p: 0.75 },
  { k: 'dodge', w: 100, p: 0.5 },
  { k: 'speed', w: 50, p: 4 },
  { k: 'breakRate', w: 100, p: 0.6 },
];
// 遗器副词条基准分数
const EquipSubScore = {
  atk: 0.005,
  def: 0.003,
  hp: 0.005,
  atkRate: 1,
  hpRate: 1,
  defRate: 0.5,
  criRate: 2,
  criDamage: 1,
  hit: 0.75,
  dodge: 0.5,
  speed: 3,
  breakRate: 0.5,
}

module.exports = {
  EquipMainData,
  EquipSubData,
  EquipPartWords,
  EquipSubWeights,
  EquipSubScore,
  partList,
}