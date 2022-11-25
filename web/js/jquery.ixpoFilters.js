/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
jQuery.extend(jQuery.validator.messages, {
    required: general_text.sas_campoRequerido,
    email: general_text.sas_emailInvalido,
    number: general_text.sas_soloNumeros,
    digits: general_text.sas_soloDigitos
});

var ixpoTable = null, configQuery = {limit: 100, offset: 0}, slideBand = false, activeFilters = {}, nextBand = false, countRecords = 0, firsLoad = true;

(function ($) {

    $.fn.extend({
        IxpoFilters: function (options) {
            options = $.extend({}, $.IxpoFilters.defaults, options);

            this.each(function () {
                new $.IxpoFilters(this, options);
            });
            return this;
        }
    });

    $.IxpoFilters = function (ele, options) {
        if (options.headers == null) {
            return alert("Error! header option is required");
        }
        if (options.data == null) {
            return alert("Error! data option is required");
        }
        if (options.configVariable == null) {
            return alert("Error! configVariable option is required");
        }
        if (options.filterVariable == null) {
            return alert("Error! filterVariable option is required");
        }
        if (options.idRecord == null) {
            return alert("Error! idRecord option is required");
        }
        if (options.urlFilters == null) {
            return alert("Error! urlFilters option is required");
        }
        if (options.totalRecords == null) {
            return alert("Error! totalRecords option is required");
        }

        configQuery = $.extend({}, configQuery, options.config);
        activeFilters = $.extend({}, activeFilters, options.filtersApplied);
        countRecords = parseInt(options.totalRecords);
        dataTablesIxpo(ele, options.headers, options.data, options.idRecord, options.recordsPerPage, options.urlFilters, options.configVariable);
        creteFilterHeadIxpo(ele, options.filtersTitle);
        createFilterChipsIxpo(options.headers);
        validateFiltersIxpo(ele, options.headers, options.idRecord, options.recordsPerPage, options.filterVariable, options.urlFilters, options.configVariable);
        filterTriggers(ele, options.headers, options.idRecord, options.recordsPerPage, options.urlFilters, options.configVariable);

    };

    $.IxpoFilters.defaults = {
        headers: null, // REQUIRED data headers of table
        data: null, // REQUIRED data for table
        idRecord: null, // REQUIRED id of record to identify used for update, delete or add
        configVariable: null, // REQUIRED name of variable to save conf in php
        filterVariable: null, // REQUIRED name of variable to save filters applied in php
        urlFilters: null, // REQUIRED name of variable to save filters applied in php
        totalRecords: null, // REQUIRED name of variable to save filters applied in php
        filtersApplied: null, // OPTIONAL filters applied in a post data
        filtersTitle: "Filtros", // OPTIONAL title of filters
        config: configQuery, // OPTIONAL query config to show
        recordsPerPage: [10, 25, 50, 100], // OPTIONAL list of options values for show records per page
        add: function (dataRecord) {

        },
        delete: function (id) {}
    };

})(jQuery);

function dataTablesIxpo(ele, headers, data, idRecord, recordsPerPage, urlFilters, configVariable) {

    var orderTable = (configQuery["field_table"] != undefined) ? [[parseInt(configQuery["field_table"]), configQuery["order"].toLowerCase()]] : [[0, "asc"]];
    var pageLength = (configQuery['page_records'] != undefined) ? parseInt(configQuery['page_records']) : recordsPerPage[0];
    var startRecord = (configQuery['start_record'] != undefined) ? parseInt(configQuery['start_record']) : 0;

    if (ixpoTable != null) {
        $(ele).dataTable().fnClearTable();
        $(ele).dataTable().fnDestroy();
        ixpoTable = null;
    }

    ixpoHeader(ele, headers);
    ixpoBody(ele, headers, data, idRecord);

    ixpoTable = $(ele)
            .on('page.dt', function () {
                nextBand = false;
            })
            .DataTable({
                "language": {
                    "url": dataTablesLang
                },
                "destroy": true,
                "order": orderTable,
                "iDisplayLength": pageLength,
                "displayStart": startRecord,
                "lengthMenu": recordsPerPage,
                "fnInfoCallback": function (oSettings, iStart, iEnd, iMax, iTotal, sPre) {
                    var msj = oSettings.oLanguage.sInfo;
                    var msj = msj.replace("_START_", (iStart + parseInt(configQuery['offset'])));
                    var msj = msj.replace("_END_", (iEnd + parseInt(configQuery['offset'])));
                    var msj = msj.replace("_TOTAL_", countRecords);
                    return msj;
                },
                "fnDrawCallback": function (oSettings) {
                    var pageInfo = ixpoTable.page.info();
                    configQuery = $.extend({}, configQuery, {start_record: pageInfo['start'], page_records: pageInfo['length'], get_data: 0});
                    setConfigTable(urlFilters, configVariable);
                }
            });

    $(ele).find('.tooltipped').tooltip();

}

