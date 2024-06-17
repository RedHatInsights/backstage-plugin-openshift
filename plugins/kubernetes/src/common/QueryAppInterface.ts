import { useState, useEffect } from 'react';
import { request } from 'graphql-request';
import { useEntity } from '@backstage/plugin-catalog-react';
import { useApi, configApiRef } from '@backstage/core-plugin-api';

const QueryQontract = (query: string, path?: string) => {
    type QontractApp = Record<string, any>;

    const config = useApi(configApiRef);
    const { entity } = useEntity();

    const backendUrl = config.getString('backend.baseUrl');
    const proxyUrl = `${backendUrl}/api/proxy/kubernetes/graphql`
    
    // state variables for saving data queried from graphql
    const [result, setResult] = useState<QontractApp>([]);
    const [loaded, setLoaded] = useState<boolean>(false);
    const [error, setError] = useState<boolean>(false);

    const getAppInterfaceNamespacePath = () => {
        const platform = entity?.metadata?.labels?.platform
        const service = entity?.metadata?.labels?.service
        return `/services/${platform}/${service}/app.yml`
    }

    // Get data on load
    useEffect(() => {
        const variables = { path: getAppInterfaceNamespacePath() };
        request(proxyUrl, query, variables)
            .then((data: any) => {
                setLoaded(true)
                setResult(data.apps_v1[0].namespaces)
                console.log(result)
            })
            .catch((_error) => {
                setError(true)
            });
    }, []);

    console.log(result)
    return { result, loaded, error }
}

export default QueryQontract;
