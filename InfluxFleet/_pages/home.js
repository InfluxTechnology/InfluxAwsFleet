var influxHtml = require('../_func/influxHtml.js');
var influxAws = require('../_func/influxAws.js');

async function getStatusFiles(jsLoggers) {
    if (jsLoggers == null)
        return null;

    var statuses = [];
    for (jid = 0; jid < jsLoggers.length; jid++) {
        for (var index = 0; index < jsLoggers[jid][influxHtml.folderContainer].length; index++) {
            key = jsLoggers[jid][influxHtml.folderContainer][index][influxHtml.folderLinkKey];
            if (data = await influxAws.getfile(key + "Status.json"))
                statuses.push(JSON.parse(data));
        }
    }
    return statuses;
}

function millisecondsToStr(milliseconds) {
    // TIP: to find current time in milliseconds, use:
    // var  current_time_milliseconds = new Date().getTime();

    function numberEnding(number) {
        return (number > 1) ? 's' : '';
    }

    var temp = Math.floor(milliseconds / 1000);
    var years = Math.floor(temp / 31536000);
    if (years) {
        return years + ' year' + numberEnding(years);
    }
    //TODO: Months! Maybe weeks? 
    var days = Math.floor((temp %= 31536000) / 86400);
    if (days) {
        return days + ' day' + numberEnding(days);
    }
    var hours = Math.floor((temp %= 86400) / 3600);
    if (hours) {
        return hours + ' hour' + numberEnding(hours);
    }
    var minutes = Math.floor((temp %= 3600) / 60);
    if (minutes) {
        return minutes + ' minute' + numberEnding(minutes);
    }
    var seconds = temp % 60;
    if (seconds) {
        return seconds + ' second' + numberEnding(seconds);
    }
    return 'less than a second'; //'just now' //or other string you like;
}

