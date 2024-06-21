import { useState, useEffect } from 'react';
import { useEntity } from '@backstage/plugin-catalog-react';
import { useApi, configApiRef } from '@backstage/core-plugin-api';

const QueryKubernetes = (data: any) => {
    type KubernetesApp = Record<string, any>;

    const [result, setResult] = useState<KubernetesApp>({});
    const [loaded, setLoaded] = useState<boolean>(false);
    const [error, setError] = useState<boolean>(false);

    const environmentName = data.environmentName;

    const getEnvironmentNamespace = (environment: string) => {
        console.log(data)
        console.log(environment)
        const clusterInfo = data.qontractResult.find(e => e.cluster.name === environment)
        const namespaceName = clusterInfo?.name

        return namespaceName
    }

    const namespaceName = getEnvironmentNamespace(environmentName)

    console.log(namespaceName)

    const clusterMap = {
        'crc-eph': {
            url: `https://console-openshift-console.apps.crc-eph.r9lp.p1.openshiftapps.com/k8s/ns/${namespaceName}/deployments`,
            name: 'ephemeral',
        },
        crcs02ue1: {
            url: `https://console-openshift-console.apps.crcs02ue1.urby.p1.openshiftapps.com/k8s/ns/${namespaceName}/deployments`,
            name: 'stage',
        },
        crcp01ue1: {
            url: `https://console-openshift-console.apps.crcp01ue1.o9m8.p1.openshiftapps.com/k8s/ns/${namespaceName}/deployments`,
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

    const deploymentUrl = getClusterUrl(environmentName)

    // Get Backstage objects
    const config = useApi(configApiRef);

    const backendUrl = config.getString('backend.baseUrl');

    const getClusterData = async() => {
        const proxyName = getClusterName(environmentName)
        const clusterData = {deployments: [], pods: []}
        await Promise.all([
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
    }, [namespaceName]);

    console.log(result)

    return { result,deploymentUrl, loaded, error }
}

export default QueryKubernetes;