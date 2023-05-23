var influxAws = require('../_func/influxAws.js');
var influxHtml = require('../_func/influxHtml.js');

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

const pagetitles = {
    'summary': "Summary",
    //'snapshot': "Snapshot",
    //'browser': "Browser",
    //'info': "Information",
    'config': "Configuration",
    //'external': "External links",
    'grafana-snapshot': "Snapshot dashboard",
    'grafana-data': "RXD dashboard",
}

function NavLink(logger, currpg, pg) {
    var html = "<a href='/logger/" + pg + "/" + logger + "' " + (pg == currpg ? 'class="selected"' : '') + ">" + pagetitles[pg] + "</a>";

    return html;
}

module.exports = {
    html: async function (req, path) {
        var folder = path[3];
        var pg = path[2];

        var html = "<div id='navigation'>\n";
        for (var page in pagetitles) 
            html += NavLink(folder, pg, page);
        
        html += "</div>\n";
        if (pg == 'grafana-snapshot') {
            html += "<div id='grafanacontainer'>\n";
            var sn = folder.slice(-7);
            html += "<iframe src='http://" + path[0] + ":3000/d/Nb_z27T4k/rxd-dash?orgId=1&var-rxddevice=" + sn + "' width='100%' height='100%' frameborder='0'></iframe>";
        }
        else if (pg == 'grafana-data') {
            html += "<div id='grafanacontainer'>\n";
            var sn = folder.slice(-7);
            html += "<iframe src='http://" + path[0] + ":3000/d/Nb_z27T4k/rxd-dash?orgId=1&var-rxddevice=" + sn + "&var-item1=Engine_temperature&var-item2=Intake_air_temperature&var-item3=Throttle_position_value&var-item4=Engine_speed&var-item5=Vehicle_speed&var-database=influxj1939&var-table=rxddata' width='100%' height='100%' frameborder='0'></iframe>";
        }
        else {
            html += "<div id='loggercontainer'>\n";

            if (pg == 'snapshot') {
                html += "<div id='loggersnapshot'>\n";
                if (data = await influxAws.getfile(folder + "/J1939Snapshot.json")) {
                    var jsonSnapshot = JSON.parse(data);
                    html += influxHtml.snapshotinfo(jsonSnapshot, "Snapshot");
                }
                html +=
                    "</div>\n" +
                    "<div class='clearboth'></div>\n";
            }
            else if (pg == 'info') {
                html +=
                    "<div id='loggerstatus'>\n" +
                    "<div id='caption'>Device information</div>\n";

                var jsonStatus = null;
                if (data = await influxAws.getfile(folder + "/Status.json"))
                    jsonStatus = JSON.parse(data);
                html += influxHtml.vehicleinfo(jsonStatus, statusFields);
                html += "</div>\n";
            }
            else if (pg == 'browser') {
                html += influxHtml.browsernav(path);

                for (var i = 4; i < path.length; i++)
                    folder += '/' + path[i];

                var json = await influxAws.objects(folder);
                html += influxHtml.browser(json, true, path.length > 4);
            }
            else if (pg == 'config') {

                var xmlExists = (await influxAws.objectexists(folder + "/Configuration.xml"));
                var rxcExists = (await influxAws.objectexists(folder + "/Configuration.rxc"));
                var dbcExists = (await influxAws.objectexists(folder + "/ExportDBC.dbc"));

                html += "<div id='caption'>Current configuration: ";
                conf = [];
                if (xmlExists)
                    conf.push("<a href='/download/" + folder + "/Configuration.xml'>XML</a>");
                if (rxcExists)
                    conf.push("<a href='/download/" + folder + "/Configuration.rxc'>RXC</a>");
                if (conf.length == 0)
                    html += "None";
                else
                    html += conf.join("  ");
                html += "<br />" + influxHtml.uploadform("xml");

                html += "</div>";

                html += "<div id='caption'>Signals library: " + (dbcExists ? "<a href='/download/" + folder + "/ExportDBC.dbc'>DBC</a>" : "None") + "</a>";
                html += "<br />" + influxHtml.uploadform("dbc");
                html += "</div>";
            }
            else if (pg == 'external') {
                var sn = folder.slice(-7);
                html += "<div id='caption'><a href='https://ppetkov.grafana.net/d/TeiLfxhVk/snapshot-dash?orgId=1&var-selected_device=" + sn + "' target='_blank'>Grafana snapshot dashboard</a></div>";
                html += "<div id='caption'><a href='https://ppetkov.grafana.net/d/Nb_z27T4k/rxd-dash?orgId=1&var-rxddevice=" + sn + "&src=hg_notification_free' target='_blank'>Grafana RXD dashboard</a></div>";
            }
            else if (pg == 'summary') {
                html +=
                    "<div id='loggerstatus'>\n" +
                    "<div id='caption'>Device information</div>\n";

                var jsonStatus = null;
                console.log(folder);
                if (data = await influxAws.getfile(folder + "/Status.json"))
                    jsonStatus = JSON.parse(data);
                html += influxHtml.vehicleinfo(jsonStatus, statusFields);
                html += "</div>\n" +
                    "<div id='loggersnapshotright'>\n";
                if (data = await influxAws.getfile(folder + "/J1939Snapshot.json")) {
                    var jsonSnapshot = JSON.parse(data);
                    html += influxHtml.snapshotinfo(jsonSnapshot, "Snapshot");
                }
                html +=
                    "</div>\n" +
                    "<div class='clearboth'></div>\n" +
                    "<br />\n";

                html += influxHtml.browsernav(path);

                for (var i = 4; i < path.length; i++)
                    folder += '/' + path[i];

                var json = await influxAws.objects(folder);
                html += influxHtml.browser(json, true, path.length > 4);

            }
        }
        html += "</div>\n";

        return html;
    }

}