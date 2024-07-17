import { gql } from 'graphql-request';


export const NSQuery = gql`
query App($path: String) {
  apps_v1(path: $path) {
    namespaces {
      path
      name
      description
      cluster {
        name
        path
        jumpHost {
          hostname
        }
      }
    }
  }
}
`;