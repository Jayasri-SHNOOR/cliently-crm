const Counter = require('../models/Counter')
async function nextSequence(name) {
  const counter = await Counter.findOneAndUpdate(
    {_id: name},
    {$inc: { seq: 1}},
    {upsert: true, returnDocument: 'after'}
  ).lean()

  return counter.seq
}
module.exports = nextSequence