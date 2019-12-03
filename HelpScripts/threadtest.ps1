#! /usr/bin/pwsh
#Requires -Version 5

# ThreadJob sample with json feedback from threads
# by Tim Riker <Tim@Rikers.org>

# requires ThreadJob which is included in 6.x, and available for 5.x
# to install, as adminstrator, run: Install-Module -Name ThreadJob
# to verify run: Get-Command Start-ThreadJob | select name

try {
    $oldPreference = $ErrorActionPreference
    $ErrorActionPreference = "stop"
    if(Get-Command Start-ThreadJob){
        #
    }
} catch {
    "Start-ThreadJob is required"
    "As Administrator, try: Install-Module -Name ThreadJob"
    exit
} Finally {
    $ErrorActionPreference=$oldPreference
}

$logs=@()
$results=@{}
$jobs=@()
Measure-Command {
    ForEach($num in 0..2) {
        $params=@{num=$num;name="Job-$num"}
        $jobs += Start-ThreadJob -ThrottleLimit 2 -Name $params.name -InputObject $params -ScriptBlock {
            function internallog {
                Param ([string]$LogType, [string]$Message)
                $CurrentTime = $(Get-Date -UFormat "%Y-%m-%d %H:%M:%S")
                $log=@{datetime=$CurrentTime; type=$LogType; message=$Message}
                $log | ConvertTo-Json -Compress
            }
            $arr = @($input)
            $output=@{output=1;input=$arr[0]}
            $totaltime=0;
            Foreach($round in 0..3){
                $time=Get-Random -Minimum 0.1 -Maximum 5.0
                $totaltime+=$time
                internallog "normal" ("job="+$arr.num+"`r`nround=$round`r`ntime=$time")
                Get-Random -Minimum 0.1 -Maximum 5.0 | Start-Sleep
            }
            $output.output=@{result=($arr.num * 10);totaltime=$totaltime}
            $output | ConvertTo-Json -Compress
        }
    }
    # loop getting information from jobs
    do {
        $remaining=0
        foreach($job in $jobs){
            if ($job.State -ne "Completed") {
                $remaining++
            }
            if ($job.HasMoreData) {
                $lines=Receive-Job -Job $job
                Foreach($line in $lines) {
                    $obj=ConvertFrom-Json $line
                    # process contents of $obj, if log, add to global log and echo to screen, else store results.
                    if($obj.datetime) {
                        $logs += $obj
                    } elseif ($obj.input.name) {
                        $results.add($obj.input.name,$obj)
                    }
                    Write-Host "Temp:$line"
                }
            }
        }
        Write-Host -NoNewLine "Remaining: $remaining `r"
        Start-Sleep 1
    } until ($remaining -eq 0)

    # wait for jobs to shut down
    $jobs | Wait-Job
    $jobs | Remove-Job
} | Select-Object TotalSeconds
$logs | ConvertTo-Json
$results | ConvertTo-Json
