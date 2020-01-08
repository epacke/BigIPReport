/*************************************************************************************************************************************************************************************

    BigIP-report Javascript

*************************************************************************************************************************************************************************************/

var siteData = {};
siteData.loggedErrors = new Array();

/*************************************************************************************************************************************************************************************

    Waiting for all pre-requisite objects to load

*************************************************************************************************************************************************************************************/

$(window).on("load", function () {
    // Animate loader off screen

    log("Starting window on load", "INFO");

    //Prevent caching of ajax requests
    $(document).ready(function () {
        $.ajaxSetup({ cache: false });
    });

    $("#firstlayerdetailscontentdiv").html(`
        <div id="jsonloadingerrors">
            <h1 class="jsonloadingerrors">There were errors when loading the object json files</h1>

            <h3>The following json files did not load:</h3>
            <div id="jsonloadingerrordetails">
            </div>

            <h3>Possible reasons</h3>

            <h4>The web server hosting the report is IIS7.x or older</h4>
            If you're running the report on IIS7.x or older it's not able to handle Json files without a tweak to the MIME files settings.<br>
            <a href="https://loadbalancing.se/bigip-report/#The_script_reports_missing_JSON_files">Detailed instructions are available here</a>.<br>

            <h4>File permissions or network issues</h4>
            Script has had issues when creating the files due to lack of permissions or network issues.<br>
            Double check your script execution logs, web folder content and try running the script manually.<br>

            <h3>Please note that while you can close these details, the report won't function as it should until these problems has been solved.</h3>

        </div>`
    );

    $("a#closefirstlayerbutton").text("Close error details");

    let addJSONLoadingFailure = function (jqxhr) {

        //Remove the random query string not to confuse people
        let url = this.url.split("?")[0];

        $("#jsonloadingerrordetails").append(`
                <div class="failedjsonitem"><span class="error">Failed object:</span><span class="errordetails"><a href="` + url + `">` + url + `</a></span>
                <br><span class="error">Status code:</span><span class="errordetails"> ` + jqxhr.status + `</span>
                <br><span class="error">Reason:</span><span class="errordetails"> ` + jqxhr.statusText + "</div>"
        )
        $("div.beforedocumentready").hide();
        $("#firstlayerdiv").fadeIn();
    }

    /******************************************************************************************************************************

        Lightbox related functions

    ******************************************************************************************************************************/

    /* Hide the lightbox if clicking outside the information box*/
    $('body').on('click', function (e) {
        if (e.target.classList.contains("lightbox")) {
            $("div#" + e.target.id).fadeOut(function () {
                updateLocationHash();
            });
        }
    });

    /* Center the lightbox */
    jQuery.fn.center = function () {
        this.css("position", "absolute");
        //this.css("top", Math.max(0, (($(window).height() - $(this).outerHeight()) / 2) + $(window).scrollTop()) + "px");
        this.css("left", Math.max(0, (($(window).width() - $(this).outerWidth()) / 2) + $(window).scrollLeft()) + "px");
        return this;
    }

    $("a#closefirstlayerbutton").on("click", function () {
        $("div#firstlayerdiv").trigger("click");
    });
    $("a#closesecondlayerbutton").on("click", function () {
        $("div#secondlayerdiv").trigger("click");
    });

    /**
     * Example use:
     * $('div:icontains("Text in page")');
     * Will return jQuery object containing any/all of the following:
     * <div>text in page</div>
     * <div>TEXT in PAGE</div>
     * <div>Text in page</div>
     */
    $.expr[':'].icontains = $.expr.createPseudo(function(text) {
        return function(e) {
            return $(e).text().toUpperCase().indexOf(text.toUpperCase()) >= 0;
        };
    });

    /* syntax highlighting */
    sh_highlightDocument('js/', '.js');

    $.when(
        // Get pools
        $.getJSON("json/pools.json", function (result) {
            siteData.pools = result;
            siteData.poolsMap = new Map();
            let poolNum = 0;
            siteData.pools.forEach((pool) => {
                pool.poolNum = poolNum;
                siteData.poolsMap.set(`${pool.loadbalancer}:${pool.name}`, pool);
                poolNum++;
            })
        }).fail(addJSONLoadingFailure),
        //Get the monitor data
        $.getJSON("json/monitors.json", function (result) {
            siteData.monitors = result;
        }).fail(addJSONLoadingFailure),
        //Get the virtual servers data
        $.getJSON("json/virtualservers.json", function (result) {
            siteData.virtualservers = result;
        }).fail(addJSONLoadingFailure),
        //Get the irules data
        $.getJSON("json/irules.json", function (result) {
            siteData.irules = result;
        }).fail(addJSONLoadingFailure),
        //Get the datagroup data
        $.getJSON("json/datagroups.json", function (result) {
            siteData.datagroups = result;
        }).fail(addJSONLoadingFailure),
        $.getJSON("json/loadbalancers.json", function (result) {
            siteData.loadbalancers = result;
        }).fail(addJSONLoadingFailure),
        $.getJSON("json/preferences.json", function (result) {
            siteData.preferences = result;
        }).fail(addJSONLoadingFailure),
        $.getJSON("json/knowndevices.json", function (result) {
            siteData.knownDevices = result;
        }).fail(addJSONLoadingFailure),
        $.getJSON("json/certificates.json", function (result) {
            siteData.certificates = result;
        }).fail(addJSONLoadingFailure),
        $.getJSON("json/devicegroups.json", function (result) {
            siteData.deviceGroups = result;
        }).fail(addJSONLoadingFailure),
        $.getJSON("json/asmpolicies.json", function (result) {
            siteData.asmPolicies = result;
        }).fail(addJSONLoadingFailure),
        $.getJSON("json/nat.json", function (result) {
            siteData.NATdict = result;
        }).fail(addJSONLoadingFailure),
        $.getJSON("json/loggederrors.json", function (result) {
            siteData.loggedErrors = result.concat(siteData.loggedErrors);
        }).fail(addJSONLoadingFailure)
    ).then(function () {

        /*************************************************************************************************************

            All pre-requisite things have loaded

        **************************************************************************************************************/

        log("loaded:" +
            " loadbalancers:" + siteData.loadbalancers.length +
            ", virtualservers:" + siteData.virtualservers.length +
            ", pools:" + siteData.pools.length +
            ", iRules:" + siteData.irules.length +
            ", datagroups:" + siteData.datagroups.length +
            ", certificates:" + siteData.certificates.length +
            ", monitors:" + siteData.monitors.length +
            ", asmPolicies:" + siteData.asmPolicies.length +
            ".", "INFO");

        /*************************************************************************************************************

            Load preferences

        **************************************************************************************************************/

        loadPreferences();

        /*************************************************************************************************************

            Test the status VIPs

        *************************************************************************************************************/

        initializeStatusVIPs();

        /* highlight selected menu option */

        populateSearchParameters(false)
        var currentSection = $("div#mainholder").attr("data-activesection");

        if (currentSection === undefined) {
            showVirtualServers(true);
        }

        /*************************************************************************************************************

            This section adds the update check button div and initiates the update checks

        **************************************************************************************************************/

        NavButtonDiv(null,null,null);
        //Check if there's a new update
        setInterval(function () {
            $.ajax(document.location.href, {
                type: 'HEAD',
                success: NavButtonDiv
            });
        }, 3000);

    });

});

// update Navigation Buttons based on HEAD polling date (if available)
function NavButtonDiv(response, status, xhr) {
    var currentreport = Date.parse(document.lastModified);
    var timesincerefresh=0;
    if (xhr && null != xhr.getResponseHeader('Last-Modified')) {
        var latestreport = new Date(xhr.getResponseHeader('Last-Modified')).getTime();
        // If there's been a new report, how long ago (in minutes)
        timesincerefresh = Math.round((((latestreport - currentreport) % 86400000) % 3600000) / 60000)
    }

    var navbutton='<ul>'
    if (timesincerefresh > 60) {
        navbutton+='<li><button onclick="document.location.reload()" class="navbutton urgent">Update available</a></li>';
    } else if (timesincerefresh > 0) {
        navbutton+='<li><button onclick="document.location.reload()" class="navbutton important">Update available</a></li>';
    } else {
        navbutton+='<li><button onclick="document.location.reload()" class="navbutton">Refresh</button></li>';
    }
    for (var key in siteData.preferences.NavLinks) {
        navbutton+='<li><button onclick="window.location.href=\'' + siteData.preferences.NavLinks[key] + '\'" class="navbutton">' + key + '</button></li>';
    }
    navbutton+='</ul>'
    $("div#navbuttondiv").html(navbutton);
}

function initializeStatusVIPs() {

    // Also initialize the ajaxQueue
    siteData.memberStates = {}
    siteData.memberStates.ajaxQueue = [];
    siteData.memberStates.ajaxRecent = [];
    siteData.memberStates.ajaxFailures = [];

    var loadbalancers = siteData.loadbalancers;

    //Check if there is any functioning pool status vips
    var hasConfiguredStatusVIP = loadbalancers.some(function (e) {
        return /[a-b0-9]+/.test(e.statusvip.url);
    })

    if (hasConfiguredStatusVIP) {

        for (var i in loadbalancers) {

            var loadbalancer = loadbalancers[i];

            // Increase the not configured span for loadbalancers that is eligible for polling but has none configured
            if (loadbalancer.statusvip.url === "" && (loadbalancer.active || loadbalancer.isonlydevice)) {

                log("Loadbalancer " + loadbalancer.name + " does not have any status VIP configured", "INFO");
                $("span#realtimenotconfigured").text(parseInt($("span#realtimenotconfigured").text()) + 1);
                loadbalancer.statusvip.working = false;
                loadbalancer.statusvip.reason = "None configured";

            } else if (loadbalancer.statusvip.url !== "" && (loadbalancer.active || loadbalancer.isonlydevice)) {
                testStatusVIP(loadbalancer);
            }
        }
    } else {
        log("No status VIPs has been configured", "INFO");
        $("td#pollingstatecell").html("Disabled");
        $("div.beforedocumentready").fadeOut(1500);
    }
}

function PoolMemberStatus(member) {
    var mStatus = member.enabled + ':' + member.availability;

    if (mStatus == "enabled:available") {
        return '<span class="statusicon"><img src="images/green-circle-checkmark.png" alt="Available (Enabled)" title="' + mStatus + ' - Member is able to pass traffic"/></span>';
    } else if (mStatus == "enabled:unknown") {
        return '<span class="statusicon"><img src="images/blue-square-questionmark.png" alt="Unknown (Enabled)" title="' + mStatus + ' - Member status unknown"/></span>';
    } else if (mStatus == "enabled:offline") {
        return '<span class="statusicon"><img src="images/red-circle-cross.png" alt="Offline (Enabled)" title="' + mStatus + ' - Member is unable to pass traffic"/></span>';
    } else if (mStatus == "disabled:available") {
        return '<span class="statusicon"><img src="images/black-circle-checkmark.png" alt="Available (Disabled)" title="' + mStatus + ' - Member is available, but disabled"/></span>'
    } else if (mStatus == "disabled:offline" || mStatus == "disabled-by-parent:offline") {
        return '<span class="statusicon"><img src="images/black-circle-checkmark.png" alt="Unknown (Disabled)" title="' + mStatus + ' - Member is disabled"/></span>';
    }
    return mStatus;
}

function PoolStatus(pool, type) {
    if (!pool) {
        return '';
    }
    var pStatus = pool.enabled + ':' + pool.availability;

    if (type == 'display' || type == 'print') {
        if (pStatus == "enabled:available") {
            return '<span class="statusicon"><img src="images/green-circle-checkmark.png" alt="' + pStatus + '" title="' + pStatus + ' - ' + pool.status + '"/></span>';
        } else if (pStatus == "enabled:unknown") {
            return '<span class="statusicon"><img src="images/blue-square-questionmark.png" alt="' + pStatus + '" title="' + pStatus + ' - '  + pool.status + '"/></span>';
        } else if (pStatus == "enabled:offline") {
            return '<span class="statusicon"><img src="images/red-circle-cross.png" alt="' + pStatus + '" title="' + pStatus + ' - '  + pool.status + '"/></span>';
        } else if (pStatus == "disabled-by-parent:available" || pStatus == "disabled-by-parent:offline") {
            return '<span class="statusicon"><img src="images/black-circle-checkmark.png" alt="' + pStatus + '" title="' + pStatus + ' - '  + pool.status + '"/></span>'
        }
        return pStatus;
    } else {
        return pStatus;
    }
}

function VirtualServerStatus(row) {
    if (!row.enabled || !row.availability)
        return '';
    var vsStatus = row.enabled + ':' + row.availability;

    if (vsStatus == "enabled:available") {
        return '<span class="statusicon"><img src="images/green-circle-checkmark.png" alt="Available (Enabled)"' +
            ' title="' + vsStatus + ' - The virtual server is available"/></span>';
    } else if (vsStatus == "enabled:unknown") {
        return '<span class="statusicon"><img src="images/blue-square-questionmark.png" alt="Unknown (Enabled)"' +
            ' title="' + vsStatus + ' - The children pool member(s) either don\'t have service checking enabled,' +
            ' or service check results are not available yet"/></span>';
    } else if (vsStatus == "enabled:offline") {
        return '<span class="statusicon"><img src="images/red-circle-cross.png" alt="Offline (Enabled)"' +
            ' title="' + vsStatus + ' - The children pool member(s) are down"/></span>';
    } else if (vsStatus == "disabled:available") {
        return '<span class="statusicon"><img src="images/black-circle-cross.png" alt="Available (Disabled)"' +
            ' title="' + vsStatus + ' - The virtual server is disabled"/></span>'
    } else if (vsStatus == "disabled:unknown") {
        return '<span class="statusicon"><img src="images/black-circle-checkmark.png" alt="Unknown (Disabled)"' +
            ' title="' + vsStatus + ' - The children pool member(s) either don\'t have service checking enabled,' +
            ' or service check results are not available yet"/></span>';
    } else if (vsStatus == "disabled:offline") {
        return '<span class="statusicon"><img src="images/black-circle-cross.png" alt="Offline (Disabled)"' +
            ' title="' + vsStatus + ' - The children pool member(s) are down"/></span>'
    }
    return vsStatus;
}

