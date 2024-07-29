import React, { useEffect, useState } from 'react';
import {
  Button,
  ButtonGroup,
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
  createTheme,
  makeStyles,
  ThemeProvider,
} from '@material-ui/core/styles';
import LinearProgress from '@material-ui/core/LinearProgress';
import { NSQuery } from './query';

import { DeploymentsListComponent } from '../DeploymentsListComponent/DeploymentsListComponent';

export const OpenshiftComponent = () => {
  const {
    result: qontractResult,
    loaded: qontractLoaded,
    error: qontractError,
  } = QueryQontract(NSQuery);

  console.log(qontractResult);

  // state variables for stage/prod buttons
  const [isStageButtonDisabled, setIsStageButtonDisabled] =
    useState<boolean>(true);
  const [isProdButtonDisabled, setIsProdButtonDisabled] =
    useState<boolean>(false);
  const [currentEnvironment, setCurrentEnvironment] = useState<string>('');
  const [currentEnvironmentUrl, setCurrentEnvironmentUrl] =
    useState<string>('');

  const getEnvironmentNamespace = (environment: string) => {
    const clusterInfo = qontractResult.find(e =>
      e.path.includes(`${environment}.yml`),
    );
    const namespaceName = clusterInfo?.name;

    return namespaceName;
  };

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

  const theme = createTheme({
    palette: {
      action: {
        disabledBackground: '#191970',
        disabled: 'set color of text here',
      },
    },
  });

  const classes = useStyles();

  const buttonHandler = (isStageDisabled: boolean, isProdDisabled: boolean) => {
    setIsStageButtonDisabled(isStageDisabled);
    setIsProdButtonDisabled(isProdDisabled);

    setCurrentEnvironment(
      isProdButtonDisabled
        ? getClusterName('crcs02ue1')
        : getClusterName('crcp01ue1'),
    );
    setCurrentEnvironmentUrl(
      isProdButtonDisabled
        ? getClusterUrl('crcs02ue1')
        : getClusterUrl('crcp01ue1'),
    );
  };

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
