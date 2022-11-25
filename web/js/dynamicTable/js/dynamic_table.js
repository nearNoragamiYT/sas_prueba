var contador = 0;
var breakpointDefinition = {
    small_screen: 1440,
    tablet: 1024,
    phone: 480
};
if (typeof img_search == 'undefined') {
    var img_search = window.location.href + '../search.jpg';
}
if (typeof img_excel == 'undefined') {
    var img_excel = window.location.href + '../excel.jpg';
}
if (typeof img_edit_row == 'undefined') {
    var img_edit_row = window.location.href + '../edit_row.jpg';
}
if (typeof img_trash == 'undefined') {
    var img_trash = window.location.href + '../trash.jpg';
}

var dynamic_table_texts = {
    "loading_info": {
        "es": "Cargando Informacion...",
        "en": "Loading Information..."
    },
    "additional_filters": {
        "es": "Filtros Adicionales",
        "en": "Aditional Filters"
    },
    "last_update": {
        "es": "Ultima actualizacion",
        "en": "Last Update"
    },
    "all": {
        "es": "Todo",
        "en": "All"
    },
    "search": {
        "es": "Buscar",
        "en": "Search"
    },
    "apply_filters": {
        "es": "Aplicar Filtros",
        "en": "Apply Filters"
    },
    "clear_filters": {
        "es": "Limpiar Filtros",
        "en": "Clear Filters"
    },
    "show_custom_filters": {
        "es": "Búsqueda Avanzada",
        "en": "Custom Filters"
    },
    "close_custom_filters": {
        "es": "Ocultar",
        "en": "Close"
    },
    "filtered_by": {
        "es": "Filtros Activos:",
        "en": "Active Filters:"
    },
    "select_filter_to_show_data": {
        "es": "Realice un filtro para mostrar datos",
        "en": "Apply filter criterions to show data"
    },
    "export": {
        "es": "Exportar",
        "en": "Export"
    },
    "editar": {
        "es": "Editar",
        "en": "Edit"
    },
    "enviar_emp": {
        "es": "Enviar Bienvenida al Expositor",
        "en": "Send Welcome Exhibitor"
    },
    "eliminar_emp": {
        "es": "Eliminar",
        "en": "Delete"
    },
    "null": {
        "es": "Ninguno",
        "en": "None"
    },
    "ver_info": {
        "es": "Visualizar Información",
        "en": "Display Information"
    },
    "enviar_gafetes": {
        "es": "Enviar Gafetes",
        "en": "Send Badges"
    },
};

var search_request = {
    timming: 4000/*ms*/,
    token: null,
    filters: {}
};

function init_table(config) {
    var default_config = {
        "lang": "es",
        "table_name": "my-table",
        "table_texts": "",
        "wrapper": {},
        "table_columns": {},
        "column_categories": {},
        "table_data": {},
        "ajax_data": null,
        "custom_filters": false,
        "tfoot_filters": false,
        "server_side": false,
        "cache_data": false,
        "cache_pages": null,
        "url_get_data": "",
        "callback_init": null,
        "row_column_id": null,
        "edit_rows": false,
        "fn_edit_row": null,
        "fn_row_callback": null,
        "check_rows": false,
        "export_data": false,
        "export_obj": null,
        "url_export_data": "",
        "export_title": "Report",
        "last_update": null
    };
    if (typeof config !== 'undefined') {
        var config_items = Object.keys(default_config);
        var total_items = config_items.length;

        for (var i = 0; i < total_items; i++) {
            if (typeof config[config_items[i]] === 'undefined') {
                config[config_items[i]] = default_config[config_items[i]];
            }
        }
    } else {
        config = JSON.parse(JSON.stringify(default_config));
    }
    var table_name = config["table_name"];
    window[table_name] = {
        "wrapper_generated": "",
        "data_table": "",
        "data_table_obj": {},
        "columns_def": [],
        "custom_filters_form": "",
        "summary_detail": "",
        "html_popover": "",
        "popover_filter": "",
        "last_filter_values": "",
        "responsiveHelper": null
    }
    window[table_name]["config"] = config;

    window[table_name]['config']['wrapper'] = document.getElementById(window[table_name]['config']['wrapper']);
    if (window[table_name]['config']['wrapper'] == null || window[table_name]['config']['wrapper'] == "") {
        console.log("Table wrapper doesnt exists for " + table_name);
        return;
    }
    if (typeof window[table_name]['config']['columns'] != 'object' || Object.keys(window[table_name]['config']['columns']).length == 0) {
        console.log("Table columns doesnt exists for " + table_name);
        return;
    }
    window[table_name]['config']['wrapper'].innerHTML = "";
    window[table_name]['wrapper_generated'] = document.createElement("div");
    window[table_name]['wrapper_generated'].id = 'wrapper-dt-' + table_name;
    window[table_name]['wrapper_generated'].className = 'wrapper-dynamic-table';
    window[table_name]['config']['wrapper'].appendChild(window[table_name]['wrapper_generated']);

    //loader div
    var div = document.createElement("div");
    div.id = table_name + "-loader";
    div.className = "loader-table-data loader-table col s12";

    var lb = document.createElement("label");
    lb.innerHTML = dynamic_table_texts['loading_info'][window[table_name]['config']['lang']];
    div.appendChild(lb);

    window[table_name]['config']['wrapper'].appendChild(div);
    $("#" + table_name + "-loader").hide();

    if (window[table_name]['config']['custom_filters'] == true) {
        window[table_name]['filter_columns'] = window[table_name]['config']['columns'];

        drawCustomFilters(table_name);
        $('.tooltipped').tooltip({delay: 50});

        window[table_name]['custom_filters_form'].find(".dt-column-filter.inpt").keydown(function (event) {
            var code = event.keyCode || event.which;
            if (code == 13) {
                window[table_name]['custom_filters_form'].find(".generate-table").trigger("click");
            } else {
                if ($(this).hasClass("only-numbers")) {
                    if ((code < 48 && code != 8 && code != 37 && code != 39) || (code > 57 && code < 96) || code > 105 || event.shiftKey) {
                        return false;
                    }
                }
            }
        });

        window[table_name]['custom_filters_form'].find(".clear-filters").click(function () {
            clearFilterColumns(table_name);
        });

        window[table_name]['wrapper_generated'].innerHTML = dynamic_table_texts['select_filter_to_show_data'][window[table_name]['config']['lang']];
        window[table_name]['custom_filters_form'].find(".custom-filters-summary").hide();
    } else {
        loadTable(table_name);
        initStructureTable(table_name);
        //constructTable( table_name );
        initDataTable(table_name);
        return window[table_name]['data_table_obj'];
    }
}

