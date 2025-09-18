$(document).ready(function(){
    $("form [type=submit]").click(function(e){
        var f = $(this).closest("form");
        if (f.length == 1) {
            var el = f.find(".selected-flag");
            if (el.length == 1) {
                var val = el.attr('title');
                if (typeof val !== 'undefined') {
                    val = val.substring(val.indexOf('+'));
                    var phone2 = $("input[name=phone2]");
                    if (phone2.length > 0) {
                        phone2.val(val);
                    }
                }
            }
        }
    });
});