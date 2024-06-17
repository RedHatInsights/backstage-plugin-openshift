import React, { useEffect, useState } from 'react';
import { 
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
    const [currentEnvironment, setCurrentEnvironment] = useState<string>("stage")

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
    }

    const ClusterButtons = () => {
        return (
            <ButtonGroup aria-label="Basic button group">
                <Button variant="contained" color="primary" onClick={() => buttonHandler(true, false)} disabled={isStageButtonDisabled}>Stage</Button>
                <Button variant="contained" color="primary" onClick={() => buttonHandler(false, true)} disabled={isProdButtonDisabled}>Prod</Button>
            </ButtonGroup>
        );
    }

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
            <Grid container spacing={3} direction="column">
                <ClusterButtons />
                <DeploymentsListComponent qontractResult={qontractResult}/>
            </Grid>
        </InfoCard>
    )
}
