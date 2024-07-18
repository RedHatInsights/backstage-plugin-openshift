# Openshift Deployments Information Dynamic Plugin

This is a development mono-repo for the Openshift Information plugin. This mono-repo was created using @backstage/create-app to provide a backend and frontend for the plugin to integrate with.

You can find the plugin code in `plugins/openshift`

## Components

### Entity Page Card
* `EntityOpenshiftInfoContent`: Displays Openshift Deployment information about each service in the Catalog. The following information is provided per deployment:
  * Deployment status
  * Name of deployment
  * Deployed image tag
  * CPU usage
  * Memory usage
  * Last deployment time

## Configuration
In `app-config.yaml` first add the proxy:

```yaml
proxy:
  endpoints:
    '/openshift-deployments': 
      target: 'https://my.qontract.company.com/graphql'
    '/stage':
      target: 'https://api.my.openshift.cluster.com'
      headers:
        Authorization: "Bearer ${STAGE_CLUSTER_API_TOKEN}"
    '/prod':
      target: 'https://api.my.openshift.cluster.com'
      headers:
        Authorization: "Bearer ${STAGE_CLUSTER_API_TOKEN}"
    
```

Also in `app-config.yaml` add `redhatinsights.backstage-plugin-openshift` and the card component configs into the dynamic plugins section.

```yaml
dynamicPlugins:
  frontend:
    redhatinsights.backstage-plugin-openshift:
      entityTabs:
        - path: /openshift-deployments
          title: Deployments
          mountPoint: entity.page.openshift-deployoments
      mountPoints:
        - mountPoint: entity.page.openshift-deployoments/cards
          importName: EntityOpenshiftInfoContent
          config:
            layout:
              gridColumnEnd:
                lg: "span 12"
                md: "span 12"
                xs: "span 12"
```
## Development
To start the app, run:

```sh
yarn install
yarn dev
```

Before you do, you'll likely want to have catalog entries to see the plugin working on. Check out AppStage for that. 

### Build the Dynamic Plugin
Run `./build` - the packed tarball for the release along with its integrity sha will be generated.
