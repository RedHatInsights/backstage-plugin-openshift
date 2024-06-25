import React, { useState, useEffect } from 'react';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import LinearProgress from '@material-ui/core/LinearProgress';

const ResourceUsageProgress = (resourceInfo: any) => {


    console.log(resourceInfo)
    const resourceType = resourceInfo.resourceType;
    const usage = resourceInfo.resourceUsage[resourceType];
    console.log(usage)
    const requests = resourceInfo.resourceLimitsRequests.requests ? resourceInfo?.resourceLimitsRequests?.requests[resourceType] : 0;
    console.log(requests)
    const limits = resourceInfo.resourceLimitsRequests.limits ? resourceInfo?.resourceLimitsRequests?.limits[resourceType] : 0;
    console.log(limits)

    const useStyles = makeStyles({
      root: {
        flexGrow: 1,
      },
    });

    const classes = useStyles();

    // Validate that usage is below the resource limits
    let barColor = "#228B22";
    if (usage > requests) {
      barColor = usage > limits * 0.8 ? "#B22222" : "#FFD700";
    }

    const BorderLinearProgress = withStyles((theme) => ({
      root: {
        height: 10,
        borderRadius: 5,
      },
      colorPrimary: {
        backgroundColor: theme.palette.grey[theme.palette.type === 'light' ? 200 : 700],
      },
      bar: {
        borderRadius: 5,
        backgroundColor: barColor,
      },
    }))(LinearProgress);

    const percentage = ((usage * 100) / limits);
    console.log(percentage)

    if (percentage !== 0) {
    return (
        <div>
          <BorderLinearProgress variant="determinate" value={percentage} />
        </ div>
    )
  }
}

export default ResourceUsageProgress;