function ixpoHeader(ele, headers) {
    var tr = "", td = "";

    if ($(ele).find("thead").length > 0) {
        $(ele).find("thead").empty();
    } else {
        var thead = document.createElement('thead');
        thead.className = "grey lighten-2";
        $(ele).append(thead);
    }

    tr = $('<tr/>');
    $.each(headers, function (field, item) {
        if (item["is_visible"]) {
            var order = (item["order"] !== undefined) ? item["order"].toString() : "true";
            td = $('<th/>', {
                "html": item["text"],
                "class": (item["class"] != undefined) ? item["class"] : "",
                "data-name-field": field,
                "data-orderable": order
            });
            $(tr).append(td);
        }
    });
    $(ele).find("thead").append(tr);
}

function ixpoBody(ele, headers, data, idRecord) {
    var tr = "", td = "", item = "", header = "", html = "";

    if ($(ele).find("tbody").length > 0) {
        $(ele).find("tbody").empty();
    } else {
        var tbody = document.createElement('tbody');
        $(ele).append(tbody);
    }

    if (data != undefined && data.length > 0) {
        var keys = Object.keys(data);
        var total = keys.length;

        var keys_item = Object.keys(data[keys[0]]);
        var keys_item_total = keys_item.length;

        for (var i = 0; i < total; i++) {

            item = data[keys[i]];
            tr = $("<tr/>", {
                'id': item[idRecord]
            });

            for (var j = 0; j < keys_item_total; j++) {
                header = headers[keys_item[j]];
                if (header["is_visible"]) {
                    var dataOptions = "";
                    var isHTML = /(<([^>]+)>)/i.test(item[keys_item[j]]);
                    switch (header['data-type']) {
                        case "select":
                            if (isHTML) {
                                html = item[keys_item[j]];
                                var div = document.createElement("div");
                                div.innerHTML = html;
                                if ($(div).find(":first-child").prop("tagName") == "SELECT") {
                                    dataOptions = $(div).find(":first-child").find('option[selected="selected"]').text();
                                } else {
                                    dataOptions = html.replace(/(<([^>]+)>)/ig, "");
                                }
                            } else {
                                if (header['data'][item[keys_item[j]]] == null) {
                                    html = general_text['sas_sinDefinir']
                                } else {
                                    html = header['data'][item[keys_item[j]]];
                                }
                                dataOptions = html;
                            }
                            break;
                        default:
                            if (isHTML) {
                                html = item[keys_item[j]];
                                dataOptions = html.replace(/(<([^>]+)>)/ig, "");
                            } else {
                                html = item[keys_item[j]];
                                dataOptions = html;
                            }
                            break;
                    }
                    td = $("<td/>", {
                        'id': keys_item[j],
                        'data-search': dataOptions,
                        'data-order': dataOptions,
                        'html': html
                    });

                    $(tr).append(td);
                }
            }
            $(ele).find("tbody").append(tr);
        }
    }
}