function drawCustomFilters(table_name) {
    var custom_filters_form, div_wrapper, div_column,
            div_close_filters, div_btn, div_checkbox, div_summary;
    var fieldset, legend, label, ck, column_filter,
            op_filters, select_values, opt, btn;
    var columns = Object.keys(window[table_name]['filter_columns']);

    //main div
    custom_filters_form = document.createElement("div");
    custom_filters_form.className = "cutom-filters-form";

    //wrapper filter columns
    div_wrapper = document.createElement("fieldset");
    div_wrapper.className = "col s12 custom-filters";
    custom_filters_form.appendChild(div_wrapper);

    //div close Custom Filters Form
    div_close = document.createElement("div");
    div_close.className = "col s12";
    div_close.style.marginTop = "-9px";
    div_close.style.marginBottom = "-9px";
    div_close.style.marginLeft = "19px";
    div_wrapper.appendChild(div_close);

    div_close_filters = document.createElement("a");
    div_close_filters.className = "btn-floating right close-custom green tooltipped";
    div_close_filters.setAttribute('data-position', 'left');
    div_close_filters.setAttribute('data-tooltip', dynamic_table_texts['close_custom_filters'][window[table_name]['config']['lang']]);
    div_close_filters.onclick = function () {
        window[table_name]['custom_filters_form'].find(".custom-filters").hide();
        window[table_name]['custom_filters_form'].find(".custom-filters-summary").show();
    };
    icon = document.createElement("i");
    icon.className = "material-icons";
    icon.innerHTML = "keyboard_arrow_up";
    div_close_filters.appendChild(icon);
    div_close.appendChild(div_close_filters);


    if (typeof window[table_name]['config']['column_categories'] == 'object' && window[table_name]['config']['column_categories'].length > 0) {
        for (var i = 0; i < window[table_name]['config']['column_categories'].length; i++) {
            div_column = document.createElement("div");
            div_column.className = "col s4 m4 l4";
            div_wrapper.appendChild(div_column);

            fieldset = document.createElement("fieldset");
            div_column.appendChild(fieldset);

            legend = document.createElement("legend");
            legend.className = "text-info";
            legend.innerHTML = "<h5>" + window[table_name]['config']['column_categories'][i]['text'] + "</h5>";
            legend.style.marginBottom = "10px";
            fieldset.appendChild(legend);

            for (var j = 0; j < columns.length; j++) {
                if (typeof window[table_name]['config']['columns'][columns[j]]['category_id'] == 'undefined' || window[table_name]['config']['columns'][columns[j]]['category_id'] != window[table_name]['config']['column_categories'][i]['category_id']) {
                    continue;
                }
                div_checkbox = document.createElement("div");
                div_checkbox.className = "col s12 checkbox";

                label = document.createElement("label");
                label.onclick = function () {

                    var $chck = $(this).find(".dt-column-selectable");
                    var $column_filter = $(this).parents(".checkbox").find(".dt-column-filter.inpt");
                    var $filter_operator = $(this).parents(".checkbox").find(".dt-column-filter.operator");

                    $column_filter.val("").hide();
                    $filter_operator.hide();
                    if ($chck.is(":checked")) {
                        $column_filter.show();
                        $filter_operator.show();
                    }
                };
                div_checkbox.appendChild(label);

                ck = document.createElement("input");
                ck.setAttribute("id", "ch" + j);
                ck.setAttribute("type", "checkbox");
                ck.setAttribute("data-name", columns[j]);
                ck.setAttribute("checked", true);
                ck.className = "dt-column-selectable filled-in";
                if (typeof window[table_name]['config']['columns'][columns[j]]['filter_options']['is_optional_column'] != 'undefined' && window[table_name]['config']['columns'][columns[j]]['filter_options']['is_optional_column'] == false) {
                    ck.setAttribute("disabled", true);
                    ck.setAttribute("checked", true);
                }
                label.appendChild(ck);
                l = document.createElement("label");
                l.setAttribute("for", "ch" + j);
                l.innerHTML = l.innerHTML + ' ' + window[table_name]['config']['columns'][columns[j]]['text'];

                label.appendChild(l);

                if (typeof window[table_name]['config']['columns'][columns[j]]['filter_options']["is_select"] != 'undefined'
                        && window[table_name]['config']['columns'][columns[j]]['filter_options']["is_select"] == true
                        && typeof window[table_name]['config']['columns'][columns[j]]['filter_options']['values'] == 'object'
                        && Object.keys(window[table_name]['config']['columns'][columns[j]]['filter_options']['values']).length > 0
                        ) {
                    // multiple values column
                    select_values = Object.keys(window[table_name]['config']['columns'][columns[j]]['filter_options']['values']);
                    if (select_values.length > 0) {
                        column_filter = document.createElement("select");
                        column_filter.className = "dt-column-filter inpt col s12";

                        opt = document.createElement("option");
                        opt.value = "";
                        opt.innerHTML = dynamic_table_texts.all[window[table_name]['config']['lang']];
                        column_filter.appendChild(opt);

                        for (var k = 0; k < select_values.length; k++) {
                            opt = document.createElement("option");
                            opt.value = select_values[k];
                            opt.innerHTML = window[table_name]['config']['columns'][columns[j]]['filter_options']['values'][select_values[k]];
                            column_filter.appendChild(opt);
                        }
                    }
                } else if (typeof window[table_name]['config']['columns'][columns[j]]['filter_options']["is_date"] != 'undefined'
                        && window[table_name]['config']['columns'][columns[j]]['filter_options']["is_date"] == true) {
                    //input search column
                    column_filter = document.createElement("input");
                    column_filter.setAttribute("type", "date");
                    column_filter.className = "datepicker dt-column-filter inpt col s12";

                } else {
                    //input search column
                    column_filter = document.createElement("input");
                    column_filter.setAttribute("type", "text");
                    column_filter.className = "dt-column-filter inpt col s12";

                    op_filters = "";
                    if (typeof window[table_name]['config']['columns'][columns[j]]['filter_options']["filter_operators"] == 'object'
                            && typeof window[table_name]['config']['columns'][columns[j]]['filter_options']['filter_operators'].length != 'undefined'
                            ) {
                        column_filter.className = "dt-column-filter inpt col s8 offset-s1";

                        //filter column operators
                        op_filters = document.createElement("select");
                        op_filters.className = "dt-column-filter operator col s3";
                        for (var k = 0; k < window[table_name]['config']['columns'][columns[j]]['filter_options']["filter_operators"].length; k++) {
                            opt = document.createElement("option");
                            opt.value = window[table_name]['config']['columns'][columns[j]]['filter_options']["filter_operators"][k];
                            opt.innerHTML = window[table_name]['config']['columns'][columns[j]]['filter_options']["filter_operators"][k];

                            op_filters.appendChild(opt);
                        }
                        div_checkbox.appendChild(op_filters);
                    }
                }

                if (typeof window[table_name]['config']['columns'][columns[j]]['filter_options']['class'] != 'undefined') {
                    column_filter.className += " " + window[table_name]['config']['columns'][columns[j]]['filter_options']['class'];
                }

                if (typeof window[table_name]['config']['columns'][columns[j]]['filter_options']['is_optional_column'] != 'undefined' && window[table_name]['config']['columns'][columns[j]]['filter_options']['is_optional_column'] == false) {
                    if (op_filters != "" && typeof op_filters == 'object') {
                        op_filters.style.display = "block";
                    }
                    column_filter.style.display = "block";
                }
                div_checkbox.appendChild(column_filter);
                fieldset.appendChild(div_checkbox);
            }
        }
    } else {
    }
    //div buttons
    div_btn = document.createElement("div");
    div_btn.className = "col s12";
    div_btn.style.marginTop = "10px";
    div_btn.style.marginBottom = "5px";
    div_wrapper.appendChild(div_btn);

    btn = document.createElement("button");
    btn.className = "btn generate-table green right";
    btn.innerHTML = dynamic_table_texts['apply_filters'][window[table_name]['config']['lang']];
    btn.onclick = function () {
        loadTable(table_name);
        $(this).addClass("disabled");
        $(this).prop("disabled", true);
        setDTColumns(table_name, 1);
    };
    div_btn.appendChild(btn);

    btn = document.createElement("button");
    btn.className = "btn generate-table-invisible hide right";
    btn.innerHTML = dynamic_table_texts['apply_filters'][window[table_name]['config']['lang']];
    btn.onclick = function () {
        loadTable(table_name);
        $(this).addClass("disabled");
        $(this).prop("disabled", true);
        setDTColumns(table_name, 2);
    };
    div_btn.appendChild(btn);

    btn = document.createElement("a");
    btn.className = "waves-effect btn-flat clear-filters right";
    btn.innerHTML = dynamic_table_texts['clear_filters'][window[table_name]['config']['lang']];
    div_btn.appendChild(btn);

    //main div Summary Filters
    div_summary = document.createElement("div");
    div_summary.className = "col s12 custom-filters-summary";
    custom_filters_form.appendChild(div_summary);

    //Summary Filters title
    var div = document.createElement("div");
    div.className = "col s2 small-filters-title";
    div.innerHTML = dynamic_table_texts['filtered_by'][window[table_name]['config']['lang']];
    div_summary.appendChild(div);

    //Summary Filters Detail
    window[table_name]['summary_detail'] = document.createElement("div");
    window[table_name]['summary_detail'].className = "col s8 summary-detail";
    div_summary.appendChild(window[table_name]['summary_detail']);

    //div hide filters summary
    var div = document.createElement("div");
    div.className = "col s2 right";
    div_summary.appendChild(div);

    btn = document.createElement("a");
    btn.className = "btn-floating show-custom-filters green tooltipped";
    btn.setAttribute('data-position', 'left');
    btn.setAttribute('data-tooltip', dynamic_table_texts['show_custom_filters'][window[table_name]['config']['lang']]);
    btn.style.marginRight = "-8px";
    btn.style.marginTop = "2px";
//    btn.innerHTML = dynamic_table_texts['show_custom_filters'][window[table_name]['config']['lang']];
    btn.onclick = function () {
        window[table_name]['custom_filters_form'].find(".custom-filters").show();
        window[table_name]['custom_filters_form'].find(".custom-filters-summary").hide();
    };
    icon = document.createElement("i");
    icon.className = "material-icons";
    icon.innerHTML = "keyboard_arrow_down";
    btn.appendChild(icon);
    div.appendChild(btn);

    window[table_name]['custom_filters_form'] = $(custom_filters_form);
    window[table_name]['config']['wrapper'].insertBefore(custom_filters_form, window[table_name]['config']['wrapper'].firstChild);
}

function setDTColumns(table_name, type) {
    var item_div;
    var column_name, column_search, $check, $input_search, $filter_operator;
    var filter_columns = Object.keys(window[table_name]['filter_columns']);

    window[table_name]['summary_detail'].innerHTML = "";
    window[table_name]['config']['columns'] = {};
    window[table_name]['custom_filters_form'].find(".checkbox").each(function (index) {
        $check = $(this).find(".dt-column-selectable");
        $input_search = $(this).find(".dt-column-filter.inpt");
        $filter_operator = $(this).find(".dt-column-filter.operator");
        if ($check.is(":checked")) {
            column_name = $check.attr("data-name");
            column_search = $input_search.val();
            if (typeof column_name != 'undefined' || column_name != "" && filter_columns.indexOf(column_name) != -1) {
                window[table_name]['config']['columns'][column_name] = cloneObject(window[table_name]['filter_columns'][column_name]);
                if (column_search != "") {
                    window[table_name]['config']['columns'][column_name].search = column_search;

                    if ($filter_operator.length > 0) {
                        window[table_name]['config']['columns'][column_name].search = "op:" + $filter_operator.val() + "; " + column_search;
                        column_search = $filter_operator.val() + " " + column_search;
                    }

                    item_div = document.createElement("div");
                    item_div.className = "chip";
                    if ($input_search.is("select")) {
                        column_search = $input_search.find("option:selected").text();
                        if ($filter_operator.length > 0) {
                            column_search = $filter_operator.val() + " " + column_search;
                        }
                    }
                    item_div.innerHTML = window[table_name]['config']['columns'][column_name]['text'] + ': <b>' + column_search + '</b>';
                    window[table_name]['summary_detail'].appendChild(item_div);
                }
            }
        }
    });
    if ($(".summary-detail").children().length == 0) {
        item_div = document.createElement("div");
        item_div.className = "chip";
        item_div.innerHTML = dynamic_table_texts['null'][window[table_name]['config']['lang']];
        window[table_name]['summary_detail'].appendChild(item_div);
    }
    window[table_name]['custom_filters_form'].find(".close-custom").trigger("click");
    loadTable(table_name);
    initStructureTable(table_name);
    initDataTable(table_name, type);
}

