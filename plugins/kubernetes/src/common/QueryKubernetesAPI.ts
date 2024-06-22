import { useState, useEffect } from 'react';
import { useEntity } from '@backstage/plugin-catalog-react';
import { useApi, configApiRef } from '@backstage/core-plugin-api';

const QueryKubernetes = (data: any) => {
    type KubernetesApp = Record<string, any>;

    const [result, setResult] = useState<KubernetesApp>({});
    const [deploymentUrl, setDeploymentUrl] = useState("")
    const [loaded, setLoaded] = useState<boolean>(false);
    const [error, setError] = useState<boolean>(false);

    console.log(data)
    // const environmentName = data.environmentName;

    // const getEnvironmentNamespace = (environment: string) => {
    //     console.log(data)
    //     console.log(environment)

    //     const clusterInfo = data.qontractResult.find(e => e.path.includes(`${environment}.yml`))
    //     const namespaceName = clusterInfo?.name


    //     return namespaceName
    // }

    // const namespaceName = getEnvironmentNamespace(environmentName)

    // console.log(namespaceName)

    // Get Backstage objects
    const config = useApi(configApiRef);

    const backendUrl = config.getString('backend.baseUrl');

    const getClusterData = async() => {
        // setDeploymentUrl(getClusterUrl(environmentName))
        // const proxyName = getClusterName(environmentName)

        // console.log(environmentName)
        // console.log(getClusterUrl(environmentName))
        // console.log(proxyName)

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
            // console.error(`Error fetching kubernetes cluster data from ${kubernetesApiEndpoint}`);
        })
    }

    useEffect(() => {
        getClusterData()

    }, [data.namespaceName]);

    console.log(result)
    console.log(deploymentUrl)

    return { result, deploymentUrl, loaded, error }
}

export default QueryKubernetes;