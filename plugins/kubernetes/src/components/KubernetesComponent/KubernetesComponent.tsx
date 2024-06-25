import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    ButtonGroup,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    Typography } from '@material-ui/core';
import {
    InfoCard,
} from '@backstage/core-components';
import QueryQontract from '../../common/QueryAppInterface'
import { makeStyles } from '@material-ui/core/styles';
import LinearProgress from '@material-ui/core/LinearProgress';
import { NSQuery } from './query';

import { DeploymentsListComponent } from '../DeploymentsListComponent/DeploymentsListComponent';

export const KubernetesComponent = () => {
    const { result: qontractResult, loaded: qontractLoaded, error: qontractError } = QueryQontract(NSQuery);

    console.log(qontractResult)

    const title: string = "Deployment Information"

    // state variables for stage/prod buttons
    const [isStageButtonDisabled, setIsStageButtonDisabled] = useState<boolean>(true);
    const [isProdButtonDisabled, setIsProdButtonDisabled] = useState<boolean>(false);
    const [currentEnvironment, setCurrentEnvironment] = useState<string>("")
    const [currentEnvironmentUrl, setCurrentEnvironmentUrl] = useState<string>("")

    // const environmentName = data.environmentName;

    const getEnvironmentNamespace = (environment: string) => {
        console.log(qontractResult)
        console.log(environment)

        const clusterInfo = qontractResult.find(e => e.path.includes(`${environment}.yml`))
        const namespaceName = clusterInfo?.name

        return namespaceName
    }

    const clusterMap = {
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

    const namespaceName = getEnvironmentNamespace(currentEnvironment)

    console.log(getClusterUrl(currentEnvironment))
    console.log(getClusterName(currentEnvironment))

    // styles for linear progress bar
    const useStyles = makeStyles((theme) => ({
        root: {
          width: '100%',
          '& > * + *': {
            marginTop: theme.spacing(2),
          },
        },
    }));

    const classes = useStyles();

    const buttonHandler = (isStageDisabled: boolean, isProdDisabled: boolean) => {
        setIsStageButtonDisabled(isStageDisabled)
        setIsProdButtonDisabled(isProdDisabled)

        setCurrentEnvironment(isProdButtonDisabled ? getClusterName('crcs02ue1') : getClusterName('crcp01ue1'))
        setCurrentEnvironmentUrl(isProdButtonDisabled ? getClusterUrl('crcs02ue1') : getClusterUrl('crcp01ue1'))

        console.log(currentEnvironment)
    }

    const ClusterButtons = () => {
        return (
            <ButtonGroup aria-label="Basic button group">
                <Button size="small" variant="contained" color="primary" onClick={() => buttonHandler(true, false)} disabled={isStageButtonDisabled}>Stage</Button>
                <Button size="small" variant="contained" color="primary" onClick={() => buttonHandler(false, true)} disabled={isProdButtonDisabled}>Prod</Button>
            </ButtonGroup>
        );
    }

    const RefreshButton = () => {
        return (
            <ButtonGroup aria-label="Basic button group">
                <Button size="small" color="primary" onClick={buttonHandler}>Refresh</Button>
            </ButtonGroup>
        );
    }

    // On page load set the current cluster to stage
    useEffect(() => {
        const currentClusterName = getClusterName('crcs02ue1')
        const currentClusterUrl = getClusterUrl('crcs02ue1')

        setCurrentEnvironment(currentClusterName)
        setCurrentEnvironmentUrl(currentClusterUrl)
    }, [])

    if (qontractError) {
        return (
            <InfoCard>
                <Typography align="center" variant="body1">
                    Error retrieving data from qontract.
                </Typography>
            </InfoCard>
        )
    }

    if (!qontractLoaded) {
        return (
            <InfoCard className={classes.root} title={title}>
                <LinearProgress />
                <LinearProgress color="secondary" />
            </InfoCard>
        )
    }

    return (
        <InfoCard title={title}>
                <ClusterButtons />
                <DeploymentsListComponent key={currentEnvironment} environmentName={currentEnvironment} namespace={namespaceName} environmentUrl={currentEnvironmentUrl} qontractResult={qontractResult} />
        </InfoCard>
    )
}
