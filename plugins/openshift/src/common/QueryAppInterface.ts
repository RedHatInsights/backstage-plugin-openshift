import { useState, useEffect } from 'react';
import { request } from 'graphql-request';
import { useEntity } from '@backstage/plugin-catalog-react';
import { useApi, configApiRef, fetchApiRef } from '@backstage/core-plugin-api';

const QueryQontract = (query: string, path?: string) => {
    type QontractApp = Record<string, any>;

    const config = useApi(configApiRef);
    const fetchApi = useApi(fetchApiRef);

    const { entity } = useEntity();

    const backendUrl = config.getString('backend.baseUrl');
    const proxyUrl = `${backendUrl}/api/proxy/openshift-deployments/graphql`

    // state variables for saving data queried from graphql
    const [result, setResult] = useState([]);
    const [loaded, setLoaded] = useState<boolean>(false);
    const [error, setError] = useState<boolean>(false);

    const getAppInterfaceNamespacePath = () => {
        const platform = entity?.metadata?.labels?.platform
        const service = entity?.metadata?.labels?.service
        return `/services/${platform}/${service}/app.yml`
    }

    const queryQontract = async () => {
        const variables = { path: getAppInterfaceNamespacePath() };

        await fetchApi.fetch(proxyUrl, {
            method: 'POST',

            headers: {
                "content-type": "application/json"
            },

            body: JSON.stringify({
                query: query,
                variables: variables
            })
        })
            .then(data => data.json())
            .then((data: any) => {
                setLoaded(true)
                setResult(data.data.apps_v1[0]?.namespaces)
            })
            .catch((_error) => {
                setError(true)
            });
    }

    // Get qontract data on load
    useEffect(() => {
        queryQontract()
    }, []);

    return { result, loaded, error }
}

export default QueryQontract;
