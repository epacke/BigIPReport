#! /usr/bin/pwsh
#Requires -Version 6
######################################################################################################################################
#
#        Copyright (C) 2016 Patrik Jonsson <patrik.jonsson#at#gmail-com>
#
#        This script is free: you can redistribute it and/or modify
#        it under the terms of the GNU General Public License as published by
#        the Free Software Foundation, either version 3 of the License, or
#        (at your option) any later version.
#
#        This script is distributed in the hope that it will be useful,
#        but WITHOUT ANY WARRANTY; without even the implied warranty of
#        MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#        GNU General Public License for more details.
#        You should have received a copy of the GNU General Public License
#        along with this program.  If not, see <http://www.gnu.org/licenses/>
#
#        Version      Date            Change                                                                        Author          Need Config update?
#        1.0          2013-02-04      Initial version                                                               Patrik Jonsson  -
#        1.7          2013-06-07      Fixed a bug regarding SSL profiles                                            Patrik Jonsson  -
#        1.8          2013-06-12      Removed the default pool from the pool list if it was set to "None"           Patrik Jonsson  -
#        1.9          2013-06-12      Added a link to be able to go back to the report after showing iRules.        Patrik Jonsson  -
#        2.0          2013-06-12      Adding more load balancers.                                                   Patrik Jonsson  -
#        2.1          2014-01-10      Fixing the re-initialization bug                                              Patrik Jonsson  -
#        2.2          2014-02-14      Adding send strings, receive strings, interval and timeout.                   Patrik Jonsson  -
#        2.3          2014-02-19      Made the caching more efficient (100% more) and fixed gpi white spaces.       Patrik Jonsson  -
#                                     Adding additional comments.                                                   Patrik Jonsson  -
#        2.4          2014-02-20      Adding case insensitive pool detection in irules.                             Patrik Jonsson  -
#        2.5          2014-02-21      Fixing a bug allow single iRules in $Global:bigipirules.                      Patrik Jonsson  -
#        2.6          2014-02-24      Fixing iRule table and new CSS.                                               Patrik Jonsson  -
#                                     Adding sorting of columns.
#                                     Adding textarea for iRules.
#        2.7          2014-02-25      Fixing prettier HTML structure
#        2.8          2014-02-27      Fixing header filter                                                          Patrik Jonsson  -
#        2.9          2014-03-09      Rewriting to use node object instead of dictionary                            Patrik Jonsson  -
#                                     Fixing a bug that appeared when using Powershell 3.0
#        3.0          2015-07-21      Fixing pool verification                                                      Patrik Jonsson  -
#        3.1          2015-07-22      Showing big monitors is easier                                                Patrik Jonsson  -
#                                     Adding functionality to hide certain information to save space.
#        3.2          2015-07-23      Trying nested tables for pool member information                              Patrik Jonsson  -
#        3.3          2015-07-25      Fixed better CSS                                                              Patrik Jonsson  -
#                                     Fixed a loading screen
#                                     Adding member information in the table instead of popup
#        3.4                          Add search highlighting                                                       Patrik Jonsson  -
#                                     Add more entries per page                                                     Patrik Jonsson  -
#        3.5          2015-07-29      Fixing the iRules syntax highlihting                                          Patrik Jonsson  -
#        3.6          2015-07-30      Fixing a drop down for iRule selection                                        Patrik Jonsson  -
#        3.7          2015-07-31      Added a lightbox for the iRules                                               Patrik Jonsson  -
#                                     Adding error reporting when the report fails
#        3.8          2015-11-11      Added TLS1.2 support                                                          Patrik Jonsson  -
#                                     Changed the javascript so the monitors would not cross the screen edge.
#        3.9          2016-02-04      Fixed a bug when doing minimal configuration                                  Patrik Jonsson  -
#                                     Made the Bigip target list easier to configure (exchanged BigIPdict)
#        3.9.2        2016-02-25      Ending the version inflation. :)
#        3.9.2        2016-02-26      Changing the iRule pool regex to cater for explicit pool selections           Patrik Jonsson  -
#        3.9.3        2016-02-28      Fixed faster caching of monitors                                              Patrik Jonsson  -
#                                     Added client site checking for stale data
#                                     Added member status to the report
#        3.9.4        2016-03-01      Adding support to show virtual server details irules                          Patrik Jonsson  -
#                                     Adding generated strings to test the monitors
#                                     Added a pool details lightbox instead of the popup
#        3.9.5        2016-03-02      Adding support for latest jQuery                                              Patrik Jonsson  -
#                                     Fixed UTF8 json in order to support    Firefox
#                                     Cleaned CSS
#                                     Cleaned the javascript
#                                     Cleaned the HTML
#        3.9.6        2016-03-04      Caching the data in temp files when writing the html and jsons                Patrik Jonsson  -
#        3.9.7        2016-03-05      Adding a possibility to share searches                                        Patrik Jonsson  -
#        4.0          2016-03-07      Fixed the pool expand function where it does not expand for column            Patrik Jonsson  -
#                                     searches.
#                                     Fixed syntax highlighting for column searches
#        4.0.1        2016-03-11      Fixed an error in the javascript that used a future function not              Patrik Jonsson  -
#                                     included in the current version.
#        4.0.2        2016-03-14      Preparing for showing Virtual Server details                                  Patrik Jonsson  -
#        4.0.3        2016-03-23      Making the curl links compatible with the windows binary                      Patrik Jonsson  -
#                                     Adding share link to show pool
#                                     Fixed a bug where monitors using tags as receive string would not show.
#        4.0.4        2016-05-13      Fixed a bug with a non-declared variable                                      Patrik Jonsson  -
#        4.0.5        2016-05-23      Made the update check more aggressive by request of devcentral users          Patrik Jonsson  -
#        4.0.6        2016-06-08      Making showing of irules easier to define                                     Patrik Jonsson  -
#        4.0.7        2016-06-09      Replacing config section with a config file                                   Patrik Jonsson  -
#                                     Using Powershell Strict mode to improve script quality
#        4.0.8        2016-06-10      Adding logging options                                                        Patrik Jonsson  -
#                                     Adding checks and retries when writing the report
#        4.0.9        2016-06-14      Changed the pool regular expression to allow tab and multiple space           Patrik Jonsson  -
#        4.1.0        2016-06-20      Updated the report mails to be more structured (css and table)                Patrik Jonsson  -
#        4.1.1        2016-06-21      Made the report check for missing load balancers before compiling             Patrik Jonsson  -
#                                     the data
#        4.1.2        2016-06-23      Make it possible to store the report somewhere else than the site root        Patrik Jonsson  -
#                                     Adding option to add shares if the report script is running on a separate
#                                     server
#                                     Adding log file pruning (max lines)
#        4.1.3        2016-07-01      Fixed an error in the pre-execution part. Updated some log verbosermation.    Patrik Jonsson  -
#        4.1.4        2016-07-11      Fixed a problem with the javascript files not referring the correct folder    Patrik Jonsson  -
#        4.2.0        2016-07-18      Added support to show virtual server details                                  Patrik Jonsson  -
#                                     Added support for showing irules
#                                     Added support for scanning data groups
#                                     Changed value of irules on Virtual servers without irules to an empty
#                                     array instead of none.
#        4.2.1        2016-07-19      Added an additional possible status to the pool details view                  Patrik Jonsson  -
#        4.2.2        2016-08-10      Fixed a bug with error reporting                                              Patrik Jonsson  -
#                                     Made it easier to close larger irules
#                     2016-08-19      Cleaning up CSS
#                     2016-08-19      Fixed a bug in the data group parser function
#        4.2.3        2016-08-29      Adding data group parsing to json files
#                                     Fixed so you can hide the compression column
#        4.2.4        2016-08-30      Fixed a bug in the data group parser                                          Patrik Jonsson  -
#                                     Showing data groups now works
#        4.2.5        2016-08-31      Rewrote the parser to use dictionaries instead                                Patrik Jonsson  -
#                                     Parsing data groups in irules now works
#        4.2.6        2016-09-01      Fixing css for data group lightbox to match the rest                          Patrik Jonsson  -
#        4.2.7        2016-09-06      Improving data group parsing by skipping content in comments                  Patrik Jonsson  -
#        4.2.8        2016-09-12      Added support for showing priority groups                                     Patrik Jonsson  -
#        4.2.9        2016-09-12      Showing persistence profile in virtual server details                         Patrik Jonsson  -
#        4.3.0        2016-01-10      Fixing support for partitions single configuration objects
#        4.3.1        2017-03-02      Removing any route domain before comparing to NAT list                        Patrik Jonsson  -
#        4.3.2        2017-03-02      Making the script do recursive calls instead of per partition. Much faster    Patrik Jonsson  -
#        4.3.3        2017-03-02      Adding basic ASM support                                                      Patrik Jonsson  -
#        4.3.4        2017-03-07      Fixing a mistake where the wrong column setting was referred                  Patrik Jonsson  -
#        4.3.5        2017-03-23      Improving the check for missing data                                          Patrik Jonsson  -
#        4.3.6        2017-03-23      Using stream writer intead of out-file for improved performance               Patrik Jonsson  -
#        4.3.7        2017-03-23      Removing virtual servers connected to orphaned pools from the post check.     Patrik Jonsson  -
#        4.3.8        2017-03-24      Only using/comparing objects local to the LB currently worked on (faster)     Patrik Jonsson  -
#        4.3.9        2017-04-06      Allowing orphaned objects in the JSON, fixing a bug when testing data         Patrik Jonsson  -
#        4.4.0        2017-06-21      Fixing issue with the API not returning empty irules                          Patrik Jonsson  -
#        4.4.1        2017-07-05      Removing ASM, adding preferences                                              Patrik Jonsson  -
#        4.4.2        2017-07-08      Adding new logo and version number in the footer                              Patrik Jonsson  -
#        4.4.3        2017-07-09      Moved preferences to its own window                                           Patrik Jonsson  -
#        4.5.0        2017-07-12      Adding column toggle. Moving iRule selector to its own window                 Patrik Jonsson  -
#                                     Optimizing css
#        4.5.1        2017-07-15      Now also fetching information about the load balancers for future use         Patrik Jonsson  -
#        4.5.2        2017-07-16      Re-adding basic ASM support for devices running version 12 and above.         Patrik Jonsson  -
#        4.5.3        2017-07-20      Fixing a bug when highlighting irules and the js folder is not located        Patrik Jonsson  -
#                                     in the root folder
#        4.5.4        2017-07-21      Replacing old Javascript loader with one that is smoother when loading        Patrik Jonsson  -
#                                     larger sets of data
#        4.5.5        2017-07-22      Adding a reset filters button                                                 Patrik Jonsson  -
#        4.5.6        2017-08-04      Adding VLAN information to the virtual server object                          Patrik Jonsson  -
#        4.5.7        2017-08-13      Adding icons                                                                  Patrik Jonsson  -
#        4.5.8        2017-08-14      Adding filter icon                                                            Patrik Jonsson  -
#        4.5.9        2017-08-16      Adding traffic group to the virtual server object and showing it              Patrik Jonsson  -
#        4.6.0        2017-08-17      Adding virtual server state icons                                             Patrik Jonsson  -
#        4.6.1        2017-08-18      Fixing bug when extracting source NAT pool                                    Patrik Jonsson  -
#        4.6.2        2017-08-18      Fixing a bug when extracting version information                              Patrik Jonsson  -
#        4.6.3        2017-08-19      Adding LB method, SNAT and NAT to pool details                                Patrik Jonsson  -
#        4.6.4        2017-08-24      Adding "All" to the pagination options                                        Patrik Jonsson  -
#        4.6.5        2017-09-08      Fixing a bug when dealing with modules that is not known                      Patrik Jonsson  No
#                                     Also defining iRulesLX as a known module
#        4.6.6        2017-09-11      Adding virtual server and pool statistics                                     Patrik Jonsson  No
#        4.6.7        2017-09-12      Small CSS fix to make the pool details prettier                               Patrik Jonsson  No
#        4.6.8        2017-09-20      Adding fix for duplicate detected data groups                                 Patrik Jonsson  No
#        4.6.9        2017-09-25      Preventing caching of Json                                                    Patrik Jonsson  No
#        4.7.0        2017-12-20      Adding options to export to the report to CSV                                 Patrik Jonsson  Yes
#        4.7.1        2017-12-20      Adding support for monitors using HEAD                                        Patrik Jonsson  No
#        4.7.2        2017-12-20      Adding support for multiple configuration files                               Patrik Jonsson  No
#        4.7.3        2017-12-20      Adding more script pre-execution checks
#                                     Adding javascript error handling when loading the report json files           Patrik Jonsson  No
#        4.7.4        2017-12-27      Adding script requirement for Powershell version 4                            Patrik Jonsson  No
#        4.7.5        2017-12-28      Adding more verbose error messages when the json files fails to load          Patrik Jonsson  No
#        4.8.0        2018-01-07      The script now supports real-time member status                               Patrik Jonsson  Yes
#                                     A lot of small fixes
#        4.8.1        2018-01-19      Changing to device groups instead of individual load balancers                Patrik Jonsson  Yes
#                                     Moving status VIP support to the device groups
#        4.8.2        2018-01-20      Using dictionaries to generate the report to speed up large installations     Patrik Jonsson  No
#        4.8.3        2018-01-21      Introducing slight delay when searching to make searches in larger            Patrik Jonsson  No
#                                     instalations more performant
#                                     Alot of Powershell code cleaning and optimizing
#        4.8.4        2018-01-22      Changing the style of the report to something more bright                     Patrik Jonsson  No
#        4.8.5        2018-01-23      Fixing the bug with the chevrons not expanding/collapsing                     Patrik Jonsson  No
#                                     Fixed a bug with the CSV export function                                      Patrik Jonsson  No
#                                     Fixed a bug with the member status endpoints                                  Patrik Jonsson  No
#        4.8.6        2018-01-24      Adding virtual server, pool and node description to the json data             Patrik Jonsson  No
#        4.8.7        2018-01-26      Adding pre-execution check for the iControl version                           Patrik Jonsson  No
#        4.8.8        2018-01-30      Adding the device overview                                                    Patrik Jonsson  No
#        5.0.0        2018-02-02      Adding a console containing different sections like certificate expiration,   Patrik Jonsson  Yes
#                                     logs, and help. Moving device overview and the defined iRules to it.
#        5.0.1        2018-02-05      Changing character encoding of knowndevices.json and making sure that the     Patrik Jonsson  No
#                                     error handling when loading json files works as expected.
#        5.0.2        2018-02-06      Fixed a bug affecting those that does not have polling endpoints configured.  Patrik Jonsson  No
#        5.0.3        2018-02-09      Adding a function to export anonymized device data.                           Patrik Jonsson  No
#        5.0.4        2018-02-09      Completing the knowndevices.json file with blades. Adding icon for unknown    Patrik Jonsson  No
#                                     devices
#        5.0.5        2018-02-16      Specifying encoding in the script log file                                    Patrik Jonsson  No
#        5.0.6        2018-02-27      Added error handling for invalid management certificates and updated          Patrik Jonsson  No
#                                     examples in the configuration file
#        5.0.7        2018-03-28      White-space clean-up                                                          Tim Riker       No
#        5.0.7        2018-03-28      HTML clean-up                                                                 Tim Riker       No
#        5.0.8        2018-03-28      Using string builder to make the report building more efficient based on      Patrik Jonsson  No
#                                     a suggestion from Tim
#        5.0.9        2018-03-30      Removing URI encode which causes issues on some systems, also making          Patrik Jonsson  No
#                                     PowerShell version 5 mandatory because of the string builder addition
#        5.1.0        2018-04-30      Use a datasource for bigiptable rendering in the client                       Tim Riker       No
#                                     Copy new files over or your table will be empty
#                                     using relative paths for resources loaded from javascript
#                                     logo now transparent, css typos, updates to .gitattributes and .gitignore
#                                     orphan pools render with pool name in virtual server field
#                                     use Map() for pool lookups, another increase in browser loading speed
#                                     link to DevCentral from README.md
#                                     write asmpolicies.json, always include asm column in report
#                                     disable console resizing (vscode and PowerShell ISE)
#        5.1.1        2018-05-01      add back NATFile support and a new nat.json file                              Tim Riker       No
#                                     sort json data before writing
#                                     don't compress json files if Verbose
#        5.1.2        2018-05-01      explicit write for empty asmpolicies.json                                     Tim Riker       No
#                                     button-radius, const, data-pace-option, layout, alternatetablecolor
#        5.1.3        2018-05-02      fix: explicit array for datagroups.json, fix: utf8 logfile truncation         Tim Riker       No
#                                     datatables layout, remove unused code, prefer / to \ in paths
#        5.1.4        2018-05-08      migrate console menu to main screen, layout changes, more edit links          Tim Riker       Yes
#                                     iRules all exported, certificates datatable updates, Edge fix
#                                     upgrade jQuery and Datatables, new ErrorReportAnyway config option
#        5.1.5        2018-05-14      delay loading tables until used, data group table, pool table w/ orphans      Tim Riker       No
#                                     SSL server profile, column filters for all tables, simplify member display
#                                     pool / member columns sort by count when clicked, some stats in log tab
#        5.1.6        2018-05-18      Process DataGroups to build more pool links, track more Datagroup types       Tim Riker       No
#                                     Datagroup links in iRules when no partition is specified
#                                     adcLinks open in new window, show referenced datagroups in iRule table
#                                     write some stats at the end of the build, force arrays for more json files
#                                     update regular expressions, iRules have pools and datagroup links
#        5.1.7        2018-05-21      MaxPools setting to limit pool status requests if too many pools open         Tim Riker       Yes
#                                     Update alerts to upper right
#        5.1.8        2018-06-04      column toggles, copy, print, csv buttons on tables using datatables buttons   Tim Riker       No
#                                     pools expand on search now case insensitve, new icons for tabs
#        5.1.9        2018-06-27      minor bug fixes, csv cleanup, mutiple ssl profiles                            Tim Riker       No
#        5.2.0        2018-08-28      unused code, better pool/datagroup highlighting in iRules                     Tim Riker       No
#                                     show virtual servers using iRule, show fallback persistence profile
#                                     fix processing of hash on refresh, handle pools created during report run
#                                     force virtualservers to array, show layer4 vips, update sooner
#        5.2.1        2018-10-16      Fixing non-pool list expansions.                                              Tim Riker       No
#        5.2.2        2018-10-18      Fixing bug with failed load balancer making the report not load.              Patrik Jonsson  No
#                                     Adding description column.                                                    Patrik Jonsson
#                                     Fixing typo, improving CSS.                                                   Tim Riker
#        5.2.3        2018-10-26      Fixing typo that broke the data group list generation.                        Tim Riker       No
#        5.2.4        2019-05-28      Fixing short links in device menu                                             Tim Riker       No
#        5.2.5        2019-05-30      Fixing bug with the direct links to the pool section not working              Patrik Jonsson  No
#                                     Fixing bug with the certificate table always showing direct links
#                                     Removed the optional export section since it's added by default
#                                     Adding padding to sections that is not using data tables
#                                     Adding a more consistent style to the export buttons
#        5.2.6        2019-05-31      Replaced the column toggle buttons in the virtual server view with            Patrik Jonsson  No
#                                     Data tables standard columns
#                                     Replaced the column filters with DataTables standard column filters
#                                     Fixed a bug with the pool expansion function expanding everything
#                                     when search string is empty
#                                     Fixed a bug with the certificate reset button not working due to
#                                     misspelled css selector
#        5.2.7        2019-06-07      Improving the log section with severities for each entry                      Tim Riker       No
#        5.2.8        2019-06-13      Added favicon, new icons for pools and devices and making the device          Patrik Jonsson  No
#                                     serial number correct for virtual editions
#        5.2.9        2019-06-23      Saving state of column toggles                                                Tim Riker       No
#        5.3.0        2019-11-15      regex searching, rename "underlay", new settings in xml file! bug fixes       Tim Riker       Yes
#                                     stats to loggederrors, hide some columns by default, links in datagroups
#                                     snat pool, new status searching, updated tab/button/input styling
#                                     monitor column on pool table, new preferences.json
#        5.3.1        2019-xx-xx      remove pssnapin, now runs on other platforms                                  Tim Riker       No
#                                     requires powershell 6.x+ to get ConvertFrom-Json -AsHashTable
#
#        This script generates a report of the LTM configuration on F5 BigIP's.
#        It started out as pet project to help co-workers know which traffic goes where but grew.
#
#        The html page uses "Data tables" to display and filter tables. It's an open source javascript project.
#        Source: https://datatables.net/
#
######################################################################################################################################

