
function inputTextFilter( e ) {
    $( e ).find("tfoot th input").keyup(function() {
        /* Filter on the column (the index) of this element */
        e.fnFilter(this.value, $( e ).find("tfoot th input").index(this));
    });
    $( e ).find("tfoot th input").each(function(i) {
        var n;
        n = this.name;
        (this.name.indexOf("f_") < 0 ) && ( this.name = "f_" + n );
        (this.id.indexOf("f_") < 0 ) && ( this.id = "f_" + n );
    });

    $( e ).find("tfoot th input").focus(function() {
        if (this.className === "search_init")
        {
            this.className = "";
            this.value = "";
        }
    });
}

function selectFilter( e ){
    $( e ).find("tfoot th").each(function(i) {
        var th = $(this);
        if (th.hasClass('selectFilter')) {
            var select = fnCreateSelect(e.fnGetColumnData(i), $( this ).attr("data-name"));            
            this.innerHTML = select;
            $('select', this).change(function() {
                var txt = $(this).val();
                if (txt === ""){
                    e.fnFilter(txt, i);
                } else {
                    e.fnFilter('^' + txt + '$', i, true, true);
                }
            });
        }
    });  
}

function clearSearchDT( table ){
    var total = $( table ) .find('tfoot th').length ;
    for(var i = 0; i < total; i++){
        table.fnFilter("",i);
    }    
    $( table ) .find('tfoot th.inputTextFilter input').val("");
    $( table ) .find('tfoot th.selectFilter select option').filter(function(){        
        return $(this).text() == 'All'; 
    }).prop('selected', true);    
}