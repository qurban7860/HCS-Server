const { EventEmitter } = require('events');

class EventBus extends EventEmitter {
    constructor() {
        super();
    }

  // custom utility methods can be added if needed
}

const eventBus = new EventBus();

module.exports = eventBus;
