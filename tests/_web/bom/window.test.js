$(function(){
    function notOk(s, m) {equal(s,false,m);}
    
    module("window Test");
    
    test("new", function() {
        ok($.window());
    });

    test("disable", function() {
        ok($.window().disable().isDisabled());
    });

    test("enable", function() {
        ok(!$.window().enable().isDisabled());
    });

    test("dims", function() {
        var dims = $.window().dims();
        equal(dims.x(), 1440);
        equal(dims.y(), 760);
    });

    test("center", function() {
        var center = $.window().center();
        equal(center.x(), 720);
        equal(center.y(), 380);
    });

    test("scrollOffset", function() {
        var scrollOffset = $.window().scrollOffset();
        equal(scrollOffset.x(), 0);
        equal(scrollOffset.y(), 0);
    });

    test("scrollDims", function() {
        var scrollDims = $.window().scrollDims();
        equal(scrollDims.x(), 1440);
        equal(scrollDims.y(), 760);
    });

    test("scrollCenter", function() {
        var scrollCenter = $.window().scrollCenter();
        equal(scrollCenter.x(), 720);
        equal(scrollCenter.y(), 380);
    });
});