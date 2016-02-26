// cia.js  by dandavis [CCBY4]
(function(a,b){"function"==typeof define&&define.amd?define([],a):"object"==typeof exports?module.exports=a():b.CIA=a()}(function(){

function CIA(reductions, state, objOptions) {

	state = typeof state === "function" ? state() : (state || {});
	reductions = typeof reductions === "function" ? reductions() : reductions;
	objOptions = objOptions || {};
	
	if(typeof reductions != "object") throw new TypeError("Reduction definitions Object cannot be a non-Object");
	if(typeof state != "object") throw new TypeError("State Object cannot be a non-Object");

	var pool = [],
	types = {types:{}, actions: {}}, 
	oDef = reductions;
	reductions = assign({}, reductions); //dupe reductions

	// turn each prop into an array for later expansion:
	forEach(Object.keys(reductions), function(k) {
		var o = reductions[k];
		if(!Array.isArray(o)) reductions[k] = [o];
		types.types[k]=k;
		types.actions[k]=function(data){ return ret.dispatch(k, data, this); };
	});

	var orig = JSON.parse(JSON.stringify(state)),
	flags = {},
	rxInternal = /^_[A-Z]+_$/,
	ret = {
		history: [],
		undo: function(n) { // restore initial state and re-fire events 0 - (last - n)
			state = JSON.parse(JSON.stringify(orig));
			var r = this.history.slice(0, - (n || 1));
			this.history.length = 0;
			r.forEach(function(e) {
				this.dispatch(e[0], e[1]);
			}, this);
		},

		getState: function() { // returns a representation of the internal state
			return dupe(state);
		},

		flag: function(strType, value) { // fires knowns and news when subscribed, good for ready()
			forEach(arr(strType), function(strType) {
				flags[strType] = value;
				ret.dispatch(strType, value);
			});
		},

		unflag: function(strType) { // un-set an auto-dispatch event
			forEach(arr(strType), function(strType) {
				delete flags[strType];
			});
		},

		now:  function(strType, fnReducer, context) { // like on, but dispatches the event upon adding
			ret.on(strType, fnReducer);
			ret.dispatch(strType, context);
			return this;
		},

		on: function(strType, fnReducer) { // adds reducer(s) for type(s)
			if(typeof strType === "object") {
				forEach(Object.keys(strType), function(k) {
					ret.on(k, strType[k]);
				});
				return this;
			}
			if(!Array.isArray(fnReducer)) fnReducer = [fnReducer];
			forEach(arr(strType), function(strType) {
				forEach(fnReducer, function(fnReducer) {
					var r = reductions[strType] || (reductions[strType] = []);
					r.push(fnReducer);
					ret["$" + strType] = strType;
					ret.dispatch("_ON_", [strType, fnReducer]);
					if(flags[strType] != null) ret.dispatch(strType, flags[strType]);
				});
			});
			return this;
		},

		off: function(strType, fnReducer) { // remove a reducer by type and function, or "*" for all

			if(typeof strType === "object") {
				forEach(Object.keys(strType), function(k) {
					ret.off(k, strType[k]);
				});
				return this;
			}

			var r = reductions[strType];
			if(!r) return false;
			ret.dispatch("_OFF_", [strType, fnReducer]);
			if(fnReducer === "*") {
				delete ret["$" + strType];
				return delete reductions[strType];
			}

			var index = r.indexOf(fnReducer);
			if(index === -1) return false;
			r.splice(index, 1);

			if(!r.length) {
				delete ret["$" + strType];
				delete reductions[strType];
			}
			return true;
		},

		once: function(strType, fnReducer) { //like on(), but removes after the first time it fires.

			if(typeof strType === "object") {
				forEach(Object.keys(strType), function(k) {
					ret.once(k, strType[k]);
				});
				return this;
			}

			if(!Array.isArray(fnReducer)) fnReducer = [fnReducer];

			forEach(arr(strType), function(strType) {
				forEach(fnReducer, function(fnReducer) {
					ret.on(strType, function oncer(state, e) {
						fnReducer(state, e);
						ret.off(strType, oncer);
					});
				});
			});
			return this;
		},

		when: function(property, value, type, data){ // needs state to be an object
			// given a property and value/array of values, dispatch a given event with given data
			return ret.on("*", function handler(state, data){
				if(  (  Array.isArray(value) ? 
					(value.indexOf(state[property]) !== -1) : 
					(state[property]===value)
				     ) && !handler.spent ){
					handler.spent = true;
					ret.off("*", handler);
					ret.dispatch(type, data);
				}
			});
		},
		
		watch: function(property, type){ // needs state to be an object
			// given a property , dispatch a given event when the property value changes
			var value = state[property];
			return ret.on("*", function handler(state, data){
				if(state[property] !== value && !handler.spent){
					handler.spent = true;
					ret.dispatch(type, {property: property, was: value, now: value=state[property]});
					handler.spent = false;
				}
			});
		},		
		
		after: function(strType, trigger, fnReducer) {// like on(), but removes itself once the trigger has occurred
			if(typeof trigger === "function") return ret.on(strType, function wait(state, data) {
				if(trigger(state, data)) {
					ret.off(strType, wait);
					ret.on(strType, fnReducer);
					fnReducer.call(ret, state, data);
				}
			});
			var ok = ret.history.some(function(x) {
				return x[0] === trigger;
			});
			if(ok) return ret.on(strType, fnReducer);
			return ret.once(trigger, fnReducer);
		},

		before: function(strType, trigger, fnReducer) { // like on(), but won't execute unless the trigger has occurred

			if(typeof trigger === "function") return ret.on(strType, function wait(state, data) {
				if(trigger(state, data)) {
					ret.off(strType, wait);
				} else {
					fnReducer.call(ret, state, data);
				}
			});

			var used = ret.history.some(function(x) {
				return x[0] === trigger;
			});
			if(used) return ret;
			ret.on(strType, fnReducer);
			return ret.once(trigger, function oncer() {
				ret.off(strType, fnReducer);
			});
		},

		push: function(strEvent, objCIA) { // dispatch an event ON another instance when it happens locally
			function pusher(state, e) {
				objCIA.dispatch(strEvent, e);
			}
			ret.on(strEvent, pusher);
			return ret.off.bind(ret, strEvent, pusher);
		},

		pull: function(strEvent, objCIA) { // dispatch an event FROM another instance when it happens remotely
			function puller(state, e) {
				ret.dispatch(strEvent, e);
			}
			objCIA.on(strEvent, puller);
			return objCIA.off.bind(objCIA, strEvent, puller);
		},

		subscribe: function(fnHandler, matcher) { // add handlers that execute after state changes
			pool.push([fnHandler, matcher]);
			ret.dispatch("_SUBSCRIBE_", [fnHandler, matcher]);
			return this.unsubscribe.bind(this, fnHandler);
		},

		unsubscribe: function(fnHandler) { // removes handlers that execute after state changes
			pool = pool.filter(function(fn) {
				return fn[0] !== fnHandler;
			});
			ret.dispatch("_UNSUBSCRIBE_", [fnHandler]);
			return this;
		},

		dispatch: function(strType, data, context) { // allows reducer return values to be fed to handlers via this:
	
			if(!strType) throw new TypeError("dispatch() requires an event type, event object, array of types, or RegExp to match types with");
		
			if(!data && typeof strType==="object" && strType.type){ // make compat with redux event objects
				data=strType;
				strType=strType.type;				
			}
			if(strType.constructor === RegExp) strType = Object.keys(reductions).filter(/./.test, strType).join(",");
			if(Array.isArray(strType) && arr(strType)[0] == strType[0]) strType = strType.join(",");
			if(typeof strType != "string") for(var k in oDef) if(oDef[k] === strType) {
				strType = k;
				break;
			}

			forEach(arr(strType), function(strType) {

				var heap = reductions[strType] || [],
					isInternal = rxInternal.test(strType);

				if(!heap.length && !isInternal) {
					if(ret._blnStrictReducers) throw new TypeError("Unknown reducer type dispatched: " + strType);
					return ret.dispatch("_MISSING_", [strType, data]);
				}

				if("*" in reductions) heap = heap.concat(reductions['*']);

				if(!isInternal && !ret._blnForget) ret.history.push([strType, data]);

				if(ret._blnErrorThrowing) {
					forEach(heap, function(fn) {
						var rez = (context ? fn.call(context, state, data) : fn(state, data));
						if( rez!=fn.UndeF1neD && !ret._blnPureMutations) state = rez;
					});
				} else { // catch errors:
					forEach(heap, function(fn) {
						try {
							var rez = (context ? fn.call(context, state, data) : fn(state, data)) || state;
							if( rez!=fn.UndeF1neD && !ret._blnPureMutations) state = rez;
						} catch(err) {
							ret.dispatch("_ERROR_", [err, strType, data]);
						}
					});
				} //end if throw on errors?

				function finish(){
					forEach(pool, function(fn) {
						if(fn[1]&&((fn[1].call && !fn[1](strType))||(strType.search(fn[1]) === -1)))return;
						fn[0].call(ret, state);
					});
				}

				if(ret._blnDeferSubscriptions){
					clearTimeout(ret._timer);
					ret._timer=setTimeout(finish, ret._blnDeferPeriod || 15);
				}else{
					finish();
				}
				
			});

			
			return this;
		},

		reset: function() { // empties the state change history, restores the state to initial, and dispatches _INIT_
			ret.history.length = 0;
			state = orig;
			ret.dispatch.call(ret, "_INIT_", []);
			return true;
		}
	};

	forEach(Object.keys(CIA), function(k) {
		ret[k] = (k in objOptions) ? objOptions[k] : CIA[k];
	}); // "inherit" options to instance

	if(ret._blnPublishState) ret.state = state; // if publish state?
	if(ret._blnPublishReducers) ret.reducers = reducers; // if publish reducers?

	assign(ret, types);
	ret.dispatch.call(ret, "_INIT_", []);
	return ret;
}; // end CIA()


// global config, available externally
CIA._freeze= Object.freeze; 	// used to freeze state, change to just "Object" (or K) to allow mutable state properties.
CIA._blnPublishState= false; 	// add a state property to instance to allow outside mutations (not usually recommended)
CIA._blnPublishReducers= false;	// add a reducer property to the instance to allow customization
CIA._blnStrictReducers= false;	// dispatch()ing missing reducer types will throw instead of fire a _MISSING_ internal
CIA._blnErrorThrowing= false;	//  throw on errors instead of dispatch()ing reducer errors as an _ERROR_ type internal
CIA._blnPureMutations= false;   // optimizes for mutating pure functions by igroning reducer returns
CIA._blnForget= false;	//  prevents keeping dispatched actions in .history. prevents .after()'s firing on adding capability
CIA._blnDeferSubscriptions= false;// debounce state-change callbacks to reduce CPU. note: only last event of cluster will be passed
CIA._blnDeferPeriod = 15 ;	// w/_blnDeferSubscriptions, # of ms to wait for activity to cease before firing a state-change
				
// common internal utils:
function assign(o, x){for (var k in x) if(assign.hasOwnProperty.call(x, k)) o[k] = x[k]; return o; }
function arr(s){return String(s).trim().split(/\s*,\s*/).filter(Boolean);}
function forEach(r,f){var m=r.length, i=0;for(; i<m; i++)f(r[i],i,r);};
function dupe(o){return (o && typeof o==="object") ? CIA._freeze(assign({}, o)) : o;}

CIA.utils={
	assign: assign,
	dupe: dupe,
	each: forEach	
};

 // end packaging:  
  return CIA;
  
/* toc maker:
 Object.keys(store).filter(a=>store[a].call).map(a=>"`."+a+"("+store[a].toString().split(")")[0].split("(")[1].trim()+")` - " + 
  (store[a].toString().match(/\/\/[\w\W]+?$/m)||[""])[0].slice(2).trim()).sort().join(" <br>\n")    */
  
}, this));