function clearFilterColumns(table_name) {
    var $input_search;
    window[table_name]['custom_filters_form'].find(".checkbox").each(function (index) {
        $input_search = $(this).find(".dt-column-filter.inpt");
        if ($input_search.is("select")) {
            $input_search.find("option:first").prop('selected', true);
        } else {
            $input_search.val("");
        }
    });
}

function initStructureTable(table_name) {
    //clear DT vars
    window[table_name]['wrapper_generated'].innerHTML = "";
    window[table_name]['columns_def'] = [];
    window[table_name]['columns_search'] = [];
    window[table_name]["responsiveHelper"] = null;

    if (window[table_name]['config']["export_data"]) {
        if (isset(window[table_name]['config']["url_export_data"])) {
            //Export Form
            var frm = document.createElement("form");
            frm.action = window[table_name]['config']["url_export_data"];
            frm.method = "POST";
            frm.id = table_name + "-form-export";
            frm.target = "_blank";
            window[table_name]['config']['wrapper'].appendChild(frm);
        } else {
            alert("Debe especificar la ruta para la Exportación de los datos de la tabla " + table_name);
            window[table_name]['config']["export_data"] = false;
        }
    }

    window[table_name]['data_table'] = document.createElement("table");
    window[table_name]['data_table'].id = table_name;
    window[table_name]['data_table'].className = "datatable highlight bordered dinamic-table";

    //if( Object.keys(window[table_name]['table_data']).length > 0 ){
    var thead = "", tbody = "", tfoot = "", tr = "", th = "";
    var ex_keys = Object.keys(window[table_name]['config']['columns']);
    var is_column_visible;
    var total_keys = ex_keys.length;
    var ckbx;

    //thead table
    thead = document.createElement("thead");
    window[table_name]['data_table'].appendChild(thead);

    tr = document.createElement("tr");
    thead.appendChild(tr);

    var sum_to_column_target = 0;
    if (window[table_name]['config']['check_rows'] == true) {
        //check row th
        th = document.createElement("th");
        th.className = "center";
        th.style.width = "5%";

        ckbx = document.createElement('input');
        ckbx.setAttribute("type", "checkbox");
        ckbx.className = "ckbx-header";
        ckbx.onchange = function () {
            var is_header_checked = $(this).is(":checked");
            window[table_name]['data_table_obj'].find(".ckbx-into-table").prop("checked", is_header_checked);
        };
        th.appendChild(ckbx);

        tr.appendChild(th);
        window[table_name]['columns_search'].push(null);

        window[table_name]['columns_def'].push({
            "data": "img_check",
            "targets": 0
        });
        sum_to_column_target = 1;
    }

    var search_column_value;
    for (var i = 0; i < total_keys; i++) {
        th = document.createElement("th");

        //meta to expand Row in Datatable responsive
        if (window[table_name]['config']['columns'][ex_keys[i]]['data-class'] !== undefined) {
            th.setAttribute("data-class", window[table_name]['config']['columns'][ex_keys[i]]['data-class']);
        }

        //meta to hide Row in Datatable responsive
        if (window[table_name]['config']['columns'][ex_keys[i]]['data-hide'] !== undefined) {
            th.setAttribute("data-hide", window[table_name]['config']['columns'][ex_keys[i]]['data-hide']);
        }

        is_column_visible = true;
        if (window[table_name]['config']['columns'][ex_keys[i]] === undefined || (window[table_name]['config']['columns'][ex_keys[i]] !== undefined && !window[table_name]['config']['columns'][ex_keys[i]]['is_visible'])) {
            is_column_visible = false;
        }

        th.innerHTML = window[table_name]['config']['columns'][ex_keys[i]]['text'];
        tr.appendChild(th);

        window[table_name]['columns_def'].push({
            "name": window[table_name]['config']['columns'][ex_keys[i]]['text'],
            "data": ex_keys[i],
            "targets": i + sum_to_column_target,
            "visible": is_column_visible
        });

        search_column_value = "";
        if (window[table_name]['config']['columns'][ex_keys[i]]['search'] != undefined) {
            search_column_value = window[table_name]['config']['columns'][ex_keys[i]]['search'];
        }
        window[table_name]['columns_search'].push({"sSearch": search_column_value});
    }

    if (window[table_name]['config']["edit_rows"] == true) {
        //edit row th
        th = document.createElement("th");
        th.style.width = "5%";
        tr.appendChild(th);
    }
    if (window[table_name]['config']["Empresa_row"] == true) {
        th = document.createElement("th");
        th.style.width = "5%";
        tr.appendChild(th);
    }
    if (window[table_name]['config']["Ventas_row"] == true) {
        th = document.createElement("th");
        th.style.width = "8%";
        tr.appendChild(th);
    }
    if (window[table_name]['config']["Visitor_row"] == true) {
        th = document.createElement("th");
        th.style.width = "5%";
        tr.appendChild(th);
    }
    if (window[table_name]['config']["Visitor_row_v"] == true) {
        th = document.createElement("th");
        th.style.width = "5%";
        tr.appendChild(th);
    }
    if (window[table_name]['config']["Visitor_row_v_e"] == true) {
        th = document.createElement("th");
        th.style.width = "5%";
        tr.appendChild(th);
    }
    if (window[table_name]['config']["Visitor_row_rs"] == true) {
        th = document.createElement("th");
        th.style.width = "5%";
        tr.appendChild(th);
    }
    if (window[table_name]['config']["Editor_row"] == true) {
        th = document.createElement("th");
        th.style.width = "5%";
        tr.appendChild(th);
    }
    if (window[table_name]['config']["Lectoras_row"] == true) {
        th = document.createElement("th");
        th.style.width = "5%";
        tr.appendChild(th);
    }
    if (window[table_name]['config']["Comprador_row"] == true) {
        th = document.createElement("th");
        th.style.width = "5%";
        tr.appendChild(th);
    }

    //tbody table
    tbody = document.createElement("tbody");
    window[table_name]['data_table'].appendChild(tbody);

    if (window[table_name]['config']['tfoot_filters'] == true) {
        //tfoot table
        tfoot = document.createElement("tfoot");
        tr = document.createElement("tr");
        tfoot.appendChild(tr);

        var inpt, ckbx, select, select_values, opt, btn;

        if (window[table_name]['config']['check_rows'] == true) {
            //check row th
            th = document.createElement("th");
            tr.appendChild(th);
        }

        for (var i = 0; i < total_keys; i++) {
            th = document.createElement("th");

            if (typeof window[table_name]['config']['columns'][ex_keys[i]]['filter_options']['is_select'] != 'undefined' && window[table_name]['config']['columns'][ex_keys[i]]['filter_options']['is_select'] == true) {
                // multiple values column
                th.className = "selectFilter";
                th.setAttribute("data-col", i);

                if (typeof window[table_name]['config']['columns'][ex_keys[i]]['filter_options']['values'] == 'object') {
                    select_values = Object.keys(window[table_name]['config']['columns'][ex_keys[i]]['filter_options']['values']);
                    if (select_values.length > 0) {
                        select = document.createElement("select");
                        select.setAttribute("name", "f_" + ex_keys[i]);
                        select.setAttribute("id", "f_" + ex_keys[i]);
                        select.setAttribute("data-table", table_name);

                        opt = document.createElement("option");
                        opt.value = "";
                        opt.innerHTML = dynamic_table_texts.all[window[table_name]['config']['lang']];
                        select.appendChild(opt);

                        for (var k = 0; k < select_values.length; k++) {
                            opt = document.createElement("option");
                            opt.value = select_values[k];
                            opt.innerHTML = window[table_name]['config']['columns'][ex_keys[i]]['filter_options']['values'][select_values[k]];
                            select.appendChild(opt);
                        }
                        th.appendChild(select);

                        inpt = document.createElement("input");
                        inpt.setAttribute("type", "hidden");
                        th.appendChild(inpt);
                    }
                }
            } else {
                th.className = "inputTextFilter";
                th.setAttribute("data-col", i);

                inpt = document.createElement("input");
                inpt.setAttribute("type", "text");
                inpt.name = "f_" + ex_keys[i];
                inpt.id = "f_" + ex_keys[i];
                th.appendChild(inpt);
            }
            tr.appendChild(th);
        }
        if (window[table_name]['config']["edit_rows"] == true) {
            //edit row th
            th = document.createElement("th");

            /*btn = document.createElement("button");
             btn.setAttribute("type", "button");
             btn.className = "btn btn-default";
             btn.innerHTML = dynamic_table_texts['search'][window[table_name]['config']['lang']];
             btn.onclick = function(){
             triggerSearch( table_name );
             };
             th.appendChild( btn );*/

            tr.appendChild(th);
        }

        window[table_name]['data_table'].appendChild(tfoot);
    }

    if (window[table_name]['config']["edit_rows"] == true) {
        window[table_name]['columns_def'].push({
            "data": "img_edit",
            "sDefaultContent": "",
            "targets": total_keys + sum_to_column_target
        });
    }
    if (window[table_name]['config']["Empresa_row"] == true) {
        window[table_name]['columns_def'].push({
            "data": "empresa_row",
            "sDefaultContent": "",
            "targets": total_keys + sum_to_column_target
        });
    }
    if (window[table_name]['config']["Ventas_row"] == true) {
        window[table_name]['columns_def'].push({
            "data": "ventas_row",
            "sDefaultContent": "",
            "targets": total_keys + sum_to_column_target
        });
    }
    if (window[table_name]['config']["Visitor_row"] == true) {
        window[table_name]['columns_def'].push({
            "data": "visitor_row",
            "sDefaultContent": "",
            "targets": total_keys + sum_to_column_target
        });
    }
    if (window[table_name]['config']["Visitor_row_v"] == true) {
        window[table_name]['columns_def'].push({
            "data": "visitor_row",
            "sDefaultContent": "",
            "targets": total_keys + sum_to_column_target
        });
    }
    if (window[table_name]['config']["Visitor_row_v_e"] == true) {
        window[table_name]['columns_def'].push({
            "data": "visitor_row",
            "sDefaultContent": "",
            "targets": total_keys + sum_to_column_target
        });
    }
    if (window[table_name]['config']["Visitor_row_rs"] == true) {
        window[table_name]['columns_def'].push({
            "data": "visitor_row",
            "sDefaultContent": "",
            "targets": total_keys + sum_to_column_target
        });
    }
    if (window[table_name]['config']["Editor_row"] == true) {
        window[table_name]['columns_def'].push({
            "data": "compras_row",
            "sDefaultContent": "",
            "targets": total_keys + sum_to_column_target
        });
    }
    if (window[table_name]['config']["Lectoras_row"] == true) {
        window[table_name]['columns_def'].push({
            "data": "lectora_row",
            "sDefaultContent": "",
            "targets": total_keys + sum_to_column_target
        });
    }
    if (window[table_name]['config']["Comprador_row"] == true) {
        window[table_name]['columns_def'].push({
            "data": "comprador_row",
            "sDefaultContent": "",
            "targets": total_keys + sum_to_column_target
        });
    }
    //}
    window[table_name]['wrapper_generated'].appendChild(window[table_name]['data_table']);
}

