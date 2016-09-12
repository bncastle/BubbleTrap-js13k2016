var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var GameObject = (function () {
    //onRemoved:GEvent;
    //onDisabled:(g:GameObject) =>void;
    /**@constructor*/
    function GameObject(x, y) {
        if (x === void 0) { x = 0; }
        if (y === void 0) { y = 0; }
        this.started = false;
        this.name = "Go";
        //higher z is updated/drawn last so will draw over lower z game objects
        this.z = 0;
        this._active = true;
        //this.onRemoved = new GEvent();
        this.x = x;
        this.y = y;
        // this.id = new Date().valueOf();
    }
    Object.defineProperty(GameObject.prototype, "active", {
        get: function () { return this._active; },
        set: function (val) {
            this._active = val;
            // console.log(this.name + " active:" + this._active);
            if (this.started) {
                this.OnActiveChanged(val);
            }
        },
        enumerable: true,
        configurable: true
    });
    // static genId(): string {
    // 	return 'xx-xxxxxxxx-xxxxxx'.replace(new RegExp("x", "g"), function(s: string) {
    // 		//Generates a random number from 0-15 ( the | truncates the floating point part)
    // 		let x = Math.random() * 16 | 0;
    // 		return x.toString(16);
    // 	});
    // }
    //private _Start(){this.started = true;}
    GameObject.prototype.Start = function () { };
    GameObject.prototype.Update = function (dt) { };
    GameObject.prototype.Draw = function (ctx) { };
    GameObject.prototype.OnActiveChanged = function (active) { };
    return GameObject;
}());
var V = (function () {
    function V(x, y) {
        if (x === void 0) { x = 0; }
        if (y === void 0) { y = 0; }
        this.x = x;
        this.y = y;
    }
    V.prototype.Copy = function () {
        return new V(this.x, this.y);
    };
    //Returns a new UNIT vector which is the left-handed normal of this one
    // LHUnitNormal():V{
    //    let mag = this.Mag();
    //    if(mag == 0) return new V(); //:P
    //    return new V(this.y / mag, -this.x / mag);
    // }
    //Projects the vector onto the given
    //unit vector u and returns a vector of that projection
    // Project(u:V):V{
    //     //first, find the scalar projection of this vector onto the unit vector u
    //     let proj:number = this.Dot(u);
    //     //Ok, now multiply our scalar projection onto the unit vector u and return it
    //     return Copy().Mul(proj);
    // }
    //Returns the magnitude of the vector
    V.prototype.Mag = function () {
        //Pythagoras at work (a^2+b^2 = c^2)
        return Math.sqrt((this.x * this.x) + (this.y * this.y));
    };
    //returns the magnitude squared of the vector
    V.prototype.MagSq = function () {
        //Pythagoras at work (a^2+b^2 = c^2)
        return (this.x * this.x) + (this.y * this.y);
    };
    V.prototype.Dot = function (v) {
        return this.x * v.x + this.y * v.y;
    };
    // Dist(v:V):number{
    //     return Math.sqrt(Math.pow(this.x - v.x, 2) + Math.pow(this.y - v.y, 2));
    // }
    // DistSq(v:V):number{
    //     return Math.pow(this.x - v.x, 2) + Math.pow(this.y - v.y, 2);
    // }
    V.prototype.Set = function (x, y) {
        this.x = x;
        this.y = y;
    };
    //negates both x and y values of the vector
    // Neg():V{
    //     this.Set(-this.x, -this.y);
    //     return this;
    // }
    //Multiples the vector by the given scalar amount
    V.prototype.Mul = function (s) {
        this.x *= s;
        this.y *= s;
        return this;
    };
    //subtracs the vector v from this vector
    V.prototype.Sub = function (v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    };
    // Add(v:V, v2:V):V{
    //     this.x += v.x;
    //     this.y += v.y;
    //     return this;
    //  }
    //Makes the vector into a unit vector
    V.prototype.Unit = function () {
        var mag = this.Mag();
        if (mag == 0)
            return this;
        this.x /= mag;
        this.y /= mag;
        return this;
    };
    //cx,cy is the point about which you want to Rotate
    //a is the angle
    V.prototype.Rotate = function (a, cx, cy) {
        if (cx === void 0) { cx = 0; }
        if (cy === void 0) { cy = 0; }
        var rad = a * Math.PI / 180;
        var c = Math.cos(rad);
        var s = Math.sin(rad);
        //translate the x,y point by cx,cy and do the rotation
        var nx = (this.x - cx) * c - (this.y - cy) * s + cx; //add cx back in now
        var ny = (this.x - cx) * s + (this.y - cy) * c + cy; //add cy back in
        // this.x = Math.round(nx);
        // this.y = Math.round(ny);
        this.x = nx;
        this.y = ny;
    };
    return V;
}());
/// <reference path="GameObject.ts" />
/// <reference path="V.ts" />
var PhysicsGameObject = (function (_super) {
    __extends(PhysicsGameObject, _super);
    /**@constructor*/
    function PhysicsGameObject(x, y, v) {
        if (v === void 0) { v = new V(); }
        _super.call(this, x, y);
        this.acc = new V();
        this.impulse = new V();
        this.mass = 1;
        this.maxVel = new V(Number.MAX_VALUE, Number.MAX_VALUE);
        this.minVel = new V(-Number.MAX_VALUE, -Number.MAX_VALUE);
        this.dragMag = new V();
        this.vel = v;
    }
    PhysicsGameObject.prototype.Update = function (dt) {
        var nv = this.vel.Copy().Unit();
        var mag = this.vel.Mag();
        this.dragMag.Set(Math.pow(mag, 2) * globalDrag.x, Math.pow(mag, 2) * globalDrag.y);
        this.vel.x = Clamp(this.vel.x + (this.acc.x + globalAccel.x + (this.impulse.x / this.mass) - this.dragMag.x * nv.x) * dt, this.minVel.x, this.maxVel.x);
        this.vel.y = Clamp(this.vel.y + (this.acc.y + globalAccel.y + (this.impulse.y / this.mass) - this.dragMag.y * nv.y) * dt, this.minVel.y, this.maxVel.y);
        //  console.log(this.vel);
        //reset the instant force vector
        this.impulse.Set(0, 0);
        this.x += this.vel.x * dt;
        //positive velocity goes up but our y coord is backwards so...
        this.y -= this.vel.y * dt;
    };
    PhysicsGameObject.prototype.ApplyImpulse = function (fx, fy) {
        this.impulse.Set(fx, fy);
    };
    return PhysicsGameObject;
}(GameObject));
/// <reference path="./Engine/PhysicsGameObject.ts" />
/// <reference path="./Engine/V.ts" />
var Bubble = (function (_super) {
    __extends(Bubble, _super);
    /**@constructor*/
    function Bubble(x, y, r, c) {
        if (x === void 0) { x = 0; }
        if (y === void 0) { y = 0; }
        if (r === void 0) { r = 0; }
        if (c === void 0) { c = -1; }
        _super.call(this, x, y);
        this.scaleSpeed = Bubble.restScaleSpeed;
        this.scaleMult = Bubble.restScaleMult;
        this.sx = 1;
        this.sy = 1;
        this.theta = 0;
        this.z = LYR_BUBBLE;
        this.name = "bbl";
        this.Set(x, y, r, c);
    }
    Bubble.prototype.Set = function (x, y, r, c) {
        if (c === void 0) { c = -1; }
        this.x = x;
        this.y = y;
        this.radius = r;
        this.mass = r / 100;
        this.scaleSpeed = 0;
        if (c == -1)
            this.c = RndI(startBColorInd, bubbleColors.length);
        else
            this.c = c;
    };
    //Here we allow some bubble overlap before we separate them because that's what bubbles do
    Bubble.prototype.Overlaps = function (other) {
        var distSq = DistSq(this.x, this.y, other.x, other.y);
        if (distSq < Math.pow(this.radius * 0.9 + other.radius * 0.9, 2)) {
            //normalize
            var vec = new V(this.x - other.x, this.y - other.y).Unit();
            var dist = Math.sqrt(distSq);
            //Separate the circles by making this separation vector's length = (this.radius + other.radius - dist)
            vec.x = vec.x * (this.radius * 0.9 + other.radius * 0.9 - dist);
            vec.y = vec.y * (this.radius * 0.9 + other.radius * 0.9 - dist);
            return vec;
        }
        return null;
    };
    Bubble.prototype.OverlapsLine = function (l) {
        //get a unit vector pointing from p1 to p2
        var uLineV = new V(l.x2 - l.x1, l.y2 - l.y1).Unit();
        var lineMag = l.Length();
        //vector pointing from p1 to circle center
        var p1ToC = new V(this.x - l.x1, this.y - l.y1);
        //Now get the scalar projection of p1ToC onto LineV
        var proj = p1ToC.Dot(uLineV);
        //Calc the actual projection vector. This gives us our line segment
        var pv = new V(uLineV.x * proj, uLineV.y * proj);
        //Find the closest point on the line to our circle
        var closestPoint = null;
        if (proj < 0) {
            closestPoint = new V(l.x1, l.y1);
        }
        else if (proj > lineMag) {
            closestPoint = new V(l.x2, l.y2);
        }
        else {
            //Convert our projected vector back to world coordinates
            closestPoint = new V(l.x1 + pv.x, l.y1 + pv.y);
        }
        //Now calculate the distance from the closest point on hte line to the center of our circle
        //if it is < the circle's radius, then we have a penetration and need to separate
        var cToCirc = new V(this.x - closestPoint.x, this.y - closestPoint.y);
        var magCircSq = cToCirc.MagSq();
        //if the magnitude of our vector is < the circle's radius, we're intersecting
        if (magCircSq < this.radius * this.radius) {
            //Calculate the minimum separation vector
            var sep = cToCirc.Unit().Mul(this.radius - Math.sqrt(magCircSq));
            //console.log(nvel);
            // if(proj < 0 || (proj > lineMag)) //did the bubble collide with either end of the line
            //     return new V(-5000, 0);
            // else
            return sep;
        }
        return null;
    };
    Bubble.prototype.Collide = function (other) {
        var sepVector = this.Overlaps(other);
        if (sepVector === null)
            return false;
        this.x += sepVector.x / 2;
        this.y += sepVector.y / 2;
        other.x -= sepVector.x / 2;
        other.y -= sepVector.y / 2;
        // let sepMag = V.Mag(sepVector);
        // if(sepMag /2   > other.radius || sepMag / 2 > this.radius / 2){
        //     Sounds.Play('bglitch');
        // }
        //Perfectly elastic collision
        var norm = new V(other.x - this.x, other.y - this.y).Unit();
        norm.y = -norm.y;
        //let norm = V.Normalize(new V((other.x - this.x), -(other.y - this.y)));
        var p = 2 * (this.vel.Dot(norm) - other.vel.Dot(norm)) / (this.mass + other.mass);
        this.vel.Set(this.vel.x - (p * other.mass) * norm.x, this.vel.y - (p * other.mass) * norm.y);
        other.vel.Set(other.vel.x + (p * this.mass) * norm.x, other.vel.y + (p * this.mass) * norm.y);
        var maxR = (this.radius > other.radius) ? this.radius : other.radius;
        this.Wobble(Bubble.restScaleSpeed + Bubble.restScaleSpeed * 2 * other.radius / maxR, 2 * Bubble.restScaleMult * this.radius / maxR);
        other.Wobble(Bubble.restScaleSpeed + Bubble.restScaleSpeed * 2 * this.radius / maxR, 2 * Bubble.restScaleMult * other.radius / maxR);
        return true;
    };
    Bubble.prototype.Wobble = function (speed, scaleMult) {
        this.scaleSpeed = speed;
        this.scaleMult = scaleMult;
        this.scaleDiff = speed - Bubble.restScaleSpeed;
        this.scaleMultDiff = scaleMult - Bubble.restScaleMult;
    };
    Bubble.prototype.Update = function (dt) {
        _super.prototype.Update.call(this, dt);
        //If the bubble goes off the top of the screen, its gone
        if (this.y < -this.radius) {
            this.e.RemoveBubble(this, false, false);
            return;
        }
        this.theta += 2 * Math.PI * dt * this.scaleSpeed;
        this.sx = 1 + this.scaleMult * Math.sin(0.8 * this.theta);
        this.sy = 1 + this.scaleMult * 0.6 * Math.cos(this.theta);
        if (this.scaleSpeed > Bubble.restScaleSpeed) {
            this.scaleSpeed -= this.scaleDiff / RndI(2, 3) * dt;
            this.scaleMult -= this.scaleMultDiff / 3 * dt;
            if (this.scaleSpeed <= Bubble.restScaleSpeed) {
                this.scaleSpeed = Bubble.restScaleSpeed;
                this.scaleMult = Bubble.restScaleMult;
            }
        }
        //Keep the bubble from wandering off to the left or right of the canvas
        if (this.x - this.radius < 0) {
            if (this.vel.x < -Bubble.minSideEscapeVel) {
                this.vel.x = -this.vel.x;
            }
            else
                this.x = this.radius;
            this.Wobble(Bubble.restScaleSpeed * 3, 2 * Bubble.restScaleMult);
        }
        else if (this.x + this.radius > this.e.c.width) {
            if (this.vel.x > Bubble.minSideEscapeVel) {
                this.vel.x = -this.vel.x;
            }
            else
                this.x = this.e.c.width - this.radius;
        }
        // this.overlappedLine = false;
    };
    Bubble.prototype.Draw = function (ctx) {
        ctx.save();
        var x = this.x;
        var y = this.y;
        ctx.translate(x, y);
        ctx.scale(this.sx, this.sy);
        ctx.translate(-x, -y);
        //Fill the circle first
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = bubbleColors[this.c];
        ctx.beginPath();
        ctx.arc(x, y, this.radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = Bubble.opacity;
        ctx.fillStyle = this.e.backcolor;
        ctx.beginPath();
        ctx.arc(x, y, this.radius * 0.95, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
    };
    //Happy bubbles wobble at this speed
    Bubble.restScaleSpeed = 1;
    //Happy bubbles scale this much centered around 1
    Bubble.restScaleMult = 0.035;
    Bubble.minSideEscapeVel = 2;
    Bubble.opacity = 0.5;
    return Bubble;
}(PhysicsGameObject));
/// <reference path="Engine/GameObject.ts" />
/// <reference path="Engine/V.ts" />
var Polygon = (function () {
    /**@constructor*/
    function Polygon(params) {
        this.c = params.c | 0;
        this.a = (params.a == undefined) ? 0.4 : params.a;
        this.v = (params.v == undefined) ? [] : params.v;
        this.centroid = Polygon.CalculateCentroid(this.v);
    }
    Polygon.prototype.Draw = function (ctx) {
        if (this.v.length < 2)
            return;
        ctx.globalAlpha = this.a;
        ctx.fillStyle = bubbleColors[this.c];
        ctx.beginPath();
        if (this.v.length == 2) {
            ctx.strokeStyle = bubbleColors[this.c];
            ctx.moveTo(this.v[0].x, this.v[0].y);
            ctx.lineTo(this.v[1].x, this.v[1].y);
            ctx.stroke();
        }
        else {
            ctx.moveTo(this.v[0].x, this.v[0].y);
            for (var i = 1; i < this.v.length; i++) {
                ctx.lineTo(this.v[i].x, this.v[i].y);
            }
            ctx.lineTo(this.v[0].x, this.v[0].y);
            ctx.closePath();
            ctx.fill();
        }
    };
    Polygon.prototype.UpdateCentroid = function () {
        this.centroid = Polygon.CalculateCentroid(this.v);
    };
    //Original source: http://alienryderflex.com/polygon/
    Polygon.prototype.InPolygon = function (x, y) {
        var verts = this.v;
        var i = 0;
        var e = verts[verts.length - 1];
        var oddNode = false;
        for (i = 0; i < verts.length; i++) {
            var p = verts[i];
            if ((p.y < y && e.y >= y ||
                e.y < y && p.y >= y) &&
                (p.x <= x || e.x <= x)) {
                oddNode ^= (p.x + (y - p.y) / (e.y - p.y) * (e.x - p.x) < x);
            }
            e = verts[i];
        }
        return oddNode;
    };
    //This checks 5 points of the given Circle
    //to see if it is indeed in the polygon
    //x,y coordinate is the middle of the circle
    Polygon.prototype.CircleInPoly = function (x, y, r) {
        return (this.InPolygon(x, y)
            || this.InPolygon(x, y + r)
            || this.InPolygon(x, y - r)
            || this.InPolygon(x + r, y)
            || this.InPolygon(x - r, y));
    };
    Polygon.CalculateCentroid = function (verts) {
        var centroid = new V();
        for (var i = 0; i < verts.length; i++) {
            centroid.x += verts[i].x;
            centroid.y += verts[i].y;
        }
        centroid.Set(centroid.x / verts.length, centroid.y / verts.length);
        return centroid;
    };
    return Polygon;
}());
/// <reference path="Polygon.ts" />
var BubblePen = (function () {
    function BubblePen(parameters) {
        this.req = parameters.req | 0;
        this.p = new Polygon(parameters.p);
        this.currentNum = 0;
        this.pure = true;
    }
    Object.defineProperty(BubblePen.prototype, "color", {
        get: function () { return this.p.c; },
        set: function (val) { this.p.c = val; },
        enumerable: true,
        configurable: true
    });
    BubblePen.prototype.IsFull = function () {
        return ((this.req <= this.currentNum) && this.pure);
    };
    BubblePen.prototype.Reset = function () { this.currentNum = 0; this.pure = true; };
    BubblePen.prototype.UpdatePenStatus = function (bubbles) {
        this.Reset();
        if (bubbles.length == 0)
            return;
        for (var i = 0; i < bubbles.length; i++) {
            if (this.p.InPolygon(bubbles[i].x, bubbles[i].y)) {
                if (bubbles[i].c == this.p.c) {
                    this.currentNum++;
                }
                else {
                    this.pure = false;
                }
            }
        }
    };
    BubblePen.prototype.Draw = function (ctx) {
        //if the polygon's centroid exists, draw the text
        if (this.p.c != null) {
            //draw the text
            ctx.globalAlpha = 1;
            // ctx.font = this.font;
            ctx.lineWidth = 4;
            //draw the polygon
            this.p.Draw(ctx);
            var s = void 0;
            var f = this.pure ? 'White' : 'DimGray';
            if (this.pure && this.currentNum >= this.req)
                s = 'Complete';
            else if (this.currentNum <= this.req)
                s = this.currentNum + " of " + this.req;
            else
                s = "Full";
            DrawTxt(ctx, s, this.p.centroid.x, this.p.centroid.y, "center", "middle", f);
            if (!this.pure)
                DrawTxt(ctx, "Error!", this.p.centroid.x, this.p.centroid.y + 20, "center", "middle", f);
        }
    };
    return BubblePen;
}());
//Global physics stuff
var globalAccel = new V();
var globalDrag = new V(0.005, 0);
var maxBubbles = 150;
//Index 0 is the "All Bubble" color
var bubbleColors = ['White', 'Gray', 'Yellow', 'Cyan', 'Red', 'Green', 'RoyalBlue', 'Orange'];
var startBColorInd = 2;
var bubbleRad = [15, 25, 35];
var bmaxVel = new V(140, 90);
var bminVel = new V(-140, -90);
var bubbleGrowthRate = 25;
var fanLen = 140;
var PIN_SIZE = 12;
var lvlAllGoodWait = 2; //Time in seconds to wait after level win checks return true
//Layers
var LYR_BUBBLE = 1;
var LYR_LINE = 1;
var LYR_HOPPER = 3;
var LYR_TEXT = 5;
var LYR_BUTTON = 10;
var lineSolid = [1, 0];
var lineDash = [5, 8];
//Editor stuff
var ED_SELECT_DIST = 8;
//Local storage
var ST_LVL = "cl";
//Level Draw Modes
var MODE_EDITOR = 0;
var MODE_GAME = 1;
var MODE_IN_GAME_EDITOR = 2;
var FONT_FAMILY = "Arial";
var LIVE_EDIT_BLINK_TIME = 0.75;
var TITLE_DISPLAY_TIME = 3;
//For text alignment, see: http://www.w3schools.com/tags/canvas_textalign.asp
//valid horizontal align values are: left, center, right
//valid vertical align values are: top, bottom, middle, alphabetic, hanging
function DrawTxt(ctx, txt, x, y, hAlign, vAlign, color, font, alpha) {
    if (hAlign === void 0) { hAlign = "left"; }
    if (vAlign === void 0) { vAlign = "middle"; }
    if (color === void 0) { color = 'White'; }
    if (font === void 0) { font = "20px " + FONT_FAMILY; }
    if (alpha === void 0) { alpha = 1; }
    ctx.globalAlpha = alpha;
    ctx.font = "900 " + font;
    ctx.fillStyle = color;
    ctx.textAlign = hAlign;
    ctx.textBaseline = vAlign;
    ctx.fillText(txt, x, y);
}
//Returns an int between low and high (exclusive)
function RndI(low, high) {
    if (low === void 0) { low = 0; }
    if (high === void 0) { high = 1; }
    return Math.floor((Math.random() * (high - low)) + low);
}
function Clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
}
function DistSq(x1, y1, x2, y2) {
    return (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
}
function InRect(px, py, x, y, w, h) {
    return (px >= x && px <= x + w && py >= y && py <= y + h);
}
function DeserializeArray(jsonObjects, construct) {
    if (jsonObjects == null || construct == null)
        return null;
    var l = [];
    for (var i = 0; i < jsonObjects.length; i++) {
        var nl = construct(jsonObjects[i]);
        l.push(nl);
    }
    return l;
}
//Gets the closest line endpoint to the given coordinates
//returns either 1 or 2 for endpoint 1 or 2, -1 for neither, 3 for the midpoint
//max dist is the max distance away from either endopoint the given point is allowed to be
//if maxDist=-1 then the closest endpoint will be returned regardless (the midpoint will not be considered)
function GetClosestEndpoint(x, y, l, maxDist) {
    if (maxDist === void 0) { maxDist = -1; }
    var dsq1 = DistSq(x, y, l.x1, l.y1);
    var dsq2 = DistSq(x, y, l.x2, l.y2);
    //Calculate middle of line
    var x3 = (l.x1 + l.x2) / 2;
    var y3 = (l.y1 + l.y2) / 2;
    var dsq3 = DistSq(x, y, x3, y3);
    if (maxDist == -1)
        return (dsq1 < dsq2) ? 1 : 2;
    else if (dsq3 < dsq1 && dsq3 < dsq2) {
        if (dsq3 <= maxDist * maxDist)
            return 3;
    }
    else if (dsq1 < dsq2) {
        if (dsq1 <= maxDist * maxDist)
            return 1;
    }
    else if (dsq2 <= maxDist * maxDist) {
        return 2;
    }
    return -1;
}
//returns the closest point on a circle of center (cx,cy) and radius r to the given point(x,y)
function ClosestPointOnCircle(x, y, cx, cy, r) {
    //Get the normal of the vector from circle point to point x,y
    //and multiply the unit vector by the circle's radius
    var ce = new V(x - cx, y - cy).Unit().Mul(r);
    ce.x += cx;
    ce.y += cy;
    return ce;
}
var levels = { Lvls: [
        // {lines:[{x1:201,y1:118,x2:198,y2:374},{x1:201,y1:118,x2:300,y2:193},{x1:298,y1:194,x2:202,y2:257},{x1:202,y1:256,x2:297,y2:317},{x1:297,y1:318,x2:198,y2:374},{x1:315,y1:247,x2:314,y2:361},{x1:315,y1:360,x2:381,y2:360},{x1:380,y1:359,x2:382,y2:245},{x1:422,y1:247,x2:496,y2:295},{x1:497,y1:296,x2:421,y2:362},{x1:502,y1:148,x2:502,y2:356},{x1:504,y1:253,x2:570,y2:283},{x1:570,y1:282,x2:502,y2:355},{x1:585,y1:152,x2:584,y2:360},{x1:619,y1:305,x2:697,y2:302},{x1:699,y1:302,x2:653,y2:256},{x1:653,y1:256,x2:619,y2:306},{x1:619,y1:306,x2:647,y2:360},{x1:647,y1:360,x2:694,y2:335},{x1:311,y1:386,x2:405,y2:388},{x1:353,y1:386,x2:353,y2:508},{x1:399,y1:436,x2:399,y2:508},{x1:400,y1:455,x2:429,y2:435},{x1:429,y1:435,x2:450,y2:449},{x1:478,y1:429,x2:455,y2:508},{x1:463,y1:482,x2:496,y2:481},{x1:478,y1:429,x2:506,y2:508},{x1:539,y1:426,x2:538,y2:506},{x1:539,y1:426,x2:584,y2:455},{x1:584,y1:455,x2:540,y2:475},{x1:421,y1:362,x2:421,y2:148}],bi:[{x:653,y:276,r:15,c:3},{x:640,y:290,r:15,c:3},{x:555,y:452,r:15,c:2},{x:468,y:498,r:15,c:1},{x:493,y:497,r:15,c:1},{x:673,y:291,r:15,c:3},{x:550,y:454,r:15,c:2},{x:479,y:472,r:15,c:1},{x:224,y:165,r:25,c:7},{x:260,y:191,r:25,c:7},{x:224,y:213,r:25,c:7},{x:255,y:316,r:25,c:6},{x:221,y:296,r:25,c:6},{x:218,y:337,r:25,c:6},{x:438,y:320,r:25,c:5},{x:463,y:301,r:25,c:5},{x:445,y:288,r:25,c:5},{x:515,y:319,r:15,c:4},{x:530,y:298,r:15,c:4},{x:518,y:278,r:15,c:4},{x:548,y:289,r:15,c:4}]}
        // ,
        { t: "Plug the Hole", lines: [{ x1: 899, y1: 519, x2: 610, y2: 462 }, { x1: 1, y1: 518, x2: 273, y2: 463 }, { x1: 384, y1: 595, x2: 351, y2: 460 }, { x1: 502, y1: 597, x2: 535, y2: 460 }, { x1: 535, y1: 460, x2: 351, y2: 460 }, { x1: 610, y1: 462, x2: 565, y2: 268 }, { x1: 565, y1: 268, x2: 617, y2: 109 }, { x1: 617, y1: 109, x2: 234, y2: 110 }, { x1: 234, y1: 110, x2: 299, y2: 271 }, { x1: 299, y1: 271, x2: 273, y2: 463 }, { x1: 366, y1: 522, x2: 317, y2: 535 }], pens: [{ req: 5, p: { c: 4, v: [{ x: 235, y: 112 }, { x: 614, y: 110 }, { x: 564, y: 269 }, { x: 299, y: 271 }] } }], hoppers: [{ x: 41, y: 563, c: 2, s: 70, rate: 1, cap: 5, rot: 75 }, { x: 860, y: 563, c: 4, s: 70, rate: 1, cap: 5, rot: 285 }] },
        { t: "Make it Crowded", lines: [{ x1: 444, y1: 307, x2: 508, y2: 441 }, { x1: 508, y1: 441, x2: 383, y2: 441 }, { x1: 444, y1: 307, x2: 383, y2: 441 }, { x1: 492, y1: 408, x2: 608, y2: 236 }, { x1: 398, y1: 410, x2: 288, y2: 241 }, { x1: 310, y1: 153, x2: 591, y2: 153 }, { x1: 591, y1: 153, x2: 608, y2: 236 }, { x1: 288, y1: 241, x2: 310, y2: 153 }], pens: [{ req: 3, p: { c: 6, a: 0.4, v: [{ x: 311, y: 153 }, { x: 589, y: 155 }, { x: 607, y: 235 }, { x: 492, y: 405 }, { x: 443, y: 307 }, { x: 398, y: 407 }, { x: 289, y: 239 }] } }], bi: [{ x: 441, y: 412, r: 15, c: 6 }, { x: 431, y: 385, r: 15, c: 6 }, { x: 457, y: 384, r: 15, c: 6 }, { x: 471, y: 415, r: 15, c: 6 }, { x: 445, y: 360, r: 15, c: 6 }, { x: 419, y: 411, r: 15, c: 6 }] },
        { t: "Dashed Lines Discriminate", lines: [{ x1: 715, y1: 465, x2: 559, y2: 325 }, { x1: 208, y1: 477, x2: 356, y2: 332 }, { x1: 356, y1: 332, x2: 357, y2: 296 }, { x1: 357, y1: 296, x2: 282, y2: 296 }, { x1: 282, y1: 296, x2: 258, y2: 181 }, { x1: 559, y1: 325, x2: 558, y2: 290 }, { x1: 558, y1: 290, x2: 640, y2: 290 }, { x1: 640, y1: 290, x2: 651, y2: 175 }, { x1: 258, y1: 181, x2: 651, y2: 175, ue: true, c: 7, dashed: true }], pens: [{ req: 6, p: { c: 7, v: [{ x: 259, y: 180 }, { x: 650, y: 175 }, { x: 638, y: 288 }, { x: 283, y: 294 }] }, x: 0, y: 0 }], hoppers: [{ x: 405, y: 557, c: 4, rate: 0.5, cap: 5, s: 45 }, { x: 501, y: 557, c: 7, rate: 0.5, cap: 6, s: 45 }] },
        { t: "Popping Pins", pins: [{ x: 539, y: 372, ue: true }, { x: 501, y: 373, ue: true }, { x: 459, y: 374, c: 3, ue: true }, { x: 417, y: 374, c: 3, ue: true }, { x: 383, y: 375, ue: true }, { x: 349, y: 376, ue: true }], lines: [{ x1: 651, y1: 530, x2: 568, y2: 376 }, { x1: 265, y1: 527, x2: 340, y2: 390 }, { x1: 265, y1: 527, x2: 333, y2: 597 }, { x1: 651, y1: 530, x2: 590, y2: 596 }, { x1: 568, y1: 376, x2: 597, y2: 173 }, { x1: 340, y1: 390, x2: 325, y2: 178 }, { x1: 597, y1: 173, x2: 895, y2: 4 }, { x1: 895, y1: 4, x2: 1, y2: 2 }, { x1: 1, y1: 2, x2: 325, y2: 178 }, { x1: 336, y1: 3, x2: 413, y2: 155 }, { x1: 499, y1: 151, x2: 584, y2: 3 }], pens: [{ req: 4, p: { c: 4, v: [{ x: 411, y: 153 }, { x: 324, y: 176 }, { x: 7, y: 2 }, { x: 337, y: 5 }] } }, { req: 4, p: { c: 7, v: [{ x: 339, y: 3 }, { x: 581, y: 4 }, { x: 498, y: 149 }, { x: 412, y: 151 }] } }, { req: 4, p: { c: 6, v: [{ x: 893, y: 4 }, { x: 597, y: 173 }, { x: 500, y: 149 }, { x: 584, y: 6 }] } }], hoppers: [{ x: 411, y: 563, c: 7, s: 70, rate: 1 }, { x: 506, y: 563, c: 3, s: 70, rate: 1 }, { x: 609, y: 521, c: 6, s: 70, rate: 1, rot: -45 }, { x: 309, y: 521, c: 4, s: 70, rate: 1, rot: 45 }] },
        { t: "Pushy", lines: [{ x1: 604, y1: 3, x2: 604, y2: 278 }, { x1: 333, y1: 0, x2: 333, y2: 278 }, { x1: 333, y1: 278, x2: 213, y2: 262 }, { x1: 213, y1: 262, x2: 162, y2: 227 }, { x1: 604, y1: 278, x2: 754, y2: 267 }, { x1: 754, y1: 267, x2: 808, y2: 227 }, { x1: 604, y1: 3, x2: 898, y2: 3 }, { x1: 898, y1: 3, x2: 898, y2: 155 }, { x1: 333, y1: 0, x2: 3, y2: 0 }, { x1: 3, y1: 0, x2: 3, y2: 111 }], pens: [{ req: 5, p: { c: 2, v: [{ x: 604, y: 277 }, { x: 753, y: 267 }, { x: 898, y: 156 }, { x: 898, y: 3 }, { x: 604, y: 3 }] } }, { req: 5, p: { c: 5, v: [{ x: 333, y: 277 }, { x: 213, y: 261 }, { x: 0, y: 111 }, { x: 1, y: 0 }, { x: 333, y: 1 }] } }], fans: [{ f: 40, rot: -90, x: 626, y: 331, ue: true, aLen: 300 }, { f: 40, rot: 90, x: 324, y: 415, ue: true, aLen: 300 }], hoppers: [{ x: 407, y: 561, c: 5, s: 70, rate: 0.5, cap: 5 }, { x: 515, y: 562, c: 2, s: 70, rate: 0.75, cap: 5 }] },
        { t: "Traffic Jam", lines: [{ x1: 0, y1: 595, x2: 898, y2: 595 }, { x1: 764, y1: 0, x2: 551, y2: 205 }, { x1: 901, y1: 174, x2: 615, y2: 274 }, { x1: 140, y1: 0, x2: 355, y2: 209 }, { x1: 0, y1: 127, x2: 283, y2: 281 }, { x1: 900, y1: 495, x2: 615, y2: 274 }, { x1: 780, y1: 596, x2: 551, y2: 318 }, { x1: 0, y1: 462, x2: 283, y2: 281 }, { x1: 358, y1: 324, x2: 132, y2: 594 }, { x1: 447, y1: 0, x2: 447, y2: 213 }, { x1: 900, y1: 1, x2: 0, y2: 0 }, { x1: 448, y1: 310, x2: 448, y2: 596 }], pens: [{ req: 8, p: { c: 4, v: [{ x: 143, y: 2 }, { x: 445, y: 4 }, { x: 447, y: 206 }, { x: 353, y: 207 }] } }, { req: 8, p: { c: 5, v: [{ x: 447, y: 3 }, { x: 761, y: 2 }, { x: 551, y: 203 }, { x: 447, y: 205 }] } }, { req: 8, p: { c: 6, v: [{ x: 134, y: 591 }, { x: 445, y: 593 }, { x: 445, y: 327 }, { x: 356, y: 325 }] } }, { req: 8, p: { c: 2, v: [{ x: 775, y: 592 }, { x: 448, y: 593 }, { x: 446, y: 329 }, { x: 552, y: 320 }] } }], fans: [{ f: 50, rot: -120, x: 717, y: 165, ue: true, c: 6, aLen: 200 }, { f: 50, rot: -405, x: 691, y: 406, ue: true, c: 4, aLen: 200 }, { f: 50, rot: -315, x: 248, y: 366, ue: true, c: 5, aLen: 200 }, { f: 50, rot: -585, x: 210, y: 148, ue: true, c: 2, aLen: 200 }], hoppers: [{ x: 858, y: 47, c: 2, s: 130, rate: 0.5, cap: 8, rot: 225 }, { x: 855, y: 556, c: 5, s: 70, rate: 0.25, cap: 8, rot: 315 }, { x: 48, y: 555, c: 4, s: 70, rate: 0.25, cap: 8, rot: 405 }, { x: 45, y: 47, c: 6, s: 130, rate: 0.5, cap: 8, rot: 495 }] },
        { t: "Factorio", pins: [{ x: 253, y: 262, ue: true }, { x: 259, y: 298, ue: true }, { x: 239, y: 231, c: 6, ue: true }, { x: 264, y: 343, c: 7, ue: true }], lines: [{ x1: 1, y1: 521, x2: 248, y2: 499 }, { x1: 248, y1: 499, x2: 220, y2: 436 }, { x1: 220, y1: 436, x2: 255, y2: 370 }, { x1: 255, y1: 370, x2: 414, y2: 360 }, { x1: 414, y1: 360, x2: 435, y2: 416 }, { x1: 435, y1: 416, x2: 404, y2: 488 }, { x1: 248, y1: 499, x2: 404, y2: 488, ue: true, c: 3, dashed: true }, { x1: 414, y1: 360, x2: 603, y2: 349 }, { x1: 603, y1: 349, x2: 633, y2: 402 }, { x1: 633, y1: 402, x2: 588, y2: 480 }, { x1: 25, y1: 432, x2: 209, y2: 424, ue: true, c: 7, dashed: true }, { x1: 588, y1: 480, x2: 777, y2: 457, ue: true, c: 4 }, { x1: 777, y1: 457, x2: 752, y2: 387 }, { x1: 752, y1: 387, x2: 765, y2: 330 }, { x1: 765, y1: 330, x2: 899, y2: 298 }, { x1: 771, y1: 235, x2: 748, y2: 4 }, { x1: 172, y1: 233, x2: 1, y2: 254 }, { x1: 262, y1: 223, x2: 312, y2: 138 }, { x1: 312, y1: 50, x2: 262, y2: 3 }, { x1: 535, y1: 3, x2: 521, y2: 230 }, { x1: 899, y1: 4, x2: 262, y2: 3 }, { x1: 603, y1: 349, x2: 694, y2: 233, ue: true, c: 2 }, { x1: 262, y1: 223, x2: 521, y2: 230 }, { x1: 521, y1: 230, x2: 694, y2: 233, c: 4, dashed: true }, { x1: 771, y1: 235, x2: 694, y2: 233 }, { x1: 603, y1: 349, x2: 521, y2: 230, c: 6, ue: true }], pens: [{ req: 4, p: { c: 2, v: [{ x: 256, y: 370 }, { x: 412, y: 362 }, { x: 434, y: 415 }, { x: 404, y: 486 }, { x: 247, y: 497 }, { x: 221, y: 437 }] } }, { req: 4, p: { c: 6, v: [{ x: 416, y: 362 }, { x: 603, y: 350 }, { x: 629, y: 403 }, { x: 586, y: 481 }, { x: 407, y: 485 }, { x: 435, y: 416 }] } }, { req: 4, p: { c: 3, v: [{ x: 897, y: 299 }, { x: 766, y: 332 }, { x: 753, y: 388 }, { x: 776, y: 456 }, { x: 898, y: 454 }] } }, { req: 7, p: { c: 7, v: [{ x: 749, y: 5 }, { x: 897, y: 5 }, { x: 898, y: 235 }, { x: 771, y: 235 }] } }, { req: 5, p: { c: 5, v: [{ x: 259, y: 3 }, { x: 532, y: 4 }, { x: 519, y: 229 }, { x: 264, y: 222 }, { x: 311, y: 138 }, { x: 312, y: 50 }] } }, { req: 7, p: { c: 4, v: [{ x: 535, y: 5 }, { x: 748, y: 4 }, { x: 769, y: 234 }, { x: 522, y: 227 }] } }], fans: [{ f: 5, rot: 90, x: 234, y: 556, ue: true, aLen: 380 }, { f: 50, rot: 30, x: 160, y: 331, ue: true, c: 5, aLen: 205 }, { f: 10, rot: -90, x: 756, y: 265, ue: true, c: 6, aLen: 395 }, { f: 40, x: 693, y: 578, aLen: 240, ue: true }], hoppers: [{ x: 38, y: 563, s: 90, rate: 1, rot: 90 }] }
    ] };
var Fan = (function () {
    /**@constructor*/
    function Fan(params) {
        //The polygon inside which the wind force is applied
        this.wp = new Polygon({});
        //The force that it applies to bubbles caught in its wind
        this.f = 1;
        this.rot = 0;
        //blade offset
        this.boff = Fan.bladeOffset;
        this.x = params.x | 0;
        this.y = params.y | 0;
        this.ue = (params.ue == undefined) ? false : params.ue;
        this.c = (params.c == undefined) ? 0 : params.c;
        this.rot = (params.rot == undefined) ? 0 : params.rot;
        this.f = (params.f == undefined) ? 10 : params.f;
        this.aLen = (params.aLen == undefined) ? fanLen : params.aLen;
        //This will become our
        this.blowVec = new V(0, 1);
        //Setup poly for 0 angle rotation
        this.wp = new Polygon({ v: [new V(), new V(), new V(), new V()], a: 0.2, c: this.c });
        this.SetRot(this.rot);
    }
    // SetColor(val:number){this.c = val; this.wp.c = val;}
    //GetRotation():number{return this.rot;}
    Fan.prototype.Recalc = function () { this.SetRot(this.rot); };
    Fan.prototype.SetRot = function (rot) {
        rot = Math.round(rot);
        // if(rot >= 360) rot = rot - 360;
        this.rot = rot;
        var lx = this.x - Fan.width / 2;
        var ly = this.y - Fan.height / 2;
        //reset our unit vector to be the unit vector pointing at the correct rotation
        this.blowVec.Set(Math.sin(rot * Math.PI / 180), Math.cos(rot * Math.PI / 180));
        // console.log(this.blowVec);
        //Calculate where our rotation handle will be now
        this.rp = this.blowVec.Copy();
        this.rp.y = -this.rp.y; //we must reverse y here because our physics y is opposite the graphics y
        this.rp.Mul(60);
        //this.rp.Mul(this.aLen);
        this.rp.Set(this.rp.x + this.x, this.rp.y + this.y);
        //We must reset the polygon's verts to the unrotated values
        this.wp.v[0].Set(lx, ly);
        this.wp.v[1].Set(lx + Fan.width, ly);
        this.wp.v[2].Set(lx + Fan.width, ly - this.aLen);
        this.wp.v[3].Set(lx, ly - this.aLen);
        for (var i = 0; i < this.wp.v.length; i++) {
            this.wp.v[i].Rotate(this.rot, this.x, this.y);
            this.wp.v[i].x = Math.floor(this.wp.v[i].x);
            this.wp.v[i].y = Math.floor(this.wp.v[i].y);
        }
        this.wp.UpdateCentroid();
    };
    //Check if the circle's center is in the polygon'
    //but also include points above , below and to the side of the center
    Fan.prototype.Blow = function (bubbles) {
        for (var i = 0; i < bubbles.length; i++) {
            if ((this.c == bubbles[i].c || this.c < startBColorInd)) {
                if (this.wp.CircleInPoly(bubbles[i].x, bubbles[i].y, bubbles[i].radius))
                    bubbles[i].ApplyImpulse(this.blowVec.x * this.f, this.blowVec.y * this.f);
            }
        }
    };
    Fan.prototype.Update = function (dt) {
        this.boff += Fan.bladeSpeed * dt;
        if (this.boff >= Fan.width - Fan.bladeOffset)
            this.boff = Fan.bladeOffset;
    };
    Fan.prototype.DrawEditGizmos = function (ctx, mode) {
        ctx.globalAlpha = 1;
        if (mode != MODE_GAME) {
            this.wp.c = this.c;
            this.wp.Draw(ctx);
        }
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = bubbleColors[this.c];
        ctx.beginPath();
        ctx.arc(this.rp.x, this.rp.y, ED_SELECT_DIST, 0, 2 * Math.PI);
        ctx.fill();
        //Draw a line from the center dot to the rotate dot
        ctx.strokeStyle = 'rgba(128, 128, 128, 0.4)';
        ctx.moveTo(this.rp.x, this.rp.y);
        ctx.lineTo(this.x, this.y);
        ctx.stroke();
        //Draw the center rect to indicate this object is user-editable
        if (this.ue) {
            ctx.beginPath();
            ctx.rect(this.x - ED_SELECT_DIST * 2, this.y - ED_SELECT_DIST * 2, ED_SELECT_DIST * 4, ED_SELECT_DIST * 4);
            ctx.fill();
        }
        //Draw editor info
        if (mode == MODE_EDITOR) {
            DrawTxt(ctx, "L:" + this.aLen + "\nF:" + this.f, this.wp.centroid.x, this.wp.centroid.y, 'center');
        }
    };
    Fan.prototype.Draw = function (ctx, drawPoly) {
        if (drawPoly === void 0) { drawPoly = false; }
        //Calculate the upper left vert
        var lx = this.x - Fan.width / 2;
        var cy = this.y - Fan.height / 2;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.rot) * Math.PI / 180);
        ctx.translate(-this.x, -this.y);
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = bubbleColors[this.c];
        ctx.fillRect(lx, cy, Fan.width, Fan.height);
        // ctx.strokeRect(this.gameObject.pos.x, this.gameObject.pos.y, 20, 50));
        //Fan shaft (from the middle to the back)
        ctx.globalAlpha = 1;
        ctx.lineCap = 'butt';
        ctx.strokeStyle = "#4F4F4F";
        ctx.beginPath();
        ctx.moveTo(lx + Fan.width / 2, cy + Fan.height / 2);
        ctx.lineTo(lx + Fan.width / 2, cy + Fan.height);
        ctx.stroke();
        //Front of the fan
        ctx.strokeStyle = bubbleColors[this.c];
        ctx.lineCap = 'round';
        ctx.setLineDash(lineSolid);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(lx, cy);
        ctx.lineTo(lx + Fan.width, cy);
        ctx.stroke();
        //The fan blade
        ctx.beginPath();
        ctx.fillStyle = "#dFdFdF";
        ctx.rect(lx + this.boff, cy + Fan.height / 2 - Fan.bladeWidth / 2, Fan.width / 2 - this.boff, Fan.bladeWidth);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = "#5F5F5F";
        ctx.rect(lx + Fan.width / 2, cy + Fan.height / 2 - Fan.bladeWidth / 2, Fan.width / 2 - this.boff, Fan.bladeWidth);
        ctx.fill();
        ctx.restore();
    };
    Fan.width = 60;
    Fan.height = 15;
    Fan.bladeSpeed = Fan.width * 10;
    Fan.bladeOffset = Math.floor(Fan.width * 0.05);
    Fan.bladeWidth = Math.floor(Fan.height * .5);
    return Fan;
}());
/// <reference path="Engine/V.ts" />
/// <reference path="Polygon.ts" />
/// <reference path="Bubble.ts" />
var Hopper = (function (_super) {
    __extends(Hopper, _super);
    function Hopper(params) {
        _super.call(this);
        this.aimVec = new V();
        this.x = params.x | 0;
        this.y = params.y | 0;
        this.c = params.c | 0;
        this.z = LYR_HOPPER;
        this.rate = (params.rate == undefined || params.rate == 0) ? 1 : params.rate;
        this.cap = (params.cap == undefined) ? -1 : params.cap;
        this.curNum = this.cap;
        this.s = (params.s == undefined) ? 5 : params.s;
        this.rot = (params.rot == undefined) ? 0 : params.rot;
        this.timer = 1 / this.rate;
        //Setup the polygon (if the color is)
        this.p = new Polygon({ v: [new V(), new V(), new V(), new V()], a: 1, c: (this.c == 0) ? 1 : this.c });
        this.SetRot(this.rot);
    }
    //This lets us override the default behavior of JSON.stringify for this object
    Hopper.prototype.toJSON = function () {
        return {
            x: this.x,
            y: this.y,
            c: this.c,
            s: this.s,
            rate: this.rate,
            cap: this.cap == -1 ? undefined : this.cap,
            rot: this.rot
        };
    };
    Hopper.prototype.SetColor = function (val) { this.c = val; this.p.c = (val == 0) ? 1 : val; };
    Hopper.prototype.Recalc = function () { this.SetRot(this.rot); };
    //Reset the hopper to have the starting # of bubbles
    Hopper.prototype.Reset = function () { this.curNum = this.cap; this.timer = 1 / this.rate; };
    Hopper.prototype.SetRot = function (rot) {
        rot = Math.round(rot);
        this.rot = rot;
        //Set our aim 
        this.aimVec.Set(Math.sin(rot * Math.PI / 180), Math.cos(rot * Math.PI / 180));
        //lx,ly will be bottom left corner
        var lx = this.x - Hopper.bw / 2;
        var ly = this.y + Hopper.h / 2;
        //Reset the polygon's verts to the unrotated values
        this.p.v[0].Set(lx, ly);
        this.p.v[1].Set(lx + Hopper.bw, ly);
        this.p.v[2].Set(lx + Hopper.tw, ly - Hopper.h);
        this.p.v[3].Set(lx - (Hopper.tw - Hopper.bw), ly - Hopper.h);
        //Now calculate the new vertex positions for the rotation
        for (var i = 0; i < this.p.v.length; i++) {
            this.p.v[i].Rotate(this.rot, this.x, this.y);
            this.p.v[i].x = Math.floor(this.p.v[i].x);
            this.p.v[i].y = Math.floor(this.p.v[i].y);
        }
        this.p.UpdateCentroid();
    };
    Hopper.prototype.Update = function (dt) {
        if (this.e.modal.active)
            return;
        if (this.timer > 0) {
            this.timer -= dt;
            if (this.timer <= 0) {
                if (this.curNum > 0)
                    this.curNum--;
                if ((this.curNum > 0 || this.curNum == -1))
                    this.timer = 1 / this.rate;
                //Make a bubble
                var b = null;
                if (this.c == 0)
                    b = this.e.NewBubble(this.x, this.y, bubbleRad[RndI(0, bubbleRad.length)]);
                else
                    b = this.e.NewBubble(this.x, this.y, bubbleRad[RndI(0, bubbleRad.length)], this.c);
                if (b != null) {
                    b.vel.Set(this.aimVec.x * this.s, this.aimVec.y * this.s);
                    //play bubble sound
                    Sounds.Play('bubble' + RndI(0, 3)); // + RndI(1,4));
                }
            }
        }
    };
    Hopper.prototype.DrawEditGizmos = function (ctx, mode) {
        if (mode == MODE_EDITOR) {
            DrawTxt(ctx, "r:" + this.rate + " s:" + this.s, this.x, this.y + Hopper.h / 2, 'center', 'top');
        }
    };
    Hopper.prototype.Draw = function (ctx, mode) {
        // ctx.fillStyle = this._c;
        // ctx.beginPath();
        // ctx.arc(this.x,this.y,3, 0, 2 * Math.PI);
        // ctx.fill();
        if (mode === void 0) { mode = MODE_GAME; }
        this.p.Draw(ctx);
        ctx.setLineDash(lineSolid);
        ctx.strokeStyle = 'DarkGray';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.p.v[0].x, this.p.v[0].y);
        for (var i = 1; i < this.p.v.length; i++) {
            ctx.lineTo(this.p.v[i].x, this.p.v[i].y);
        }
        ctx.lineTo(this.p.v[0].x, this.p.v[0].y);
        ctx.stroke();
        //Draw the hopper capacity
        if (this.curNum != -1 && mode != MODE_EDITOR) {
            DrawTxt(ctx, this.curNum.toString(), this.p.centroid.x, this.p.centroid.y, 'center', 'middle', (this.p.c < 3) ? 'Black' : 'White');
        }
        else if (this.cap != -1 && mode == MODE_EDITOR) {
            DrawTxt(ctx, this.cap.toString(), this.p.centroid.x, this.p.centroid.y, 'center', 'middle', (this.p.c < 3) ? 'Black' : 'White');
        }
    };
    //hopper height
    Hopper.h = 70;
    //hopper's top width
    Hopper.tw = 70;
    //hopper's bottom width
    Hopper.bw = 50;
    return Hopper;
}(GameObject));
/// <reference path="Engine/GameObject.ts" />
var Pin = (function () {
    //rot:number;
    function Pin(params) {
        this.x = params.x | 0;
        this.y = params.y | 0;
        this.c = params.c | 0;
        this.ue = (params.ue == undefined) ? false : params.ue;
        //this.rot = Math.random() * Math.PI;
    }
    Pin.prototype.CollideBubble = function (b) {
        //Only pop bubbles if they're the same color as me or i'm the "All bubble" color
        if (this.c == 0 || this.c == b.c) {
            //Treat the pin like it is a circle
            var magSq = DistSq(this.x, this.y, b.x, b.y);
            if (magSq <= b.radius * b.radius + (PIN_SIZE * PIN_SIZE))
                return true;
        }
        return false;
    };
    // Update(dt:number){
    //     this.rot += 2 * Math.PI * dt;
    // }
    Pin.prototype.DrawEditGizmos = function (ctx, mode) {
        if (this.ue && mode != MODE_GAME) {
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = bubbleColors[this.c];
            ctx.beginPath();
            ctx.arc(this.x, this.y, ED_SELECT_DIST * 1.5, 0, 2 * Math.PI);
            ctx.fill();
        }
    };
    Pin.prototype.Draw = function (ctx) {
        //ctx.save();
        // ctx.translate(this.x, this.y);
        // ctx.rotate(this.rot);
        // ctx.translate(-this.x, -this.y);
        //
        // ctx.globalAlpha = 1;
        // ctx.fillStyle = G.bubbleColors[this.c];
        // ctx.beginPath();
        // ctx.arc(this.x,this.y, G.PIN_SIZE / 4, 0, 2 * Math.PI);
        // ctx.fill();  
        //Draw the cross
        ctx.globalAlpha = 1;
        ctx.lineWidth = 3;
        ctx.setLineDash(lineSolid);
        ctx.beginPath();
        ctx.strokeStyle = bubbleColors[this.c];
        ctx.moveTo(this.x - PIN_SIZE / 2, this.y);
        ctx.lineTo(this.x + PIN_SIZE / 2, this.y);
        ctx.moveTo(this.x, this.y - PIN_SIZE / 2);
        ctx.lineTo(this.x, this.y + PIN_SIZE / 2);
        ctx.stroke();
        //ctx.restore();
    };
    return Pin;
}());
var Line = (function () {
    /**@constructor*/
    function Line(params) {
        this.x1 = params.x1 | 0;
        this.y1 = params.y1 | 0;
        this.x2 = params.x2 | 0;
        this.y2 = params.y2 | 0;
        this.ue = (params.ue == undefined) ? false : params.ue;
        this.c = params.c | 0;
        this.dashed = (params.dashed == undefined) ? false : params.dashed;
    }
    Line.prototype.DrawEditGizmos = function (ctx) {
        var x3 = (this.x1 + this.x2) / 2;
        var y3 = (this.y1 + this.y2) / 2;
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = bubbleColors[this.c];
        ctx.beginPath();
        ctx.arc(this.x1, this.y1, ED_SELECT_DIST, 0, 2 * Math.PI);
        ctx.arc(this.x2, this.y2, ED_SELECT_DIST, 0, 2 * Math.PI);
        //Draw middle
        if (this.ue) {
            ctx.fill();
            ctx.beginPath();
            ctx.rect(x3 - ED_SELECT_DIST, y3 - ED_SELECT_DIST, ED_SELECT_DIST * 2, ED_SELECT_DIST * 2);
        }
        ctx.fill();
    };
    Line.prototype.Length = function () {
        return Math.sqrt(DistSq(this.x1, this.y1, this.x2, this.y2));
    };
    Line.prototype.Draw = function (ctx) {
        ctx.globalAlpha = 1;
        ctx.lineWidth = 3;
        ctx.lineCap = 'butt';
        if (this.dashed)
            ctx.setLineDash(lineDash);
        else
            ctx.setLineDash(lineSolid);
        ctx.beginPath();
        ctx.strokeStyle = bubbleColors[this.c];
        ctx.moveTo(this.x1, this.y1);
        ctx.lineTo(this.x2, this.y2);
        ctx.stroke();
    };
    return Line;
}());
/// <reference path="Pin.ts" />
/// <reference path="Line.ts" />
/// <reference path="Hopper.ts" />
var Level = (function () {
    /**@constructor*/
    function Level(params) {
        this.t = params.t;
        this.pins = (params.pins == undefined) ? [] : DeserializeArray(params.pins, function (p) { return new Pin(p); });
        this.lines = (params.lines == undefined) ? [] : DeserializeArray(params.lines, function (p) { return new Line(p); });
        this.pens = (params.pens == undefined) ? [] : DeserializeArray(params.pens, function (p) { return new BubblePen(p); });
        this.fans = (params.fans == undefined) ? [] : DeserializeArray(params.fans, function (p) { return new Fan(p); });
        this.hoppers = (params.hoppers == undefined) ? [] : DeserializeArray(params.hoppers, function (p) { return new Hopper(p); });
        this.bi = (params.bi == undefined) ? [] : params.bi;
    }
    Level.prototype.SetEngine = function (e) {
        //Add the hoppers if any exist for this level
        for (var i = 0; i < this.hoppers.length; i++) {
            e.Add(this.hoppers[i]);
        }
        //Add any bubbles that are supposed to be on this level too
        for (var i = 0; i < this.bi.length; i++) {
            e.NewBubble(this.bi[i].x, this.bi[i].y, this.bi[i].r, this.bi[i].c);
        }
    };
    //Reset anything on the level to its pre-run state
    Level.prototype.Reset = function () {
        //reset any hoppers that may not be unlimited
        for (var i = 0; i < this.hoppers.length; i++) {
            this.hoppers[i].Reset();
        }
        //also reset any bubblePins
        for (var i = 0; i < this.pens.length; i++) {
            this.pens[i].Reset();
        }
    };
    Level.prototype.Destroy = function (e) {
        if (!e)
            return;
        for (var i = 0; i < this.hoppers.length; i++) {
            e.Remove(this.hoppers[i]);
        }
    };
    Level.prototype.Update = function (dt) {
        // for(let i = 0; i < this.pins.length; i++){
        //     this.pins[i].Update(dt);
        // }
        for (var i = 0; i < this.fans.length; i++) {
            this.fans[i].Update(dt);
        }
    };
    Level.prototype.Interact = function (bubbles) {
        for (var i = 0; i < this.fans.length; i++) {
            this.fans[i].Blow(bubbles);
        }
    };
    //returns tru is there are any bubble pins in this level
    Level.prototype.AnyPins = function () {
        return this.pens.length > 0;
    };
    Level.prototype.AllPensGood = function () {
        for (var i = 0; i < this.pens.length; i++) {
            if (!this.pens[i].IsFull())
                return false;
        }
        return true;
    };
    Level.prototype.Draw = function (ctx, mode) {
        for (var i = 0; i < this.lines.length; i++) {
            this.lines[i].Draw(ctx);
            if (mode == MODE_IN_GAME_EDITOR && this.lines[i].ue)
                this.lines[i].DrawEditGizmos(ctx);
        }
        for (var i = 0; i < this.pens.length; i++) {
            this.pens[i].Draw(ctx);
        }
        for (var i = 0; i < this.pins.length; i++) {
            this.pins[i].DrawEditGizmos(ctx, mode);
            this.pins[i].Draw(ctx);
        }
        for (var i = 0; i < this.fans.length; i++) {
            this.fans[i].Draw(ctx);
            if ((mode == MODE_IN_GAME_EDITOR && this.fans[i].ue) || mode == MODE_EDITOR)
                this.fans[i].DrawEditGizmos(ctx, mode);
        }
        if (mode != MODE_GAME) {
            for (var i = 0; i < this.bi.length; i++) {
                var bloc = this.bi[i];
                //Fill the circle first
                ctx.globalCompositeOperation = 'lighter';
                ctx.globalAlpha = 0.8;
                ctx.fillStyle = bubbleColors[this.bi[i].c];
                ctx.beginPath();
                ctx.arc(bloc.x, bloc.y, bloc.r, 0, 2 * Math.PI);
                ctx.fill();
                ctx.globalCompositeOperation = 'source-over';
                ctx.globalAlpha = Bubble.opacity;
                ctx.fillStyle = 'black';
                ctx.beginPath();
                ctx.arc(bloc.x, bloc.y, bloc.r * 0.95, 0, 2 * Math.PI);
                ctx.fill();
            }
            //cheat and draw the hoppers even though they are not in the engine's gameobject list
            for (var i = 0; i < this.hoppers.length; i++) {
                this.hoppers[i].Draw(ctx, mode);
                this.hoppers[i].DrawEditGizmos(ctx, mode);
            }
        }
    };
    return Level;
}());
// JSfxr
// 2016: Modified from: https://github.com/mneubrand/jsfxr
// and ported to Typescript by Bryan Castleberry
//
/**
 * SfxrSynth
 *
 * Copyright 2010 Thomas Vian
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @author Thomas Vian
 */
