function selectField(dom){
    selectField.base.call(this, dom);
    this.tooltip($.tooltip().message("Invalid"));
}
$.Class.extend(selectField, abstractSelect);
$.fields.select = function(dom){ return new selectField(dom); }