//UNUSED FUNCTION
/*function constructTable( table_name ){
 if( window[table_name]['data_table_obj'] != "" ){
 window[table_name]['data_table_obj'].fnDestroy();
 $("#visitor-table tbody").html("");
 }
 
 if( Object.keys(window[table_name]['table_data']).length > 0 ){
 var keys = Object.keys(window[table_name]['config']['table_data']);
 var total_exhibitors = keys.length;
 var ex_keys = Object.keys(window[table_name]['config']['table_data'][keys[0]]);
 var total_ex_keys = ex_keys.length;
 var tr = "", td = "", img, row_data = "", cell_value, ckbx;
 
 var list_of_values, total_items, value_item, item_date, delimiter;
 
 
 for( var i = 0; i < total_exhibitors; i++ ){
 row_data = window[table_name]['config']['table_data'][keys[i]];
 tr = document.createElement("tr");
 tr.id = window[table_name]['table_name'] + "-tr-data-" + keys[i];
 
 if( window[table_name]['config']['check_rows'] ){
 td = document.createElement("td");
 td.className = "center";
 
 ckbx = document.createElement('input');
 ckbx.setAttribute("type", "checkbox");
 ckbx.className = "ckbx-into-table";
 ckbx.name = "ckbx[]";
 ckbx.value = keys[i];
 td.appendChild( ckbx );
 
 tr.appendChild( td );
 }
 
 for( var j = 0; j < total_ex_keys; j++ ){
 td = document.createElement("td");
 td.innerHTML = "";
 
 cell_value = row_data[ex_keys[j]] + "";
 
 if( !isset(cell_value) ){
 td.innerHTML = "-";
 }else{
 value_item = cell_value;
 
 //Verify if values porperty is not empty
 if( window[table_name]['config']['columns'][ex_keys[j]] !== undefined && typeof window[table_name]['config']['columns'][ex_keys[j]]['values'] === "object" && Object.keys(window[table_name]['config']['columns'][ex_keys[j]]['values']).length > 0 ){
 
 //Verify if cell_value is a list of values, and delimiter for it
 delimiter = ( window[table_name]['config']['columns'][ex_keys[j]]['list_delimiter'] !== undefined ) ? window[table_name]['config']['columns'][ex_keys[j]]['list_delimiter'] : "none";
 list_of_values = cell_value.split( delimiter );
 total_items = list_of_values.length;
 
 //Verify if key porperty is not empty to take from Values object
 for( var k = 0; k < total_items; k++ ){
 td.innerHTML += ( k > 0 ) ? "," : "";
 if( window[table_name]['config']['columns'][ex_keys[j]]['values'][list_of_values[k]] !== undefined ){
 if( window[table_name]['config']['columns'][ex_keys[j]]['key'] !== undefined && window[table_name]['config']['columns'][ex_keys[j]]['key'] != "" ){
 if( window[table_name]['config']['columns'][ex_keys[j]]['date_format'] !== undefined && window[table_name]['config']['columns'][ex_keys[j]] != "" ){
 item_date = new Date(window[table_name]['config']['columns'][ex_keys[j]]['values'][list_of_values[k]][window[table_name]['config']['columns'][ex_keys[j]]['key']]);
 value_item = ( item_date.toString() != "Invalid Date" ) ? item_date.format( window[table_name]['config']['columns'][ex_keys[j]]['date_format'] ) : list_of_values[k];
 }else{
 value_item = window[table_name]['config']['columns'][ex_keys[j]]['values'][list_of_values[k]][window[table_name]['config']['columns'][ex_keys[j]]['key']];
 }
 td.innerHTML += value_item;
 }else{
 if( window[table_name]['config']['columns'][ex_keys[j]]['date_format'] !== undefined ){
 item_date = new Date(window[table_name]['config']['columns'][ex_keys[j]]['values'][list_of_values[k]]);
 value_item = ( item_date.toString() != "Invalid Date" ) ? item_date.format( window[table_name]['config']['columns'][ex_keys[j]]['date_format'] ) : list_of_values[k];
 }else{
 value_item = window[table_name]['config']['columns'][ex_keys[j]]['values'][list_of_values[k]];
 }
 td.innerHTML += value_item;
 }
 }else{
 value_item = list_of_values[k];
 td.innerHTML += value_item;
 }
 }
 }else{
 if( window[table_name]['config']['columns'][ex_keys[j]] !== undefined && window[table_name]['config']['columns'][ex_keys[j]]['date_format'] !== undefined ){
 item_date = new Date(cell_value);
 value_item = ( item_date.toString() != "Invalid Date" ) ? item_date.format( window[table_name]['config']['columns'][ex_keys[j]]['date_format'] ) : cell_value;
 }
 td.innerHTML = value_item;
 }
 }
 
 if( window[table_name]['config']['columns'][ex_keys[j]] === undefined || ( window[table_name]['config']['columns'][ex_keys[j]] !== undefined && !window[table_name]['config']['columns'][ex_keys[j]]['is_visible'] ) ){
 td.className = "hidden-column";
 }else if( window[table_name]['config']['columns'][ex_keys[j]] !== undefined && window[table_name]['config']['columns'][ex_keys[j]]['className'] !== undefined && window[table_name]['config']['columns'][ex_keys[j]]['className'] != "" ){
 td.className = window[table_name]['config']['columns'][ex_keys[j]]['className'];
 }
 
 tr.appendChild( td );
 }
 
 if( window[table_name]['config']["edit_rows"] == true ){
 td = document.createElement("td");
 
 img = document.createElement('img');
 img.className = "img-into-table";
 img.src = img_edit_row;
 img.setAttribute("data-id",  keys[i]);
 
 td.appendChild( img );
 
 tr.appendChild( td );
 }
 
 $( window[table_name]['config']['data_table'] ).find("tbody").append( tr );
 }
 if( window[table_name]['config']["edit_rows"] == true && typeof window[table_name]['config']["fn_edit_row"] === 'function' ){
 $( window[table_name]['config']['data_table'] ).find("tbody tr").on("click", ".img-into-table", window[table_name]['config']["fn_edit_row"]);
 }
 }
 }*/

