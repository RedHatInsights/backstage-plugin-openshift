import {
  createPlugin,
  createComponentExtension,
} from '@backstage/core-plugin-api';

export const KubernetesInfoPlugin = createPlugin({
  id: 'kubernetes-deployments',
});

export const EntityKubernetesInfoContent = KubernetesInfoPlugin.provide(
  createComponentExtension({
    name: 'EntityKubernetesInfoContent',
    component: {
      lazy: () => import('./components/KubernetesComponent').then(m => m.KubernetesComponent),
    },
  }),
);
