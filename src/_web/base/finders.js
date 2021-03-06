$.findOuterDims = function(dom) {
    var d = $.ele(dom);
    if(!d) return { width: 0, height: 0 };
    return { width: d.offsetWidth, height: d.offsetHeight };
},
$.findInnerDims = function(dom) {
    var d = $.ele(dom);
    if(!d) return { width: 0, height: 0 };
    return { width: d.clientWidth, height: d.clientHeight };
},
$.findOffset = function(dom) {
    var d = $.ele(dom), x = 0, y = 0;
    if(!d) return { left: 0, top: 0 };
    do {
        x += d.offsetLeft || 0;
        y += d.offsetTop || 0;
    }
    while ((function(){
        try { d = d.offsetParent; }
        catch(e) { d = null; }
        return $.exists(d);
    })());
    return { left: x, top: y };
}
$.findBoundedOffset = function(dom){
    var d = $.ele(dom);
    if(!d) return { left: 0, top: 0 };
    return { left: d.offsetLeft, top: d.offsetTop };
},
$.findScrollDims = function(dom) {
    var d = $.ele(dom);
    if(!d) return { width: 0, height: 0 };
    return { width: d.scrollWidth, height: d.scrollHeight };
}

$.findScrollOffset = function(dom) {
    var d = $.ele(dom), x = 0, y = 0;
    if(!d) return { left: 0, top: 0 };
    do {
        x += d.scrollLeft || 0;
        y += d.scrollTop || 0;
    }
    while ((function(){
        try { d = d.parentNode; }
        catch(e) { d = null; }
        return $.exists(d);
    })());
    return { left: x, top: y };
}