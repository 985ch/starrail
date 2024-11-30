module.exports = {
  na_default: {
    rules:[[{t:"target",v:["selected"]}]]
  },
  na_breaker: (tag) =>({
    rules:[
      [{t:"target",v:["shield","min","gt",0,"yes"]},{t:"shield",v:["gt",0]},{t:"buff",v:["t","tag",tag,"gt",0]}],
      [{t:"target",v:["selected"]}]
    ]
  }),
  na_buff_noT:(key)=>({
    rules:[[{t:"target",v:["buff","key",key,"no","no"]}]]
  }),
  na_buff_yesT:(key)=>({
    rules:[
      [{t:"target",v:["buff","key",key,"yes","no"]}]
    ]
  }),
  ns_always: {
    disable:false,
    rules:[],
  },
  ns_aoe_c: {
    disable:false,
    rules:[[{t:"enCount",v:["gt",1]}],[{t:"sp",v:["gt",1]}]]
  },
  ns_buff_noT: (key)=>({
    disable:false,
    rules:[[{t:"target",v:["selected"]},{t:"buff",v:["t","key",key,"no"]}]]
  }),
  ns_buff_noS: (key)=>({
    disable:false,
    rules:[
      [{t:"buff",v:["s","key",key,"no",1]}]
    ]
  }),
  ns_sp_gt:(n) =>({
    disable:false,
    rules:[[{t:"target",v:["selected"]},{t:"sp",v:["gt",n]}]]
  }),
  ns_heal_target: {
    disable:false,
    rules:[
      [{t:"target",v:["hp","minp","gt",0]},{t:"hp",v:["t","percent","lt",40]}],
      [{t:"target",v:["hp","min","gt",0]},{t:"hp",v:["t","absolute","lt",1500]}]
    ]
  },
  us_always: {
    disable:false,
    rules:[],
  },
  us_buff_tag: (tag, n=0)=>({
    disable:false,
    rules:[
      [{t:"buff",v:["t","tag",tag,"gt",n]}],
    ]
  }),
  us_heal_aoe: {
    disable:false,
    rules:[
      [{t:"hp",v:["t","percent","lt",40]}],
      [{t:"hp",v:["t","absolute","lt",1500]}]
    ]
  },
  us_buff_noT:(key)=>({
    disable:false,
    rules:[[{t:"target",v:["selected"]},{t:"buff",v:["t","key",key,"no",0]}]]
  }),
  us_buff_hasT:(key, n)=>({
    disable:false,
    rules:[
      [{t:"target",v:["selected"]},{t:"buff",v:["t","key",key,"yes",n]}],
    ]
  }),
}