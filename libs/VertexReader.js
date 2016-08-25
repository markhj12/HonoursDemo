/*
* Read Vertices from the file
*/

function Vertex(oriIndex,meshIndex,x,y,z)
{
    this.oriIndex = oriIndex;
    this.meshIndex = meshIndex;
    this.point = new THREE.Vector3(x,y,z);
/*    this.x = x;
    this.y = y;
    this.z = z;
*/
}

var VertexReader;
VertexReader = function () {
    //Parses a base mesh to get the data, it is assumed that vertices are ordered
    this.parse = function (data) {

        var vertices,count;
        vertices = [];
        //Split the data based on line
        var aData = data.split('\n');
        if ($.trim(aData[length - 1]) == "") {
            aData.pop();
        }

        //Assuming data is sorted
        $.each(aData, function (key, value) {
            var idx = $.inArray(' ', value);
            //get the index of the vertex
            var vIdx = parseInt(value.substr(0, idx));
            //get the coordinates
            var coor = value.substr(idx).split(',');

            vertices.push(new Vertex(vIdx,key, parseFloat(coor[0]), parseFloat(coor[1]), parseFloat(coor[2])));
        });

        //Debugging purposes
        /*$.each(vertices, function(k,v){
            console.log(v);
        });*/
        return vertices;
    }
};