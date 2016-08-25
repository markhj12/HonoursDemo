function doSomething(val){
    return  val;
}

this.onmessage = function(event){
    var records = JSON.parse(event.data);

    var ret = doSomething(records[0]);

    setTimeout(function(){this.postMessage(ret);},3000);
    //this.postMessage(ret);
}