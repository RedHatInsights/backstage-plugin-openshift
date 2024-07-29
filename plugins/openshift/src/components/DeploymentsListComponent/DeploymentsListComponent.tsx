import React from 'react';
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
import { Tooltip } from '@patternfly/react-core';
import { makeStyles } from '@material-ui/core/styles';
import LinearProgress from '@material-ui/core/LinearProgress';
import QueryOpenshift from '../../common/QueryOpenshiftAPI'
import ResourceUsageProgress from './ResourceUsageProgress';
import CheckCircle from "@patternfly/react-icons/dist/js/icons/check-circle-icon";
import ExclamationTriangleIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon';
import TimesCircle from "@patternfly/react-icons/dist/js/icons/times-circle-icon";

export const DeploymentsListComponent = (data: any) => {
    const { result: OpenshiftResult, loaded: OpenshiftLoaded, error: OpenshiftError } = QueryOpenshift(data);

    // table pagination
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);
    const allDeploymentData: { name: any; readyReplicas: any; replicas: any; resourceUsage: { cpu: number; memory: number; }; resourceLimitsRequests: { requests: { cpu: number; memory: number; }; limits: { cpu: number; memory: number; }; }; creationTimestamp: any; image: any; }[] = [];

    const useStyles = makeStyles((theme) => ({
        root: {
          width: '100%',
          '& > * + *': {
            marginTop: theme.spacing(2),
          },
        },
    }));

    const classes = useStyles();

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
            const resourceLimitsCPU = deployment.spec.template.spec.containers[0].resources.limits ? deployment?.spec?.template?.spec?.containers[0]?.resources?.limits?.cpu : 0;
            const resourceLimitsMemory = deployment.spec.template.spec.containers[0].resources.limits ? deployment.spec.template.spec.containers[0].resources.limits.memory : 0;
            const resourceRequestsCPU = deployment.spec.template.spec.containers[0].resources.requests ? deployment.spec.template.spec.containers[0].resources.requests.cpu : 0;
            const resourceRequestsMemory = deployment.spec.template.spec.containers[0].resources.requests ? deployment.spec.template.spec.containers[0].resources.requests.memory : 0;
            
            resourceInfo.limits.cpu += parseResourceValue(resourceLimitsCPU, "cpu")
            resourceInfo.limits.memory += parseResourceValue(resourceLimitsMemory, "memory")
            resourceInfo.requests.cpu += parseResourceValue(resourceRequestsCPU, "cpu")
            resourceInfo.requests.memory += parseResourceValue(resourceRequestsMemory, "memory")
        })

        return resourceInfo;
    }

    // // calculate the total resource utilization per pod
    const sumCPUMemoryUsage = (deployment: any, deploymentData: any, podData: any) => {
        const totalPodUsage = {'cpu': 0, 'memory': 0};

        // Calculate pod cpu/memory usage alongside data from deployments
        Object.values(podData).map(pod => {
            if (pod.metadata.name.includes(deploymentData[deployment].metadata.name)) {
                Object.values(pod.containers).forEach(container => {
                    const cpuUsage = container.usage.cpu;
                    const memoryUsage = container.usage.memory;

                    totalPodUsage.cpu += parseResourceValue(cpuUsage, "cpu");
                    totalPodUsage.memory += parseResourceValue(memoryUsage, "memory");
                })
            }
        })

        return totalPodUsage;
    }
    
    // creates an object with each pod name and associated cpu and memory usage
    const getDeploymentData = (data: any) => {
        const deploymentData = data.deployments;
        const podData = data.pods;

        for (const deployment in deploymentData) {
            const resourceInfo = aggregate_pod_resources(deploymentData)
            const totalPodUsage = sumCPUMemoryUsage(deployment, deploymentData, podData)

            allDeploymentData.push({
                "name": deploymentData[deployment].metadata.name,
                "readyReplicas": deploymentData[deployment].status.readyReplicas,
                "replicas": deploymentData[deployment].status.replicas,
                "resourceUsage": totalPodUsage,
                "resourceLimitsRequests": resourceInfo,
                "creationTimestamp": deploymentData[deployment].metadata.creationTimestamp,
                "image": deploymentData[deployment].spec.template.spec.containers[0].image
            });

            console.log(allDeploymentData)
        }

        return allDeploymentData
    }

    getDeploymentData(OpenshiftResult)

    // Validate that availableReplicas is greater than 0
    const checkDeploymentStatus = (readyReplicas: any, replicas: any) => {
        if (readyReplicas === 0) {
            // Return red 'x'
            return <TimesCircle color="#FF0000" />;
        }

        if (readyReplicas !== replicas) {
            <ExclamationTriangleIcon color="#FFD700" />
        }

        // Return green checkmark
        return <CheckCircle color="#00FF00" />
    }

    const formatDeploymentTime = (deployDateTime: any) => {
        const formattedTime = deployDateTime.split('T')[1].replace(/Z/g, ' ');
        const formattedDate = deployDateTime.split('T')[0].replace(/-/g, ' ');
        const day = formattedDate.split(' ')[2]
        const month = formattedDate.split(' ')[1]
        const year = formattedDate.split(' ')[0]
        
        return `${month}/${day}/${year}, ${formattedTime}`
    }

    const handleChangePage = (
        event: React.MouseEvent<HTMLButtonElement> | null,
        newPage: number,
    ) => {
        setPage(newPage);
    };
    
    const handleChangeRowsPerPage = (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(page);
    };

    const RowHead = () => {
        return (
            <TableHead>
                <TableRow>
                    <TableCell align="center"><Typography variant="button">Status</Typography></TableCell>
                    <TableCell align="center"><Typography variant="button">Name</Typography></TableCell>
                    <TableCell align="center"><Typography variant="button">Image Tag</Typography></TableCell>
                    <TableCell align="center"><Typography variant="button">CPU</Typography></TableCell>
                    <TableCell align="center"><Typography variant="button">Memory</Typography></TableCell>
                    <TableCell align="center"><Typography variant="button">Last Deployment Time</Typography></TableCell>
                </TableRow>
            </TableHead>
        )
    }

    const formatImageLinkText = (imageUrl: string) => {
        return imageUrl.split("/").pop()
    }

    const RowBody = ({ result }) => {
        const tooltipContent = `Available pods: ${result.readyReplicas}, Desired pods: ${result.replicas}`;
    
        return (
            <TableRow>
                <TableCell style={{width:'8%'}} align="center">
                    <Tooltip content={tooltipContent}>
                        <Typography align="center" variant="button">{checkDeploymentStatus(result.readyReplicas, result.replicas)}</Typography>
                    </Tooltip>
                </TableCell>
                <TableCell align="center">
                    <Typography align="center" variant="button">
                        <Link href={`${data.environmentUrl}/${data.namespace}/deployments/${result.name}`} underline="hover" target="_blank">{result.name}</Link>
                    </Typography>
                </TableCell>
                <TableCell align="center">
                    <Typography align="center" variant="button">
                        <Link href={`https://${result.image}`} underline="hover"  target="_blank">{formatImageLinkText(result.image)}</Link>
                    </Typography>
                </TableCell>
                <TableCell style={{width:'10%'}} align="center">
                    <Typography align="center" variant="button">
                        <ResourceUsageProgress resourceUsage={result.resourceUsage} resourceLimitsRequests={result.resourceLimitsRequests} resourceType="cpu" />
                    </Typography>
                </TableCell>
                <TableCell style={{width:'10%'}} align="center">
                    <Typography align="center" variant="button">
                        <ResourceUsageProgress resourceUsage={result.resourceUsage} resourceLimitsRequests={result.resourceLimitsRequests} resourceType="memory" />
                    </Typography>
                </TableCell>
                <TableCell align="center">
                    <Typography align="center" variant="button">{formatDeploymentTime(result.creationTimestamp)}</Typography>
                </TableCell>
            </TableRow>
        )
    }

    const ShowTable = () => {
        return (
            <Table aria-label="simple table">
                <RowHead />
                <TableBody>
                {(allDeploymentData.length > 0
                    ? allDeploymentData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    : allDeploymentData
                ).map((deployment) => (
                        <RowBody result={deployment} />
                ))}
                </TableBody>
            </Table>
        )
    }

    if (OpenshiftError) {
        return (
            <InfoCard>
                <Typography align="center" variant="button">
                    Error retrieving data from Openshift cluster.
                </Typography>
            </InfoCard>
        )
    }

    if (!OpenshiftLoaded) {
        return (
            <InfoCard className={classes.root}>
                <LinearProgress />
            </InfoCard>
        )
    }
    
    return (
        <Grid container spacing={3} direction="column">
        <TableContainer>
            <ShowTable />
        </TableContainer>
        <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={allDeploymentData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
        />
        </Grid>
    )
}