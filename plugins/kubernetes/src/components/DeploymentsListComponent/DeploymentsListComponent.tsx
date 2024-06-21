'use strict'

import React, { useEffect, useState } from 'react';
import {
    Grid,
    Link,
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
import ResourceUsageProgress from './ResourceUsageProgress';
import CheckCircle from "@patternfly/react-icons/dist/js/icons/check-circle-icon";
import TimesCircle from "@patternfly/react-icons/dist/js/icons/times-circle-icon";

export const DeploymentsListComponent = (data: any) => {
    console.log(data)
    const { result: KubernetesResult, loaded: KubernetesLoaded, error: KubernetesError } = QueryKubernetes(data);

    console.log(KubernetesResult.deployments)
    console.log(KubernetesLoaded)
    // table pagination
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(5);

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

    const aggregate_pod_resources = (deploymentData: any) => {
        const resourceInfo = {'requests': {'cpu': 0, 'memory': 0}, 'limits': {'cpu': 0, 'memory': 0}}
        
        Object.values(deploymentData).map(deployment => {
            console.log(deployment)
            const resourceLimitsCPU = deployment.spec.template.spec.containers[0].resources.limits ? deployment?.spec?.template?.spec?.containers[0]?.resources?.limits?.cpu : 0;
            const resourceLimitsMemory = deployment.spec.template.spec.containers[0].resources.limits ? deployment.spec.template.spec.containers[0].resources.limits.memory : 0;
            const resourceRequestsCPU = deployment.spec.template.spec.containers[0].resources.requests ? deployment.spec.template.spec.containers[0].resources.requests.cpu : 0;
            const resourceRequestsMemory = deployment.spec.template.spec.containers[0].resources.requests ? deployment.spec.template.spec.containers[0].resources.requests.memory : 0;
            
            resourceInfo.limits.cpu += parseResourceValue(resourceLimitsCPU, "cpu")
            resourceInfo.limits.memory += parseResourceValue(resourceLimitsMemory, "memory")
            resourceInfo.requests.cpu += parseResourceValue(resourceRequestsCPU, "cpu")
            resourceInfo.requests.memory += parseResourceValue(resourceRequestsMemory, "memory")
            console.log(resourceInfo)
        })

        return resourceInfo;
    }

    // // calculate the total resource utilization per pod
    const sumCPUMemoryUsage = (deployment: any, deploymentData: any, podData: any) => {
        const totalPodUsage = {'cpu': 0, 'memory': 0};

        // Calculate pod cpu/memory usage alongside data from deployments
        Object.values(podData).map(pod => {
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

        return totalPodUsage;
    }

    const allDeploymentData = [];
    
    // creates an object with each pod name and associated cpu and memory usage
    const getDeploymentData = (data: any) => {
        const deploymentData = data.deployments;
        const podData = data.pods;

        console.log(deploymentData);
        console.log(podData);

        for (const deployment in deploymentData) {
            // console.log(deploymentData[deployment])

            const resourceInfo = aggregate_pod_resources(deploymentData)
            const totalPodUsage = sumCPUMemoryUsage(deployment, deploymentData, podData)

            console.log(resourceInfo)

            allDeploymentData.push({
                "name": deploymentData[deployment].metadata.name,
                "status": deploymentData[deployment].status.readyReplicas,
                "resourceUsage": totalPodUsage,
                "resourceLimitsRequests": resourceInfo,
                "creationTimestamp": deploymentData[deployment].metadata.creationTimestamp,
                "image": deploymentData[deployment].spec.template.spec.containers[0].image
            });
        }

        console.log(allDeploymentData)

        return allDeploymentData
    }

    getDeploymentData(KubernetesResult)

    // Validate that availableReplicas is greater than 0
    const checkDeploymentStatus = (deploymentStatus: any) => {
        if (deploymentStatus > 0) {
            return <CheckCircle color="#00FF00" />
        }

        return <TimesCircle color="#FF0000" />;
    }

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
        // const url = `${deploymentUrl}/${result.name}`
        // console.log(url)

        return (
            <TableRow>
                <TableCell align="center">{checkDeploymentStatus(result.status)}</TableCell>
                <TableCell align="center">
                    <Link href={`${result.name}`} underline="hover">{result.name}</Link>
                </TableCell>
                <TableCell align="center">
                    <Link href={`https://${result.image}`} underline="hover">{result.image}</Link>
                </TableCell>
                <TableCell align="center">
                    <ResourceUsageProgress resourceUsage={result.resourceUsage} resourceLimitsRequests={result.resourceLimitsRequests} resourceType="cpu" />
                </TableCell>
                <TableCell align="center">
                    <ResourceUsageProgress resourceUsage={result.resourceUsage} resourceLimitsRequests={result.resourceLimitsRequests} resourceType="memory" />
                </TableCell>
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
    
    // if (loaded) {
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
    // }

}