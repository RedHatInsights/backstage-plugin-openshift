'use strict'

import React, { useEffect, useState } from 'react';
import {
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
import { makeStyles } from '@material-ui/core/styles';
import LinearProgress from '@material-ui/core/LinearProgress';
import QueryKubernetes from '../../common/QueryKubernetesAPI'

export const DeploymentsListComponent = (qontractResult: any) => {
    const { result: KubernetesResult, loaded: KubernetesLoaded, error: KubernetesError } = QueryKubernetes('crc-eph', qontractResult);

    console.log(KubernetesResult.deployments)
    console.log(KubernetesLoaded)
    // table pagination
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(5);

    // const [deployments, setDeployments] = useState<any>([])

    const parseResourceValue = (value: string, resourceType: string) => {

        const m = new RegExp("m");
        const ki = new RegExp("Ki");
        const mi = new RegExp("Mi");
        const gi = new RegExp("Gi");

        if (m.test(value)) {
            // Convert millicores to cores
            return parseFloat(value.replace('m', '')) / 1000;
        } else if (ki.test(value)) {
            if (resourceType === "cpu") {
            // print error "Unsupported CPU value format: ${value}"
            } else if (resourceType === "memory") {
                // Convert KiB to MiB
                return parseFloat(value.replace('Ki', '')) / 1024;
            }
        } else if (mi.test(value)) {
            if (resourceType === "cpu") {
                // print error "Unsupported CPU value format: ${value}"
            } else if (resourceType === "memory") {
                // Assume MiB for memory
                return parseFloat(value.replace('Mi', ''));
            }
        } else if (gi.test(value)) {
            if (resourceType === "cpu") {
                // print error "Unsupported CPU value format: ${value}"
            } else if (resourceType === "memory") {
                // Convert GiB to MiB
                return parseFloat(value.replace('Gi', '')) * 1024;
            }
        } else {
            try {
                const floatValue = parseFloat(value);
                if (resourceType === "cpu") {
                    // Assume cores for CPU
                    return floatValue;
                } else if (resourceType === "memory") {
                    // Assume bytes and convert to MiB for memory
                    return floatValue / (1024 * 1024);
                }
            } catch {
                // error
            }
        }

        return 0
    }

    // // calculate the total resource utilization per pod
    // const sumCPUMemoryUsage = (pod: any) => {
        

    //     console.log(pod)
    //     Object.values(pod.containers).forEach(container => {
    //         console.log(container)
    //         const cpuUsage = container.usage.cpu;
    //         const memoryUsage = container.usage.memory;
    //         console.log(memoryUsage)
    //         console.log(cpuUsage)


    //         totalPodUsage.cpu += parseResourceValue(cpuUsage, "cpu");
    //         totalPodUsage.memory += parseResourceValue(memoryUsage, "memory");
    //     })
    //     console.log(totalPodUsage);

    //     return totalPodUsage;
    // }
    const allDeploymentData = [];

    const [deployments, setDeployments] = useState([])
    
    // creates an object with each pod name and associated cpu and memory usage
    const getDeploymentData = (data: any) => {
        

        const deploymentData = data.deployments;
        const podData = data.pods;

        console.log(deploymentData);
        console.log(podData);

        for (const deployment in deploymentData) {
            // console.log(deploymentData[deployment])
            const totalPodUsage = {'cpu': 0, 'memory': 0};

            Object.values(podData).map(pod => {
                // allDeploymentData[pod.metadata.name] = sumCPUMemoryUsage(pod);
                // console.log(pod)
                if (pod.metadata.name.includes(deploymentData[deployment].metadata.name)) {
                    console.log(pod.metadata.name)
                    console.log(deploymentData[deployment].metadata.name);

                    console.log(pod)
                    Object.values(pod.containers).forEach(container => {
                        const cpuUsage = container.usage.cpu;
                        const memoryUsage = container.usage.memory;
                        console.log(memoryUsage)
                        console.log(cpuUsage)

                        totalPodUsage.cpu += parseResourceValue(cpuUsage, "cpu");
                        totalPodUsage.memory += parseResourceValue(memoryUsage, "memory");
                    })
                    console.log(totalPodUsage);
                }
            })

            allDeploymentData.push({
                "name": deploymentData[deployment].metadata.name,
                // "status": deploymentData[deployment].status.,
                "resources": totalPodUsage,
                "creationTimestamp": deploymentData[deployment].metadata.creationTimestamp,
            });

            // setDeployments([
            //     ...deployments,
            //     {"resources": totalPodUsage, "creationTimestamp": deploymentData[deployment].metadata.creationTimestamp}
            // ])

            console.log(deployments)
        }

        console.log(allDeploymentData)


        console.log(deployments)
        return allDeploymentData
    }

    getDeploymentData(KubernetesResult)
    console.log(allDeploymentData)
    
    const useStyles = makeStyles((theme) => ({
        root: {
          width: '100%',
          '& > * + *': {
            marginTop: theme.spacing(2),
          },
        },
    }));

    const classes = useStyles();

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };

    const RowHead = () => {
        return (
            <TableHead>
                <TableRow>
                    <TableCell align="center"><Typography variant="button">Status</Typography></TableCell>
                    <TableCell align="center"><Typography variant="button">Name</Typography></TableCell>
                    <TableCell align="center"><Typography variant="button">Image Tag</Typography></TableCell>
                    <TableCell align="center"><Typography variant="button">CPU Usage</Typography></TableCell>
                    <TableCell align="center"><Typography variant="button">Memory Usage</Typography></TableCell>
                    <TableCell align="center"><Typography variant="button">Last Deployment Time</Typography></TableCell>
                </TableRow>
            </TableHead>
        )
    }

    const RowBody = ({ result }) => {
        return (
            <TableRow>
                <TableCell align="center">PLACEHOLDER</TableCell>
                <TableCell align="center">{result.name}</TableCell>
                <TableCell align="center">PLACEHOLDER</TableCell>
                <TableCell align="center">{result.resources.cpu}</TableCell>
                <TableCell align="center">{result.resources.memory}</TableCell>
                <TableCell align="center">{result.creationTimestamp}</TableCell>
            </TableRow>
        )
    }

    const ShowTable = () => {
        return (
            <Table aria-label="simple table">
                <RowHead />
                <TableBody>
                    {allDeploymentData.map((deployment) => (
                        <RowBody result={deployment} />
                    ))}
                </TableBody>
            </Table>
        )
    }

    if (KubernetesError) {
        return (
            <InfoCard>
                <Typography align="center" variant="body1">
                    Error retrieving data from Kubernetes cluster.
                </Typography>
            </InfoCard>
        )
    }

    if (!KubernetesLoaded) {
        return (
            <InfoCard className={classes.root}>
                <LinearProgress />
                <LinearProgress color="secondary" />
            </InfoCard>
        )
    }
    
    if (KubernetesLoaded) {
        return (
            <Grid container spacing={3} direction="column">
                <Grid item>
                    <TableContainer>
                        <ShowTable />
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 20]}
                        component="div"
                        count={allDeploymentData.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </Grid>
            </Grid>
        )
    }

}