/*
Used to read a fi;e and return its contents as a string
*/
function loadFile(file){
    var data;
    if(typeof window === 'undefined'){
	var fs = require("fs");
	data = fs.readFileSync(file)+'';
    } else {
	data = loadFileAJAX(file);
    }
    return data;
};


// Get a file as a string using  AJAX
function loadFileAJAX(name) {
    var xhr = new XMLHttpRequest(),
	okStatus = document.location.protocol === "file:" ? 0 : 200;
    var d = new Date();
    //We add the current date to avoid caching of request
    //Murder for development
    xhr.open('GET', name+"?"+d.toJSON(), false);
    xhr.send(null);
    return xhr.status ==  okStatus ? xhr.responseText : xhr.responseText;
};


var FileReader =(function(){
	
	this.getData = function(file){
	    var data = loadFile(file);
	    return data;
	}
	
});