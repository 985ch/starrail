'use strict';

const allSets = [
  require('./cri4_xz'),
  require('./speed4_sd'),
  require('./break4_tq'),
  require('./atk4_yl'),
  require('./break4_zbj'),
  require('./damage4_xq'),
  require('./aa4_dg'),
  require('./atk4_xq'),
  require('./speed4_xs'),
  require('./hp4_sz'),
  require('./quantum4_tc'),
  require('./block4_tw'),
  require('./atk4_kqs'),
  require('./break4_gd'),
  require('./fire4_hj'),
  require('./ice4_lr'),
  require('./wind4_xy'),
  require('./thunder4_yd'),
  require('./physical4_qw'),
  require('./void4_ftk'),
  require('./def4_sqs'),
  require('./heal4_gk'),

  require('./cridmg2_jly'),
  require('./en2_lsk'),
  require('./aa2_bl'),
  require('./speed2_jh'),
  require('./atk2_gtsg'),
  require('./cri2_cgny'),
  require('./atk2_glm'),
  require('./en2_pnkn'),
  require('./cri2_jjc'),
  require('./dodge2_lg'),
  require('./cri2_sest'),
  require('./def2_blbg'),
  require('./hit2_gs'),
  require('./cridmg2_cfj'),
  require('./en2_wwk'),
  require('./break2_tly'),
  require('./hp2_xz'),
  require('./atk2_fyz'),
];
const setsData = [[],[]];
const setNames = [[],[]];
const setsClass = {};

for(let item of allSets) {
  const info = item.getDesc();
  setsClass[info.name] = item;
  if(!info.tmp){
    setsData[info.set4 ? 0: 1].push(info);
    setNames[info.set4 ? 0: 1].push(info.name);
  }
}

const partText = {
  head: "头部",
  hand: "手部",
  body: "身体",
  foot: "腿部",
  link: "连结绳",
  ball: "位面球",
}

module.exports = {
  setsData,
  setNames,
  setsClass,
  partText,
}