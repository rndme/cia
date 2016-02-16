# CIA
## Centralized Inner Authority

### A flux/redux-like central dispatcher providing a single source of truth.

## Alterations from redux:
* accepts opbject of methods instead of hard-coded `switch(action.type)` statements
* action type is a string instead of a property, action data is stand-alone ex:`.dispatch("ADD",4)`
* subscribe actions to typed events w/ `.on(type, fn)` and  `.dispatch("INCREMENT")` to fire action(s)
* `.subscribe(fn)` "all actions" to run after individual events - to render, backup, etc
* has built-in event stream `.history` and thus, a simple `.undo()` implementation (naive)
* Name more than one event while subscribing ex:`.on("ADD,REM,CLR", fnRefresh)`
* Give more than one handler when subscribing to an event ex:`.on("ADD", [fnValidate, fnDraw])`
* Halt further execution from within the event handlers by setting `this.returnValue=false;`
* Can dupe/alias/modify links at run-time and during execution - `on/off/subscribe/unsubscribe`
* Mark "all actions" for certain events, or a conditional boolean function `.subscribe(fn, FLAG/FN)`
* Fire multiple events at once (ltr) from a single dispatch() call: `.dispatch("new,log,bu", uName)`
