const test = require('tape')
const sinon = require('sinon')
const path = require('path')

const Exercise = require('../exercise')
const filecheck = require('../filecheck')

const run = (exercise, file) => {
  return new Promise(function (resolve) {
    exercise.run([file], function () { resolve() })
  })
}

test('filecheck add setup to exercise', (t) => {
  let exercise = Exercise()
  t.plan(2)
  t.equal(exercise._setups.length, 0)
  exercise = filecheck(exercise)
  t.equal(exercise._setups.length, 1)
})

test('fail when no file submitted', (t) => {
  let exercise = Exercise()
  // exercise.__ is undefined here since come from workshopper.i18n
  exercise.__ = sinon.fake()
  t.plan(2)
  exercise = filecheck(exercise)
  exercise.run([], () => {})
  t.equal(exercise.__.callCount, 1)
  t.ok(exercise.__.calledWith('error.submission_no_file', { submission: '' }))
})

test('fail when wrong file submitted', async (t) => {
  let exercise = Exercise()
  exercise.__ = sinon.fake()
  t.plan(2)
  exercise = filecheck(exercise)
  const file = 'wrongFile.js'
  await run(exercise, file)
  const submission = path.resolve(file)
  t.equal(exercise.__.callCount, 1)
  t.ok(exercise.__.calledWith('error.submission_no_file', { submission }))
})

test('with submission different than file', async (t) => {
  let exercise = Exercise()
  exercise.__ = sinon.fake()
  t.plan(1)
  exercise = filecheck(exercise)
  const file = 'test'
  await run(exercise, file)
  const submission = path.resolve(file)
  t.ok(exercise.__.calledWith('error.submission_not_regular', { submission }))
})
