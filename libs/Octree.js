function Octree(position, size, maxLevel) {
    this.maxDistance = Math.max(size.x, Math.max(size.y, size.z));
    this.accuracy = 0;
    this.root = new Octree.Cell(this, position, size, 0);
    if(typeof(maxLevel) != 'undefined'){
        Octree.MaxLevel = maxLevel;
    }
    else{
        Octree.MaxLevel = 8;
    }

}

Octree.fromBoundingBox = function (bbox) {
    return new Octree(bbox.min.clone(), bbox.getSize().clone());
};

Octree.Depth = 0;
Octree.prototype.add = function (p, data) {
    this.root.add(p, data);
};

Octree.prototype.getDepth = function(){
    return Octree.Depth;
}

Octree.prototype.has = function (p) {
    return this.root.has(p);
};


Octree.prototype.findNearestPoint = function (p, options) {
    options.includeData = options.includeData ? options.includeData : false;
    options.bestDist = options.maxDist ? options.maxDist : Infinity;
    options.notSelf = options.notSelf ? options.notSelf : false;

    var result = this.root.findNearestPoint(p, options);
    if (result) {
        if (options.includeData) return result;
        else return result.point;
    }
    else return null;
};

Octree.prototype.findNearbyPoints = function (p, r, options) {
    options = options || { };
    var result = { points: [], data: [] };
    this.root.findNearbyPoints(p, r, result, options);
    return result;
};

Octree.prototype.getAllCellsAtLevel = function (cell, level, result) {
    if (typeof level == 'undefined') {
        level = cell;
        cell = this.root;
    }
    result = result || [];
    if (cell.level == level) {
        if (cell.points.length > 0) {
            result.push(cell);
        }
        return result;
    } else {
        cell.children.forEach(function (child) {
            this.getAllCellsAtLevel(child, level, result);
        }.bind(this));
        return result;
    }
};

Octree.Cell = function (tree, position, size, level) {
    this.tree = tree;
    this.position = position;
    this.size = size;
    this.level = level;
    this.points = [];
    this.data = [];
    this.children = [];
    this.corners = [];

    this.corners.push(position);
    this.corners.push(new THREE.Vector3(position.x+size.x, position.y, position.z));
    this.corners.push(new THREE.Vector3(position.x, position.y, position.z+size.z));
    this.corners.push(new THREE.Vector3(position.x+size.x, position.y, position.z+size.z));
    this.corners.push(new THREE.Vector3(position.x, position.y+size.y, position.z));
    this.corners.push(new THREE.Vector3(position.x+size.x, position.y+size.y, position.z));
    this.corners.push(new THREE.Vector3(position.x, position.y+size.y, position.z+size.z));
    this.corners.push(new THREE.Vector3(position.x+size.x, position.y+size.y, position.z+size.z));



    this.center = new THREE.Vector3(position.x + size.x /2 , position.y + size.y /2 , position.z + size.z /2);

    if(Octree.Depth < level){
        Octree.Depth = level;
    }

};



Octree.Cell.prototype.has = function (p) {
    if (!this.contains(p))
        return null;
    if (this.children.length > 0) {
        for (var i = 0; i < this.children.length; i++) {
            var duplicate = this.children[i].has(p);
            if (duplicate) {
                return duplicate;
            }
        }
        return null;
    } else {
        var minDistSqrt = this.tree.accuracy * this.tree.accuracy;
        for (var i = 0; i < this.points.length; i++) {
            var o = this.points[i];
            var distSq = p.squareDistance(o);
            if (distSq <= minDistSqrt) {
                return o;
            }
        }
        return null;
    }
};

Octree.Cell.prototype.add = function (p, data) {
    this.points.push(p);
    this.data.push(data);
    if (this.children.length > 0) {
        this.addToChildren(p, data);
    } else {
        //if (this.points.length > 8 && this.level < Octree.MaxLevel) {
        if(this.level < Octree.MaxLevel){
            this.split();
        }
    }
};

Octree.Cell.prototype.addToChildren = function (p, data) {

    for (var i = 0; i < this.children.length; i++) {
        if (this.children[i].contains(p)) {
            this.children[i].add(p, data);
            break;
        }
    }
};

Octree.Cell.prototype.contains = function (p) {
    return p.x >= this.position.x - this.tree.accuracy
        && p.y >= this.position.y - this.tree.accuracy
        && p.z >= this.position.z - this.tree.accuracy
        && p.x < this.position.x + this.size.x + this.tree.accuracy
        && p.y < this.position.y + this.size.y + this.tree.accuracy
        && p.z < this.position.z + this.size.z + this.tree.accuracy;
};

Octree.Cell.prototype.split = function () {
    var x = this.position.x;
    var y = this.position.y;
    var z = this.position.z;
    var w2 = this.size.x / 2;
    var h2 = this.size.y / 2;
    var d2 = this.size.z / 2;
    this.children.push(new Octree.Cell(this.tree, new THREE.Vector3(x, y, z), new THREE.Vector3(w2, h2, d2), this.level + 1));
    this.children.push(new Octree.Cell(this.tree, new THREE.Vector3(x + w2, y, z), new THREE.Vector3(w2, h2, d2), this.level + 1));
    this.children.push(new Octree.Cell(this.tree, new THREE.Vector3(x, y, z + d2), new THREE.Vector3(w2, h2, d2), this.level + 1));
    this.children.push(new Octree.Cell(this.tree, new THREE.Vector3(x + w2, y, z + d2), new THREE.Vector3(w2, h2, d2), this.level + 1));
    this.children.push(new Octree.Cell(this.tree, new THREE.Vector3(x, y + h2, z), new THREE.Vector3(w2, h2, d2), this.level + 1));
    this.children.push(new Octree.Cell(this.tree, new THREE.Vector3(x + w2, y + h2, z), new THREE.Vector3(w2, h2, d2), this.level + 1));
    this.children.push(new Octree.Cell(this.tree, new THREE.Vector3(x, y + h2, z + d2), new THREE.Vector3(w2, h2, d2), this.level + 1));
    this.children.push(new Octree.Cell(this.tree, new THREE.Vector3(x + w2, y + h2, z + d2), new THREE.Vector3(w2, h2, d2), this.level + 1));
    for (var i = 0; i < this.points.length; i++) {
        this.addToChildren(this.points[i], this.data[i]);
    }


};


