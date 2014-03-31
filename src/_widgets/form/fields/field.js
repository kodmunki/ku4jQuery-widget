function field(dom){
    field.base.call(this, dom);
    this.tooltip($.tooltip().message("Invalid"));
}
$.Class.extend(field, abstractField);
$.fields.field = function(dom){ return new field(dom); }