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
* Converts face to a string for the key and checks all versions of the face in
* the removeface array array if any of them are true then the face should be removed
* */

function containsFace(removeFaceArray, sFace){
    var idx1 = faceToString(sFace.a,sFace.b,sFace.c);
    var idx2 = faceToString(sFace.b,sFace.c,sFace.a);
    var idx3 = faceToString(sFace.c,sFace.a,sFace.b);

    return removeFaceArray[idx1] || removeFaceArray[idx2] || removeFaceArray[idx3];


}



function interpret2(jRecs,jVertices,jFaces,jIMap){
    importScripts("HashTable.js")
    var records = JSON.parse(jRecs);

    var oldVertices = JSON.parse(jVertices);

    var oldFaces = JSON.parse(jFaces);
    var iMap = JSON.parse(jIMap);

    var newVerticesHash = new Hashtable();
    var iMap2 = [];

    var newFaces = [];
    var removeFaces = [];

    /* Adding reference for faces needed to remove */
    var t1 = performance.now();
    records.forEach(function(record,key){
        record.oriFaces.forEach(function(face){
            removeFaces[faceToString(record.V1idx,face.B,face.C)] = true;
        });
    });

    /*
    * Adding vertices from the old mesh
    * */

    var t2 = performance.now();

    iMap.forEach(function(value,key){
        var point = oldVertices[key];
        newVerticesHash.add(value,point);
    });

    var t3 = performance.now();

    /*
    * Decoding the records by
    * adding the new vertex and
    * faces to a new faces list ( potential optimisation in RecordHelperInfo4
    * removes this newFaces list)*/

    var addVTime = 0;
    var addFacesTime = 0;
    records.forEach(function(record,key){

        var V1idx, V2idx;

        V1idx = record.V1idx;
        V2idx = record.V2idx;

        //Get the new vertices from the list and add them to
        //the list of vertices to be added

        var t31 = performance.now();
        newVerticesHash.add(V2idx,record.point);

        var t32 = performance.now();

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

        addVTime += t32-t31;
        addFacesTime += performance.now() - t32;

    });



    var t4 = performance.now();




    //Get the list of faces for the geometry
    var addFaces = [];

     /*First add the original faces to the list of add faces, if they are not in the removefaces list
     iMap is used here to convert the faces back to the values based on their index in the original
     refined mesh so they can be compared to the remove faces list
     */

    oldFaces.forEach(function(oFace){
        var translatedFace = new Face(iMap[oFace.a],iMap[oFace.b],iMap[oFace.c]);

        if(!containsFace(removeFaces,translatedFace)){
            addFaces.push(translatedFace);
        }
    });

    var t5 = performance.now();

    //Add the new faces to the list of add faces, provided they are not in the removefaces list

    newFaces.forEach( function(nFace){
        if(!containsFace(removeFaces,nFace)){
            addFaces.push(nFace);
        }

    });

    var t6 = performance.now();

    /*Create a new IMap*/
    var count = 0;
    newVerticesHash.items.forEach(function(nVal,nKey){
        if(typeof(nVal) != "undefined"){
            iMap2[count] = nKey;
            count++;
        }
    });


    var t7 = performance.now();
    var time1 = t2-t1;
    var time2 = t3-t2;
    var time3 = t4-t3;
    var time4 = t5-t4;
    var time5 = t6-t5;
    var time6 = t7-t6;
    var time7 = t7-t1;

    var timing = "Time taken to get information on faces to remove :"+addTabs(4) + time1.toString() +
        " ms\nTime taken to add vertices from records :"+addTabs(5) + addVTime.toString() +
        " ms\nTime taken to add faces from keptRev records :"+addTabs(5) + addFacesTime.toString() +
        " ms\nTime taken for decoding information on faces, vertices to add :"+addTabs(3) + time2.toString() +
        " ms\nTime taken to get vertices from the old mesh :"+addTabs(5) + time3.toString() +
        " ms\nTime for adding faces from old mesh (Check the list of remove faces) :"+addTabs(2) + time4.toString() +
        " ms\nTime for adding faces new faces (Check list of remove faces ) :"+addTabs(3) + time5.toString()+
        " ms\nTime to generate new inverseMap :"+addTabs(6) + time6.toString() +
        " ms\n"+addTabs(10)+"____________________" +
        " \nTotal time :"+addTabs(9) + time7.toString() + " ms\n"+
        addTabs(10)+"____________________";



//    var rkl = Object.keys(removeFaces);

    return {"vertices": newVerticesHash, "faces":addFaces, "iMap":iMap2, "Time_Data":timing}

}



this.onmessage = function(event){

    //var records = event.data.recs;

    try {
        var data = interpret2(event.data.recs, event.data.vertices, event.data.faces,  event.data.iMap);


        var sData = JSON.stringify(data);
    }
    catch(e){
        this.postMessage(JSON.stringify(e.message));
    }

    this.postMessage(sData);
}

function addTabs(num){
    var tabs = "";
    for(var i=0;i<num; i++){
        tabs = tabs + "\t";
    }
    return tabs;
}

