#! /usr/bin/pwsh
#Requires -Version 6

Param(
    $Device,
    $userpass
)

Set-StrictMode -Version 1.0
$ErrorActionPreference = "Stop"
$Error.Clear()

$EncodedCreds = [System.Convert]::ToBase64String([System.Text.Encoding]::ASCII.GetBytes($userpass))
$BasicAuthValue = "Basic $EncodedCreds"

$Headers = @{
    "Authorization" = $BasicAuthValue
}

$Response1 = Invoke-RestMethod -Headers $Headers -Uri "https://$Device/mgmt/tm/ltm/pool/members/stats?`$filter=partition"

Foreach($PoolStat in $Response1.entries.psobject.properties.Value) {
    Write-Host "Pool:" $PoolStat.nestedStats.entries.tmName.description
    Foreach($PoolMemberStat in $PoolStat.nestedStats.entries.psobject.Properties.Value.nestedStats.entries.psobject.Properties.Value) {
        Write-Host "Member:" $PoolMemberStat.nestedStats.entries.nodeName.description
    }
}

$Response2 = Invoke-WebRequest -Headers $Headers -Uri "https://$Device/mgmt/tm/ltm/pool/members/stats?`$filter=partition" |
        ConvertFrom-Json -AsHashtable

Foreach($PoolStat in $Response2.entries.Values) {
    Write-Host "Pool:" $PoolStat.nestedStats.entries.tmName.description
    Foreach($PoolMemberStat in $PoolStat.nestedStats.entries.Values.nestedStats.entries.Values) {
        Write-Host "Member:" $PoolMemberStat.nestedStats.Values.nodeName.description
    }
}