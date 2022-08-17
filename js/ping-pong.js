
/*
	简单的回应模型
*/

var g_pp = {
	init: function(){

	},
	list: {},
	set: function(key, opts){
		this.list[key] = opts;
	},
	get: function(key){
		return this.list[key];
	},
	call: function(key, ...args){
		var d = this.get(key);
		if(!d) return;
		d.apply(null, args);
		if(d.once) this.del(key);
	},
	del: function(key){
		if(this.list[key]) delete list[key];
	},
	clear: function(){
		this.list = {};
	},
}

// g_pp.set('ping', (a, b) => {
// 	console.log(a, b)
// });
// g_pp.call('ping', 1, 2);



            