Octree.Cell.prototype.squareDistanceToCenter = function(p) {
    var dx = p.x - (this.position.x + this.size.x / 2);
    var dy = p.y - (this.position.y + this.size.y / 2);
    var dz = p.z - (this.position.z + this.size.z / 2);
    return dx * dx + dy * dy + dz * dz;
}

Octree.Cell.prototype.findNearestPoint = function (p, options) {
    var nearest = null;
    var nearestData = null;
    var bestDist = options.bestDist;

    var points = this.points;

    if (points.length > 0 && this.children.length == 0) {
        for (var i = 0; i < points.length; i++) {
            var dist = points[i].distanceTo(p);
            if (dist <= bestDist) {
                if (dist == 0 && options.notSelf)
                    continue;
                bestDist = dist;
                nearest = this.points[i];
                nearestData = this.data[i];
            }
        }
    }


    var children = this.children.slice(0)
        .map(function(child) { return { child: child, dist: child.squareDistanceToCenter(p) } })
        .sort(function(a, b) { return a.dist - b.dist; })
        .map(function(c) { return c.child; });

    if (children.length > 0) {
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            if (child.points.length > 0) {
                if (p.x < child.position.x - bestDist || p.x > child.position.x + child.size.x + bestDist ||
                    p.y < child.position.y - bestDist || p.y > child.position.y + child.size.y + bestDist ||
                    p.z < child.position.z - bestDist || p.z > child.position.z + child.size.z + bestDist
                ) {
                    continue;
                }
                var childNearest = child.findNearestPoint(p, options);
                if (!childNearest || !childNearest.point) {
                    continue;
                }

                var childNearestDist = childNearest.point.distanceTo(p);

                if (childNearestDist < bestDist) {
                    nearest = childNearest.point;
                    bestDist = childNearestDist;
                    nearestData = childNearest.data;
                }
            }
        }
    }
    return {
        point: nearest,
        data: nearestData
    }
};

Octree.Cell.prototype.findNearbyPoints = function (p, r, result, options) {
    var points = this.points;



    if (points.length > 0 && this.children.length == 0) {
        for (var i = 0; i < points.length; i++) {
            var dist = points[i].clone().distanceTo(p);
            if (dist <= r) {
                if (dist == 0 && options.notSelf)
                    continue;
                result.points.push(points[i]);
                if (options.includeData) result.data.push(this.data[i]);
            }
        }
    }

    var children = this.children;

    if (children.length > 0) {
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            if (child.points.length > 0) {
                if (p.x < child.position.x - r || p.x > child.position.x + child.size.x + r ||
                    p.y < child.position.y - r || p.y > child.position.y + child.size.y + r ||
                    p.z < child.position.z - r || p.z > child.position.z + child.size.z + r
                ) {
                    continue;
                }
                child.findNearbyPoints(p, r, result, options);
            }
        }
    }
};

Octree.prototype.getFrustumPoints = function(frustum){

    var result = [];
    this.root.getFrustumPoints(result,frustum);
    return result;



}

Octree.Cell.prototype.getFrustumPoints = function(points,frustum){

    if(this.data.length > 0){
        var numCorners = this.numCornersInFrustum(frustum);
        //If all for corners of a cell are in the view frustum or the cell isn't split anymore, just add all the points
        if(numCorners == 8 || this.children.length == 0){
            if(numCorners > 0) {
                arrayConcat(points, this.data);
            }
        }
        else if(numCorners > 0 || this.level <= 2){ /*2 is a tolerance level in case the cell is too big that the corners
        and centre are not in the viewing frustum*/
            $.each(this.children,function(k,childCell){
                childCell.getFrustumPoints(points,frustum);
            });
        }
    }

};

Octree.Cell.prototype.numCornersInFrustum = function(frustum){
    var numCorners = 0;
    $.each(this.corners, function(idx,corner){
       if(frustum.containsPoint(corner)){
           numCorners ++;
       }
    });
    if(numCorners == 0){
        if(frustum.containsPoint(this.center)){
            numCorners++;
        }
    }
    return numCorners;
};

arrayConcat = function(array1,array2){
        $.each(array2, function(k,v){
            array1.push(v);
        });


}

Octree.prototype.getFrustumCells = function(frustum){
    var cells = this.getAllCellsAtLevel(Octree.Depth);
    var fCells = [];
    var num = 0;
    $.each(cells,function(key,cell){
        if(cell.numCornersInFrustum(frustum)>0 && cell.points.length > 0){
            fCells.push(cell);
        }
    });

    return fCells;
}

Octree.Cell.prototype.addData = function(array){
    $.each(this.data,function(k,d){
       array.push(d);
    });
}

Octree.Cell.prototype.containsIdx = function(index){
    var contains = false;
    $.each(this.data, function( k,d){
        if(d.index == index){
            contains = true;
        }
    });
    return contains;
}

Octree.prototype.getNumCells = function(){
    return this.getAllCellsAtLevel(Octree.Depth).length;
}