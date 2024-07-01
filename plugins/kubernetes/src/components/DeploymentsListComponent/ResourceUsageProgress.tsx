import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import LinearProgress from '@material-ui/core/LinearProgress';
import { Tooltip } from '@patternfly/react-core';

const ResourceUsageProgress = (resourceInfo: any) => {
    const resourceType = resourceInfo.resourceType;
    const usage = resourceInfo.resourceUsage[resourceType];
    const requests = resourceInfo.resourceLimitsRequests.requests ? resourceInfo?.resourceLimitsRequests?.requests[resourceType] : 0;
    const limits = resourceInfo.resourceLimitsRequests.limits ? resourceInfo?.resourceLimitsRequests?.limits[resourceType] : 0;

    console.log(`${resourceType} Usage: ${resourceInfo.resourceUsage[resourceType]}`)
    console.log(`${resourceType} Limits: ${resourceInfo?.resourceLimitsRequests?.limits[resourceType]}`)
    console.log(`${resourceType} Requests: ${resourceInfo?.resourceLimitsRequests?.requests[resourceType]}`)

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

    const percentage = (usage / limits) * 100;
    const usagePercentageOfRequests = (usage / requests) * 100;
    const usagePercentageOfLimits = (usage / limits) * 100;
    console.log(percentage)

    const formatResourceValue = (value) => {
      if (resourceInfo.resourceType === 'memory') {
        return `${(value / 1024).toFixed(4)} GB`;
      }
      return `${value.toFixed(4)} cores`;
    };

    const tooltipContent = `
    Usage: ${formatResourceValue(usage)} (${usagePercentageOfLimits.toFixed(2)}% of limits, ${usagePercentageOfRequests.toFixed(2)}% of requests)
    Requests: ${formatResourceValue(requests)}
    Limits: ${formatResourceValue(limits)}
  `;

    return (
        <React.Fragment>
          <Tooltip content={tooltipContent}>
            <BorderLinearProgress variant="determinate" value={percentage} />
          </Tooltip>
        </ React.Fragment>
    )
}

export default ResourceUsageProgress;