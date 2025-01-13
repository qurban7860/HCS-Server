const Counter = require('../models/counter');

class CounterController {
    
    static async getNextSequence(counterType) {
        const updatedCounter = await Counter.findOneAndUpdate(
            {}, 
            {
                $setOnInsert: {
                    counters: {
                        serviceReport: 0,
                        document: 0,
                        customer: 0
                    },
                    paddingSize: 5,
                    isActive: true
                },
                $inc: { [`counters.${counterType}`]: 1 }
            },
            { 
                upsert: true,
                new: true 
            }
        );

        return updatedCounter.counters[counterType];
    }

    static async getCurrentSequence(counterType) {
        const counter = await Counter.findOneAndUpdate(
            {},
            {
                $setOnInsert: {
                    counters: {
                        serviceReport: 0,
                        document: 0,
                        customer: 0
                    },
                    paddingSize: 5,
                    isActive: true
                }
            },
            { 
                upsert: true,
                new: true 
            }
        );

        return counter.counters[counterType];
    }

    static async getPaddedCounterSequence(counterType) {
        const sequence = await this.getNextSequence(counterType);
        const counter = await Counter.findOne();
        return sequence.toString().padStart(counter.paddingSize, '0');
    }
}

module.exports = CounterController;