function changeTableConfig(ele, headers, idRecord, recordsPerPage, urlFilters, configVariable) {
    show_loader_top();
    showIxpoTableLoader(ele);
    $.ajax({
        type: "post",
        url: urlFilters,
        dataType: 'json',
        data: {variable: configVariable, config: configQuery},
        success: function (response) {
            hide_loader_top();
            hideIxpoTableLoader(ele);
            if (!response['status']) {
                show_alert("danger", general_text.sas_errorInterno);
                return;
            }
            firsLoad = false;
            dataTablesIxpo(ele, headers, response.data, idRecord, recordsPerPage, urlFilters, configVariable);
        },
        error: function (response) {
            hide_loader_top();
            hideIxpoTableLoader(ele);
            show_modal_error(general_text.sas_errorInterno + "<br>" + response.responseText);
        }
    });
}

function creteFilterHeadIxpo(ele, filtersTitle) {
    var divContainer = null, div = null, label = null, i = null, form = null, button = null;
    div = document.createElement('div');
    div.id = "search-icon";
    i = document.createElement('i');
    i.id = "icon-search";
    i.className = "material-icons";
    i.textContent = "search";
    div.appendChild(i);
    label = document.createElement("label");
    label.id = "filter-title";
    label.textContent = filtersTitle;
    div.appendChild(label);
    $(div).insertBefore(ele);
    $(div).fadeIn();
    div = document.createElement("div");
    div.id = "active-filters";
    $(div).insertBefore(ele);
    $(div).fadeIn();
    divContainer = document.createElement("div");
    divContainer.id = "filter-combo";
    divContainer.className = "container-fluid";
    div = document.createElement('div');
    div.className = "row";
    form = document.createElement('form');
    form.id = "filters-form";
    form.className = "col s12";
    div.appendChild(form);
    divContainer.appendChild(div);
    div = document.createElement('div');
    button = document.createElement('button');
    button.type = "button";
    button.id = "cancelFilters";
    button.className = "btn-flat waves-effect waves-gray red-text left";
    button.textContent = general_text.sas_cerrar;
    div.appendChild(button);
    button = document.createElement('button');
    button.type = "button";
    button.id = "applyFilters";
    button.className = "btn waves-effect waves-light green white-text right";
    button.textContent = general_text.sas_aplicarFiltros;
    div.appendChild(button);
    button = document.createElement('button');
    button.type = "button";
    button.id = "clearFilters";
    button.className = "btn waves-effect waves-grey grey white-text right";
    button.textContent = general_text.sas_borrarFiltros;
    div.appendChild(button);
    divContainer.appendChild(div);
    $(divContainer).insertBefore(ele);
}

function createFilterChipsIxpo(headers) {
    $("#active-filters").html("");
    var chip = "";
    $.each(headers, function (field, item) {
        if (item['is_filter']) {
            var keys = Object.keys(activeFilters);
            var total = keys.length;
            for (var i = 0; i < total; i++) {
                if (activeFilters[keys[i]] != "" && activeFilters[keys[i]] != null && activeFilters[keys[i]] != "-1") {
                    if (keys[i] == field) {
                        chip = $('<div/>', {'class': 'active-filter'});
                        switch (item['data-type']) {
                            case "select":
                                $(chip).html('<strong>' + item['text'] + '</strong>: ' + item.data[activeFilters[keys[i]]]);
                                break;
                            case "date":
                                var dateChip = '<strong>' + item['text'] + '</strong>: ';
                                $.each(item['data'], function (fieldName, fieldText) {
                                    dateChip += fieldText + '= ' + activeFilters[keys[i]][fieldName];
                                })
                                $(chip).html(dateChip);
                                break;
                            default:
                                $(chip).html('<strong>' + item['text'] + '</strong>: ' + activeFilters[keys[i]]);
                                break;
                        }

                    }
                    $("#active-filters").append(chip);
                }
            }
        }
    });
    if ($("#active-filters div").length == 0) {
        chip = $('<div/>', {
            'class': 'active-filter',
            'html': "<strong>" + general_text["sas_mostrandoTodosRegistros"] + "</strong>"
        });
        $("#active-filters").append(chip);
    }
    $('.chips').material_chip();
}