function initDataTable(table_name, type) {

    var $data_table = $(window[table_name]['data_table']);
    /*console.log($data_table);*/

    if (window[table_name]['config']['text_datatable'] == null) {
        window[table_name]['config']['text_datatable'] = "";
    }
    var datatable_settings = {
        "sPaginationType": "bs_full",
        "bDestroy": true,
        "bAutoWidth": false,
        "aoColumnDefs": window[table_name]['columns_def'],
        "searchCols": window[table_name]['columns_search'],
        "oLanguage": {"sUrl": window[table_name]['config']['text_datatable']},
        "fnInitComplete": function () {
            if (window[table_name]['config']['custom_filters'] == true) {
                window[table_name]['custom_filters_form'].find(".generate-table").prop("disabled", false);
                $(".generate-table").removeClass("disabled");
            } else if (window[table_name]['config']['tfoot_filters'] == true) {
                drawFilters(table_name);
            }

            if (window[table_name]['config']['check_rows']) {
                drawDeleteRowsSettings(table_name);
            }

            updateTableMetaData(table_name);

            if (window[table_name]['config']['last_update'] != null) {
                drawInfoCache(table_name);
            }

            if (window[table_name]['config']['export_data']) {
                window[table_name]['config']["export_obj"] = null;
                drawExportSettings(table_name);
            }

            var $div_processing = $(window[table_name]['wrapper_generated']).find(".dataTables_processing");
            if ($div_processing.length > 0) {
                var lbl = document.createElement("label");
                lbl.innerHTML = $div_processing.html();
                $div_processing.html("").append(lbl);
                $div_processing.prependTo($(window[table_name]['wrapper_generated']));
            }

            if (window[table_name]['config']['callback_init'] !== undefined && typeof window[table_name]['config']['callback_init'] == 'function') {
                window[table_name]['config']['callback_init'](window[table_name]['data_table_obj']);
            }

            showTable(table_name);
        },
        "fnPreDrawCallback": function () {
            // Initialize the responsive datatables helper once.
            if (window[table_name]["responsiveHelper"] == null) {
                window[table_name]["responsiveHelper"] = new ResponsiveDatatablesHelper(window[table_name]['data_table_obj'], breakpointDefinition);
            }
        },
        "fnRowCallback": function (nRow, row_data) {
            window[table_name]["responsiveHelper"].createExpandIcon(nRow);
            var $nRow = $(nRow);
            $nRow.find(".ckbx-into-table").prop("checked", false);
            if (window[table_name]['config']["edit_rows"] == true && window[table_name]['config']["Contratos_row"] == undefined) {
                var img = document.createElement("img");
                img.className = "img-into-table";
                img.src = img_edit_row;
                $nRow.find("td").last().html("").append(img);
            }
            if (window[table_name]['config']["Empresa_row"] == true) {
                var i = document.createElement('i');
                i.setAttribute('class', 'material-icons edit-record tooltipped');
                i.setAttribute('link', url_edit_empresa_data + "/" + row_data.idEmpresa);
                i.setAttribute('data-position', 'left');
                i.setAttribute('data-tooltip', dynamic_table_texts['editar'][window[table_name]['config']['lang']]);
                i.setAttribute('data-id', row_data.idEmpresa);
                i.innerHTML = "mode_edit";
                $nRow.find("td").last().html("").append(i);

                if (row_data.Gafetes > "0") {
                    var i = document.createElement('i');
                    i.setAttribute('class', 'material-icons email-record tooltipped');
                    i.setAttribute('data-position', 'left');
                    i.setAttribute('data-tooltip', dynamic_table_texts['enviar_emp'][window[table_name]['config']['lang']]);
                    i.setAttribute('data-id', row_data.idEmpresa);
                    i.setAttribute('data-NC', row_data.DC_NombreComercial);
                    i.setAttribute('data-email', '0');
                    i.innerHTML = "email";
                    $nRow.find("td").last().append(i);

                    var i = document.createElement('i');
                    i.setAttribute('class', 'material-icons gafete-record tooltipped');
                    i.setAttribute('data-position', 'left');
                    i.setAttribute('data-tooltip', dynamic_table_texts['enviar_gafetes'][window[table_name]['config']['lang']]);
                    i.setAttribute('data-id', row_data.idEmpresa);
                    i.setAttribute('data-NC', row_data.DC_NombreComercial);
                    i.setAttribute('data-email', '1');
                    i.innerHTML = "assignment_ind";
                    $nRow.find("td").last().append(i);
                } else {
                    var i = document.createElement('i');
                    i.setAttribute('class', 'material-icons email-record tooltipped');
                    i.setAttribute('data-position', 'left');
                    i.setAttribute('data-tooltip', dynamic_table_texts['enviar_emp'][window[table_name]['config']['lang']]);
                    i.setAttribute('data-id', row_data.idEmpresa);
                    i.setAttribute('data-NC', row_data.DC_NombreComercial);
                    i.setAttribute('data-email', '0');
                    i.innerHTML = "email";
                    $nRow.find("td").last().append(i);
                }
            }
            if (window[table_name]['config']["Ventas_row"] == true) {
                var i = document.createElement('i');
                i.setAttribute('class', 'material-icons edit-record tooltipped');
                i.setAttribute('link', url_company_comercial.replace("0000", row_data.idEmpresa));
                i.setAttribute('data-position', 'left');
                i.setAttribute('data-tooltip', dynamic_table_texts['editar'][window[table_name]['config']['lang']]);
                i.setAttribute('data-id', row_data.idEmpresa);
                i.innerHTML = "mode_edit";
                $nRow.find("td").last().html("").append(i);

                /*var i = document.createElement('i');
                 i.setAttribute('class', 'material-icons presale-record tooltipped');
                 i.setAttribute('link', url_contract.replace("0000", row_data.idEmpresa));
                 i.setAttribute('data-position', 'left');
                 i.setAttribute('data-tooltip', "Contrato");
                 i.setAttribute('data-id', row_data.idEmpresa);
                 i.innerHTML = "description";
                 $nRow.find("td").last().append(i);*/

                if (row_data.idEtapa == 'Prospecto') {
                    var i = document.createElement('i');
                    i.setAttribute('class', 'material-icons delete-record tooltipped');
                    i.setAttribute('data-position', 'left');
                    i.setAttribute('data-tooltip', dynamic_table_texts['eliminar_emp'][window[table_name]['config']['lang']]);
                    i.setAttribute('data-id', row_data.idEmpresa);
                    i.setAttribute('data-NC', row_data.DC_NombreComercial);
                    i.innerHTML = "delete_forever";
                    $nRow.find("td").last().append(i);
                }
            }
            if (window[table_name]['config']["Multiregistro_row"] == true) {

                /*console.log(row_data);*/

                var i = document.createElement('i');
                i.setAttribute('class', 'material-icons edit-record tooltipped');
                i.setAttribute('link', url_visitante_datos_generales + "/" + row_data.idVisitante);
                i.setAttribute('data-position', 'left');
                i.setAttribute('data-tooltip', dynamic_table_texts['editar'][window[table_name]['config']['lang']]);
                i.setAttribute('data-id', row_data.idVisitante);
                i.innerHTML = "mode_edit";
                $nRow.find("td").last().html("").append(i);

                var i = document.createElement('i');
                if (row_data.NumDescargar > 0 || row_data.NumDescargar != null) {
                    i.setAttribute('class', 'material-icons send-gafete-wallet tooltipped blue-text');
                } else {
                    i.setAttribute('class', 'material-icons send-gafete-wallet tooltipped');
                }
                i.setAttribute('id', 'send-gafete-wallet');
                i.setAttribute('name', 'send-gafete-wallet');
                i.setAttribute('data-position', 'left');
                i.setAttribute('data-tooltip', 'Gafete Email');
                i.setAttribute('data-id', row_data.idVisitante);
                i.setAttribute('value', row_data.idVisitante);
                i.innerHTML = "email";
                $nRow.find("td").last().append(i);

                var i = document.createElement('i');
                if (row_data.NumDescargar > 0 || row_data.NumDescargar != null) {
                    i.setAttribute('class', 'material-icons download-gafete tooltipped blue-text');
                } else {
                    i.setAttribute('class', 'material-icons download-gafete tooltipped');
                }
                i.setAttribute('id', 'dowload-gafete');
                i.setAttribute('name', 'dowload-gafete');
                i.setAttribute('data-position', 'left');
                i.setAttribute('data-tooltip', 'Descargar Gafete');
                i.setAttribute('data-id', row_data.idVisitante);
                i.setAttribute('value', row_data.idVisitante);
                i.innerHTML = "file_download";
                $nRow.find("td").last().append(i);
            }
            if (window[table_name]['config']["Visitor_row"] == true) {
                var i = document.createElement('i');
                i.setAttribute('class', 'material-icons edit-record tooltipped');
                i.setAttribute('link', url_visitante_datos_generales + "/" + row_data.idVisitante);
                i.setAttribute('data-position', 'left');
                i.setAttribute('data-tooltip', dynamic_table_texts['editar'][window[table_name]['config']['lang']]);
                i.setAttribute('data-id', row_data.idVisitante);
                i.innerHTML = "mode_edit";
                $nRow.find("td").last().html("").append(i);

                /* var i = document.createElement('i');
                 i.setAttribute('class', 'material-icons send-badge tooltipped');
                 i.setAttribute('data-position', 'left');
                 i.setAttribute('data-tooltip', "send Badge");
                 i.setAttribute('data-badge', row_data.idVisitante);
                 i.innerHTML = "markunread";
                 $nRow.find("td").last().append(i); */
            }
            if (window[table_name]['config']["Visitor_row_v"] == true) {

                var i = document.createElement('i');
                i.setAttribute('class', 'material-icons edit-record tooltipped');
                i.setAttribute('link', url_visitante_datos_generales + "/" + row_data.idVisitante);
                i.setAttribute('data-position', 'left');
                i.setAttribute('data-tooltip', dynamic_table_texts['editar'][window[table_name]['config']['lang']]);
                i.setAttribute('data-id', row_data.idVisitante);
                i.innerHTML = "mode_edit";
                $nRow.find("td").last().html("").append(i);

                var i = document.createElement('i');
                if (row_data.NumEnvios > 0 || row_data.NumEnvios != null) {
                    i.setAttribute('class', 'material-icons send-badge tooltipped blue-text');
                } else {
                    i.setAttribute('class', 'material-icons send-badge tooltipped ');
                }
                i.setAttribute('data-position', 'left');
                i.setAttribute('data-tooltip', "send Badge");
                i.setAttribute('data-badge', row_data.idVisitante);
                i.innerHTML = "markunread";
                $nRow.find("td").last().append(i);

                var i = document.createElement('i');
                if (row_data.NumDescargar > 0 || row_data.NumDescargar != null) {
                    i.setAttribute('class', 'material-icons download-gafete tooltipped blue-text');
                } else {
                    i.setAttribute('class', 'material-icons download-gafete tooltipped');
                }
                i.setAttribute('id', 'download-gafete');
                i.setAttribute('name', 'download-gafete');
                i.setAttribute('data-position', 'left');
                i.setAttribute('data-tooltip', 'Descargar Gafete');
                i.setAttribute('data-id', row_data.idVisitante);
                i.setAttribute('value', row_data.idVisitante);
                i.innerHTML = "file_download";
                $nRow.find("td").last().append(i);
            }
            if (window[table_name]['config']["Visitor_row_v_e"] == true) {
                /*console.log(row_data);*/

                var i = document.createElement('i');
                i.setAttribute('data-position', 'left');
                i.setAttribute('data-tooltip', dynamic_table_texts['editar'][window[table_name]['config']['lang']]);
                i.setAttribute('data-id', row_data.idVisitante);
                i.innerHTML = "mode_edit";
                $nRow.find("td").last().html("").append(i);


                var i = document.createElement('i');
                i.setAttribute('class', 'material-icons edit-record tooltipped');
                i.setAttribute('link', url_visitante_datos_generales + "/" + row_data.idVisitante);
                i.setAttribute('data-position', 'left');
                i.setAttribute('data-tooltip', dynamic_table_texts['editar'][window[table_name]['config']['lang']]);
                i.setAttribute('data-id', row_data.idVisitante);
                i.innerHTML = "mode_edit";
                $nRow.find("td").last().html("").append(i);

                var i = document.createElement('i');
                if (row_data.NumEnvios > 0 || row_data.NumEnvios != null) {
                    i.setAttribute('class', 'material-icons send-badge tooltipped blue-text');
                } else {
                    i.setAttribute('class', 'material-icons send-badge tooltipped ');
                }
                i.setAttribute('data-position', 'left');
                i.setAttribute('data-tooltip', "send Badge");
                i.setAttribute('data-badge', row_data.idVisitante);
                i.innerHTML = "markunread";
                $nRow.find("td").last().append(i);

                var i = document.createElement('i');
                if (row_data.NumDescargar > 0 || row_data.NumDescargar != null) {
                    i.setAttribute('class', 'material-icons download-gafete tooltipped blue-text');
                } else {
                    i.setAttribute('class', 'material-icons download-gafete tooltipped');
                }
                i.setAttribute('id', 'download-gafete');
                i.setAttribute('name', 'download-gafete');
                i.setAttribute('data-position', 'left');
                i.setAttribute('data-tooltip', 'Descargar Gafete');
                i.setAttribute('data-id', row_data.idVisitante);
                i.setAttribute('value', row_data.idVisitante);
                i.innerHTML = "file_download";
                $nRow.find("td").last().append(i);


                var divSwitch = document.createElement('div');
                divSwitch.setAttribute('class', 'switch center');
                var labq = document.createElement("label");
                labq.innerHTML = '¿Encuentro Negocios?';
                var switch1 = document.createElement("input");
                switch1.setAttribute('type', 'checkbox');
                var label1 = document.createElement("label");
                label1.innerHTML = 'No/Si';
                var spanch = document.createElement("span");
                spanch.setAttribute('class', 'lever');
                divSwitch.appendChild(labq);
                divSwitch.appendChild(label1);
                label1.appendChild(switch1);
                label1.appendChild(spanch);
                $nRow.find("td").last().append(divSwitch);
            }
            if (window[table_name]['config']["Visitor_row_rs"] == true) {
                var i = document.createElement('i');
                i.setAttribute('class', 'material-icons edit-record tooltipped');
                i.setAttribute('link', url_visitante_datos_generales + "/" + row_data.idVisitante);
                i.setAttribute('data-position', 'left');
                i.setAttribute('data-tooltip', dynamic_table_texts['ver_info'][window[table_name]['config']['lang']]);
                i.setAttribute('data-id', row_data.idVisitante);
                i.innerHTML = "visibility";
                $nRow.find("td").last().html("").append(i);
            }
            if (window[table_name]['config']["Editor_row"] == true) {
                var i = document.createElement('i');
                i.setAttribute('class', 'material-icons edit-record tooltipped');
                i.setAttribute('data-position', 'left');
                i.setAttribute('data-tooltip', dynamic_table_texts['editar'][window[table_name]['config']['lang']]);
                i.setAttribute('data-id', row_data.idCompra);
                i.setAttribute('vis-id', row_data.idVisitante);
                i.innerHTML = "mode_edit";
                $nRow.find("td").last().html("").append(i);
            }

            if (window[table_name]['config']["Contratos_row"] == true) {
                var i = document.createElement('i');
                if (row_data.idStatusContrato != "Cancelado" && row_data.idStatusContrato != "Cancelled") {
                    i.setAttribute('class', 'material-icons edit-record tooltipped');
                    i.setAttribute('link', url_edit_contrato_data + '/' + row_data.idEmpresa + '/' + row_data.idContrato);
                    i.setAttribute('data-position', 'left');
                    i.setAttribute('data-tooltip', dynamic_table_texts['editar'][window[table_name]['config']['lang']]);
                    i.setAttribute('data-id', row_data.idEmpresa);
                    i.innerHTML = "mode_edit";
                    $nRow.find("td").last().append(i);

                    i = document.createElement('i');
                    i.setAttribute('class', 'material-icons delete-record tooltipped');
                    i.setAttribute('data-ide', row_data.idEmpresa);
                    i.setAttribute('data-idc', row_data.idContrato);
                    i.setAttribute('data-NC', row_data.idContrato);
                    i.setAttribute('data-position', 'left');
                    i.setAttribute('data-tooltip', "Cancelar Contrato");
                    i.innerHTML = "clear";
                    $nRow.find("td").last().append(i);
                }
            }

            if (window[table_name]['config']["Lectoras_row"] == true) {
                var i = document.createElement('i');
                i.setAttribute('class', 'material-icons edit-record tooltipped');
                i.setAttribute('link', url_edit_empresa_data + "/" + row_data.idEmpresa);
                i.setAttribute('data-position', 'left');
                i.setAttribute('data-tooltip', dynamic_table_texts['editar'][window[table_name]['config']['lang']]);
                i.setAttribute('data-id', row_data.idEmpresa);
                i.innerHTML = "mode_edit";
                $nRow.find("td").last().html("").append(i);
            }

            if (window[table_name]['config']["Comprador_row"] == true) {
                var i = document.createElement('i');
                i.setAttribute('class', 'material-icons edit-record tooltipped');
                i.setAttribute('link', url_visitante_datos_generales + "/" + row_data.idVisitante);
                i.setAttribute('data-position', 'left');
                i.setAttribute('data-tooltip', dynamic_table_texts['editar'][window[table_name]['config']['lang']]);
                i.setAttribute('data-id', row_data.idEmpresa);
                i.innerHTML = "mode_edit";
                $nRow.find("td").last().html("").append(i);
            }

            if (window[table_name]['config']["row_column_id"] != null
                    && window[table_name]['config']["row_column_id"] != ""
                    && typeof row_data[window[table_name]['config']["row_column_id"]] != ""
                    ) {
                $nRow.attr("data-id", row_data[window[table_name]['config']["row_column_id"]]);
            }

            if (typeof window[table_name]['config']["fn_row_callback"] === 'function') {
                window[table_name]['config']["fn_row_callback"]($nRow, row_data);
            }
        },
        "fnDrawCallback": function () {
            window[table_name]['data_table_obj'].find(".ckbx-header").prop("checked", false);
            // Respond to windows resize.
            window[table_name]["responsiveHelper"].respond();
            $('.tooltipped').tooltip({delay: 50});
            tabPermisos();
        }
    }
    if (window[table_name]['config']['check_rows'] == true) {
        // Disable sorting on the first column
        datatable_settings.aoColumnDefs.push({
            'bSortable': false,
            'aTargets': [0]
        });
    }
    if (window[table_name]['config']["Empresa_row"] == true) {
        datatable_settings.aoColumnDefs.push({
            'bSortable': false,
            'aTargets': [-1]
        });
    }
    if (window[table_name]['config']["Ventas_row"] == true) {
        datatable_settings.aoColumnDefs.push({
            'bSortable': false,
            'aTargets': [-1]
        });
    }
    if (window[table_name]['config']["Visitor_row"] == true) {
        datatable_settings.aoColumnDefs.push({
            'bSortable': false,
            'aTargets': [-1]
        });
    }
    if (window[table_name]['config']["Visitor_row_v"] == true) {
        datatable_settings.aoColumnDefs.push({
            'bSortable': false,
            'aTargets': [-1]
        });
    }
    if (window[table_name]['config']["Visitor_row_v_e"] == true) {
        datatable_settings.aoColumnDefs.push({
            'bSortable': false,
            'aTargets': [-1]
        });
    }
    if (window[table_name]['config']["Visitor_row_rs"] == true) {
        datatable_settings.aoColumnDefs.push({
            'bSortable': false,
            'aTargets': [-1]
        });
    }
    if (window[table_name]['config']["Editor_row"] == true) {
        datatable_settings.aoColumnDefs.push({
            'bSortable': false,
            'aTargets': [-1]
        });
    }
    if (window[table_name]['config']["edit_rows"] == true) {
        datatable_settings.aoColumnDefs.push({
            'bSortable': false,
            'aTargets': [-1]
        });

        if (typeof window[table_name]['config']["fn_edit_row"] === 'function') {
            $(window[table_name]['data_table']).find("tbody").on("click", "tr .img-into-table", function () {
                var $row = $(this).parents("tr");
                var row_id = $row.attr("data-id");
                var row_data = {};
                var row_index = -1;

                if (row_id != "") {
                    var row_column_id = window[table_name]['config']["row_column_id"];
                    if (window[table_name]['config']["server_side"] == true) {
                        for (var i = 0; i < window[table_name]['cacheLastJson'].data.length; i++) {
                            if (row_id == window[table_name]['cacheLastJson'].data[i][row_column_id]) {
                                row_index = i;
                                row_data = cloneObject(window[table_name]['cacheLastJson'].data[i]);
                                break;
                            }
                        }
                    } else {
                        var aoData = window[table_name]['data_table_obj'].fnSettings().aoData;
                        for (var i = 0; i < aoData.length; i++) {
                            if (row_id == aoData[i]['_aData'][row_column_id]) {
                                row_index = i;
                                row_data = cloneObject(aoData[i]['_aData']);
                                break;
                            }
                        }
                    }
                }
                window[table_name]['config']["fn_edit_row"]($row, row_index, row_data);
            });
        }
    }
    if (window[table_name]['config']["server_side"] == true) {
        datatable_settings.processing = true;
        datatable_settings.serverSide = true;

        if (type == 1) {
            var ajax_settings = {
                url: window[table_name]['config']["url_get_data"],
                type: "POST",
                pages: cache_pages,
                table_name: table_name
            };
        }
        if (type == 2) {
            var ajax_settings = {
                url: window[table_name]['config']["url_get_data_filtro"],
                type: "POST",
                pages: cache_pages,
                table_name: table_name
            };
        }

        if (window[table_name]['config']["cache_data"] == true) {
            var cache_pages = 10;// default number of pages to cache
            if (!isNaN(window[table_name]['config']["cache_pages"])) {
                cache_pages = window[table_name]['config']["cache_pages"];
            }
            ajax_settings.pages = cache_pages;
            ajax_settings.table_name = table_name;

            if (typeof window[table_name]['config']["ajax_data"] == 'object') {
                ajax_settings.data = window[table_name]['config']["ajax_data"]
            }
            datatable_settings.ajax = $.fn.dataTable.pipeline(ajax_settings);
        } else {
            datatable_settings.ajax = ajax_settings;
        }
    } else if (window[table_name]['config']['ajax_data'] != null) {
        datatable_settings.ajax = window[table_name]['config']['ajax_data'];
    } else {
        datatable_settings.aaData = window[table_name]['config']["table_data"];
    }

    window[table_name]['data_table_obj'] = $data_table.dataTable(datatable_settings);

    //add Edit row function
    window[table_name]['data_table_obj'].editRow = function ($row, row_index, obj_new_data) {
        if (typeof $row != 'object' || typeof obj_new_data != 'object' || isNaN(row_index) || row_index == -1) {
            return;
        }
        var row_data = {};
        var table_columns = Object.keys(window[table_name]['config']['columns']);

        for (var i = 0; i < table_columns.length; i++) {
            row_data[table_columns[i]] = "";
            if (typeof obj_new_data[table_columns[i]] != 'undefined') {
                row_data[table_columns[i]] = obj_new_data[table_columns[i]];
            }
        }
        if (window[table_name]['config']['edit_rows'] == true) {
            row_data.img_edit = "";
        }
        window[table_name]['cacheLastJson'].data[row_index] = row_data;
        window[table_name]['data_table_obj'].DataTable().row($row).draw(false);
    }
}

