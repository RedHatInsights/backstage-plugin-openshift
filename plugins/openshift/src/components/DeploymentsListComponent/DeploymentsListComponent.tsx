import React, { useEffect } from 'react';
import {
  Card,
  CardContent,
  Grid,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@material-ui/core';
import { InfoCard } from '@backstage/core-components';
import { Tooltip } from '@patternfly/react-core';
import { makeStyles } from '@material-ui/core/styles';
import LinearProgress from '@material-ui/core/LinearProgress';
import QueryOpenshift from '../../common/QueryOpenshiftAPI';
import ResourceUsageProgress from './ResourceUsageProgress';
import CheckCircle from '@patternfly/react-icons/dist/js/icons/check-circle-icon';
import ExclamationTriangleIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon';
import TimesCircle from '@patternfly/react-icons/dist/js/icons/times-circle-icon';

export const DeploymentsListComponent = (data: any) => {
  const {
    result: OpenshiftResult,
    loaded: OpenshiftLoaded,
    error: OpenshiftError,
  } = QueryOpenshift(data);


  useEffect(() => {
    getDeploymentData(OpenshiftResult);
  }, [OpenshiftResult]);

  // table pagination
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [allDeploymentData, setAllDeploymentData] = React.useState<{
    name: any;
    readyReplicas: any;
    replicas: any;
    resourceUsage: { cpu: number; memory: number };
    resourceLimitsRequests: {
      requests: { cpu: number; memory: number };
      limits: { cpu: number; memory: number };
    };
    creationTimestamp: any;
    image: any;
  }[]>([]);


  const useStyles = makeStyles(theme => ({
    root: {
      width: '100%',
      '& > * + *': {
        marginTop: theme.spacing(2),
      },
    },
  }));

  const classes = useStyles();

  const parseResourceValue = (value: string, resourceType: string) => {
    const m = new RegExp('m');
    const ki = new RegExp('Ki');
    const mi = new RegExp('Mi');
    const gi = new RegExp('Gi');

    if (m.test(value)) {
      // Convert millicores to cores
      return parseFloat(value.replace('m', '')) / 1000;
    } else if (ki.test(value)) {
      if (resourceType === 'cpu') {
        // print error "Unsupported CPU value format: ${value}"
      } else if (resourceType === 'memory') {
        // Convert KiB to MiB
        return parseFloat(value.replace('Ki', '')) / 1024;
      }
    } else if (mi.test(value)) {
      if (resourceType === 'cpu') {
        // print error "Unsupported CPU value format: ${value}"
      } else if (resourceType === 'memory') {
        // Assume MiB for memory
        return parseFloat(value.replace('Mi', ''));
      }
    } else if (gi.test(value)) {
      if (resourceType === 'cpu') {
        // print error "Unsupported CPU value format: ${value}"
      } else if (resourceType === 'memory') {
        // Convert GiB to MiB
        return parseFloat(value.replace('Gi', '')) * 1024;
      }
    } else {
      try {
        const floatValue = parseFloat(value);
        if (resourceType === 'cpu') {
          // Assume cores for CPU
          return floatValue;
        } else if (resourceType === 'memory') {
          // Assume bytes and convert to MiB for memory
          return floatValue / (1024 * 1024);
        }
      } catch {
        // error
      }
    }

    return 0;
  };

  const sumRequests = (deployment: any) => {
    const resourceInfo = {
      requests: { cpu: 0, memory: 0 },
      limits: { cpu: 0, memory: 0 },
    };
      const replicas = deployment.spec.replicas || 1;
      deployment.spec.template.spec.containers.forEach((container: any) => {
        const cpuRequests = container.resources.requests.cpu  || "0m"
        const memoryRequests = container.resources.requests.memory  || "0Mi"
        resourceInfo.requests.cpu += parseResourceValue(
          cpuRequests,
          'cpu',
        ) * replicas;
        resourceInfo.requests.memory += parseResourceValue(
          memoryRequests,
          'memory',
        )* replicas;
      }) 
    return resourceInfo;
  };

  // // calculate the total resource utilization per pod
  const sumUsage = (
    deploymentIndex: any,
    deploymentData: any,
    podData: any,
  ) => {
    const totalPodUsage = { cpu: 0, memory: 0 };
    // So we can match the pod name to the deployment name
    const deploymentName = deploymentData[deploymentIndex].metadata.name;
    const regex = new RegExp(`^${deploymentName}-[a-z0-9]{8,10}-[a-z0-9]{5}$`, 'i');
    // Calculate pod cpu/memory usage alongside data from deployments
    podData.forEach(pod => {
      if (
        regex.test(pod.metadata.name) 
      ) {
        pod.containers.forEach(container => {
          //I don't know why we have to do this
          //But there are some containers with the name POD in the array that 
          //just have 0 usage. Some bug somewhere else in the logic but I have't tracked it down
          if (container.name === "POD") {
            return;
          }
          const cpuUsage = container.usage.cpu;
          const memoryUsage = container.usage.memory;
          totalPodUsage.cpu += parseResourceValue(cpuUsage, 'cpu');
          totalPodUsage.memory += parseResourceValue(memoryUsage, 'memory');
        });
      }
    });

    return totalPodUsage;
  };

  // creates an object with each pod name and associated cpu and memory usage
  const getDeploymentData = (data: any) => {
    const deploymentData = data.deployments;
    const podData = data.pods;

    if ( !deploymentData || !podData) {
      return;
    }

    setAllDeploymentData([]);

    const cumulativeDeploymentData = []

    deploymentData.forEach((deployment: any, index: number) => {
      const resourceInfo = sumRequests(deployment);
      const totalPodUsage = sumUsage(
        index,
        deploymentData,
        podData,
      );

      cumulativeDeploymentData.push({
        name: deployment.metadata.name,
        readyReplicas: deployment.status.readyReplicas,
        replicas: deployment.status.replicas,
        resourceUsage: totalPodUsage,
        resourceLimitsRequests: resourceInfo,
        creationTimestamp:
          deployment.metadata.creationTimestamp,
        image:
          deployment.spec.template.spec.containers[0].image,
      });
    });

    setAllDeploymentData(cumulativeDeploymentData);
  };

  // Validate that availableReplicas is greater than 0
  const checkDeploymentStatus = (readyReplicas: any, replicas: any) => {
    if (readyReplicas === 0) {
      // Return red 'x'
      return <TimesCircle color="#EE0000" />;
    }

    if (readyReplicas !== replicas) {
      <ExclamationTriangleIcon color="#FFD700" />;
    }

    // Return green checkmark
    return <CheckCircle color="#00FF00" />;
  };

  const formatDeploymentTime = (deployDateTime: any) => {
    const formattedTime = deployDateTime.split('T')[1].replace(/Z/g, ' ');
    const formattedDate = deployDateTime.split('T')[0].replace(/-/g, ' ');
    const day = formattedDate.split(' ')[2];
    const month = formattedDate.split(' ')[1];
    const year = formattedDate.split(' ')[0];

    return `${month}/${day}/${year}, ${formattedTime}`;
  };

  const handleChangePage = (
    _event: React.MouseEvent<HTMLButtonElement> | null,
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
          <TableCell align="center">
            <Typography variant="button">Status</Typography>
          </TableCell>
          <TableCell align="center">
            <Typography variant="button">Name</Typography>
          </TableCell>
          <TableCell align="center">
            <Typography variant="button">Image Tag</Typography>
          </TableCell>
          <TableCell align="center">
            <Typography variant="button">CPU</Typography>
          </TableCell>
          <TableCell align="center">
            <Typography variant="button">Memory</Typography>
          </TableCell>
          <TableCell align="center">
            <Typography variant="button">Last Deployment Time</Typography>
          </TableCell>
        </TableRow>
      </TableHead>
    );
  };

  const formatImageLinkText = (imageUrl: string) => {
    return imageUrl.split('/').pop();
  };

  const ToolTipContent = (result) => {
    return (
      <Card>
        <CardContent>
          <React.Fragment>
            Available pods: {result.readyReplicas || 0}
            <br />
            Desired pods: {result.replicas}
          </React.Fragment>
        </CardContent>
      </Card>
    );
  }

  const RowBody = ({ result }: { result: any }) => {
    const tooltipContent = ToolTipContent(result);
    return (
      <TableRow>
        <TableCell style={{ width: '8%' }} align="center">
          <Tooltip content={tooltipContent}>
            <Typography align="center" variant="button">
              {checkDeploymentStatus(result.readyReplicas, result.replicas)}
            </Typography>
          </Tooltip>
        </TableCell>
        <TableCell align="center">
          <Typography align="center" variant="button">
            <Link
              href={`${data.environmentUrl}/${data.namespace}/deployments/${result.name}`}
              underline="hover"
              target="_blank"
            >
              {result.name}
            </Link>
          </Typography>
        </TableCell>
        <TableCell align="center">
          <Typography align="center" variant="button">
            <Link
              href={`https://${result.image}`}
              underline="hover"
              target="_blank"
            >
              {formatImageLinkText(result.image)}
            </Link>
          </Typography>
        </TableCell>
        <TableCell style={{ width: '10%' }} align="center">
          <Typography align="center" variant="button">
            <ResourceUsageProgress
              resourceUsage={result.resourceUsage}
              resourceLimitsRequests={result.resourceLimitsRequests}
              resourceType="cpu"
            />
          </Typography>
        </TableCell>
        <TableCell style={{ width: '10%' }} align="center">
          <Typography align="center" variant="button">
            <ResourceUsageProgress
              resourceUsage={result.resourceUsage}
              resourceLimitsRequests={result.resourceLimitsRequests}
              resourceType="memory"
            />
          </Typography>
        </TableCell>
        <TableCell align="center">
          <Typography align="center" variant="button">
            {formatDeploymentTime(result.creationTimestamp)}
          </Typography>
        </TableCell>
      </TableRow>
    );
  };

  const ShowTable = () => {
    return (
      <Table aria-label="simple table">
        <RowHead />
        <TableBody>
          {(allDeploymentData.length > 0
            ? allDeploymentData.slice(
                page * rowsPerPage,
                page * rowsPerPage + rowsPerPage,
              )
            : allDeploymentData
          ).map((deployment, index) => (
            <RowBody result={deployment}  key={index}/>
          ))}
        </TableBody>
      </Table>
    );
  };

  if (OpenshiftError) {
    return (
      <InfoCard>
        <Typography align="center" variant="button">
          Error retrieving data from Openshift cluster.
        </Typography>
      </InfoCard>
    );
  }

  if (!OpenshiftLoaded) {
    return (
      <InfoCard className={classes.root}>
        <LinearProgress />
      </InfoCard>
    );
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
  );
};