/**
 * Parameters for an Sfxr sound
 * Parses a settings array into the parameters
 * @param array Array of the settings values, where elements 0 - 23 are
 *                a: waveType
 *                b: attackTime
 *                c: sustainTime
 *                d: sustainPunch
 *                e: decayTime
 *                f: startFrequency
 *                g: minFrequency
 *                h: slide
 *                i: deltaSlide
 *                j: vibratoDepth
 *                k: vibratoSpeed
 *                l: changeAmount
 *                m: changeSpeed
 *                n: squareDuty
 *                o: dutySweep
 *                p: repeatSpeed
 *                q: phaserOffset
 *                r: phaserSweep
 *                s: lpFilterCutoff
 *                t: lpFilterCutoffSweep
 *                u: lpFilterResonance
 *                v: hpFilterCutoff
 *                w: hpFilterCutoffSweep
 *                x: masterVolume
 * @return If the string successfully parsed
 */
var JSfxrParams = (function () {
    /**@constructor*/
    function JSfxrParams(parameters) {
        for (var i = 0; i < 24; i++) {
            this[String.fromCharCode(97 + i)] = parameters[i] || 0;
        }
        if (this['c'] < 0.01)
            this['c'] = 0.01;
        //Calculate total time
        var totalTime = this['b'] + this['c'] + this['e'];
        if (totalTime < 0.18) {
            var mul = 0.18 / totalTime;
            this['b'] *= mul;
            this['c'] *= mul;
            this['e'] *= mul;
        }
    }
    return JSfxrParams;
}());
var JSfxr = (function () {
    function JSfxr() {
    }
    /**@constructor*/
    //constructor(){ }
    // public static CreateWave(settings:JSfxrParams):string {
    //     let synth = new JSfxr();
    //     synth._params = settings;
    //     let envelopeFullLength:number = synth.Reset();
    //     let data:Uint8Array = new Uint8Array(((envelopeFullLength + 1) / 2 | 0) * 4 + 44);
    //     let dv:Uint32Array = new Uint32Array(data.buffer, 0, 44);
    //     let used:number = synth.SynthWaveData(new Uint16Array(data.buffer,  44), envelopeFullLength) * 2;
    //     //Initialize the header
    //     synth.InitializeHeader(dv, used);
    //     used += 44; //The header is 44 bytes
    //     // console.log("Used: " + used);
    //     return JSfxr.B64Enc(data, used);
    // }
    JSfxr.CreateWaveData = function (settings) {
        var synth = new JSfxr();
        synth._params = settings;
        var envelopeFullLength = synth.Reset();
        var data = new Uint8Array(((envelopeFullLength + 1) / 2 | 0) * 4 + 44);
        var used = synth.SynthWaveData(new Uint16Array(data.buffer, 44), envelopeFullLength) * 2;
        var dv = new Uint32Array(data.buffer, 0, 44);
        synth.InitializeHeader(dv, used);
        return data.buffer;
    };
    JSfxr.prototype.InitializeHeader = function (data, used) {
        // Initialize header
        data[0] = 0x46464952; // "RIFF"
        data[1] = used + 36; // put total size here
        data[2] = 0x45564157; // "WAVE"
        data[3] = 0x20746D66; // "fmt "
        data[4] = 0x00000010; // size of the following
        data[5] = 0x00010001; // Mono: 1 channel, PCM format
        data[6] = 0x0000AC44; // 44,100 samples per second
        data[7] = 0x00015888; // byte rate: two bytes per sample
        data[8] = 0x00100002; // 16 bits per sample, aligned on every two bytes
        data[9] = 0x61746164; // "data"
        data[10] = used; // put number of samples here        
    };
    //Resets the running variables from the params
    //Used once at the start (total reset) and for the repeat effect (partial reset)
    //
    JSfxr.prototype.PartialReset = function () {
        var p = this._params;
        this._period = 100 / (p['f'] * p['f'] + .001);
        this._maxPeriod = 100 / (p['g'] * p['g'] + .001);
        this._slide = 1 - p['h'] * p['h'] * p['h'] * .01;
        this._deltaSlide = -p['i'] * p['i'] * p['i'] * .000001;
        if (!p['a']) {
            this._squareDuty = .5 - p['n'] / 2;
            this._dutySweep = -p['o'] * .00005;
        }
        this._changeAmount = 1 + p['l'] * p['l'] * (p['l'] > 0 ? -.9 : 10);
        this._changeTime = 0;
        this._changeLimit = p['m'] == 1 ? 0 : (1 - p['m']) * (1 - p['m']) * 20000 + 32;
    };
    JSfxr.prototype.Reset = function () {
        this.PartialReset();
        var p = this._params;
        // Calculating the length is all that remained here, everything else moved somewhere
        this._envelopeLength0 = p['b'] * p['b'] * 100000;
        this._envelopeLength1 = p['c'] * p['c'] * 100000;
        this._envelopeLength2 = p['e'] * p['e'] * 100000 + 12;
        // Full length of the volume envelop (and therefore sound)
        // Make sure the length can be divided by 3 so we will not need the padding "==" after base64 encode
        return ((this._envelopeLength0 + this._envelopeLength1 + this._envelopeLength2) / 3 | 0) * 3;
    };
    //Writes the wave to the supplied buffer ByteArray
    //@param buffer A ByteArray to write the wave to
    //@return If the wave is finished
    JSfxr.prototype.SynthWaveData = function (buffer, length) {
        // Shorter reference
        var p = this._params;
        // If the filters are active
        var _filters = p['s'] != 1 || p['v'], 
        // Cutoff multiplier which adjusts the amount the wave position can move
        _hpFilterCutoff = p['v'] * p['v'] * .1, 
        // Speed of the high-pass cutoff multiplier
        _hpFilterDeltaCutoff = 1 + p['w'] * .0003, 
        // Cutoff multiplier which adjusts the amount the wave position can move
        _lpFilterCutoff = p['s'] * p['s'] * p['s'] * .1, 
        // Speed of the low-pass cutoff multiplier
        _lpFilterDeltaCutoff = 1 + p['t'] * .0001, 
        // If the low pass filter is active
        _lpFilterOn = p['s'] != 1, 
        // masterVolume * masterVolume (for quick calculations)
        _masterVolume = p['x'] * p['x'], 
        // Minimum frequency before stopping
        _minFreqency = p['g'], 
        // If the phaser is active
        _phaser = p['q'] || p['r'], 
        // Change in phase offset
        _phaserDeltaOffset = p['r'] * p['r'] * p['r'] * .2, 
        // Phase offset for phaser effect
        _phaserOffset = p['q'] * p['q'] * (p['q'] < 0 ? -1020 : 1020), 
        // Once the time reaches this limit, some of the    iables are reset
        _repeatLimit = p['p'] ? ((1 - p['p']) * (1 - p['p']) * 20000 | 0) + 32 : 0, 
        // The punch factor (louder at begining of sustain)
        _sustainPunch = p['d'], 
        // Amount to change the period of the wave by at the peak of the vibrato wave
        _vibratoAmplitude = p['j'] / 2, 
        // Speed at which the vibrato phase moves
        _vibratoSpeed = p['k'] * p['k'] * .01, 
        // The type of wave to generate
        _waveType = p['a'];
        var _envelopeLength = this._envelopeLength0, // Length of the current envelope stage
        _envelopeOverLength0 = 1 / this._envelopeLength0, // (for quick calculations)
        _envelopeOverLength1 = 1 / this._envelopeLength1, // (for quick calculations)
        _envelopeOverLength2 = 1 / this._envelopeLength2; // (for quick calculations)
        // Damping muliplier which restricts how fast the wave position can move
        var _lpFilterDamping = 5 / (1 + p['u'] * p['u'] * 20) * (.01 + _lpFilterCutoff);
        if (_lpFilterDamping > .8) {
            _lpFilterDamping = .8;
        }
        _lpFilterDamping = 1 - _lpFilterDamping;
        var _finished = false, // If the sound has finished
        _envelopeStage = 0, // Current stage of the envelope (attack, sustain, decay, end)
        _envelopeTime = 0, // Current time through current enelope stage
        _envelopeVolume = 0, // Current volume of the envelope
        _hpFilterPos = 0, // Adjusted wave position after high-pass filter
        _lpFilterDeltaPos = 0, // Change in low-pass wave position, as allowed by the cutoff and damping
        _lpFilterOldPos, // Previous low-pass wave position
        _lpFilterPos = 0, // Adjusted wave position after low-pass filter
        _periodTemp, // Period modified by vibrato
        _phase = 0, // Phase through the wave
        _phaserInt, // Integer phaser offset, for bit maths
        _phaserPos = 0, // Position through the phaser buffer
        _pos, // Phase expresed as a Number from 0-1, used for fast sin approx
        _repeatTime = 0, // Counter for the repeats
        _sample, // Sub-sample calculated 8 times per actual sample, averaged out to get the super sample
        _superSample, // Actual sample writen to the wave
        _vibratoPhase = 0; // Phase through the vibrato sine wave
        // Buffer of wave values used to create the out of phase second wave
        var _phaserBuffer = new Array(1024), 
        // Buffer of random values used to generate noise
        _noiseBuffer = new Array(32);
        for (var i = _phaserBuffer.length; i--;) {
            _phaserBuffer[i] = 0;
        }
        for (var i = _noiseBuffer.length; i--;) {
            _noiseBuffer[i] = Math.random() * 2 - 1;
        }
        for (var i = 0; i < length; i++) {
            if (_finished) {
                return i;
            }
            // Repeats every _repeatLimit times, partially resetting the sound parameters
            if (_repeatLimit) {
                if (++_repeatTime >= _repeatLimit) {
                    _repeatTime = 0;
                    this.PartialReset();
                }
            }
            // If _changeLimit is reached, shifts the pitch
            if (this._changeLimit) {
                if (++this._changeTime >= this._changeLimit) {
                    this._changeLimit = 0;
                    this._period *= this._changeAmount;
                }
            }
            // Acccelerate and apply slide
            this._slide += this._deltaSlide;
            this._period *= this._slide;
            // Checks for frequency getting too low, and stops the sound if a minFrequency was set
            if (this._period > this._maxPeriod) {
                this._period = this._maxPeriod;
                if (_minFreqency > 0) {
                    _finished = true;
                }
            }
            _periodTemp = this._period;
            // Applies the vibrato effect
            if (_vibratoAmplitude > 0) {
                _vibratoPhase += _vibratoSpeed;
                _periodTemp *= 1 + Math.sin(_vibratoPhase) * _vibratoAmplitude;
            }
            _periodTemp |= 0;
            if (_periodTemp < 8) {
                _periodTemp = 8;
            }
            // Sweeps the square duty
            if (!_waveType) {
                this._squareDuty += this._dutySweep;
                if (this._squareDuty < 0) {
                    this._squareDuty = 0;
                }
                else if (this._squareDuty > .5) {
                    this._squareDuty = .5;
                }
            }
            // Moves through the different stages of the volume envelope
            if (++_envelopeTime > _envelopeLength) {
                _envelopeTime = 0;
                switch (++_envelopeStage) {
                    case 1:
                        _envelopeLength = this._envelopeLength1;
                        break;
                    case 2:
                        _envelopeLength = this._envelopeLength2;
                }
            }
            // Sets the volume based on the position in the envelope
            switch (_envelopeStage) {
                case 0:
                    _envelopeVolume = _envelopeTime * _envelopeOverLength0;
                    break;
                case 1:
                    _envelopeVolume = 1 + (1 - _envelopeTime * _envelopeOverLength1) * 2 * _sustainPunch;
                    break;
                case 2:
                    _envelopeVolume = 1 - _envelopeTime * _envelopeOverLength2;
                    break;
                case 3:
                    _envelopeVolume = 0;
                    _finished = true;
            }
            // Moves the phaser offset
            if (_phaser) {
                _phaserOffset += _phaserDeltaOffset;
                _phaserInt = _phaserOffset | 0;
                if (_phaserInt < 0) {
                    _phaserInt = -_phaserInt;
                }
                else if (_phaserInt > 1023) {
                    _phaserInt = 1023;
                }
            }
            // Moves the high-pass filter cutoff
            if (_filters && _hpFilterDeltaCutoff) {
                _hpFilterCutoff *= _hpFilterDeltaCutoff;
                if (_hpFilterCutoff < .00001) {
                    _hpFilterCutoff = .00001;
                }
                else if (_hpFilterCutoff > .1) {
                    _hpFilterCutoff = .1;
                }
            }
            _superSample = 0;
            for (var j = 8; j--;) {
                // Cycles through the period
                _phase++;
                if (_phase >= _periodTemp) {
                    _phase %= _periodTemp;
                    // Generates new random noise for this period
                    if (_waveType == 3) {
                        for (var n = _noiseBuffer.length; n--;) {
                            _noiseBuffer[n] = Math.random() * 2 - 1;
                        }
                    }
                }
                // Gets the sample from the oscillator
                switch (_waveType) {
                    case 0:
                        _sample = ((_phase / _periodTemp) < this._squareDuty) ? .5 : -.5;
                        break;
                    case 1:
                        _sample = 1 - _phase / _periodTemp * 2;
                        break;
                    case 2:
                        _pos = _phase / _periodTemp;
                        _pos = (_pos > .5 ? _pos - 1 : _pos) * 6.28318531;
                        _sample = 1.27323954 * _pos + .405284735 * _pos * _pos * (_pos < 0 ? 1 : -1);
                        _sample = .225 * ((_sample < 0 ? -1 : 1) * _sample * _sample - _sample) + _sample;
                        break;
                    case 3:
                        _sample = _noiseBuffer[Math.abs(_phase * 32 / _periodTemp | 0)];
                }
                // Applies the low and high pass filters
                if (_filters) {
                    _lpFilterOldPos = _lpFilterPos;
                    _lpFilterCutoff *= _lpFilterDeltaCutoff;
                    if (_lpFilterCutoff < 0) {
                        _lpFilterCutoff = 0;
                    }
                    else if (_lpFilterCutoff > .1) {
                        _lpFilterCutoff = .1;
                    }
                    if (_lpFilterOn) {
                        _lpFilterDeltaPos += (_sample - _lpFilterPos) * _lpFilterCutoff;
                        _lpFilterDeltaPos *= _lpFilterDamping;
                    }
                    else {
                        _lpFilterPos = _sample;
                        _lpFilterDeltaPos = 0;
                    }
                    _lpFilterPos += _lpFilterDeltaPos;
                    _hpFilterPos += _lpFilterPos - _lpFilterOldPos;
                    _hpFilterPos *= 1 - _hpFilterCutoff;
                    _sample = _hpFilterPos;
                }
                // Applies the phaser effect
                if (_phaser) {
                    _phaserBuffer[_phaserPos % 1024] = _sample;
                    _sample += _phaserBuffer[(_phaserPos - _phaserInt + 1024) % 1024];
                    _phaserPos++;
                }
                _superSample += _sample;
            }
            // Averages out the super samples and applies volumes
            _superSample *= .125 * _envelopeVolume * _masterVolume;
            // Clipping if too loud
            buffer[i] = _superSample >= 1 ? 32767 : _superSample <= -1 ? -32768 : _superSample * 32767 | 0;
        }
        return length;
    };
    return JSfxr;
}());
/// <reference path="Engine/JSfxr.ts" />
//To make sounds, goto:
//http://www.superflashbros.net/as3sfxr/
//create the sound you want, then Ctrl+C, Ctrl +V the data into here
var Sounds = (function () {
    function Sounds() {
    }
    //**@constructor*/
    Sounds.Init = function () {
        //this.ac = new (webkitAudioContext || AudioContext)();
        Sounds.ac = new AudioContext();
        Sounds.audioCache = {};
        for (var k in Sounds.sfxrCache) {
            var audioBuffer = JSfxr.CreateWaveData(new JSfxrParams(Sounds.sfxrCache[k]));
            Sounds.DecodeAudioData(k, audioBuffer);
        }
    };
    Sounds.DecodeAudioData = function (name, data) {
        var _this = this;
        this.index++;
        this.ac.decodeAudioData(data, function (audioData) {
            //console.log("Decode:" + name);
            _this.audioCache[name] = audioData;
            _this.index--;
            if (_this.index == 0 && _this.Loaded)
                _this.Loaded();
        }, function () { console.log("ERROR!"); });
    };
    // private static B64ToArrayBuffer(b64:string): ArrayBuffer {
    //         b64 = atob(b64.substr(b64.indexOf(',') + 1));
    //         let len = b64.length;
    //         let bytes = new Uint8Array(len);
    //         for (let i = 0; i < len; i++) {
    //             bytes[i] = b64.charCodeAt(i);
    //         }
    //         return bytes.buffer;
    // }
    Sounds.Play = function (name, delay) {
        if (delay === void 0) { delay = 0; }
        if (Sounds.audioCache[name]) {
            var src = Sounds.ac.createBufferSource();
            src.buffer = Sounds.audioCache[name];
            src.connect(Sounds.ac.destination);
            delay = Sounds.ac.currentTime + (delay || 0);
            src.start(delay);
            return src;
        }
    };
    /**@const*/
    Sounds.sfxrCache = {
        //  'bglitch':[1,0.58,0.17,,0.08,0.6,0.4,-0.54,-0.1999,,,-1,,0.2241,-0.8201,,-0.1025,-0.6599,0.12,-0.4599,0.7235,0.0087,-0.78,0.92],
        //'wobble':[2,0.2,0.32,,0.25,0.27,,0.1999,0.04,0.36,0.44,-1,,,,,,,1,,,,,0.7],
        'buttonDown': [2, 0.04, 0.21, 0.0787, 0.0583, 0.34, 0.0056, 0.1399, -0.0162, 0.0614, , -0.3787, 0.0883, 0.3414, 0.0899, 0.0111, 0.1224, -0.7053, 0.9075, 0.1738, -0.729, 0.6085, 0.1811, 0.4],
        'buttonUp': [2, 0.04, 0.21, 0.0787, 0.0583, 0.42, 0.0056, -0.04, 0.34, 0.0614, , -0.06, 0.0883, 0.3414, 0.0899, 0.0111, -0.48, -0.7053, 0.9075, 0.1738, -0.729, 0.6085, 0.1811, 0.4],
        'bubble0': [2, 0.14, 0.09, , 0.1699, 0.2, , 0.32, -0.12, , 0.0343, -0.0485, 0.1916, 0.3523, -0.0239, , -1, -0.76, 1, -0.0317, , 0.1172, -0.2115, 0.3],
        'bubble1': [2, 0.14, 0.09, , 0.1699, 0.09, , 0.32, -0.12, , 0.0343, -0.0485, 0.1916, 0.3523, -0.0239, , -1, -0.76, 1, -0.0317, , 0.1172, -0.2115, 0.3],
        'bubble2': [2, 0.14, 0.09, , 0.1699, 0.17, , 0.32, -0.12, , 0.0343, -0.0485, 0.1916, 0.3523, -0.0239, , -1, -0.76, 1, -0.0317, , 0.1172, -0.2115, 0.3],
        'lowPop': [2, , 0.01, 0.0023, 0.1699, 0.20, 0.034, 0.2459, -0.0171, , 0.0343, -0.0485, 0.1916, 0.3523, -0.0239, , -0.1688, 0.0518, 1, -0.0317, , 0.1172, -0.2115, 0.5],
        'midPop': [2, , 0.01, 0.0023, 0.1699, 0.35, 0.034, 0.2459, -0.0171, , 0.0343, -0.0485, 0.1916, 0.3523, -0.0239, , -0.1688, 0.0518, 1, -0.0317, , 0.1172, -0.2115, 0.5],
        'highPop': [2, , 0.01, 0.0023, 0.1699, 0.5, 0.034, 0.2459, -0.0171, , 0.0343, -0.0485, 0.1916, 0.3523, -0.0239, , -0.1688, 0.0518, 1, -0.0317, , 0.1172, -0.2115, 0.4],
        'blowUp': [3, 0.4221, 0.01, , 0.85, 0.2394, , , , -0.9113, -0.2781, -1, -0.5043, , 0.1074, 0.0389, 0.0004, -0.3199, 0.9776, 0.0118, , 0.7449, 0.1003, 0.3]
    };
    Sounds.index = 0;
    return Sounds;
}());
/// <reference path="Engine/GameObject.ts" />
/// <reference path="Engine/V.ts" />
var Pop = (function (_super) {
    __extends(Pop, _super);
    /**@constructor*/
    function Pop() {
        _super.call(this);
        this.particles = [];
        this.particles = [];
        for (var i = 0; i < Pop.slices; i++) {
            this.particles[i] = { x: 0, y: 0, vx: 0, vy: 0 };
        }
    }
    Pop.prototype.Set = function (x, y, liveTime, radius, color) {
        this.x = x;
        this.y = y;
        this.liveTime = liveTime;
        this.timer = liveTime;
        this.radius = radius;
        this.c = color;
        var theta = 0;
        var inc = 2 * Math.PI / Pop.slices;
        var r = radius * 0.1;
        for (var i = 0; i < Pop.slices; i++) {
            //Create some unit vectors
            var vmag = RndI(Pop.minVel, Pop.maxVel);
            var cx = Math.cos(theta);
            var cy = Math.sin(theta);
            this.particles[i].x = x + r * cx;
            this.particles[i].y = y + r * cy;
            this.particles[i].vx = cx * vmag;
            this.particles[i].vy = cy * vmag;
            theta += inc;
        }
    };
    Pop.prototype.Update = function (dt) {
        if (this.timer > 0) {
            this.timer -= dt;
            if (this.timer <= 0) {
                this.e.ppool.Recycle(this);
                return;
            }
        }
        for (var i = 0; i < this.particles.length; i++) {
            this.particles[i].vy += 256 * dt; //deceleration
            this.particles[i].x += this.particles[i].vx * dt;
            this.particles[i].y += this.particles[i].vy * dt;
        }
    };
    Pop.prototype.Draw = function (ctx) {
        ctx.fillStyle = bubbleColors[this.c];
        //Draw the bubble itself
        var rdt = (this.timer - this.liveTime / 2) / (this.liveTime / 2);
        if (rdt > 0) {
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, rdt * this.radius * 0.9, 0, 2 * Math.PI);
            ctx.fill();
        }
        ctx.globalAlpha = this.timer / this.liveTime;
        for (var i = 0; i < this.particles.length; i++) {
            // ctx.fillRect(this.particles[i].p.x - 2, this.particles[i].p.y - 2, 4,4);
            ctx.beginPath();
            ctx.arc(this.particles[i].x, this.particles[i].y, 2, 0, 2 * Math.PI);
            ctx.fill();
        }
    };
    Pop.minVel = 30;
    Pop.maxVel = 120;
    Pop.slices = 50;
    return Pop;
}(GameObject));
/// <reference path="GameObject.ts" />
var Button = (function (_super) {
    __extends(Button, _super);
    /**
    * @constructor
    */
    function Button(x, y, width, height, text, snd) {
        if (snd === void 0) { snd = true; }
        _super.call(this, x, y);
        //corner radius
        this.r = 10;
        this.overBtn = false;
        //Fired when the button is clicked
        this.beginClick = false;
        this.z = LYR_BUTTON;
        this.width = width;
        this.height = height;
        this.text = text;
        this.bcolor = Button.color;
        this.snd = snd;
    }
    Button.prototype.Update = function (dt) {
        if (InRect(this.e.mouse.x, this.e.mouse.y, this.x, this.y, this.width, this.height)) {
            if (!this.overBtn) {
                this.overBtn = true;
                Mouse.overUI++;
            }
            if (this.e.mouse.buttonsDown[0]) {
                this.beginClick = true;
                if (this.snd)
                    Sounds.Play('buttonDown');
            }
            else if (this.e.mouse.buttonsUp[0] && this.beginClick) {
                this.beginClick = false;
                if (this.snd)
                    Sounds.Play('buttonUp');
                if (this.clicked)
                    this.clicked(this);
            }
            if (this.e.mouse.buttonState[0])
                this.bcolor = Button.pcolor;
            else
                this.bcolor = Button.ocolor;
        }
        else {
            this.beginClick = false;
            this.bcolor = Button.color;
            if (this.overBtn) {
                this.overBtn = false;
                Mouse.overUI--;
            }
        }
    };
    Button.prototype.OnActiveChanged = function (active) {
        if (!active && this.overBtn) {
            this.overBtn = false;
            Mouse.overUI--;
        }
    };
    Button.prototype.Draw = function (ctx) {
        ctx.globalAlpha = 1;
        ctx.lineWidth = Button.lwidth;
        ctx.fillStyle = this.bcolor;
        ctx.setLineDash([1, 0]);
        ctx.strokeStyle = 'Gainsboro'; //outline color
        ctx.beginPath();
        if (this.r == 0) {
            ctx.lineWidth = 1;
            ctx.rect(this.x, this.y, this.width, this.height);
        }
        else {
            ctx.moveTo(this.x + this.r, this.y);
            ctx.lineTo(this.x + this.width - this.r, this.y);
            ctx.quadraticCurveTo(this.x + this.width, this.y, this.x + this.width, this.y + this.r);
            ctx.lineTo(this.x + this.width, this.y + this.height - this.r);
            ctx.quadraticCurveTo(this.x + this.width, this.y + this.height, this.x + this.width - this.r, this.y + this.height);
            ctx.lineTo(this.x + this.r, this.y + this.height);
            ctx.quadraticCurveTo(this.x, this.y + this.height, this.x, this.y + this.height - this.r);
            ctx.lineTo(this.x, this.y + this.r);
            ctx.quadraticCurveTo(this.x, this.y, this.x + this.r, this.y);
        }
        ctx.fill();
        ctx.stroke();
        DrawTxt(ctx, this.text, this.x + this.width / 2, this.y + this.height / 2, "center", "middle", Button.tcolor, Button.font);
    };
    Button.font = "20px " + FONT_FAMILY;
    Button.lwidth = 3;
    //button's normal color
    Button.color = 'DimGray';
    //mouse over color
    Button.ocolor = 'Gray';
    //pressed color
    Button.pcolor = 'LightGray';
    //text color
    Button.tcolor = 'White';
    Button.tHeight = parseInt(Button.font);
    return Button;
}(GameObject));
/// <reference path="GameObject.ts" />
/// <reference path="Button.ts" />
var ModalStrip = (function (_super) {
    __extends(ModalStrip, _super);
    function ModalStrip(params) {
        var _this = this;
        _super.call(this);
        //Horizontal alignment of the message text lines
        this.hAlign = 'center';
        //x offset of the message text lines
        this.xoffset = 0;
        this.OnClicked = function (btn) {
            _this.res = btn.text;
            _this.active = false;
        };
        this.z = 999;
        this.x = params.x | 0;
        this.y = params.y | 0;
        this.c = (params.c == undefined) ? 'rgba(0, 32, 64, 0.9)' : params.c;
        this.height = 150;
        this.width = (params.width == undefined) ? 100 : params.width;
        this.res = null;
        this.buttons = [];
    }
    ModalStrip.prototype.Start = function () {
        this.active = false;
    };
    ModalStrip.prototype.Show = function (show) {
        this.res = null;
        this.active = show;
    };
    ModalStrip.prototype.Set = function (title, btnTxt, msgs, horizAlignment, xoffset) {
        if (msgs === void 0) { msgs = []; }
        if (horizAlignment === void 0) { horizAlignment = 'center'; }
        if (xoffset === void 0) { xoffset = this.e.c.width / 2; }
        this.hAlign = horizAlignment;
        this.xoffset = xoffset;
        //resize the strip's height depending on what text is showing
        if (msgs.length == 0)
            this.height = 110;
        else
            this.height = 110 + 35 * msgs.length;
        this.y = this.e.c.height / 2 - this.height / 2;
        var totalW = ModalStrip.bWidth + 20;
        var x = (this.width / 2 - ModalStrip.bWidth / 2) - ((btnTxt.length - 1) / 2) * totalW;
        var y = this.y + this.height - ModalStrip.bHeight - 10;
        this.title = title;
        this.msgs = msgs;
        //delete any old buttons
        this.buttons = [];
        for (var i = 0; i < btnTxt.length; i++) {
            var b = new Button(x, y, ModalStrip.bWidth, ModalStrip.bHeight, btnTxt[i]);
            x = x + totalW;
            b.clicked = this.OnClicked;
            b.e = this.e; //cheat
            this.buttons.push(b);
            this.e.Add(b);
        }
    };
    ModalStrip.prototype.OnActiveChanged = function (active) {
        if (!active) {
            //Make sure to set all buttons as inactive
            for (var i = 0; i < this.buttons.length; i++) {
                this.buttons[i].active = false;
                this.e.Remove(this.buttons[i]);
            }
            this.buttons = [];
        }
    };
    ModalStrip.prototype.Update = function (dt) {
        for (var i = 0; i < this.buttons.length; i++) {
            this.buttons[i].Update(dt);
        }
    };
    ModalStrip.prototype.Draw = function (ctx) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = this.c;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'White';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.width, this.y);
        ctx.moveTo(this.x, this.y + this.height);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.stroke();
        DrawTxt(ctx, this.title, this.x + this.width / 2, this.y + this.height / 8 + 5, 'center', 'middle', 'Yellow', '24px ' + FONT_FAMILY);
        for (var i = 0; i < this.msgs.length; i++) {
            DrawTxt(ctx, this.msgs[i], this.x + this.xoffset, this.y + this.height / 6 + 24 + 5 + 25 * i, this.hAlign, 'middle');
        }
        for (var i = 0; i < this.buttons.length; i++) {
            this.buttons[i].Draw(ctx);
        }
    };
    /**@const */
    ModalStrip.bWidth = 180;
    /**@const */
    ModalStrip.bHeight = 50;
    return ModalStrip;
}(GameObject));
/// <reference path="V.ts" />
/// <reference path="GameObject.ts" />
/// <reference path="../Pop.ts" />
/// <reference path="ModalStrip.ts" />
var Engine = (function () {
    /**
    * @constructor
    */
    function Engine(canvas, backColor) {
        var _this = this;
        if (backColor === void 0) { backColor = "#000000"; }
        //Holds the previous timestamp value
        this.prevTime = 0;
        //A hash of the current number of bubbles with the key being the color
        this.numBubbles = {};
        //If true, then the bubble game objects are not updated only drawn
        this.freezeBubbles = false;
        //Tells the engine it needs to sort the objects array b z order
        this.sort = false;
        this.timeStamp = 0;
        this.delta = 0;
        this.MainLoop = function (dt) {
            _this.delta = (dt - _this.timeStamp) / 1000;
            if (_this.delta > 0.1)
                _this.delta = 60 / 1000; //if our timestep gets messed up, act like we're fine.
            _this.Update(_this.delta);
            _this.Draw(_this.ctx);
            _this.timeStamp = dt;
            window.requestAnimationFrame(_this.MainLoop);
        };
        this.ctx = canvas.getContext("2d");
        this.ctx.msImageSmoothingEnabled = false;
        this.c = canvas;
        this.backcolor = backColor;
        this.objects = [];
        this.bpool = new Pool(maxBubbles, maxBubbles, true);
        this.ppool = new Pool(5);
        this.bubbles = [];
        this.keyboard = new Keyboard();
        this.mouse = new Mouse(this);
        this.modal = new ModalStrip({ width: canvas.width });
    }
    Engine.prototype.Run = function () {
        if (this.running)
            return;
        this.running = true;
        //Disable the right-click context menu
        //this.c.addEventListener('contextmenu', (ev)=>{ ev.preventDefault();})
        //Start up our input classes
        this.mouse.Start();
        this.keyboard.Start();
        this.Add(this.modal);
        //Call start on all our gameObjects
        for (var i = 0; i < this.objects.length; i++) {
            if (this.objects[i].active && !this.objects[i].started) {
                this.objects[i].Start();
                this.objects[i].started = true;
            }
        }
        window.requestAnimationFrame(this.MainLoop);
    };
    Engine.prototype.Add = function (gob) {
        if (this.objects.indexOf(gob) > -1)
            return;
        gob.e = this;
        this.objects.push(gob);
        this.sort = true;
        if (this.running && gob.active && !gob.started) {
            gob.Start();
            gob.started = true;
        }
    };
    Engine.prototype.Remove = function (gob) {
        var i = this.objects.indexOf(gob);
        if (i > -1) {
            // this.objects[i].active = false;
            // this.objects[i].OnRemoved();
            this.objects.splice(i, 1);
        }
    };
    Engine.prototype.Get = function (name) {
        for (var i = 0; i < this.objects.length; i++) {
            if (this.objects[i].name == name)
                return this.objects[i];
        }
        return null;
    };
    // delta:number;
    // protected UpdateDeltaTime(): number {
    //     let current:number =  window.performance && window.performance.now ? window.performance.now() : Date.now();
    //     //We want delta to be in seconds so convert it.
    //     //First, get the nearest integer value using Math.floor
    //     //since were already in milliseconds 
    //     this.delta = (current - this.prevTime) / 1000;//(Math.floor(current - this.prevTime)) / 1000;
    //     this.prevTime = current;
    //     //If delta > 200ms, set it to 60 ms
    //     if(this.delta > 0.2) this.delta = 60 / 1000;
    //     return this.delta;
    // }
    Engine.prototype.Update = function (dt) {
        for (var i = 0; i < this.objects.length; i++) {
            if (this.objects[i].active) {
                if (!this.objects[i].started) {
                    this.objects[i].started = true;
                    this.objects[i].Start();
                }
                this.objects[i].Update(dt);
            }
        }
        //Now Update the bubbles if they are not frozen
        if (!this.freezeBubbles) {
            for (var i = 0; i < this.bubbles.length; i++) {
                if (this.bubbles[i].active)
                    this.bubbles[i].Update(dt);
            }
        }
        //Update the keyboard and mouse state LAST
        this.keyboard.ClearState();
        this.mouse.ClearState();
        //Do we need to sort our gameObjects array
        //If one gets added then this flag is set to true
        if (this.sort) {
            this.sort = !this.sort;
            this.objects.sort(function (a, b) { return a.z - b.z; });
        }
    };
    Engine.prototype.Draw = function (ctx) {
        var db = false;
        //this.ctx.clearRect(0,0,this.c.width, this.c.height);
        ctx.globalAlpha = 1;
        ctx.fillStyle = this.backcolor;
        ctx.fillRect(0, 0, this.c.width, this.c.height);
        //Draw our gameobjects
        for (var i = 0; i < this.objects.length; i++) {
            //Draw the bubbles at the correct z depth
            if (!db && (this.objects[i].z >= LYR_BUBBLE || i == this.objects.length - 1)) {
                db = true;
                for (var i_1 = 0; i_1 < this.bubbles.length; i_1++) {
                    if (this.bubbles[i_1].active)
                        this.bubbles[i_1].Draw(ctx);
                }
            }
            if (this.objects[i].active)
                this.objects[i].Draw(ctx);
        }
    };
    ///Bubble-related functions
    // GetNumBubbles(color:string=''):number{
    //     if(color.length == 0)
    //         return this.bubbles.length;
    //     else
    //         return this.numBubbles[color] | 0;
    // }
    // GetNumBubble(colorIndex:number):number{
    //     if(colorIndex == -1) return this.bubbles.length;
    //     if(colorIndex >= 0 && colorIndex < G.bubbleColors.length)
    //         return this.numBubbles[G.bubbleColors[colorIndex]];
    //     else
    //         return -1;
    // }
    Engine.prototype.RemoveBubble = function (b, pop, snd) {
        var _this = this;
        if (pop === void 0) { pop = true; }
        if (snd === void 0) { snd = true; }
        this.bpool.Recycle(b);
        var ind = this.bubbles.indexOf(b);
        if (ind > -1) {
            this.bubbles.splice(ind, 1);
            this.numBubbles[bubbleColors[b.c]]--;
            //this.numBubbles[G.bubbleColors[b.c]] = Math.max(0, this.numBubbles[G.bubbleColors[b.c]]--);
            if (pop) {
                var pm = this.ppool.Spawn(function () {
                    var p = new Pop();
                    _this.Add(p);
                    return p;
                });
                pm.Set(b.x, b.y, 0.5, b.radius, b.c);
            }
        }
        // else //This would not be good
        // {
        //     console.error("A bubble was not found in the engine's list!");
        // }
        // console.log(b.c + ": " + this.GetNumBubbles(b.c) + " total:" + this.GetNumBubbles());
        if (snd) {
            if (b.radius >= bubbleRad[2])
                Sounds.Play('lowPop');
            else if (b.radius >= bubbleRad[1])
                Sounds.Play('midPop');
            else
                Sounds.Play('highPop');
        }
    };
    Engine.prototype.RemoveAllBubbles = function () {
        for (var i = 0; i < this.bubbles.length; i++) {
            this.bpool.Recycle(this.bubbles[i]);
        }
        this.bubbles = [];
        this.numBubbles = {};
    };
    Engine.prototype.NewBubble = function (x, y, r, c, addToList, stayStill) {
        var _this = this;
        if (c === void 0) { c = -1; }
        if (addToList === void 0) { addToList = true; }
        if (stayStill === void 0) { stayStill = false; }
        var b = this.bpool.Spawn(function () {
            var b = new Bubble();
            b.maxVel = bmaxVel;
            b.minVel = bminVel;
            b.e = _this;
            return b;
        });
        if (b != null) {
            b.Set(x, y, r, c);
            if (!stayStill)
                b.acc.y = 5;
            else {
                b.acc.y = 0;
            }
            b.acc.x = 0;
            b.vel.x = 0;
            b.vel.y = 0;
            if (addToList) {
                this.bubbles.push(b);
            }
            this.numBubbles[b.c] = ((this.numBubbles[b.c] == undefined) ? 0 : this.numBubbles[b.c]) + 1;
        }
        // console.log(b.c + ": " + this.GetNumBubbles(b.c) + " total:" + this.GetNumBubbles());
        return b;
    };
    Engine.prototype.PointInBubble = function (point) {
        for (var i = 0; i < this.bubbles.length; i++) {
            if (DistSq(this.bubbles[i].x, this.bubbles[i].y, point.x, point.y) < this.bubbles[i].radius * this.bubbles[i].radius) {
                return this.bubbles[i];
            }
        }
        return null;
    };
    Engine.prototype.CollideBubbles = function () {
        //Collide the bubbles
        for (var i = 0; i < this.bubbles.length; i++) {
            var c = this.bubbles[i];
            for (var j = i + 1; j < this.bubbles.length; j++) {
                c.Collide(this.bubbles[j]);
            }
        }
    };
    return Engine;
}());
/// <reference path="../Engine/V.ts" />
/// <reference path="../Engine/Engine.ts" />
/// <reference path="../Engine/GameObject.ts" />
/// <reference path="../Bubble.ts" />
/// <reference path="../Line.ts" />
var MainGame = (function (_super) {
    __extends(MainGame, _super);
    /**@constructor*/
    function MainGame() {
        _super.call(this);
        //middle:GText;
        //status:GText;
        //Level -1 is the title screen
        this.lvlNum = -1;
        this.win = false;
        //The current bubble if we are blowing one up
        this.cbubble = null;
        this.abs = null;
        this.z = -10; //we want the main game and other 'modes' to be updated FIRST
        this.name = 'Game';
        this.allGoodTimer = 0;
    }
    MainGame.prototype.Start = function () {
        //this.middle = new GText(this.e.c.width / 2, this.e.c.height / 2, "You Win!", "c", "White", "40px " + G.FONT_FAMILY); 
        //this.status = new GText(this.e.c.width / 2, this.e.c.height - 5, "for js13k 2016 by recursor", "center", "top");
        //this.e.Add(this.middle);
        //this.e.Add(this.status);
        this.ige = this.e.Get('IGE');
        this.ige.Init(this);
        //this.LoadLevel(this.lvlNum);
        this.state = this.GameControl;
    };
    MainGame.prototype.LoadLevel = function (lvlNum, showTitle) {
        if (showTitle === void 0) { showTitle = false; }
        this.e.freezeBubbles = false;
        this.win = false;
        this.e.RemoveAllBubbles();
        this.allGoodTimer = lvlAllGoodWait;
        if (this.lvl) {
            this.lvl.Destroy(this.e);
        }
        if (lvlNum < 0 || lvlNum >= levels.Lvls.length) {
            return false;
        }
        else {
            this.lvlNum = lvlNum;
            this.lvl = new Level(levels.Lvls[lvlNum]);
            this.lvl.SetEngine(this.e);
            if (showTitle)
                this.titleTimer = TITLE_DISPLAY_TIME;
            else
                this.titleTimer = 0;
            return true;
        }
    };
    MainGame.prototype.DoModal = function (completedLevel) {
        if (completedLevel === void 0) { completedLevel = false; }
        if (completedLevel) {
            if (this.lvlNum + 1 >= levels.Lvls.length)
                this.e.modal.Set("Game Complete", ["Main Menu"], ["Congratulations!", "You have trapped all the bubbles!", "Thanks for playing :)"]);
            else
                this.e.modal.Set("Level Complete", ["Retry", "Next", "Main Menu"], ["Nice job!"]);
            // if(this.abs)
            //     this.abs.stop();
            this.e.modal.Show(true);
            this.state = this.WaitForModal;
            this.e.freezeBubbles = true;
            //Save progress
            localStorage.setItem(ST_LVL, this.lvlNum.toString());
            return;
        }
        else if (this.e.modal.active && this.state == this.WaitForModal && this.e.modal.title != 'Level Complete') {
            this.state = this.GameControl;
            this.e.freezeBubbles = false;
            this.e.modal.Show(false);
        }
        else if (this.state == this.GameControl && !this.e.modal.active) {
            if (this.lvlNum == -1) {
                var saveLvl = Number(localStorage.getItem(ST_LVL));
                if (saveLvl > -1)
                    this.e.modal.Set("Main Menu", ["New Game", "Continue", "Help"]);
                else
                    this.e.modal.Set("Main Menu", ["New Game", "Help"]);
            }
            else {
                this.e.modal.Set("Options", ["Retry", "Edit Level", "Resume", "Main Menu"], ["Level " + this.lvlNum + ": " + this.lvl.t]);
            }
            if (this.abs)
                this.abs.stop();
            this.cbubble = null;
            this.e.freezeBubbles = true;
            this.e.modal.Show(true);
            this.state = this.WaitForModal;
        }
    };
    MainGame.prototype.Update = function (dt) {
        if (this.e.keyboard.KeyDown('Escape')) {
            this.DoModal();
        }
        if (this.titleTimer > 0) {
            this.titleTimer -= dt;
        }
        if (this.titleTimer > 1 && (this.e.mouse.buttonState[0] || this.e.mouse.buttonState[1] || this.e.mouse.buttonState[2])) {
            this.titleTimer = 1;
        }
        //Run the current game state
        this.state(dt);
    };
    MainGame.prototype.TitleScreen = function () {
        this.lvl.Destroy(this.e);
        this.e.RemoveAllBubbles();
        this.lvlNum = -1;
        this.lvl = null;
    };
    MainGame.prototype.WaitForModal = function (dt) {
        //Dont do anything if the modal is showing
        if (this.e.modal.active)
            return;
        //Ok now go ahead and set the state back to the game loop
        this.state = this.GameControl;
        var m = this.e.modal;
        switch (m.title) {
            case 'Level Complete':
                if (m.res == 'Retry')
                    this.LoadLevel(this.lvlNum);
                else if (m.res == "Main Menu") {
                    this.TitleScreen();
                }
                else {
                    this.lvlNum++;
                    this.LoadLevel(this.lvlNum, true);
                }
                break;
            case 'Game Complete':
                localStorage.removeItem(ST_LVL);
                this.TitleScreen();
                break;
            case 'Options':
                this.e.freezeBubbles = false;
                if (m.res == 'Retry') {
                    //this.LoadLevel(this.lvlNum);
                    this.e.RemoveAllBubbles();
                    this.lvl.Destroy(this.e);
                    this.lvl.Reset();
                    this.lvl.SetEngine(this.e);
                }
                else if (m.res == "Edit Level") {
                    this.titleTimer = 0;
                    this.active = false;
                    this.lvl.Reset();
                    this.ige.SetLevel(this.lvl);
                }
                else if (m.res == "Main Menu") {
                    this.TitleScreen();
                }
                break;
            case 'Main Menu':
                if (m.res == "New Game") {
                    localStorage.removeItem(ST_LVL);
                    this.LoadLevel(0, true); //Start at the beginning
                }
                else if (m.res == "Continue") {
                    var saveLvl = Number(localStorage.getItem(ST_LVL));
                    if (saveLvl > -1)
                        this.LoadLevel(saveLvl + 1, true);
                    else
                        this.LoadLevel(0, true);
                }
                else if (m.res == "Help") {
                    this.state = this.WaitForModal; //stay in the modal state
                    m.Set("Help", ["Ok"], ["Trap bubbles in same-colored areas to complete levels",
                        "Different color bubbles in a colored area isn't allowed and shows as 'Error!'",
                        "Right-click blows new white bubbles (hold to make larger)",
                        "Left-click pops only WHITE bubbles",
                        "In Edit Mode, items that can be moved, colored, and/or rotated are indicated",
                        "by a dot, or rectangle",
                        "Go to Edit Mode thru the menu via 'Escape' or the menu button"], 'left', 10);
                    m.Show(true);
                }
                break;
            case 'Help':
                this.e.freezeBubbles = false;
                break;
        }
    };
    MainGame.prototype.GameControl = function (dt) {
        if (!this.lvl) {
            this.allGoodTimer -= dt;
            if (this.allGoodTimer <= 0 && this.e.bubbles.length < 50) {
                var b = this.e.NewBubble(RndI(40, this.e.c.width - 40), this.e.c.height + 40, bubbleRad[RndI(0, bubbleRad.length)], RndI(0, bubbleColors.length));
                b.vel.Set(RndI(-90, 90), 0);
                this.allGoodTimer = RndI(0.25, 2);
            }
            this.e.CollideBubbles();
            return;
        }
        else if (this.allGoodTimer > 0) {
            this.allGoodTimer -= dt;
            if (this.allGoodTimer <= 0) {
                this.DoModal(true);
            }
        }
        //This is for testing and entering our level editor. Remove these before final build
        // if(this.e.keyboard.KeyDown(',')){
        //     if(this.lvlNum > 0) {
        //         this.lvlNum--;
        //         this.LoadLevel(this.lvlNum, true);
        //     }
        // }
        // else if(this.e.keyboard.KeyDown('.')){
        //     if(this.lvlNum < levels.Lvls.length - 1){
        //         this.lvlNum++;
        //         this.LoadLevel(this.lvlNum, true);
        //     }
        // }
        // else if(this.e.keyboard.KeyDown('2')){
        //     let g = this.e.Get('Editor');
        //     let o = this.e.Get('o').active = false;
        //     if(g != null) {
        //         this.active = false;
        //         g.active = true;
        //     }
        //     return;
        // }
        // else
        if (this.e.mouse.buttonsDown[2] && this.cbubble == null && !Mouse.overUI && this.lvlNum > -1) {
            this.cbubble = this.e.NewBubble(this.e.mouse.x, this.e.mouse.y, 10, 0);
            if (this.cbubble != null) {
                this.abs = Sounds.Play('blowUp');
                this.cbubble.vel.Set(0, 0);
                this.cbubble.acc.y = 0;
                this.cbubble.acc.x = 0;
            }
        }
        else if (this.e.mouse.buttonsDown[0] && !Mouse.overUI) {
            var clicked = this.e.PointInBubble(new V(this.e.mouse.x, this.e.mouse.y));
            if (clicked != null && clicked.c == 0) {
                this.e.RemoveBubble(clicked);
            }
        }
        if (this.cbubble && this.e.mouse.buttonState[2]) {
            this.cbubble.radius = Math.min(this.cbubble.radius + bubbleGrowthRate * dt, 60);
            this.cbubble.mass = this.cbubble.radius / 50;
        }
        else if (this.cbubble && this.e.mouse.buttonsUp[2]) {
            if (this.abs)
                this.abs.stop();
            this.cbubble.vel.x = RndI(-2, 3);
            this.cbubble.vel.y = RndI(10, 40);
            this.cbubble.acc.y = 5;
            this.cbubble = null;
        }
        this.e.CollideBubbles();
        for (var i = 0; i < this.e.bubbles.length; i++) {
            //Collide the bubbles with the lines
            for (var j = 0; j < this.lvl.lines.length; j++) {
                var sepV = this.e.bubbles[i].OverlapsLine(this.lvl.lines[j]);
                if (sepV != null &&
                    ((this.lvl.lines[j].dashed && this.lvl.lines[j].c != this.e.bubbles[i].c) ||
                        (!this.lvl.lines[j].dashed && this.lvl.lines[j].c == this.e.bubbles[i].c || this.lvl.lines[j].c == 0)) //regular lines
                ) {
                    this.e.bubbles[i].x += sepV.x;
                    this.e.bubbles[i].y += sepV.y;
                }
            }
            //Collide pins
            for (var k = 0; k < this.lvl.pins.length; k++) {
                if (this.lvl.pins[k].CollideBubble(this.e.bubbles[i])) {
                    this.e.RemoveBubble(this.e.bubbles[i]);
                    break;
                }
            }
            for (var k = 0; k < this.lvl.pens.length; k++) {
                this.lvl.pens[k].UpdatePenStatus(this.e.bubbles);
                if (this.lvl.pens[k].IsFull()) {
                    this.win = true;
                }
                else
                    this.win = false;
            }
        }
        if (this.lvl) {
            this.lvl.Update(dt);
            this.lvl.Interact(this.e.bubbles);
            //TODO: Check for all win conditions for the current level to be satisfied
            if (this.lvl.AnyPins() && this.lvl.AllPensGood()) {
                if (this.allGoodTimer == 0)
                    this.allGoodTimer = lvlAllGoodWait;
            }
            else
                this.allGoodTimer = 0;
        }
    };
    MainGame.prototype.Draw = function (ctx) {
        if (this.lvlNum == -1) {
            DrawTxt(ctx, "Bubble Trap!", this.e.c.width / 2, this.e.c.height / 2, "center", "middle", 'cyan', "92px " + FONT_FAMILY);
            DrawTxt(ctx, "Escape for the menu", this.e.c.width / 2, this.e.c.height - 30, "center", "bottom", "orange");
            DrawTxt(ctx, "by recursor for js13k 2016", this.e.c.width / 2, this.e.c.height, "center", "bottom", "yellow", "16px " + FONT_FAMILY);
        }
        else if (this.lvl) {
            this.lvl.Draw(ctx, MODE_GAME);
            if (this.titleTimer > 0) {
                var alpha = Clamp(this.titleTimer, 0, 1);
                ctx.globalAlpha = alpha * .9;
                ctx.fillStyle = 'MidnightBlue';
                ctx.fillRect(0, this.e.c.height / 2 - 50, this.e.c.width, 100);
                DrawTxt(ctx, this.lvl.t, this.e.c.width / 2, this.e.c.height / 2, "center", "middle", "white", "30px " + FONT_FAMILY, alpha);
            }
        }
    };
    MainGame.prototype.OnActiveChanged = function (active) {
        if (!active && this.lvl) {
            this.lvl.Destroy(this.e);
            this.e.RemoveAllBubbles();
        }
        // else{
        //     this.LoadLevel(this.lvlNum);
        // }
        // this.score.active = active;
        // this.status.active = active;
    };
    return MainGame;
}(GameObject));
/// <reference path="Sound.ts" />
/// <reference path="Engine/Engine.ts" />
/// <reference path="Modes/MainGame.ts" />
/// reference path="Modes/Editor.ts" />
window.addEventListener("load", function (ev) {
    var e = new Engine(document.getElementById("main"));
    Sounds.Init();
    Sounds.Loaded = function () {
        //Our main game logic
        var game = new MainGame();
        e.Add(game);
        //  let editor = new Editor();
        //  editor.active = false;
        //  e.Add(editor);
        //The In-game editor
        var inGameEditor = new InGameEditor();
        inGameEditor.active = false;
        e.Add(inGameEditor);
        //Our options button
        var obtn = new Button(e.c.width - 25, 0, 25, 25, "=");
        obtn.name = "o";
        obtn.r = 0;
        e.Add(obtn);
        //Handle the options button being clicked
        obtn.clicked = function (b) {
            if (game.active)
                game.DoModal();
            else
                inGameEditor.DoModal();
        };
        e.Run();
    };
});
var Keyboard = (function () {
    /**@constructor*/
    function Keyboard() {
        var _this = this;
        //These three functions are used as external callbacks so we are using the 
        //local FAT. See the following for details:
        //https://github.com/Microsoft/TypeScript/wiki/'this'-in-TypeScript
        this.OnBlur = function (evt) {
            _this.keyStates = {};
            _this.keyJustPressed = {};
            _this.keyJustUp = {};
        };
        this.OnKeyDown = function (evt) {
            if (!_this.keyStates[evt.key] || !_this.keyStates[evt.key]) {
                _this.keyStates[evt.key] = true;
                _this.keyJustPressed[evt.key] = true;
            }
        };
        this.OnKeyUp = function (evt) {
            if (_this.keyStates[evt.key]) {
                _this.keyStates[evt.key] = false;
                _this.keyJustUp[evt.key] = true;
            }
        };
        this.keyStates = {};
        this.keyJustPressed = {};
        this.keyJustUp = {};
    }
    Keyboard.prototype.Start = function () {
        window.addEventListener('blur', this.OnBlur);
        window.addEventListener('keyup', this.OnKeyUp);
        window.addEventListener('keydown', this.OnKeyDown);
    };
    Keyboard.prototype.Stop = function () {
        window.removeEventListener('blur', this.OnBlur);
        window.removeEventListener('keyup', this.OnKeyUp);
        window.removeEventListener('keydown', this.OnKeyDown);
    };
    //returns the current state of the key
    Keyboard.prototype.Key = function (key) {
        return this.keyStates[key] || false;
    };
    //returns true on the frame when the given key is pressed
    Keyboard.prototype.KeyDown = function (key) {
        return this.keyJustPressed[key] || false;
    };
    //returns true on the frame when the given key is released
    Keyboard.prototype.KeyUp = function (key) {
        return this.keyJustUp[key] || false;
    };
    Keyboard.prototype.ClearState = function () {
        for (var key in this.keyJustPressed) {
            this.keyJustPressed[key] = false;
        }
        for (var key in this.keyJustUp) {
            this.keyJustUp[key] = false;
        }
    };
    return Keyboard;
}());
/**
 * Mouse
 */
