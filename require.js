const path   = require('path')
    , assert = require('assert')

function requireExercise(exercise) {
  exercise.addSetup(requireModules)
  exercise.addProcessor(logResults)
  exercise.addVerifyProcessor(verifySubmission)
  return exercise
}

function requireModules(mode, callback) {
  this.submission = this.args[0]

  if (!this.solution)
    this.solution = path.join(this.dir, './solution/index.js')
 
  if (!this.submissionArgs)
    this.submissionArgs = []

  if (!this.solutionArgs)
    this.solutionArgs = []


  this.submissionModule = require(process.cwd() + '/' + this.submission)
  this.solutionModule = require(this.solution)

  process.nextTick(callback)
}

function logResults(mode, callback) {
  if (mode !== 'run') return process.nextTick(callback)
  this.submissionArgs.forEach(function(input) {
    console.log(this.submissionModule(input))
  }, this)

  process.nextTick(callback)
}

function verifySubmission(callback) {
  var success = true
  this.submissionArgs.forEach(function(input, index) {
    var actual = this.submissionModule(this.submissionArgs[index])
    var expected = this.solutionModule(this.solutionArgs[index])
    var equal = deepEqual(actual, expected)
    this.emit(equal ? 'pass' : 'fail', actual + ' == ' + expected)
    success = success && equal
  }, this)
  callback(null, success)
}

function deepEqual(a, b){
  try {
    assert.deepEqual(a, b)
    return true
  } catch(e) {
    return false
  }
}

module.exports = requireExercise
