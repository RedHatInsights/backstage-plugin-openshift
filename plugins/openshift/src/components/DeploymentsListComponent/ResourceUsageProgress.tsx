import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import LinearProgress from '@material-ui/core/LinearProgress';
import { Tooltip } from '@patternfly/react-core';
import { Card, CardContent } from '@material-ui/core';

const ResourceUsageProgress = (resourceInfo: any) => {
  const resourceType = resourceInfo.resourceType;
  const usage = resourceInfo.resourceUsage[resourceType];
  const requests = resourceInfo.resourceLimitsRequests.requests
    ? resourceInfo?.resourceLimitsRequests?.requests[resourceType]
    : 0;
  const limits = resourceInfo.resourceLimitsRequests.limits
    ? resourceInfo?.resourceLimitsRequests?.limits[resourceType]
    : 0;
  const [canShowProgress, setCanShowProgress] = React.useState(false);

  React.useEffect(() => {
    setCanShowProgress(
      Number.isNaN(usage) || Number.isNaN(requests) || Number.isNaN(limits),
    );
  }, [usage, limits, requests]);

  // Validate that usage is below the resource limits
  let barColor = '#228B22';
  if (usage > requests) {
    barColor = usage > limits * 0.8 ? '#EE0000' : '#FFD700';
  }

  const BorderLinearProgress = withStyles(theme => ({
    root: {
      height: 10,
      borderRadius: 5,
    },
    colorPrimary: {
      backgroundColor:
        theme.palette.grey[theme.palette.type === 'light' ? 200 : 700],
    },
    bar: {
      borderRadius: 5,
      backgroundColor: barColor,
    },
  }))(LinearProgress);

  const usagePercentageOfRequests = Math.min((usage / requests) * 100, 100);

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
            Requested: {formatResourceValue(requests)}
            <br />
            Used: {formatResourceValue(usage)}
          </React.Fragment>
        </CardContent>
      </Card>
    );
  };

  return (
    <React.Fragment>
      <Tooltip content={<ToolTipContent />}>
        <BorderLinearProgress
          variant="determinate"
          value={usagePercentageOfRequests}
        />
      </Tooltip>
    </React.Fragment>
  );
};

export default ResourceUsageProgress;
