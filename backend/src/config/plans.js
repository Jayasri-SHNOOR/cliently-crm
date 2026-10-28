const PLANS = {
    Starter: {
      name: 'Starter',
      description: 'For small teams getting started with a CRM',
      price: 999,
      billingCycle: 'Monthly',
      seats: 5
    },
    Professional: {
      name: 'Professional',
      description: 'Suitable for growing sales teams',
      price: 2999,
      billingCycle: 'Monthly',
      seats: 15
    },
    Enterprise: {
      name: 'Enterprise',
      description: 'For large sales organisations with advanced needs',
      price: 9999,
      billingCycle: 'Monthly',
      seats: 50
    }
  }
  
  module.exports = PLANS