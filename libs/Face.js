/*
Parse the faces file
*/

function Face(a,b,c){
    this.a = a;
    this.b = b;
    this.c = c;
}

Face.set = function(a,b,c){
    this.a = a;
    this.b = b;
    this.c = c;
}

var FaceReader;
FaceReader = function(){
  this.parse = function(data){
      var faces;
      faces = [];

      //Split the data based on line
      var aData = data.split('\n');
      if ($.trim(aData[length - 1]) == "") {
          aData.pop();
      }

      $.each(aData, function (key, value) {

          var coor = value.split(' ');

          faces.push(new Face( parseInt(coor[0]), parseInt(coor[1]), parseInt(coor[2])));
      });



      return faces;

  }
};