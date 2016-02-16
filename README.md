# CIA
## Centralized Inner Authority

### A flux/redux-like central dispatcher providing a single source of truth.

## Alterations from redux:
* accepts opbject of methods instead of hard-coded `switch(action.type)` statements
* returning state in a reducer is optional; defaults to existing state
* has built-in event stream `.history` and thus, a simple `.undo()` implementation (naive)
* action type is a string instead of a property, action data is stand-alone ex:`.dispatch("ADD",4)`
* subscribe actions to typed events w/ `.on(type, fn)` and  `.dispatch("INCREMENT")` to fire action(s)
* `.subscribe(fn)` "all actions" to run after individual events - to render, backup, etc
* Name more than one event while subscribing ex:`.on("ADD,REM,CLR", fnRefresh)`
* Give more than one handler when subscribing to an event ex:`.on("ADD", [fnValidate, fnDraw])`
* Fire multiple events at once (ltr) from a single dispatch() call: `.dispatch("NEW,LOG,DRAW", uName)`
* Halt further execution from within the event handlers by setting `this.returnValue=false;`
* Can dupe/alias/modify links at run-time and during execution - `on/off/subscribe/unsubscribe`
* Mark "all actions" for certain events, or a conditional boolean function `.subscribe(fn, FLAG/FN)`


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
