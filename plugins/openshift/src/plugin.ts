import {
  createPlugin,
  createComponentExtension,
} from '@backstage/core-plugin-api';

export const OpenshiftInfoPlugin = createPlugin({
  id: 'openshift-deployments',
});

export const EntityOpenshiftInfoContent = OpenshiftInfoPlugin.provide(
  createComponentExtension({
    name: 'EntityOpenshiftInfoContent',
    component: {
      lazy: () => import('./components/OpenshiftComponent').then(m => m.OpenshiftComponent),
    },
  }),
);
