/*
Reads the refinement record
*/
function Record(V1,V2,point,keptRev,revKept,oriFaces){
	this.V1idx = V1;
	this.V2idx = V2;
	this.point = point;
	this.keptRev = keptRev;
	this.revKept = revKept;
	this.oriFaces = oriFaces;
}

function RecordNode(record, level){
	this.record = record;
	this.children = [];
	this.parents = [];
	if(record == "Base"){
		this.active = true;
		this.Level = 0;
	}
	else{
		this.active = false;
		this.Level = level;
	}

}

Record.prototype.toString = function() {
	return "V1 index: " + this.V1idx + 
			"\nV2 index: " + this.V2idx +
			"\npoint : " + this.point.x +" , " +this.point.y +" , "+ this.point.z;
};



function OriFace(b,c)
{
	this.B = b;
	this.C = c;
}



function outputRecord(record)
{
	console.log("V1 :"+ record.V1idx);
	console.log("V2 :"+ record.V2idx);

	console.log("point :" + record.point.x + " " + 
		record.point.y + " " + record.point.z);
	console.log("keptRev :" + record.keptRev);
	console.log("revKept :" + record.revKept);

	for(var i=0;i<record.oriFaces.length;i++){
		console.log("oriface :" + record.oriFaces[i].A + " " + record.oriFaces[i].B);
	}
}

var Refinement = function () {
	//Split the data based on lines
	this.parse = function(data){
		var records = [];
		var lines = data.split('\n');
		if($.trim(lines[lines.length-1]) == ""){
			lines.pop();
		}

		//Read each record backwards
		for (var i = lines.length - 1; i >= 0; i--) {

			var line = lines[i];
			//Remove "ref " from the line
			line = line.substr(4);
			var info = line.split(',');


			
			//Reading V1-V2: flag
			var v1v2f = info[0];

			//Get the indexes for "-" and ":" for V1 and V2
			var idx1 = v1v2f.indexOf("-");
			var idx2 = v1v2f.indexOf(":");

			var V1idx = parseInt(v1v2f.substr(0,idx1));
			var V2idx = parseInt(v1v2f.substr(idx1+1));



			var point = new THREE.Vector3(parseFloat(info[1]),
								parseFloat(info[2]),
								parseFloat(info[3]));


			//Reading keptRev, I am assuming for now keptRev is always at offset:4
			//Therefore the int to be starts from offset:5
			var keptRev = [];
			var offset = 5;
			
			while(info[offset] != "revKept"){
				keptRev.push(parseInt(info[offset]));
				offset++;
			}

			
			//add 1 to the offset to account for "revKept"
			offset++;

			//Reading revKept
			var revKept = [];
			while(info[offset] != "oriFace"){
				revKept.push(parseInt(info[offset]));
				offset++;
			}

			//add 1 to the offset to account for "oriFace"
			offset++;

			var oriFaces = [];
			//info.length-1 is due to assumptions that each line ends with a ,
			for(var j=offset; j<info.length-1; j++){
				var faceStr = info[j];

				//Split the face string based on the "-" and store it into an 
				//OriFace object
				var idx3 = faceStr.indexOf("-");
				var faceA = parseInt(faceStr.substr(0,idx3));
				var faceB = parseInt(faceStr.substr(idx3+1));

				oriFaces.push( new OriFace(faceA, faceB));

			}

			//Create a refinement record object to store info and add it the records
			// list
			records.push(new Record(V1idx,V2idx,point,keptRev,revKept,oriFaces));
			
		}	

		//outputRecord(records[0]);
		return records;
	}


}
