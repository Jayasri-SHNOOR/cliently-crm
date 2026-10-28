function notFound(req, res){
    res.status(404).json({message: `Route not found: ${req.method} ${req.originalUrl}`})
  }

  function errorHandler(err, req, res, next){
    if(err.statusCode){
      return res.status(err.statusCode).json({message: err.message})
    }
    if(err.name === 'ValidationError'){
      const errors = {}
      Object.values(err.errors).forEach((e) => {
        errors[e.path] = e.message
      })
      return res.status(400).json({message: 'Validation failed', errors})
    }
    if(err.name === 'CastError'){
      return res.status(400).json({message: `Invalid ${err.path}: ${err.value}`})
    }
    if(err.code === 11000){
      const field = Object.keys(err.keyValue || {})[0]
      return res.status(409).json({message: `${field} already exists`})
    }
    if(err.type === 'entity.parse.failed'){
      return res.status(400).json({message: 'Invalid JSON in request body'})
    }
    console.error(err)
    res.status(500).json({message: 'Internal server error'})
  }
  
module.exports = {notFound, errorHandler}