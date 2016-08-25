function doSomething(val) {
    return "Received :\n " + val;
}


this.onmessage = function(event){

    setTimeout(function()
        {
            postMessage("hello");
        },
        e.data.timeout * 1000);
};