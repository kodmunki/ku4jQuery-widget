(function(l){ $=l;
$.DomClass = function(dom){
    $.DomClass.base.call(this);
    if(!$.exists(dom)) $.ku4exception("$.dom", "$.DomClass requires valid DOM node.");
    this.dom(dom);
}
$.DomClass.prototype = {
    dom: function(dom){ return this.property("dom", dom); }
}
$.Class.extend($.DomClass, $.Class);

var $ku = {
    css: {
        addClass: function(dom, classname) {
            var d = $.ele(dom), cn = d.className;
            if ($.ku.css.hasClass(dom, classname)) return;
            d.className += (/^[^\s]/.test(cn)) ? (" " + classname) : classname;
        },
        hasClass: function(dom, classname) {
            if (!$.exists(classname)) return false;
            return (new RegExp(classname)).test(($.ele(dom)).className);
        },
        removeClass: function(dom, classname) {
            var d = $.ele(dom), cn = d.className;
            if (!$.ku.css.hasClass(dom, classname)) return;
            d.className = $.str.trim(cn.replace(new RegExp("(^|\\s)" + classname + "(?![\\w\\-])"), ""));
        }
    },
    getText: function(dom) {
        var d = $.ele(dom);
        return d.textContent || d.innerText;
    },
    quirks: {
        setOpacity: function(dom, o){
            var O = o/100;
            dom.style["opacity"] = O;
            dom.style["-moz-opacity"] = O;
            dom.style["-webkit-opacity"] = O;
            dom.style["filter"] = $.str.format("alpha(opacity={0})", o);
        },
        clearOpacity: function(dom){
            $.ku.style.set(dom, {opacity:null, "-moz-opacity":null, "-webkit-opacity":null, filter: null});
        }
    },
    ready: function(func, isLazy) { _funcs[_funcs.length] = { f: func, b: isLazy || false }; },
    redraw: function(dom) {
        var d = $.ele(dom) || document.documentElement,
            cd = d.style.display || "";
        d.style.display = "none";
        var os = d.offsetHeight;
        d.style.display = cd;
    },
    style: {
        set: function(dom, s, value){
            var d = $.ele(dom);
            function getKey(n){ return (/\-/.test(n)) ? n.replace(/\-\w/, n.charAt(n.indexOf("-")+1).toUpperCase()) : n}
            if($.isString(s)){
                try{ d.style[getKey(s)] = value; }
                catch(e){  }
            }
            for(var n in s) {
                var key = getKey(n);
                if(/opacity/i.test(key)){ $.ku.quirks.setOpacity(dom, s[n]); continue; }
                try { d.style[key] = s[n]; }
                catch(e) { continue; }
            }
        },
        get: function(dom, style){
            var node = $.ele(dom);

            function getStyle(d, s){
                var key = (/\-/.test(s)) ? s.replace(/\-\w/, s.charAt(s.indexOf("-")+1).toUpperCase()) : s;
                try { return window.getComputedStyle(d, null).getPropertyValue(s); }
                catch(e){
                    return ($.exists(d.currentStyle)) ? d.currentStyle[s]
                           : ($.exists(d.style)) ? d.style[key] : "";
                }
            }

            if(/opacity/i.test(style)) {
                var opacity = getStyle(node, style);
                if($.exists(opacity)) return parseFloat(opacity) * 100;
                else {
                    var filter = /alpha\(opacity=\d+(\.\d+)?\)/i.exec(node.style.filter);
                    if(!$.exists(filter)) return 100;
                    var number = /\d+(\.\d+)?/i.exec(filter[0]);
                    if(!$.exists(number)) return 100;
                    return parseFloat(number[0]);
                }
            }
            return getStyle(node, style)
        },
        toNumber: function(v){ return isNaN(v) ? 0 : parseFloat(this.stripUnit(v)); },
        stripUnit: function(v){ return ($.exists(v) && $.exists(v.replace)) ? v.replace(/[^\-\.\d]/g, "") : v; },
        getUnit: function(v){ return v.match(/[^\-\.\d]{2}/)[0]; }
    },
    swapDom: function(dom, forDom){
        var d = $.ele(dom)
            f = $.ele(forDom);
        d.parentNode.replaceChild(f, d);
    }
}
$.ku = $ku;

$.clearNode = function(dom) {
    var e = $.ele(dom);
    if(!e) return;
    
    while (e.hasChildNodes()) e.removeChild(e.firstChild);
}

$.create = function(x) {
    if(!x) return null;
    
    var o = ($.isString(x)) ? { x: {}} : x, E, attr;
    for (var n in o) {
        if (n == "content") continue;
        E = document.createElement(n);
        attrs = o[n];
    }
    for (var n in attrs) {
        var v = attrs[n];
        if(/class/i.test(n)){
            $.ku.css.addClass(E, v);
            continue;
        }
        if(/style/i.test(n)){
             $.ku.style.set(E, v);
            continue;
        }
        E.setAttribute(n, v);
    }
    try {
        var c = o.content;
        if(!c) return E;    
            
        var i = (!c) ? 1 : c.length;
        
        if($.exists(c.nodeName)) {
            E.appendChild(c);
            return E;
        }
        if (!$.isArray(c)) {
            E.innerHTML += c;
            return E;
        }
        while (i--) {
            var C = c[i];
            if ($.isString(C) || !isNaN(C)) {
                E.innerHTML += C;
                continue;
            }
            var o = (C.hasOwnProperty("appendChild"))
                ? C
                : $.create(C);
            E.appendChild(o);
        }
    }
    catch (e) { }
    finally { return E; }
}

$.ele = function(o) {
    if(!o) return null;
    return ($.isEvent(o)) ? $.evt.ele(o)
          :($.isString(o)) ? document.getElementById(o)
          :($.exists(o.dom)) ? o.dom : o;
}

var domEvent = function(dom, evt, action, scope, bubbles){
    this.dom = dom;
    this.evt = evt;
    this.action = action;
    this.scope = scope;
    this.bubbles = bubbles;
}
$.evt = {
    add: function(dom, evt, action, scope, bubbles) {
        if(!$.ele(dom)) $.ku4exception("$.evt", $.str.format("argument dom == {0} at $.evt.add", dom));
        var d = $.ele(dom),
            e = evt,
            s = scope || d,
            b = bubbles || false,
            a = function() { action.apply(s, arguments); };
            
        if ($.exists(d.addEventListener))
            d.addEventListener(e, a, b);
        else if ($.exists(d.attachEvent))
            d.attachEvent("on" + e, a);
        else
            d["on" + e] = a;

        return new domEvent(d, e, a, s, b);
    },
    remove: function(domEvt) {
        var d = domEvt.dom,
            e = domEvt.evt,
            s = domEvt.scope,
            b = domEvt.bubbles,
            a = domEvt.action;
            
        if (d.removeEventListener)
            d.removeEventListener(e, a, b);
        else if (d.detachEvent)
            d.detachEvent("on" + e, a);
        else
            d["on" + e] = null;

        return this;
    },
    ele: function(e){
        try { return (e.srcElement) ? e.srcElement : e.target; }
        catch(e) { return null; }
    },
    mute: function(e) {
        if ($.exists(e.preventDefault)) e.preventDefault();
        if ($.exists(e.stopPropogation)) e.stopPropogation();
        e.returnValue = false;
        e.cancelBubble = true;
        return this;
    }
}

$.findOuterDims = function(dom) {
    var d = $.ele(dom);
    return { width: d.offsetWidth, height: d.offsetHeight };
},
$.findInnerDims = function(dom) {
    var d = $.ele(dom);
    return { width: d.clientWidth, height: d.clientHeight };
},
$.findOffset = function(dom) {
    var d = $.ele(dom), x = 0, y = 0;
    if(!d) return null;
    do {
        x += d.offsetLeft;
        y += d.offsetTop;
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
    if(!d) return null;
    return{ left: d.offsetLeft, top: d.offsetTop }
},
$.findScrollDims = function(dom) {
    var d = $.ele(dom);
    return { width: d.scrollWidth, height: d.scrollHeight };
}

$.findScrollOffset = function(dom) {
    var d = $.ele(dom), x = 0, y = 0;
    if(!d) return null;
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

var browser = function(navigator) {
    this._navigator = navigator;

    agents = {
        _isIE: "MSIE",
        _isNetscape: "Netscape",
        _isFirefox: "Firefox",
        _isOpera: "Opera",
        _isSafari: "Safari",
        _isChrome: "Chrome"
    };

    this._isIE = false;
    this._isNetscape = false;
    this._isFirefox = false;
    this._isOpera = false;
    this._isSafari = false;
    this._isChrome = false;
    this._isUnknown = true;
    this._version = "";

    if(!$.isObject(navigator)) return;

    var navigator = this._navigator,
        userAgent = navigator.userAgent;

    function isAgentTest(testValue) {
        return !$.isNullOrEmpty(userAgent) &&
               (new RegExp(testValue,"i")).test(userAgent);
    }

    function findVersion(testValue) {
        try {
            var version = (new RegExp("Version\\/(\\d+\\.?){1,}","i")).exec(userAgent),
                name = (new RegExp(testValue + "\\/(\\d+\\.?){1,}","i")).exec(userAgent),
                ver = $.exists(version) ? version : name;
            return (new RegExp("(\\d+\\.?){1,}")).exec(ver[0])[0];
        }
        catch(e) { return ""; }
    }

    var n, result, testValue;
    for(n in agents) {
        testValue = agents[n];
        result = isAgentTest(testValue);

        if(!result) continue;

        this[n] = result;
        this._version = findVersion(testValue);
        this._isUnknown = false;
    }

    this._fullVersion = navigator.appVersion;
    this._platform = navigator.platform;
    this._allInfo =  this._fullVersion + this._platform;
}
browser.prototype = {
    isIE: function() { return this._isIE; },
    isNetscape: function() { return this._isNetscape; },
    isFirefox: function() { return this._isFirefox; },
    isOpera: function() { return this._isOpera; },
    isSafari: function() { return this._isSafari && !this._isChrome; },
    isChrome: function() { return this._isChrome; },
    isUnknown: function() { return this._isUnknown; },
    platform: function(){ return this._platform; },
    fullVersion: function(){ return this._fullVersion; },
    version: function() { return this._version; }
}
var browser_instance;
$.ku.browser = function(){
    if ($.exists(browser_instance)) return browser_instance;
    browser_instance = new browser(navigator);
    return browser_instance;
 }
$.ku.browser.Class = browser;

var dom = function(query) {
    dom.base.call(this, $.ele(query));
	
	var display = this.style("display") || "block";
    this._display = (/none/i.test(display)) ? "block" : display;
    this._liveEvents = $.hash();
}
dom.prototype = {
	attribute: function(key, value){
		var d = this.dom();
		if($.isUndefined(value)) return d.getAttribute(key);
		d.setAttribute(key, value);
		return this;
	},
    addClass: function(value){
        $.ku.css.addClass(this.dom(), value);
        return this;
    },
    removeClass: function(value){
        $.ku.css.removeClass(this.dom(), value);
        return this;
    },
    hasClass: function(value){
        $.ku.css.hasClass(this.dom(), value);
        return this;
    },
    style: function(property, value){
        if($.isString(property) && !$.exists(value))
            return $.ku.style.get(this.dom(), property);
        $.ku.style.set(this.dom(), property, value);
        return this;
    },
    value: function(value){
        if(!$.exists(value)) return this.dom().value;
        this.dom().value = value;
        return this;
    },
    content: function(content){
        if(!$.exists(content) ) return this;
        if($.isNumber(content) || $.isString(content)) return this.html(content);
        return this.appendChild(content);
    },
    cloneNode: function(deep){
        return this._dom.cloneNode(deep||true);
    },
    html: function(value){
        if(!$.exists(value)) return this.dom().innerHTML;
        this.dom().innerHTML = value;
        return this;
    },
    text: function(value){
        if(!$.exists(value)) return $.ku.getText(this.dom());
        $.ku.setText(this.dom(), value);
        return this;
    },
    prependChild: function(dom){
        var _dom = this.dom(),
            firstChild = _dom.firstChild;

        if($.exists(firstChild)) _dom.insertBefore(dom, firstChild);
        else _dom.appendChild(dom);

        return this;
    },
    appendChild: function(dom){
        this.dom().appendChild(dom);
        return this;
    },
    removeChild: function(dom){
        this.dom().removeChild(dom);
        return this;
    },
    insertBefore: function(dom){
        dom.parentNode.insertBefore(this.dom(), dom);
        return this;
    },
    insertAfter: function(dom){
        if($.exists(dom.nextSibling))
            dom.parentNode.insertBefore(this.dom(), dom.nextSibling);
        else dom.parentNode.appendChild(this.dom());
        return this;
    },
    appendTo: function(dom){
        dom.appendChild(this.dom());
        return this;
    },
    detach: function(){
        try {
            var d = this.dom();
            d.parentNode.removeChild(d);
        }
        catch(e){ }
        finally{ return this; }
    },
    innerDims: function(value){
        if(!$.exists(value))
            return $.coord.parse($.findInnerDims(this.dom()));
        
        var p = value.toPixel()
        this.style({"width": p.x(), "height": p.y()})
        return this;
    },
    outerDims: function(value){
        if(!$.exists(value)) return $.coord.parse($.findOuterDims(this.dom()));
        var outer = this.outerDims().subtract(this.innerDims());
        return this.innerDims(value.subtract(outer));
    },
    innerWidth: function(value){
        var d = this.innerDims();
        if(!$.exists(value)) return $.coord(d.x(), 0);
        return this.innerDims($.coord(value, d.y()));
    },
    innerHeight: function(value){
        var d = this.innerDims();
        if(!$.exists(value)) return $.coord(0, d.y());
        return this.innerDims($.coord(d.x(), value));
    },
    outerWidth: function(value){
        var d = this.outerDims();
        if(!$.exists(value)) return $.coord(d.x(), 0);
        return this.outerDims($.coord(value, d.y()));
    },
    outerHeight: function(value){
        var d = this.outerDims();
        if(!$.exists(value)) return $.coord(0, d.y());
        return this.outerDims($.coord(d.x(), value));
    },
    boundedOffset: function(){
        return $.coord.parse($.findBoundedOffset(this.dom()));
    },
    layoutDims: function(){
        var p = this.dom().parentNode;
        if(!$.exists(p)) return $.coord.zero();
        var d = $.dom(p);
        return d.outerDims().subtract(d.innerDims()).half();
    },
    offset: function(){
        return $.coord.parse($.findOffset(this.dom()));
    },
    center: function(){
        return this.offset().add(this.outerDims().half());
    },
    scrollDims: function(){
        return $.coord.parse($.findScrollDims(this.dom()));
    },
    scrollOffset: function(){
        return $.coord.parse($.findScrollOffset(this.dom()));
    },
    clear: function(){
        $.clearNode(this.dom());
        return this;
    },
    redraw: function(){
        $.ku.redraw(this.dom());
        return this;
    },
    swap: function(other){
        $.ku.swapDom(this.dom(), other.dom());
        return other;
    },
    show: function(){
       this.style({display: this._display});
       return this;
    },
    hide: function(){
        this.style({display: "none"});
        return this;
    },
    isVisible: function(){
        var tl = this.offset(),
            br = this.offset().add(this.innerDims());
        
        return $.exists(this.dom().parentNode) &&
            !/NONE|^$/i.test(this.style("display")) &&
            $.window().scrollOffset().isLeftOf(br) &&
            $.window().scrollOffset().isAbove(br) &&
            $.window().scrollDims().isRightOf(tl) &&
            $.window().scrollDims().isBelow(tl);
    },
    onmouseover: function(act, scp, id){ return this._addEvent("mouseover", act, scp, id);  },
    onmouseout: function(act, scp, id){ return this._addEvent("mouseout", act, scp, id);  },
    onmousedown: function(act, scp, id){ return this._addEvent("mousedown", act, scp, id);  },
    onmouseup: function(act, scp, id){ return this._addEvent("mouseup", act, scp, id);  },
    onmousemove: function(act, scp, id){ return this._addEvent("mousemove", act, scp, id);  },
    onclick: function(act, scp, id){ return this._addEvent("click", act, scp, id);  },
    ondoubleclick: function(act, scp, id){ return this._addEvent("dblclick", act, scp, id);  },
    onkeydown: function(act, scp, id){ return this._addEvent("keydown", act, scp, id);  },
    onkeyup: function(act, scp, id){ return this._addEvent("keyup", act, scp, id);  },
    onkeypress: function(act, scp, id){ return this._addEvent("keypress", act, scp, id);  },
    onblur: function(act, scp, id){ return this._addEvent("blur", act, scp, id);  },
    onchange: function(act, scp, id){ return this._addEvent("change", act, scp, id);  },
    onerror: function(act, scp, id){ return this._addEvent("error", act, scp, id);  },
    onfocus: function(act, scp, id){ return this._addEvent("focus", act, scp, id);  },
    onload: function(act, scp, id){ return this._addEvent("load", act, scp, id);  },
    onresize: function(act, scp, id){ return this._addEvent("resize", act, scp, id);  },
    onscroll: function(act, scp, id){ return this._addEvent("scroll", act, scp, id);  },
    onselect: function(act, scp, id){ return this._addEvent("select", act, scp, id);  },
    onresize: function(act, scp, id){ return this._addEvent("resize", act, scp, id);  },
    onunload: function(act, scp, id){ return this._addEvent("unload", act, scp, id);  },
    onorientationchange: function(act, scp, id){ return this._addEvent("orientationchange", act, scp, id);  },
    ontouchstart: function(act, scp, id){ return this._addEvent("touchstart", act, scp, id);  },
    ontouchend: function(act, scp, id){ return this._addEvent("touchend", act, scp, id);  },
    ontouchmove: function(act, scp, id){ return this._addEvent("touchmove", act, scp, id);  },
    removeEvent: function(id) {
        var evt = this._liveEvents.find(id);
        if(!$.exists(evt)) return this;
        return this._removeEvent(evt, id);
    },
    clearEvents: function(){
        this._liveEvents.listValues().each(function(evt) { this._removeEvent(evt); }, this);
         return this;
    },
    _addEvent: function(type, act, scp, id) {
        var ID = id || $.uid("evt"), liveEvents = this._liveEvents;
        if(liveEvents.containsKey(ID)) return this;
        liveEvents.add(ID, $.evt.add(this.dom(), type, act, scp));
        return this;
    },
    _removeEvent: function(evt, id){
        $.evt.remove(evt);
        this._liveEvents.remove(id);
        return this;
    }
}
$.Class.extend(dom, $.DomClass)
$.dom = function(query){ return new dom(query); }
$.dom.parseHtml = function(html){
    var dom = $.create({'div':{}, content: html})
    if(dom.childNodes.length != 1) return null;
    return $.dom(dom.firstChild);
}
$.dom.Class = dom;

function kuWindow() {
    kuWindow.base.call(this);
    this._body = $.dom(document.body);
}
kuWindow.prototype = {
    isDisabled: function(){ return this.get("disabled"); },
    isPortrait:function(){ return this.orientation.isLandscape();  },
    isLandscape:function(){ return Math.abs(window.orientation) == 90; },
    disable: function() {
        this._disabled = true;
        document.body.appendChild(window_disableDom);
        return this;
    },
    enable: function() {
        if(!this.isDisabled()) return this;
        document.body.removeChild(window_disableDom);
        this._disabled = false;
        return this;
    },
    dims: function() {
        var  x = window.innerWidth || document.documentElement.clientWidth,
            y = window.innerHeight || document.documentElement.clientHeight;
        return $.coord(x, y);
    },
    center: function() {
        return this.dims().divide($.coord(2, 2));
    },
    scrollOffset: function() {
        var docEle = document.documentElement,
            body = document.body,
            x = Math.max(docEle.scrollLeft, body.scrollLeft),
            y = Math.max(docEle.scrollTop, body.scrollTop);
        return $.coord(x,y);
    },
    scrollDims: function() {
        var docEle = document.documentElement,
            body = document.body,
            x = Math.max(docEle.scrollWidth, body.scrollWidth),
            y = Math.max(docEle.scrollHeight, body.scrollHeight);
        return $.coord(x,y);
    },
    scrollCenter: function() {
        return this.center().add(this.scrollOffset());
    },
    contains: function(coord){
        var topLeft = this.scrollOffset(),
            bottomRight = this.scrollDims();
            
        return !(coord.isAbove(topLeft) ||
                 coord.isLeftOf(topLeft) ||
                 coord.isRightOf(bottomRight) ||
                 coord.isBelow(bottomRight));
    },
    redraw: function(){
        $.ku.redraw(document.body);
        $.ku.redraw(document.documentElement);
        return this;
    },

    onmousedown: function(act, scp, id){ return this._body.onmousedown(act, scp, id);  },
    onmouseup: function(act, scp, id){ return this._body.onmouseup(act, scp, id);  },
    ontouchstart: function(act, scp, id){ return this._body.ontouchstart(act, scp, id);  },
    ontouchend: function(act, scp, id){ return this._body.ontouchend(act, scp, id);  },
    onclick: function(act, scp, id){ return this._body.onclick(act, scp, id);  },
    ondoubleclick: function(act, scp, id){ return this._body.ondoubleclick(act, scp, id);  },
    onkeydown: function(act, scp, id){ return this._body.onkeydown(act, scp, id);  },
    onkeyup: function(act, scp, id){ return this._body.onkeyup(act, scp, id);  },

    scrollTo: function(coord) { window.scrollTo(coord.x(), coord.y()); return this; },
    onresize: function(func, scp, id) { window_onresize.add(func, scp, id); return this; },
    onscroll: function(func, scp, id) { window_onscroll.add(func, scp, id); return this; },
    onspin: function(func, scp, id) { window_onspin.add(func, scp, id); return this; },
    remove: function(id){
        window_onresize.remove(id);
        window_onscroll.remove(id);
        window_onspin.remove(id);
        this._body.removeEvent(id);
        return this;
    }
}
$.Class.extend(kuWindow, $.Class);
var window_disableDom = $.create({div:{"class":"ku-window-disabled"}}),
    window_onresize = $.observer(), 
    window_onscroll = $.observer(),
    window_onspin = $.observer(),
    window_popup = function(){ };
    window_popup.prototype = {
        uri: function(uri){ return this.property("uri", uri); },
        offset: function(offset){ return this.property("offset", offset); },
        dims: function(dims){ return this.property("dims", dims); },

        channelmode: function(channelmode){ return this.property("channelmode", channelmode); },
        directories: function(directories){ return this.property("directories", directories); },
        fullscreen: function(fullscreen){ return this.property("fullscreen", fullscreen); },
        location: function(location){ return this.property("location", location); },
        menubar: function(menubar){ return this.property("menubar", menubar); },
        scrollbars: function(scrollbars){ return this.property("scrollbars", scrollbars); },
        titlebar: function(titlebar){ return this.property("titlebar", titlebar); },
        toolbar: function(toolbar){ return this.property("toolbar", toolbar); },
        open: function(){ }
    };
$.Class.extend(window_popup, $.Class);

var window_instance;
$.window = function(){
    if ($.exists(window_instance)) return window_instance;
    $.evt.add(window, "resize", function(){ window_onresize.notify(); });
    $.evt.add(window,"scroll",function(){ window_onscroll.notify(); });
    $.evt.add(window,"orientationchange",function(){ window_onspin.notify(); });
    window_instance = new kuWindow();
    return window_instance;
 }

$.ku.equations = {
    cycle: function(p, xa, xm, ya, ym){
        return new $.coord(
            this.sin(p.x, xa, xm),
            this.cos(p.y, ya, ym));
    },
    cos: function(n, a, m){
        return n + Math.cos(a) * m;  
    },
    cosH: function(p, a, m){
        return new $.coord(this.cos(p.x, a, m), p.y);
    },
    cosV: function(p, a, m){
        return new $.coord(p.x, this.cos(p.y, a, m));
    },
    sin: function(n, a, m){
        return n + Math.sin(a) * m;  
    },
    sinH: function(p, a, m){
        return new $.coord(this.sin(p.x, a, m), p.y);
    },
    sinV: function(p, a, m){
        return new $.coord(p.x, this.sin(p.y, a, m));
    }
}   

$.anime = {
    algorithms: {
        ease: { }
    }
}

var easeLinear = function(ease){
    this._ease = ease || .1;
}
easeLinear.prototype = {
    calculate: function(current, end){ return (end - current) * this._ease; }
}
$.anime.algorithms.ease.linear = function(ease){ return new easeLinear(ease); }

var jump = function(){ }
jump.prototype = { calculate: function(current, end){ return end-current; } }
$.anime.algorithms.jump = function(){ return new jump(); }

var spring = function(spring, mu){
    this._spring = spring || .4;
    this._mu = mu || .6;
}
spring.prototype = {
    calculate: function(current, end, velocity){
        var spring = this._spring,
            v = velocity,
            mu = this._mu,
            distance = end - current,
            acceleration = distance * spring;
            
        v += acceleration;
        v *= mu;
        return v;
    }
}
$.anime.algorithms.spring = function(force, mu){
    return new spring(force, mu);
}

function dndDragCoordStrategy(context){
    this._context = context;
}
dndDragCoordStrategy.prototype = {
    findCoord: function(e){
        var context = this._context,
            periph = $.touch().canRead(e) ? $.touch() : $.mouse();

        return periph.documentCoord(e)
            .subtract(context.hitCoord())
            .subtract(context.hitOffset())
            .add(context.hitBoundedOffet());
    }
}

function dndSizeCoordStrategy(context){
    this._context = context;
}
dndSizeCoordStrategy.prototype = {
    findCoord: function(e){
        var context = this._context,
            periph = $.touch().canRead(e) ? $.touch() : $.mouse();
        return context.hitSize()
            .add(periph.documentCoord(e)
                    .subtract(context.hitCoord())
                    .subtract(context.hitOffset()));
    }
}

function dndScrollCoordStrategy(context){
    this._context = context;
}
dndScrollCoordStrategy.prototype = {
    findCoord: function(e){
        var context = this._context,
            periph = $.touch().canRead(e) ? $.touch() : $.mouse();

        return context.hitCoord()
            .add(context.hitOffset())
            .subtract(periph.documentCoord(e))
            .add(context.hitScrollOffset());
    }
}

var dndState = {};

function dndContext(dom){
    dndContext.base.call(this, dom);
    
    this._mouseEvt = $.uid("dragger");
    this._touchEvt = $.uid("toucher");
    this._documentBody = $.dom(document.body);
    this._onGrab = $.observer();
    this._onDrag = $.observer();
    this._onDrop = $.observer();
    this._constrainX = false;
    this._constrainY = false;
    this._boundX = 0;
    this._boundY = 0;
    this._lastPoint = $.coord.zero();
    this._bearing = $.vector.zero();
    this._document = $.dom(document);

    this.state(new dndState.dropped())
        .dragger()
        .dragOffset($.coord.zero())
        .ontouchstart(this.grab, this, this._touchEvt)
        .onmousedown(this.grab, this, this._mouseEvt);
}
dndContext.prototype = {
    document: function(){ return this._document; },
    hitSize: function(hitSize){ return this.property("hitSize", hitSize); },
    hitCoord: function(hitCoord){ return this.property("hitCoord", hitCoord); },
    hitOffset: function(hitOffset){ return this.property("hitOffset", hitOffset); },
    dragOffset: function(dragOffset){ return this.property("dragOffset", dragOffset); },
    hitScrollOffset: function(hitScrollOffset){ return this.property("hitScrollOffset", hitScrollOffset); },
    hitBoundedOffet: function(hitBoundedOffet){ return this.property("hitBoundedOffet", hitBoundedOffet); },
    actor: function(){ return this.get("actor"); },
    strategy: function(){ return this.get("strategy"); },
    bearing: function(){ return this.get("bearing"); },
    
    bearingUp: function(){ return this.bearing().y() < 0; },
    bearingDown: function(){ return this.bearing().y() > 0; },
    bearingLeft: function(){ return this.bearing().x() < 0; },
    bearingRight: function(){ return this.bearing().x() > 0; },
    
    constrainX: function(){
        if(this._constrainX) return this;
        this._constrainX = true;
        this._boundX = this.boundedOffset().x();
        return this;
    },
    unconstrainX: function(){
        this._constrainX = false;
    },
    constrainY: function(){
        if(this._constrainY) return this;
        this._constrainY = true;
        this._boundY = this.boundedOffset().y();
        return this;
    },
    unconstrainY: function(){
        this._constrainY = false;
    },
    state: function(state) { return this.set("state", state.context(this)); },
    dragCoord: function(e){
        var c = this.strategy().findCoord(e),
            os = this.dragOffset(),
            x = (this._constrainX) ? this._boundX : c.x() + os.x(),
            y = (this._constrainY) ? this._boundY : c.y() + os.y(),
            point = $.point(x, y);
        this._bearing = point.distanceFrom(this._lastPoint);
        this._lastPoint = point;
        return point;
    },
    dragger: function(){
        return this.set("actor", $.pinner(this.dom()))
                   .set("strategy", new dndDragCoordStrategy(this))
                   ._setType("dragger");
    },
    sizer: function(){
        return this.set("actor", $.sizer(this.dom()))
                   .set("strategy", new dndSizeCoordStrategy(this))
                   ._setType("sizer");
    },
    scroller: function(){
        return this.set("actor", $.scroller(this.dom()))
                   .set("strategy", new dndScrollCoordStrategy(this))
                   ._setType("scroller");
    },
    grab: function(e){
        this._onGrab.notify(e);
        this._state.grab(e);
        return this;
    },
    drag: function(e){ 
        this._onDrag.notify(e);
        this._state.drag(e);
        return this;
    },
    drop: function(e){ 
        this._onDrop.notify(e);
        this._state.drop(e);
        this._bearing = $.vector.zero();
        return this;
    },
    onGrab: function(f, s, id){ this._onGrab.add(f, s, id); return this; },
    onDrag: function(f, s, id){ this._onDrag.add(f, s, id); return this; },
    onDrop: function(f, s, id){ this._onDrop.add(f, s, id); return this; },
    destroy: function(){
        this._onGrab.clear();
        this._onDrag.clear();
        this._onDrop.clear();
        this.removeEvent(this._mouseEvt).removeEvent(this._touchEvt);
    },
    disableSelect: function(target){
		document.onselectstart = function() { return false; }
        if(!$.exists(window.getSelection)) return this;
		this._mouseDisableId = $.uid("disable");
		this._touchDisableId = $.uid("disable");

		function disable() { window.getSelection().removeAllRanges(); }
        this._documentBody
            .onmousemove(disable, null, this._mouseDisableId)
            .ontouchmove(disable, null, this._touchDisableId);
        return this;
    },
    enableSelect: function(){
        document.onselectstart = null;
		var m = this._mouseDisableId,
		    t = this._touchDisableId,
            d = this._documentBody;
		if($.exists(m)) d.removeEvent(m)
		if($.exists(t)) d.removeEvent(t);
		this._mouseDisableId = null;
		this._touchDisableId = null;

        return this;
    },
    _setType: function(type){
        this._clearType().addClass($.str.format("ku-dragger-{0}", type));
        return this;
    },
    _clearType: function(){
        this.removeClass("ku-dragger-dragger")
            .removeClass("ku-dragger-sizer")
            .removeClass("ku-dragger-scoller");
        return this;
    }
}
$.Class.extend(dndContext, $.dom.Class);

$.dnd = function(dom){ return new dndContext(dom); }

dndState.dropped = function(){
    dndState.dropped.base.call(this, dndState);
}

dndState.dropped.prototype = {
    grab: function(e){
        $.evt.mute(e);
        var context = this.context(),
            periph = $.touch().canRead(e) ? $.touch() : $.mouse(),
            hitCoord = periph.documentCoord(e)
                        .subtract(context.offset());

        context.document()
            .ontouchmove(context.drag, context, $.uid())
            .ontouchend(context.drop, context, $.uid())
            .onmousemove(context.drag, context, $.uid())
            .onmouseup(context.drop, context, $.uid());

        context
            .disableSelect()
            .addClass("ku-dragger-grabbed")
            .hitSize(context.outerDims())
            .hitCoord(hitCoord)
            .hitOffset(context.offset())
            .hitScrollOffset(context.scrollOffset())
            .hitBoundedOffet(context.boundedOffset())
            .actor().to(context.dragCoord(e));

        this.state("grabbed");
    },
    drag: function(){ return; },
    drop: function(){ return; }
}
$.Class.extend(dndState.dropped, $.abstractState);

dndState.grabbed = function(){
    dndState.grabbed.base.call(this, dndState);
}

dndState.grabbed.prototype = {
    grab: function(){ return; },
    drag: function(e){
        $.evt.mute(e);
        var context = this.context();
        context.actor().to(context.dragCoord(e));
        this.context().redraw();
    },
    drop: function(e){
        this.context()
            .enableSelect()
            .removeClass("ku-dragger-grabbed")
            .document().clearEvents();

        this.state("dropped");
    }
}
$.Class.extend(dndState.grabbed, $.abstractState);

function abstractMover(dom) {
    abstractMover.base.call(this, dom);
    this._onEnd = $.observer();
    this.linear();
}

abstractMover.prototype = {
    $to: function(value){ return; }, 
    $moveTo: function(value) { return; },
    $done: function(){ this._onEnd.notify(); return this; },
    algorithm: function(algorithm){ this.$algorithm = algorithm; return this; },
    
    linear: function(f){ return this.algorithm($.anime.algorithms.ease.linear(f)); },
    spring: function(f, m){ this.algorithm($.anime.algorithms.spring(f, m)); },
    
    stop: function(){
        if(!$.exists(this.$tween)) return this;
        this.$tween.stop();
        return this;
    },
    to: function(value) { this.stop().$to(value).$done(); return this; },
    moveTo: function(value) { this.stop().$moveTo(value); return this; },
    onEnd: function(f, s){
        if(!$.exists(f)) return this;
        this._onEnd.add(f, s);
        return this;
    }
}
$.Class.extend(abstractMover, $.dom.Class);

function fader(dom) {
    $.dom(dom).addClass("ku-fader");
    fader.base.call(this, dom);
}
fader.prototype = {
    $to: function(value){
        var d = this.dom(),
            dom = $.dom(d);
        dom.style("opacity", value * .01);
        return this;
    },
    $moveTo: function(value){
        var d = this.dom(),
            dom = $.dom(d),
            start = dom.style("opacity") || 1;
        
        this.$tween = $.tween(function(value){
                dom.style("opacity", value * .01);
            }, start, value, this.$algorithm)
            .onEnd(this.$done, this)
            .start(d);
    }
}
$.Class.extend(fader, abstractMover);
$.fader = function(dom){ return new fader(dom); }

function fitter(dom) {
    $.dom(dom).addClass("ku-fitter");
    fitter.base.call(this, dom);
}
fitter.prototype = {
    $to: function(value){
        var d = this.dom(),
            dom = $.dom(d);
        dom.style("width", value.x() + "px");
        dom.style("height", value.y() + "px");
        return this;
    },
    $moveTo: function(coord) {
        var d = this.dom(),
            dom = $.dom(d),
            start = dom.outerDims();
        
        this.$tween = $.tween(function(value){
                dom.style("width", value.x() + "px");
                dom.style("height", value.y() + "px");
            }, start, fitter_findFitCoord(this, coord), this.$algorithm)
            .onEnd(this.$done, this)
            .start(d);
    }
}
$.Class.extend(fitter, abstractMover);

function fitter_findFitCoord(fitter, coord){
    var fitRatio = coord.y() / coord.x(),
        dom = $.dom(fitter.dom()),
        dims = dom.outerDims(),
        fitterAspect = dims.y() / dims.x(),
        aspectRatio = isNaN(fitterAspect) ? 1 : fitterAspect,
        x = dims.x(),
        y = dims.y();
    
    //I am wider than the location
    if((aspectRatio < fitRatio) ||
       (aspectRatio == fitRatio)) {
            x = coord.x();
            y = coord.x() * fitterAspect;
    }
    //I am taller than the location       
    if(aspectRatio > fitRatio) {
        x = coord.y() / fitterAspect;
        y = coord.y();
    }
    return $.coord(x, y);
}

$.fitter = function(dom){ return new fitter(dom);}

function pinner(dom) {
    $.dom(dom).addClass("ku-pinner");
    pinner.base.call(this, dom);
}
pinner.prototype = {
    $to: function(value){
        var d = this.dom(),
            dom = $.dom(d);
        dom.style("left", value.x() + "px");
        dom.style("top", value.y() + "px");
        return this;
    },
    $moveTo: function(coord) {
        var d = this.dom(),
            dom = $.dom(d),
            offset = dom.offset(),
            p = $.findOffset(d.parentNode),
            parentOffset = ($.coord.canParse(p)) ? $.coord.parse(p) : $.coord.zero(),
            start = offset.subtract(parentOffset);
        
        this.$tween = $.tween(function(value){
                dom.style("left", value.x() + "px");
                dom.style("top", value.y() + "px");
            }, start, coord, this.$algorithm)
            .onEnd(this.$done, this)
            .start(d);
    }
}
$.Class.extend(pinner, abstractMover);
$.pinner = function(dom){ return new pinner(dom); }

function scroller(dom) {
    $.dom(dom).addClass("ku-scoller");
    scroller.base.call(this, dom);
}
scroller.prototype = {
    $to: function(value){
        var d = this.dom(),
            dom = $.dom(d);
        dom.style("scrollLeft", value.x());
        dom.style("scrollTop", value.y());
        return this;
    },
    $moveTo: function(coord) {
        var d = this.dom(),
            dom = $.dom(d),
            offset = dom.scrollOffset(),
            p = $.findOffset(d.parentNode),
            parentOffset = ($.coord.canParse(p)) ? $.coord.parse(p) : $.coord.zero(),
            start = offset.subtract(parentOffset);
        
        this.$tween = $.tween(function(value){
                dom.style("scrollLeft", value.x());
                dom.style("scrollTop", value.y());
            }, start, coord, this.$algorithm)
            .onEnd(this.$done, this)
            .start(d);
    }
}
$.Class.extend(scroller, abstractMover);
$.scroller = function(dom){ return new scroller(dom); }

function sizer(dom) {
    $.dom(dom).addClass("ku-sizer");
    sizer.base.call(this, dom);
}
sizer.prototype = {
    $to: function(value){
        var d = this.dom(),
            dom = $.dom(d);
        dom.style("width", value.x() + "px");
        dom.style("height", value.y() + "px");
        return this;
    },
    $moveTo: function(coord) {
        var d = this.dom(),
            dom = $.dom(d),
            start = dom.outerDims();
        
        this.$tween = $.tween(function(value){
                dom.style("width", value.x() + "px");
                dom.style("height", value.y() + "px");
            }, start, coord, this.$algorithm)
            .onEnd(this.$done, this)
            .start(d);
    }
}
$.Class.extend(sizer, abstractMover);
$.sizer = function(dom, ease, mu){ return new sizer(dom, ease, mu);}

function styler(dom, prop) {
    $.dom(dom).addClass("ku-styler");
    styler.base.call(this, dom);
    this._prop = prop;
}
styler.prototype = {
    $moveTo: function(value) {
        var d = this.dom(),
            dom = $.dom(d),
            p = this._prop,
            val = dom.style(p),
            s = $.ku.style,
            unit = s.getUnit(val) || "",
            start = s.toNumber(val);
        
        this.$tween = $.tween(function(value){
                dom.style(p, value + unit);
            }, start, value, this.$algorithm)
            .onEnd(this.$done, this)
            .start(d);
    }
}
$.Class.extend(styler, abstractMover);
$.styler = function(dom, prop){ return new styler(dom, prop); }

function timeline(fps, state){
    timeline.base.call(this, state);
    this._listeners = $.observer();
    this._ticks = 0;
    this.fps(fps || 30);
}
timeline.prototype = {
    fps: function(fps){
        this._interval = 1000/fps;
        return this.property("fps", fps);
    },
    interval: function(){ return this.get("interval"); },
    listeners: function(){ return this.get("listeners"); },
    ticks: function(){ return this.get("ticks"); },
    start: function(){
        this._state.start();
        return this;
    },
    stop: function(){
        this._state.stop();
        return this;
    },
    add: function(func, scope, id, wait){
        var me = this,
            w = wait || 1,
            _id = id || $.uid("timeline"),
            stall = function() {
                if(!me._ticks % w == 0) return;
                func(); f = func;
            },
            f = (!wait) ? func : stall;
        this._listeners.add(f, scope, _id);
        return this;
    },
    remove: function(id){
        this._listeners.remove(id);
        return this;
    },
    clear: function(){ this._listeners.clear(); return this; },
    tick: function(){ this._ticks++; return this; }
}
$.Class.extend(timeline, $.abstractContext);
$.timeline = function(){ return timeline_instance; }

timeline.started = function(){ timeline.started.base.call(this, timeline); }
timeline.started.prototype = {
    start: function(){ return; },
    stop: function(){
        clearTimeout(ku_timeline);
        ku_timeline = null;
        this.state("stopped");
    }
}
$.Class.extend(timeline.started, $.abstractState)

timeline.stopped = function(){ timeline.stopped.base.call(this, timeline); }
timeline.stopped.prototype = {
    start: function(){
        var c = this.context(),
            i = c.interval(),
            t = function(){
                c.tick().listeners().notify();
                ku_timeline = setTimeout(t, i);
            }; 
        t();
        this.state("started");    
    },
    stop: function(){ return; }
}
$.Class.extend(timeline.stopped, $.abstractState)

var timeline_instance = new timeline(30, new timeline.stopped()).start();

var abstractTween = function(method, start, end, algorithm){
    this.$method = method;
    this.$current = start;
    this.$end = end;
    this.$algorithm = algorithm;
    this.$value = 0;
    this._onEnd = $.observer();
    this._id = $.uid("tween");
}
abstractTween.prototype = {
    $exec: function(){ return; },
    $done: function(){ this._onEnd.notify(); },
    start: function(){
        $.timeline().add(this.$exec, this, this._id);
        return this;
    },
    stop: function(){
        $.timeline().remove(this._id);
        return this;
    },
    onEnd: function(f, s){ this._onEnd.add(f, s); return this; },
    clear: function(){
        this._onEnd.clear();
        return this;
    }
}
$.Class.extend(abstractTween, $.Class);

var coordTween = function(method, start, end, algorithm){
    coordTween.base.call(this, method, start, end, algorithm);
    this.$value = $.coord.zero();
}
coordTween.prototype = {
    $exec: function(){
        var method = this.$method,
            current = this.$current,
            end = this.$end;
        var valueX = this.$algorithm.calculate(current.x(), end.x(), this.$value.x());
        var valueY = this.$algorithm.calculate(current.y(), end.y(), this.$value.y()),
            value = $.coord(valueX, valueY),
            diff = end.abs().subtract(current.abs());
        
        if((Math.abs(valueX) < .1) && (diff.x() < 1) &&
           (Math.abs(valueY) < .1) && (diff.y() < 1)) {
            method(end);
            this.stop()._onEnd.notify();
            return;
        }
        this.$current = current.add(value);
        this.$value = value;
        method(this.$current);
    }
}
$.Class.extend(coordTween, abstractTween);

var numberTween = function(method, start, end, algorithm){
    numberTween.base.call(this, method, start, end, algorithm);
}
numberTween.prototype = {
    $exec: function(){
        var method = this.$method,
            current = this.$current,
            end = this.$end,
            value = this.$algorithm.calculate(current, end, this.$value);

        if((Math.abs(value) < .1) &&
           (Math.abs(end - current) < 1)) {
            method(end);
            this.stop().$done();
            return;
        }
        this.$current = current + value;
        this.$value = value;
        method(this.$current);
    }
}
$.Class.extend(numberTween, abstractTween);

$.tween = function(method, start, end, algorithm){
    return ($.isNumber(start) && $.isNumber(end))
        ? new numberTween(method, start, end, algorithm)
        : new coordTween(method, start, end, algorithm);
}

function dndScreenDropper(dom){
    dndScreenDropper.base.call(this, dom);
    this._id = $.uid("dropper");
    this._handle = this;
}
dndScreenDropper.prototype = {
    id: function(id) { return this.get("id"); },
    value: function(value) { return this.property("value", value); },
    handle: function(handle) {
        var hndl;
        if($.exists(handle)) hndl = $.dom(handle);
        return this.property("handle", hndl);
    },
    mouseEventId: function(mouseEventId) { return this.property("mouseEventId", mouseEventId); },
    touchEventId: function(touchEventId) { return this.property("touchEventId", touchEventId); },
}
$.Class.extend(dndScreenDropper, $.dom.Class);
$.dndScreenDropper = function(dom){ return new dndScreenDropper(dom); }

var dndScreen = function() {
    this._targets = $.hash();
    this._droppers = $.hash();
    this._onHit = $.observer();
    this._lastKnownCoord;

    this._helper = $.sprite($.create({"div":{"class":"ku-dndScreen-helper"}}))
                        .onGrab(function(e) {
                            var periph = $.touch().canRead(e) ? $.touch() : $.mouse();
                            this._lastKnownCoord = periph.documentCoord(e);
                        }, this)
                        .onDrag(function(e) {
                            var periph = $.touch().canRead(e) ? $.touch() : $.mouse();
                            this._lastKnownCoord = periph.documentCoord(e);
                        }, this)
                        .onDrop(function(e){ this._drop(e); }, this);
    this._currentDropper;
}
dndScreen.prototype = {
    addTarget: function(target) {
        this._targets.add(target.id(), target);
        return this;
    },
    removeTarget: function(target) {
        this._targets.remove(target.id(), target);
        return this;
    },
    addDropper: function(dropper) {
        var mouseEventId = $.uid("dropperEvent"),
            touchEventId = $.uid("dropperEvent");

        function action(e){
            this._currentDropper = dropper;
            this.activateHelper(e, dropper);
        }
        dropper
            .mouseEventId(mouseEventId)
            .touchEventId(touchEventId)
            .handle()
            .onmousedown(action, this, mouseEventId)
            .ontouchstart(action, this, touchEventId);

        this._droppers.add(dropper.id(), dropper);
    },
    removeDropper: function(dropper) {
        dropper.handle()
            .removeEvent(dropper.touchEventId())
            .removeEvent(dropper.mouseEventId());
        this._droppers.remove(dropper.id());
    },
    activateHelper: function(e, dropper) {
        this._helper.appendTo(document.body)
            .pinTo(dropper.offset().subtract(dropper.scrollOffset()).add($.window().scrollOffset()))
            .content(dropper.cloneNode())
            .grab(e)
    },
    deactivateHelper: function() {
        this._helper.html("").detach();
        this._currentDropper = undefined;
    },
    clearTargets: function() {
        this._targets.clear();
        return this;
    },
    clearDroppers: function() {
        var droppers = this._droppers;
        droppers.listValues().each(function(dropper){
            this.removeDropper(dropper);
        }, this);
        return this;
    },
    clearAll: function() {
        this.clearTargets().clearDroppers();
        return this;
    },
    clearListeners: function() {
        this._onHit.clear();
        return this;
    },
    onHit: function(f, s) {
        this._onHit.add(f, s);
        return this;
    },
    _drop: function(e){
        var hitTarget = this._findHitTarget(e),
            dropper = this._currentDropper;
        if($.exists(hitTarget) && $.exists(dropper))
            this._onHit.notify(hitTarget, dropper);
        this.deactivateHelper();
    },
    _findHitTarget: function(e){
        var targets = this._targets.listValues(),
            periph = $.touch().canRead(e) ? $.touch() : $.mouse(),
            hitTarget = null,
            coord;

        try { coord = periph.documentCoord(e); }
        catch(e) { coord = this._lastKnownCoord}

        targets.each(function(target){
            if(!target.contains(coord)) return;
            hitTarget = target;
            targets.quit();
        });
        return hitTarget;
    }
}
$.dndScreen = function(){ return new dndScreen(); }

function dndScreenTarget(dom){
    dndScreenTarget.base.call(this, dom);
    this._id = $.uid("target");
}
dndScreenTarget.prototype = {
    id: function(id) { return this.get("id"); },
    value: function(value) { return this.property("value", value); },
    contains: function(coord){
        var topLeft = this.offset(),
            bottomRight = topLeft.add(this.outerDims());

        return $.rectangle(topLeft, bottomRight).contains(coord);
    }
}
$.Class.extend(dndScreenTarget, $.dom.Class);
$.dndScreenTarget = function(dom){ return new dndScreenTarget(dom); }

function keyboard(){
    this._onKeyPressed = $.observer();
    keyboard.base.call(this, $.create({div:{"class":"ku-keyboard"}}));
}
keyboard.prototype = {
    addKey: function(code){
        $.onScreenKey(code)
            .addClass($.str.format("ku-keyboard-key ku-key-{0}", code))
            .onPress(this._onKeyPressed.notify, this._onKeyPressed)
            .appendTo(this.dom());
        return this;
    },
    onKeyPressed: function(f, s){
        this._onKeyPressed.add(f, s);
		return this;
    }
}
$.Class.extend(keyboard, $.dom.Class);
$.onScreenKeyboard = function(){ return new keyboard(); }

function key(code){
    if(!$.isNumber(code))
        $.exception("arg", $.str.format("Invalid argument code:{0}", code));

    this._value = $.key(code);
    this._onPress = $.observer();
    this._onRelease = $.observer();

    key.base.call(this, $.create({button:{"class":"ku-keyboard-key"}, content: this._value.toString()}));

    this.onmousedown(function() { this._onPress.notify(this._value); }, this)
        .ontouchstart(function() { this._onPress.notify(this._value); }, this)
        .onmouseup(function() { this._onRelease.notify(this._value); }, this)
        .ontouchend(function() { this._onRelease.notify(this._value); }, this)
}
key.prototype = {
    onPress: function(f, s){
        this._onPress.add(f, s);
        return this;
    },
    onRelease: function(f, s){
        this._onRelease.add(f, s);
        return this;
    }
}
$.Class.extend(key, $.dom.Class);
$.onScreenKey = function(code){ return new key(code); }

function sprite(dom){
    var d = dom || $.create({div:{"class":"ku-sprite"}});
    sprite.base.call(this, d);
    this.to().dragOn().force(.4).mu(.8);
	this._isTo;
}
sprite.prototype = {
    force: function(force){ return this.property("force", force); },
    mu: function(mu){ return this.property("mu", mu); },
    algorithm: function(algorithm){ return this.set("algorithm", algorithm); },
    
    to: function(){  this._isTo = true; return this.algorithm($.anime.algorithms.jump()); },
    spring: function(){  this._isTo = false; return this.algorithm($.anime.algorithms.spring(this._force, this._mu)); },
    ease: function(){  this._isTo = false; return this.algorithm($.anime.algorithms.ease.linear(this._force, this._mu)); },
    
    fitTo: function(coord, f, s){ return this._act("fitter", coord, f, s); },
    sizeTo: function(coord, f, s) { return this._act("sizer", coord, f, s); },
    pinTo: function(coord, f, s){ return this._act("pinner", coord, f, s); },
    scrollTo: function(coord, f, s){ return this._act("scroller", coord, f, s); },
    fadeTo: function(nbr, f, s){ return this._act("fader", nbr, f, s); },
    growTo: function(coord, f, s){
        return this.sizeTo(coord)
                   .pinTo(this.boundedOffset()
                        .subtract(coord.subtract(this.outerDims())
                        .half()), f, s);
    },
    _act: function(action, value, f, s){
        var act = $[action](this.dom()).algorithm(this._algorithm),
            _action =  "_" + action,
            currentAction = this[_action];

        if($.exists(currentAction)) currentAction.stop();
        if($.exists(f)) act.onEnd(f, s);

        if(this._isTo) this[_action] = act.to(value);
        else this[_action] = act.moveTo(value);
        return this;
    },
    tween: function(property, value){
        this._styler = $.styler(this.dom(), property).algorithm(this._algorithm).moveTo(value);
        return this;
    },
    clear: function(){
        if($.exists(this._fader)) this._fader.stop();
        if($.exists(this._sizer))this._sizer.stop();
        if($.exists(this._fitter))this._fitter.stop();
        if($.exists(this._pinner))this._pinner.stop();
        if($.exists(this._scroller))this._scroller.stop();
        if($.exists(this._styler))this._styler.stop();
        return this;
    },
    dragHandle: function(dragHandle){ return this.property("dragHandle", dragHandle); },
    dragType: function(dragType){ return this.set("dragType", dragType); },
    dragOffset: function(dragOffset){ this._dnd.dragOffset(dragOffset); return this; },
    dragger: function(){ this._dnd.dragger(); return this; },
    sizer: function(){ this._dnd.sizer(); return this; },
    scroller: function(){ this._dnd.scroller(); return this; },
    dragOn: function(){ this._dnd = $.dnd(this.dom()).onGrab(this.clear, this); return this; },
    dragOff: function(){ this._dnd.destroy(); return this; },
    onGrab: function(f, s, id){ this._dnd.onGrab(f, s, id); return this; },
    onDrag: function(f, s, id){ this._dnd.onDrag(f, s, id); return this; },
    onDrop: function(f, s, id){ this._dnd.onDrop(f, s, id); return this; },
    bearingUp: function(){ return this._dnd.bearingUp(); },
    bearingDown: function(){ return this._dnd.bearingDown(); },
    bearingLeft: function(){ return this._dnd.bearingLeft(); },
    bearingRight: function(){ return this._dnd.bearingRight(); },
    grab: function(e){ this._dnd.grab(e); return this; },
    drag: function(e){ this._dnd.drag(e); return this; },
    drop: function(e){ this._dnd.drop(e); return this; },
    constrainX: function(){ this._dnd.constrainX(); return this; },
    unconstrainX: function(){ this._dnd.unconstrainX(); return this; },
    constrainY: function(){ this._dnd.constrainY(); return this; },
    unconstrainY: function(){ this._dnd.unconstrainY(); return this; }
}
$.Class.extend(sprite, $.dom.Class);
$.sprite = function(dom){ return new sprite(dom); }
$.sprite.Class = sprite;

var abstractTooltipStrategy = function(tooltip, multiplier){
    this.$offset = 0;
    this.$multiplier = multiplier;
    this._tooltip = tooltip;
    this.overlap(0);
}
abstractTooltipStrategy.prototype = {
    $above: function(context, pointer, tooltip){ return; },
    $below: function(context, pointer, tooltip){ return; },
    $leftOf: function(context, pointer, tooltip){ return; },
    $rightOf: function(context, pointer, tooltip){ return; },
    overlap: function(overlap){ return this.set("overlap", overlap); },
    above: function(dom){
        var tooltip = this._tooltip,
            context = tooltip.context(dom).context(),
            pointer = tooltip.pointer(),
            content = tooltip.tooltip();
            
        this.$offset = this._overlap;   
        this.$above(context, pointer, content);
        return this;
    },
    below: function(dom){
        var tooltip = this._tooltip,
            context = tooltip.context(dom).context(),
            pointer = tooltip.pointer(),
            content = tooltip.tooltip();
            
        this.$offset = this._overlap;   
        this.$below(context, pointer, content);
        return this;
    },
    leftOf: function(dom){
        var tooltip = this._tooltip,
            context = tooltip.context(dom).context(),
            pointer = tooltip.pointer(),
            content = tooltip.tooltip();
            
        this.$offset = this._overlap;   
        this.$leftOf(context, pointer, content);
        return this;
    },
    rightOf: function(dom){
        var tooltip = this._tooltip,
            context = tooltip.context(dom).context(),
            pointer = tooltip.pointer(),
            content = tooltip.tooltip();
            
        this.$offset = this._overlap;   
        this.$rightOf(context, pointer, content);
        return this;
    }
}
$.Class.extend(abstractTooltipStrategy, $.Class);

var tooltipStrategyCenter = function(tooltip, multiplier){
    tooltipStrategyCenter.base.call(this, tooltip, .5);
}
tooltipStrategyCenter.prototype = {
    $above: function(context, pointer, tooltip){
        pointer.pinTo(context.offset()
                    .subtract(pointer.outerHeight())
                    .add($.coord(context.outerDims().subtract(pointer.outerDims()).x() * this.$multiplier, 0)));
        
        tooltip.pinTo(pointer.offset()
            .subtract(tooltip.outerHeight())
            .add($.coord(0, this.$offset))
            .add($.coord(pointer.outerDims().subtract(tooltip.outerDims()).x() * this.$multiplier, 0)));
        
        pointer.fadeTo(100);
        tooltip.fadeTo(100);
        return this;
    },
    $below: function(context, pointer, tooltip){
        pointer.pinTo(context.offset()
                    .add(context.outerHeight())
                    .add($.coord(context.outerDims().subtract(pointer.outerDims()).x() * this.$multiplier, 0)));
    
        tooltip.pinTo(pointer.offset()
            .add(pointer.outerHeight())
            .subtract($.coord(0, this.$offset))
            .add($.coord(pointer.outerDims().subtract(tooltip.outerDims()).x() * this.$multiplier, 0)));
 
        pointer.fadeTo(100);
        tooltip.fadeTo(100);
        return this;
    },
    $leftOf: function(context, pointer, tooltip){
        pointer.pinTo(context.offset()
                    .subtract(pointer.outerWidth())
                    .add($.coord(0, context.outerDims().subtract(pointer.outerDims()).y() * this.$multiplier)));
     
        tooltip.pinTo(pointer.offset()
            .subtract(tooltip.outerWidth())
            .add($.coord(this.$offset, 0))
            .add($.coord(0, pointer.outerDims().subtract(tooltip.outerDims()).y() * this.$multiplier)));
   
        pointer.fadeTo(100);
        tooltip.fadeTo(100);
        return this;
    },
    $rightOf: function(context, pointer, tooltip){
        pointer.pinTo(context.offset()
                    .add(context.outerWidth())
                    .add($.coord(0, context.outerDims().subtract(pointer.outerDims()).y() * this.$multiplier)));
                
        tooltip.pinTo(pointer.offset()
            .add(pointer.outerWidth())
            .subtract($.coord(this.$offset, 0))
            .add($.coord(0, pointer.outerDims().subtract(tooltip.outerDims()).y() * this.$multiplier)));

        pointer.fadeTo(100);
        tooltip.fadeTo(100);
        return this;
    }
}
$.Class.extend(tooltipStrategyCenter,
      abstractTooltipStrategy);

var tooltipStrategyLeftJustify = function(tooltip, multiplier){
    tooltipStrategyLeftJustify.base.call(this, tooltip, 0);
}
tooltipStrategyLeftJustify.prototype = {
    $above: function(context, pointer, tooltip){
        pointer.pinTo(context.offset()
                    .subtract(pointer.outerHeight())
                    .add($.coord(this.$offset, 0))
                    .add($.coord(context.outerDims().subtract(pointer.outerDims()).x() * this.$multiplier, 0)));

        tooltip.pinTo(pointer.offset()
            .subtract(tooltip.outerHeight())
            .add($.coord(-this.$offset, this.$offset))
            .add($.coord(pointer.outerDims().subtract(tooltip.outerDims()).x() * this.$multiplier, 0)));

        pointer.fadeTo(100);
        tooltip.fadeTo(100);
        return this;
    },
    $below: function(context, pointer, tooltip){
        pointer.pinTo(context.offset()
                    .add(context.outerHeight())
                    .add($.coord(this.$offset, 0))
                    .add($.coord(context.outerDims().subtract(pointer.outerDims()).x() * this.$multiplier, 0)));
        
        tooltip.pinTo(pointer.offset()
            .add(pointer.outerHeight())
            .subtract($.coord(this.$offset, this.$offset))
            .add($.coord(pointer.outerDims().subtract(tooltip.outerDims()).x() * this.$multiplier, 0)));
        
        pointer.fadeTo(100);
        tooltip.fadeTo(100);
        return this;
    },
    $leftOf: function(context, pointer, tooltip){
        pointer.pinTo(context.offset()
                    .subtract(pointer.outerWidth())
                    .add($.coord(0, this.$offset))
                    .add($.coord(0, context.outerDims().subtract(pointer.outerDims()).y() * this.$multiplier)));

        tooltip.pinTo(pointer.offset()
            .subtract(tooltip.outerWidth())
            .add($.coord(this.$offset, -this.$offset))
            .add($.coord(0, pointer.outerDims().subtract(tooltip.outerDims()).y() * this.$multiplier)));
        
        pointer.fadeTo(100);
        tooltip.fadeTo(100);
        return this;
    },
    $rightOf: function(context, pointer, tooltip){
        pointer.pinTo(context.offset()
                    .add(context.outerWidth())
                    .add($.coord(0, this.$offset))
                    .add($.coord(0, context.outerDims().subtract(pointer.outerDims()).y() * this.$multiplier)));
        
        tooltip.pinTo(pointer.offset()
            .add(pointer.outerWidth())
            .subtract($.coord(this.$offset, this.$offset))
            .add($.coord(0, pointer.outerDims().subtract(tooltip.outerDims()).y() * this.$multiplier)));

        pointer.fadeTo(100);
        tooltip.fadeTo(100);
        return this;
    }
}
$.Class.extend(tooltipStrategyLeftJustify,
      abstractTooltipStrategy);

var tooltipStrategyRightJustify = function(tooltip, multiplier){
    tooltipStrategyRightJustify.base.call(this, tooltip, 1);
}
tooltipStrategyRightJustify.prototype = {
    $above: function(context, pointer, tooltip){
        pointer.pinTo(context.offset()
                    .subtract(pointer.outerHeight())
                    .add($.coord(-this.$offset, 0))
                    .add($.coord(context.outerDims().subtract(pointer.outerDims()).x() * this.$multiplier, 0)));
                
        tooltip.pinTo(pointer.offset()
            .subtract(tooltip.outerHeight())
            .add($.coord(this.$offset, this.$offset))
            .add($.coord(pointer.outerDims().subtract(tooltip.outerDims()).x() * this.$multiplier, 0)));
          
        pointer.fadeTo(100);
        tooltip.fadeTo(100);
        return this;
    },
    $below: function(context, pointer, tooltip){
        pointer.pinTo(context.offset()
                    .add(context.outerHeight())
                    .add($.coord(-this.$offset, 0))
                    .add($.coord(context.outerDims().subtract(pointer.outerDims()).x() * this.$multiplier, 0)));
            
        tooltip.pinTo(pointer.offset()
            .add(pointer.outerHeight())
            .add($.coord(this.$offset, -this.$offset))
            .add($.coord(pointer.outerDims().subtract(tooltip.outerDims()).x() * this.$multiplier, 0)));
               
        pointer.fadeTo(100);
        tooltip.fadeTo(100);
        return this;
    },
    $leftOf: function(context, pointer, tooltip){
        pointer.pinTo(context.offset()
                    .subtract(pointer.outerWidth())
                    .add($.coord(0, -this.$offset))
                    .add($.coord(0, context.outerDims().subtract(pointer.outerDims()).y() * this.$multiplier)));
        
        tooltip.pinTo(pointer.offset()
            .subtract(tooltip.outerWidth())
            .add($.coord(this.$offset, this.$offset))
            .add($.coord(0, pointer.outerDims().subtract(tooltip.outerDims()).y() * this.$multiplier)));
                
        pointer.fadeTo(100);
        tooltip.fadeTo(100);
        return this;
    },
    $rightOf: function(context, pointer, tooltip){
        pointer.pinTo(context.offset()
                    .add(context.outerWidth())
                    .add($.coord(0, -this.$offset))
                    .add($.coord(0, context.outerDims().subtract(pointer.outerDims()).y() * this.$multiplier)));
               
        tooltip.pinTo(pointer.offset()
            .add(pointer.outerWidth())
            .add($.coord(-this.$offset, this.$offset))
            .add($.coord(0, pointer.outerDims().subtract(tooltip.outerDims()).y() * this.$multiplier)));
                         
        pointer.fadeTo(100);
        tooltip.fadeTo(100);
        return this;
    }
}
$.Class.extend(tooltipStrategyRightJustify,
      abstractTooltipStrategy);

var tooltip = function(){
    tooltip.base.call(this);
    this.pointer($.sprite($.create({"div":{"class":"ku-tooltip-pointer"}})).hide().dragOff().to())
        .tooltip($.sprite($.create({"div":{"class":"ku-tooltip"}})).hide().dragOff().to())
        .leftJustify();

    this._id = $.uid("tip");
    this._onShow = $.observer();
    this._onHide = $.observer();
}
tooltip.prototype = {
    calibrate: function(calibrate){ return this.property("calibrate", calibrate); },
    pointer: function(pointer){ return this.property("pointer", pointer); },
    tooltip: function(tooltip){ return this.property("tooltip", tooltip); },
    strategy: function(strategy){ return this.property("strategy", strategy); },
    message: function(message){ return this.property("message", message); },
    context: function(context){
        var ctxt = ($.exists(context)) ? $.dom(context) : context;
        return this.property("context", ctxt);
    },
    center: function(){ return this.strategy(new tooltipStrategyCenter(this)); },
    leftJustify: function(){ return this.strategy(new tooltipStrategyLeftJustify(this)); },
    rightJustify: function(){ return this.strategy(new tooltipStrategyRightJustify(this)); },
    onShow: function(f, s) { this._onShow.add(f, s); return this; },
    onHide: function(f, s) { this._onHide.add(f, s); return this; },
    show: function(message){
        var m = message || this._message, v = m || "";
        this._pointer.fadeTo(0).appendTo(document.body).show()
        this._tooltip.fadeTo(0).appendTo(document.body).html("").content(v).show();
        this._onShow.notify();
        return this;
    },
    hide: function(){
        this._pointer.hide().detach();
        this._tooltip.hide().detach();
        this._onHide.notify();
        return this;
    },
    at: function(dom, pref){
        var w = $.window(),
            d = $.dom(dom),
            A = $.coord.zero(),
            B = w.dims(),
            a = d.offset()
            b = a.add(d.outerDims()),
            C = this._tooltip.outerDims(),
            bPlusC = b.add(C),
            aLessC = a.subtract(C),
            rightOf = !bPlusC.isRightOf(B),
            below = !bPlusC.isBelow(B),
            leftOf = !aLessC.isLeftOf(A),
            above = !aLessC.isAbove(A),
            prefer = {
                "rightOf": rightOf,
                "below": below,
                "leftOf": leftOf,
                "above": above
            };
        if(prefer[pref[0]]) return this[pref[0]](dom);
        if(prefer[pref[1]]) return this[pref[1]](dom);
        if(prefer[pref[2]]) return this[pref[2]](dom);
        if(prefer[pref[3]]) return this[pref[3]](dom);
        return this.rightOf(dom);
    },
    above: function(dom){ return this._locate(dom, "bottom", "above"); },
    below: function(dom){ return this._locate(dom, "top", "below"); },
    leftOf: function(dom){ return this._locate(dom, "right", "leftOf"); },
    rightOf: function(dom){ return this._locate(dom, "left", "rightOf"); },
    _locate: function(dom, overlap, position){
        this.strategy().overlap(tooltip_calculateOverlap(this, overlap))[position](dom);
        tooltip_setClass(this, position);
        this._pointer.fadeTo(100);
        this._tooltip.fadeTo(100);
        return this;
    }
}
$.Class.extend(tooltip, $.Class);
$.tooltip = function(){ return new tooltip(); }

function tooltip_calculateOverlap(tooltip, side){
    var b = tooltip.tooltip().style($.str.format("border-{0}-width", side));
    return $.ku.style.toNumber(b)
}
function tooltip_setClass(tooltip, position){
    var format = "ku-{0}",
        positions = ["above", "below", "leftOf", "rightOf"],
        pointer = tooltip.pointer();
        
    for(var n in positions)
        pointer.removeClass($.str.format(format, positions[n]));
    pointer.addClass($.str.format(format, position));
}

})(jQuery);
