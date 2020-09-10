/**
 * Dependency Base Class
 */
import { IDependencies } from '../types';

export class Dependency {
  dependencies: IDependencies = {
    providers: {},
  };

  constructor(dependencies: IDependencies) {
    this.dependencies = dependencies;
  }
}