module.exports = {
    html: async function (req, path, jsLoggers) {
        var html =
            "<div id='navigation'></div>\n" +
            "<div id='dashboardcontainer'>\n" +
            "<div id='caption'>Dashboard</div>\n";

        var stats = await getStatusFiles(jsLoggers);
        var totalvehicles = influxHtml.vehiclecount(jsLoggers);
        var activeMin = 0;
        var activeHour = 0;
        var activeDay = 0;
        var activeMonth = 0;
        var activeOthers = 0;
        var lastactive = null;
        var now = new Date();
        var totalspace = 0;
        var totalfreespace = 0;
        var spacearr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (var idx = 0; idx < stats.length; idx++) {
            if (now - stats[idx]['RTC_UNIX'] * 1000 < 60 * 1000)
                activeMin++;
            else if (now - stats[idx]['RTC_UNIX'] * 1000 < 60 * 60 * 1000)
                activeHour++;
            else if (now - stats[idx]['RTC_UNIX'] * 1000 < 24 * 60 * 60 * 1000)
                activeDay++;
            else if (now - stats[idx]['RTC_UNIX'] * 1000 < 30 * 24 * 60 * 60 * 1000)
                activeMonth++;
            if (lastactive == null)
                lastactive = stats[idx]['RTC_UNIX'];
            else if (stats[idx]['RTC_UNIX'] > lastactive)
                lastactive = stats[idx]['RTC_UNIX'];

            totalspace += stats[idx]['max_space_MB'];
            totalfreespace += stats[idx]['free_space_MB'];
            for (var si = 0; si < spacearr.length; si++)
                if ((1 - stats[idx]['free_space_MB'] / stats[idx]['max_space_MB']) <= 0.10 * (si + 1)) {
                    spacearr[si]++;
                    break;
                }
        }
        lastactive *= 1000;
        activeOthers = totalvehicles - activeMin - activeHour - activeDay - activeMonth;

        html +=
            "<div class='box boxfixed boxHfixed'><div class='caption'>Last activity by time</div><div class='chartH' id='chart1'>&nbsp</div></div>\n" +
            "<div class='box boxfixed'><div class='caption'>Total vehicles</div><div class='value'>" + totalvehicles + "</div></div>\n" +
            "<div class='box boxfixed'><div class='caption'>Active last minute</div><div class='value'>" + activeMin + "</div></div>\n" +
            //"<div class='box boxfixed'><div class='caption'>Active last hour</div><div class='value'>" + activeHour + "</div></div>\n" +
            //"<div class='box boxfixed'><div class='caption'>Active last 24 hours</div><div class='value'>" + activeDay + "</div></div>\n" +
            //"<div class='box boxfixed'><div class='caption'>Active last 30 days</div><div class='value'>" + activeMonth + "</div></div>\n" +
            "<div class='box boxfixed'><div class='caption'>Last activity</div><div class='value'>" + millisecondsToStr(Math.max(0, now - lastactive)) + "</div></div>\n" +
            "<div class='box boxfixed'><div class='caption'>Total space</div><div class='value'>" + totalspace.toLocaleString() + " MB</div></div>\n" +
            "<div class='box boxfixed'><div class='caption'>Free space</div><div class='value'>" + totalfreespace.toLocaleString() + " MB</div></div>\n" +
            "<div class='box boxfixed'><div class='caption'>Avg vehicle space usage</div><div class='value'>" + ((totalspace - totalfreespace) * 100 / totalspace).toFixed(2) + "%</div></div>\n" +
            "<div class='box boxfixed'><div class='caption'>Vehicles on low space <10%</div><div class='value'>" + spacearr[9] + "</div></div>\n" +
            //"<div class='box boxfixed'><div class='caption'>Storage used</div><div class='chart' id='chart2'>&nbsp</div></div>\n" +
            "<div class='box boxfixed'><div class='caption'>Storage used</div><div class='chart' id='chart3'>&nbsp</div></div>\n" +
            "<div class='clearboth'></div>\n";

        html += influxHtml.dashboardtable(stats);

        html += "<script type=\"text/javascript\" src=\"https://www.google.com/jsapi\"></script>\n";
        html += "<script type=\"text/javascript\">\n" +
            "google.load('visualization', '1', { packages: ['corechart', 'bar'] });\n" +
            "google.setOnLoadCallback(drawChart);\n" +
            "function drawChart() {\n" +
            "   var data1 = google.visualization.arrayToDataTable([\n" +
            "       ['Vehicles', 'Quantity'],\n" +
            "       ['Active last minute', " + activeMin + "],\n" +
            "       ['Active last hour', " + activeHour + "],\n" +
            "       ['Active last 24 hour', " + activeDay + "],\n" +
            "       ['Active last 30 days', " + activeMonth + "],\n" +
            "       ['Active before 30 days', " + activeOthers + "],\n" +
            "   ]);\n" +
            "   var options1 = {" +
            "       backgroundColor: '#FFFFFF', is3D: true, sliceVisibilityThreshold: 1 / 3600, legend: { position: 'none' }, chartArea: {left: 0, top: 0, width: \"100%\", height: \"100%\" }," +
            "       colors: ['#1E5631', '#A4DE02', '#76BA1B', '#4C9A2A', '#ACDF87']" +
            "   }; \n" +
            "   var chart1 = new google.visualization.PieChart(document.getElementById('chart1'));\n" +
            "   chart1.draw(data1, options1);\n" +
            /*"   var data2 = google.visualization.arrayToDataTable([\n" +
            "       ['Vehicles', 'Vehicles'],\n";

        for (var si = 0; si < spacearr.length; si++)
            html +=
                "       ['From " + (si * 10).toString() + "% to " + (si + 1).toString() + "0%', " + spacearr[si] + "],\n";

        html +=
            "   ]);\n" +
            "   var options2 = {backgroundColor: '#FFFFFF', is3D: true, sliceVisibilityThreshold: 1 / 3600, legend: {position: 'none'}, chartArea: {left: 0, top: 0, width: \"100%\", height: \"100%\" } };\n" +
            "   var chart2 = new google.visualization.PieChart(document.getElementById('chart2'));\n" +
            "   chart2.draw(data2, options2);\n" +*/

            "   var data3 = google.visualization.arrayToDataTable([\n" +
            "       ['Vehicles', 'Vehicles'],\n";
        for (var si = 0; si < spacearr.length; si++)
            html +=
                "       ['" + (si + 1).toString() + "0%', " + spacearr[si] + "],\n";
        //"       ['From " + (si * 10).toString() + "% to " + (si + 1).toString() + "0%', " + spacearr[si] + "],\n";
        html +=
            "   ]); " +
            "   var options3 = {" +
            "       backgroundColor: '#FFFFFF', is3D: true, bar: {groupWidth: 5}, vAxis: {gridlines: {color: 'transparent'}}, hAxis: {slantedText: true, slantedTextAngle: 90}," +
            "       chartArea: {left: 0, top: 0, width: \"100%\", height: \"75%\" }, colors: ['#A4DE02']" +
            "   };\n" +
            "   var chart3 = new google.visualization.ColumnChart(document.getElementById('chart3'));\n" +
            "   chart3.draw(data3, options3);\n" +

            "}\n" +
            "</script>\n";

        html += "</div>\n";

        return html;
    }
}
