function OctreeDebug(position, size, accuracy) {
    this.maxDistance = Math.max(size.x, Math.max(size.y, size.z));
    this.accuracy = 0;
    this.root = new OctreeDebug.Cell(this, position, size, 0);
}

OctreeDebug.fromBoundingBox = function (bbox) {
    return new Octree(bbox.min.clone(), bbox.getSize().clone());
};

OctreeDebug.MaxLevel = 8;
OctreeDebug.Depth = 0;
OctreeDebug.prototype.add = function (p, data) {
    this.root.add(p, data);
};

OctreeDebug.prototype.has = function (p) {
    return this.root.has(p);
};

OctreeDebug.prototype.findNearestPoint = function (p, options) {
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

OctreeDebug.prototype.findNearbyPoints = function (p, r, options) {
    options = options || { };
    var result = { points: [], data: [] };
    this.root.findNearbyPoints(p, r, result, options);
    return result;
};

OctreeDebug.prototype.getAllCellsAtLevel = function (cell, level, result) {
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

OctreeDebug.Cell = function (tree, position, size, level) {
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

    if(OctreeDebug.Depth < level){
        OctreeDebug.Depth = level;
    }

};



OctreeDebug.Cell.prototype.has = function (p) {
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

OctreeDebug.Cell.prototype.add = function (p, data) {
    this.points.push(p);
    this.data.push(data);
    if (this.children.length > 0) {
        this.addToChildren(p, data);
    } else {
        if (this.points.length > 8 && this.level < OctreeDebug.MaxLevel) {
            this.split();
        }
    }
};

OctreeDebug.Cell.prototype.addToChildren = function (p, data,output) {
    for (var i = 0; i < this.children.length; i++) {
        if (this.children[i].contains(p)) {
            this.children[i].add(p, data);
            break;
        }
    }

};

OctreeDebug.Cell.prototype.contains = function (p) {
    return p.x >= this.position.x - this.tree.accuracy
        && p.y >= this.position.y - this.tree.accuracy
        && p.z >= this.position.z - this.tree.accuracy
        && p.x < this.position.x + this.size.x + this.tree.accuracy
        && p.y < this.position.y + this.size.y + this.tree.accuracy
        && p.z < this.position.z + this.size.z + this.tree.accuracy;
};

OctreeDebug.Cell.prototype.split = function () {
    var x = this.position.x;
    var y = this.position.y;
    var z = this.position.z;
    var w2 = this.size.x / 2;
    var h2 = this.size.y / 2;
    var d2 = this.size.z / 2;

    this.children.push(new OctreeDebug.Cell(this.tree, new THREE.Vector3(x, y, z), new THREE.Vector3(w2, h2, d2), this.level + 1));
    this.children.push(new OctreeDebug.Cell(this.tree, new THREE.Vector3(x + w2, y, z), new THREE.Vector3(w2, h2, d2), this.level + 1));
    this.children.push(new OctreeDebug.Cell(this.tree, new THREE.Vector3(x, y, z + d2), new THREE.Vector3(w2, h2, d2), this.level + 1));
    this.children.push(new OctreeDebug.Cell(this.tree, new THREE.Vector3(x + w2, y, z + d2), new THREE.Vector3(w2, h2, d2), this.level + 1));
    this.children.push(new OctreeDebug.Cell(this.tree, new THREE.Vector3(x, y + h2, z), new THREE.Vector3(w2, h2, d2), this.level + 1));
    this.children.push(new OctreeDebug.Cell(this.tree, new THREE.Vector3(x + w2, y + h2, z), new THREE.Vector3(w2, h2, d2), this.level + 1));
    this.children.push(new OctreeDebug.Cell(this.tree, new THREE.Vector3(x, y + h2, z + d2), new THREE.Vector3(w2, h2, d2), this.level + 1));
    this.children.push(new OctreeDebug.Cell(this.tree, new THREE.Vector3(x + w2, y + h2, z + d2), new THREE.Vector3(w2, h2, d2), this.level + 1));
    for (var i = 0; i < this.points.length; i++) {
        this.addToChildren(this.points[i], this.data[i],true);
    }


};


OctreeDebug.Cell.prototype.squareDistanceToCenter = function(p) {
    var dx = p.x - (this.center.x);
    var dy = p.y - (this.center.y);
    var dz = p.z - (this.center.z);
    return dx * dx + dy * dy + dz * dz;
}

OctreeDebug.Cell.prototype.findNearestPoint = function (p, options) {
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


    var children = this.children
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

OctreeDebug.Cell.prototype.findNearbyPoints = function (p, r, result, options) {
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

OctreeDebug.prototype.getFrustumPoints = function(frustum,scaleMat){

    var result = [];
    this.root.getFrustumPoints(result,frustum,scaleMat);
    return result;



}

OctreeDebug.Cell.prototype.getFrustumPoints = function(points,frustum){

    if(this.data.length > 0){
        var numCorners = this.numCornersInFrustum(frustum);
        //If all for corners of a cell are in the view frustum or the cell isn't split anymore, just add all the points
        if(numCorners == 8 || this.children.length == 0){
            arrayConcat(points,this.data);
        }
        else if(numCorners > 0 || this.level <= 2){ /*2 is a tolerance level in case the cell is too big that the corners
         and centre are not in the viewing frustum*/
            $.each(this.children,function(k,childCell){
                childCell.getFrustumPoints(points,frustum);
            });
        }
    }

};

OctreeDebug.Cell.prototype.numCornersInFrustum = function(frustum){
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


}/**
 * Created by markhew on 8/30/15.
 */
