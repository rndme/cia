// cia.js  by dandavis [CCBY4]
(function(a,b){"function"==typeof define&&define.amd?define([],a):"object"==typeof exports?module.exports=a():b.CIA=a()}(function(){

function CIA(changers, state, objOptions) {

	state = typeof state === "function" ? state() : (state==CIA.Ud3f1ned ? {} : state);
	changers = typeof changers === "function" ? changers() : changers;
	objOptions = (typeof objOptions === "object" && !Array.isArray(objOptions)) ? objOptions : {};
	
	if(typeof changers != "object") throw new TypeError("changers definitions Object cannot be a non-Object");

	var pool = [],
	types = {types:{}, actions: {}}, 
	oDef = changers;
	changers = assign({}, changers); //dupe changers

	// turn each prop into an array for later expansion:
	forEach(Object.keys(changers), function(k) {
		var o = changers[k];
		if(!Array.isArray(o)) changers[k] = [o];
		types.types[k]=k;
		types.actions[k]=function(data){ return ret.dispatch(k, data, this); };
	});

	var orig = JSON.parse(JSON.stringify(state)),
	flags = {},
	rxInternal = /^_[A-Z]+_$/,
	ret = {
		history: [],

		forget: function() { // clear history and set current as initial state
			orig = JSON.parse(JSON.stringify(state));
			ret.history.length = 0;
			ret.dispatch.call(ret, "_INIT_", []);
			return true;
		},
		
		undo: function(n) { // restore initial state and re-fire events 0 - (last - n)
			ret.dispatch("_UNDO_", n);
			state = JSON.parse(JSON.stringify(orig));
			var r = ret.history.slice(0, - (+n || 1));
			ret.history.length = 0;
			if(!r.length) return ret.dispatch("_INIT_");
			forEach(r, function(e) {
				ret.dispatch(e[0], e[1]);
			});
			ret.dispatch("_UNDONE_", r);
			return this;
		},

		getState: function() { // returns a representation of the internal state
			return dupe(state);
		},

		flag: function(strType, value) { // fires knowns and news when subscribed, good for ready()
			forEach(arr(strType), function(strType) {
				flags[strType] = value;
				ret.dispatch(strType, value);
			});
			return this;
		},

		unflag: function(strType) { // un-set an auto-dispatch event
			forEach(arr(strType), function(strType) {
				delete flags[strType];
			});
			return this;
		},

		now:  function(strType, fnChanger, context) { // like on, but dispatches the event upon adding
			ret.on(strType, fnChanger);
			ret.dispatch(strType, context);
			return this;
		},

		on: function(strType, fnChanger) { // adds changer(s) for type(s)
			if(typeof strType === "object") {
				forEach(Object.keys(strType), function(k) {
					ret.on(k, strType[k]);
				});
				return this;
			}
			if(!Array.isArray(fnChanger)) fnChanger = [fnChanger];
			forEach(arr(strType), function(strType) {
				forEach(fnChanger, function(fnChanger) {
					var r = changers[strType] || (changers[strType] = []);
					r.push(fnChanger);
					ret.actions[strType]= function(data){ return ret.dispatch(strType, data, this); };
					ret.types[strType]= strType;
					ret.dispatch("_ON_", [strType, fnChanger]);
					if(flags[strType] != null) ret.dispatch(strType, flags[strType]);
				});
			});
			return this;
		},

		off: function(strType, fnChanger) { // remove a changer by type and function, or "*" for all

			if(typeof strType === "object") {
				forEach(Object.keys(strType), function(k) {
					ret.off(k, strType[k]);
				});
				return this;
			}

			if(!Array.isArray(fnChanger)) fnChanger = [fnChanger];

			forEach(arr(strType), function(strType) {
				forEach(fnChanger, function(fnChanger) {

					var r = changers[strType];
					if(!r) return false;
					ret.dispatch("_OFF_", [strType, fnChanger]);
					if(fnChanger === "*") r= [fnChanger];

					var index = r.indexOf(fnChanger);
					if(index === -1) return false;
					r.splice(index, 1);
		
					if(!r.length) {
						delete ret.actions[strType];
						delete changers[strType];
						delete ret.types[strType];
					}
				});
			});


			return this;
		},

		once: function(strType, fnChanger) { //like on(), but removes after the first time it fires.

			if(typeof strType === "object") {
				forEach(Object.keys(strType), function(k) {
					ret.once(k, strType[k]);
				});
				return this;
			}

			if(!Array.isArray(fnChanger)) fnChanger = [fnChanger];

			forEach(arr(strType), function(strType) {
				forEach(fnChanger, function(fnChanger) {
					ret.on(strType, function oncer(state, e) {
						fnChanger(state, e);
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
		
		after: function(strType, trigger, fnChanger) {// like on(), but removes itself once the trigger has occurred
			if(typeof trigger === "function") return ret.on(strType, function wait(state, data) {
				if(trigger(state, data)) {
					ret.off(strType, wait);
					ret.on(strType, fnChanger);
					fnChanger.call(ret, state, data);
				}
			});
			var ok = ret.history.some(function(x) {
				return x[0] === trigger;
			});
			if(ok) return ret.on(strType, fnChanger);
			return ret.once(trigger, fnChanger);
		},

		before: function(strType, trigger, fnChanger) { // like on(), but won't execute unless the trigger has occurred

			if(typeof trigger === "function") return ret.on(strType, function wait(state, data) {
				if(trigger(state, data)) {
					ret.off(strType, wait);
				} else {
					fnChanger.call(ret, state, data);
				}
			});

			var used = ret.history.some(function(x) {
				return x[0] === trigger;
			});
			if(used) return ret;
			ret.on(strType, fnChanger);
			return ret.once(trigger, function oncer() {
				ret.off(strType, fnChanger);
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
			return ret.unsubscribe.bind(ret, fnHandler);
		},

		unsubscribe: function(fnHandler) { // removes handlers that execute after state changes
			pool = pool.filter(function(fn) {
				return fn[0] !== fnHandler;
			});
			ret.dispatch("_UNSUBSCRIBE_", [fnHandler]);
			return ret;
		},

		dispatch: function dispatch(strType, data, context) { // allows changer return values to be fed to handlers via this:
	
			if(!strType) throw new TypeError("dispatch() requires an event type, event object, array of types, Promise, Function, or RegExp to match types with");
		  	if(typeof strType==="function")	return strType(dispatch.bind(ret));
			if(typeof strType.then==="function") return strType.then(dispatch.bind(ret));
			if(data && typeof data.then==="function") return data.then(dispatch.bind(ret, strType));			
		  
			if(!data && typeof strType==="object" && strType.type){ // make compat with redux event objects
				data=strType;
				strType=strType.type;				
			}
			if(strType.constructor === RegExp) strType = Object.keys(changers).filter(/./.test, strType).join(",");
			if(Array.isArray(strType) && arr(strType)[0] == strType[0]) strType = strType.join(",");

			forEach(arr(strType), function(strType) {

				var heap = changers[strType] || [],
					isInternal = rxInternal.test(strType);

				if(!heap.length && !isInternal) {
					if(ret._blnStrictChangers) throw new TypeError("Unknown changer type dispatched: " + strType);
					return ret.dispatch("_MISSING_", [strType, data]);
				}

				if("*" in changers) heap = heap.concat(changers['*']);

				if(!isInternal && !ret._blnForget) ret.history.push([strType, data]);

				if(ret._blnErrorThrowing) {
					forEach(heap, function(fn) {
						var rez = (context ? fn.call(context, state, data, ret) : fn(state, data, ret));
						if( rez!=fn.UndeF1neD && !ret._blnPureMutations) state = rez;
					});
				} else { // catch errors:
					forEach(heap, function(fn) {
						try {
							var rez = (context ? fn.call(context, state, data) : fn(state, data, ret));
							if( rez!=fn.UndeF1neD && !ret._blnPureMutations) state = rez;
						} catch(err) {
							ret.dispatch("_ERROR_", [err, strType, data, ret]);
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

		revert: function() { // empties the state change history, restores the state to initial, and dispatches _INIT_
			ret.history.length = 0;
			state = orig;
			ret.dispatch.call(ret, "_INIT_", []);
			return true;
		}
	};

	forEach(Object.keys(objOptions), function(k) {
		ret[k] = objOptions[k];
	}); // "inherit" properties to instance

	if(ret._blnPublishState) ret.state = state; // if publish state?
	if(ret._blnPublishChangers) ret.changers = changers; // if publish changers?

	assign(ret, types);
	ret.dispatch.call(ret, "_INIT_", []);
	return ret;
}; // end CIA()


// global config, available externally
CIA._freeze= Object.freeze; 	// used to freeze state, change to just "Object" (or K) to allow mutable state properties.
CIA._blnPublishState= false; 	// add a state property to instance to allow outside mutations (not usually recommended)
CIA._blnPublishChangers= false;	// add a changer property to the instance to allow customization
CIA._blnStrictChangers= false;	// dispatch()ing missing changer types will throw instead of fire a _MISSING_ internal
CIA._blnErrorThrowing= false;	//  throw on errors instead of dispatch()ing changer errors as an _ERROR_ type internal
CIA._blnPureMutations= false;   // optimizes for mutating pure functions by igroning changer returns
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