function validateFiltersIxpo(ele, headers, idRecord, recordsPerPage, filterVariable, urlFilters, configVariable) {
    $("#filters-form").validate({
        errorElement: "div",
        errorClass: "invalid",
        errorPlacement: function (error, element) {
            if ($(element).parent('div').find('i.material-icons').length > 0) {
                $(error).attr('icon', true);
            }
            var placement = $(element).data('error');
            if (placement) {
                $(placement).append(error);
            } else {
                error.insertAfter(element);
            }
        },
        submitHandler: function (form) {
            $("#filter-combo").toggle("slow");
            var data = $(form).serializeArray();
            applyFilters(ele, headers, idRecord, recordsPerPage, filterVariable, data, urlFilters, configVariable);
            return;
        }
    });
}

function applyFilters(ele, headers, idRecord, recordsPerPage, filterVariable, data, urlFilters, configVariable) {
    show_loader_top();
    showIxpoTableLoader(ele);
    var post = objectifyData(data);
    $.ajax({
        type: "post",
        url: urlFilters,
        dataType: 'json',
        data: {variable: filterVariable, filters: post},
        success: function (response) {
            hide_loader_top();
            hideIxpoTableLoader(ele);
            if (!response['status']) {
                show_alert("danger", general_text.sas_errorInterno);
                return;
            }
            firsLoad = false;
            activeFilters = (Object.keys(post).length > 0) ? $.extend({}, activeFilters, post) : {};
            configQuery = $.extend({}, configQuery, {start_record: 0, offset: 0});
            if (response.count != undefined) {
                countRecords = response.count;
            }
            dataTablesIxpo(ele, headers, response.data, idRecord, recordsPerPage, urlFilters, configVariable);
            createFilterChipsIxpo(headers);
        },
        error: function (response) {
            hide_loader_top();
            hideIxpoTableLoader(ele);
            show_modal_error(general_text.sas_errorInterno + "<br>" + response.responseText);
        }
    });
}

function setConfigTable(urlFilters, configVariable) {
    $.ajax({
        type: "post",
        url: urlFilters,
        dataType: 'json',
        data: {variable: configVariable, config: configQuery},
        success: function (response) {
        },
        error: function (response) {
            show_modal_error(general_text.sas_errorInterno + "<br>" + response.responseText);
        }
    });
}

function filterTriggers(ele, headers, idRecord, recordsPerPage, urlFilters, configVariable) {
    $(document).on("click", "#search-icon", function () {
        createFiltersIxpo(this, headers);
        $('.datepicker').pickadate({
            selectMonths: true,
            selectYears: 9,
            format: 'yyyy-mm-dd'
        });
        setFiltersFieldsIxpo(headers);
    });
    $(document).on("click", "#clearFilters", function () {
        clearFiltersIxpo();
    });
    $(document).on("click", "#applyFilters", function () {
        $("#search-icon").css("background", "");
        slideBand = false;
        $("#filters-form").submit();
    });
    $(document).on("click", "#cancelFilters", function () {
        $("#search-icon").css("background", "");
        $("#filter-combo").slideUp();
        slideBand = false;
    });
    $(document).on("keypress", "#filters-form input", function (event) {
        if (event.which == 13 && !event.shiftKey) {
            event.preventDefault();
            $('#applyFilters').focus().click();
        }
    });
    $(ele).on('click', 'thead th', function () {
        if ($(this).attr('data-orderable') == "false") {
            show_toast('warning', general_text['sas_noOrdenar']);
            return;
        }
        var table = $(ele).dataTable();
        var order = table.api().order();
        var objCols = table.fnSettings().aoColumns;
        configQuery = $.extend({}, configQuery, {order_fields: '"' + objCols[order[0][0]]["nameField"] + '"', order: order[0][1].toUpperCase(), field_table: order[0][0], get_data: 1});
        changeTableConfig(ele, headers, idRecord, recordsPerPage, urlFilters, configVariable);
    });
    $(document).on("click", ".chev .chevron-pagination:nth-child(1)", function () {
        var pageInfo = ixpoTable.page.info();
        var limit = parseInt(configQuery['limit']);
        var actOffset = parseInt(configQuery['offset']);
        if ((parseInt(pageInfo['start']) == 0 && actOffset > 0 && nextBand) || (firsLoad && (pageInfo['start']) == 0 && actOffset)) {
            var offset = actOffset - limit;
            configQuery = $.extend({}, configQuery, {offset: offset, limit: limit, start_record: (limit - parseInt(pageInfo['length'])), get_data: 1});
            changeTableConfig(ele, headers, idRecord, recordsPerPage, urlFilters, configVariable);
        } else {
            nextBand = true;
            firsLoad = false;
        }
    });
    $(document).on("click", ".chev .chevron-pagination:nth-child(2)", function () {
        var pageInfo = ixpoTable.page.info();
        var limit = parseInt(configQuery['limit']);
        var actOffset = parseInt(configQuery['offset']);
        if ((parseInt(pageInfo['end']) == limit && nextBand) || (firsLoad && (parseInt(pageInfo['end']) == limit))) {
            var offset = actOffset + limit;
            configQuery = $.extend({}, configQuery, {offset: offset, limit: limit, start_record: 0, get_data: 1});
            changeTableConfig(ele, headers, idRecord, recordsPerPage, urlFilters, configVariable);
        } else {
            nextBand = true;
            firsLoad = false;
        }
    });
}

