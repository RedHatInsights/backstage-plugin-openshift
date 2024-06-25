import React, { useState, useEffect } from 'react';
import {
  Progress,
  ProgressVariant,
  ProgressMeasureLocation,
} from '@patternfly/react-core';
import LinearProgress from '@material-ui/core/LinearProgress';

const ResourceUsageProgress = (resourceInfo: any) => {


    console.log(resourceInfo)
    // console.log(resourceRequests)
    // console.log(resourceLimits)
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
        backgroundColor: '#1a90ff',
      },
    }))(LinearProgress);

    // Validate that usage is below the resource limits
    let variant = ProgressVariant.success;
    if (usage > requests) {
      variant = usage > limits * 0.8 ? "#8B0000" : "#228B22";
    }

    const percentage = ((usage * 100) / limits);
    console.log(percentage)

    if (percentage !== 0) {
    return (
        <div>
          <BorderLinearProgress variant="determinate" value={50} />
        </ div>
    )
  }
}

export default ResourceUsageProgress;