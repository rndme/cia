# CIA
## Centralized Inner Authority

### A flux/redux-like central dispatcher providing a single source of truth.
Ever notice how the redux API looks like an EventEmitter? Me too, and I also noticed it doesn't have very many features. I wrote CIA to provide more features while preserving the basic concept.

## Setup:
`npm install cia` or `bower install cia`

## Usage:
`cia({methods}, {state} || {}, [handlers] || [] )`  <br />
`cia({methods}, {state} || {}, fnPoolReturningFunction )`


## Alterations from redux:
* Accepts opbject of methods instead of hard-coded `switch(action.type)` statements
* Returning state in a reducer is optional; defaults to existing state
* Action type is a string instead of a property, action data is stand-alone ex:`.dispatch("ADD", 4)`
* Subscribe actions to typed events w/ `.on(TYPE, fn)` and  `.dispatch("TYPE")` to fire action(s)
* `.subscribe(fn)` _subscription_ callbacks after state-changes; for rendering, backup, etc...



## Additional Features:

## System:
* Built-in event stream `.history` and thus, a simple `.undo()` implementation (naive)
* Clear the `.history` with `.reset()`
* Push certain events to another instance with `.push(events, instance)`
* Pull certain events from another instance with `.pull(events, instance)`
* Mark _subscription_ for certain events, or a conditional function `.subscribe(fn, strName(s)/fnBoolean)`


## Binding Reducers:
* Wildcards: `*` as reducer prop fires on all types, `.off('TYPE', '*')` removes all TYPE reducers
* Pass a single object of methods `to on()` and `off()` to manage reducers in bulk
* Name more than one event while subscribing ex:`.on("ADD,REM,CLR", fnRefresh)`
* Give more than one handler when subscribing to an event ex:`.on("ADD", [fnValidate, fnDraw])`
* Reducer definition object can have an array of many reducers under one type property name.
* Reduce on given event type(s) only the next time they happen with `.once(event, reducer)`
* Reduce on a dependent event type only after another type with `.after(needyEvent, strWaitEvent, reducer)`
* Reduce on an event only before another type has fired with `.before(event, strWaitEvent, reducer)`
* `before()` and `after()` also take function conditionals for _waiting_ instead of a string type name
* Context-free reducer invocation means you can bind `this` in your reducers without drawbacks.
 

## Dispatching Actions:
* `dispatch()`ing a RegExp as a type triggers any reducer type that matches
* Fire multiple events at once (ltr) from a single dispatch() call: `.dispatch("NEW,LOG,DRAW", uName)`
* Set flags to fire future reducers immediately upon adding  `.flag(strType, value)`
* Non-strings: dispatch `reducers.KEY`or `instance.$KEY` instead of `"KEY"` for validity and IDE happiness
* Over-ride un-bound conexts on `.dispatch()` with a third argument; the `this` value for the reducers




## Options
Options are set globally, and percolate to an instance upon instantiation. You can modify the options on the instance for more localized control. The publish options affect setup, and thus can only be applied globally before instantiation; you can set them true, create an instance, and set them false after that to instantiate unique-options instances.


Globally, these are set as `CIA._optionName`, and on the instance as `_optionName`

`._freeze= Object.freeze;`	used to freeze state, change to just "Object" (or K) to allow mutable state properties. <br />
`._blnPublishState`	if true, add a state property to instance to allow outside mutations (not usually recommended) <br />
`._blnPublishReducers`	if true, add a reducer property to the instance to allow customization <br />
`._blnStrictReducers`	if true, dispatch()ing missing reducer types will throw instead of fire a _MISSING_ internal <br />
`._blnErrorThrowing`	if true, throw on errors instead of dispatch()ing reducer errors as an _ERROR_ type internal <br />





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