function createFiltersIxpo(e, headers) {
    $('#filters-form').html("");
    var div = "", lb = "", column1 = "", column2 = "", column3 = "", item = "", data = "";

    var keys = Object.keys(headers);
    var total = keys.length;

    column1 = $('<div/>', {'class': 'col s4'});
    column2 = $('<div/>', {'class': 'col s4'});
    column3 = $('<div/>', {'class': 'col s4'});

    var count = 1;
    for (var i = 0; i < total; i++) {
        item = headers[keys[i]];
        if (item['is_filter']) {
            div = $('<div/>', {'class': 'input-field col s12'});
            var cls = (item['class'] != undefined) ? item['class'] : "";
            switch (item['data-type']) {
                case 'text':
                    var input = $('<input/>', {
                        'id': keys[i],
                        'name': keys[i],
                        'class': 'validate ' + cls,
                        'type': 'text'
                    });
                    lb = $('<label/>', {
                        'for': keys[i],
                        'html': item['text']
                    });

                    $(div).append(input);
                    $(div).append(lb);
                    break;
                case 'numeric':
                    var input = $('<input/>', {
                        'id': keys[i],
                        'name': keys[i],
                        'class': 'validate ' + cls,
                        'type': 'text'
                    });
                    lb = $('<label/>', {
                        'for': keys[i],
                        'html': item['text']
                    });

                    $(div).append(input);
                    $(div).append(lb);
                    break;
                case 'select':
                    var keys_item = Object.keys(item['data']);
                    var total_item = keys_item.length;
                    lb = $('<label/>', {
                        'for': keys[i],
                        'class': "active space-label",
                        'html': item['text']
                    });
                    var select = $('<select/>', {
                        'id': keys[i],
                        'name': keys[i],
                        'class': 'browser-default validate ' + cls
                    });

                    for (var j = 0; j < total_item; j++) {
                        data = item['data'][keys_item[j]];
                        var selected = false;
                        if (keys_item[j] == "-1") {
                            selected = true;
                        }
                        var option = $('<option/>', {
                            'value': keys_item[j],
                            'html': data,
                            'selected': selected
                        });
                        $(select).append(option);
                    }
                    $(div).append(lb);
                    $(div).append(select);
                    break;
                case 'date':
                    var keys_item = Object.keys(item['data']);
                    var total_item = keys_item.length;

                    for (var j = 0; j < total_item; j++) {
                        data = item['data'][keys_item[j]];
                        var div_in = $("<div/>", {'class': 'input-field col s6 date-div'});
                        var input = $('<input/>', {
                            'id': keys_item[j],
                            'name': keys_item[j],
                            'class': 'datepicker ' + cls,
                            'type': 'date'
                        });
                        lb = $('<label/>', {
                            'for': keys_item[j],
                            'html': data
                        });

                        $(div_in).append(lb);
                        $(div_in).append(input);
                        $(div).append(div_in);
                    }
                    break;
                default:
                    var input = $('<input/>', {
                        'id': keys[i],
                        'name': keys[i],
                        'class': 'validate ' + cls,
                        'type': 'text'
                    });
                    lb = $('<label/>', {
                        'for': keys[i],
                        'html': item['text']
                    });

                    $(div).append(input);
                    $(div).append(lb);
                    break;
            }

            if (count == 1) {
                $(column1).append(div);
                count++;
            } else if (count == 2) {
                $(column2).append(div);
                count++;
            } else {
                $(column3).append(div);
                count = 1;
            }
        }
    }
    $('#filters-form').append(column1);
    $('#filters-form').append(column2);
    $('#filters-form').append(column3);

    var width = $('#search-icon').width();
    var height = $('#search-icon').height();
    var pos = $(e).position();
    var top = pos.top + height + 5;
    var left = pos.left;

    $("#filter-combo").css("top", top);
    $("#filter-combo").css("left", left);
    $("#filter-combo").css("width", width);
    if (slideBand) {
        $("#search-icon").css("background", "");
        $("#filter-combo").slideUp();
        slideBand = false;
    } else {
        $("#search-icon").css("background", "lightgrey");
        $("#filter-combo").slideDown();
        slideBand = true;
    }
}

