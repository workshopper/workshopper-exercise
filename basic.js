let exercise = require('./exercise')()
const filecheck = require('./filecheck')
const execute = require('./execute')
const comparestdout = require('./comparestdout')

exercise = filecheck(exercise)
exercise = execute(exercise)
exercise = comparestdout(exercise)

module.exports = exercise
