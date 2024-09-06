import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import LinearProgress from '@material-ui/core/LinearProgress';
import { Tooltip } from '@patternfly/react-core';
import { Card, CardContent, Typography } from '@material-ui/core';

const ResourceUsageProgress = (resourceInfo: any) => {
  const resourceType = resourceInfo.resourceType;
  let usage = resourceInfo.resourceUsage[resourceType];

  const isUndefined = resourceInfo.resourceLimitsRequests.requests.undefined

  if (isUndefined) {
    return <Typography variant="button">Requests undefined</Typography>;
  }

  const requests = resourceInfo.resourceLimitsRequests.requests
    ? resourceInfo?.resourceLimitsRequests?.requests[resourceType]
    : 0;

  const convertNanocoresToCores = (value: number) => {
    return value / 1000000000
  };

  // cpu utilization is in nanocores
  if (resourceInfo.resourceType === 'cpu') {
    usage = convertNanocoresToCores(usage)
  }

  const usagePercentageOfRequests = Math.min((usage / requests) * 100, 100);

  // Bar color is green by default
  let barColor = '#228B22';
  // If usage is greater than 60% of the requests, but less than 90 make it yellow
  if (usage > requests * 0.6 && usage < requests * 0.9) {
    barColor = '#FFD700';
  }
  //if the usage is greater than 90% of the requests, make it red
  if (usage > requests * 0.9) {
    barColor = '#EE0000';
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

  const formatResourceValue = (value: number) => {
    if (resourceInfo.resourceType === 'memory') {
      return `${value.toFixed(2)} Mi`;
    }
    return `${value} cores`;
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
