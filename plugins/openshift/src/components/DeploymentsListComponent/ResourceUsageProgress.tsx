import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import LinearProgress from '@material-ui/core/LinearProgress';
import { Tooltip } from '@patternfly/react-core';
import { Card, CardContent } from '@material-ui/core';

const ResourceUsageProgress = (resourceInfo: any) => {
    const resourceType = resourceInfo.resourceType;
    const usage = resourceInfo.resourceUsage[resourceType];
    const requests = resourceInfo.resourceLimitsRequests.requests ? resourceInfo?.resourceLimitsRequests?.requests[resourceType] : 0;
    const limits = resourceInfo.resourceLimitsRequests.limits ? resourceInfo?.resourceLimitsRequests?.limits[resourceType] : 0;
    const [canShowProgress, setCanShowProgress] = React.useState(false);

    React.useEffect(() => {
      setCanShowProgress(Number.isNaN(usage) || Number.isNaN(requests) || Number.isNaN(limits));
    }, [usage, limits, requests]);

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

    // Clamp this value at a max of 100
    const percentage = Math.min((usage / limits) * 100, 100);

    const usagePercentageOfRequests = (usage / requests) * 100;
    const usagePercentageOfLimits = (usage / limits) * 100;

    const formatResourceValue = (value: number) => {
      if (resourceInfo.resourceType === 'memory') {
        return `${(value / 1024).toFixed(4)} GB`;
      }
      return `${value.toFixed(4)} cores`;
    };

  const ToolTipContent = () => {
    return (
      <Card>
        <CardContent>
        <React.Fragment>
        Usage: {formatResourceValue(usage)} ({usagePercentageOfLimits.toFixed(2)}% of limits, {usagePercentageOfRequests.toFixed(2)}% of requests)
        <br />
        Requests: {formatResourceValue(requests)}
        <br />
        Limits: {formatResourceValue(limits)}
      </React.Fragment>
        </CardContent>
      </Card>

    )
  }
  
    return (
        <React.Fragment>
          <Tooltip content={<ToolTipContent/>} >
            <BorderLinearProgress variant="determinate" value={percentage} />
          </Tooltip>
        </ React.Fragment>
    )
}

export default ResourceUsageProgress;