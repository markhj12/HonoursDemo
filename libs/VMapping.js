/*
Reads the vertex Mapping file
*/

var VMapper = function () {
	this.map = function(vertices){
		//Takes sorted vertices which keep their original vertex indexes and creates a map
		var map;
		map = [];
		
		$.each(vertices, function (key,value) {
			map[value.oriIndex] = value.meshIndex;
		});
		//Debugging
		/*
		$.each(map,function(a,b){
			console.log(b);
		});
		*/
		return map;
	}
};
