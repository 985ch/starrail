const attrMap = {
  "HP": "hp",
  "ATK": "atk",
  "DEF": "def",
  "SPD": "speed",
  "HP_": "hpRate",
  "ATK_": "atkRate",
  "DEF_": "defRate",
  "CRIT DMG": "criDamage",
  "CRIT DMG_": "criDamage",
  "CRIT Rate": "criRate",
  "CRIT Rate_": "criRate",
  "Effect Hit Rate_": "hit",
  "Effect Hit Rate": "hit",
  "Effect RES_": "dodge",
  "Break Effect": "breakRate",
  "Break Effect_": "breakRate",
  "Outgoing Healing Boost": "healRate",
  "Energy Regeneration Rate": "enRate",
  "Fire DMG Boost": "bonusFire",
  "Wind DMG Boost": "bonusWind",
  "Lightning DMG Boost": "bonusThunder",
  "Ice DMG Boost": "bonusIce",
  "Quantum DMG Boost": "bonusQuantum",
  "Imaginary DMG Boost": "bonusVoid",
  "Physical DMG Boost": "bonusPhysical",
}
const partMap = {
  "Head": "head",
  "Hands": "hand",
  "Body": "body",
  "Feet": "foot",
  "Link Rope": "link",
  "Planar Sphere": "ball",
}

module.exports = {
  attrMap, partMap
}