function createdPoolCell(cell, cellData, rowData, rowIndex, colIndex) {
    if (rowData.pools) {
        $(cell).addClass('PoolCell');
        $(cell).attr('id', "vs-" + rowIndex);
    }
}

function renderPoolMember(loadbalancer, member, type) {
    var result='';
    if (member !== null) {
        if (type == 'display' || type == 'print') {
            result += '<span data-member="' + member.ip + ':' + member.port + '">';
            result += PoolMemberStatus(member);
            result += '</span>';
        }
        name = member.name.split('/')[2];
        if (name != member.ip + ':' + member.port) {
            result += '(' + member.ip + ')';
        }
        result += name
    }
    return result;
}

function renderPoolMemberCell(type, member, poolNum) {
    membercell = '<td class="PoolMember" data-pool="' + poolNum + '">';
    membercell += renderPoolMember('', member, type);
    membercell += '</td>'
    return membercell;
}

function renderPoolCell(data, type, row, meta) {
    if (type == 'sort') {
        if (data) {
            return data.length;
        } else {
            return 0;
        }
    }
    if (!data) {
        return "N/A";
    }
    var poolCell = '';
    if (type == 'display') {
        var tid = "vs-" + meta.row;
        poolCell += '<div class="expand" id="expand-' + tid + '" style="display: none;">' +
            '<a><img src="images/chevron-down.png" alt="down" onclick="Javascript:togglePool(\'' + tid + '\')"></a></div>';
        poolCell += '<div class="collapse" id="collapse-' + tid + '" style="display: block;">' +
            '<a><img src="images/chevron-up.png" alt="up" onclick="Javascript:togglePool(\'' + tid + '\')"></a></div>';
        poolCell +=    '<div class="AssociatedPoolsInfo" onclick="Javascript:togglePool(\'' + tid + '\')"' +
            ' id="AssociatedPoolsInfo-' + tid + '" style="display: none;"> Show ' + data.length + ' associated pools</div>' +
            '<div id="PoolCell-' + tid + '" class="pooltablediv" style="display: block;">';
    }
    poolCell += '<table class="pooltable"><tbody>';
    for (var i=0; i<data.length; i++) {
        var pool = siteData.poolsMap.get(row.loadbalancer + ':' + data[i]);
        // report dumps pools before virtualhosts, so pool might not exist
        if (pool) {
            var poolClass = 'Pool-' + pool.poolNum;
            poolCell += '<tr class="' + poolClass + '" ';
            if (type == 'display') {
                poolCell += 'onmouseover="javascript:togglePoolHighlight(this);" onmouseout="javascript:togglePoolHighlight(this);"';
            }
            poolCell += 'style="">';
            poolCell += '<td';
            if (pool.members !== null && pool.members.length > 1) {
                poolCell += ' rowspan="' + pool.members.length + '"';
            }
            poolCell += ' class="poolname">';
            poolCell += renderPool(pool.loadbalancer, pool.name, type);
            poolCell += '</td>';
            if (pool.members == null) {
                poolCell += '<td>None</td>'
            } else {
                poolCell += renderPoolMemberCell(type, pool.members[0], pool.poolNum);
            }
            poolCell += '</tr>';
            if (pool.members !== null) {
                for (var m=1; m<pool.members.length; m++) {
                    poolCell += '<tr class="' + poolClass + '">' + renderPoolMemberCell(type, pool.members[m], pool.poolNum) + '</tr>';
                }
            }
        }
    }
    poolCell += '</tbody></table>';
    poolCell += "</div>";
    return poolCell;
}

function renderList(data, type, row, meta, renderCallback, plural) {
    if (type == 'sort') {
        if (data && data.length) {
            return data.length;
        }
        return 0;
    }
    var result = '';
    if (data && data.length > 0) {
        var members = [];
        data.forEach((member) => {
            members.push(renderCallback(row.loadbalancer, member, type));
        });
        if (type == 'display') {
            if (data.length == 1) {
                result = '<div data-loadbalancer="' + row.loadbalancer + '" data-name="' + row.name + '">';
            } else {
                result = '<details data-loadbalancer="' + row.loadbalancer + '" data-name="' + row.name + '">';
                result += '<summary>View ' + data.length + ' ' + plural + '</summary>';
            }
            result += members.join('<br>');
            if (data.length == 1) {
                result += '</div>';
            } else {
                result += '</details>';
            }
            result += '</div>';
        } else if (type == 'print') {
            result += members.join('<br>');
        } else {
            result += members;
        }
    } else {
        result = "None";
    }
    return result;
}

function testStatusVIP(loadbalancer) {

    var name = loadbalancer.name;

    // Find a pool with members on this load balancer
    var pool = false;
    var pools = siteData.pools;

    for (var i in pools) {
        if (pools[i].loadbalancer === name && pools[i].members) {
            pool = pools[i];
            break;
        }
    }

    if (!pool) {
        loadbalancer.statusvip.working = false;
        loadbalancer.statusvip.reason = "No pools with members found";
        log("No pools with members to test the status vip with on loadbalancer " + name + ", marking it as failed", "ERROR")

    } else {

        var testURL = loadbalancer.statusvip.url + pool.name;

        increaseAjaxQueue(testURL);

        $.ajax({
                dataType: "json",
                url: testURL,
                success: function (lb) {
                    $("span#realtimetestsuccess").text(parseInt($("span#realtimetestsuccess").text()) + 1);
                    log("Statusvip test <a href=\"" + testURL + "\">" + testURL + "</a> was successful on loadbalancer: <b>" + loadbalancer.name + "</b>", "INFO");
                    loadbalancer.statusvip.working = true;
                    loadbalancer.statusvip.reason = "";
                    decreaseAjaxQueue(testURL);
                },
                timeout: 2000
            })
            .fail(function (jqxhr) {
                log('Statusvip test <a href="' + testURL + '">' + testURL + '</a> failed on loadbalancer: <b>' +
                    loadbalancer.name + '</b><br>Information about troubleshooting status VIPs is available' +
                    ' <a href="https://loadbalancing.se/bigip-report/#One_or_more_status_endpoints_has_been_marked_as_failed">here</a>', "ERROR");
                $("span#realtimetestfailed").text(parseInt($("span#realtimetestfailed").text()) + 1);
                loadbalancer.statusvip.working = false;
                loadbalancer.statusvip.reason = jqxhr.statusText;
                decreaseAjaxQueue(testURL);
            })
            .always(function () {

                if (siteData.memberStates.ajaxQueue.length == 0) {

                    //Tests done, restore the view of the original URL
                    populateSearchParameters();

                    //Check if there is any functioning pool status vips
                    var hasWorkingStatusVIP = siteData.loadbalancers.some(function (e) {
                        return e.statusvip.working;
                    })

                    if (hasWorkingStatusVIP) {

                        log("Status VIPs tested, starting the polling functions", "INFO");

                        pollCurrentView()

                        setInterval(function () {
                            if (siteData.memberStates.ajaxQueue.length == 0) {
                                pollCurrentView();
                            } else {
                                resetClock();
                                log("Did not finish the polling in time, consider increasing the polling interval, or increase the max queue in the configuration file", "WARNING")
                            }
                        }, (siteData.preferences.PollingRefreshRate * 1000));
                    } else {
                        log("No functioning status VIPs detected, scanning disabled<br>" +
                            "More information about why this happens is available" +
                            " <a href=\"https://loadbalancing.se/bigip-report/#The_member_status_polling_says_it8217s_disabled\">here</a>", "ERROR");
                        $("td#pollingstatecell").html("Disabled")
                    }
                }
            });
    }
    $("div.beforedocumentready").fadeOut(1500);
}

//Initiate pool status updates
function pollCurrentView() {
    siteData.memberStates.ajaxRecent = [];
    resetClock();
    var currentSection = $("div#mainholder").attr("data-activesection");
    var length = 0;
    switch (currentSection) {
        case "virtualservers":
            var length = $("table.pooltable tr td.poolname:visible").length;
            break;
        case "pools":
            var length = $("table#poolTable details[open][data-name],table#poolTable div[data-name]").length;
            break;
    }
    if (length >= 0 && length <= siteData.preferences.PollingMaxPools) {
        switch (currentSection) {
            case "virtualservers":
                $("table.pooltable tr td.poolname:visible").each(function () {
                    getPoolStatus(this);
                });
                break;
            case "pools":
                $("table#poolTable details[open][data-name],table#poolTable div[data-name]").each(function () {
                    getPoolStatusPools(this);
                })
                break;
        }
    }
}

function renderLoadBalancer(loadbalancer, type) {
    var balancer;
    if (siteData.preferences.HideLoadBalancerFQDN) {
        balancer = loadbalancer.split('.')[0];
    } else {
        balancer = loadbalancer;
    }
    if (type == 'display') {
        return '<a onclick="window.open(\'https://' + loadbalancer + '\',\'_blank\')">' + balancer + '</a>';
    }
    return balancer;
}

