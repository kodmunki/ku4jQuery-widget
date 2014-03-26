$.DomClass = function(dom){
    $.DomClass.base.call(this);
    if(!$.exists(dom)) $.ku4exception("$.dom", "$.DomClass requires valid DOM node.");
    this.dom(dom);
}
$.DomClass.prototype = {
    dom: function(dom){ return this.property("dom", dom); }
}
$.Class.extend($.DomClass, $.Class);