//cia.js  by dandavis [CCBY4]
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define([], factory);
	} else if (typeof exports === 'object') {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like environments that support module.exports,
		// like Node.
		module.exports = factory({});
	} else {
		// Browser globals (root is window)
		root.CIA = factory(root);
  }
}(this, function (pub) {


function CIA(reductions, state, pool) {
	if(typeof reductions  != "object") throw new TypeError("Reduction definitions Object cannot be a non-Object");
  
    function arr(s){return String(s).trim().split(/\s*,\s*/).filter(Boolean);}
  	function forEach(r,f){var m=r.length, i=0;for(; i<m; i++)f(r[i],i,r);};
  
	state = state || {};
	pool = pool || [];
	Object.keys(reductions).forEach(function(k){var o=reductions[k]; if(!Array.isArray(o))reductions[k]=[o];});
  	var orig=Object.freeze(Object.assign({}, state));
	var ret={
	  	returnValue: true,
		history: [],
	  	undo: function(n){
		  	state=orig;
		  	var r=this.history.slice(0, -(n||1));
		  	this.history.length=0;
		  	r.forEach(function(e){ this.dispatch(e[0],e[1]); }, this);		  	
		},
	  
		getState: function(){ 
			return Object.assign({}, state);
		},
	  
		unsubscribe: function(fnHandler){  
			return pool = pool.filter(function(fn){return fn !== fnHandler;});
		},
	  
		on: function(strType, fnReducer) {
		  	if(!Array.isArray(fnReducer)) fnReducer = [fnReducer];
		  	forEach( arr(strType), function(strType){
				forEach(fnReducer, function(fnReducer){
					var r=reductions[strType] || (reductions[strType]=[]);
					r.push(fnReducer);
					this.history.push({type:"_ON_", event: strType, action: fnReducer });
				});
			});
			return this;
		},
	  
		off: function(strType, fnReducer) {
			var r=reductions[strType];
			if(!r) return false;
			if(fnReducer==="*"){
			  this.history.push({type:"_OFF_", event: strType, action: fnReducer });
			  return delete reductions[strType];
			}
		  
			var index=r.indexOf(fnReducer);
			if(index===-1) return false;
			r.splice(index, 1);
			this.history.push({type:"_OFF_", event: strType, action: fnReducer });
			return true;
		},
		subscribe: function(fnHandler, matcher){
			pool.push(fnHandler);
		  	fnHandler._matcher=matcher;
			return this.unsubscribe.bind(this, fnHandler);
		},
	  
		dispatch: function(action, data){   // allows reducer return values to be fed to handlers via this:
		  	var that=this;
		  
		  forEach( arr(action), function(action){
			
			var heap = reductions[action] || [];		  
			if(!heap.length && action!="_INIT_" ) throw new ReferenceError("Unknown reducer group: "+action);
		  	that.history.push([action, data]);
		  	heap.forEach(function(fn){
			  	state = fn.call(this, state, data) || state;
			}, that);
		  	if(!that.returnValue){
			 	that.returnValue=true; 
			  	return that;
			}
			forEach(pool, function(fn){
			  if(fn._matcher){
				if(fn._matcher.call && !fn._matcher.call(that, action)) return;
				if(action.search(fn._matcher)===-1) return;
			  }
			  fn(state);
			});
			
		  });
		  
		   return this;
		}
	};
	ret.dispatch.call(ret, "_INIT_");
	return ret;
}; // end CIA()
  
return CIA;

}));
