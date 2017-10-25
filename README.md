[![NPM](https://nodei.co/npm/workshopper-exercise.png?foo)](https://nodei.co/npm/workshopper-exercise/)

## How to fail a test

In `/exercises/${EXERCISE_NAME}/exercise.js`:

```javascript
const exercise = require('workshopper-exercise')();

function sureToFail(errback) {
    exercise = this;
    exercise.emit('fail', 'told you it was going to fail');
    errback(null, false);
}

exercise.addVerifyProcessor(sureToFail);

module.exports = exercise;
```

This exercise will always fail, with the output:

```bash
 ✗ 

 told you it was going to fail

 # FAIL Your solution to ${EXERCISE_NAME} didn't pass. Try again!

─────────────────────────────────────────────────────────────────────────────

  » To print these instructions again, run: ${WORKSHOP_NAME} print             
  » To execute your program in a test environment, run: ${WORKSHOP_NAME} run                                                                          
    program.js                                                                
  » To verify your program, run: ${WORKSHOP_NAME} verify program.js            
  » For help run: ${WORKSHOP_NAME} help 
```
  
