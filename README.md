# CIA
## Centralized Inner Authority

### A flux/redux-like central dispatcher providing a single source of truth.

## Alterations from redux:
* Accepts opbject of methods instead of hard-coded `switch(action.type)` statements
* Returning state in a reducer is optional; defaults to existing state
* Action type is a string instead of a property, action data is stand-alone ex:`.dispatch("ADD",4)`
* Subscribe actions to typed events w/ `.on(type, fn)` and  `.dispatch("INCREMENT")` to fire action(s)
* `.subscribe(fn)` "all actions" to run after individual events - to render, backup, etc
* Name more than one event while subscribing ex:`.on("ADD,REM,CLR", fnRefresh)`
* Give more than one handler when subscribing to an event ex:`.on("ADD", [fnValidate, fnDraw])`
* Fire multiple events at once (ltr) from a single dispatch() call: `.dispatch("NEW,LOG,DRAW", uName)`
* Pass a single object of methods `to on()` and `off()` to manage reducers in bulk


## Additional Features:
* Built-in event stream `.history` and thus, a simple `.undo()` implementation (naive)
* Clear the `.history` with `.reset()`
* Halt further execution from within the event handlers by setting `this.returnValue=false;`
* Can dupe/alias/modify links at run-time and during execution - `on/off/subscribe/unsubscribe`
* Mark "all actions" for certain events, or a conditional boolean function `.subscribe(fn, FLAG/FN)`
* Set flags to fire future reducers immediately upon adding  `.flag(strType, value)`
* Push certain events to another instance with `.push(events, instance)`
* Pull certain events from another instance with `.pull(events, instance)`
* Reduce given event type(s) only the next time they happen with `.once(event, reducer)`
* Reduce a dependent event type only after another type with `.after(needyEvent, strWaitEvent, reducer)`
* Reduce an event only before another type has fired with `.before(event, strWaitEvent, reducer)`




## Internal Events
These events fire without explicit `dispatch()` calls to reflect the lifecyle and usage of the store.

| Action | arguments[0] | Description |
|----|----|----|
|`_INIT_` | 	`[]` 	| the store is ready to use ; fired once at boot	|
|`_SUBSCRIBE_` |	`[fnHandler, matcher]` |	a handler has subscribed to the "all event" pool |
|`_UNSUBSCRIBE_` | `[fnHandler]`	| a handler has un-subscribed to the "all event" pool |
|`_ON_` | `[strType, fnReducer]`	| a reducer has subscribed to a specific type of event |
|`_OFF_` | `[strType, fnReducer]`	| a reducer has subscribed to a specific type of event |
|`_MISSING_` | `[strType, data]` | a type without a known reducer was `dispatch()`ed |
|`_ERROR_` | `[objError, strType, data]` | an exception was encountered in a reducer |





## Example
```html
<html>
  <main id=main></main>
  <script src="http://danml.com/js/cia.js"></script>
<script>

var store = CIA({ // action reducers (state-adjusting pure functions)
	ADD: function(state){
	  return {count: state.count+1};
	},
	SET : function(state, e){
		return {count: e};
	},
	_INIT_: console.log.bind(console, "booting") // optional internal event
},{  // default application state:
	count: 0
});

// subscribe() to render on each change event:
store.subscribe(function render(state, blnForce) {
	main.innerHTML="<pre>"+JSON.stringify([state, store.history], null, "\t");
});	  

// make some state changes:
store.dispatch("ADD");  // state.count == 1
store.dispatch("ADD");  // state.count == 2
store.dispatch("SET", 12 );// state.count == 12
store.dispatch("ADD");  // state.count == 13
store.undo(1);  // state.count == 12

</script>
</html>
```
which  shows:
```js
[
	{
		"count": 12
	},
	[
		[
			"_INIT_",
			null
		],
		[
			"ADD",
			null
		],
		[
			"ADD",
			null
		],
		[
			"SET",
			12
		]
	]
]
```
