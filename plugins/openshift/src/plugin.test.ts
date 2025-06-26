import { OpenshiftInfoPlugin, EntityOpenshiftInfoContent } from './plugin';

describe('openshift plugin', () => {
  it('should export plugin', () => {
    expect(OpenshiftInfoPlugin).toBeDefined();
    expect(OpenshiftInfoPlugin.getId()).toBe('openshift-deployments');
  });

  it('should export EntityOpenshiftInfoContent component extension', () => {
    expect(EntityOpenshiftInfoContent).toBeDefined();
  });

  it('should have a plugin instance', () => {
    expect(typeof OpenshiftInfoPlugin).toBe('object');
  });

  it('should be a function', () => {
    expect(typeof EntityOpenshiftInfoContent).toBe('function');
  });
});
