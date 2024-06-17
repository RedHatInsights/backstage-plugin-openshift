import { useState, useEffect } from 'react';
import { useEntity } from '@backstage/plugin-catalog-react';
import { useApi, configApiRef } from '@backstage/core-plugin-api';

const QueryKubernetes = (environmentName: string, qontractData: any) => {
    type KubernetesApp = Record<string, any>;

    const [result, setResult] = useState<KubernetesApp>({});
    const [loaded, setLoaded] = useState<boolean>(false);
    const [error, setError] = useState<boolean>(false);

    // const [resourceUtilization, setResourceUtilization] = useState({});
    const [resourceUtilization, setResourceUtilization] = useState({});

    const clusterMap = {
        'crc-eph': {
            name: 'ephemeral',
            url: 'https://api.crc-eph.r9lp.p1.openshiftapps.com:6443',
        },
        // 'crcs02ue1': {
        //     name: 'stage',
        //     url: 'https://api.crc-eph.r9lp.p1.openshiftapps.com:6443',
        // },
        // 'crcp01ue1': {
        //     name: 'production',
        //     url: '',
        // },
    };

    const getClusterName = (cluster: string) => {
        if (clusterMap[cluster as keyof typeof clusterMap]) {
          return clusterMap[cluster as keyof typeof clusterMap].name;
        }
        return cluster;
      };

    const getEnvironmentNamespace = () => {
        console.log(qontractData)
        console.log(environmentName)
        const clusterInfo = qontractData.qontractResult.find(e => e.cluster.name === environmentName)
        const namespaceName = clusterInfo?.name

        return namespaceName
    }

    const namespaceName = getEnvironmentNamespace()

    console.log(namespaceName)

    // Get Backstage objects
    const config = useApi(configApiRef);

    const backendUrl = config.getString('backend.baseUrl');

    const getClusterData = () => {
        const proxyName = getClusterName(environmentName)
        const clusterData = {deployments: [], pods: []}
        Promise.all([
            fetch(`${backendUrl}/api/proxy/${proxyName}/apis/apps/v1/namespaces/${namespaceName}/deployments`)
            .then(response => response.json())
            .then(response => {clusterData.deployments = response.items}),

            fetch(`${backendUrl}/api/proxy/${proxyName}/apis/metrics.k8s.io/v1beta1/namespaces/${namespaceName}/pods`)
            .then(response => response.json())
            .then(response => {clusterData.pods = response.items}),
        ])
        .then(response => {
            console.log(response)

            setLoaded(true)
            setResult(clusterData)
        })
        .catch((_error) => {
            setError(true)
            // console.error(`Error fetching kubernetes cluster data from ${kubernetesApiEndpoint}`);
        })
    }

    useEffect(() => {
        getClusterData()
    }, []);

    console.log(result)

    return { result, loaded, error }
}

export default QueryKubernetes;