var influxHtml = require('../_func/influxHtml.js');

module.exports = {
    html: async function () {
        var html =
            "<div id='navigation'></div>\n" +
            "<div id='dashboardcontainer'>\n" +
            "<form id='form600px' method='POST' action='/loginfields'>" +
            influxHtml.inputpasswordfield("Access key", "AwsAccessKey", '', true) +
            influxHtml.inputpasswordfield("Secret key", "AwsSecretKey", '', true) +
            influxHtml.inputfield("Region", "AwsRegion", '', true) +
            influxHtml.inputfield("Bucket", "AwsBucket", '', true) +
            "<div id='row'>" +
            "<input class='submit' type='submit' name='addbtn' value='     Login     '>" +
            "<input class='submit' type='button' name='addbtn' value='  Select file  ' onclick='document.getElementById(\"btnfile\").click()' >" +
            "</div><div class='clearboth'></div>\n" +
            "</form>\n" +
            "<form method='post' enctype='multipart/form-data' action='/loginfile'>" +
            "<input id='btnfile' type='file' name='credentials' onchange='this.form.submit()' hidden>" +
            "</form>" +
            "</div>\n";

        return html;
    }
}