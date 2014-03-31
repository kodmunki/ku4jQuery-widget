function moneyField(dom){
    moneyField.base.call(this, dom);
    this.spec($.fields.specs.currency)
        .tooltip($.tooltip().message("Enter a valid money amount."));
    $.dom(this.dom()).onblur(function(){ this.$write(this.value()); }, this);
    $.dom(this.dom()).onfocus(function(){
        var value = this.value();
        if(!$.money.canParse(value)) return;
        this.dom().value = $.money.parse(value).value();
    }, this);
}
moneyField.prototype = {
    $read: function(){
        var value = this.dom().value;
        return ($.money.canParse(value))
            ? $.money.parse(value).value()
            : value;
    },
    $write: function(value){ this.dom().value = $.money.tryParse(value) || value; }
}
$.Class.extend(moneyField, abstractField);
$.fields.money = function(dom){ return new moneyField(dom); }