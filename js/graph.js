"use strict";

var LINE_HEIGHT = 20;
var DATE_COL;
var DEFAULT_VERT_MARGIN = 30;

var pad_time = function(blah) {
    blah = "" + blah;
    var pad = "00"
    return pad.substring(0, pad.length - blah.length) + blah;
};

var format_date = function(date) {
    var date_str = date.getDate() + "." + (date.getMonth() + 1) + "." + date.getFullYear();
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
    this.column = column;
};

StateBox.prototype.draw = function(y, connect_to_previous) {
    this.x = this.column.column_middle() - (this.width/2);
    if (this.previous && this.previous.y >= y) {
        y = this.previous.y + this.previous.height + DEFAULT_VERT_MARGIN;
    };
    this.y = y;
    this.column.last_y = this.y;
    var box = this.snap.rect(this.x, this.y, this.width, this.height);
    box.attr({
        fill: "rgb(236, 240, 241)",
        stroke: "#1f2c39",
        strokeWidth: 1
    });
    this.draw_text();
    if (this.next && !this.next.happened) {
        this.next.draw(this.y + this.height + DEFAULT_VERT_MARGIN);
        this.connect_to(this.next);
    };
    if (connect_to_previous && this.previous) {
        this.connect_to(this.previous);
    };
    return this;
};

StateBox.prototype.draw_text = function() {
    this.snap.text(this.x+3, this.y+15, this.text);
};


StateBox.prototype.bottom_middle = function() {
    return {x: this.x + this.width/2, y: this.y+this.height};
};

StateBox.prototype.top_middle = function() {
    return {x: this.x + this.width/2, y: this.y};
};

StateBox.prototype.connect_to = function(other_box) {
    var line;
    if (this.y > other_box.y) {
        line = this.snap.line(this.top_middle().x,
                              this.top_middle().y,
                              other_box.bottom_middle().x,
                              other_box.bottom_middle().y);
    } else {
        line = this.snap.line(other_box.top_middle().x,
                              other_box.top_middle().y,
                              this.bottom_middle().x,
                              this.bottom_middle().y);
    };
    line.attr({stroke:"#1f2c39"});
    return this;
};


var Transition = function(snap, info, table_name, column) {
    StateBox.call(this, snap, info, '');
    this.happened = new Date(info.happened);
    this.text = ["Transition: " + format_date(this.happened)];
    this.transition = true;
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

Transition.prototype.draw_text = function() {
    for (var counter=0; counter < this.text.length; counter++) {
        this.snap.text(this.x+3,
                       this.y+15 + LINE_HEIGHT*counter,
                       this.text[counter]);
    };
};


var Column = function(snap, table_info, left_offset) {
    this.boxes = [];
    var sequence = table_info.sequence;
    var self = this;
    var new_box, last;
    sequence.forEach(function(piece, index) {
        if (piece.transition) {
            new_box = new Transition(snap, piece, table_info.name, self);
        } else {
            new_box = new StateBox(snap, piece, table_info.name, index===0, self);
        };
        self.boxes.push(new_box);
        if (last) {
            last.next = new_box;
            new_box.previous = last;
        };
        last = new_box;
    });
    this.width = Math.max.apply(null, self.boxes.map(function(x) {return x.width;}));
    this.left_offset = left_offset;
};


Column.prototype.column_middle = function() {
    if (typeof this._column_middle !== 'undefined') return this._column_middle;
    var widths = this.boxes.map(function(box) { return box.width; });
    this._column_middle = Math.max.apply(null, widths)/2 + this.left_offset;
    return this._column_middle;
};


window.onload = function()  {
    var left_offset = 10;
    var s = Snap("#svg");
    DATE_COL = data.date_column;
    var table_data = data.table_data
    var timed_entries = [];
    for (var index = 0; index < table_data.length; index++ ) {
        var col = new Column(s, table_data[index], left_offset);
        left_offset += col.width + 20;
    };
    timed_boxes.sort(function(x, y) { return x.happened > y.happened; });
    timed_boxes.forEach(function(x, time_index){ x.time_index = time_index; });
    var latest_y = 5;
    for (var index = 0; index < timed_boxes.length; index++) {
        var box = timed_boxes[index];
        box.draw(latest_y, true);
        latest_y = box.y + box.height + DEFAULT_VERT_MARGIN;
    }
};
