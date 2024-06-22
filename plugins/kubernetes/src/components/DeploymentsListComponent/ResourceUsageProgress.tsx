import React, { useState, useEffect } from 'react';
import {
  Progress,
  ProgressVariant,
  ProgressMeasureLocation,
} from '@patternfly/react-core';

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


    // Validate that usage is below the resource limits
    let variant = ProgressVariant.success;
    if (usage > requests) {
      variant = usage > limits * 0.8 ? ProgressVariant.danger : ProgressVariant.warning;
    }

    const percentage = ((usage * 100) / limits);
    console.log(percentage)

    if (percentage !== 0) {
    return (
        <div>
            <Progress
                value={30}
                measureLocation={ProgressMeasureLocation.none}
                variant={variant}
                label={`${percentage.toFixed(2)}%`}
            /> 
        </ div>
    )
  }
}

export default ResourceUsageProgress;