function setFiltersFieldsIxpo(headers) {
    if (activeFilters == "")
        return;

    var keys = Object.keys(activeFilters);
    var total = keys.length;
    $.each(headers, function (field, item) {
        for (var i = 0; i < total; i++) {
            if (keys[i] == field) {
                switch (item["data-type"]) {
                    case "select":
                        $('#' + field + ' option[value=' + "'" + activeFilters[field] + "']").prop("selected", true);
                        break;
                    case "date":
                        $.each.function(item['data'], function (fieldName, text) {
                            $("#" + fieldName).pickadate('picker').set('select', activeFilters[field][fieldName]);
                        });
                        break;
                    default:
                        $('input#' + keys[i]).val(activeFilters[keys[i]]);
                        if (activeFilters[keys[i]] != "")
                            $('input#' + keys[i]).removeClass('valid').next().addClass('active');
                        break;
                }
            }
        }
    });
}

function clearFiltersIxpo() {
    $("#filters-form input[type='text'], textarea").val("").removeClass('active').next().addClass('valid');
    $("#filters-form .datepicker").pickadate({clear: 'Clear'}).removeClass('active').next().addClass('valid');
    $("#filters-form select option[value='-1']").prop("selected", true);
}

function objectifyData(data) {
    var result = {};
    for (var i = 0; i < data.length; i++) {
        if (data[i]['value'] != null && data[i]['value'] != "" && data[i]['value'] != "-1") {
            result[data[i]['name']] = data[i]['value'];
        }
    }
    return result;
}

function showIxpoTableLoader(ele) {
    var div = null, loader = null, span = null, word = "", letters = [], tablePosition = $(ele).position();
    div = document.createElement("div");
    div.className = "cover-ixpotable";
    div.style.top = tablePosition.top + "px";
    div.style.left = tablePosition.left + "px";
    div.style.height = $(ele).height() + "px";
    div.style.width = $(ele).width() + "px";
    loader = document.createElement("div");
    loader.className = "loader-ixpo";
    word = (general_text['sas_procesando'] != undefined) ? general_text['sas_procesando'] : "Procesando";
    letters = word.match(/\S/g);
    for (var i = 0; i < letters.length; i++) {
        span = document.createElement('span');
        span.textContent = letters[i];
        loader.appendChild(span);
    }
    div.appendChild(loader);
    ele.appendChild(div);
    $(ele).find(".cover-ixpotable").fadeIn(500);
}

function hideIxpoTableLoader(ele) {
    $(ele).find("cover-ixpotable").fadeOut(1000);
    setTimeout(function () {
        $(ele).find(".cover-ixpotable").remove();
    }, 1200);
}
