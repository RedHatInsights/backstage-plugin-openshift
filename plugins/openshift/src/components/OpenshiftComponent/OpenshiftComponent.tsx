import React, { useEffect, useState } from 'react';
import {
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@material-ui/core';
import { InfoCard } from '@backstage/core-components';
import QueryQontract from '../../common/QueryAppInterface';
import {
  makeStyles,
} from '@material-ui/core/styles';
import LinearProgress from '@material-ui/core/LinearProgress';
import { NSQuery } from './query';

import { DeploymentsListComponent } from '../DeploymentsListComponent/DeploymentsListComponent';

const clusterMap = {
  // crc-eph is only used for testing purposes
  'crc-eph': {
    url: `https://console-openshift-console.apps.crc-eph.r9lp.p1.openshiftapps.com/k8s/ns`,
    name: 'ephemeral',
  },
  crcs02ue1: {
    url: `https://console-openshift-console.apps.crcs02ue1.urby.p1.openshiftapps.com/k8s/ns`,
    name: 'stage',
  },
  crcp01ue1: {
    url: `https://console-openshift-console.apps.crcp01ue1.o9m8.p1.openshiftapps.com/k8s/ns`,
    name: 'prod',
  },
};

export const OpenshiftComponent = () => {
  const {
    result: qontractResult,
    loaded: qontractLoaded,
    error: qontractError,
  } = QueryQontract(NSQuery);

  const [currentEnvironment, setCurrentEnvironment] = useState<string>('');
  const [currentEnvironmentUrl, setCurrentEnvironmentUrl] =
    useState<string>('');

  const getEnvironmentNamespace = (environment: string) => {
    const clusterInfo = qontractResult.find((e: { path: string | string[]; }) =>
      e.path.includes(`${environment}.yml`),
    );
    const namespaceName = clusterInfo?.name;

    return namespaceName;
  };

  const getClusterName = (cluster: string) => {
    if (clusterMap[cluster as keyof typeof clusterMap]) {
      return clusterMap[cluster as keyof typeof clusterMap].name;
    }
    return cluster;
  };

  const getClusterUrl = (cluster: string) => {
    if (clusterMap[cluster as keyof typeof clusterMap]) {
      return clusterMap[cluster as keyof typeof clusterMap].url;
    }
    return cluster;
  };
  const capitalizeFirstLetter = (currentEnvironment: string) => {
    return (
      currentEnvironment.charAt(0).toUpperCase() + currentEnvironment.slice(1)
    );
  };

  const title: string = `${capitalizeFirstLetter(
    currentEnvironment,
  )} Deployments`;
  const namespaceName = getEnvironmentNamespace(currentEnvironment);

  // styles for linear progress bar
  const useStyles = makeStyles(theme => ({
    root: {
      width: '100%',
      '& > * + *': {
        marginTop: theme.spacing(2),
      },
    },
  }));

  const classes = useStyles();

  const ClusterSelect = () => {
    return (
      <FormControl>
        <InputLabel id="cluster-select-label">Cluster</InputLabel>
        <Select
          labelId="cluster-select-label"
          id="cluster-select"
          value={currentEnvironment}
          onChange={e => {
            setCurrentEnvironment(e.target.value as string);
            setCurrentEnvironmentUrl(
              e.target.value === 'stage'
                ? getClusterUrl('crcs02ue1')
                : getClusterUrl('crcp01ue1'),
            );
          }}
        >
          <MenuItem value={'stage'}>Stage</MenuItem>
          <MenuItem value={'prod'}>Prod</MenuItem>
        </Select>
      </FormControl>
    );
  };

  const InfoCardTitle = () => {
    return (
      <Grid container direction="row">
        <Grid item xs={11}>
          {title}
        </Grid>
        <Grid item xs={1}>
          <ClusterSelect />
        </Grid>
      </Grid>
    );
  };

  // On page load set the current cluster to stage
  useEffect(() => {
    const currentClusterName = getClusterName('crcs02ue1');
    const currentClusterUrl = getClusterUrl('crcs02ue1');
    setCurrentEnvironment(currentClusterName);
    setCurrentEnvironmentUrl(currentClusterUrl);
  }, []);

  if (qontractError) {
    return (
      <InfoCard>
        <Typography align="center" variant="body1">
          Error retrieving data from qontract.
        </Typography>
      </InfoCard>
    );
  }

  if (!qontractLoaded) {
    return (
      <InfoCard className={classes.root} title={title}>
        <LinearProgress />
      </InfoCard>
    );
  }

  return (
    <InfoCard title={<InfoCardTitle />}>
      <DeploymentsListComponent
        key={currentEnvironment}
        environmentName={currentEnvironment}
        namespace={namespaceName}
        environmentUrl={currentEnvironmentUrl}
        qontractResult={qontractResult}
      />
    </InfoCard>
  );
};