Param(
    $ConfigurationFile = "$PSScriptRoot/bigipreportconfig.xml",
    $PollLoadBalancer = $null,
    $Location = $null
)

Set-StrictMode -Version Latest
if ($null -eq $PollLoadBalancer) {
    $ErrorActionPreference = "Stop"
} else {
    # children
    $ErrorActionPreference = "Stop"
    $ProgressPreference = "SilentlyContinue"
}
# PowerShell does not inherit PWD in pre v7
if ($null -ne $Location) {
    Set-Location $Location
    $PSScriptRoot=$Location
}
# PowerShell does not apply PWD to the IO library
if ([IO.Directory]::GetCurrentDirectory() -ne $PSScriptRoot) {
    [IO.Directory]::SetCurrentDirectory($PSScriptRoot)
}

#Script version
$Global:ScriptVersion = "5.3.1"

#Variable used to calculate the time used to generate the report.
$StartTime = Get-Date

$Global:hostname = [System.Net.Dns]::GetHostName()

#case sensitive dictionaries
function c@ {
    New-Object Collections.Hashtable ([StringComparer]::CurrentCulture)
}

#Variables for storing handled error messages
$Global:LoggedErrors = @()

# balancer data for the report
$Global:ReportObjects = c@{};

#No BOM Encoding in the log file
$Global:Utf8NoBomEncoding = New-Object System.Text.UTF8Encoding $False

################################################################################################################################################
#
#    Logs to console and file function
#
################################################################################################################################################

# default until we load the config
$Outputlevel = "Normal"
Function log {
    Param ([string]$LogType = "info", [string]$Message = "")

    #Initiate the log header with date and time
    $CurrentTime =  $(Get-Date -UFormat "%Y-%m-%d %H:%M:%S")
    $LogHeader = $CurrentTime + ' ' + $($LogType.toUpper()) + ' '

    if($null -ne $PollLoadBalancer){
        # child processes just log to stdout
        $LogLineDict = @{}

        $LogLineDict["datetime"] = $CurrentTime
        $LogLineDict["severity"] = $LogType.toupper()
        $LogLineDict["message"] = $Message

        $LogLineDict|ConvertTo-Json -Compress
        return
    }

    # log errors, warnings, info and success to loggederrors.json
    if($LogType -eq "error" -Or $LogType -eq "warning" -Or $LogType -eq "info" -Or $LogType -eq "success"){
        $LogLineDict = @{}

        $LogLineDict["datetime"] = $CurrentTime
        $LogLineDict["severity"] = $LogType.toupper()
        $LogLineDict["message"] = $Message

        $Global:LoggedErrors += $LogLineDict
    }

    if($Global:Bigipreportconfig.Settings.LogSettings.Enabled -eq $true){
        $LogFilePath = $Global:Bigipreportconfig.Settings.LogSettings.LogFilePath
        $LogLevel = $Global:Bigipreportconfig.Settings.LogSettings.LogLevel

        switch($Logtype) {
            "error"   { [System.IO.File]::AppendAllText($LogFilePath, "$LogHeader$Message`n", $Global:Utf8NoBomEncoding) }
            "warning" { [System.IO.File]::AppendAllText($LogFilePath, "$LogHeader$Message`n", $Global:Utf8NoBomEncoding) }
            "info"    { if($LogLevel -eq "Verbose"){ [System.IO.File]::AppendAllText($LogFilePath, "$LogHeader$Message`n", $Global:Utf8NoBomEncoding) } }
            "success" { if($LogLevel -eq "Verbose"){ [System.IO.File]::AppendAllText($LogFilePath, "$LogHeader$Message`n", $Global:Utf8NoBomEncoding) } }
            "verbose" { if($LogLevel -eq "Verbose"){ [System.IO.File]::AppendAllText($LogFilePath, "$LogHeader$Message`n", $Global:Utf8NoBomEncoding) } }
            default   { if($LogLevel -eq "Verbose"){ [System.IO.File]::AppendAllText($LogFilePath, "$LogHeader$Message`n", $Global:Utf8NoBomEncoding) } }
        }
    }

    $ConsoleHeader = $CurrentTime + ' '

    switch($logtype) {
        "error"   { Write-Host $("$ConsoleHeader$Message") -ForegroundColor "Red" }
        "warning" { Write-Host $("$ConsoleHeader$Message") -ForegroundColor "Yellow" }
        "info"    { if($OutputLevel -eq "Verbose"){ Write-Host $("$ConsoleHeader$Message") -ForegroundColor "Gray" }  }
        "success" { if($OutputLevel -eq "Verbose"){ Write-Host $("$ConsoleHeader$Message") -ForegroundColor "Green" } }
        "verbose" { if($OutputLevel -eq "Verbose"){ Write-Host "$ConsoleHeader$Message" } }
        default   { if($OutputLevel -eq "Verbose"){ Write-Host "$ConsoleHeader$Message" } }
    }
}

################################################################################################################################################
#
#    Load the configration file
#
################################################################################################################################################

#Check if the configuration file exists
if(Test-Path $ConfigurationFile){
    #Read the file as xml
    [xml]$Global:Bigipreportconfig = Get-Content $ConfigurationFile

    #Verify that the file was succssfully loaded, otherwise exit
    if($?){
        $Outputlevel = $Global:Bigipreportconfig.Settings.Outputlevel
        log success "Successfully loaded the config file: $ConfigurationFile"
    } else {
        log error "Can't read the config file: $ConfigurationFile from $PSScriptRoot, or config file corrupt. Aborting."
        Exit
    }
} else {
    log error "Failed to load config file $ConfigurationFile from $PSScriptRoot. Aborting."
    Exit
}
log verbose "Starting: PSCommandPath=$PSCommandPath ConfigurationFile=$ConfigurationFile PollLoadBalancer=$PollLoadBalancer Location=$Location PSScriptRoot=$PSScriptRoot"

