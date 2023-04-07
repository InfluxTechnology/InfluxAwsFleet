var influxHtml = require('../_func/influxHtml.js');

module.exports = {
    html: async function (req, path, jsLoggers) {
        var html =
            "<div id='navigation'></div>\n" +
            "<div id='dashboardcontainer'>\n" +
            "<div id='caption'>Dashboard</div>\n";

        html +=
            "<div class='box'><div class='caption'>Total vehicles</div><div class='value'>" + influxHtml.vehiclecount(jsLoggers) + "</div></div>\n";

        html += "</div>\n";

        return html;
    }
}
