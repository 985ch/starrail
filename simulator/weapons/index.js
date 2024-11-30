'use strict';

// 修正配置
const fixJson = {
  '幽隧':'幽邃',
  '如泥酣睡':'如泥酣眠',
}
// 武器类一览
const allWeapons = [
  require('./ssr_hunt_xzzl'),
  require('./ssr_hunt_decsm'),
  require('./ssr_hunt_ccsw'),
  require('./ssr_hunt_fnxf'),
  require('./ssr_hunt_yysz'),
  require('./ssr_hunt_rnhs'),
  require('./ssr_hunt_xhxh'),
  require('./sr_hunt_hyrysx'),
  require('./sr_hunt_zhdyj'),
  require('./sr_hunt_cscs'),
  require('./sr_hunt_dggzb'),
  require('./sr_hunt_cfym'),
  require('./sr_hunt_lj'),
  require('./sr_hunt_wycm'),
  require('./r_hunt_lx'),
  require('./r_hunt_fd'),
  require('./r_hunt_xk'),

  require('./ssr_des_lrsqw'),
  require('./ssr_des_mghc'),
  require('./ssr_des_cswj'),
  require('./ssr_des_bygml'),
  require('./ssr_des_xsyl'),
  require('./ssr_des_dbldby'),
  require('./ssr_des_wkqd'),
  require('./sr_des_ylsl'),
  require('./sr_des_mjyx'),
  require('./sr_des_zhdyc'),
  require('./sr_des_sbsj'),
  require('./sr_des_zltx'),
  require('./sr_des_wckt'),
  require('./sr_des_mmsx'),
  require('./sr_des_ysdhyn'),
  require('./r_des_lp'),
  require('./r_des_tq'),
  require('./r_des_jm'),

  require('./ssr_eru_llpm'),
  require('./ssr_eru_xwwj'),
  require('./ssr_eru_bxdys'),
  require('./ssr_eru_lzyd'),
  require('./ssr_eru_fxzq'),
  require('./ssr_eru_yhtd'),
  require('./sr_eru_yhlx'),
  require('./sr_eru_xyjm'),
  require('./sr_eru_tc'),
  require('./sr_eru_hpyr'),
  require('./sr_eru_zc'),
  require('./sr_eru_sj'),
  require('./sr_eru_wdds'),
  require('./r_eru_ly'),
  require('./r_eru_zk'),
  require('./r_eru_rj'),

  require('./ssr_nih_wsct'),
  require('./ssr_nih_lxda'),
  require('./ssr_nih_cssg'),
  require('./ssr_nih_gddly'),
  require('./ssr_nih_zxdd'),
  require('./ssr_nih_yyzx'),
  require('./ssr_nih_sjzm'),
  require('./sr_nih_wbmw'),
  require('./sr_nih_hxky'),
  require('./sr_nih_xsrw'),
  require('./sr_nih_hzbsy'),
  require('./sr_nih_ycjh'),
  require('./sr_nih_hhyq'),
  require('./sr_nih_lwdsx'),
  require('./sr_nih_waysy'),
  require('./r_nih_yh'),
  require('./r_nih_ys'),
  require('./r_nih_ny'),

  require('./ssr_har_lgyc'),
  require('./ssr_har_yxch'),
  require('./ssr_har_jzgw'),
  require('./ssr_har_zdjx'),
  require('./sr_har_fhdz'),
  require('./sr_har_mrlt'),
  require('./sr_har_mmxz'),
  require('./sr_har_lycy'),
  require('./sr_har_xxxh'),
  require('./sr_har_www'),
  require('./sr_har_gwwl'),
  require('./sr_har_jyzdmy'),
  require('./r_har_lq'),
  require('./r_har_qs'),
  require('./r_har_th'),

  require('./ssr_pre_mybgp'),
  require('./ssr_pre_bssy'),
  require('./ssr_pre_zsdsj'),
  require('./ssr_pre_jydzl'),
  require('./sr_pre_ych'),
  require('./sr_pre_myzx'),
  require('./sr_pre_lddxz'),
  require('./sr_pre_ysdyt'),
  require('./sr_pre_scqs'),
  require('./sr_pre_zjswl'),
  require('./sr_pre_wmsdh'),
  require('./r_pre_hp'),
  require('./r_pre_sy'),
  require('./r_pre_kj'),

  require('./ssr_abu_wxrg'),
  require('./ssr_abu_jhy'),
  require('./ssr_abu_gdhx'),
  require('./ssr_abu_sjbj'),
  require('./sr_abu_hwwz'),
  require('./sr_abu_wzze'),
  require('./sr_abu_csqh'),
  require('./sr_abu_tyzxq'),
  require('./sr_abu_shdh'),
  require('./sr_abu_djjh'),
  require('./sr_abu_nybmc'),
  require('./r_abu_wr'),
  require('./r_abu_jg'),
  require('./r_abu_fx'),
]

// 武器分类数据
const weaponsData = [
  {
    text: '巡猎',
    data:[],
  },
  {
    text: '毁灭',
    data:[]
  },
  {
    text: '智识',
    data:[]
  },
  {
    text: '虚无',
    data:[]
  },
  {
    text: '同谐',
    data:[]
  },
  {
    text: '存护',
    data:[]
  },
  {
    text: '丰饶',
    data:[]
  },
]

// 武器数据JSON版
const weaponsJson = {}
for(let i=0; i < allWeapons.length; i++){
  const weapon = allWeapons[i];
  weaponsJson[weapon.data.name] = weapon;
  const typeIdx = weaponsData.findIndex(o => o.text===weapon.data.job);
  if(!weapon.data.tmp)weaponsData[typeIdx].data.push({ name: weapon.data.name, rarity: weapon.data.rarity});
}

function createWeapon(character, { name, star, level, upgraded }) {
  name = fixJson[name] || name;
  if(weaponsJson[name]) {
    return new weaponsJson[name].weapon(character, star, level, upgraded);
  }
  return null;
}

module.exports = {
  createWeapon,
  weaponsData,
  weaponsJson,
}