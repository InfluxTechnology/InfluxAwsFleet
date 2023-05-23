const folderContainer = 'CommonPrefixes';
const folderLinkKey = 'Prefix';
const fileContainer = 'Contents';
const fileLinkKey = 'Key';

function tblAddRow(idstr, fields, values) {
    var html = "<tr id='" + idstr + "'>";
    for (var el in fields)
        html += "<td>" + (values.hasOwnProperty(el) ? values[el] : '-') + "</td>";
    html += "</tr>\n";

    return html;
}

function BuildLink(key, img, downloadable = false) {
    if (key.substr(-1) === '/')
        key = key.substr(0, key.length - 1);
    var keyParts = key.split('/');
    var keytext = keyParts[keyParts.length - 1];

    var html = " <a href='/" + (downloadable == true ? "download" : "logger/summary") + "/" + key + "'>" + (img ? img + " " : "") + keytext + "</a>";

    if (downloadable == true) {
        html =
            " <a href='/convert/csv/" + key + "'><img src='/_img/file-csv.png' /></a>" +
            //" <a href='/convert/mat/" + key + "'><img src='/_img/file-mat.png' /></a>" +
            //" <a href='/convert/mf4/" + key + "'><img src='/_img/file-mf4.png' /></a> " +
            html;
    }

    return html;
}

function humanFileSize(bytes, si = true, dp = 1) {
    const thresh = si ? 1000 : 1024;

    if (Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }

    const units = si
        ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
        : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    let u = -1;
    const r = 10 ** dp;

    do {
        bytes /= thresh;
        ++u;
    } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);


    return bytes.toFixed(dp) + ' ' + units[u];
}

