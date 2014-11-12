"use strict";

var LINE_HEIGHT = 20;
var DATE_COL;

var pad_time = function(blah) {
    blah = "" + blah;
    var pad = "00"
    return pad.substring(0, pad.length - blah.length) + blah;
};

var format_date = function(date) {
    var date_str = date.getDate() + "." + date.getMonth() + "." + date.getFullYear();
    var time = pad_time(date.getHours()) + ":" + pad_time(date.getMinutes()) + ":" + pad_time(date.getSeconds()) + "." + date.getMilliseconds();
    return date_str + " " + time;
};

var text_width = function(text) {
    var test = document.createElement("div");
    test.className = 'width-test';
    test.innerHTML = text;
    document.body.appendChild(test);
    //test.style.fontSize = fontSize;
    return test.clientWidth + 5;
};

var timed_boxes = [];

var StateBox = function(snap, info, table_name, long_form, column) {
    if (long_form) {
        this.happened = new Date(info[DATE_COL]);
        timed_boxes.push(this);
        this.text = table_name + ": " + info.id + " (" + format_date(this.happened) + ")";
    } else {
        this.text = table_name + ": " + info.id;
    };
    this.snap = snap;
    this.height = LINE_HEIGHT;
    this.width = text_width(this.text);
};

StateBox.prototype.width = function() {
};

StateBox.prototype.draw = function(x, y) {
    this.x = x; this.y = y;
    var box = this.snap.rect(x, y, this.width, this.height);
    box.attr({
        fill: "rgb(236, 240, 241)",
        stroke: "#1f2c39",
        strokeWidth: 1
    });
    this.snap.text(x+3, y+15, this.text);
    return this;
};

StateBox.prototype.draw_at_middle = function(middle, y) {
        var x = middle - (this.width/2);
        this.draw(x, y);
    };

StateBox.prototype.middle = function() { return this.width/2; };

StateBox.prototype.bottom_middle = function() {
        return {x: this.x + this.width/2, y: this.y+this.height};
    };

StateBox.prototype.top_middle = function() {
        return {x: this.x + this.width/2, y: this.y};
    };

StateBox.prototype.connect_to = function(other_box) {
    this.snap.line(this.top_middle().x,
                   this.top_middle().y,
                   other_box.bottom_middle().x,
                   other_box.bottom_middle().y)
        .attr({stroke:"#1f2c39"});
    return this;
};


var Transition = function(snap, info, column) {
    StateBox.call(this, snap, info, '');
    this.happened = new Date(info.happened);
    this.text = ["Transition: " + format_date(this.happened)];
    timed_boxes.push(this);
    for (var key in info.changes) {
        var change_text = info.changes[key][0] + " -> " + info.changes[key][1];
        this.text.push(key + " : " + change_text);
    };
    this.height = LINE_HEIGHT * this.text.length;
    this.width = Math.max.apply(
        null,
        this.text.map(function(x) { return text_width(x); }));
    this.column = column;
};

Transition.prototype = Object.create(StateBox.prototype);

Transition.prototype.draw = function(x, y) {
    this.x = x; this.y = y;
    var box = this.snap.rect(x, y, this.width, this.height);
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

var Column = function(snap, table_info) {
    this.boxes = [];
    var sequence = table_info.sequence;
    var self = this;
    sequence.forEach(function(piece, index) {
        if (piece.transition) {
            self.boxes.push(new Transition(snap, piece, table_info.name, self));
        } else {
            self.boxes.push(new StateBox(snap, piece, table_info.name, index===0, self));
        };
    });
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
    if (typeof this._column_middle !== 'undefined') {return this._column_middle; };
    var middles = this.boxes.map(function(box) { return box.middle(); });
    this._column_middle = Math.max.apply(null, middles);
    return this._column_middle;
};


window.onload = function()  {
    var left_offset = 10;
    var s = Snap("#svg");
    DATE_COL = data.date_column;
    var table_data = data.table_data
    var timed_entries = [];
    for (var index = 0; index < table_data.length; index++ ) {
        var col = new Column(s, table_data[index]);
        left_offset = col.draw(left_offset, 30) + 20;
    };
    timed_boxes.sort(function(x, y) { return x.happened > y.happened; });
    timed_boxes.forEach(function(x, time_index){ x.time_index = time_index; });
};
