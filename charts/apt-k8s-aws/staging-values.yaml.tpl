application:
  namespace: ${namespace}

frontend:
  name: frontend
  replicaCount: 1
  image:
    repository: ${repository_url}
    tag: frontend-${environment}-latest
    pullPolicy: Always
  container:
    targetPort: 3000
  service:
    type: ClusterIP
    port: 3000
  resources:
    requests:
      memory: "128Mi"
      cpu: "200m"
    limits:
      memory: "256Mi"
      cpu: "500m"
  strategy:
    type: Recreate


backend:
  name: backend
  replicaCount: 1
  image:
    repository: ${repository_url}
    tag: backend-${environment}-latest
    pullPolicy: Always
  container:
    targetPort: 9000
  service:
    type: ClusterIP
    port: 9000
  environment:
    PRISMA_CLI_BINARY_TARGETS: linux-musl-openssl-3.0.x,rhel-openssl-3.0.x
    RABBITMQ_REQUEST_QUEUE: ${rabbitmq_request_queue}
    RABBITMQ_URL: ${rabbitmq_url}
    SECURE: ${secure}
  resources:
    requests:
      memory: "256Mi"
      cpu: "100m"
    limits:
      memory: "512Mi"
      cpu: "300m"
  strategy:
    type: Recreate

calc_module:
  name: calc-module
  replicaCount: 1
  image:
    repository: ${repository_url}
    tag: calc-module-${environment}-latest
    pullPolicy: Always
  container:
    targetPort: 5672
  service:
    type: ClusterIP
    port: 5672
  environment:
    RABBITMQ_REQUEST_QUEUE: ${rabbitmq_request_queue}
    RABBITMQ_URL: ${rabbitmq_url}
  resources:
    requests:
      memory: "128Mi"
      cpu: "400m"
    limits:
      memory: "512Mi"
      cpu: "600m"
  strategy:
    type: Recreate

rabbitmq:
  name: rabbitmq
  image:
    repository: rabbitmq
    tag: management
    pullPolicy: IfNotPresent
  service:
    type: ClusterIP
    ports:
      management: 15672
      amqp: 5672
  container:
    targetPorts:
      management: 15672
      amqp: 5672
  environment:
    RABBITMQ_REQUEST_QUEUE: simulation_request_queue
  config:
    RABBITMQ_DEFAULT_USER: guest
    RABBITMQ_DEFAULT_PASS: guest
  resources:
    requests:
      memory: "512Mi"
      cpu: "250m"
    limits:
      memory: "1024Mi"
      cpu: "600m"

ingress:
  name: ingress
  namespace: ingress-nginx
  fqdn: ${fqdn}
  ssl:
    enabled: ${secure}

secrets:
  DATABASE_URL: ${database_url}
  JWT_KEY: ${jwt_key}
  SSL_CERTIFICATE: |
    ${ssl_certificate}
  SSL_CERTIFICATE_KEY: |
    ${ssl_certificate_key}

eks:
  cluster:
    name: ${cluster_name}
    nodeGroup: ${node_group}