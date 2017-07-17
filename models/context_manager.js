const Context = require('./context');

class ContextManager {
  constructor() {
    this.contexts = {};
  }

  getContext(userId) {
    let context = this.contexts[userId];

    if(!context) {
      context = this.contexts[userId] = new Context();
    }

    return context;
  }

  setContext(userId, context) {
    this.contexts[userId] = context;
  }

  clearAll() {
    this.contexts = {};
  }
}

module.exports = ContextManager;
