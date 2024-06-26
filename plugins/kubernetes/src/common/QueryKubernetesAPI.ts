import { useState, useEffect } from 'react';
import { useApi, configApiRef } from '@backstage/core-plugin-api';

const QueryKubernetes = (data: any) => {
    type KubernetesApp = Record<string, any>;

    const [result, setResult] = useState<KubernetesApp>({});
    const [loaded, setLoaded] = useState<boolean>(false);
    const [error, setError] = useState<boolean>(false);

    // Get Backstage objects
    const config = useApi(configApiRef);

    const backendUrl = config.getString('backend.baseUrl');

    const getClusterData = async() => {
        const clusterData = {deployments: [], pods: []}
        await Promise.all([
            fetch(`${backendUrl}/api/proxy/${data.environmentName}/apis/apps/v1/namespaces/${data.namespace}/deployments`)
            .then(response => response.json())
            .then(response => {clusterData.deployments = response.items}),

            fetch(`${backendUrl}/api/proxy/${data.environmentName}/apis/metrics.k8s.io/v1beta1/namespaces/${data.namespace}/pods`)
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
            console.error(`Error fetching kubernetes cluster data from ${data.environmentName}`);
        })
    }

    useEffect(() => {
        getClusterData()

    }, [data.namespaceName]);

    return { result, loaded, error }
}

export default QueryKubernetes;