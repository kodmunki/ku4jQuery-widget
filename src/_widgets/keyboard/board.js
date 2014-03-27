function screenKeyboard(){
    this._onKeyPressed = $.observer();
    keyboard.base.call(this, $.create({div:{"class":"ku-keyboard"}}));
}
screenKeyboard.prototype = {
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
$.Class.extend(screenKeyboard, $.dom.Class);
$.onScreenKeyboard = function(){ return new screenKeyboard(); }