function drawFilters(table_name) {
    //Form Filters
    var length_sel = window[table_name]['data_table_obj'].closest('.dataTables_wrapper').find('div[id$=_length] select');
    length_sel.addClass('form-control input-sm');

    //----Select Filters
    initSelectFilters(table_name);

    //----Input Filters
    constructTextFilters(table_name);
}

function drawDeleteRowsSettings(table_name) {
    var btn_delete, img;

    btn_delete = document.createElement("btn");
    btn_delete.setAttribute("type", "button");
    btn_delete.className = "btn btn-default btn-delete-rows";
    btn_delete.onclick = function () {
        if (typeof window[table_name]['config']['fn_delete_rows'] == 'function') {
            var DOM_elements;
            var array_elements = [];

            DOM_elements = window[table_name]['data_table_obj'].find(".ckbx-into-table:checked");

            for (var i = 0; i < DOM_elements.length; i++) {
                array_elements.push($(DOM_elements[i]).val());
            }
            window[table_name]['config']['fn_delete_rows'].apply(window[table_name]['data_table_obj'], [DOM_elements, array_elements]);
        }
    }

    img = document.createElement("img");
    img.src = img_trash;
    img.class = "img-into-table";
    btn_delete.appendChild(img);

    $("#" + table_name + "_wrapper").find(".dataTables_filter").prepend(btn_delete);
}

