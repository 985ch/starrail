const { conditions } = require('./ai_rule');
function checkConditions(cd) {
  for(let key in cd) {
    const cur = cd[key];
    if(cur.type==='number') {
      if(cur.default<cur.values[0] || cur.default>cur.values[1]) {
        console.log(key, cur.type);
      }
    } else {
      if(!cur.default || !cur.values || cur.values.find(v=>v[0]===cur.default)==null) {
        console.log(key, cur.type);
      }
    }
  }
}

checkConditions(conditions);