module.exports = {

	header: 
		'<html>\n' +
		'<head>\n' +
		'    <title>Fleet Management | Influx Technology LTD</title>\n' +
		'    <link href="/_css/default.css" rel="stylesheet" type="text/css" ></link>\n' +
		'    <script src="/_js/func.js" type="text/javascript"></script>\n' +
		'</head>\n' +
		'<body>\n',

	footer: 
		'</body>\n' +
		'</html>',

    folderContainer: folderContainer,
    folderLinkKey: folderLinkKey,
    fileContainer: fileContainer,
    fileLinkKey: fileLinkKey,

    uploadform: function (name, target = null) {
        target = (target == null) ? "" : "action='" + target + "'";
        var html =
            "<label for='upload_" + name + "'>Upload new " + name + "</label>" +
            "<form method='post' enctype='multipart/form-data' " + target + ">" +
            "<input id='upload_" + name + "' class='uploadlink' type='file' name='" + name + "' onchange='this.form.submit()' >" +
            "</form>";

        return html;
    },

    inputfield: function (label, name, value, focus = false) {
        focus = (focus) ? " autofocus" : "";
        return "<div id='row'><div id='" + name + "_l' class='labels'>" + label + ":</div><input id='" + name + "_f' class='fields' type='text' name='" + name + "' value='" + value + "'" + focus + "></div><div class='clearboth'></div>\n";
    },

    inputpasswordfield: function (label, name, value, focus = false) {
        focus = (focus) ? " autofocus" : "";
        return "<div id='row'><div id='" + name + "_l' class='labels'>" + label + ":</div><input id='" + name + "_f' class='fields' type='password' name='" + name + "' value='" + value + "'" + focus + "></div><div class='clearboth'></div>\n";
    },

    navigation: function (jsLoggers, selected, showlogout) {
        var html =
            '    <div id="leftnav">\n';

        if (jsLoggers != null) {
            html +=
                '        <div class="home"><a href="/home">Dashboard</a></div>\n' +
                '        <div id="loggerlist">\n' +
                '        <div class="caption">Vehicles</div>\n' +
                '<ul>\n';
            for (jid = 0; jid < jsLoggers.length; jid++)
                for (var index = 0; index < jsLoggers[jid][folderContainer].length; index++) {
                    key = jsLoggers[jid][folderContainer][index][folderLinkKey];
                    html += '<li ' + ((key == selected + '/') ? ' class="selected"' : '') + '>' + BuildLink(key, "<img src='/_img/vehicle-car.png' />") + '</li>\n';
                }

            html += '</ul>\n';
            html += '        </div >\n';
        }
        if (showlogout)
            html += '        <div class="logout"><a href="/logout">Logout</a></div>';
        html += '    </div>\n';

        return html;
    },

    vehiclecount: function (jsLoggers) {
        var vehcount = 0;
        if (jsLoggers != null)
            for (jid = 0; jid < jsLoggers.length; jid++)
                vehcount += jsLoggers[jid][folderContainer].length;

        return vehcount;
    },

    browsernav: function (path) {
        var html = "<div id='caption'>Fleet > ";
        var uri = "/logger/browser";
        for (var i = 3; i < path.length; i++) {
            uri += "/" + path[i];
            html += (i > 3 ? " / " : "") + "<a href='" + uri + "'>" + path[i] + "</a>";
        }

        html += "</div>\n";
        return html;
    },

    vehicleinfo: function (jObj, fields) {
        var html = "<table class='DataTable loggerstatus'>\n";
        if (jObj)
            for (var key in fields) {
                if (jObj[key]) {
                    value = jObj[key];
                    if (key == 'RTC_UNIX')
                        value = (new Date(value * 1000)).toUTCString();
                    else if (key == 'max_space_MB' || key == 'free_space_MB')
                        value = humanFileSize(jObj[key] * 1024 * 1024);
                    html += "<tr id='row1'><td>" + fields[key] + "</td><td>" + value + "</td></tr>\n";
                }
            }
        html += "</table>\n";
        return html;
    },

    snapshotinfo: function (jObj, caption) {
        var rtcValue = null;
        var html = "";

        for (var key in jObj) {
            if (key == 'RTC_UNIX')
                rtcValue = (new Date(jObj[key] * 1000)).toUTCString();
            else
                html += "<div class='box'><div class='caption'>" + key + "</div><div class='value'>" + jObj[key] + "</div></div>\n";
        }
        if (rtcValue)
            rtcValue = " - " + rtcValue;

        if (caption)
            html =
                "<div id='caption'>" + caption + rtcValue + "</div>\n" +
                html;

        return html;
    },

    browser: function (jObjects, folders, files) {
        const p = require('path');
        const tblFields = { 'link': 'Name', 'time': 'Date', 'type': 'Type', 'size': 'Size' };

        var html =
            "<table class='DataTable'>\n" +
            tblAddRow('top', tblFields, tblFields);

        function jItemsToHtml(jObjects, jContainer, outFunc) {
            for (rid = 0; rid < jObjects.length; rid++) {
                var resp = jObjects[rid];
                if (resp[jContainer]) {
                    var container = resp[jContainer];
                    for (i = 0; i < container.length; i++)
                        outFunc(container[i]);
                }
            }
        }

        var index = 0;
        if (folders == true) {
            jItemsToHtml(jObjects, folderContainer, function (datarow) {
                rowid = index % 2 == 0 ? 'row1' : 'row2';
                html += tblAddRow(rowid, tblFields, {
                    'link': BuildLink(datarow[folderLinkKey], "<img src='/_img/folder.png' />"),
                    'type': 'Folder'
                });
                index++;
            });
        }
        if (files == true) {
            jItemsToHtml(jObjects, fileContainer, function (datarow) {
                if (p.extname(datarow[fileLinkKey]) != '.rxd')
                    return;
                rowid = index % 2 == 0 ? 'row1' : 'row2';
                html += tblAddRow(rowid, tblFields, {
                    'link': BuildLink(datarow[fileLinkKey], "<img src='/_img/file.png' />", true),
                    'time': new Date(datarow['LastModified']).toUTCString(),
                    'type': 'Folder',
                    'size': humanFileSize(datarow['Size'])
                });
                index++;
            });
        }

        html += "</table>\n";
        return html;
    },

    dashboardtable: function (jStats) {
        const statusFields = {
            "serial_number": "Serial number",
            "fw_ver": "Firmware version",
            "micro_type": "LPC type",
            "config_name": "Configuration",
            "config_GUID": "Configuration GUID",
            "max_space_MB": "Max space",
            "free_space_MB": "Free space",
            "RTC_UNIX": "Device RTC"
        }

        var html =
            "<br\><table class='DataTable'>\n" +
            tblAddRow('top', statusFields, statusFields);

        for (var i = 0; i < jStats.length; i++) {
            rowid = i % 2 == 0 ? 'row1' : 'row2';
            html += "<tr id='row1'>";
            for (var key in statusFields) {
                if (jStats[i][key]) {
                    value = jStats[i][key];
                    if (key == 'RTC_UNIX')
                        value = (new Date(value * 1000)).toUTCString();
                    else if (key == 'max_space_MB' || key == 'free_space_MB')
                        value = humanFileSize(jStats[i][key] * 1024 * 1024);
                    html += "<td>" + value + "</td>";
                }
            }
            html += "</tr>\n";
        }

        html += "</table>\n";
        return html;

    },

}