function initSelectFilters(table_name) {
    $(window[table_name]['data_table']).find("tfoot").find("th.selectFilter").each(function () {
        var i = parseInt($(this).attr("data-col"));
        if (!isNaN(i)) {
            if ($(this).find("select").length == 0) {
                this.innerHTML = createSelectFilter(window[table_name]['data_table_obj'].fnGetColumnData(i), $(this).attr("data-name"));
                $(this).find("select").attr("data-table", table_name);
            }

            if (window[table_name]['config']['server_side'] == true) {
                $(this).find("select").change(function () {
                    var $select = $(this);
                    search_request.filters[i] = $select.val();
                    search_request.token = generateRendomString(5);
                    (function (token) {
                        setTimeout(function () {
                            if (token != search_request.token) {
                                return;
                            }
                            triggerSearch(table_name);
                        }, search_request.timming);
                    })(search_request.token);
                });
            } else {
                $(this).find("select").change(function () {
                    var $select = $(this);
                    window[table_name]['data_table_obj'].fnFilter($select.val(), i);
                });
            }
        }
    });
}

function createSelectFilter(aData, name) {
    var r = '<select name="' + name + '" id="' + name + '"><option value="">All</option>', i, iLen = aData.length;
    for (i = 0; i < iLen; i++)
    {
        r += '<option value="' + aData[i] + '">' + aData[i] + '</option>';
    }
    r += '</select>';
    return r + '<input type="hidden"/>';
}

function constructTextFilters(table_name) {
    if (window[table_name]['config']['server_side'] == true) {
        $("#" + table_name + " tfoot th.inputTextFilter input").keyup(function (event) {
            var $input = $(this);
            var col = $input.parent("th").attr("data-col");

            search_request.filters[col] = $input.val();
            search_request.token = generateRendomString(5);
            (function (token) {
                setTimeout(function () {
                    if (token != search_request.token) {
                        return;
                    }
                    triggerSearch(table_name);
                }, search_request.timming);
            })(search_request.token);
        });
    } else {
        $("#" + table_name + " tfoot th.inputTextFilter input").keyup(function () {
            var $input = $(this);
            window[table_name]['data_table_obj'].fnFilter($input.val(), $input.parent("th").attr("data-col"));
        });
    }
}

function triggerSearch(table_name) {
    var cols = Object.keys(search_request.filters);
    for (var i = 0; i < cols.length; i++) {
        window[table_name]['data_table_obj'].fnFilter(search_request.filters[cols[i]], cols[i]);
        //Regular expresions
        //window[table_name]['data_table_obj'].fnFilter('^' + txt + '$', i, true, true);
    }
    search_request.filters = {};
    search_request.token = null;
    updateTableMetaData(table_name);
}

function drawInfoCache(table_name) {
    var d = document.createElement('div');
    d.setAttribute('id', 'info-time');
    var s = document.createElement('span');
    s.innerHTML = dynamic_table_texts['last_update'][window[table_name]['config']['lang']] + ' ' + window[table_name]['config']['last_update'];
    d.appendChild(s);
    $('#' + table_name + '_info').parent().after(d);
}

function drawExportSettings(table_name) {
    if (window[table_name]['config']["export_obj"] == null || typeof window[table_name]['config']["export_obj"] != 'object') {
        //if export_obj wasnt specified create btn
        var d = document.createElement('div');
        d.className = "btn-export col s2";
        d.id = "exp-" + table_name;

        var lb = document.createElement("label");
        lb.className = 'lb-export';
        lb.innerHTML = dynamic_table_texts['export'][window[table_name]['config']['lang']];
        d.setAttribute('title', 'Export Excel');
        d.appendChild(lb);

        var img = document.createElement("img");
        img.src = img_excel;
        img.className = "img-export";
        d.appendChild(img);

        window[table_name]['config']["export_obj"] = $(d);

        $('#' + table_name + '_length').parent().after(window[table_name]['config']["export_obj"]);
        $('#' + table_name + '_length').addClass("col s10");
    }

    $(window[table_name]['config']["export_obj"]).click(function () {
        exportXLS(table_name);
        return false;
    });


}

