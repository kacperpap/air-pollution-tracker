output "cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = module.eks.cluster_endpoint
}

output "cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

# output "ecr_repository_frontend_url" {
#   description = "URL of the Frontend ECR repository"
#   value       = aws_ecr_repository.frontend.repository_url
# }

# output "ecr_repository_backend_url" {
#   description = "URL of the Backend ECR repository"
#   value       = aws_ecr_repository.backend.repository_url
# }

# output "ecr_repository_calc_module_url" {
#   description = "URL of the Calc Module ECR repository"
#   value       = aws_ecr_repository.calc_module.repository_url
# }

output "alb_controller_role_arn" {
  description = "ARN role of ALB controller"
  value = aws_iam_role.alb_controller_role.arn
}