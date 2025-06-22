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
                supportTicket: 0,
                article: 0,
                project: 0,
                release: 0
            }
        });
    }
    // If specific counterType does not exist, initialize it to 0
    if (!(counterType in counter.counters)) {
      counter.counters[counterType] = 0;
      await counter.save();
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
              supportTicket: 0,
              article: 0,
              project: 0,
              release: 0

          }
      });
  }

  // If the specific counterType doesn't exist in the counters object, set it to 0
  if (!Object.prototype.hasOwnProperty.call(counter.counters, counterType)) {
    counter.counters[counterType] = 0;
    await counter.save();
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
          supportTicket: 0,
          article: 0,
          project: 0,
          release: 0
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
