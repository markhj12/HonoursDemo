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

/*
* Removing faces is done by just setting the value of "add" of the face in the
* list to false */
function removeFace(faces, a,b,c){
    var t,t1;
    var t2 = 0
    var t3 = 0;
    t = peformance.now();
    var idx = faceToString(a,b,c);
    t1 = performance.now();


    var num = 0;
    if(faces[idx] != undefined){
        faces[idx].add = false;
    }
    else{
        idx = faceToString(b,c,a);

        if(faces[idx] != undefined){
            faces[idx].add = false;
        }
        else {
            idx = faceToString(c, a, b);
            if (faces[idx] != undefined) {
                faces[idx].add = false;
            }
            else{
                num = 1;
            }
        }
    }

    return num;


}



function interpret2(jRecs,jVertices,jFaces,jIMap){
    importScripts("HashTable.js");
    var records = JSON.parse(jRecs);


    var oldVertices = JSON.parse(jVertices);

    var oldFaces = JSON.parse(jFaces);
    var iMap = JSON.parse(jIMap);

    var newVerticesHash = new Hashtable();
    var iMap2 = [];


    var faces = [];
    var errorMsg = "Errors : \n";





    var t1 = performance.now();

    /* Add faces from old mesh to list of faces containing addition boolean to determine if
     * the faces should be added to the new mesh */
    oldFaces.forEach(function(oldFace,key) {
        var tFace = new Face(iMap[oldFace.a],iMap[oldFace.b],iMap[oldFace.c]);
        var idx = faceToString(tFace.a, tFace.b, tFace.c);
        faces[idx] = {face: tFace, add: true};

    });

    var t2 = performance.now();

    //Adding old vertices

    iMap.forEach(function(value,key){
        var point = oldVertices[key];
        newVerticesHash.add(value,point);
    });

    var t3 = performance.now();

    var addVtime = 0;
    var addFtime = 0;
    var addKeptRevTime = 0;
    var addRevKeptTime = 0;
    var addOriFaceTime = 0;


    records.forEach(function(record,key){

        var V1idx, V2idx;
        var keptRev, revKept, oriFaces;

        V1idx = record.V1idx;
        V2idx = record.V2idx;

        //Get the new vertices from the list and add them to
        //the list of vertices to be added
        var t31 = performance.now();

        newVerticesHash.add(V2idx,record.point);

        var t32 = performance.now();

        //Use keptRev, revKept and orifaces to add new faces----------
        record.keptRev.forEach(function(face){
            var aFace = new Face(V1idx,V2idx,face);
            var idx = faceToString(V1idx,V2idx,face);
            faces[idx] = {face: aFace,add:true};
        });

        var t33 = performance.now();
        //Add (V2,V1,face) to the new faces
        record.revKept.forEach(function(face){
            var aFace = new Face(V2idx, V1idx, face);
            var idx = faceToString(V2idx, V1idx, face);
            faces[idx] = {face: aFace, add:true};
        });

        var t34 = performance.now();
        record.oriFaces.forEach( function(oriface){
            var aFace = new Face(V2idx,oriface.B,oriface.C);
            var idx = faceToString(V2idx,oriface.B,oriface.C);
            faces[idx] = {face: aFace, add:true};
        });
        var t35 = performance.now();

        addVtime += t32 - t31;
        addFtime += t35-t32;
        addKeptRevTime += t33 - t32;
        addRevKeptTime += t34 - t33;
        addOriFaceTime += t35 - t34;

        //-----------------------------------------------------------
    });



    var t4 = performance.now();

    records.forEach(function(record){
        record.oriFaces.forEach(function(oriFace){
            removeFace(faces,record.V1idx, oriFace.B,oriFace.C);
        });
    });


    //Get the list of faces for the geometry
    var addFaces = [];



    /*
     First add the original faces to the list of add faces, if they are not in the removefaces list
     iMap is used here to convert the faces back to the values based on their index in the original
     refined mesh so they can be compared to the remove faces list
     */


    var t5 = performance.now();

    //Add the new faces to the list of add faces if the value of "add" is true


    for(var key in faces){
        if (faces[key].add) {
            addFaces.push(faces[key].face);
        }

    }

    var t6 = performance.now();


    var count = 0;
    //This variable is determine if the array is a complete array, which should speed up rendering the geometry
    newVerticesHash.items.forEach(function(nVal,nKey){
        if(typeof(nVal) != "undefined"){
            iMap2[count] = nKey;
            count++;
        }
    });





    var t7 = performance.now();
    //var time0 = t1-t0;
    var time1 = t2-t1;
    var time2 = t3-t2;
    var time3 = t4-t3;
    var time4 = t5-t4;
    var time5 = t6-t5;
    var time6 = t7-t6;
    var time7 = t7-t1;

    var timing = "Time taken to get vertices from old mesh :" + addTabs(5) + time2.toString() +
        " ms\nTime taken to get faces from old mesh :"+addTabs(6) + time1.toString() +
        " ms\nTime taken to add vertices from records :"+addTabs(5) + addVtime.toString() +
        " ms\nTime taken to add all faces from records :"+addTabs(5) + addFtime.toString() +

  //      " ms\nTime taken to add faces from keptRev records :"+addTabs(5) + addKeptRevTime.toString() +
  //      " ms\nTime taken to add faces from revKept records :"+addTabs(5) + addRevKeptTime.toString() +
  //      " ms\nTime taken to add faces from oriFace records :"+addTabs(5) + addOriFaceTime.toString() +
  //      " ms\nTotal Time taken to decoding records for faces & vertices to add :"+addTabs(2) + time3.toString() +
        " ms\nTime taken to remove faces (Setting face.add = false, in faces[]) :"+addTabs(2) + time4.toString() +
//        " ms\nTime taken to adding faces which have face.add = true in faces[] :"+addTabs(2) + time5.toString()+
//        " ms\nTime to generate new vertexMap and inverseMap :"+addTabs(5) + time6.toString() +
        " ms\n"+addTabs(10)+"____________________" +
        " \nTotal time :"+addTabs(9) + time7.toString() + " ms\n"+
        addTabs(10)+"____________________";






    return {"vertices": newVerticesHash, "faces":addFaces,"iMap":iMap2, "Time_Data":timing, "error":errorMsg}
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