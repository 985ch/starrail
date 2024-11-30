const selectEquips = require('../utils/selectequips');
const findBestWords = require('../utils/bestwords');
const updateEquipsScore = require('../utils/upgrade');

worker.onMessage(res => {
  //console.log(res)
  switch(res.job) {
    case '自动配装':
      selectEquips(res.scheme, res.json);
      break;
    case '最佳词条':
      findBestWords(res.scheme, res.json);
      break;
    case '遗器强化':
      updateEquipsScore(res.scheme, res.json);
      break;
    default:
      break;
  }
})