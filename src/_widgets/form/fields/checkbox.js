function checkboxField(dom){
    checkboxField.base.call(this, dom);
    this.tooltip($.tooltip().message("Invalid"));
}
$.Class.extend(checkboxField, abstractCheckbox);
$.fields.checkbox = function(dom){ return new checkboxField(dom); }