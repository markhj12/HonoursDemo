/*
 Script for interpreting data from the refinement records
 */

//Object to store information of a face
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

faceToString = function(a,b,c){
    return a.toString() + " " + b.toString() + " " + c.toString();
}


function containsIndex(face, index){
    return face.a == index || face.b == index || face.c == index;
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



/*
 Cannot seem to use indexOf to search for a face with the face array
 faceArray an array of faces
 sFace is the face we are searching for
 Since we only need to know if the face is with the list
 We can just return a boolean
 */

function containsFace(removeFaceArray, sFace){
    var idx1 = faceToString(sFace.a,sFace.b,sFace.c);
    var idx2 = faceToString(sFace.b,sFace.c,sFace.a);
    var idx3 = faceToString(sFace.c,sFace.a,sFace.b);

    return removeFaceArray[idx1] || removeFaceArray[idx2] || removeFaceArray[idx3];


}



function interpret2(jRecs,jVertices,jFaces,jVMap,jIMap){
    importScripts("HashTable.js")
    var records = JSON.parse(jRecs);

    //create an array of to store the information for refinement vertices
    //both new and old
    var oldVertices = JSON.parse(jVertices);

    var oldFaces = JSON.parse(jFaces);
    var vMap = JSON.parse(jVMap);
    var iMap = JSON.parse(jIMap);

    var newVerticesHash = new Hashtable();
    var vMap2 = new Hashtable();
    var iMap2 = [];

    var newFaces = [];
    var removeFaces = [];

    records.forEach(function(record,key){
        record.oriFaces.forEach(function(face){
            removeFaces[faceToString(record.V1idx,face.B,face.C)] = true;
        });
    });



    records.forEach(function(record,key){

        var V1idx, V2idx;
        var keptRev, revKept, oriFaces;

        V1idx = record.V1idx;
        V2idx = record.V2idx;

        //Get the new vertices from the list and add them to
        //the list of vertices to be added
        newVerticesHash.add(V2idx,record.point);


        keptRev = record.keptRev;
        record.keptRev.forEach(function(face){
            newFaces.push(new Face(V1idx, V2idx, face));
        });

        //Add (V2,V1,face) to the new faces
        record.revKept.forEach(function(face){
            newFaces.push(new Face(V2idx, V1idx, face));
        });

        record.oriFaces.forEach( function(oriface){
            newFaces.push(new Face(V2idx,oriface.B,oriface.C));
        });




    });


    vMap.items.forEach(function(value,key){
        if(typeof(value) != "undefined" ) {
            if (!newVerticesHash.containsKey(key)) {
                var point = oldVertices[value];
                newVerticesHash.add(key, point);
            }

        }
    });




    //Get the list of faces for the geometry
    var addFaces = [];

    //var removedFaces = []; //This is just used for debugging
    /*
     First add the original faces to the list of add faces, if they are not in the removefaces list
     iMap is used here to convert the faces back to the values based on their index in the original
     refined mesh so they can be compared to the remove faces list
     */

    oldFaces.forEach(function(oFace){
       var translatedFace = new Face(iMap[oFace.a],iMap[oFace.b],iMap[oFace.c]);

        if(!containsFace(removeFaces,translatedFace)){
            addFaces.push(translatedFace);
        }
    });


    //Add the new faces to the list of add faces, provided they are not in the removefaces list

    newFaces.forEach( function(nFace){
        if(!containsFace(removeFaces,nFace)){
            addFaces.push(nFace);
        }

    });



    var count = 0;
    //This variable is determine if the array is a complete array, which should speed up rendering the geometry
    newVerticesHash.items.forEach(function(nVal,nKey){
        if(typeof(nVal) != "undefined"){
            vMap2.add(nKey,count);
            iMap2[count] = nKey;
            count++;
        }
    });







    return {"vertices": newVerticesHash, "faces":addFaces, "vMap":vMap2,"iMap":iMap2}
}


this.onmessage = function(event){

    //var records = event.data.recs;

    var data = interpret2(event.data.recs,event.data.vertices,event.data.faces,event.data.vMap,event.data.iMap);


    var sData = JSON.stringify(data);


    this.postMessage(sData);
}
