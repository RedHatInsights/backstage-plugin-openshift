import { useState, useEffect } from 'react';
import { useApi, configApiRef, fetchApiRef } from '@backstage/core-plugin-api';

const QueryOpenshift = (data: any) => {
    type OpenshiftApp = Record<string, any>;

    const [result, setResult] = useState<OpenshiftApp>({});
    const [loaded, setLoaded] = useState<boolean>(false);
    const [error, setError] = useState<boolean>(false);

    // Get Backstage objects
    const config = useApi(configApiRef);
    const fetchApi = useApi(fetchApiRef);

    const backendUrl = config.getString('backend.baseUrl');

    useEffect(() => {
        const getClusterData = async () => {
            const clusterData = { deployments: [], pods: [] }
            await Promise.all([
                fetchApi.fetch(`${backendUrl}/api/proxy/${data.environmentName}/apis/apps/v1/namespaces/${data.namespace}/deployments`)
                    .then(response => response.json())
                    .then(response => { clusterData.deployments = response.items }),

                fetchApi.fetch(`${backendUrl}/api/proxy/${data.environmentName}/apis/metrics.k8s.io/v1beta1/namespaces/${data.namespace}/pods`)
                    .then(response => response.json())
                    .then(response => { clusterData.pods = response.items }),
            ])
                .then(_ => {
                    setLoaded(true)
                    setResult(clusterData)
                })
                .catch((_error) => {
                    setError(true)
                    // eslint-disable-next-line no-console
                    console.error(`Error fetching openshift cluster data from ${data.environmentName}`);
                })
        }

        getClusterData()

    }, [data.namespaceName, backendUrl, data.environmentName, data.namespace, fetchApi]);

    return { result, loaded, error }
}

export default QueryOpenshift;
