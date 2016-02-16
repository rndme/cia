# CIA
## Centralized Inner Authority

### A flux/dedux-like central dispatcher providing a single source of truth.

## Improvements to redux:
* subscribes actions to typed events - raise “INCREMENT” to fire increment action(s)
* subscribe "all actions" that run after individual events - to render, backup, etc
* has built-in event stream history and thus, a simple undo() implementation (naive)
* Name more than one event while subscribing
* Give more than one handler when subscribing to an event
* Prevent the universal handlers from firing after the event: `this.returnValue=false;`
* Can dupe/alias/modify links at run-time and during execution
* Mark "all actions" for certain events, or a conditional function `.subscribe(fn, FLAG/FN)`
* Fire multiple events at once from a single dispatch() call: `.dispatch("new,log,bu", uName)`