################################################################################################################################################
#
#    Function to send an error report if error reporting is configured
#
################################################################################################################################################
Function Send-Errors {
    #Check for errors when executing the script and send them
    If($Error.Count -gt 0 -or @($Global:LoggedErrors | Where-Object {$_.severity -eq "ERROR"}).Count -gt 0){
        log verbose "There were errors while generating the report"

        if($Global:Bigipreportconfig.Settings.ErrorReporting.Enabled -eq $true){
            $Errorsummary = @"
<html>
    <head>
        <style type="text/css">
            .errortable {
                margin:0px;padding:0px;
                box-shadow: 10px 10px 5px #888888;
                border-collapse: collapse;
                font-family:Ebrima;
            }
            .errortable table{
                border-collapse: collapse;
                border-spacing: 0;
                height:100%;
                margin:0px;
                padding:0px;
                border:1px solid #000000;
            }
            .errortable tr:nth-child(odd){
                background-color:#ffffff;
                border-collapse: collapse;
            }
            .oddrow{
                background-color:#d3e9ff;
            }
            .errortable td{
                vertical-align:middle;
                border:1px solid #000000;
                border-collapse: collapse;
                text-align:left;
                padding:7px;
                font-size:12px;
            }
            .headerrow {
                background-color:#024a91;
                border:0px solid #000000;
                border-collapse: collapse;
                text-align:center;
                font-size:14px;
                font-weight:bold;
                color:#ffffff;
            }
            .error {
                color:red;
            }
        </style>

    </head>
    <body>
"@

            if($Global:LoggedErrors.Count -gt 0){
                $Errorsummary += "<h4>The following handled errors was thrown during the execution</h4>"

                Foreach($HandledError in $Global:LoggedErrors | Where-Object {$_.severity -eq "ERROR"}){
                    $Errorsummary += "<font class=""error"">" + $HandledError.message + "</font><br>"
                }
            }

            # PowerShell $Error
            if($Error.Count -gt 0){
                $Errorsummary += "<h4>The following exceptions were thrown during script execution</h4>"

                $Errorsummary += "<table class=""errortable""><thead><tr class=""headerrow""><th>Category</th><th>Linenumber</th><th>Line</th><th>Stacktrace</th></tr></thead><tbody>"

                Foreach($ErrorItem in $Error){
                    if (Get-Member -inputobject $ErrorItem -name "ScriptStackTrace") {
                        $StackTrace = $ErrorItem.ScriptStackTrace
                        $Category = $ErrorItem.Categoryinfo.Reason
                        $LineNumber = $ErrorItem.InvocationInfo.ScriptLineNumber
                        $PositionMessage = $ErrorItem.InvocationInfo.PositionMessage

                        $Errorsummary += "<tr><td>$Category</td><td>$Linenumber</td><td>$PositionMessage</td><td>$Stacktrace</td></tr>"
                    }
                }

                $Errorsummary += "</tbody></table></body></html>"
            }
            log verbose "Sending report"
            $Subject = "BigIPReport on $($Global:hostname) encountered errors"
            $Body = "$errorsummary"

            Foreach($Recipient in $Global:Bigipreportconfig.Settings.ErrorReporting.Recipients.Recipient){
                send-MailMessage -SmtpServer $Global:Bigipreportconfig.Settings.ErrorReporting.SMTPServer -To $Recipient -From $Global:Bigipreportconfig.Settings.ErrorReporting.Sender -Subject $Subject -Body $Body -BodyAsHtml
            }
        } else {
            log error "No error mail reporting enabled/configured"
        }
    }
}

################################################################################################################################################
#
#    Pre-execution checks
#
################################################################################################################################################

log verbose "Pre-execution checks"

$SaneConfig = $true

if($null -eq $Global:Bigipreportconfig.Settings.Credentials.Username -or "" -eq $Global:Bigipreportconfig.Settings.Credentials.Username){
    log error "No username configured"
    $SaneConfig = $false
}

if($null -eq $Global:Bigipreportconfig.Settings.Credentials.Password -or "" -eq $Global:Bigipreportconfig.Settings.Credentials.Password){
    log error "No password configured"
    $SaneConfig = $false
}

if($null -eq $Global:Bigipreportconfig.Settings.DeviceGroups.DeviceGroup -or 0 -eq @($Global:Bigipreportconfig.Settings.DeviceGroups.DeviceGroup.Device).Count){
    log error "No load balancers configured"
    $SaneConfig = $false
}

if($null -eq $Global:Bigipreportconfig.Settings.DefaultDocument -or "" -eq $Global:Bigipreportconfig.Settings.DefaultDocument){
    log error "No default document configured"
    $SaneConfig = $false
}

if($null -eq $Global:Bigipreportconfig.Settings.LogSettings -or $null -eq $Global:Bigipreportconfig.Settings.LogSettings.Enabled){
    log error "Mandatory fields from the LogSettings section has been removed"
    $SaneConfig = $false
}

if("true" -eq $Global:Bigipreportconfig.Settings.LogSettings.Enabled){
    if($null -eq $Global:Bigipreportconfig.Settings.LogSettings.LogFilePath -or $null -eq $Global:Bigipreportconfig.Settings.LogSettings.LogLevel -or $null -eq $Global:Bigipreportconfig.Settings.LogSettings.MaximumLines) {
        log error "Logging has been enabled but all logging fields has not been configured"
        $SaneConfig = $false
    }
}

if($null -eq $Global:Bigipreportconfig.Settings.Outputlevel -or "" -eq $Global:Bigipreportconfig.Settings.Outputlevel){
    log error "No Outputlevel configured"
    $SaneConfig = $false
}

if ($Global:Bigipreportconfig.Settings.SelectNodes("Shares/Share").Count) {
    Foreach($Share in $Global:Bigipreportconfig.Settings.Shares.Share){
        log verbose "Mounting $($Share.Path)"

        & net use $($Share.Path) /user:$($Share.Username) $($Share.Password) | Out-Null

        if($?){
            log success "Share $($Share.Path) was mounted successfully"
        } else {
            log error "Share $($Share.Path) could not be mounted"
            $SaneConfig = $false
        }
    }
}

if($null -eq $Global:Bigipreportconfig.Settings.iRules -or $null -eq $Global:Bigipreportconfig.Settings.iRules.Enabled -or $null -eq $Global:Bigipreportconfig.Settings.iRules.ShowiRuleLinks){
    log error "Missing options in the global iRule section defined in the configuration file. Old config version of the configuration file?"
    $SaneConfig = $false
}

if($null -eq $Global:Bigipreportconfig.Settings.iRules.ShowDataGroupLinks){
    log error "Missing options for showing data group links in the global irules section defined in the configuration file. Old config version of the configuration file?"
    $SaneConfig = $false
}

if($Global:Bigipreportconfig.Settings.iRules.Enabled -eq $true -and $Global:Bigipreportconfig.Settings.iRules.ShowiRuleLinks -eq $false -and $Global:Bigipreportconfig.Settings.iRules.ShowDataGroupLinks -eq $true){
    log error "You can't show data group links without showing irules in the current version."
    $SaneConfig = $false
}

if($null -eq $Global:Bigipreportconfig.Settings.RealTimeMemberStates){
    log error "Real time member states is missing from the configuration file. Update the the latest version of the file and try again."
    $SaneConfig = $false
}

