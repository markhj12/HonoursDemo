/**
 * Created by markhew on 8/30/15.
 */
testOctree = function(){
    var p1 = new THREE.Vector3(0,0,0);
    var p2 = new THREE.Vector3(1,-1,1);
    var p3 = new THREE.Vector3(1,0,1);
    var p4 = new THREE.Vector3(0,0,1);
    var p5 = new THREE.Vector3(-2,-2,-2);
    var p6 = new THREE.Vector3(0.5,0.5,0.5);
    var p7 = new THREE.Vector3(-1.0,-1);
    var p8 = new THREE.Vector3(1,1,1);
    var p9 = new THREE.Vector3(1,2,3);

    var pts = [p1,p2,p3,p4,p5,p6,p7,p8,p9];

    var p10 = new THREE.Vector3(-2,-2,-2);
    var size = new THREE.Vector3(4,4,4);
    var octree = new OctreeDebug(p10,size);
    $.each(pts,function(k,pt){
        octree.add(pt);
    });

    return octree;
}