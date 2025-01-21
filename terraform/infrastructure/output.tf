output "eks_cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = module.eks.cluster_endpoint
}

output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "eks_certificate_authority" {
  description = "EKS cluster certificate authority data"
  value       = module.eks.cluster_certificate_authority_data
}

output "alb_controller_role_arn" {
  description = "ARN role of ALB controller"
  value       = aws_iam_role.alb_controller_role.arn
}

output "eks_oidc_issuer_url" {
  value = module.eks.cluster_oidc_issuer_url
}

output "ingress_hostname" {
  description = "Public hostname or IP for the NGINX ingress"
  value       = try(
    data.kubernetes_service.nginx_ingress.status[0].load_balancer[0].ingress[0].hostname,
    "Load balancer hostname not available yet"
  )
}


###############################################################
#                     remote states                           #
###############################################################

output "repository_url" {
  description = "ECR repository URL from remote state"
  value       = data.terraform_remote_state.ecr.outputs.repository_url
}