var Mouse = (function () {
    /**@constructor*/
    function Mouse(e) {
        this.e = e;
        this.buttonsDown = [false, false, false];
        this.buttonsUp = [false, false, false];
        this.buttonState = [false, false, false];
    }
    Mouse.prototype.UpdateMousePos = function (ev) {
        var rect = this.e.c.getBoundingClientRect();
        this.x = ev.clientX - rect.left;
        this.y = ev.clientY - rect.top;
    };
    Mouse.prototype.Start = function () {
        var _this = this;
        this.e.c.addEventListener('mousemove', function (e) {
            _this.UpdateMousePos(e);
            //console.log("x: " + this.x + " y: " + this.y);
        });
        this.e.c.addEventListener('mousedown', function (e) {
            _this.buttonsDown[e.button] = true;
            _this.buttonState[e.button] = true;
        });
        this.e.c.addEventListener('mouseup', function (e) {
            _this.buttonsDown[e.button] = false;
            _this.buttonsUp[e.button] = true;
            _this.buttonState[e.button] = false;
        });
        // this.e.c.addEventListener('touchmove', (e) =>{
        //     this.x = e.touches[0].clientX;
        //     this.y = e.touches[0].clientY;
        // });
        // this.e.c.addEventListener('touchstart', (e) =>{
        //     this.x = e.touches[0].clientX;
        //     this.y = e.touches[0].clientY;
        //     this.buttonsDown[0]= true;
        //     this.buttonState[0]= true;
        // });
        // this.e.c.addEventListener('touchend', (e) =>{
        //     this.x = e.touches[0].clientX;
        //     this.y = e.touches[0].clientY;
        //     this.buttonsUp[0] = true;
        //     this.buttonState[0]= false;
        // });
    };
    Mouse.prototype.ClearState = function () {
        this.buttonsUp[0] = this.buttonsUp[1] = this.buttonsUp[2] = false;
        this.buttonsDown[0] = this.buttonsDown[1] = this.buttonsDown[2] = false;
    };
    //Tells us if the cursor is currently over a button
    Mouse.overUI = 0;
    return Mouse;
}());
var Pool = (function () {
    /**@constructor*/
    function Pool(initialSize, maxSize, fullPoolNoNews) {
        if (initialSize === void 0) { initialSize = 0; }
        if (maxSize === void 0) { maxSize = -1; }
        if (fullPoolNoNews === void 0) { fullPoolNoNews = false; }
        this.maxSize = maxSize;
        this.fullpoolNoNews = fullPoolNoNews;
        if (maxSize > 0)
            initialSize = Math.min(initialSize, maxSize);
        this._pool = new Array(initialSize);
        for (var i = 0; i < this._pool.length; i++) {
            this._pool[i] = { obj: null, used: false };
        }
    }
    Pool.prototype.Spawn = function (construct) {
        for (var i = 0; i < this._pool.length; i++) {
            if (!this._pool[i].used) {
                this._pool[i].used = true;
                if (this._pool[i].obj === null)
                    this._pool[i].obj = construct();
                else if (this._pool[i].obj instanceof GameObject) {
                    this._pool[i].obj.active = true;
                }
                return this._pool[i].obj;
            }
        }
        if (this.maxSize == this._pool.length) {
            if (this.fullpoolNoNews)
                return null;
            else
                return construct();
        }
    };
    Pool.prototype.Recycle = function (obj) {
        //If this is a GameObject, then deactivate it as well
        if (obj instanceof GameObject) {
            obj.active = false;
        }
        for (var i = 0; i < this._pool.length; i++) {
            if (obj === this._pool[i].obj) {
                this._pool[i].used = false;
            }
        }
    };
    return Pool;
}());
/// <reference path="../Engine/Button.ts" />
/// <reference path="../Engine/GameObject.ts" />
//this is the editor that the player
//gets to use in-game
var InGameEditor = (function (_super) {
    __extends(InGameEditor, _super);
    function InGameEditor() {
        _super.call(this);
        this.ep = -1;
        this.z = -10; //we want the main game and other 'modes' to be updated FIRST
        this.name = "IGE";
    }
    InGameEditor.prototype.Init = function (mainGob) { this.main = mainGob; };
    InGameEditor.prototype.SetLevel = function (lvl) { this.lvl = lvl; this.active = true; };
    InGameEditor.prototype.Start = function () {
        var _this = this;
        this.state = this.UpdateEdit;
        var bw = 100;
        var bh = 40;
        this.colorPlus = new Button(this.e.c.width - bw - 2, this.e.c.height - bh, bw, bh, "Color +", false);
        this.colorMinus = new Button(this.e.c.width - (2 * bw + 10), this.e.c.height - bh, bw, bh, "Color -", false);
        this.e.Add(this.colorPlus);
        this.e.Add(this.colorMinus);
        this.colorPlus.active = false;
        this.colorMinus.active = false;
        this.colorPlus.clicked = function (g) { _this.IncColor(); };
        this.colorMinus.clicked = function (g) { _this.DecColor(); };
        this.timer = LIVE_EDIT_BLINK_TIME;
    };
    InGameEditor.prototype.OnActiveChanged = function (active) {
        if (!active) {
            this.colorPlus.active = false;
            this.colorMinus.active = false;
            this.SetHeld(null);
        }
    };
    InGameEditor.prototype.DoModal = function () {
        if (this.e.modal.active && this.state == this.WaitForModal) {
            this.state = this.UpdateEdit;
            this.e.modal.Show(false);
        }
        else if (!this.e.modal.active && this.state == this.UpdateEdit) {
            this.e.modal.Set("Options", ["Play Level", "Resume Editing"]);
            this.state = this.WaitForModal;
            this.e.modal.Show(true);
        }
    };
    InGameEditor.prototype.Update = function (dt) {
        if (this.e.keyboard.KeyDown('Escape')) {
            this.DoModal();
        }
        this.state(dt);
        this.timer -= dt;
        if (this.timer <= 0) {
            this.blinkEdit = !this.blinkEdit;
            this.timer = LIVE_EDIT_BLINK_TIME;
        }
    };
    InGameEditor.prototype.IncColor = function () {
        this.colorIndex = (this.colorIndex + 1) % bubbleColors.length;
        if (this.colorIndex == 1)
            this.colorIndex++;
        //this.color = G.bubbleColors[this.colorIndex];
        if (this.heldItem) {
            // if(!!this.heldItem.SetColor){
            //     this.heldItem.SetColor(this.colorIndex);
            // }
            // else
            this.heldItem.c = this.colorIndex;
        }
    };
    InGameEditor.prototype.DecColor = function () {
        this.colorIndex--;
        if (this.colorIndex == 1)
            this.colorIndex--;
        else if (this.colorIndex < 0)
            this.colorIndex = bubbleColors.length - 1;
        if (this.heldItem) {
            // if(!!this.heldItem.SetColor){
            //     this.heldItem.SetColor(this.colorIndex);
            // }
            // else
            this.heldItem.c = this.colorIndex;
        }
    };
    InGameEditor.prototype.SetHeld = function (item) {
        this.heldItem = item;
        if (item) {
            this.colorIndex = this.heldItem.c;
            this.colorMinus.active = true;
            this.colorPlus.active = true;
        }
        else {
            this.colorMinus.active = false;
            this.colorPlus.active = false;
        }
    };
    InGameEditor.prototype.WaitForModal = function (dt) {
        //Dont do anything if the modal is showing
        if (this.e.modal.active)
            return;
        var m = this.e.modal;
        //go ahead and set the state back to edit
        this.state = this.UpdateEdit;
        if (m.title == "Options") {
            if (m.res == "Play Level") {
                this.active = false;
                this.main.active = true;
                this.lvl.SetEngine(this.e); //recreate all the stuff on in the level but don't erase our changes
            }
        }
    };
    InGameEditor.prototype.UpdateEdit = function (dt) {
        var mx = this.e.mouse.x;
        var my = this.e.mouse.y;
        if (this.e.mouse.buttonsDown[0] && !Mouse.overUI) {
            this.SetHeld(null);
            //Is it a line?
            for (var i = 0; i < this.lvl.lines.length; i++) {
                if (!this.lvl.lines[i].ue)
                    continue;
                this.ep = GetClosestEndpoint(mx, my, this.lvl.lines[i], ED_SELECT_DIST);
                if (this.ep > 0) {
                    this.SetHeld(this.lvl.lines[i]);
                    this.offset1 = new V(this.heldItem.x1, this.heldItem.y1).Sub(new V(mx, my));
                    this.offset2 = new V(this.heldItem.x2, this.heldItem.y2).Sub(new V(mx, my));
                    this.midP = new V((this.heldItem.x1 + this.heldItem.x2) / 2, (this.heldItem.y1 + this.heldItem.y2) / 2);
                    this.lineLen = this.heldItem.Length();
                    return;
                }
            }
            //A fan maybe?
            for (var i = 0; i < this.lvl.fans.length; i++) {
                if (!this.lvl.fans[i].ue)
                    continue;
                //Rotate the fan?
                if (DistSq(this.lvl.fans[i].rp.x, this.lvl.fans[i].rp.y, mx, my) <= ED_SELECT_DIST * ED_SELECT_DIST) {
                    this.SetHeld(this.lvl.fans[i]);
                    this.ep = 1;
                    return;
                }
                else if (this.lvl.fans[i].wp.InPolygon(mx, my) || DistSq(this.lvl.fans[i].x, this.lvl.fans[i].y, mx, my) <= ED_SELECT_DIST * ED_SELECT_DIST * 4) {
                    this.SetHeld(this.lvl.fans[i]);
                    this.offset1 = new V(this.heldItem.x, this.heldItem.y).Sub(new V(mx, my));
                    this.ep = 3;
                    return;
                }
            }
            //perhaps a pin?
            for (var i = 0; i < this.lvl.pins.length; i++) {
                if (!this.lvl.pins[i].ue)
                    continue;
                if (DistSq(this.lvl.pins[i].x, this.lvl.pins[i].y, mx, my) <= PIN_SIZE * PIN_SIZE) {
                    this.SetHeld(this.lvl.pins[i]);
                    this.offset1 = new V(this.heldItem.x, this.heldItem.y).Sub(new V(mx, my));
                    return;
                }
            }
        }
        else if (this.e.mouse.buttonState[0] && !Mouse.overUI) {
            if (this.heldItem instanceof Line) {
                if (this.ep == 1 || this.ep == 2) {
                    var p1 = ClosestPointOnCircle(mx, my, this.midP.x, this.midP.y, this.lineLen / 2);
                    this.heldItem.x1 = p1.x;
                    this.heldItem.y1 = p1.y;
                    this.heldItem.x2 = p1.x - 2 * (p1.x - this.midP.x);
                    this.heldItem.y2 = p1.y - 2 * (p1.y - this.midP.y);
                }
                else if (this.ep == 3) {
                    this.heldItem.x1 = mx + this.offset1.x;
                    this.heldItem.y1 = my + this.offset1.y;
                    this.heldItem.x2 = mx + this.offset2.x;
                    this.heldItem.y2 = my + this.offset2.y;
                }
            }
            else if (this.heldItem instanceof Fan) {
                if (this.ep == 3) {
                    this.heldItem.x = mx + this.offset1.x;
                    this.heldItem.y = my + this.offset1.y;
                    this.heldItem.Recalc();
                }
                else if (this.ep == 1) {
                    var p = ClosestPointOnCircle(mx, my, this.heldItem.x, this.heldItem.y, 60);
                    // let p = this.cp.Copy();
                    p.Set(p.x - this.heldItem.x, p.y - this.heldItem.y);
                    //This gives us the angle between (-1, 0) and the point on our imaginary circle
                    //note the y component is -1 since that points up in our coord system and that is what we consider to be 0 degrees
                    this.heldItem.SetRot(Math.round((Math.atan2(p.y, p.x) - Math.atan2(-1, 0)) * 180 / Math.PI));
                }
            }
            else if (this.heldItem instanceof Pin) {
                this.heldItem.x = mx + this.offset1.x;
                this.heldItem.y = my + this.offset1.y;
            }
        }
    };
    InGameEditor.prototype.Draw = function (ctx) {
        this.lvl.Draw(ctx, MODE_IN_GAME_EDITOR);
        //If we have a line selected, draw it again to make it look ... selected
        if (this.heldItem && !!this.heldItem.DrawEditGizmos)
            this.heldItem.DrawEditGizmos(ctx, MODE_IN_GAME_EDITOR);
        if (!this.blinkEdit)
            DrawTxt(ctx, "Edit Mode", 0, 0, "left", "top", 'Yellow');
    };
    return InGameEditor;
}(GameObject));
//# sourceMappingURL=game.js.map