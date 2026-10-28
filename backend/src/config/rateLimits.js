const MINUTE = 60 * 1000
module.exports = {
  ipShield:{
    windowMs: 1 * MINUTE,
    limit: 300,
    message: 'Too many requests from your network.'
  },
  auth:{
    windowMs: 10 * MINUTE,
    limit: 10,
    countSuccessful: false,
    message: 'Too many attempts.'
  },
  user:{
    capacity: 10,
    refillPerSecond: 1,
    defaultCost: 1,
    costs:{
      GET: 1,
      POST: 3,
      PUT: 3,
      PATCH: 3,
      DELETE: 3
    },
    message: 'You are making requests too quickly.'
  }
  
}