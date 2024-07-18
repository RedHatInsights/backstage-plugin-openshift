import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { OpenshiftInfoPlugin, EntityOpenshiftInfoContent } from '../src/plugin';

createDevApp()
  .registerPlugin(OpenshiftInfoPlugin)
  .addPage({
    element: <EntityOpenshiftInfoContent />,
    title: 'Root Page',
    path: '/openshift-deployments',
  })
  .render();
