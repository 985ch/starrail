const parts = {
  head:"head",
  hands: "hand",
  body: "body",
  feet: "foot",
  planarSphere:"ball",
  linkRope:"link",
}

const tags = {
  hp:["hp", 1],
  hp_:["hpRate", 100],
  atk:["atk",1],
  atk_:["atkRate",100],
  def:["def",1],
  def_:["defRate",100],
  spd:["speed", 1],
  critRate: ["criRate",100],
  critDMG: ["criDamage",100],
  break: ["breakRate", 100],
  eff: ["hit", 100],
  effRes: ["dodge",100],
  heal:["healRate",100],
  enerRegen:["enRate",100],
  quantumDmg:["bonusQuantum",100],
  windDmg:["bonusWind",100],
  fireDmg:["bonusFire",100],
  lightningDmg:["bonusThunder",100],
  physicalDmg:["bonusPhysical",100],
  iceDmg:["bonusIce",100],
  imaginaryDmg:["bonusVoid",100],
}

const sets = {
  PasserbyofWanderingCloud: '云无留迹的过客',
  MusketeerofWildWheat:'野穗伴行的快枪手',
  KnightofPurityPalace: '净庭教宗的圣骑士',
  HunterofGlacialForest: '密林卧雪的猎人',
  ChampionofStreetwiseBoxing: '街头出身的拳王',
  GuardofWutheringSnow: '戍卫风雪的铁卫',
  FiresmithofLavaForging: '熔岩锻铸的火匠',
  GeniusofBrilliantStars: '繁星璀璨的天才',
  BandofSizzlingThunder: '激奏雷电的乐队',
  EagleofTwilightLine: '晨昏交界的翔鹰',
  ThiefofShootingMeteor: '流星追迹的怪盗',
  WastelanderofBanditryDesert: '盗匪荒漠的废土客',
  LongevousDisciple: '宝命长存的莳者',
  MessengerTraversingHackerspace: '骇域漫游的信使',
  TheAshblazingGrandDuke: '毁烬焚骨的大公',
  PrisonerinDeepConfinement: '幽锁深牢的系囚',
  PioneerDiverofDeadWaters: '死水深潜的先驱',
  WatchmakerMasterofDreamMachinations: '机心戏梦的钟表匠',
  SpaceSealingStation: '太空封印站',
  FleetoftheAgeless: '不老者的仙舟',
  PanCosmicCommercialEnterprise: '泛银河商业公司',
  BelobogoftheArchitects: '筑城者的贝洛伯格',
  CelestialDifferentiator: '星体差分机',
  InertSalsotto: '停转的萨尔索图',
  TaliaKingdomofBanditry: '盗贼公国塔利亚',
  SprightlyVonwacq: '生命的翁瓦克',
  RutilantArena: '繁星竞技场',
  BrokenKeel: '折断的龙骨',
  FirmamentFrontlineGlamoth: '苍穹战线格拉默',
  PenaconyLandoftheDreams: '梦想之地匹诺康尼',
  SigoniatheUnclaimedDesolation: '无主荒星茨冈尼亚',
  IzumoGenseiandTakamaDivineRealm: '出云显世与高天神国',
  IronCavalryAgainsttheScourge:'荡除蠹灾的铁骑',
  TheWindSoaringValorous:'风举云飞的勇烈',
  DuranDynastyofRunningWolves:'奔狼的都蓝王朝',
  ForgeoftheKalpagniLantern:'劫火莲灯铸炼宫',
}

module.exports = {
  parts,
  tags,
  sets,
}