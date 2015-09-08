var test = require('tape')
  , Exercise = require('../exercise')
  , filecheck = require('../filecheck')

test('exercise is a constructor function', function (t) {
  t.plan(1)

  t.equal(typeof Exercise, 'function')
})

test('exercise does not require new keyword invocation', function (t) {
  t.plan(2)

  var exercise1 = Exercise()
  var exercise2 = new Exercise()

  t.ok(exercise1 instanceof Exercise)
  t.ok(exercise2 instanceof Exercise)
})

test('provides use method', function (t) {
  t.plan(2)

  var exercise = new Exercise()

  t.equal(typeof exercise.use, 'function')
  t.equal(exercise.use(filecheck), exercise)
})