if($null -eq $Global:Bigipreportconfig.Settings.ReportRoot -or $Global:Bigipreportconfig.Settings.ReportRoot -eq ""){
    log error "No report root configured"
    $SaneConfig = $false
} else {
    #Make sure the report root ends with / or \
    if(-not $Global:bigipreportconfig.Settings.ReportRoot.endswith("/") -and -not $Global:bigipreportconfig.Settings.ReportRoot.endswith("\")){
        $Global:bigipreportconfig.Settings.ReportRoot += "/"
    }

    if(-not (Test-Path $Global:Bigipreportconfig.Settings.ReportRoot)){
        log error "Can't access the site root $($Global:Bigipreportconfig.Settings.ReportRoot)"
        $SaneConfig = $false
    } else {
        if(-not (Test-Path $($Global:Bigipreportconfig.Settings.ReportRoot + "json"))){
            log error "The folder $($Global:Bigipreportconfig.Settings.ReportRoot + "json") does not exist in the report root directory. Did you forget to copy the html files from the zip file?"
            $SaneConfig = $false
        } elseif ( @(Get-ChildItem -path $($Global:Bigipreportconfig.Settings.ReportRoot + "json")).count -eq 0){
            log error "The folder $($Global:Bigipreportconfig.Settings.ReportRoot + "json") does not contain any files. Did you accidentally delete some files?"
            $SaneConfig = $false
        }

        if(-not (Test-Path $($Global:Bigipreportconfig.Settings.ReportRoot + "js"))){
            log error "The folder $($Global:Bigipreportconfig.Settings.ReportRoot + "js") does not exist in the report root directory. Did you forget to copy the html files from the zip file?"
            $SaneConfig = $false
        } elseif ( (Get-ChildItem -path $($Global:Bigipreportconfig.Settings.ReportRoot + "js")).count -eq 0){
            log error "The folder $($Global:Bigipreportconfig.Settings.ReportRoot + "js") does not contain any files. Did you accidentally delete some files?"
            $SaneConfig = $false
        }

        if(-not (Test-Path $($Global:Bigipreportconfig.Settings.ReportRoot + "images"))){
            log error "The folder $($Global:Bigipreportconfig.Settings.ReportRoot + "images") does not exist in the report root directory. Did you forget to copy the html files from the zip file?"
            $SaneConfig = $false
        } elseif ( (Get-ChildItem -path $($Global:Bigipreportconfig.Settings.ReportRoot + "images")).count -eq 0){
            log error "The folder $($Global:Bigipreportconfig.Settings.ReportRoot + "images") does not contain any files. Did you accidentally delete some files?"
            $SaneConfig = $false
        }

        if(-not (Test-Path $($Global:Bigipreportconfig.Settings.ReportRoot + "css"))){
            log error "The folder $($Global:Bigipreportconfig.Settings.ReportRoot + "css") does not exist in the report root directory. Did you forget to copy the html files from the zip file?"
            $SaneConfig = $false
        } elseif ( (Get-ChildItem -path $($Global:Bigipreportconfig.Settings.ReportRoot + "css")).count -eq 0){
            log error "The folder $($Global:Bigipreportconfig.Settings.ReportRoot + "css") does not contain any files. Did you accidentally delete some files?"
            $SaneConfig = $false
        }
    }
}

Foreach($DeviceGroup in $Global:Bigipreportconfig.Settings.DeviceGroups.DeviceGroup){
    If ($null -eq $DeviceGroup.name -or $DeviceGroup.name -eq "") {
        log error "A device group does not have any name. Please check the latest version of the configuration file."
        $SaneConfig = $false
    }

    If ($null -eq $DeviceGroup.Device -or @($DeviceGroup.Device | Where-Object { $_ -ne "" } ).Count -eq 0) {
        log error "A device group does not have any devices, please re-check your configuration"
        $SaneConfig = $false
    }
}

if(-not $SaneConfig){
    log verbose "There were errors during the config file sanity check"

    if($Global:Bigipreportconfig.Settings.ErrorReporting.Enabled -eq $true){
        log verbose "Attempting to send an error report via mail"
        Send-Errors
    }

    log verbose "Exiting"
    Exit
} else {
    log success "Pre execution checks were successful"
}

################################################################################################################################################
#
#    Pre-execution checks
#
################################################################################################################################################

#Declaring variables

#Variables used for storing report data
$Global:NATdict = c@{}
$Global:Preferences = c@{}

$Global:DeviceGroups = @();


#Build the path to the default document and json files
$Global:paths = c@{}
$Global:paths.report = $Global:bigipreportconfig.Settings.ReportRoot + $Global:bigipreportconfig.Settings.Defaultdocument
$Global:paths.preferences = $Global:bigipreportconfig.Settings.ReportRoot + "json/preferences.json"
$Global:paths.pools = $Global:bigipreportconfig.Settings.ReportRoot + "json/pools.json"
$Global:paths.monitors = $Global:bigipreportconfig.Settings.ReportRoot + "json/monitors.json"
$Global:paths.virtualservers = $Global:bigipreportconfig.Settings.ReportRoot + "json/virtualservers.json"
$Global:paths.irules = $Global:bigipreportconfig.Settings.ReportRoot + "json/irules.json"
$Global:paths.datagroups = $Global:bigipreportconfig.Settings.ReportRoot + "json/datagroups.json"
$Global:paths.devicegroups = $Global:bigipreportconfig.Settings.ReportRoot + "json/devicegroups.json"
$Global:paths.loadbalancers = $Global:bigipreportconfig.Settings.ReportRoot + "json/loadbalancers.json"
$Global:paths.certificates = $Global:bigipreportconfig.Settings.ReportRoot + "json/certificates.json"
$Global:paths.loggederrors = $Global:bigipreportconfig.Settings.ReportRoot + "json/loggederrors.json"
$Global:paths.asmpolicies = $Global:bigipreportconfig.Settings.ReportRoot + "json/asmpolicies.json"
$Global:paths.nat = $Global:bigipreportconfig.Settings.ReportRoot + "json/nat.json"

#Create types used to store the data gathered from the load balancers
Add-Type @'

    using System.Collections;
    public class VirtualServer
    {
        public string name;
        public string description;
        public string ip;
        public string port;
        public string profiletype;
        public string defaultpool;
        public string httpprofile;
        public string[] sslprofileclient;
        public string[] sslprofileserver;
        public string compressionprofile;
        public string[] persistence;
        public string[] irules;
        public string[] pools;
        public string[] vlans;
        public string trafficgroup;
        public string vlanstate;
        public string sourcexlatetype;
        public string sourcexlatepool;
        public string[] asmPolicies;
        public string availability;
        public string enabled;
        public string currentconnections;
        public string maximumconnections;
        public string cpuavg5sec;
        public string cpuavg1min;
        public string cpuavg5min;
        public string loadbalancer;
    }

    public class Member {
        public string name;
        public string ip;
        public string port;
        public string availability;
        public string enabled;
        public string status;
        public long priority;
        public string currentconnections;
        public string maximumconnections;
    }

    public class Pool {
        public string name;
        public string description;
        public string[] monitors;
        public Member[] members;
        public string loadbalancingmethod;
        public string actiononservicedown;
        public string allownat;
        public string allowsnat;
        public bool orphaned;
        public string loadbalancer;
        public string availability;
        public string enabled;
        public string status;
    }

    public class iRule {
        public string name;
        public string[] pools;
        public string[] datagroups;
        public string[] virtualservers;
        public string definition;
        public string loadbalancer;
    }

    public class Node {
        public string ip;
        public string name;
        public string description;
        public string loadbalancer;
    }

    public class Monitor {
        public string name;
        public string type;
        public string sendstring;
        public string receivestring;
        public string loadbalancer;
        public string interval;
        public string timeout;
    }

    public class Datagroup {
        public string name;
        public string type;
        public Hashtable data;
        public string[] pools;
        public string loadbalancer;
    }

    public class PoolStatusVip {
        public string url;
        public string working;
        public string state;
    }

    public class DeviceGroup {
        public string name;
        public string[] ips;
    }

    public class Loadbalancer {
        public string name;
        public string ip;
        public string version;
        public string build;
        public string baseBuild;
        public string model;
        public string category;
        public string serial;
        public bool active;
        public bool isonlydevice;
        public string color;
        public Hashtable modules;
        public PoolStatusVip statusvip;
        public bool success = true;
    }

    public class ASMPolicy {
        public string name;
        public string learningMode;
        public string enforcementMode;
        public string[] virtualServers;
        public string loadbalancer;
    }

    public class CertificateDetails {
        public string commonName;
        public string countryName;
        public string stateName;
        public string localityName;
        public string organizationName;
        public string divisionName;
    }

    public class Certificate {
        public string fileName;
        public long expirationDate;
        public CertificateDetails subject;
        public string issuer;
        public string subjectAlternativeName;
        public string loadbalancer;
    }

'@

$Global:ModuleToDescription = @{
    "asm" = "The Application Security Module.";
    "apm" = "The Access Policy Module.";
    "wam" = "The Web Accelerator Module.";
    "wom" = "The WAN Optimization Module.";
    "lc" = "The Link Controller Module.";
    "ltm" = "The Local Traffic Manager Module.";
    "gtm" = "The Global Traffic Manager Module.";
    "unknown" = "The module is unknown (or unsupported by iControl).";
    "woml" = "The WAN Optimization Module (Lite).";
    "apml" = "The Access Policy Module (Lite).";
    "em" = "The Enterprise Manager Module.";
    "vcmp" = "The Virtual Clustered MultiProcessing Module.";
    "tmos" = "The Traffic Management part of the Core OS.";
    "host" = "The non-Traffic Management = non-GUI part of the Core OS.";
    "ui" = "The GUI part of the Core OS.";
    "monitors" = "Represents the external monitors - used for stats only.";
    "avr" = "The Application Visualization and Reporting Module";
    "ilx" = "iRulesLX"
}

#Enable of disable the use of TLS1.2
if($Global:Bigipreportconfig.Settings.UseTLS12 -eq $true){
    log verbose "Enabling TLS1.2"
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
}

#Make sure that the text is in UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

#If configured, read the NAT rules from the specified NAT File

if($Global:Bigipreportconfig.Settings.NATFilePath -ne ""){
    log verbose "NAT File has been configured"

    if(Test-Path -Path $Global:Bigipreportconfig.Settings.NATFilePath){
        $NATContent = Get-Content $Global:Bigipreportconfig.Settings.NATFilePath

        $NATContent | ForEach-Object {
            $ArrLine = $_.split("=").Trim()
            if($ArrLine.Count -eq 2){
                $Global:NATdict[$arrLine[1]] = $arrLine[0]
             } else {
                log error "Malformed NAT file content detected: Check $_"
             }
        }

        if($NATdict.count -gt 0){
            log success "Loaded $($NATdict.count) NAT entries"
        } else {
            log error "No NAT entries loaded"
        }
    } else {
        log error "NAT file could not be found in location $($Global:Bigipreportconfig.Settings.NATFilePath)"
    }
}

#Region function Get-LTMInformation

#Function used to gather data from the load balancers
function Get-LTMInformation {
    Param(
        $Headers,
        $LoadBalancerObjects
    )

    #Set some variables to make the code nicer to read
    $LoadBalancerName = $LoadBalancerObjects.LoadBalancer.name
    $LoadBalancerIP =  $LoadBalancerObjects.LoadBalancer.ip

    $MajorVersion = $LoadBalancerObjects.LoadBalancer.version.Split(".")[0]
    #$Minorversion = $LoadBalancerObjects.LoadBalancer.version.Split(".")[1]

    #Region ASM Policies

    $LoadBalancerObjects.ASMPolicies = c@{}

    #Check if ASM is enabled
    if($LoadBalancerObjects.LoadBalancer.modules["asm"]){

        log verbose "Getting ASM Policy information from $LoadBalancerName"
        try {
            $Response = Invoke-RestMethod -Headers $Headers -Uri "https://$LoadBalancerIP/mgmt/tm/asm/policies"
        } Catch {
            log error "Unable to load ASM policies from $LoadBalancerName."
        }

        Foreach($Policy in $Response.items){
            $ObjTempPolicy = New-Object -Type ASMPolicy

            $ObjTempPolicy.name = $Policy.fullPath
            $ObjTempPolicy.enforcementMode = $Policy.enforcementMode
            if (Get-Member -inputobject $Policy -name 'learningMode') {
                $ObjTempPolicy.learningMode = $Policy.learningMode
            }
            $ObjTempPolicy.virtualServers = $Policy.virtualServers
            $ObjTempPolicy.loadbalancer = $LoadBalancerName

            $LoadBalancerObjects.ASMPolicies.add($ObjTempPolicy.name, $ObjTempPolicy)
        }
    }

    #EndRegion

    #Region Cache certificate information

    log verbose "Caching certificates from $LoadBalancerName"

    $LoadBalancerObjects.Certificates = c@{}

    $Response = ""
    try {
        $Response = Invoke-RestMethod -Headers $Headers -Uri "https://$LoadBalancerIP/mgmt/tm/sys/crypto/cert"
    } catch {
        log error "Error loading certificates from $LoadBalancerIP"
    }

    $unixEpochStart = new-object DateTime 1970,1,1,0,0,0,([DateTimeKind]::Utc)

    if (Get-Member -InputObject $Response -Name 'items') {
        Foreach($Certificate in $Response.items){
            $ObjSubject = New-Object -TypeName "CertificateDetails"

            if (Get-Member -inputobject $Certificate -name "commonName") {
                $ObjSubject.commonName = $Certificate.commonName
            }
            if (Get-Member -inputobject $Certificate -name "country") {
                $ObjSubject.countryName = $Certificate.country
            }
            if (Get-Member -inputobject $Certificate -name "state") {
                $ObjSubject.stateName = $Certificate.state
            }
            if (Get-Member -inputobject $Certificate -name "city") {
                $ObjSubject.localityName = $Certificate.city
            }
            if (Get-Member -inputobject $Certificate -name "ou") {
                $ObjSubject.organizationName = $Certificate.organization
            }
            if (Get-Member -inputobject $Certificate -name "ou") {
                $ObjSubject.divisionName = $Certificate.ou
            }

            $ObjCertificate = New-Object -TypeName "Certificate"

            $ObjCertificate.fileName = $Certificate.fullPath
            $expiration = [datetime]::ParseExact($Certificate.apiRawValues.expiration.Replace(' GMT','').Replace("  "," "),"MMM d H:mm:ss yyyy",$null)
            $ObjCertificate.expirationDate = ($expiration - $unixEpochStart).TotalSeconds
            $ObjCertificate.subject = $ObjSubject
            if (Get-Member -inputobject $Certificate -name "subjectAlternativeName") {
                $ObjCertificate.subjectAlternativeName = $Certificate.subjectAlternativeName.replace('DNS:','')
            } else {
                $ObjCertificate.subjectAlternativeName = ""
            }
            if (Get-Member -inputobject $Certificate -name "issuer") {
                $ObjCertificate.issuer = $Certificate.issuer
            } else {
                $ObjCertificate.issuer = ""
            }
            $ObjCertificate.loadbalancer = $LoadBalancerName

            $LoadBalancerObjects.Certificates.add($ObjCertificate.fileName, $ObjCertificate)
        }
    }

    #EndRegion

    #Region Cache node data

    $LoadBalancerObjects.Nodes = c@{}

    log verbose "Caching nodes from $LoadBalancerName"

    $Response = Invoke-RestMethod -Headers $Headers -Uri "https://$LoadBalancerIP/mgmt/tm/ltm/node"
    $Nodes = $Response.items

    Foreach($Node in $Nodes) {
        $ObjTempNode = New-Object Node

        $ObjTempNode.ip = $Node.address
        $ObjTempNode.name = $Node.name
        if (Get-Member -inputobject $Node -name "description") {
            $ObjTempNode.description = $Node.description
        } else {
            $ObjTempNode.description = ""
        }
        $ObjTempNode.loadbalancer = $LoadBalancerName

        if($ObjTempNode.name -eq ""){
            $ObjTempNode.name = "Unnamed"
        }

        $LoadBalancerObjects.Nodes.add($ObjTempNode.name, $ObjTempNode)
    }

    #EndRegion

    #Region Caching monitor data

    $LoadBalancerObjects.Monitors = c@{}

    log verbose "Caching monitors from $LoadBalancerName"

    #Save the HTTP monitors separately since they have different properties
    $Response = Invoke-RestMethod -Headers $Headers -Uri "https://$LoadBalancerIP/mgmt/tm/ltm/monitor/http"
    [array]$HttpMonitors = $Response.items
    $Response = Invoke-RestMethod -Headers $Headers -Uri "https://$LoadBalancerIP/mgmt/tm/ltm/monitor/https"
    [array]$HttpMonitors += $Response.items

    Foreach($HttpMonitor in $HttpMonitors){
        $ObjTempMonitor = New-Object Monitor

        $ObjTempMonitor.name = $HttpMonitor.name
        if (Get-Member -inputobject $HttpMonitor -name "send") {
            $ObjTempMonitor.sendstring = $HttpMonitor.send
        } else {
            $ObjTempMonitor.sendstring = ""
        }
        if (Get-Member -inputobject $HttpMonitor -name "recv") {
            $ObjTempMonitor.receivestring = $HttpMonitor.recv
        } else {
            $ObjTempMonitor.receivestring = ""
        }
        $ObjTempMonitor.interval = $HttpMonitor.interval
        $ObjTempMonitor.timeout = $HttpMonitor.timeout
        $ObjTempMonitor.type = $HttpMonitor.kind.Replace("tm:ltm:monitor:","")

        $ObjTempMonitor.loadbalancer = $LoadBalancerName

        $LoadBalancerObjects.Monitors.add($ObjTempMonitor.name, $ObjTempMonitor)
    }

    #Save the monitors which has interval and timeout properties
    $Response = Invoke-RestMethod -Headers $Headers -Uri "https://$LoadBalancerIP/mgmt/tm/ltm/monitor/icmp"
    [array]$OtherMonitors = $Response.items
    $Response = Invoke-RestMethod -Headers $Headers -Uri "https://$LoadBalancerIP/mgmt/tm/ltm/monitor/gateway-icmp"
    [array]$OtherMonitors += $Response.items
    $Response = Invoke-RestMethod -Headers $Headers -Uri "https://$LoadBalancerIP/mgmt/tm/ltm/monitor/real-server"
    [array]$OtherMonitors += $Response.items
    $Response = Invoke-RestMethod -Headers $Headers -Uri "https://$LoadBalancerIP/mgmt/tm/ltm/monitor/snmp-dca"
    [array]$OtherMonitors += $Response.items
    $Response = Invoke-RestMethod -Headers $Headers -Uri "https://$LoadBalancerIP/mgmt/tm/ltm/monitor/tcp-half-open"
    [array]$OtherMonitors += $Response.items
    $Response = Invoke-RestMethod -Headers $Headers -Uri "https://$LoadBalancerIP/mgmt/tm/ltm/monitor/tcp"
    [array]$OtherMonitors += $Response.items
    $Response = Invoke-RestMethod -Headers $Headers -Uri "https://$LoadBalancerIP/mgmt/tm/ltm/monitor/udp"
    [array]$OtherMonitors += $Response.items

    Foreach($OtherMonitor in $OtherMonitors){
        $ObjTempMonitor = New-Object Monitor

        $ObjTempMonitor.name = $OtherMonitor.name
        $ObjTempMonitor.sendstring = "N/A"
        $ObjTempMonitor.receivestring = "N/A"
        $ObjTempMonitor.interval = $OtherMonitor.interval
        $ObjTempMonitor.timeout = $OtherMonitor.timeout
        $ObjTempMonitor.type = $OtherMonitor.kind.Replace("tm:ltm:monitor:","")
        $ObjTempMonitor.loadbalancer = $LoadBalancerName

        $LoadBalancerObjects.Monitors.add($ObjTempMonitor.name, $ObjTempMonitor)
    }

    #EndRegion

    #Region Caching Pool information

    log verbose "Caching Pools from $LoadBalancerName"

    $LoadBalancerObjects.Pools = c@{}

    $Response = Invoke-RestMethod -Headers $Headers -Uri "https://$LoadBalancerIP/mgmt/tm/ltm/pool?expandSubcollections=true"
    [array]$Pools = $Response.items

    $PoolStatsDict = c@{}
    If($MajorVersion -ge 12){
        # need 12+ to support members/stats
        $Response = Invoke-WebRequest -Headers $Headers -Uri "https://$LoadBalancerIP/mgmt/tm/ltm/pool/members/stats" |
            ConvertFrom-Json -AsHashtable
        Foreach($PoolStat in $Response.entries.Values) {
            $PoolStatsDict.add($PoolStat.nestedStats.entries.tmName.description, $PoolStat.nestedStats.entries)
        }
    }

    Foreach($Pool in $Pools){
        $ObjTempPool = New-Object -Type Pool
        $ObjTempPool.loadbalancer = $LoadBalancerName
        $ObjTempPool.name = $Pool.fullPath
        if (Get-Member -inputobject $Pool -name 'monitor') {
            $objTempPool.monitors = $Pool.monitor.Trim() -split " and "
        }
        $ObjTempPool.loadbalancingmethod = $Pool.loadBalancingMode
        $ObjTempPool.actiononservicedown = $Pool.serviceDownAction
        $ObjTempPool.allownat = $Pool.allowNat
        $ObjTempPool.allowsnat = $Pool.allowSnat
        if (Get-Member -inputobject $Pool -name 'description') {
            $ObjTempPool.description = $Pool.description
        } else {
            $ObjTempPool.description = ""
        }
        if(!$PoolStatsDict[$Pool.fullPath]){
            log verbose ("Polling stats for " + $Pool.fullPath)
            # < v12 does not support member/stats, poll stats for each pool
            $uri = "https://$LoadBalancerIP/mgmt/tm/ltm/pool/" + $Pool.fullPath.replace("/","~") +"/stats?`$filter=partition%20eq%20" + $Pool.fullPath.Split("/")[1]
            $Response = Invoke-WebRequest -Headers $Headers -Uri $uri | ConvertFrom-Json -AsHashtable
            try {
                $PoolStatsDict.add($Pool.fullPath, $Response.entries.Values.nestedStats.entries)
            } catch {
                $PoolStatsDict.add($Pool.fullPath, $Response.entries)
            }
        }
        $ObjTempPool.availability = $PoolStatsDict[$Pool.fullPath].'status.availabilityState'.description
        $ObjTempPool.enabled = $PoolStatsDict[$Pool.fullPath].'status.enabledState'.description
        $ObjTempPool.status = $PoolStatsDict[$Pool.fullPath].'status.statusReason'.description

        if($Pool.membersReference.Count -gt 0) {
            $MemberStatsDict = c@{}
            $search = 'https://localhost/mgmt/tm/ltm/pool/members/' + $Pool.fullPath.replace("/","~") + '/members/stats'
            try {
                $MemberStats = $PoolStatsDict[$Pool.fullPath].$search.nestedStats.entries
            } catch {
                $uri = "https://$LoadBalancerIP/mgmt/tm/ltm/pool/" + $Pool.fullPath.replace("/","~") +"/members/stats"
                $Response = Invoke-WebRequest -Headers $Headers -Uri $uri | ConvertFrom-Json -AsHashtable
                try {
                    $MemberStats = $Response.entries
                } catch {
                    $MemberStats = c@{}
                }
                #.psobject.Properties.Value.nestedStats.entries
            }
            Foreach($MemberStat in $MemberStats.Values) {
                $MemberStatsDict.add($MemberStat.nestedStats.entries.nodeName.description + ":" + $MemberStat.nestedStats.entries.port.value, $MemberStat.nestedStats.entries)
            }
            try {
                Foreach($PoolMember in $Pool.membersReference.items) {
                    #Create a new temporary object of the member class
                    $ObjTempMember = New-Object Member
                    $ObjTempMember.Name = $PoolMember.fullPath
                    $ObjTempMember.ip = $PoolMember.address
                    $ObjTempMember.Port = $PoolMember.name.split(":")[1]
                    $ObjTempMember.Priority = $PoolMember.priorityGroup
                    $ObjTempMember.Status = $PoolMember.state

                    #$ObjTempPool.name + "|" + $PoolMember.fullPath + "|" + $MemberStatsDict[$PoolMember.fullPath].'status.availabilityState'.description
                    try {
                        $ObjTempMember.Availability = $MemberStatsDict[$PoolMember.fullPath].'status.availabilityState'.description
                    } catch {
                        $ObjTempMember.Availability = ""
                    }
                    $ObjTempMember.Enabled = $MemberStatsDict[$PoolMember.fullPath].'status.enabledState'.description
                    $ObjTempMember.currentconnections = $MemberStatsDict[$PoolMember.fullPath].'serverside.curConns'.value
                    $ObjTempMember.maximumconnections = $MemberStatsDict[$PoolMember.fullPath].'serverside.maxConns'.value

                    $ObjTempPool.members += $ObjTempMember
                }
            } catch {}
        }
        $LoadBalancerObjects.Pools.add($ObjTempPool.name, $ObjTempPool)
    }

    #EndRegion

    #Region Cache DataGroups

    log verbose "Caching datagroups from $LoadBalancerName"

    $LoadBalancerObjects.DataGroups = c@{}
    $Pools = $LoadBalancerObjects.Pools.Keys | Sort-Object -Unique

    $Response = Invoke-RestMethod -Headers $Headers -Uri "https://$LoadBalancerIP/mgmt/tm/ltm/data-group/internal"
    $DataGroups = $Response.items

    Foreach($DataGroup in $DataGroups){

        $ObjTempDataGroup = New-Object -Type DataGroup
        $ObjTempDataGroup.name = $DataGroup.fullPath
        $ObjTempDataGroup.type = $DataGroup.type
        $ObjTempDataGroup.loadbalancer = $LoadBalancerName
        $Partition = $DataGroup.partition

        $Dgdata = New-Object System.Collections.Hashtable
        $TempPools = @()

        if (Get-Member -inputobject $DataGroup -name 'records') {
            Foreach($Record in $DataGroup.records){
                if (Get-Member -inputobject $Record -name 'data') {
                    $DgData.Add($Record.name, $Record.data)
                } else {
                    $DgData.Add($Record.name, "")
                    continue
                }

                # if data contains pool names, add to .pools and change type to Pools
                if($record.data.contains("/")){
                    $TempPool = $Record.data
                } else {
                    $TempPool = "/$Partition/" + $Record.data
                }

                if ($Pools -contains $TempPool) {
                    $TempPools += $TempPool
                }
            }
        }

        $ObjTempDataGroup.data = $Dgdata

        if ($TempPools.Count -gt 0) {
            $ObjTempDataGroup.pools = @($TempPools | Sort-Object -Unique)
            $ObjTempDataGroup.type = "Pools"
        }

        $LoadBalancerObjects.DataGroups.add($ObjTempDataGroup.name, $ObjTempDataGroup)
    }

    $Response = Invoke-RestMethod -Headers $Headers -Uri "https://$LoadBalancerIP/mgmt/tm/ltm/data-group/external"

    if (Get-Member -inputobject $Response -name 'items') {
        Foreach($DataGroup in $Response.items){

            $ObjTempDataGroup = New-Object -Type DataGroup
            $ObjTempDataGroup.name = $DataGroup.fullPath
            $ObjTempDataGroup.type = $DataGroup.type
            $ObjTempDataGroup.loadbalancer = $LoadBalancerName

            $LoadBalancerObjects.DataGroups.add($ObjTempDataGroup.name, $ObjTempDataGroup)
        }
    }

    #EndRegion

    #Region Cache iRules

    log verbose "Caching iRules from $LoadBalancerName"

    $DataGroups = $LoadBalancerObjects.DataGroups.Keys | Sort-Object -Unique

    $LoadBalancerObjects.iRules = c@{}

    $Response = Invoke-RestMethod -Headers $Headers -Uri "https://$LoadBalancerIP/mgmt/tm/ltm/rule"
    $iRules = $Response.items

    $LastPartition = ''

    Foreach($iRule in $iRules) {
        $ObjiRule = New-Object iRule

        $ObjiRule.name = $iRule.fullPath
        if (Get-Member -inputobject $iRule -name "apiAnonymous") {
            $ObjiRule.definition = $iRule.apiAnonymous
        } else {
            $ObjiRule.definition = ""
        }
        $ObjiRule.loadbalancer = $LoadBalancerName

        $Partition = $iRule.partition

        if ($Partition -ne $LastPartition) {
            $SearchPools = $Pools -replace "/$Partition/",""
            $SearchDataGroups = $DataGroups -replace "/$Partition/",""
        }

        $LastPartition = $Partition

        $MatchedPools = @($SearchPools | Where-Object {$ObjiRule.definition -match '(?<![\w-])' + [regex]::Escape($_) + '(?![\w-])'} | Sort-Object -Unique)
        $MatchedPools = $MatchedPools -replace "^([^/])","/$Partition/`$1"
        $ObjiRule.pools = $MatchedPools

        $MatchedDataGroups = @($SearchDataGroups | Where-Object {$ObjiRule.definition -match '(?<![\w-])' + [regex]::Escape($_) + '(?![\w-])'} | Sort-Object -Unique)
        $MatchedDataGroups = $MatchedDataGroups -replace "^([^/])","/$Partition/`$1"
        $ObjiRule.datagroups = $MatchedDataGroups

        $ObjiRule.virtualservers = @()

        $LoadBalancerObjects.iRules.add($ObjiRule.name, $ObjiRule)
    }

    #EndRegion

    #Region Cache profiles

    log verbose "Caching profiles from $LoadBalancerName"

    $ProfileLinks = Invoke-RestMethod -Headers $Headers -Uri "https://$LoadBalancerIP/mgmt/tm/ltm/profile"

    $ProfileDict = c@{}

    Foreach($ProfileLink in $ProfileLinks.items.reference.link){
        $ProfileType = $ProfileLink.split("/")[7].split("?")[0]
        $Response = Invoke-RestMethod -Headers $Headers -Uri "https://$LoadBalancerIP/mgmt/tm/ltm/profile/${ProfileType}"
        if (Get-Member -inputobject $Response -name 'items') {
            Foreach($Profile in $Response.items){
                $ProfileDict.add($Profile.fullPath, $Profile)
            }
        }
    }

    #EndRegion

    #Region Cache virtual address information

    $Response = Invoke-RestMethod -Headers $Headers -Uri "https://$LoadBalancerIP/mgmt/tm/ltm/virtual-address"
    $VirtualAddresses = $Response.items

    $TrafficGroupDict = c@{}

    Foreach($VirtualAddress in $VirtualAddresses){
        $TrafficGroupDict.add($VirtualAddress.fullPath, $VirtualAddress.trafficGroup)
    }

    #EndRegion

    #Region Cache Virtual Server information

    log verbose "Caching Virtual servers from $LoadBalancerName"

    $LoadBalancerObjects.VirtualServers = c@{}

    $Response = Invoke-RestMethod -Headers $Headers -Uri "https://$LoadBalancerIP/mgmt/tm/ltm/virtual?expandSubcollections=true"
    [array]$VirtualServers = $Response.items

    $VirtualStatsDict = c@{}
    $Response = Invoke-WebRequest -Headers $Headers -Uri "https://$LoadBalancerIP/mgmt/tm/ltm/virtual/stats" |
        ConvertFrom-Json -AsHashtable
    Foreach($VirtualStat in $Response.entries.Values) {
        $VirtualStatsDict.add($VirtualStat.nestedStats.entries.tmName.description, $VirtualStat.nestedStats.entries)
    }

    Foreach($VirtualServer in $VirtualServers){
        $ObjTempVirtualServer = New-Object VirtualServer

        $ObjTempVirtualServer.loadbalancer = $LoadBalancerName
        $ObjTempVirtualServer.name = $VirtualServer.fullPath
        if (Get-Member -inputobject $VirtualServer -name 'description') {
            $ObjTempVirtualServer.description = $VirtualServer.description
        }
        $ObjTempVirtualServer.ip = ($VirtualServer.destination -split "[/:]")[2]
        $ObjTempVirtualServer.port = $VirtualServer.destination.split(":")[1]

        if(($ObjTempVirtualServer.port) -eq 0){
            $ObjTempVirtualServer.port = "Any"
        }

        if (Get-Member -inputobject $VirtualServer -name 'pool') {
            $ObjTempVirtualServer.defaultpool = $VirtualServer.pool
        }

        #Set the ssl profile to None by default, then check if there's an SSL profile and

        $ObjTempVirtualServer.httpprofile = "None";
        $ObjTempVirtualServer.compressionprofile = "None";
        $ObjTempVirtualServer.profiletype = "Standard";

        Foreach($Profile in $VirtualServer.profilesReference.items){
            if ($ProfileDict[$Profile.fullPath]) {
                switch ($ProfileDict[$Profile.fullPath].kind) {
                    "tm:ltm:profile:udp:udpstate"{
                        $ObjTempVirtualServer.profiletype = "UDP"
                    }
                    "tm:ltm:profile:http-compression:http-compressionstate" {
                        $ObjTempVirtualServer.compressionprofile = $Profile.fullPath
                    }
                    "tm:ltm:profile:client-ssl:client-sslstate" {
                        $ObjTempVirtualServer.sslprofileclient += $Profile.fullPath
                    }
                    "tm:ltm:profile:server-ssl:server-sslstate" {
                        $ObjTempVirtualServer.sslprofileserver += $Profile.fullPath
                    }
                    "tm:ltm:profile:fastl4:fastl4state" {
                        $ObjTempVirtualServer.profiletype = "Fast L4"
                    }
                    "tm:ltm:profile:fasthttp:fasthttpstate" {
                        $ObjTempVirtualServer.profiletype = "Fast HTTP"
                    }
                    "tm:ltm:profile:http:httpstate" {
                        $ObjTempVirtualServer.httpprofile = $Profile.fullPath
                    }
                    default {
                        #$ProfileDict[$Profile.fullPath].kind + "|" + $Profile.fullPath
                    }
                }
            }
        }

        if ($null -eq $ObjTempVirtualServer.sslprofileclient) {
            $ObjTempVirtualServer.sslprofileclient += "None";
        }
        if ($null -eq $ObjTempVirtualServer.sslprofileserver) {
            $ObjTempVirtualServer.sslprofileserver += "None";
        }

        #Get the iRules of the Virtual server
        $ObjTempVirtualServer.irules = @();
        if (Get-Member -inputobject $VirtualServer -name 'rule') {
            Foreach ($rule in $VirtualServer.rules){
                $ObjTempVirtualServer.irules += $rule

                $iRule = $LoadBalancerObjects.iRules[$rule]
                if($iRule){
                    $iRule.virtualservers += $ObjTempVirtualServer.name
                    if($iRule.pools.Count -gt 0){
                        $ObjTempVirtualServer.pools += [array]$iRule.pools
                    }
                    Foreach($DatagroupName in $iRule.datagroups ) {
                        $Datagroup = $LoadBalancerObjects.DataGroups[$DatagroupName]
                        if ($Datagroup -and $Datagroup.pools.Count -gt 0) {
                            $ObjTempVirtualServer.pools += [array]$Datagroup.pools
                        }
                    }
                } else {
                    log error "iRule $rule not found (zero length?) for ${ObjTempVirtualServer.name} on $LoadBalancerName"
                }
            }
        }

        #Get the persistence profile of the Virtual server

        if (Get-Member -inputobject $VirtualServer -name 'persist') {
            $ObjTempVirtualServer.persistence += "/" + $VirtualServer.persist.partition + "/" + $VirtualServer.persist.name
            if (Get-Member -inputobject $VirtualServer -name 'fallbackPersistence') {
                $ObjTempVirtualServer.persistence += $VirtualServer.fallbackPersistence
            }
        } else {
            $ObjTempVirtualServer.persistence += "None"
        }

        if("" -ne $ObjTempVirtualServer.defaultpool){
            $ObjTempVirtualServer.pools += $ObjTempVirtualServer.defaultpool
        }

        $ObjTempVirtualServer.pools = $ObjTempVirtualServer.pools | Sort-Object -Unique

        Try{
            $ObjTempVirtualServer.sourcexlatetype = $VirtualServer.sourceAddressTranslation.type
        } Catch {
            $ObjTempVirtualServer.sourcexlatetype = "OLDVERSION"
        }
        Try{
            $ObjTempVirtualServer.sourcexlatepool = $VirtualServer.sourceAddressTranslation.pool
        } Catch {
            $ObjTempVirtualServer.sourcexlatepool = ""
        }


        if($Global:Bigipreportconfig.Settings.iRules.enabled -eq $false){
            #Hiding iRules to the users
            $ObjTempVirtualServer.irules = @();
        }

        if(Get-Member -inputobject $VirtualServer -name 'vlans'){
            $ObjTempVirtualServer.vlans = $VirtualServer.vlans
        }

        if(Get-Member -inputobject $VirtualServer -name 'vlansEnabled'){
            $ObjTempVirtualServer.vlanstate = "enabled"
        } elseif(Get-Member -inputobject $VirtualServer -name 'vlansDisabled'){
            $ObjTempVirtualServer.vlanstate = "disabled"
        }

        $VirtualServerSASMPolicies = $LoadBalancerObjects.ASMPolicies.values | Where-Object { $_.virtualServers -contains $ObjTempVirtualServer.name }

        if($null -ne $VirtualServerSASMPolicies){
            $ObjTempVirtualServer.asmPolicies = $VirtualServerSASMPolicies.name
        }

        $ObjTempVirtualServer.trafficgroup = $TrafficGroupDict["/" + $VirtualServer.partition + "/" + $ObjTempVirtualServer.ip]

        $ObjTempVirtualServer.availability = $VirtualStatsDict[$ObjTempVirtualServer.name].'status.availabilityState'.description
        $ObjTempVirtualServer.enabled = $VirtualStatsDict[$ObjTempVirtualServer.name].'status.enabledState'.description

        #Connection statistics
        $ObjTempVirtualServer.currentconnections = $VirtualStatsDict[$ObjTempVirtualServer.name].'clientside.curConns'.value
        $ObjTempVirtualServer.maximumconnections = $VirtualStatsDict[$ObjTempVirtualServer.name].'clientside.maxConns'.value

        #CPU statistics
        $ObjTempVirtualServer.cpuavg5sec = $VirtualStatsDict[$ObjTempVirtualServer.name].'fiveSecAvgUsageRatio'.value
        $ObjTempVirtualServer.cpuavg1min = $VirtualStatsDict[$ObjTempVirtualServer.name].'oneMinAvgUsageRatio'.value
        $ObjTempVirtualServer.cpuavg5min = $VirtualStatsDict[$ObjTempVirtualServer.name].'fiveMinAvgUsageRatio'.value

        $LoadBalancerObjects.VirtualServers.add($ObjTempVirtualServer.name, $ObjTempVirtualServer)
    }

    #EndRegion

    #Region Get Orphaned Pools
    log verbose "Detecting orphaned pools on $LoadBalancerName"

    $VirtualServerPools = $LoadBalancerObjects.VirtualServers.Values.Pools | Sort-Object -Unique
    $DataGroupPools = $LoadBalancerObjects.DataGroups.Values.pools | Sort-Object -Unique

    Foreach($PoolName in $LoadBalancerObjects.Pools.Keys){
        If ($VirtualServerPools -NotContains $PoolName -and
                $DataGroupPools -NotContains $PoolName){
            $LoadBalancerObjects.Pools[$PoolName].orphaned = $true
        }
    }
    #EndRegion
}
#EndRegion

#Region Function Get-AuthToken

Function Get-AuthToken {
    Param($LoadBalancer)

    $User = $Global:Bigipreportconfig.Settings.Credentials.Username
    $Password = $Global:Bigipreportconfig.Settings.Credentials.Password

    #Create the string that is converted to Base64
    $Credentials = $User + ":" + $Password

    #Encode the string to base64
    $EncodedCreds = [System.Convert]::ToBase64String([System.Text.Encoding]::ASCII.GetBytes($Credentials))

    #Add the "Basic prefix"
    $BasicAuthValue = "Basic $EncodedCreds"

    #Prepare the headers
    $Headers = @{
        "Authorization" = $BasicAuthValue
        "Content-Type" = "application/json"
    }

    #Create the body of the post
    $Body = @{"username" = $User; "password" = $Password; "loginProviderName" = "tmos" }

    #Convert the body to Json
    $Body = $Body | ConvertTo-Json

    # REST login sometimes works, and sometimes does not. Try 3 times in case it's flakey
    try {
        $Response  = Invoke-RestMethod -Method "POST" -Headers $Headers -Body $Body -Uri "https://$LoadBalancer/mgmt/shared/authn/login"
    } catch {
        try {
            $Response  = Invoke-RestMethod -Method "POST" -Headers $Headers -Body $Body -Uri "https://$LoadBalancer/mgmt/shared/authn/login"
        } catch {
            try {
                $Response  = Invoke-RestMethod -Method "POST" -Headers $Headers -Body $Body -Uri "https://$LoadBalancer/mgmt/shared/authn/login"
            } catch {
                return $null
            }
        }
    }

    return $Response.token.token
}

#EndRegion

function GetDeviceInfo {
    Param($Device)

    $DevStartTime = Get-Date

    log verbose "Getting data from $Device"

    $AuthToken = Get-AuthToken -Loadbalancer $Device
    if ($null -eq $AuthToken) {
        log error "Could not get auth token from $Device"
        Return
    }
    $Headers = @{ "X-F5-Auth-Token" = $AuthToken; }

    $ObjLoadBalancer = New-Object -TypeName "Loadbalancer"
    $ObjLoadBalancer.ip = $Device
    $ObjLoadBalancer.statusvip = New-Object -TypeName "PoolStatusVip"

    $ObjLoadBalancer.isonlydevice = $IsOnlyDevice

    $BigIPHostname = ""
    $Response = Invoke-RestMethod -Headers $Headers -Uri "https://$Device/mgmt/tm/sys/global-settings"
    $BigIPHostname = $Response.hostname

    log verbose "Hostname is $BigipHostname for $Device"

    $ObjLoadBalancer.name = $BigIPHostname

    #Get information about ip, name, model and category
    $Response = Invoke-RestMethod -Headers $Headers -Uri "https://$Device/mgmt/tm/sys/hardware"
    $Platform = $Response.entries.'https://localhost/mgmt/tm/sys/hardware/platform'.nestedStats.entries
    $systemInfo = $Response.entries.'https://localhost/mgmt/tm/sys/hardware/system-info'.nestedStats.entries

    $ObjLoadBalancer.model = $SystemInfo.psobject.properties.value.nestedStats.entries.platform.description
    $ObjLoadBalancer.category = $Platform.psobject.properties.value.nestedStats.entries.marketingName.description

    If($ObjLoadBalancer.category -eq "Virtual Edition"){
        # Virtual Editions is using the base registration keys as serial numbers
        #$RegistrationKeys = $F5.ManagementLicenseAdministration.get_registration_keys();
        $BaseRegistrationKey = $RegistrationKeys[0]

        $Serial = "Z" + $BaseRegistrationKey.split("-")[-1]
    } else {
        $Serial = $SystemInfo.psobject.properties.value.nestedStats.entries.bigipChassisSerialNum.description
    }

    $ObjLoadBalancer.serial = $Serial

    If($ObjLoadBalancer.category -eq "VCMP"){
        #$HostHardwareInfo = $F5.SystemSystemInfo.get_hardware_information() | Where-Object { $_.name -eq "host_platform" }

        if ($HostHardwareInfo.Count -eq 1){
            $Platform = $HostHardwareInfo.versions | Where-Object { $_.name -eq "Host platform name" }

            if($Platform.Count -gt 0){
                # Some models includes the disk type for some reason: "C119-SSD". Removing it.
                $ObjLoadBalancer.model = $Platform.value -replace "-.+", ""
            }
        }
    }

    $ObjLoadBalancer.statusvip.url = $StatusVIP

    #Region Cache Load balancer information
    log verbose "Fetching information about $BigIPHostname"

    #Get the version information
    $Response = Invoke-RestMethod -Headers $Headers -Uri "https://$Device/mgmt/tm/sys/version"

    $ObjLoadBalancer.version = $Response.entries.'https://localhost/mgmt/tm/sys/version/0'.nestedStats.entries.Version.description
    $ObjLoadBalancer.build = $Response.entries.'https://localhost/mgmt/tm/sys/version/0'.nestedStats.entries.Build.description
    #$ObjLoadBalancer.baseBuild = $VersionInformation.baseBuild
    $ObjLoadBalancer.baseBuild = "unknown"

    #Get failover status to determine if the load balancer is active
    $Response = Invoke-RestMethod -Headers $Headers -Uri "https://$Device/mgmt/tm/cm/failover-status"

    $ObjLoadBalancer.active = $Response.entries.'https://localhost/mgmt/tm/cm/failover-status/0'.nestedStats.entries.status.description -eq "ACTIVE"
    $ObjLoadBalancer.color = $Response.entries.'https://localhost/mgmt/tm/cm/failover-status/0'.nestedStats.entries.color.description

    #Get provisioned modules
    $Response = Invoke-RestMethod -Headers $Headers -Uri "https://$Device/mgmt/tm/sys/provision"

    $ModuleDict = c@{}

    foreach($Module in $Response.items){
        if ($Module.level -ne "none") {
            if($ModuleToDescription.keys -contains $Module.name){
                $ModuleDescription = $ModuleToDescription[$Module.name]
            } else {
                $ModuleDescription = "No description found"
            }

            if(!($ModuleDict.keys -contains $Module.name)){
                $ModuleDict.add($Module.name, $ModuleDescription)
            }
        }
    }

    $ObjLoadBalancer.modules = $ModuleDict

    $ObjLoadBalancer.success = $true

    $LoadBalancerObjects = c@{}
    $LoadBalancerObjects.LoadBalancer = $ObjLoadBalancer

    $Global:ReportObjects.add($ObjLoadBalancer.ip, $LoadBalancerObjects)

    #Don't continue if this loadbalancer is not active
    If($ObjLoadBalancer.active -or $ObjLoadBalancer.isonlydevice){
        log verbose "Caching LTM information from $BigIPHostname"
        Get-LTMInformation -headers $Headers -LoadBalancer $LoadBalancerObjects
        # Record some stats
        $StatsMsg = "$BigIPHostname Stats:"
        $StatsMsg += " VS:" + $LoadBalancerObjects.VirtualServers.Keys.Count
        $StatsMsg += " P:" + $LoadBalancerObjects.Pools.Keys.Count
        $StatsMsg += " R:" + $LoadBalancerObjects.iRules.Keys.Count
        $StatsMsg += " DG:" + $LoadBalancerObjects.DataGroups.Keys.Count
        $StatsMsg += " C:" + $LoadBalancerObjects.Certificates.Keys.Count
        $StatsMsg += " M:" + $LoadBalancerObjects.Monitors.Keys.Count
        $StatsMsg += " ASM:" + $LoadBalancerObjects.ASMPolicies.Keys.Count
        $StatsMsg += " T:" + $($(Get-Date)-$DevStartTime).TotalSeconds
        log success $StatsMsg
    } else {
        log info "$BigIPHostname is not active, and won't be indexed"
        return
    }
}


#Region Call Cache LTM information
$jobs = @()
Foreach($DeviceGroup in $Global:Bigipreportconfig.Settings.DeviceGroups.DeviceGroup) {
    $IsOnlyDevice = @($DeviceGroup.Device).Count -eq 1
    $StatusVIP = $DeviceGroup.StatusVip

    $ObjDeviceGroup = New-Object -TypeName "DeviceGroup"
    $ObjDeviceGroup.name = $DeviceGroup.name

    Foreach($Device in $DeviceGroup.Device){
        $ObjDeviceGroup.ips += $Device
        if($null -eq $PollLoadBalancer){
            $jobs += Start-Job -Name $Device -FilePath $PSCommandPath -ArgumentList $ConfigurationFile,$Device,$PSScriptRoot
        } elseif ($Device -eq $PollLoadBalancer){
            GetDeviceInfo($PollLoadBalancer)
            $Global:ReportObjects[$PollLoadBalancer]|ConvertTo-Json -Compress -Depth 10
            exit
        }
    }
    $Global:DeviceGroups += $ObjDeviceGroup
}
#EndRegion

#Collect data from each load balancer
$Global:Out = c@{}
$Global:Out.ASMPolicies=@()
$Global:Out.Certificates=@()
$Global:Out.DataGroups=@()
$Global:Out.iRules=@()
$Global:Out.Monitors=@()
$Global:Out.Pools=@()
$Global:Out.VirtualServers=@()

do {
    $completed=0
    $remaining=0
    $failed=0
    foreach($job in $jobs){
        if ($job.HasMoreData) {
            $lines=Receive-Job -Job $job
            Foreach($line in $lines) {
                try {
                    $obj=ConvertFrom-Json -AsHashTable $line
                    #$obj=ConvertFrom-Json $line
                    # process contents of $obj, if log, add to global log and echo to screen, else store results.
                    if ($obj["datetime"]) {
                        log $obj.severity ($job.name+':'+$obj.message) $obj.datetime
                    } elseif ($obj["LoadBalancer"]) {
                        $Global:ReportObjects.add($obj.LoadBalancer.ip, $obj)
                        Foreach ($thing in ("ASMPolicies","Certificates","DataGroups","iRules","Monitors","Pools","VirtualServers")) {
                            if ($obj[$thing]) {
                                Foreach($object in $obj.$thing.Values) {
                                    $Global:Out.$thing += $object
                                }
                            }
                        }
                    } else {
                        log error ($job.name+':Unmatched:'+$line)
                    }
                } catch {
                    log error ($job.name+':Unparsed:'+$line)
                }
            }
        }
        if ($job.State -eq "Completed") {
            $completed++
        } elseif ($job.State -eq "Failed") {
            $failed++
        } else {
            $remaining++
        }
    }
    Write-Host -NoNewLine "Completed: $completed, Failed: $failed, Remaining: $remaining   `r"
    Start-Sleep 1
} until ($remaining -eq 0)
# remove completed jobs
$jobs | Remove-Job

#Region Function Test-ReportData

#Verify that data from all the load balancers has been indexed by checking the pools variable
function Test-ReportData {
    $NoneMissing = $true
    log verbose "Verifying load balancer data to make sure that no load balancer is missing"
    #For every load balancer IP we will check that no pools or virtual servers are missing
    Foreach($DeviceGroup in $Global:Bigipreportconfig.Settings.DeviceGroups.DeviceGroup) {
        $DeviceGroupHasData = $False
        ForEach($Device in $DeviceGroup.Device){
            $LoadBalancerObjects = $Global:ReportObjects[$Device]
            If ($LoadBalancerObjects) {
                $LoadBalancer = $LoadBalancerObjects.LoadBalancer
                $LoadBalancerName = $LoadBalancer.name
                # Only check for load balancers that is alone in a device group, or active
                if($LoadBalancer.active -or $LoadBalancer.isonlydevice){
                    $DeviceGroupHasData = $True
                    #Verify that the $Global:virtualservers contains the $LoadBalancerName
                    If ($LoadBalancerObjects.VirtualServers.Count -eq 0) {
                        log error "$LoadBalancerName does not have any Virtual Server data"
                        $NoneMissing = $false
                    }
                    #Verify that the $Global:pools contains the $LoadBalancerName
                    If ($LoadBalancerObjects.Pools.Count -eq 0) {
                        log error "$LoadBalancerName does not have any Pool data"
                    }
                    #Verify that the $Global:monitors contains the $LoadBalancerName
                    If ($LoadBalancerObjects.Monitors.Count -eq 0){
                        log error "$LoadBalancerName does not have any Monitor data"
                        $NoneMissing = $false
                    }
                    #Verify that the $Global:irules contains the $LoadBalancerName
                    If ($LoadBalancerObjects.iRules.Count -eq 0) {
                        log error "$LoadBalancerName does not have any iRule data"
                        $NoneMissing = $false
                    }
                    #Verify that the $Global:nodes contains the $LoadBalancerName
                    if($LoadBalancerObjects.Nodes.Count -eq 0){
                        log error "$LoadBalancerName does not have any Node data"
                        $NoneMissing = $false
                    }
                    #Verify that the $Global:DataGroups contains the $LoadBalancerName
                    if($LoadBalancerObjects.DataGroups.Count -eq 0){
                        log error "$LoadBalancerName does not have any Data group data"
                        $NoneMissing = $false
                    }
                    #Verify that the $Global:Certificates contains the $LoadBalancerName
                    if($LoadBalancerObjects.Certificates.Count -eq 0){
                        log error "$LoadBalancerName does not have any Certificate data"
                        $NoneMissing = $false
                    }
                }
            } Else {
                log error "$Device does not seem to have been indexed"
                $NoneMissing = $false
            }
        }
        If (-Not $DeviceGroupHasData){
            log error "Missing data from device group containing $($DeviceGroup.Device -Join ", ")."
            $NoneMissing = $false
        }
    }
    Return $NoneMissing
}
#EndRegion

#Region Function Update-ReportData
Function Update-ReportData {
    [bool]$Status = $true

    #Move the temp files to the actual report files
    Foreach($path in $Global:paths.Values | Sort-Object) {
        log verbose "Updating $path"
        Move-Item -Force ($path + ".tmp") $path

        if(!$?){
            log error "Failed to update $path"
            $Status  = $false
        }
    }

    Return $Status
}
#EndRegion

Function Write-JSONFile {
    Param($Data, $DestinationFile)

    $DestinationTempFile = $DestinationFile + ".tmp"

    log verbose "Writing $DestinationTempFile from $PSScriptRoot"

    $Utf8NoBomEncoding = New-Object System.Text.UTF8Encoding $False

    if ($Outputlevel -ne "Verbose") {
        $JSONData = ConvertTo-Json -Compress -Depth 5 $Data
    } else {
        $JSONData = ConvertTo-Json -Depth 5 $Data
    }

    $StreamWriter = New-Object System.IO.StreamWriter($DestinationTempFile, $false, $Utf8NoBomEncoding,0x10000)
    $StreamWriter.Write($JSONData)

    if(!$?){
        log error "Failed to update the temporary pool json file"
        $Success = $false
    } else {
        $Success = $true
    }

    $StreamWriter.dispose()

    Return $Success
}

#Region Function Write-TemporaryFiles
Function Write-TemporaryFiles {
    #This is done to save some downtime if writing the report over a slow connection
    #or if the report is really big.

    $WriteStatuses = @()

    $Utf8NoBomEncoding = New-Object System.Text.UTF8Encoding $False

    log verbose "Writing $($Global:paths.report + ".tmp")"

    $HTMLContent = $Global:HTML.ToString();

    # remove whitespace from output
    if($Outputlevel -ne "Verbose"){
        $HTMLContent = $HTMLContent.Split("`n").Trim() -Join "`n"
    }

    $StreamWriter = New-Object System.IO.StreamWriter($($Global:paths.report + ".tmp"), $false, $Utf8NoBomEncoding,0x10000)
    $StreamWriter.Write($HTMLContent)

    if(!$?){
        log error "Failed to update the temporary report file"
        $WriteStatuses += $false
    }

    $StreamWriter.dispose()

    $WriteStatuses += Write-JSONFile -DestinationFile $Global:paths.preferences -Data $Global:Preferences
    $WriteStatuses += Write-JSONFile -DestinationFile $Global:paths.loggederrors -Data @( $Global:LoggedErrors )
    $WriteStatuses += Write-JSONFile -DestinationFile $Global:paths.devicegroups -Data @( $Global:DeviceGroups | Sort-Object name )
    $WriteStatuses += Write-JSONFile -DestinationFile $Global:paths.loadbalancers -Data @( $Global:ReportObjects.Values.LoadBalancer | Sort-Object name )
    $WriteStatuses += Write-JSONFile -DestinationFile $Global:paths.nat -Data $Global:NATdict

    $WriteStatuses += Write-JSONFile -DestinationFile $Global:paths.pools -Data @( $Global:Out.Pools | Sort-Object loadbalancer, name )
    $WriteStatuses += Write-JSONFile -DestinationFile $Global:paths.monitors -Data @( $Global:Out.Monitors | Sort-Object loadbalancer, name )
    $WriteStatuses += Write-JSONFile -DestinationFile $Global:paths.virtualservers -Data @( $Global:Out.VirtualServers | Sort-Object loadbalancer,name )
    $WriteStatuses += Write-JSONFile -DestinationFile $Global:paths.certificates -Data @( $Global:Out.Certificates | Sort-Object loadbalancer, fileName )
    $WriteStatuses += Write-JSONFile -DestinationFile $Global:paths.asmpolicies -Data @( $Global:Out.ASMPolicies | Sort-Object loadbalancer, name )

    if($Global:Bigipreportconfig.Settings.iRules.Enabled -eq $true){
        $WriteStatuses += Write-JSONFile -DestinationFile $Global:paths.irules -Data @($Global:Out.iRules | Sort-Object loadbalancer, name )
    } else {
        log verbose "iRule links disabled in config. Writing empty json object to $($Global:irules + ".tmp")"

        $StreamWriter = New-Object System.IO.StreamWriter($($Global:irules + ".tmp"), $false, $Utf8NoBomEncoding,0x10000)

        #Since rules has been disabled, only write those defined
        $RuleScope = $Global:Out.iRules | Where-Object { $_.name -in $Bigipreportconfig.Settings.iRules.iRule.iRuleName -and $_.loadbalancer -in $Bigipreportconfig.Settings.iRules.iRule.loadbalancer }

        if($RuleScope.count -eq 0){
            $StreamWriter.Write("[]")
        } else {
            $StreamWriter.Write($(ConvertTo-Json -Compress -Depth 5 [array]$RuleScope))
        }

        if(!$?){
            log error "Failed to update the temporary irules json file"
            $WriteStatuses += $false
        }
    }

    $StreamWriter.dispose()

    if($Global:Bigipreportconfig.Settings.iRules.ShowDataGroupLinks -eq $true){
        $WriteStatuses += Write-JSONFile -DestinationFile $Global:paths.datagroups -Data @( $Global:Out.DataGroups | Sort-Object loadbalancer, name )
    } else {
        $WriteStatuses += Write-JSONFile -DestinationFile $Global:paths.datagroups -Data @()
    }
    $StreamWriter.dispose()
    Return -not $( $WriteStatuses -Contains $false)
}

#EndRegion

#Region Check for missing data
if(-not (Test-ReportData)){
    if(-not $Global:Bigipreportconfig.Settings.ErrorReportAnyway -eq $true){
        log error "Missing load balancer data, no report will be written"
        Send-Errors
        Exit
    }
    log error "Missing load balancer data, writing report anyway"
} else {
    log success "No missing loadbalancer data was detected, compiling the report"
}

#EndRegion

#Global:html contains the report html data
#Add links to style sheets, jquery and datatables and some embedded javascripts

$Global:HTML = [System.Text.StringBuilder]::new()

[void]$Global:HTML.AppendLine(@'
<!DOCTYPE html>
<html lang="en">
    <head>
        <title>BIG-IP Report</title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">

        <link href="css/pace.css" rel="stylesheet" type="text/css"/>
        <link href="css/jquery.dataTables.css" rel="stylesheet" type="text/css">
        <link href="css/buttons.dataTables.min.css" rel="stylesheet" type="text/css">
        <link href="css/bigipreportstyle.css" rel="stylesheet" type="text/css">
        <link href="css/sh_style.css" rel="stylesheet" type="text/css">

        <script src="js/pace.js" data-pace-options="{ &quot;restartOnRequestAfter&quot;: false }"></script>
        <script src="js/jquery.min.js"></script>
        <script src="js/jquery.dataTables.min.js"></script>
        <script src="js/dataTables.buttons.min.js"></script>
        <script src="js/buttons.colVis.min.js"></script>
        <script src="js/buttons.html5.min.js"></script>
        <script src="js/buttons.print.min.js"></script>
        <script src="js/jquery.highlight.js"></script>
        <script src="js/bigipreport.js"></script>
        <script src="js/sh_main.js"></script>
    </head>
    <body>
        <div class="beforedocumentready"></div>
        <div class="bigipreportheader"><img src="images/bigipreportlogo.png" alt="bigipreportlogo"/></div>
        <div class="realtimestatusdiv" onclick="javascript:pollCurrentView();">
            <table>
                <tr>
                    <td><span class="topleftheader">Status VIPs:</span></td><td><span id="realtimetestsuccess">0</span> working, <span id="realtimetestfailed">0</span> failed, <span id="realtimenotconfigured">0</span> not configured</td>
                </tr>
                <tr>
                    <td><span class="topleftheader">Polling state:</span></td><td id="pollingstatecell"><span id="ajaxqueue">0</span> queued<span id="realtimenextrefresh"></span></td>
                </tr>
            </table>
        </div>
        <div id="updateavailablediv"></div>
        <div id="mainholder">
            <div class="sidemenu">
                <div class="menuitem" id="virtualserversbutton" onclick="Javascript:showVirtualServers();"><img id="virtualserverviewicon" src="images/virtualservericon.png" alt="virtual servers"/> Virtual Servers</div>
                <div class="menuitem" id="poolsbutton" onclick="Javascript:showPools();"><img id="poolsicon" src="images/poolsicon.png" alt="pools"/> Pools</div>
                <div class="menuitem" id="irulesbutton" onclick="Javascript:showiRules();"><img id="irulesicon" src="images/irulesicon.png" alt="irules"/> iRules</div>
                <div class="menuitem" id="datagroupbutton" onclick="Javascript:showDataGroups();"><img id="datagroupsicon" src="images/datagroupicon.png" alt="logs"/> Data Groups</div>
                <div class="menuitem" id="deviceoverviewbutton" onclick="Javascript:showDeviceOverview();"><img id="devicesoverviewicon" src="images/devicesicon.png" alt="overview"/> Device overview</div>
                <div class="menuitem" id="certificatebutton" onclick="Javascript:showCertificateDetails();"><img id="certificateicon" src="images/certificates.png" alt="certificates"/> Certificates<span id="certificatenotification"></span></div>
                <div class="menuitem" id="logsbutton" onclick="Javascript:showLogs();"><img id="logsicon" src="images/logsicon.png" alt="logs"/> Logs</div>
                <div class="menuitem" id="preferencesbutton" onclick="Javascript:showPreferences();"><img id="preferencesicon" src="images/preferences.png" alt="preferences"/> Preferences</div>
                <div class="menuitem" id="helpbutton" onclick="Javascript:showHelp();"><img id="helpicon" src="images/help.png" alt="help"/> Help</div>
            </div>

            <div class="mainsection" id="virtualservers" style="display: none;"></div>
            <div class="mainsection" id="pools" style="display: none;"></div>
            <div class="mainsection" id="irules" style="display: none;"></div>
            <div class="mainsection" id="datagroups" style="display: none;"></div>
            <div class="mainsection" id="deviceoverview" style="display: none;"></div>
            <div class="mainsection" id="certificatedetails" style="display: none;"></div>
            <div class="mainsection" id="logs" style="display: none;"></div>
            <div class="mainsection" id="preferences" style="display: none;"></div>

            <div class="mainsection" id="helpcontent" style="display: none;">
                <h3>Filtering on virtual server, pool or pool member status</h3>
                <p>This is a bit of a hidden feature. In VirtualServer, Pool, and Member columns you can filter on status.
                The status options are {enabled|disabled}:{available|offline|unknown}.
                For example, try searching for: "enabled:available", ":unknown" or "disabled:" as a general or field search.</p>
                <p>It's not perfect since pools or members with any of these words in the name can also end up as results.</p>
                <h3>Column filtering</h3>
                <p>Clicking on any column header allows you to filter data within that column. This has been more clear in the later versions but worth mentioning in case you've missed it.</p>
                <h3>Regular Expression Searching</h3>
                <p>Under Preferences, Regular Expression searching is enabled by default. This allows entering filters like "this|that" to filter to one or the other values.
                Other examples include "^((?!pool_).)*$" to filter a column to entries that don't contain "pool_" or "\bcom" to pickup "com" only after a wordbreak.</p>
                <h3>Pool member tests</h3>
                <p>If you click on any pool name to bring up the details you have a table at the bottom containing tests for each configured monitor. The tests is generating HTTP links, CURL links and netcat commands for HTTP based monitors and can be used to troubleshoot why a monitor is failing.</p>
                <h3>Feature requests</h3>
                <p>Please add any feature requests or suggestions here:</p>
                <p><a href="https://devcentral.f5.com/codeshare/bigip-report">https://devcentral.f5.com/codeshare/bigip-report</a></p>
                <p>And if you like the project, please set aside some of your time to leave a <a href="https://devcentral.f5.com/codeshare/bigip-report#rating">review/rating</a>.</p>
                <h3>Troubleshooting</h3>
                <p>If the report does not work as you'd expect or you're getting error messages, please read the <a href="https://loadbalancing.se/bigip-report/#FAQ">FAQ</a>&nbsp;first. If you can't find anything there, please add a comment in the project over at <a href="https://devcentral.f5.com/codeshare/bigip-report">Devcentral</a>.</p>
                <p>To collect and download anonymized data for submitting a device overview bug report, <a href="javascript:exportDeviceData()">Export Device Data</a>.</p>
                <h3>Contact</h3>
                <p>If you need to contact the authors, please post on the devcentral forum above or directly on the
                <a href="https://github.com/epacke/BigIPReport">BigIPReport GitHub</a> project.</p>
            </div>
        </div>
'@)

[void]$Global:HTML.AppendLine(@"
        <div class="footer">
            The report was generated on $($Global:hostname) using BigIPReport version $($Global:ScriptVersion).
            Script started at <span id="Generationtime">$StartTime</span> and took $([int]($(Get-Date)-$StartTime).totalminutes) minutes to finish.<br>
            BigIPReport is written and maintained by <a href="http://loadbalancing.se/about/">Patrik Jonsson</a>
            and <a href="https://rikers.org/">Tim Riker</a>.
        </div>
"@)

[void]$Global:HTML.AppendLine(@'
        <div class="lightbox" id="firstlayerdiv">
            <div class="innerLightbox">
                <div class="lightboxcontent" id="firstlayerdetailscontentdiv">
                </div>
            </div>
            <div id="firstlayerdetailsfooter" class="firstlayerdetailsfooter"><a class="lightboxbutton" id="closefirstlayerbutton" href="javascript:void(0);">Close div</a></div>
        </div>

        <div class="lightbox" id="secondlayerdiv">
            <div class="innerLightbox">
                <div class="lightboxcontent" id="secondlayerdetailscontentdiv">
                </div>
            </div>
            <div class="secondlayerdetailsfooter" id="secondlayerdetailsfooter"><a class="lightboxbutton" id="closesecondlayerbutton" href="javascript:void(0);">Close div</a></div>
        </div>
    </body>
</html>
'@)

# Save Preferences
$Global:Preferences['HideLoadBalancerFQDN'] = ($Global:Bigipreportconfig.Settings.HideLoadBalancerFQDN -eq $true)
$Global:Preferences['PollingMaxPools'] = [int]$Global:Bigipreportconfig.Settings.RealTimeMemberStates.MaxPools
$Global:Preferences['PollingMaxQueue'] = [int]$Global:Bigipreportconfig.Settings.RealTimeMemberStates.MaxQueue
$Global:Preferences['PollingRefreshRate'] = [int]$Global:Bigipreportconfig.Settings.RealTimeMemberStates.RefreshRate
$Global:Preferences['ShowDataGroupLinks'] = ($Global:Bigipreportconfig.Settings.iRules.ShowDataGroupLinks -eq $true)
$Global:Preferences['ShowiRuleLinks'] = ($Global:Bigipreportconfig.Settings.iRules.ShowiRuleLinks -eq $true)
$Global:Preferences['ShowiRules'] = ($Global:Bigipreportconfig.Settings.iRules.enabled -eq $true)
$Global:Preferences['autoExpandPools'] = ($Global:Bigipreportconfig.Settings.autoExpandPools -eq $true)
$Global:Preferences['regexSearch'] = ($Global:Bigipreportconfig.Settings.regexSearch -eq $true)
$Global:Preferences['showAdcLinks'] = ($Global:Bigipreportconfig.Settings.showAdcLinks -eq $true)

# Record some stats

$StatsMsg = "Stats:"
$StatsMsg += " G:" + $Global:DeviceGroups.Count
$StatsMsg += " LB:" + $Global:ReportObjects.Values.LoadBalancer.Count
$StatsMsg += " VS:" + $Global:Out.VirtualServers.Length
$StatsMsg += " P:" + $Global:Out.Pools.Length
$StatsMsg += " R:" + $Global:Out.iRules.Length
$StatsMsg += " DG:" + $Global:Out.DataGroups.Length
$StatsMsg += " C:" + $Global:Out.Certificates.Length
$StatsMsg += " M:" + $Global:Out.Monitors.Length
$StatsMsg += " ASM:" + $Global:Out.ASMPolicies.Length
$StatsMsg += " T:" + $($(Get-Date)-$StartTime).TotalSeconds
log success $StatsMsg

# Write temporary files and then update the report

$TemporaryFilesWritten = $false

if(-not (Write-TemporaryFiles)){
    #Failed to write the temporary files
    log error "Failed to write the temporary files, waiting 2 minutes and trying again"
    Start-Sleep 120

    if(Write-TemporaryFiles){
        $TemporaryFilesWritten = $true
        log success "Successfully wrote the temporary files"
    } else {
        log error "Failed to write the temporary files. No report has been created/updated"
    }
} else {
    $TemporaryFilesWritten = $true
    log success "Successfully wrote the temporary files"
}

if($TemporaryFilesWritten){
    #Had some problems with the move of the temporary files
    #Adding a sleep to allow the script to finish writing
    Start-Sleep 5

    if(Update-ReportData){
        log success "The report has been successfully been updated"
    }
} else {
    log error "The writing of the temporary files failed, no report files will be updated"
}

# send errors if there where any
Send-Errors

if($Global:Bigipreportconfig.Settings.LogSettings.Enabled -eq $true){
    $LogFile = $Global:Bigipreportconfig.Settings.LogSettings.LogFilePath

    if(Test-Path $LogFile){
         log verbose "Pruning logfile $LogFile"

        $MaximumLines = $Global:Bigipreportconfig.Settings.LogSettings.MaximumLines

        $LogContent = Get-Content $LogFile -Encoding UTF8
        $LogContent | Select-Object -Last $MaximumLines | Out-File $LogFile -Encoding UTF8
    }
}

# Done

$DoneMsg = "Done."
$DoneMsg += " T:" + $($(Get-Date)-$StartTime).TotalSeconds
log verbose $DoneMsg