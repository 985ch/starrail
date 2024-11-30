'use strict';

class WordSearcher {
  constructor(list) {
    this.finder = {};
    this.isEmpty = true;
    if(list)list.forEach(item => this.addWord(item[0], item[1]))
  }
  addWord(word, value = null) {
    this.isEmpty = false;
    word = word.trim();
    let node = this.finder;
    for (let i = 0; i < word.length; i++) {
      let char = word[i];
      if (!node[char]) {
        node[char] = {};
      }
      node = node[char];
    }
    node.end = true;
    node.value = value;
  }
  check(text, idx = 0) {
    let node = this.finder;
    for (let i = idx; i < text.length; i++) {
      let char = text[i];
      if (!node[char]) {
        if(!node.end) {
          return null;
        }
        return { word: text.substring(idx, i), value: node.value };
      }
      node = node[char];
    }
    if(!node.end) return null;
    return { word: text, value: node.value }
  }
  findFirst(text, idx = 0) {
    const nodes = [];
    const root = this.finder;
    for(let i = idx; i < text.length; i++) {
      let char = text[i];
      for(let j = 0; j < nodes.length; j++) {
        const info = nodes[j];
        if(info.node.end) {
          info.end = i;
        }
        if(!info.node[char]) {
          if(info.end >= info.start) {
            return {
              word: text.substring(info.start, info.end),
              value: info.node.value
            };
          } else {
            nodes.splice(j, 1);
            j--;
          }
        } else {
          info.node = info.node[char];
        }
      }
      if(root[char]) {
        nodes.push({ node: root[char], start: i, end: root[char].end? i + 1: -1 });
      }
    }
    for(let k = 0; k < nodes.length; k++) {
      if(nodes[k].node.end ) {
        return {
          word: text.substring(nodes[k].start),
          value: nodes[k].node.value
        };
      }
    }
    return null;
  }
}

module.exports = WordSearcher;