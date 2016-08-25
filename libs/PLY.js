//PLY class
var PLY = function (source) {
	// body...
	console.log("Creating ply object from "+ source);
	
	var data = loadFileAJAX(source);
	
	alert(data);
}


//Function copied from https://gist.github.com/Tritlo/9794497
// Get a file as a string using AJAX
function loadFileAJAX(name) {
    var xhr = new XMLHttpRequest(),
	okStatus = document.location.protocol === "file:" ? 0 : 200;
    var d = new Date();
    //We add the current date to avoid caching of request
    //Murder for development
    xhr.open('GET', name+"?"+d.toJSON(), false);
    xhr.send(null);
    return xhr.status == okStatus ? xhr.responseText : null;
};