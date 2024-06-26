import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { KubernetesPlugin, EntityKubernetesContent } from '../src/plugin';

createDevApp()
  .registerPlugin(KubernetesPlugin)
  .addPage({
    element: <EntityKubernetesContent />,
    title: 'Root Page',
    path: '/kubernetes-deployments',
  })
  .render();
