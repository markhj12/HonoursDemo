/*
 This class helps interpret the data from the refinement records
 */


//Object to store the information of a face
function face3D(a,b,c)
{
    this.a = a;
    this.b = b;
    this.c = c;
}


//Store information for the refinement record
//"index" is the index for the "point" in the geometry
function newVertex(index, point){
    this.index = index;
    this.point = point;
}

function faceMatch(face1,face2){
    var match = false;
    //if face1(a->b->c) == face2(a->b->c)
    if (face1.a == face2.a && face1.b == face2.b && face1.c == face2.c){
        match = true;
    }
    //if face1(a->b->c) == face2(b->c->a)
    else if (face1.a == face2.b && face1.b == face2.c && face1.c == face2.a){
        match = true;
    }
    //if face1(a->b->c) == face2(c->a->b)
    else if (face1.a == face2.c && face1.b == face2.a && face1.c == face2.b){
        match = true;
    }

    return match;
}

//Object to store information of a point
function point3D(x,y,z){
    this.x = x;
    this.y = y;
    this.z = z;
}

//Method overloading seems to make the mesh not render for some reason
//Object to store information of a point calculated from the difference between
//2 points
function pointDiff(point1,point2){
    var x2 = point1.x - point2.x;
    var y2 = point1.y - point2.y;
    var z2 = point1.z - point2.z;

    return new point3D(x2,y2,z2);
}

//Object to store information of a point calculated from the sum of 2 points
function pointAdd(point1,point2){
    var x2 = point1.x + point2.x;
    var y2 = point1.y + point2.y;
    var z2 = point1.z + point2.z;

    return new point3D(x2,y2,z2);
}

function pointAve(point1,point2){
    var x2 = (point1.x * 2 + point2.x)/2;
    var y2 = (point1.y * 2 + point2.y)/2;
    var z2 = (point1.z * 2 + point2.z)/2;

    return new point3D(x2,y2,z2);
}


/*
 Cannot seem to use indexOf to search for a face with the face array
 faceArray an array of faces
 sFace is the face we are searching for
 Since we only need to know if the face is with the list
 We can just return a boolean
 */

//Having multiple return statements does not seem to work
//I am reluctant to use a break statement but I may implement it if necessary for optimisation
function containsFace(faceArray, sFace){
    var found = false;
    $.each(faceArray,function(fKey,face){
        if(faceMatch(face,sFace)){
            found = true;
        }

    });
    return found;
}

var RecordHelper;
RecordHelper = function () {
    //Imports a list of Records, a THREE.js Geometry and the Vertex Mapping
    this.interpret = function (records, geometry, vMap, iMap) {
        //create an array of to store the information for refinement vertices
        //both new and old
        var oldVertices = geometry.vertices;
        var newVerticesHash = new jQuery.Hashtable();

        var oldFaces = geometry.faces;
        var newFaces = [];
        var removeFaces = [];

        console.table(records);


        //Interpret the Records
        $.each(records, function(key,record) {

            var V1, V2,point;
            var V1idx, V2idx;
            var keptRev, revKept, oriFaces;
            var flag;

            V1idx = record.V1idx;
            V2idx = record.V2idx;
            point = record.point;

            flag = record.flag;


            //First try to find the vertex in the new vertices for the most updated version
            if(newVerticesHash.containsKey((V1idx))) {
                V1 = newVerticesHash.get(V1idx);

            }
            else {
                var idx;
                idx = vMap.get(V1idx);
                V1 = oldVertices[idx];
            }




            if(flag == V1idx )
            {
                V2 = pointDiff(V1,point);
            }
            else if(flag ==0)
            {
                var V3 = pointAve(V1,point); //Get the average if the flag == 0
                newVerticesHash.add(V1idx,V3);
                V2 = pointDiff(V3,point); //Not sure if it should be the new V1 or the old V1
                console.log(key + "has f0");



            }
            else //flag only can be V1/V2/0 eliminating V1 and 0 leaves V2
            {

                V2 = pointAdd(V1,point);

                //Im confused as to if im supposed to swap V1 and V2
                /*
                 var idx = V2idx;
                 V2idx = V1idx;
                 V1idx = idx;

                 newVerticesHash.add(V1idx,V1);*/

            }



            //Get the new vertices from the list and add them to
            //the list of vertices to be added
            newVerticesHash.add(V2idx,V2);


            //Add (V1,V2,face) to the new faces
            keptRev = record.keptRev;
            $.each(keptRev,function(kepkey,face){
                newFaces.push(new Face(V1idx, V2idx, face));
            });

            //Add (V2,V1,face) to the new faces
            revKept = record.revKept;
            $.each(revKept,function(revkey,face){
                newFaces.push(new Face(V2idx, V1idx, face));
            });

            oriFaces = record.oriFaces;
            $.each(oriFaces, function(oKey, oriface){
                removeFaces.push(new Face(V1idx,oriface.A,oriface.B));
                newFaces.push(new Face(V2idx,oriface.A,oriface.B));
            });



        });





        //Get the list of vertices for the geometry
        //Add existing vertices to the newVertices
        //Which have not been swapped due to ref V1-V2 :fV2
        $.each(vMap.items,function(key,value){
            if(typeof(value) != "undefined" ) {
                if (!newVerticesHash.containsKey(key)) {
                    var point = oldVertices[value];
                    newVerticesHash.add(key, point);
                }
                else{
                    //console.log("Vertex "+ key + " has been modified and is in newverticesHash");
                }
            }


        });
        //console.log("2");
        //console.table(newVerticesHash.items);

        //Get the list of faces for the geometry
        var addFaces = [];
        //For debugging purposes
        var removedFaces = [];
        /*
         First add the original faces to the list of add faces, if they are not in the removefaces list
         iMap is used here to convert the faces back to the values based on their index in the original
         refined mesh so they can be compared to the remove faces list
         */

        $.each(oldFaces, function(fKey,oFace){
            var translatedFace = new Face(iMap[oFace.a],iMap[oFace.b],iMap[oFace.c]);

            if(!containsFace(removeFaces,translatedFace)) {
                addFaces.push(translatedFace);
            }
            else{
                removedFaces.push(translatedFace);
            }

        });

        //Add the new faces to the list of add faces, provided they are not in the removefaces list

        $.each(newFaces, function(nKey,nFace){
            if(!containsFace(removeFaces,nFace)){
                addFaces.push(nFace);
            }
            else{
                removedFaces.push(nFace);
            }

        });









        //Generate a new vertex mapping and inverseMapping
        var vMap2 = new jQuery.Hashtable();
        var iMap2 = [];

        var count = 0;
        //This variable is determine if the array is a complete array, which should speed up rendering the geometry
        var fullArray = true;
        $.each(newVerticesHash.items,function(nKey,nVal){
            if(typeof(nVal) != "undefined"){
                vMap2.add(nKey,count);
                iMap2[count,nKey];
                count++;
            }
            else{
                fullArray = false;
            }

        });





        return {"vertices": newVerticesHash, "faces":addFaces, "vMap":vMap2,"iMap":iMap2, "fullArray":fullArray}







    }
};