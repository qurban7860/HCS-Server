const Counter = require("../models/counter");

class CounterController {
  static async getNextSequence(counterType) {
    // First, ensure counter document exists
    let counter = await Counter.findOne();
    
    if (!counter) {
        counter = await Counter.create({
            paddingSize: 5,
            isActive: true,
            counters: {
                serviceReport: 0,
                supportTicket: 0
            }
        });
    }

    // Then increment the specific counter
    const updatedCounter = await Counter.findOneAndUpdate(
        {}, 
        { $inc: { [`counters.${counterType}`]: 1 } },
        { new: true }
    );

    return updatedCounter.counters[counterType];
}

static async BackSequence(counterType) {
  // First, ensure counter document exists
  let counter = await Counter.findOne();
  
  if (!counter) {
      counter = await Counter.create({
          paddingSize: 5,
          isActive: true,
          counters: {
              serviceReport: 0,
              supportTicket: 0
          }
      });
  }

  // Then decrement the specific counter
  const updatedCounter = await Counter.findOneAndUpdate(
      {}, 
      { $inc: { [`counters.${counterType}`]: -1 } },
      { new: true }
  );
  return updatedCounter.counters[counterType];
}

  static async getCurrentSequence(counterType) {
    const counter =
      (await Counter.findOne()) ||
      (await Counter.create({
        paddingSize: 5,
        isActive: true,
        counters: {
          serviceReport: 0,
          supportTicket: 0
        },
      }));

    return counter.counters[counterType];
  }

  static async getPaddedCounterSequence(counterType) {
    const sequence = await this.getNextSequence(counterType);
    const counter = await Counter.findOne();
    return sequence.toString().padStart(counter.paddingSize, "0");
  }

  static async reversePaddedCounterSequence(counterType) {
    const sequence = await this.getNextSequence(counterType);
    const counter = await Counter.findOne();
    return sequence.toString().padStart(counter.paddingSize, "0");
  }
}

module.exports = CounterController;
