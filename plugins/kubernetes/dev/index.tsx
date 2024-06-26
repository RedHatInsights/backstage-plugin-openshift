import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { KubernetesInfoPlugin, EntityKubernetesInfoContent } from '../src/plugin';

createDevApp()
  .registerPlugin(KubernetesInfoPlugin)
  .addPage({
    element: <EntityKubernetesInfoContent />,
    title: 'Root Page',
    path: '/kubernetes-deployments',
  })
  .render();