function exportXLS(table_name) {
    var inpt, i;
    var $form = $("#" + table_name + "-form-export");

    if (window[table_name]['config']['server_side'] == true) {
        inpt = document.createElement("input");
        inpt.setAttribute("type", "hidden");
        inpt.setAttribute("name", "post_data");
        inpt.value = JSON.stringify(window[table_name]['data_table_obj'].fnSettings().oAjaxData);

        $form.append(inpt);
        $form.submit();
        $(inpt).remove();
    } else {
        var data = JSON.parse(JSON.stringify(window[table_name]['data_table_obj']._fnGetDataMaster()));
        var columns = window[table_name]['data_table_obj'].fnSettings().aoColumns;

        var d = document.createElement("div");
        var hide_columns = [],
                json_data = '{';

        var total = data.length, total_values;
        for (i = 0; i < total; i++) {
            total_values = data[i].length;
            (i > 0) && (json_data += ",");
            json_data += '"' + i + '":';
            for (var j = 0; j < total_values; j++) {
                if (typeof data[i][j] == '[object Object]' || data[i][j].toString().indexOf("img-into-table") != -1 || data[i][j].toString().indexOf("ckbx-into-table") != -1) {
                    hide_columns.push(j);
                    data[i].remove(j);
                    total_values--;
                    continue;
                }
                data[i][j] = data[i][j].toString().replace(/"/g, '');
            }
            json_data += JSON.stringify(data[i]);
        }
        ;
        json_data += "}";

        inpt = document.createElement("input");
        inpt.setAttribute("type", "hidden");
        inpt.setAttribute("name", "data");
        inpt.value = json_data;
        d.appendChild(inpt);

        var c_column = 0;
        for (i = 0; columns.length > i; i++) {
            if (hide_columns.indexOf(i) != -1 || columns[i].data == "img_edit") {
                continue;
            }
            inpt = document.createElement("input");
            inpt.setAttribute("type", "hidden");
            inpt.setAttribute("name", "columns[" + (columns[i].data || c_column) + "]");
            c_column++;

            inpt.value = columns[i].sTitle || columns[i].sName;
            d.appendChild(inpt);
        }
        ;

        inpt = document.createElement("input");
        inpt.setAttribute("type", "hidden");
        inpt.setAttribute("name", "title_report");
        inpt.value = window[table_name]['config']['export_title'];
        d.appendChild(inpt);

        $form.append(d).submit();
        $(d).remove();
    }

}

function updateTableMetaData(table_name) {
    /*if( window[table_name]['data_table_obj'].arrayColumns == undefined || window[table_name]['data_table_obj'].arrayColumns.length == 0 ){
     window[table_name]['data_table_obj'].arrayColumns = [];
     var aoColumns = window[table_name]['data_table_obj'].fnSettings().aoColumns;
     for(var i = 0; aoColumns.length > i; i++ ){
     window[table_name]['data_table_obj'].arrayColumns[i] = aoColumns[i].sTitle;
     };
     }*/

    //Determina los resultados de la bÃºsqueda en el DT y lo guarda en un arreglo Global
    var aiDisplay = window[table_name]['data_table_obj'].fnSettings().aiDisplay;
    if (aiDisplay.length > 0) {
        var aoData = window[table_name]['data_table_obj'].fnSettings().aoData;

        window[table_name]['data_table_obj'].arraySearchResult = [];
        for (var i = 0; aiDisplay.length > i; i++) {
            window[table_name]['data_table_obj'].arraySearchResult[i] = aoData[ aiDisplay[i] ]._aData;
        }
        ;
    }
}

function loadTable(table_name) {
    $("#" + table_name + "-loader").show();
    $(window[table_name]['wrapper_generated']).hide();
}

function showTable(table_name) {
    $("#" + table_name + "-loader").hide();
    $(window[table_name]['wrapper_generated']).fadeIn();
}

function hideTable(table_name) {
    $("#" + table_name + "-loader").hide();
    $(window[table_name]['wrapper_generated']).hide();
}

function clearSearchDT(table) {
    var total = $(table).find('tfoot th').length;
    for (var i = 0; i < total; i++) {
        table.fnFilter("", i);
    }
    $(table).find('tfoot th.inputTextFilter input').val("");
    $(table).find('tfoot th.selectFilter select option').filter(function () {
        return $(this).text() == 'All';
    }).prop('selected', true);
}
//
// Pipelining function for DataTables. To be used to the `ajax` option of DataTables
//
$.fn.dataTable.pipeline = function (opts) {
    // Configuration options
    var conf = $.extend({
        pages: 5, // number of pages to cache
        url: '', // script url
        data: null, // function or object with parameters to send to the server
        // matching how `ajax.data` works in DataTables
        method: 'GET' // Ajax HTTP method
    }, opts);

    // Private variables for storing the cache
    var cacheLower = -1;
    var cacheUpper = null;
    var cacheLastRequest = null;
    var cacheLastJson = null;

    return function (request, drawCallback, settings) {
        var ajax = false;
        var requestStart = request.start;
        var drawStart = request.start;
        var requestLength = request.length;
        var requestEnd = requestStart + requestLength;

        if (settings.clearCache) {
            // API requested that the cache be cleared
            ajax = true;
            settings.clearCache = false;
        } else if (cacheLower < 0 || requestStart < cacheLower || requestEnd > cacheUpper) {
            // outside cached data - need to make a request
            ajax = true;
        } else if (JSON.stringify(request.order) !== JSON.stringify(cacheLastRequest.order) ||
                JSON.stringify(request.columns) !== JSON.stringify(cacheLastRequest.columns) ||
                JSON.stringify(request.search) !== JSON.stringify(cacheLastRequest.search)
                ) {
            // properties changed (ordering, columns, searching)
            ajax = true;
        }

        // Store the request for checking next time around
        cacheLastRequest = $.extend(true, {}, request);

        if (ajax) {
            // Need data from the server
            if (requestStart < cacheLower) {
                requestStart = requestStart - (requestLength * (conf.pages - 1));

                if (requestStart < 0) {
                    requestStart = 0;
                }
            }

            cacheLower = requestStart;
            cacheUpper = requestStart + (requestLength * conf.pages);

            request.start = requestStart;
            request.length = requestLength * conf.pages;

            /*   AGREGADO PARA CONSULTAS MSAPI   */

            if (typeof idEdicion !== 'undefined') {
                request.idEdition = idEdicion;
            }

            if (typeof idExpositor !== 'undefined') {
                request.idExhibitor = idExpositor;
            }

            if (typeof from !== 'undefined') {
                request.ini = from;
            }

            if (typeof to !== 'undefined') {
                request.end = to;
            }

            if (typeof exName !== 'undefined') {
                request.exName = exName;
            }

            if (typeof evName !== 'undefined') {
                request.evName = evName;
            }
            /* TERMINA AGREGADO */

            // Provide the same `data` options as DataTables.
            if ($.isFunction(conf.data)) {
                // As a function it is executed with the data object as an arg
                // for manipulation. If an object is returned, it is used as the
                // data object to submit
                var d = conf.data(request);
                if (d) {
                    $.extend(request, d);
                }
            } else if ($.isPlainObject(conf.data)) {
                // As an object, the data given extends the default
                $.extend(request, conf.data);
            }

            settings.jqXHR = $.ajax({
                "type": conf.type,
                "url": conf.url,
                "data": request,
                "dataType": "json",
                "cache": false,
                "success": function (json) {
                    if (!json.status) {
                        show_alert("warning", json.error);
//                        window[conf.table_name]['custom_filters_form'].find(".generate-table").trigger("click");
                        return;
                    }

                    cacheLastJson = $.extend(true, {}, json);
                    window[conf.table_name]['cacheLastJson'] = cacheLastJson;

                    if (cacheLower != drawStart) {
                        json.data.splice(0, drawStart - cacheLower);
                    }
                    json.data.splice(requestLength, json.data.length);

                    drawCallback(json);
                }
            });
        } else {
            var json = $.extend(true, {}, cacheLastJson);
            json.draw = request.draw; // Update the echo for each response
            json.data.splice(0, requestStart - cacheLower);
            json.data.splice(requestLength, json.data.length);

            drawCallback(json);
        }
    }
};

// Register an API method that will empty the pipelined data, forcing an Ajax
// fetch on the next draw (i.e. `table.clearPipeline().draw()`)
$.fn.dataTable.Api.register('clearPipeline()', function () {
    return this.iterator('table', function (settings) {
        settings.clearCache = true;
    });
});

function cloneObject(obj) {
    if (typeof obj != 'object') {
        return null;
    }
    return JSON.parse(JSON.stringify(obj));
}

function isset(data) {
    if (data !== undefined && data !== null && data !== 'null' && data !== "") {
        return true;
    } else {
        return false;
    }
}

function generateRendomString(l) {
    var c = "",
            str = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < l; i++)
        c += str.charAt(Math.floor(Math.random() * str.length));

    return c.toUpperCase();
}