var exercise      = require('./exercise')()
  , filecheck     = require('./filecheck')
  , execute       = require('./execute')
  , comparestdout = require('./comparestdout')

exercise = filecheck(exercise)
exercise = execute(exercise)
exercise = comparestdout(exercise)


module.exports = exercise