function renderVirtualServer(loadbalancer, name, type) {
    vsName=name.replace(/^\/Common\//,'');
    result = '';
    if (type == 'display') {
        result += '<span class="adcLinkSpan"><a target="_blank" href="https://' + loadbalancer;
        result += '/tmui/Control/jspmap/tmui/locallb/virtual_server/properties.jsp?name=' + name + '">Edit</a></span>';
    }
    if (type == 'display' || type == 'print') {
        var vs=getVirtualServer(name, loadbalancer);
        result += VirtualServerStatus(vs);
    }
    if (type == 'display') {
        result += '<a';
        result += ' class="tooltip"';
        result += ' data-originalvirtualservername="' + name + '"';
        result += ' data-loadbalancer="' + loadbalancer + '"';
        result += ' href="Javascript:showVirtualServerDetails(\'' + name + '\',\'' + loadbalancer + '\');">';
    }
    result += vsName;
    if (type == 'display') {
        result += '<span class="detailsicon"><img src="images/details.png" alt="details"></span>';
        result += '<p>Click to see virtual server details</p>';
        result += '</a>';
    }
    return result;
}

function renderRule(loadbalancer, name, type) {
    var ruleName=name.replace(/^\/Common\//,'');
    var result='';
    if (type == 'display') {
        result += '<span class="adcLinkSpan"><a target="_blank" href="https://' + loadbalancer;
        result += '/tmui/Control/jspmap/tmui/locallb/rule/properties.jsp?name=' + name + '">Edit</a></span>';
        result += '<a';
        result += ' class="tooltip"';
        result += ' data-originalvirtualservername="' + name + '"';
        result += ' data-loadbalancer="' + loadbalancer + '"';
        result += ' href="Javascript:showiRuleDetails(\'' + name + '\',\'' + loadbalancer + '\');">';
    }
    result += ruleName;
    if (type == 'display') {
        result += '<span class="detailsicon"><img src="images/details.png" alt="details"></span>';
        result += '<p>Click to see iRule details</p>';
        result += '</a>';
    }
    return result;
}

function renderPool(loadbalancer, name, type) {
    if (name == "N/A") {
        return name;
    }
    var poolName=name.replace(/^\/Common\//,'');
    var result = '';
    if (type == 'display') {
        result += '<span class="adcLinkSpan"><a target="_blank" href="https://' + loadbalancer;
        result += '/tmui/Control/jspmap/tmui/locallb/pool/properties.jsp?name=' + name + '">Edit</a></span>';
    }
    result += PoolStatus(siteData.poolsMap.get(loadbalancer + ':' + name), type);
    if (type == 'display') {
        result += '<a';
        result += ' class="tooltip"';
        result += ' data-originalpoolname="' + name + '"';
        result += ' data-loadbalancer="' + loadbalancer + '"';
        result += ' href="Javascript:showPoolDetails(\'' + name + '\',\'' + loadbalancer + '\');">';
    } else {
        result += ' ';
    }
    result += poolName;
    if (type == 'display') {
        result += '<span class="detailsicon"><img src="images/details.png" alt="details"></span>';
        result += '<p>Click to see pool details</p>';
        result += '</a>';
    }
    return result;
}

function renderCertificate(loadbalancer, name, type) {
    var certName=name.replace(/^\/Common\//,'');
    var result = certName;
    if (type == 'display') {
        result += ' <span class="adcLinkSpan"><a target="_blank" href="https://' + loadbalancer;
        result += '/tmui/Control/jspmap/tmui/locallb/ssl_certificate/properties.jsp?certificate_name=' + name.replace(/\//,'%2F').replace(/.crt$/,'') + '">Edit</a></span>';
    }
    return result;
}

function renderDataGroup(loadbalancer, name, type) {
    var datagroupName=name.replace(/^\/Common\//,'');
    var result = '';
    if (type == 'display') {
        result += '<span class="adcLinkSpan"><a target="_blank" href="https://' + loadbalancer;
        result += '/tmui/Control/jspmap/tmui/locallb/datagroup/properties.jsp?name=' + name + '">Edit</a></span>';
        result += '<a';
        result += ' class="tooltip"';
        result += ' data-originalvirtualservername="' + name + '"';
        result += ' data-loadbalancer="' + loadbalancer + '"';
        result += ' href="Javascript:showDataGroupDetails(\'' + name + '\',\'' + loadbalancer + '\');">';
    }
    result += datagroupName;
    if (type == 'display') {
        result += '<span class="detailsicon"><img src="images/details.png" alt="details"></span>';
        result += '<p>Click to see Data Group details</p>';
        result += '</a>';
    }
    return result;
}

function countdownClock () {
    siteData.countDown--;
    if (siteData.countDown === 0) {
        clearTimeout(siteData.clock)
    }
    $("span#refreshcountdown").html(siteData.countDown);
    var currentSection = $("div#mainholder").attr("data-activesection");
    var length = 0;
    switch (currentSection) {
        case "virtualservers":
            var length = $("table.pooltable tr td.poolname:visible").length;
            break;
        case "pools":
            var length = $("table#poolTable details[open][data-name],table#poolTable div[data-name]").length;
            break;
    }
    var pollingstate = '';
    if (length == 0 || length > siteData.preferences.PollingMaxPools) {
        pollingstate += 'Disabled, ';
    }
    pollingstate += length + '/' + siteData.preferences.PollingMaxPools + ' pools open, ';
    if (siteData.memberStates) {
        pollingstate += '<span id="ajaxqueue">' + siteData.memberStates.ajaxQueue.length + '</span>/' + siteData.preferences.PollingMaxQueue + ' queued, ';
    }
    pollingstate += 'refresh in ' + siteData.countDown + ' seconds.'
    $("td#pollingstatecell").html(pollingstate);
}

function resetClock() {
    siteData.countDown = siteData.preferences.PollingRefreshRate + 1;
    clearInterval(siteData.clock);
    countdownClock();
    siteData.clock = setInterval(countdownClock, 1000);
}

function getPoolStatus(poolCell) {

    if (siteData.memberStates.ajaxQueue.length >= siteData.preferences.PollingMaxQueue) {
        setTimeout(function () {
            getPoolStatus(poolCell)
        }, 200);

    } else {

        var poolLink = $(poolCell).find("a.tooltip");
        var loadbalancerName = $(poolLink).attr("data-loadbalancer");

        var loadbalancer = getLoadbalancer(loadbalancerName);

        if (loadbalancer && loadbalancer.statusvip.working === true) {

            var poolName = $(poolLink).attr("data-originalpoolname");

            var pool = getPool(poolName, loadbalancerName);
            var url = loadbalancer.statusvip.url + pool.name

            if (increaseAjaxQueue(url)) {
                $.ajax({
                    dataType: "json",
                    url: url,
                    success: function (data) {
                        if (data.success) {

                            decreaseAjaxQueue(url);

                            for (var memberStatus in data.memberstatuses) {

                                var statusSpan = $("td.PoolMember[data-pool=\"" + pool.poolNum + "\"] span[data-member=\"" + memberStatus + "\"]");

                                setMemberState(statusSpan, data.memberstatuses[memberStatus])

                                // Update the pool json object
                                var members = pool.members;

                                for (i in members) {
                                    var member = members[i];
                                    var ipport = member.ip + ":" + member.port;
                                    if (ipport === memberStatus) {
                                        member.realtimestatus = data.memberstatuses[memberStatus];
                                    }
                                }
                            }
                        }
                    },
                    timeout: 2000
                })
                .fail(function (jqxhr) {
                    // To be used later in the console
                    // siteData.memberStates.ajaxFailures.push({ url: url, code: jqxhr.status, reason: jqxhr.statusText })
                    decreaseAjaxQueue(url)
                    return false;
                });
            }
        }
    }
}

function getPoolStatusPools(poolCell) {

    if (siteData.memberStates.ajaxQueue.length >= siteData.preferences.PollingMaxQueue) {
        setTimeout(function () {
            getPoolStatusPools(poolCell)
        }, 200);

    } else {

        var loadbalancerName = $(poolCell).attr("data-loadbalancer");

        var loadbalancer = getLoadbalancer(loadbalancerName);

        if (loadbalancer && loadbalancer.statusvip.working === true) {

            var poolName = $(poolCell).attr("data-name");

            var pool = getPool(poolName, loadbalancerName);
            var url = loadbalancer.statusvip.url + pool.name

            if (increaseAjaxQueue(url)) {
                $.ajax({
                    dataType: "json",
                    url: url,
                    success: function (data) {
                        if (data.success) {

                            decreaseAjaxQueue(url);

                            for (var memberStatus in data.memberstatuses) {

                                var statusSpan = $(
                                    'table#poolTable details[data-name="' + poolName + '"] span[data-member="' + memberStatus + '"],' +
                                    'table#poolTable div[data-name="' + poolName + '"] span[data-member="' + memberStatus + '"]'
                                    );

                                setMemberState(statusSpan, data.memberstatuses[memberStatus])

                                // Update the pool json object
                                var members = pool.members;

                                for (i in members) {
                                    var member = members[i];
                                    var ipport = member.ip + ":" + member.port;
                                    if (ipport === memberStatus) {
                                        member.realtimestatus = data.memberstatuses[memberStatus];
                                    }
                                }
                            }
                        }
                    },
                    timeout: 2000
                })
                .fail(function (jqxhr) {
                    // To be used later in the console
                    // siteData.memberStates.ajaxFailures.push({ url: url, code: jqxhr.status, reason: jqxhr.statusText })
                    decreaseAjaxQueue(url)
                    return false;
                });
            }
        }
    }
}

function decreaseAjaxQueue(url) {

    var index = siteData.memberStates.ajaxQueue.indexOf(url);
    if (index > -1) {
        siteData.memberStates.ajaxQueue.splice(index,1);
    }
    if (siteData.memberStates.ajaxRecent.indexOf(url) == -1) {
        siteData.memberStates.ajaxRecent.push(url);
    }

    //Decrease the total queue
    $("span#ajaxqueue").text(siteData.memberStates.ajaxQueue.length);
}

function increaseAjaxQueue(url) {
    if (siteData.memberStates.ajaxRecent.indexOf(url) == -1 && siteData.memberStates.ajaxQueue.indexOf(url) == -1) {
        siteData.memberStates.ajaxQueue.push(url);
        $("span#ajaxqueue").text(siteData.memberStates.ajaxQueue.length);
        return true;
    }
    return false;
}

function setMemberState(statusSpan, memberStatus) {

    var statusIcon = $(statusSpan).find("span.statusicon");

    var icon, title, status;

    switch (memberStatus) {
        case "up":
            icon = "green-circle-checkmark.png";
            title = "Member is ready to accept traffic";
            status = "enabled:available";
            break;
        case "down":
            icon = "red-circle-cross.png";
            title = "Member is marked as down and unable to pass traffic";
            status = "enabled:offline";
            break;
        case "session_disabled":
            icon = "black-circle-checkmark.png";
            title = "Member is ready to accept traffic, but is disabled";
            status = "disabled:unknown";
            break;
        default:
            icon = "blue-square-questionmark.png";
            title = "Unknown state";
            status = "enabled:unknown";
            break;
    }

    html = '<img src="images/' + icon + '" title="' + status + ' - ' + title + '" alt="' + status + '"/>'
    $(statusIcon).fadeOut(200).html(html).fadeIn(200);
}

/********************************************************************************************************************************************************************************************

    Functions used by the main data table

********************************************************************************************************************************************************************************************/


/******************************************************************************************************************************
    Highlight all matches
******************************************************************************************************************************/

function highlightAll(table) {

    var body = $(table.table().body());

    body.unhighlight();
    var search=[table.search()];

    table.columns().every(function () {

        columnvalue = $('input', this.header()).val()
        if (columnvalue) {
            search.push(columnvalue);
        }
    });

    body.highlight(search, {"regEx":localStorage.getItem("regexSearch") === "true"});
}

/******************************************************************************************************************************
    Gets the query strings and populate the table
******************************************************************************************************************************/

function populateSearchParameters(updatehash) {

    var vars = {};
    var hash;

    if (window.location.href.indexOf('#') >= 0) {

        //Split the hash query string and create a dictionary with the parameters
        var hashes = window.location.href.slice(window.location.href.indexOf('#') + 1).split('&');

        for (var i = 0; i < hashes.length; i++) {
            hash = hashes[i].split('=');
            vars[hash[0]] = hash[1];
        }

        if (vars['mainsection']) {

            var activeSection = vars['mainsection'];

            switch (activeSection) {
                case "virtualservers":
                    showVirtualServers(updatehash);
                    break;
                case "pools":
                    showPools(updatehash);
                    break;
                case "irules":
                    showiRules(updatehash);
                    break;
                case "deviceoverview":
                    showDeviceOverview(updatehash);
                    break;
                case "certificatedetails":
                    showCertificateDetails(updatehash);
                    break;
                case "datagroups":
                    showDataGroups(updatehash);
                    break;
                case "logs":
                    showLogs(updatehash);
                    break;
                case "preferences":
                    showPreferences(updatehash);
                    break;
                case "help":
                    showHelp(updatehash);
                    break;
            }
        }

        //Populate the search and column filters
        for (var key in vars) {
            value = vars[key];

            //If it's provided, populate and search with the global string
            if (key == "global_search") {
                if ($('#allbigips_filter input')) {
                    $('#allbigips_filter input').val(vars[key]);
                    if (siteData.bigipTable) {
                        siteData.bigipTable.search(vars[key], localStorage.getItem("regexSearch") === "true", false);
                        siteData.bigipTable.draw();
                    }
                }
            } else {
                //Validate that the key is a column filter and populate it
                if ($('input[name="' + key + '"]').length) {
                    $('input[name="' + key + '"]').val(value);
                    $('input[name="' + key + '"]').trigger("keyup");
                }
            }
        }

        if (vars['pool']) {
            var poolName = vars['pool'].split('@')[0];
            var loadBalancer = vars['pool'].split('@')[1];

            showPoolDetails(poolName, loadBalancer);
        }

        if (vars['virtualserver']) {
            var virtualServerName = vars['virtualserver'].split('@')[0];
            var loadBalancer = vars['virtualserver'].split('@')[1];

            showVirtualServerDetails(virtualServerName, loadBalancer);
        }

        if (vars['datagroup']) {
            var dataGroupName = vars['datagroup'].split('@')[0];
            var loadBalancer = vars['datagroup'].split('@')[1];

            showDataGroupDetails(dataGroupName, loadBalancer);
        }


        if (vars['irule']) {
            var iruleName = vars['irule'].split('@')[0];
            var loadBalancer = vars['irule'].split('@')[1];

            showiRuleDetails(iruleName, loadBalancer);
        }
    }
}

/*************************************************************************************************************

    setup main Virtual Servers table

*************************************************************************************************************/

function setupVirtualServerTable() {
    if (siteData.bigipTable) {
        return;
    }

    var content = `

        <table id="allbigips" class="bigiptable display">
            <thead>
                <tr>
                    <th class="loadbalancerHeaderCell"><span style="display: none;">Load Balancer</span><input type="search" name="loadbalancer" class="search" placeholder="Load Balancer" /></th>
                    <th><span style="display: none;">Name</span><input type="search" name="name" class="search" placeholder="Name" /></th>
                    <th><span style="display: none;">Description</span><input type="search" name="description" class="search" placeholder="Description" /></th>
                    <th><span style="display: none;">IP:Port</span><input type="search" name="ipport" class="search" placeholder="IP:Port" /></th>
                    <th><span style="display: none;">SNAT</span><input type="search" name="snat" class="search" placeholder="Source Translation" /></th>
                    <th><span style="display: none;">ASM</span><input type="search" name="asmpolicies" class="search" placeholder="ASM Policies" /></th>
                    <th><span style="display: none;">SSL</span><input type="search" name="sslprofile" class="search" placeholder="SSL Profile" /></th>
                    <th><span style="display: none;">Comp</span><input name="compressionprofile" type="search" class="search" placeholder="Compression Profile" /></th>
                    <th><span style="display: none;">Persist</span><input type="search" name="persistenceprofile" class="search" placeholder="Persistence Profile" /></th>
                    <th><span style="display: none;">Pool/Members</span><input type="search" name="poolmembers" class="search" placeholder="Pool/Members" /></th>
                </tr>
            </thead>
            <tbody>
            </tbody>
        </table>`;

    $("div#virtualservers").html(content);


    /*************************************************************************************************************

        Initiate data tables, add a search all columns header and save the standard table header values

    **************************************************************************************************************/


    siteData.bigipTable = $('table#allbigips').DataTable({
        "autoWidth": false,
        "deferRender": true,
        "data": siteData.virtualservers,
        "createdRow": function (row, data, index) {
            $(row).addClass('virtualserverrow');
        },
        "columns": [{
            "data": "loadbalancer",
            "className": "loadbalancerCell",
            "render": function (data, type, row) {
                return renderLoadBalancer(data, type);
            }
        }, {
            "data": "name",
            "className": "virtualServerCell",
            "render": function (data, type, row, meta) {
                return renderVirtualServer(row.loadbalancer, data, type);
            }
        }, {
            "className": "centeredCell",
            "data": "description",
            "visible": false
        }, {
            "className": "centeredCell",
            "render": function (data, type, row, meta) {
                var result = row.ip + ':' + row.port;
                if (siteData.NATdict[row.ip.split('%')[0]]) {
                    result += '<br>Public IP:' + siteData.NATdict[row.ip.split('%')[0]];
                }
                return result;
            }
        }, {
            "className": "centeredCell",
            "render": function (data, type, row) {
                if (!row.sourcexlatetype) {
                    return "Unknown";
                } else {
                    switch (row.sourcexlatetype) {
                        case "snat":
                            return "SNAT:" + row.sourcexlatepool;
                        default:
                            return row.sourcexlatetype;
                    }
                    return result;
                }
            },
            "visible": false
        }, {
            "className": "centeredCell",
            "render": function (data, type, row) {
                if (!row.asmPolicies) {
                    return "N/A";
                } else {
                    var result = row.asmPolicies;
                    for (asm=0;asm<siteData.asmPolicies.length;asm++) {
                        if (row.loadbalancer == siteData.asmPolicies[asm].loadbalancer &&
                                row.asmPolicies[0] == siteData.asmPolicies[asm].name) {
                            if (siteData.asmPolicies[asm].enforcementMode == 'blocking') {
                                result += ' (B)';
                            } else {
                                result += ' (T)';
                            }
                        }
                    }
                    return result;
                }
            },
            "visible": false
        }, {
            "className": "centeredCell",
            "render": function (data, type, row) {
                var result = '';
                if (row.profiletype == "Fast L4") {
                    result += row.profiletype;
                } else {
                    if (row.sslprofileclient == "None") {
                        result += "No";
                    } else {
                        result += "Yes";
                    }
                    result += '/';
                    if (row.sslprofileserver == "None") {
                        result += "No";
                    } else {
                        result += "Yes";
                    }
                }
                if (type == 'filter') {
                    if (row && row.sslprofileclient && row.sslprofileclient != "None") {
                        result += ' ' + row.sslprofileclient;
                    }
                    if (row && row.sslprofileserver && row.sslprofileserver != "None") {
                        result += ' ' + row.sslprofileserver;
                    }
                }
                return result;
            },
            "visible": false
        }, {
            "className": "centeredCell",
            "render": function (data, type, row) {
                if (row.compressionprofile == "None") {
                    return "No";
                } else {
                    return "Yes";
                }
            },
            "visible": false
        }, {
            "className": "centeredCell",
            "render": function (data, type, row) {
                if (row.persistence == "None") {
                    return "No";
                } else {
                    return "Yes";
                }
            },
            "visible": false
        }, {
            "data": "pools",
            "type": "html-num",
            "createdCell": createdPoolCell,
            "render": renderPoolCell
        }],
        "iDisplayLength": 10,
        "oLanguage": {
            "sSearch": "Search all columns:"
        },
        "dom": 'fBrtilp',
        "buttons": {
            "buttons": [
                {
                    "text": 'Reset',
                    "titleAttr": "Clear global and column filters",
                    "className": "tableHeaderColumnButton resetFilters",
                    "action": function ( e, dt, node, config ) {

                        $("table#allbigips thead th input").val("");

                        siteData.bigipTable.search('')
                            .columns().search('')
                            .draw();
                        updateLocationHash();
                    }
                },
                {
                    "text": 'Expand',
                    "titleAttr": 'Temporarily expand all',
                    "className": "tableHeaderColumnButton toggleExpansion",
                    "action": function ( e, dt, node, config ) {
                        switch(node['0'].innerText) {
                            case 'Expand':
                                hidePools(false);
                                node['0'].innerHTML = '<span>Collapse</span>';
                                node['0'].title = 'Temporarily collapse all';
                                break;
                            case 'Collapse':
                                hidePools(true);
                                node['0'].innerHTML = '<span>Restore</span>';
                                node['0'].title = 'Restore normal expansion';
                                break;
                            case 'Restore':
                                hidePools(true);
                                expandPoolMatches($(siteData.bigipTable.table().body()), siteData.bigipTable.search());
                                node['0'].innerHTML = '<span>Expand</span>';
                                node['0'].title = 'Temporarily expand all';
                                break;
                        }
                    }
                },
                "columnsToggle",
                {
                    "extend": "copyHtml5",
                    "titleAttr": "Copy current filtered results as HTML 5 to clipboard",
                    "className": "tableHeaderColumnButton exportFunctions",
                    "exportOptions": {
                        "columns": ":visible",
                        "stripHtml": false,
                        "orthogonal": "export"
                    }
                },
                {
                    "extend": "print",
                    "titleAttr": "Print current filtered results",
                    "className": "tableHeaderColumnButton exportFunctions",
                    "exportOptions": {
                        "columns": ":visible",
                        "stripHtml": false,
                        "orthogonal": "print"
                    }
                },
                {
                    "extend": "csvHtml5",
                    "titleAttr": "Download current filtered results in CSV format",
                    "className": "tableHeaderColumnButton exportFunctions",
                    "exportOptions": {
                        "columns": ":visible",
                        "stripHtml": false,
                        "orthogonal": "export"
                    },
                    "customize": customizeCSV
                }
            ]
        },
        "lengthMenu": [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
        "search": {"regex": localStorage.getItem("regexSearch") === "true"},
        "stateSave": true
    });


    /******************************************************************************************************************************

        Add custom data tables functions

    ******************************************************************************************************************************/

    //Prevents sorting the columns when clicking on the sorting headers
    $('table#allbigips thead th input').on('click', function (e) {
        e.stopPropagation();
    });

    // Apply the search
    siteData.bigipTable.columns().every( function () {
        var that = this;
        $( 'input', this.header() ).on( 'keyup change input search', function () {
            if ( that.search() !== this.value ) {
                that
                    .search( this.value, localStorage.getItem("regexSearch") === "true", false )
                    .draw();
            }
        });
    });

    // highlight matches
    siteData.bigipTable.on('draw', function () {

        var body = $(siteData.bigipTable.table().body());

        // reset toggleExpansion button
        var button = $('div#allbigips_wrapper div.dt-buttons button.toggleExpansion');
        button[0].innerHTML = '<span>Expand<span>'
        button[0].title = 'Temporarily expand all';

        hidePools();
        toggleAdcLinks();
        highlightAll(siteData.bigipTable);
        expandPoolMatches(body, siteData.bigipTable.search());
        setPoolTableCellWidth();
    });

    $('div#allbigips_filter.dataTables_filter input').on('keyup input', function () {
        updateLocationHash();
    });


    /*************************************************************************************************************

        If any search parameters has been sent, populate the search

    **************************************************************************************************************/

    siteData.bigipTable.draw();

}

function setupiRuleTable() {
    if (siteData.iRuleTable) {
        return;
    }

    var content = `
    <table id="iRuleTable" class="bigiptable display">
        <thead>
            <tr>
                <th class="loadbalancerHeaderCell"><span style="display: none;">Load Balancer</span><input type="search" class="search" placeholder="Load Balancer" /></th>
                <th><span style="display: none;">Name</span><input type="search" class="search" placeholder="Name" /></th>
                <th><span style="display: none;">Pools</span><input type="search" class="search" placeholder="Associated Pools" /></th>
                <th><span style="display: none;">Datagroups</span><input type="search" class="search" placeholder="Associated Datagroups" /></th>
                <th><span style="display: none;">Virtualservers</span><input type="search" class="search" placeholder="Associated Virtual Servers" /></th>
                <th style="width: 4em;"><span style="display: none;">Length</span><input type="search" class="search" placeholder="Length" /></th>
        </thead>
        <tbody>
        </tbody>
    </table>`;

    $("div#irules").html(content);

    siteData.iRuleTable = $('table#iRuleTable').DataTable({
        "autoWidth": false,
        "deferRender": true,
        "data": siteData.irules,
        "columns": [{
            "data": "loadbalancer",
            "className": "loadbalancerCell",
            "render": function (data, type, row) {
                return renderLoadBalancer(data, type);
            }
        }, {
            "data": "name",
            "className": "iRuleCell",
            "render": function (data, type, row) {
                return renderRule(row.loadbalancer, data, type);
            }
        }, {
            "data": "pools",
            "type": "html-num",
            "className": "relative",
            "render": function (data, type, row, meta) {
                return renderList(data, type, row, meta, renderPool, 'pools');
            }
        }, {
            "data": "datagroups",
            "type": "html-num",
            "render": function (data, type, row, meta) {
                return renderList(data, type, row, meta, renderDataGroup, 'datagroups');
            }
        }, {
            "data": "virtualservers",
            "type": "html-num",
            "render": function (data, type, row, meta) {
                return renderList(data, type, row, meta, renderVirtualServer, 'virtualservers');
            }
        }, {
            "data": "definition",
            "render": function (data, type, row) {
                return data.length;
            }
        }],
        "iDisplayLength": 10,
        "oLanguage": {
            "sSearch": "Search all columns:"
        },
        "dom": 'fBrtilp',
        "buttons": {
            "buttons": [
                {
                    "text": 'Reset filters',
                    "className": "tableHeaderColumnButton resetFilters",
                    "action": resetFilters
                },
                {
                    "text": 'Expand',
                    "titleAttr": 'Temporarily expand all',
                    "className": "tableHeaderColumnButton toggleExpansion",
                    "action": toggleExpandCollapseRestore
                },
                "columnsToggle",
                {
                    "extend": "copyHtml5",
                    "className": "tableHeaderColumnButton exportFunctions",
                    "exportOptions": {
                        "columns": ":visible",
                        "stripHtml": false,
                        "orthogonal": "export"
                    }
                },
                {
                    "extend": "print",
                    "className": "tableHeaderColumnButton exportFunctions",
                    "exportOptions": {
                        "columns": ":visible",
                        "stripHtml": false,
                        "orthogonal": "print"
                    }
                },
                {
                    "extend": "csvHtml5",
                    "className": "tableHeaderColumnButton exportFunctions",
                    "exportOptions": {
                        "columns": ":visible",
                        "stripHtml": false,
                        "orthogonal": "export"
                    },
                    "customize": customizeCSV
                }
            ],
        },
        "lengthMenu": [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
        "search": {"regex": localStorage.getItem("regexSearch") === "true"},
        "stateSave": true
    });

    //Prevents sorting the columns when clicking on the sorting headers
    $('table#iRuleTable thead th input').on('click', function (e) {
        e.stopPropagation();
    });

    // Apply the search
    siteData.iRuleTable.columns().every( function () {
        var that = this;
        $( 'input', this.header() ).on( 'keyup change input search', function () {
            if ( that.search() !== this.value ) {
                that
                    .search( this.value, localStorage.getItem("regexSearch") === "true", false )
                    .draw();
            }
        });
    });

    // highlight matches
    siteData.iRuleTable.on('draw', function () {
        // reset toggleExpansion button
        var button = $('div#iRuleTable_wrapper div.dt-buttons button.toggleExpansion');
        button[0].innerHTML = '<span>Expand<span>'
        button[0].title = 'Temporarily expand all';

        toggleAdcLinks();
        highlightAll(siteData.iRuleTable);
        expandMatches(siteData.iRuleTable.table().body());
    });

    siteData.iRuleTable.draw();
}

function setupPoolTable() {
    if (siteData.poolTable) {
        return;
    }

    var content = `
    <table id="poolTable" class="bigiptable display">
        <thead>
            <tr>
                <th class="loadbalancerHeaderCell"><span style="display: none;">Load Balancer</span><input type="search" class="search" placeholder="Load Balancer" /></th>
                <th><span style="display: none;">Name</span><input type="search" class="search" placeholder="Name" /></th>
                <th><span style="display: none;">Description</span><input type="search" class="search" placeholder="Description" /></th>
                <th><span style="display: none;">Orphan</span><input type="search" class="search" placeholder="Orphan" /></th>
                <th><span style="display: none;">Method</span><input type="search" class="search" placeholder="Method" /></th>
                <th><span style="display: none;">Monitors</span><input type="search" class="search" placeholder="Monitors" /></th>
                <th><span style="display: none;">Members</span><input type="search" class="search" placeholder="Members" /></th>
            </tr>
        </thead>
        <tbody>
        </tbody>
    </table>`;

    $("div#pools").html(content);

    siteData.poolTable = $('table#poolTable').DataTable({
        "autoWidth": false,
        "deferRender": true,
        "data": siteData.pools,
        "columns": [{
            "data": "loadbalancer",
            "className": "loadbalancerCell",
            "render": function (data, type, row) {
                return renderLoadBalancer(data, type);
            }
        }, {
            "data": "name",
            "render": function (data, type, row) {
                return renderPool(row.loadbalancer, data, type);
            }
        }, {
            "data": "description",
            "visible": false
        }, {
            "data": "orphaned"
        }, {
            "data": "loadbalancingmethod"
        }, {
            "data": "monitors",
            "render": function (data, type, row) {
                if (data) {
                    return data.join(' ');
                } else {
                    return 'None';
                }
            },
            "visible": false
        }, {
            "data": "members",
            "type": "html-num",
            "render": function (data, type, row, meta) {
                return renderList(data, type, row, meta, renderPoolMember, 'pool members');
            }
        }],
        "iDisplayLength": 10,
        "oLanguage": {
            "sSearch": "Search all columns:"
        },
        "dom": 'fBrtilp',
        "buttons": {
            "buttons": [
                {
                    "text": 'Reset filters',
                    "className": "tableHeaderColumnButton resetFilters",
                    "action": resetFilters
                },
                {
                    "text": 'Expand',
                    "titleAttr": 'Temporarily expand all',
                    "className": "tableHeaderColumnButton toggleExpansion",
                    "action": toggleExpandCollapseRestore
                },
                "columnsToggle",
                {
                    "extend": "copyHtml5",
                    "className": "tableHeaderColumnButton exportFunctions",
                    "exportOptions": {
                        "columns": ":visible",
                        "stripHtml": false,
                        "orthogonal": "export"
                    }
                },
                {
                    "extend": "print",
                    "className": "tableHeaderColumnButton exportFunctions",
                    "exportOptions": {
                        "columns": ":visible",
                        "stripHtml": false,
                        "orthogonal": "print"
                    }
                },
                {
                    "extend": "csvHtml5",
                    "className": "tableHeaderColumnButton exportFunctions",
                    "exportOptions": {
                        "columns": ":visible",
                        "stripHtml": false,
                        "orthogonal": "export"
                    },
                    "customize": customizeCSV
                }
            ],
        },
        "lengthMenu": [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
        "search": {"regex": localStorage.getItem("regexSearch") === "true"},
        "stateSave": true
    });

    //Prevents sorting the columns when clicking on the sorting headers
    $('table#poolTable thead th input').on('click', function (e) {
        e.stopPropagation();
    });

    // Apply the search
    siteData.poolTable.columns().every( function () {
        var that = this;
        $( 'input', this.header() ).on( 'keyup change input search', function () {
            if ( that.search() !== this.value ) {
                that
                    .search( this.value, localStorage.getItem("regexSearch") === "true", false )
                    .draw();
            }
        });
    });

    // highlight matches
    siteData.poolTable.on('draw', function () {
        // reset toggleExpansion button
        var button = $('div#poolTable_wrapper div.dt-buttons button.toggleExpansion');
        button[0].innerHTML = '<span>Expand<span>'
        button[0].title = 'Temporarily expand all';

        toggleAdcLinks();
        highlightAll(siteData.poolTable);
        expandMatches($(siteData.poolTable.table().body()));
    });

    siteData.poolTable.draw();
}

function setupDataGroupTable() {
    if (siteData.dataGroupTable) {
        return;
    }

    var content = `
    <table id="dataGroupTable" class="bigiptable display">
        <thead>
            <tr>
                <th class="loadbalancerHeaderCell"><span style="display: none;">Load Balancer</span><input type="search" class="search" placeholder="Load Balancer" /></th>
                <th><span style="display: none;">Name</span><input type="search" class="search" placeholder="Name" /></th>
                <th><span style="display: none;">Type</span><input type="search" class="search" placeholder="Type" /></th>
                <th><span style="display: none;">Pools</span><input type="search" class="search" placeholder="Associated Pools" /></th>
                <th><span style="display: none;">Length</span><input type="search" class="search" placeholder="Length" /></th>
            </tr>
        </thead>
        <tbody>
        </tbody>
    </table>`;

    $("div#datagroups").html(content);

    siteData.dataGroupTable = $('table#dataGroupTable').DataTable({
        "autoWidth": false,
        "deferRender": true,
        "data": siteData.datagroups,
        "columns": [{
            "data": "loadbalancer",
            "className": "loadbalancerCell",
            "render": function (data, type, row) {
                return renderLoadBalancer(data, type);
            }
        }, {
            "data": "name",
            "className": "iRuleCell",
            "render": function (data, type, row) {
                return renderDataGroup(row.loadbalancer, data, type);
            }
        }, {
            "data": "type",
        }, {
            "data": "pools",
            "type": "html-num",
            "className": "relative",
            "render": function (data, type, row, meta) {
                return renderList(data, type, row, meta, renderPool, 'pools');
            }
        }, {
            "data": "data",
            "render": function (data, type, row) {
                if (data) {
                    return Object.keys(data).length;
                }
                return 0;
            }
        }],
        "iDisplayLength": 10,
        "oLanguage": {
            "sSearch": "Search all columns:"
        },
        "dom": 'fBrtilp',
        "buttons": {
            "buttons": [
                {
                    "text": 'Reset filters',
                    "className": "tableHeaderColumnButton resetFilters",
                    "action": resetFilters
                },
                {
                    "text": 'Expand',
                    "titleAttr": 'Temporarily expand all',
                    "className": "tableHeaderColumnButton toggleExpansion",
                    "action": toggleExpandCollapseRestore
                },
                "columnsToggle",
                {
                    "extend": "copyHtml5",
                    "className": "tableHeaderColumnButton exportFunctions",
                    "exportOptions": {
                        "columns": ":visible",
                        "stripHtml": false,
                        "orthogonal": "export"
                    }
                },
                {
                    "extend": "print",
                    "className": "tableHeaderColumnButton exportFunctions",
                    "exportOptions": {
                        "columns": ":visible",
                        "stripHtml": false,
                        "orthogonal": "print"
                    }
                },
                {
                    "extend": "csvHtml5",
                    "className": "tableHeaderColumnButton exportFunctions",
                    "exportOptions": {
                        "columns": ":visible",
                        "stripHtml": false,
                        "orthogonal": "export"
                    },
                    "customize": customizeCSV
                }
            ],
        },
        "lengthMenu": [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
        "search": {"regex": localStorage.getItem("regexSearch") === "true"},
        "stateSave": true
    });

    //Prevents sorting the columns when clicking on the sorting headers
    $('table#dataGroupTable thead th input').on('click', function (e) {
        e.stopPropagation();
    });

    // Apply the search
    siteData.dataGroupTable.columns().every( function () {
        var that = this;
        $( 'input', this.header() ).on( 'keyup change input search', function () {
            if ( that.search() !== this.value ) {
                that
                    .search( this.value, localStorage.getItem("regexSearch") === "true", false )
                    .draw();
            }
        });
    });

    // highlight matches
    siteData.dataGroupTable.on('draw', function () {
        // reset toggleExpansion button
        var button = $('div#dataGroupTable_wrapper div.dt-buttons button.toggleExpansion');
        button[0].innerHTML = '<span>Expand<span>'
        button[0].title = 'Temporarily expand all';

        toggleAdcLinks();
        highlightAll(siteData.dataGroupTable);
        expandMatches(siteData.dataGroupTable.table().body())
    });

    siteData.dataGroupTable.draw();
}

function setupCertificateTable() {

    if (siteData.certificateTable) {
        return;
    }

    var content = `
    <table id="certificateTable" class="bigiptable display">
        <thead>
            <tr>
                <th class="loadbalancerHeaderCell"><span style="display: none;">Load Balancer</span><input type="search" class="search" placeholder="Load Balancer" /></th>
                <th><span style="display: none;">Name</span><input type="search" class="search" placeholder="Name" /></th>
                <th><span style="display: none;">Common Name</span><input type="search" class="search" placeholder="Common Name" /></th>
                <th><span style="display: none;">SAN</span><input type="search" class="search" placeholder="SAN" /></th>
                <th><span style="display: none;">Country</span><input type="search" class="search" placeholder="Country Name" /></th>
                <th><span style="display: none;">State</span><input type="search" class="search" placeholder="State Name" /></th>
                <th><span style="display: none;">Org</span><input type="search" class="search" placeholder="Organization Name" /></th>
                <th><span style="display: none;">Expiring</span><input type="search" class="search" placeholder="Expiring" /></th>
            </tr>
        </thead>
        <tbody>
        </tbody>
    </table>`;

    $("div#certificatedetails").html(content);

    siteData.certificateTable = $("div#certificatedetails table#certificateTable").DataTable({
        "autoWidth": false,
        "deferRender": true,
        "data": siteData.certificates,
        "columns": [{
            "data": "loadbalancer",
            "className": "loadbalancerCell",
            "render": function (data, type, row) {
                return renderLoadBalancer(data, type);
            }
        }, {
            "data": "fileName",
            "render": function(data, type, row) {
                return renderCertificate(row.loadbalancer, data, type);
            }
        }, {
            "data": "subject.commonName"
        }, {
            "data": "subjectAlternativeName",
            "visible": false
        }, {
            "data": "subject.countryName",
            "class": "certificatecountryname",
            "render": function(data, type, row) {
                result = '';
                if (data) {
                    result += "<img class=\"flagicon\" alt=\"" + data.toLowerCase() + "\" src=\"images/flags/" + data.toLowerCase() + ".png\"/> ";
                }
                return result + " " + data;
            },
            "visible": false
        }, {
            "data": "subject.stateName",
            "visible": false
        }, {
            "data": "subject.organizationName"
        }, {
            "data": "expirationDate",
            "render": function(data, type, row){
                var certificateDate = new Date(0);
                certificateDate.setUTCSeconds(data);
                return certificateDate.toISOString().replace("T", " ").replace(/\.[0-9]{3}Z/, "");
            }
        }],
        "createdRow": function(row, data, index) {
            // Get the days left
            var now = new Date();
            var certificateDate = new Date(0);
            certificateDate.setUTCSeconds(data.expirationDate);
            var daysLeft = dateDiffInDays(now, certificateDate);

            if (daysLeft < 14) {
                var rowClass = "certificateExpiringIn14";
            } else if (daysLeft < 30) {
                var rowClass = "certificateExpiringIn30";
            } else if (daysLeft < 60) {
                var rowClass = "certificateExpiringIn60"
            } else {
                var rowClass = "certificateExpiringInMoreThan60"
            }
            $(row).addClass(rowClass);
        },
        "iDisplayLength": 10,
        "oLanguage": {
            "sSearch": "Search all columns:"
        },
        "dom": 'fBrtilp',
        "buttons": {
            "buttons": [
                {
                    "text": 'Reset filters',
                    "className": "tableHeaderColumnButton resetFilters",
                    "action": resetFilters
                },
                "columnsToggle",
                {
                    "extend": "copyHtml5",
                    "className": "tableHeaderColumnButton exportFunctions",
                    "exportOptions": {
                        "columns": ":visible",
                        "stripHtml": false,
                        "orthogonal": "export"
                    }
                },
                {
                    "extend": "print",
                    "className": "tableHeaderColumnButton exportFunctions",
                    "exportOptions": {
                        "columns": ":visible",
                        "stripHtml": false,
                        "orthogonal": "print"
                    }
                },
                {
                    "extend": "csvHtml5",
                    "className": "tableHeaderColumnButton exportFunctions",
                    "exportOptions": {
                        "columns": ":visible",
                        "stripHtml": false,
                        "orthogonal": "export"
                    },
                    "customize": customizeCSV
                }
            ]
        },
        "lengthMenu": [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
        "search": {"regex": localStorage.getItem("regexSearch") === "true"},
        "stateSave": true
    });

    //Prevents sorting the columns when clicking on the sorting headers
    $('table#certifcateTable thead th input').on('click', function (e) {
        e.stopPropagation();
    });

    // Apply the search
    siteData.certificateTable.columns().every( function () {
        var that = this;
        $( 'input', this.header() ).on( 'keyup change input search', function () {
            if ( that.search() !== this.value ) {
                that
                    .search( this.value, localStorage.getItem("regexSearch") === "true", false )
                    .draw();
            }
        });
    });

    // Highlight matches
    siteData.certificateTable.on('draw', function () {
        toggleAdcLinks();
        highlightAll(siteData.certificateTable);
    });

    siteData.certificateTable.draw();
}

function setupLogsTable() {

    if (siteData.logTable) {
        return;
    }

    var content = `
    <table id="logstable" class="bigiptable display">
        <thead>
            <tr>
                <th><span style="display: none;">DateTime</span><input type="search" class="search" placeholder="DateTime" /></th>
                <th><span style="display: none;">Severity</span><input type="search" class="search" placeholder="Severity" /></th>
                <th><span style="display: none;">Log Content</span><input type="search" class="search" placeholder="Log Content" /></th>
            </tr>
        </thead>
        <tbody>
        </tbody>
    </table>`;

    $("div#logs").html(content);

    siteData.logTable = $("div#logs table#logstable").DataTable({
        "autoWidth": false,
        "deferRender": true,
        "data": siteData.loggedErrors,
        "columns": [{
            "data": "datetime",
            "className": "logdatetime"
        }, {
            "data": "severity"
        }, {
            "data": "message"
        }],
        "iDisplayLength": 10,
        "oLanguage": {
            "sSearch": "Search all columns:"
        },
        "dom": 'fBrtilp',
        "buttons": {
            "buttons": [
                {
                    "text": 'Reset filters',
                    "className": "tableHeaderColumnButton resetFilters",
                    "action": resetFilters
                },
                "columnsToggle",
                {
                    "extend": "copyHtml5",
                    "className": "tableHeaderColumnButton exportFunctions",
                    "exportOptions": {
                        "columns": ":visible",
                        "stripHtml": false,
                        "orthogonal": "export"
                    }
                },
                {
                    "extend": "print",
                    "className": "tableHeaderColumnButton exportFunctions",
                    "exportOptions": {
                        "columns": ":visible",
                        "stripHtml": false,
                        "orthogonal": "print"
                    }
                },
                {
                    "extend": "csvHtml5",
                    "className": "tableHeaderColumnButton exportFunctions",
                    "exportOptions": {
                        "columns": ":visible",
                        "stripHtml": false,
                        "orthogonal": "export"
                    },
                    "customize": customizeCSV
                }
            ]
        },
        "createdRow": function(row, data, index) {
            if (data && data.severity) {
                $('td', row).eq(1).addClass( 'logseverity' + data.severity.toLowerCase() );
            }
        },
        "lengthMenu": [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
        "search": {"regex": localStorage.getItem("regexSearch") === "true"},
        "stateSave": true
    });

    //Prevents sorting the columns when clicking on the sorting headers
    $('table#logstable thead th input').on('click', function (e) {
        e.stopPropagation();
    });

    // Apply the search
    siteData.logTable.columns().every( function () {
        var that = this;
        $( 'input', this.header() ).on( 'keyup change input search', function () {
            if ( that.search() !== this.value ) {
                that
                    .search( this.value, localStorage.getItem("regexSearch") === "true", false )
                    .draw();
            }
        });
    });

    // Highlight matches
    siteData.logTable.on('draw', function () {
        toggleAdcLinks();
        highlightAll(siteData.logTable);
    });

    siteData.logTable.draw();
}

function hideMainSection() {
    $("div.mainsection").hide();
}

function showMainSection(section) {
    hideMainSection();
    $("div#" + section).fadeIn(10, updateLocationHash);
}

function showVirtualServers(updatehash) {

    hideMainSection();
    setupVirtualServerTable();
    activateMenuButton("div#virtualserversbutton");
    $("div#mainholder").attr("data-activesection", "virtualservers");
    updateLocationHash(updatehash);

    showMainSection("virtualservers")
}

function showiRules(updatehash) {

    hideMainSection();
    setupiRuleTable();
    activateMenuButton("div#irulesbutton");
    $("div#mainholder").attr("data-activesection", "irules");
    updateLocationHash(updatehash);

    showMainSection("irules");
    toggleAdcLinks();
}

function showPools(updatehash) {

    hideMainSection();
    setupPoolTable();
    activateMenuButton("div#poolsbutton");
    $("div#mainholder").attr("data-activesection", "pools");
    updateLocationHash(updatehash);

    showMainSection("pools");
    toggleAdcLinks();
}

function showDataGroups(updatehash) {

    hideMainSection();
    setupDataGroupTable();
    activateMenuButton("div#datagroupbutton");
    $("div#mainholder").attr("data-activesection", "datagroups");
    updateLocationHash(updatehash);

    showMainSection("datagroups");
    toggleAdcLinks();
}

function showPreferences(updatehash) {

    hideMainSection();
    activateMenuButton($("div#preferencesbutton"));
    $("div#mainholder").attr("data-activesection", "preferences");
    updateLocationHash(updatehash);

    //Prepare the content
    var settingsContent = `
                        <table id="preferencestable" class="bigiptable display">

                            <thead>
                                <tr>
                                    <th colspan=2>Generic settings</th>
                                </tr>
                            </thead>

                            <tbody>
                                <tr><td>Expand all pool members</td><td class="preferencescheckbox"><input type="checkbox" id="autoExpandPools"></td></tr>
                                <tr><td>Direct links to Big-IP objects</td><td class="preferencescheckbox"><input type="checkbox" id="adcLinks"></td></tr>
                                <tr><td>Use Regular Expressions when searching</td><td class="preferencescheckbox"><input type="checkbox" id="regexSearch"></td></tr>
                            </tbody>

                        </table>
`

    //Populate the content
    $("div#preferences").html(settingsContent);

    //Populate the settings according to the local storage or default settings if none exist
    $("#autoExpandPools").prop("checked", localStorage.getItem("autoExpandPools") === "true");
    $("#adcLinks").prop("checked", localStorage.getItem("showAdcLinks") === "true");
    $("#regexSearch").prop("checked", localStorage.getItem("regexSearch") === "true");

    // if we change content rendering rules, we can redraw with:
    // siteData.bigipTable.clear().rows.add(siteData.virtualservers).draw();
    // we could make siteData.preferences.HideLoadBalancerFQDN dynamic this way. Might want to redraw all tables.

    //Event handler for auto expand pools
    $("#autoExpandPools").on("click", function () {
        localStorage.setItem("autoExpandPools", this.checked);
        if (siteData.bigipTable) {
            siteData.bigipTable.draw();
        }
    });

    //Event handler for showing ADC edit links
    $("#adcLinks").on("click", function () {
        localStorage.setItem("showAdcLinks", this.checked);
        toggleAdcLinks();
    });

    //Event handler for regular expression searches
    $("#regexSearch").on("click", function () {
        localStorage.setItem("regexSearch", this.checked);
        toggleRegexSearch();
    });

    //Make sure that the check boxes are checked according to the settings
    $("#allbigips thead th input").each(function () {
        var columnID = $(this).attr("data-setting-name");
        $("#" + columnID).prop("checked", localStorage.getItem(columnID) === "true");
    });

    showMainSection("preferences");
}

function showCertificateDetails() {

    hideMainSection();
    setupCertificateTable();
    activateMenuButton("div#certificatebutton");
    $("div#mainholder").attr("data-activesection", "certificatedetails");
    updateLocationHash();

    showMainSection("certificatedetails");

}

function showDeviceOverview() {

    hideMainSection();
    activateMenuButton("div#deviceoverviewbutton");
    $("div#mainholder").attr("data-activesection", "deviceoverview");
    updateLocationHash();

    var deviceGroups = siteData.deviceGroups
    var loadbalancers = siteData.loadbalancers

    var html = `
            <table id="deviceoverviewtable" class="bigiptable display">
                <thead>
                    <tr>
                        <th>Icon</th>
                        <th>Device Group</th>
                        <th>Name</th>
                        <th>Model</th>
                        <th>Type</th>
                        <th>Version</th>
                        <th>Serial</th>
                        <th>Management</th>
                        <th>Polling</th>
                    </tr>
                </thead>
                <tbody>`;

    for (var d in deviceGroups) {

        var firstDevice = true;
        var deviceGroup = deviceGroups[d];

        // Get an icon from a functioning device, if any

        var icon = "";
        var successFound = false;

        for (var i in deviceGroup.ips) {

            var loadbalancer = siteData.loadbalancers.find(function (o) {
                return o.ip === deviceGroup.ips[i];
            }) || false;

            if (loadbalancer.success) {

                var model = loadbalancer.model.toUpperCase();
                var deviceData = siteData.knownDevices[model] || false;
                successFound = true;

                if (deviceData) {
                    icon = deviceData.icon;
                    break;
                }
            }

        }

        if (icon === "" && successFound) {
            icon = "images/deviceicons/unknowndevice.png";
        } else if (icon === "") {
            icon = "images/faileddevice.png";
        }

        for (var i in deviceGroup.ips) {

            var loadbalancer = siteData.loadbalancers.find(function (o) {
                return o.ip === deviceGroup.ips[i];
            }) || false;

            var pollingStatus = "N/A";

            if (loadbalancer.success) {

                var deviceData = siteData.knownDevices[loadbalancer.model] || false;

                if (loadbalancer.active || loadbalancer.isonlydevice) {

                    if (loadbalancer.statusvip.url === "") {
                        pollingStatus = "<span class=\"devicepollingnotconfigured\">Not configured</span>";
                    } else if (loadbalancer.statusvip.working) {
                        pollingStatus = "<span class=\"devicepollingsuccess\">Working</span>";
                    } else {
                        pollingStatus = "<span class=\"devicepollingfailed\">Failed</span>";;
                    }
                } else {
                    pollingStatus = "N/A (passive device)"
                }

            }

            if (firstDevice) {
                html += "<tr><td rowspan=\"" + deviceGroup.ips.length + "\" class=\"deviceiconcell\"><img class=\"deviceicon\" alt=\"deviceicon\" src=\"" + icon +
                    "\"/></td><td class=\"devicenamecell\" rowspan=\"" + deviceGroup.ips.length + "\">" + deviceGroup.name + "</td>";
                firstDevice = false;
            } else {
                html += "<tr>";
            }

            var devicestatus = (loadbalancer.color || "red");
            html += "<td class=\"devicenamecell\"><img class=\"devicestatusicon\" alt=\"" + devicestatus + "\" src=\"images/devicestatus" + devicestatus + ".png\"/>" +
                (loadbalancer.name ? renderLoadBalancer(loadbalancer.name, 'display') : "<span class=\"devicefailed\">Failed to index</span>") +
                "</td><td>" + (loadbalancer.category || "N/A") + "</td><td>" +
                (loadbalancer.model || "N/A") + "</td><td>" + (loadbalancer.version || "N/A") + "</td><td>" + loadbalancer.serial + "</td><td>" +
                loadbalancer.ip + "</td><td>" + pollingStatus + "</td></tr>";

        }

    }

    html += `
                </tbody>
            </table>`

    $("div#deviceoverview").html(html);
    showMainSection("deviceoverview");

}

function showLogs(updatehash) {

    hideMainSection();
    setupLogsTable();
    activateMenuButton($("div#logsbutton"));
    $("div#mainholder").attr("data-activesection", "logs");

    updateLocationHash(updatehash);

    showMainSection("logs");

}

function showHelp(updatehash) {

    hideMainSection();
    activateMenuButton("div#helpbutton");
    $("div#mainholder").attr("data-activesection", "help");
    updateLocationHash(updatehash);

    showMainSection("helpcontent")

}


function log(message, severity = null, datetime = null) {

    if (!datetime) {
        var now = new Date();
        const offset = now.getTimezoneOffset();
        now = new Date(now.getTime() - (offset*60000));
        var dateArr = now.toISOString().split("T")

        datetime = dateArr[0] + ' ' + dateArr[1].replace(/\.[0-9]+Z$/, "");
    }

    var severityClass;

    switch (severity) {
        case "ERROR":
            severityClass = "logseverityerror";
            break;
        default:
            severityClass = "logseverityinfo";
    }

    siteData.loggedErrors.push({
        'datetime': datetime,
        'severity': severity,
        'message': message,
    });

    if (siteData.logTable) {
        siteData.logTable.destroy();
        siteData.logTable = false;
        setupLogsTable();
    }

}

function toggleAdcLinks() {
    if (localStorage.getItem("showAdcLinks") === "false") {
        $(".adcLinkSpan").hide();
    } else {
        $(".adcLinkSpan").show();
    }
}

function toggleRegexSearch() {
    var regexSearch = localStorage.getItem("regexSearch") === "true";
    // internal flag: siteData.poolTable.context['0'].oPreviousSearch.bRegex
    tables = [
        siteData.bigipTable,
        siteData.poolTable,
        siteData.iRuleTable,
        siteData.dataGroupTable,
        siteData.certificateTable,
        siteData.logTable];
    tables.forEach((table) => {
        if (table) {
            table.search(table.search(), regexSearch, !regexSearch).draw();
        }
    });
}

function updateLocationHash(updatehash = true) {

    var parameters = [];

    var activeSection = $("div#mainholder").attr("data-activesection");
    parameters.push("mainsection=" + activeSection);


    $('table#allbigips thead tr th input').each(function () {
        if(this.value !== ''){
            parameters.push(this.name + "=" + this.value);
        }
    });

    var global_search = $('#allbigips_filter label input').val();

    if (global_search && global_search != "") {
        parameters.push("global_search" + '=' + global_search);
    }

    $("div.lightboxcontent:visible").each(function (i, e) {
        var type = $(this).attr("data-type");
        var objectName = $(this).attr("data-objectname");
        var loadbalancer = $(this).attr("data-loadbalancer");

        parameters.push(type + "=" + objectName + "@" + loadbalancer);
    });

    if (updatehash) {
        window.location.hash = parameters.join("&");
    }
}

/******************************************************************************************************************************
    Expands all pool matches in the main table when searching
******************************************************************************************************************************/

function expandPoolMatches(resultset, searchstring) {
    if (localStorage.autoExpandPools !== "true" && searchstring != '') {
        //$(resultset).children().children().filter("td:icontains('" + searchstring + "')").each(function () {
        $(resultset).children().children().filter("td:has(span.highlight)").each(function () {
            if (this.classList.contains("PoolCell") || this.classList.contains("relative")) {
                togglePool(this.id);
            }
        });
    }
}

function expandMatches(resultset) {
    $(resultset).find('details').removeAttr('open');
    $(resultset).find('details:has(span.highlight)').attr('open', '');
}

function resetFilters( e, dt, node, config ) {
    $(dt.header()).find('input').val('');
    dt.search('')
        .columns().search('')
        .draw();
}

function toggleExpandCollapseRestore(e, dt, node, config) {
    switch(node['0'].innerText) {
        case 'Expand':
            $(dt.table().body()).find('details').attr('open','');
            node['0'].innerHTML = '<span>Collapse</span>';
            node['0'].title = 'Temporarily collapse all';
            break;
        case 'Collapse':
            $(dt.table().body()).find('details').removeAttr('open');
            node['0'].innerHTML = '<span>Restore</span>';
            node['0'].title = 'Restore normal expansion';
            break;
        case 'Restore':
            hidePools(true);
            expandMatches($(dt.table().body()));
            node['0'].innerHTML = '<span>Expand</span>';
            node['0'].title = 'Temporarily expand all';
            break;
    }
}

/******************************************************************************************************************************
    Collapses all pool cells in the main table
******************************************************************************************************************************/

function hidePools(hide = !(localStorage.autoExpandPools === "true")) {
    if (hide) {
        $('.pooltablediv').hide();
        $('.collapse').hide();
        $('.expand').show();
        $('.AssociatedPoolsInfo').show();
    } else {
        $(".AssociatedPoolsInfo").hide();
        $('.expand').hide();
        $('.collapse').show();
        $('.pooltablediv').show();
    }
}

/******************************************************************************************************************************
    Expands/collapses a pool cell based on the tid (toggle id)
******************************************************************************************************************************/

function togglePool(tid) {

    //Store the current window selection
    var selection = window.getSelection();

    //If no text is selected, go ahead and expand or collapse the pool
    if (selection.type != "Range") {
        if ($("#PoolCell-" + tid).is(":visible")) {
            $('#AssociatedPoolsInfo-' + tid).show();
            $('#expand-' + tid).show();
            $('#collapse-' + tid).hide();
            $('#PoolCell-' + tid).hide();
        } else {
            $('#AssociatedPoolsInfo-' + tid).hide();
            $('#expand-' + tid).hide();
            $('#collapse-' + tid).show();
            $('#PoolCell-' + tid).fadeIn(300);
        }
    }
}

/******************************************************************************************************************************
    Set the max width of the pool cells in order to make the member column align
******************************************************************************************************************************/

function setPoolTableCellWidth() {

    var maxwidth = 0

    $('.poolname').each(function (i, obj) {
        if (obj.offsetWidth > maxwidth) {
            maxwidth = obj.offsetWidth
        }
    });

    $('.poolname').each(function (i, obj) {
        if (obj.offsetWidth < maxwidth) {
            obj.style.width = maxwidth
        }
    });

    var maxwidth = 0
    $('.PoolMember').each(function (i, obj) {
        if (obj.offsetWidth > maxwidth) {
            maxwidth = obj.offsetWidth
        }
    });

    $('.PoolMember').each(function (i, obj) {
        if (obj.offsetWidth < maxwidth) {
            obj.style.width = maxwidth
        }
    });
}

/******************************************************************************************************************************
    Handles the highlight of content when searching
******************************************************************************************************************************/

function togglePoolHighlight(e) {
    if (e.style.backgroundColor == "") {
        $('.' + e.className).css('background-color', '#BCD4EC');
    } else {
        $('.' + e.className).css('background-color', '');
    }
}


/********************************************************************************************************************************************************************************************

    Functions related to showing the pool details lightbox

********************************************************************************************************************************************************************************************/

/**********************************************************************************************************************
    Translates the status and availability of a member to less cryptic text and returns a dictionary
**********************************************************************************************************************/

function translateStatus(member) {

    translatedstatus = {
        availability: "",
        enabled: "",
        realtime: ""
    };

    switch (member.availability) {
        case "AVAILABILITY_STATUS_GREEN":
            translatedstatus['availability'] = "<span class=\"memberup\">UP</span>";
            break;
        case "AVAILABILITY_STATUS_BLUE":
            translatedstatus['availability'] = "<span class=\"memberunknown\">UNKNOWN</span>";
            break;
        default:
            translatedstatus['availability'] = "<span class=\"memberdown\">DOWN</span>";
    }

    switch (member.enabled) {
        case "ENABLED_STATUS_ENABLED":
            translatedstatus['enabled'] = "<span class=\"memberenabled\">Enabled</span>";
            break;
        case "ENABLED_STATUS_DISABLED_BY_PARENT":
            translatedstatus['enabled'] = "<span class=\"memberdisabled\">Disabled by parent</span>";
            break;
        case "ENABLED_STATUS_DISABLED":
            translatedstatus['enabled'] = "<span class=\"memberdisabled\">Disabled</span>";
            break;
        default:
            translatedstatus['enabled'] = "<span class=\"memberunknown\">Unknown</span>";
    }

    switch (member.realtimestatus) {
        case "up":
            translatedstatus["realtime"] = "<span class=\"memberup\">UP</span>";
            break;
        case "down":
            translatedstatus["realtime"] = "<span class=\"memberdown\">DOWN</span>";
            break;
        case "session_disabled":
            translatedstatus["realtime"] = "<span class=\"memberdisabled\">DISABLED</span>";
            break;
        default:
            translatedstatus["realtime"] = (member.realtimestatus || "N/A").toUpperCase();
    }

    return translatedstatus;

}

/**********************************************************************************************************************
    Put the cursor in the input field holding the command and selects the text
**********************************************************************************************************************/

function selectMonitorInpuText(e) {
    $(e).find("p input").focus();
    $(e).find("p input").select();
}

/**********************************************************************************************************************
    Takes a monitor send string as parameter and returns a request object
**********************************************************************************************************************/

function getMonitorRequestParameters(sendstring) {

    var request = {
        verb: "",
        uri: "",
        headers: []
    }

    var lines = sendstring.split(/\\r\\n|\\\\r\\\\n/);

    var sendstringarr = lines[0].split(" ");

    request['verb'] = sendstringarr[0];
    request['uri'] = sendstringarr[1];
    request['version'] = sendstringarr[2];


    if (lines.length > 1) {

        for (i = 1; i < lines.length; i++) {

            var header = lines[i];

            if (header.indexOf(":") >= 0) {
                if (header.split(":").length == 2) {
                    request["headers"].push(header);
                }
            }
        }
    }

    return request
}

/**********************************************************************************************************************
    Shows the virtual server details light box
**********************************************************************************************************************/

function showVirtualServerDetails(virtualserver, loadbalancer) {

    var virtualservers = siteData.virtualservers;
    var matchingvirtualserver = "";

    //Find the matching pool from the JSON object
    for (var i in virtualservers) {
        if (virtualservers[i].name == virtualserver && virtualservers[i].loadbalancer == loadbalancer) {
            matchingvirtualserver = virtualservers[i]
        }
    }

    //If a pool was found, populate the pool details table and display it on the page
    if (matchingvirtualserver != "") {

        var html = '<div class="virtualserverdetailsheader">'
        html += '<span>Virtual Server: ' + matchingvirtualserver.name + "</span><br>";
        html += "<span>Load Balancer: " + renderLoadBalancer(matchingvirtualserver.loadbalancer, 'display') + "</span>";
        html += "</div>";

        $("div#firstlayerdetailscontentdiv").attr("data-type", "virtualserver");
        $("div#firstlayerdetailscontentdiv").attr("data-objectname", matchingvirtualserver.name);
        $("div#firstlayerdetailscontentdiv").attr("data-loadbalancer", matchingvirtualserver.loadbalancer);

        switch (matchingvirtualserver.sourcexlatetype) {
            case "snat":
                var xlate = "SNAT:" + matchingvirtualserver.sourcexlatepool;
                break;
            default:
                var xlate = matchingvirtualserver.sourcexlatetype || "Unknown";
        }

        var trafficGroup = matchingvirtualserver.trafficgroup || "N/A"
        var defaultPool = matchingvirtualserver.defaultpool || "N/A"
        var description = matchingvirtualserver.description || ""

        //Build the table and headers
        var table = '<table class="virtualserverdetailstablewrapper">';
        table += '    <tbody>';

        //First row containing simple properties in two cells which in turn contains subtables
        table += '        <tr>';
        table += '            <td>';

        //Subtable 1
        table += '                <table class="virtualserverdetailstable">';
        table += '                    <tr><th>Name</th><td>' + matchingvirtualserver.name + '</td></tr>';
        table += '                    <tr><th>IP:Port</th><td>' + matchingvirtualserver.ip + ':' + matchingvirtualserver.port + '</td></tr>';
        table += '                    <tr><th>Default pool</th><td>' + renderPool(loadbalancer, defaultPool, 'display') + '</td></tr>';
        table += '                    <tr><th>Traffic Group</th><td>' + trafficGroup + '</td></tr>';
        table += '                    <tr><th>Description</th><td>' + description + '</td></tr>';
        table += '                </table>';
        table += '            </td>';

        //Subtable 2
        table += '            <td>';
        table += '                <table class="virtualserverdetailstable">';
        table += '                    <tr><th>Client SSL Profile</th><td>' + matchingvirtualserver.sslprofileclient.join('<br>') + '</td></tr>';
        table += '                    <tr><th>Server SSL Profile</th><td>' + matchingvirtualserver.sslprofileserver.join('<br>') + '</td></tr>';
        table += '                    <tr><th>Compression Profile</th><td>' + matchingvirtualserver.compressionprofile + '</td></tr>';
        table += '                    <tr><th>Persistence Profiles</th><td>' + matchingvirtualserver.persistence.join('<br>') + '</td></tr>';
        table += '                    <tr><th>Source Translation</th><td>' + xlate + '</td></tr>';
        table += '                </table>';
        table += '            </td>';
        table += '        </tr>';
        table += '    </tbody>';
        table += '</table>';
        table += '<br>';

        table += '<table class="virtualserverdetailstable">';
        table += '    <tr><th>Current Connections</th><th>Maximum Connections</th><th>5 second average CPU usage</th><th>1 minute average CPU usage</th>' +
                    '<th>5 minute average CPU usage</th></tr>';
        table += '    <tr><td>' + matchingvirtualserver.currentconnections + '</td><td>' + matchingvirtualserver.maximumconnections + '</td><td>' +
                matchingvirtualserver.cpuavg5sec + '</td><td>' + matchingvirtualserver.cpuavg1min + '</td><td>' + matchingvirtualserver.cpuavg5min + '</td></tr>';
        table += '</table>';

        table += '<br>'

        if (siteData.preferences.ShowiRules == true) {
            if (matchingvirtualserver.irules.length > 0) {
                //Add the assigned irules
                table += '<table class="virtualserverdetailstable">';

                if (siteData.preferences.ShowiRuleLinks) {
                    table += '    <tr><th>iRule name</th><th>Data groups</th></tr>';
                } else {
                    table += '    <tr><th>iRule name</th></tr>';
                }

                for (var i in matchingvirtualserver.irules) {

                    // If iRules linking has been set to true show iRule links
                    // and parse data groups
                    if (siteData.preferences.ShowiRuleLinks) {

                        var iruleobj = getiRule(matchingvirtualserver.irules[i], loadbalancer);

                        if (Object.keys(iruleobj).length === 0) {
                            table += '    <tr><td>' + matchingvirtualserver.irules[i] + '</td><td>N/A (empty rule)</td></tr>';
                        } else {

                            var datagroupdata = [];
                            if (iruleobj.datagroups && iruleobj.datagroups.length > 0) {
                                iruleobj.datagroups.forEach((datagroup) => {
                                    name = datagroup.split("/")[2];

                                    if (siteData.preferences.ShowDataGroupLinks) {
                                        datagroupdata.push(renderDataGroup(loadbalancer, datagroup, 'display'));
                                    } else {
                                        datagroupdata.push(name)
                                    }
                                });
                            } else {
                                datagroupdata.push("N/A");
                            }

                            table += '    <tr><td>' + renderRule(loadbalancer, iruleobj.name, 'display') + '</td><td>' + datagroupdata.join("<br>") + '</td></tr>';
                        }
                    } else {
                        table += '    <tr><td>' + matchingvirtualserver.irules[i] + '</td></tr>';
                    }
                }

                table += '</table>';
            }
        }

        html += table;

    } else {
        var html = `<div id="objectnotfound">
            <h1>No matching Virtual Server was found</h1>

            <h4>What happened?</h4>
            When clicking the report it will parse the JSON data to find the matching Virtual Server and display the details. However, in this case it was not able to find any matching Virtual Server.

            <h4>Possible reason</h4>
            This might happen if the report is being updated as you navigate to the page.
            If you see this page often, please report a bug <a href="https://devcentral.f5.com/codeshare/bigip-report">DevCentral</a>.

            <h4>Possible solutions</h4>
            Refresh the page and try again.

        </div>`
    }

    $('a#closefirstlayerbutton').text("Close virtual server details");
    $("#firstlayerdetailscontentdiv").html(html);
    $("#firstlayerdiv").fadeIn(updateLocationHash);
    toggleAdcLinks();

}

/**********************************************************************************************************************
    Returns a matching irules object from the irules json data
**********************************************************************************************************************/

function getiRule(irule, loadbalancer) {

    var irules = siteData.irules;
    var matchingirule = {};

    //Find the matching irule from the JSON object
    for (var i in irules) {
        if (irules[i].name == irule && irules[i].loadbalancer == loadbalancer) {
            matchingirule = irules[i];
        }
    }

    return matchingirule;
}

/**********************************************************************************************************************
    Shows the irule details light box
**********************************************************************************************************************/

function showiRuleDetails(irule, loadbalancer) {

    //Get the rule object from the json file
    matchingirule = getiRule(irule, loadbalancer)

    //If an irule was found, prepare the data to show it
    if (matchingirule != "") {

        //Populate the header
        var html = '<div class="iruledetailsheader">';
        html += '<span>iRule: ' + matchingirule.name + '</span><br>';
        html += "<span>Load Balancer: " + renderLoadBalancer(loadbalancer, 'display') + "</span>";
        html += '</div>';

        $("div#secondlayerdetailscontentdiv").attr("data-type", "irule");
        $("div#secondlayerdetailscontentdiv").attr("data-objectname", matchingirule.name);
        $("div#secondlayerdetailscontentdiv").attr("data-loadbalancer", matchingirule.loadbalancer);

        //Save the definition to a variable for some classic string mangling
        var definition = matchingirule.definition

        //Replace those tags with to be sure that the content won't be interpreted as HTML by the browser
        definition = definition.replace(/</g, "&lt;").replace(/>/g, "&gt;")

        //Check if data group links are wanted. Parse and create links if that's the base
        if (siteData.preferences.ShowDataGroupLinks == true) {
            matchingirule.datagroups.forEach((dg) => {
                // rule might not include partition which causes the replace to fail
                var opt=dg.replace(/\/.*\//,'($&)?');
                // prepare a regexp to replace all instances
                try {
                    // negative look behind is part of ES2018
                    // https://github.com/tc39/proposal-regexp-lookbehind
                    var regexp = new RegExp("((?<![\\w-])" + opt + "(?![\\w-]))", "gi");
                } catch (e) {
                    var regexp = new RegExp("(" + opt + ")\\b", "gi");
                }
                // Prepare the link
                var link = '<a href="Javascript:showDataGroupDetails(\'' + dg + '\', \'' + loadbalancer + '\')">$1</a>';
                // Do the actual replacement
                definition = definition.replace(regexp, link);
            })
            matchingirule.pools.forEach((pool) => {
                // rule might not include partition which causes the replace to fail
                var opt=pool.replace(/\/.*\//,'($&)?');
                // prepare a regexp to replace all instances
                try {
                    // negative look behind is part of ES2018
                    // https://github.com/tc39/proposal-regexp-lookbehind
                    var regexp = new RegExp("((?<![\\w-])" + opt + "(?![\\w-]))", "gi");
                } catch (e) {
                    var regexp = new RegExp("(" + opt + ")\\b", "gi");
                }
                // Prepare the link
                var link = '<a href="Javascript:showPoolDetails(\'' + pool + '\', \'' + loadbalancer + '\')">$1</a>';
                // Do the actual replacement
                definition = definition.replace(regexp, link);
            })
        }

        //Prepare the div content
        html += `<table class="bigiptable display">
                    <thead>
                        <tr><th>iRule definiton</th></tr>
                    </thead>
                    <tbody>
                    <tr><td><pre class="sh_tcl">` + definition + `</pre></td></tr>`

        if (matchingirule.virtualservers && matchingirule.virtualservers.length > 0) {
            html += `<tr><td>Used by ` + matchingirule.virtualservers.length + ` Virtual Servers:<br>` +
                    matchingirule.virtualservers.map(vs => renderVirtualServer(loadbalancer, vs, 'display')).join('<br>') + `</td></tr>`
        }

        html +=        `</tbody>
                </table>`
    }

    //Add the close button to the footer
    $("a#closesecondlayerbutton").text("Close irule details");
    //Add the div content to the page
    $("#secondlayerdetailscontentdiv").html(html);
    /* redo syntax highlighting */
    sh_highlightDocument('js/', '.js');
    //Show the div
    $("#secondlayerdiv").fadeIn(updateLocationHash);
    toggleAdcLinks();
}


/**********************************************************************************************************************
    Returns a matching data group object from the data group json data
**********************************************************************************************************************/

function getDataGroup(datagroup, loadbalancer) {

    var datagroups = siteData.datagroups;
    var matchingdatagroup = "";

    //Find the matching data group from the JSON object
    for (var i in datagroups) {
        if (datagroups[i].name == datagroup && datagroups[i].loadbalancer == loadbalancer) {
            matchingdatagroup = datagroups[i];
        }
    }

    return matchingdatagroup;
}


/**********************************************************************************************************************
    Displays a data group in a lightbox
**********************************************************************************************************************/

function showDataGroupDetails(datagroup, loadbalancer) {

    //Get a matching data group from the json data
    matchingdatagroup = getDataGroup(datagroup, loadbalancer)

    if (siteData.datagroupdetailsTable) {
        siteData.datagroupdetailsTable.destroy();
    }

    //If a pool was found, populate the pool details table and display it on the page
    if (matchingdatagroup != "") {

        $("div#secondlayerdetailscontentdiv").attr("data-type", "datagroup");
        $("div#secondlayerdetailscontentdiv").attr("data-objectname", matchingdatagroup.name);
        $("div#secondlayerdetailscontentdiv").attr("data-loadbalancer", matchingdatagroup.loadbalancer);

        var html = '<div class="datagroupdetailsheader">';
        html += "<span>Data group: " + matchingdatagroup.name + "</span><br>";
        html += "<span>Load Balancer: " + renderLoadBalancer(loadbalancer, 'display') + '</span><br>';
        html += '<span class="dgtype">Type: ' + matchingdatagroup.type + "</span>";
        html += '</div>';

        html += `<table id="datagroupdetailsTable" class="datagrouptable display">
                    <thead>
                        <tr>
                            <th class="keyheader">Key</th>
                            <th class="valueheader">Value</th>
                        </tr>
                    </thead>
                    <tbody>`;

        if (Object.keys(matchingdatagroup).length == 0) {
            html += "<tr class=\"emptydg\"><td colspan=\"2\">Empty data group</td></tr>";
        } else {
            siteData.datagroupdetailsTableData = $.map(matchingdatagroup.data, function(value, key) {
                return {"key": key, "value": value};
            });
        }

        html += '</tbody></table>'

        $("#secondlayerdetailscontentdiv").html(html);

        siteData.datagroupdetailsTable = $('table#datagroupdetailsTable').DataTable({
            "autoWidth": false,
            "pageLength": 10,
            "order": [],
            "language": {
                "search": "Search all columns:"
            },
            "data": siteData.datagroupdetailsTableData,
            "columns": [{
                "data": "key",
            }, {
                "data": "value",
                "render": function (data, type, row) {
                    if (data && data.match(/^http(s)?:/)) {
                        return '<a href="' + data + '">' + data + '</a>';
                    } else {
                        var pool = getPool("/Common/" + data, loadbalancer);
                        if (pool) {
                            // Click to see pool details
                            return renderPool(loadbalancer, pool.name, type)
                        } else {
                            return data;
                        }
                    }
                }
            }],
            "dom": 'frtilp',
            "lengthMenu": [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
            "search": {"regex": localStorage.getItem("regexSearch") === "true"},
            "stateSave": true
        });

    } else {
        $("#secondlayerdetailscontentdiv").html('');
    }

    $("a#closesecondlayerbutton").text("Close data group details");
    $("#secondlayerdiv").fadeIn(updateLocationHash);
}


/**********************************************************************************************************************
    Shows the pool details light box
**********************************************************************************************************************/

function showPoolDetails(pool, loadbalancer, layer = 'first') {

    var pools = siteData.pools;
    var matchingpool = siteData.poolsMap.get(loadbalancer + ':' + pool);

    updateLocationHash()

    //If a pool was found, populate the pool details table and display it on the page
    if (matchingpool != '') {

        //Build the table and headers
        $(`#${layer}layerdetailscontentdiv`).attr("data-type", "pool");
        $(`#${layer}layerdetailscontentdiv`).attr("data-objectname", matchingpool.name);
        $(`#${layer}layerdetailscontentdiv`).attr("data-loadbalancer", matchingpool.loadbalancer);

        var html = `<div class="pooldetailsheader">
                        <span>Pool: ${matchingpool.name}</span><br>
                        <span>Load Balancer: ${renderLoadBalancer(loadbalancer, 'display')}</span>
                    </div>`;

        var table = `
        <table class="pooldetailstable">
            <thead>
                <tr><th>Description</th><th>Load Balancing Method</th><th>Action On Service Down</th><th>Allow NAT</th><th>Allow SNAT</th></tr>
            </thead>
            <tbody>
                <tr>
                    <td>${(matchingpool.description || '')}</td>
                    <td>${matchingpool.loadbalancingmethod}</td>
                    <td>${matchingpool.actiononservicedown}</td>
                    <td>${matchingpool.allownat}</td>
                    <td>${matchingpool.allowsnat}</td>
                </tr>
            </tbody>
            </table>
            <br>
            <div class="monitordetailsheader">Member details</div>
                <table class="pooldetailstable">
                <thead><tr><th>Member Name</th><th>Member IP</th><th>Port</th><th>Priority Group</th><th>Connections</th>
                <th>Max Connections</th><th>Member Availability</th><th>Enabled</th><th>Member Status Description</th><th>Realtime Availability</th></tr></thead><tbody>`

        poolmonitors = matchingpool.monitors

        matchingmonitors = [];

        var monitors = siteData.monitors;

        for (var i in poolmonitors) {

            for (var x in monitors) {
                if (monitors[x].name == poolmonitors[i] && monitors[x].loadbalancer == loadbalancer) {
                    matchingmonitors.push(monitors[x]);
                }
            }
        }

        var members = matchingpool.members;

        for (var i in members) {

            var member = members[i];
            var memberstatus = translateStatus(member);

            table += `
                    <tr>
                        <td>${member.name}</td>
                        <td>${member.ip}</td>
                        <td>${member.port}</td>
                        <td>${member.priority}</td>
                        <td>${member.currentconnections}</td>
                        <td>${member.maximumconnections}</td>
                        <td>${memberstatus['availability']}</td>
                        <td>${memberstatus['enabled']}</td>
                        <td>${member.status}</td>
                        <td>${memberstatus.realtime}</td>
                    </tr>`;

        }

        table += `</tbody></table>
                    <br>`;

        if (matchingmonitors.length > 0) {

            table += '<div class="monitordetailsheader">Assigned monitors</div>';

            for (var i in matchingmonitors) {

                matchingmonitor = matchingmonitors[i];

                matchingmonitor.receivestring = matchingmonitor.receivestring.replace('<', '&lt;').replace('>', '&gt;');

                table += `
                        <table class="monitordetailstable">
                            <thead><tr><th colspan=2>${matchingmonitor.name}</th></thead>
                            <tbody>
                                <tr><td class="monitordetailstablerowheader"><b>Type</td><td>${matchingmonitor.type}</b></td></tr>
                                <tr><td class="monitordetailstablerowheader"><b>Send string</td><td>${matchingmonitor.sendstring}</b></td></tr>
                                <tr><td class="monitordetailstablerowheader"><b>Receive string</b></td><td>${matchingmonitor.receivestring}</td></tr>
                                <tr><td class="monitordetailstablerowheader"><b>Interval</b></td><td>${matchingmonitor.interval}</td></tr>
                                <tr><td class="monitordetailstablerowheader"><b>Timeout</b></td><td>${matchingmonitor.timeout}</td></tr>
                            </table>

                <table class="membermonitortable">
                    <thead>
                        <tr><th>Member Name</th><th>Member ip</th><th>Member Port</th><th>HTTP Link</th><th>Curl Link</th><th>Netcat Link</th>
                    </thead>
                    <tbody>`

                for (var x in members) {

                    let member = members[x];

                    let protocol = matchingmonitors[i].type.replace(/^TTYPE_/, '');

                    if(['HTTP', 'HTTPS', 'TCP', 'TCP_HALF_OPEN'].includes(protocol)){

                        let curllink, netcatlink, httplink
                        let sendstring = matchingmonitors[i].sendstring;

                        if(['HTTP', 'HTTPS'].includes(protocol)){

                            requestparameters = getMonitorRequestParameters(sendstring)

                            if (requestparameters['verb'] === 'GET' || requestparameters['verb'] === 'HEAD') {

                                var curlcommand = 'curl';

                                if (requestparameters['verb'] === 'HEAD') {
                                    curlcommand += ' -I'
                                }

                                if (requestparameters['version'] === 'HTTP/1.0') {
                                    curlcommand += ' -0'
                                }

                                for (var x in requestparameters['headers']) {

                                    header = requestparameters['headers'][x];
                                    headerarr = header.split(':');
                                    headername = headerarr[0].trim();
                                    headervalue = headerarr[1].trim();

                                    curlcommand += ` -H &quot;${headername}:${headervalue}&quot;`;
                                }

                                var url = `${protocol.toLowerCase()}://${member.ip}:${member.port}${requestparameters['uri']}`;
                                curlcommand += ` ${url}`;
                            }

                            curllink = `<a href="${url}" target="_blank" class="monitortest" onmouseover="javascript:selectMonitorInpuText(this)"
                            ' data-type="curl">curl<p>Curl command (CTRL+C)<input id="curlcommand" class="monitorcopybox" type="text" value="${curlcommand}"></p></a>`;
                        }

                        if(protocol === 'HTTP' || protocol === 'TCP' || protocol === 'TCP_HALF_OPEN'){
                            var netcatcommand = `echo -ne "${sendstring}" | nc ${member.ip} ${member.port}`;
                            netcatlink = `<a href="javascript:selectMonitorInpuText(this)" class="monitortest" onmouseover="javascript:selectMonitorInpuText(this)"
                            ' data-type="netcat">Netcat<p>Netcat command (CTRL+C)<input id="curlcommand" class="monitorcopybox" type="text" value=\'${netcatcommand}\'></p></a>`;
                        }

                        if(protocol === 'HTTP' || protocol === 'HTTPS'){
                            var url = `${protocol.toLowerCase()}://${member.ip}:${member.port}${requestparameters['uri']}`;
                            httplink = `<a href="${url}" target="_blank" class="monitortest" onmouseover="javascript:selectMonitorInpuText(this)"
                            data-type="http">HTTP<p>HTTP Link (CTL+C)<input id="curlcommand" class="monitorcopybox" type="text" value="${url}"></p></a>`
                        }

                        table += `<tr><td>${member.name}</td><td>${member.ip}</td><td>${member.port}</td><td>${httplink || 'N/A'}</td><td>${curllink || 'N/A'}</td><td>${netcatlink || 'N/A'}</td></tr>`;

                    } else {
                        table += `<tr><td>${member.name}</td><td>${member.ip}</td><td>${member.port}</td><td>N/A</td><td>N/A</td><td>N/A</td></tr>`;
                    }
                }

                table += `
                        </table>
                        <br>`
            }

            table += '</tbody></table>';
        }

        html += table;

    } else {
        var table = `<div id="objectnotfound">
            <h1>No matching Pool was found</h1>

            <h4>What happened?</h4>
            When clicking the report it will parse the JSON data to find the matching pool and display the details.
            However, in this case it was not able to find any matching pool.

            <h4>Possible reason</h4>
            This might happen if the report is being updated as you navigate to the page. If you see this page often,
            please report a bug <a href="https://devcentral.f5.com/codeshare/bigip-report">DevCentral</a>.

            <h4>Possible solutions</h4>
            Refresh the page and try again.

        </div>`
    }

    $(`a#close${layer}layerbutton`).text('Close pool details');
    $(`#${layer}layerdetailscontentdiv`).html(html);
    $(`#${layer}layerdiv`).fadeIn(updateLocationHash);
}

function exportDeviceData() {

    var loadbalancers = siteData.loadbalancers;
    var loadbalancersForExport = [];


    // Loop through the load balancers while anonymizing the data
    for (var i in loadbalancers) {

        loadbalancer = loadbalancers[i];
        var newLB = {};

        for (p in loadbalancer) {

            switch (p) {
                case "name":
                    newLB.name = "LB" + i;
                    break;
                case "serial":
                    newLB.serial = "XXXX-YYYY";
                    break;
                case "ip":
                    newLB.ip = "10.0.0." + i;
                    break;
                case "statusvip":

                    var statusvip = {}
                    statusvip.url = "";
                    statusvip.working = null;
                    statusvip.state = null;

                    newLB.statusvip = statusvip;

                default:
                    newLB[p] = loadbalancer[p];
            }
        }

        loadbalancersForExport.push(newLB);
    }

    downLoadTextFile(JSON.stringify(loadbalancersForExport, null, 4), "loadbalancers.json");

    // Loop through the device groups while anonymizing the data
    var deviceGroups = siteData.deviceGroups;
    var deviceGroupsForExport = [];

    for (var d in deviceGroups) {

        deviceGroup = deviceGroups[d];
        var newDeviceGroup = {};

        newDeviceGroup.name = "DG" + d;
        newDeviceGroup.ips = [];

        for (i in deviceGroup.ips) {
            newDeviceGroup.ips.push("10.0.0." + i);
        }

        newDeviceGroup.statusvip;

    }

    deviceGroupsForExport.push(newDeviceGroup);

    downLoadTextFile(JSON.stringify(deviceGroupsForExport, null, 4), "devicegroups.json");
}


function loadPreferences() {

    var preferences = siteData.preferences;

    for (var k in preferences) {
        if (localStorage.getItem(k) === null){ localStorage.setItem(k, preferences[k]) }
    }

}

function getPool(pool, loadbalancer) {
    return siteData.poolsMap.get(loadbalancer + ':' + pool);
}

function getVirtualServer(vs, loadbalancer) {

    return siteData.virtualservers.find(function (o) {
        return o.name === vs && o.loadbalancer === loadbalancer;
    }) || false;

}

function getLoadbalancer(loadbalancer) {

    return siteData.loadbalancers.find(function (o) {
        return o.name === loadbalancer;
    }) || false;

}

// a and b are javascript Date objects
function dateDiffInDays(a, b) {

    var _MS_PER_DAY = 1000 * 60 * 60 * 24;
    // Discard the time and time-zone information.
    var utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    var utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

    return Math.floor((utc2 - utc1) / _MS_PER_DAY);
}

function activateMenuButton(b) {
    $("div.menuitem").removeClass("menuitemactive");
    $(b).addClass("menuitemactive");
}

function customizeCSV(csv, button, datatable) {
    var csvRows = csv.split('\n');
    // bigip table uses value
    csvRows[0] = csvRows[0].replace(/<[^>]* value=""([^"]*)""[^>]*>/gi, '$1')
    // the rest of the tables have a span and a placeholder
    csvRows[0] = csvRows[0].replace(/<span[^>]*>[^<]*<\/span><[^>]* placeholder=""([^"]*)""[^>]*>/gi, '$1')
    return csvRows.join('\n');
}

function generateCSV() {

    var csv = "name,description,ip,port,sslprofileclient,sslprofileserver,compressionprofile,persistenceprofile,availability,enabled," +
        "currentconnections,cpuavg5sec,cpuavg1min,cpuavg5min,defaultpool,associated-pools,loadbalancer\n";


    var getMembers = function (pool) {

        var returnStr = ""

        var first = true;
        var firstmember = true;

        for (var m in pool.members) {
            if (!firstmember){ returnStr += ", "} else { firstmember = false;}
            var member = pool.members[m]
            returnStr += member.name + " (" + member.ip + ":" + member.port + ")";
        }

        return returnStr;
    }


    //$("#allbigips tbody tr.virtualserverrow").each(function () {
    siteData.bigipTable.rows({filter:'applied'}).data().each(function (vs) {

        var line = "";

        if (vs.name !== "N/A (Orphan pool)") {

            var line = vs.name + "," + (vs.description || "") + "," + (vs.ip || "") + "," + (vs.port || "") + ',"' + (vs.sslprofileclient || "None") + '","' +
                (vs.sslprofileserver || "None") + '",' +(vs.compressionprofile || "None") + "," + (vs.persistenceprofile || "None") + "," + vs.availability + "," +
                vs.enabled + "," + vs.currentconnections + "," + vs.cpuavg5sec + "," + vs.cpuavg1min + "," + vs.cpuavg5min + "," + (vs.defaultpool || "None") + ",";

            var firstpool = true;

            for (var p in vs.pools) {

                if (!firstpool){ line += "|"} else { firstpool = false }

                var pool = getPool(vs.pools[p], vs.loadbalancer);
                line += '"' + pool.name + ": ";

                line += getMembers(pool) + '"';
            }

            line += "," + vs.loadbalancer;

        }

        csv += line + "\n";

    })

    return (csv);
}

function downLoadTextFile(data, fileName) {

    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(data));
    element.setAttribute('download', fileName);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);

}

function downloadCSV() {

    var text = generateCSV();

    var d = new Date();

    var year = d.getFullYear();
    var month = d.getMonth();
    var day = d.getDay();

    if(month < 10){ month = "0" + month }
    if(day < 10){ day = "0" + day }

    var fileName = year + "-" + month + "-" + day + "-bigipreportexport.csv";

    downLoadTextFile(text, fileName);

}
