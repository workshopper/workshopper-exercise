const path   = require('path')
    , assert = require('assert')

function requireExercise(exercise) {
  exercise.addSetup(requireModules)
  exercise.addRunProcessor(logResults)
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

function logResults(callback) {
  this.submissionArgs.forEach(function(input) {
    console.log(this.submissionModule(input))
  }, this)

  process.nextTick(callback)
}

function verifySubmission(callback) {
  this.submissionArgs.forEach(function(input, index) {
    assert.equal(this.submissionModule(this.submissionArgs[index]), this.solutionModule(this.solutionArgs[index]))
  }, this)

  process.nextTick(callback)
}

module.exports = requireExercise
