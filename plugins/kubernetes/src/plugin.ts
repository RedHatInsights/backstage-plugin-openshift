import {
  createPlugin,
  createComponentExtension,
} from '@backstage/core-plugin-api';

export const KubernetesPlugin = createPlugin({
  id: 'kubernetes',
});

export const EntityKubernetesContent = KubernetesPlugin.provide(
  createComponentExtension({
    name: 'EntityKubernetesContent',
    component: {
      lazy: () => import('./components/KubernetesComponent').then(m => m.KubernetesComponent),
    },
  }),
);
