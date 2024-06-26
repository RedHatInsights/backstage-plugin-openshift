import { KubernetesInfoPlugin } from './plugin';

describe('kubernetes', () => {
  it('should export plugin', () => {
    expect(KubernetesInfoPlugin).toBeDefined();
  });
});
