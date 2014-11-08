"use strict";
var LINE_HEIGHT = 20;

var pad_time = function(blah) {
    blah = "" + blah;
    var pad = "00"
    return pad.substring(0, pad.length - blah.length) + blah;
};

var StateBox = function(snap, info, table_name, long_form) {
    this.text = table_name + ": " + info.id;
    this.snap = snap;
    this.height = LINE_HEIGHT;
};

StateBox.prototype.width = function() { return this.text.length*9; };

StateBox.prototype.draw = function(x, y) {
    this.x = x; this.y = y;
    var box = this.snap.rect(x, y, this.width(), LINE_HEIGHT);
    box.attr({
        fill: "rgb(236, 240, 241)",
        stroke: "#1f2c39",
        strokeWidth: 1
    });
    this.snap.text(x+3, y+15, this.text);
    return this;
};

StateBox.prototype.draw_at_middle = function(middle, y) {
        var x = middle - (this.width()/2);
        this.draw(x, y);
    };

StateBox.prototype.middle = function() { return this.width()/2; };

StateBox.prototype.bottom_middle = function() {
        return {x: this.x + this.width()/2, y: this.y+this.height};
    };

StateBox.prototype.top_middle = function() {
        return {x: this.x + this.width()/2, y: this.y};
    };

StateBox.prototype.connect_to = function(other_box) {
    this.snap.line(this.top_middle().x,
                   this.top_middle().y,
                   other_box.bottom_middle().x,
                   other_box.bottom_middle().y)
        .attr({stroke:"#1f2c39"});
    return this;
};

var Transition = function(snap, info) {
    StateBox.call(this, snap, info, '');
    var happened = new Date(info.happened);
    var date = happened.getDate() + "." + happened.getMonth() + "." + happened.getFullYear();
    var time = pad_time(happened.getHours()) + ":" + pad_time(happened.getMinutes()) + ":" + pad_time(happened.getSeconds()) + "." + happened.getMilliseconds();
    this.text = ["Transition: " + date + " " + time];
    for (var key in info.changes) {
        var change_text = info.changes[key][0] + " -> " + info.changes[key][1];
        this.text.push(key + " : " + change_text);
    };
    this.height = LINE_HEIGHT * this.text.length;
};

Transition.prototype = Object.create(StateBox.prototype);

Transition.prototype.draw = function(x, y) {
    this.x = x; this.y = y;
    var box = this.snap.rect(x, y, this.width(), this.height);
    box.attr({
        fill: "rgb(236, 240, 241)",
        stroke: "#1f2c39",
        strokeWidth: 1
    });
    for (var counter=0; counter < this.text.length; counter++) {
        this.snap.text(x+3, y+15 + LINE_HEIGHT*counter, this.text[counter]);
    };
    return this;
};

Transition.prototype.width = function() {
    return Math.max.apply(
        null,
        this.text.map(function(x) { return x.length;})
    )*9;
};

var Column = function(snap, table_name, infos) {
    this.boxes = [];
    for (var index = 0; index < infos.length; index++) {
        if (infos[index].transition) {
            this.boxes.push(new Transition(snap, infos[index], table_name));
        } else {
            this.boxes.push(new StateBox(snap, infos[index], table_name, index===0));
        };
    };
};
Column.prototype.draw = function(offset, margin) {
    var col_middle = this.column_middle();
    var middle = col_middle + offset;
    var y_index = 1;
    for (var index = 0; index < this.boxes.length; index++) {
        this.boxes[index].draw_at_middle(middle, y_index);
        y_index += this.boxes[index].height + margin;
        if (!!index) this.boxes[index].connect_to(this.boxes[index-1]);
    };
    return col_middle*2 + offset;
};

Column.prototype.column_middle = function() {
    var _middle = 0;
    for (var index = 0; index < this.boxes.length; index++) {
        var entry_middle = this.boxes[index].middle();
        if (entry_middle > _middle) _middle = entry_middle;
    };
    return _middle;
};


window.onload = function()  {
    var left_offset = 10;
    var s = Snap("#svg");
    for (var key in transitions) {
        var col = new Column(s, key, transitions[key]);
        left_offset = col.draw(left_offset, 30) + 20;
    };
};
